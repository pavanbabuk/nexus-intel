/**
 * Pure TypeScript binary EXIF parser with zero external dependencies.
 * Extracts GPS coordinates, camera telemetry, timestamps, and calculates solar angles.
 */

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  latRef: 'N' | 'S';
  lonRef: 'E' | 'W';
  formattedLat: string;
  formattedLon: string;
}

export interface CameraMetadata {
  make?: string;
  model?: string;
  lensModel?: string;
  software?: string;
  dateTime?: string;
  iso?: number;
  fNumber?: number;
  exposureTime?: string;
  focalLength?: number;
}

export interface SolarTelemetry {
  azimuthDeg: number;
  elevationDeg: number;
  approxSunDirection: string;
  estimatedTimeLocal: string;
}

export interface ImageForensicResult {
  hasExif: boolean;
  gps?: GpsCoordinates;
  camera: CameraMetadata;
  solar?: SolarTelemetry;
  fileSizeFormatted: string;
  dimensions?: { width: number; height: number };
  rawTags: Record<string, any>;
}

/**
 * Format degrees, minutes, seconds into readable string
 */
function toDms(dec: number, isLat: boolean): string {
  const dir = isLat ? (dec >= 0 ? 'N' : 'S') : (dec >= 0 ? 'E' : 'W');
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(2);
  return `${deg}° ${min}' ${sec}" ${dir}`;
}

/**
 * Approximate solar position (elevation & azimuth) from latitude, longitude and timestamp.
 */
function calculateSunPosition(lat: number, lon: number, date: Date): SolarTelemetry {
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Fractional year (radians)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);
  
  // Equation of time (minutes)
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  
  // Solar declination (radians)
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma);

  const timeOffset = eqtime + 4 * lon;
  const tMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + timeOffset;
  const trueSolarTime = (tMinutes + 1440) % 1440;
  const hourAngle = (trueSolarTime / 4 - 180) * rad;

  const latRad = lat * rad;
  const csz = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle);
  const zenith = Math.acos(Math.max(-1, Math.min(1, csz)));
  const elevation = 90 - (zenith / rad);

  const azDenom = Math.cos(latRad) * Math.sin(zenith);
  let azimuth = 180;
  if (Math.abs(azDenom) > 0.0001) {
    const azNum = Math.sin(latRad) * Math.cos(zenith) - Math.sin(decl);
    const azRad = Math.acos(Math.max(-1, Math.min(1, azNum / azDenom)));
    azimuth = (hourAngle > 0 ? (360 - azRad / rad) : (azRad / rad));
  }

  const dirs = ['North', 'NNE', 'NE', 'ENE', 'East', 'ESE', 'SE', 'SSE', 'South', 'SSW', 'SW', 'WSW', 'West', 'WNW', 'NW', 'NNW'];
  const dirIndex = Math.round(azimuth / 22.5) % 16;

  return {
    azimuthDeg: Math.round(azimuth * 10) / 10,
    elevationDeg: Math.round(elevation * 10) / 10,
    approxSunDirection: dirs[dirIndex],
    estimatedTimeLocal: date.toTimeString().split(' ')[0]
  };
}

/**
 * Main parser: accepts a File or ArrayBuffer and returns extracted forensics.
 */
export async function parseImageForensics(file: File | ArrayBuffer): Promise<ImageForensicResult> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  const fileSizeFormatted = file instanceof File ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(buffer.byteLength / 1024).toFixed(1)} KB`;
  
  const view = new DataView(buffer);
  const result: ImageForensicResult = {
    hasExif: false,
    camera: {},
    fileSizeFormatted,
    rawTags: {}
  };

  if (view.byteLength < 4) return result;

  // Check JPEG SOI (0xFFD8)
  if (view.getUint16(0, false) === 0xFFD8) {
    let offset = 2;
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      // APP1 Marker for Exif (0xFFE1)
      if (marker === 0xFFE1) {
        const length = view.getUint16(offset, false);
        offset += 2;
        
        // Exif header: "Exif\0\0"
        const header = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        );

        if (header === 'Exif') {
          parseTiff(view, offset + 6, result);
          result.hasExif = true;
          break;
        }
        offset += length - 2;
      } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFF00) {
        // Skip other markers
        const len = view.getUint16(offset, false);
        offset += len;
      } else {
        break;
      }
    }
  }

  // Calculate sun position if GPS and capture date exist
  if (result.gps) {
    let date = new Date();
    if (result.camera.dateTime) {
      // Format usually "YYYY:MM:DD HH:MM:SS"
      const parts = result.camera.dateTime.split(/[: ]/);
      if (parts.length >= 6) {
        date = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
          parseInt(parts[3]),
          parseInt(parts[4]),
          parseInt(parts[5])
        );
      }
    }
    result.solar = calculateSunPosition(result.gps.latitude, result.gps.longitude, date);
  }

  return result;
}

/**
 * TIFF Header and IFD parsing
 */
function parseTiff(view: DataView, tiffOffset: number, result: ImageForensicResult) {
  if (tiffOffset + 8 > view.byteLength) return;

  const byteOrderMarker = view.getUint16(tiffOffset, false);
  const littleEndian = byteOrderMarker === 0x4949; // "II"

  if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x002A) {
    return; // Invalid TIFF magic
  }

  const ifd0Offset = view.getUint32(tiffOffset + 4, littleEndian);
  readIfd(view, tiffOffset, tiffOffset + ifd0Offset, littleEndian, result);
}

function readIfd(
  view: DataView,
  tiffStart: number,
  offset: number,
  le: boolean,
  result: ImageForensicResult
) {
  if (offset + 2 > view.byteLength) return;
  const numEntries = view.getUint16(offset, le);
  let cur = offset + 2;

  let exifSubIfd = 0;
  let gpsSubIfd = 0;

  for (let i = 0; i < numEntries; i++) {
    if (cur + 12 > view.byteLength) break;
    const tag = view.getUint16(cur, le);
    const type = view.getUint16(cur + 2, le);
    const count = view.getUint32(cur + 4, le);
    const valOffset = cur + 8;

    const val = readTagValue(view, tiffStart, valOffset, type, count, le);

    switch (tag) {
      case 0x010F: // Make
        result.camera.make = String(val).trim();
        break;
      case 0x0110: // Model
        result.camera.model = String(val).trim();
        break;
      case 0x0131: // Software
        result.camera.software = String(val).trim();
        break;
      case 0x0132: // DateTime
        result.camera.dateTime = String(val).trim();
        break;
      case 0x8769: // Exif SubIFD
        exifSubIfd = val as number;
        break;
      case 0x8825: // GPS SubIFD
        gpsSubIfd = val as number;
        break;
      case 0x829A: // ExposureTime
        if (typeof val === 'number') result.camera.exposureTime = `1/${Math.round(1 / val)}s`;
        break;
      case 0x829D: // FNumber
        result.camera.fNumber = typeof val === 'number' ? Math.round(val * 10) / 10 : undefined;
        break;
      case 0x8827: // ISO
        result.camera.iso = typeof val === 'number' ? val : undefined;
        break;
      case 0x920A: // FocalLength
        result.camera.focalLength = typeof val === 'number' ? Math.round(val * 10) / 10 : undefined;
        break;
      case 0xA434: // LensModel
        result.camera.lensModel = String(val).trim();
        break;
    }

    result.rawTags[tag.toString(16)] = val;
    cur += 12;
  }

  // Follow Exif SubIFD
  if (exifSubIfd > 0) {
    readIfd(view, tiffStart, tiffStart + exifSubIfd, le, result);
  }

  // Follow GPS SubIFD
  if (gpsSubIfd > 0) {
    readGpsIfd(view, tiffStart, tiffStart + gpsSubIfd, le, result);
  }
}

function readGpsIfd(
  view: DataView,
  tiffStart: number,
  offset: number,
  le: boolean,
  result: ImageForensicResult
) {
  if (offset + 2 > view.byteLength) return;
  const numEntries = view.getUint16(offset, le);
  let cur = offset + 2;

  let latRef = 'N';
  let lonRef = 'E';
  let rawLat: number[] = [];
  let rawLon: number[] = [];
  let altitude: number | undefined;

  for (let i = 0; i < numEntries; i++) {
    if (cur + 12 > view.byteLength) break;
    const tag = view.getUint16(cur, le);
    const type = view.getUint16(cur + 2, le);
    const count = view.getUint32(cur + 4, le);
    const valOffset = cur + 8;

    const val = readTagValue(view, tiffStart, valOffset, type, count, le);

    switch (tag) {
      case 0x0001: // GPSLatitudeRef
        latRef = String(val).trim().toUpperCase() || 'N';
        break;
      case 0x0002: // GPSLatitude (3 rationals)
        if (Array.isArray(val)) rawLat = val;
        break;
      case 0x0003: // GPSLongitudeRef
        lonRef = String(val).trim().toUpperCase() || 'E';
        break;
      case 0x0004: // GPSLongitude (3 rationals)
        if (Array.isArray(val)) rawLon = val;
        break;
      case 0x0006: // GPSAltitude
        if (typeof val === 'number') altitude = Math.round(val);
        break;
    }
    cur += 12;
  }

  if (rawLat.length >= 3 && rawLon.length >= 3) {
    const lat = rawLat[0] + rawLat[1] / 60 + rawLat[2] / 3600;
    const lon = rawLon[0] + rawLon[1] / 60 + rawLon[2] / 3600;

    const finalLat = (latRef === 'S' ? -1 : 1) * lat;
    const finalLon = (lonRef === 'W' ? -1 : 1) * lon;

    result.gps = {
      latitude: Math.round(finalLat * 1000000) / 1000000,
      longitude: Math.round(finalLon * 1000000) / 1000000,
      altitude,
      latRef: latRef === 'S' ? 'S' : 'N',
      lonRef: lonRef === 'W' ? 'W' : 'E',
      formattedLat: toDms(finalLat, true),
      formattedLon: toDms(finalLon, false)
    };
  }
}

function readTagValue(
  view: DataView,
  tiffStart: number,
  valOffset: number,
  type: number,
  count: number,
  le: boolean
): any {
  // Types: 1=BYTE, 2=ASCII, 3=SHORT, 4=LONG, 5=RATIONAL, 7=UNDEFINED, 9=SLONG, 10=SRATIONAL
  const typeSizes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8];
  const size = typeSizes[type] || 1;
  const totalBytes = size * count;

  let dataOffset = valOffset;
  if (totalBytes > 4) {
    dataOffset = tiffStart + view.getUint32(valOffset, le);
  }

  if (dataOffset + totalBytes > view.byteLength) return null;

  if (type === 2) {
    // ASCII string
    let str = '';
    for (let i = 0; i < count; i++) {
      const charCode = view.getUint8(dataOffset + i);
      if (charCode === 0) break;
      str += String.fromCharCode(charCode);
    }
    return str;
  } else if (type === 3) {
    // SHORT
    return view.getUint16(dataOffset, le);
  } else if (type === 4) {
    // LONG
    return view.getUint32(dataOffset, le);
  } else if (type === 5) {
    // RATIONAL (numerator/denominator)
    if (count === 1) {
      const num = view.getUint32(dataOffset, le);
      const den = view.getUint32(dataOffset + 4, le);
      return den !== 0 ? num / den : 0;
    } else {
      const arr: number[] = [];
      for (let i = 0; i < count; i++) {
        const num = view.getUint32(dataOffset + i * 8, le);
        const den = view.getUint32(dataOffset + i * 8 + 4, le);
        arr.push(den !== 0 ? num / den : 0);
      }
      return arr;
    }
  }
  return null;
}

/**
 * Strips all EXIF metadata from a file, returning a sanitized Blob for safe sharing.
 */
export async function stripExifMetadata(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob || file);
        }, 'image/jpeg', 0.95);
      } else {
        URL.revokeObjectURL(url);
        resolve(file);
      }
    };
    img.src = url;
  });
}
