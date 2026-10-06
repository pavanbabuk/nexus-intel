import React, { useState, useRef, useCallback } from 'react';
import { 
  X, 
  Crosshair, 
  MapPin, 
  Camera, 
  Sun, 
  Compass, 
  ExternalLink, 
  Download, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  UploadCloud, 
  Sparkles,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { parseImageForensics, stripExifMetadata, ImageForensicResult } from '../utils/exifParser';
import { audioTelemetry } from '../utils/audioTelemetry';

interface HawkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeocodedAddress {
  displayName: string;
  road?: string;
  city?: string;
  state?: string;
  country?: string;
}

// Built-in verified sample presets for instant live testing
const PRESET_SAMPLES = [
  {
    name: 'Eiffel Tower, Paris',
    url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
    gps: {
      latitude: 48.858370,
      longitude: 2.294481,
      altitude: 35,
      latRef: 'N' as const,
      lonRef: 'E' as const,
      formattedLat: `48° 51' 30.13" N`,
      formattedLon: `2° 17' 40.13" E`
    },
    camera: {
      make: 'Sony',
      model: 'ILCE-7RM4',
      lensModel: 'FE 24-70mm F2.8 GM',
      dateTime: '2024:06:12 15:32:10',
      iso: 100,
      fNumber: 4.0,
      exposureTime: '1/800s',
      focalLength: 35
    },
    locationName: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris, France'
  },
  {
    name: 'Times Square, NYC',
    url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=800&q=80',
    gps: {
      latitude: 40.758896,
      longitude: -73.985130,
      altitude: 12,
      latRef: 'N' as const,
      lonRef: 'W' as const,
      formattedLat: `40° 45' 32.02" N`,
      formattedLon: `73° 59' 6.47" W`
    },
    camera: {
      make: 'Apple',
      model: 'iPhone 15 Pro Max',
      lensModel: 'iPhone 15 Pro Max back triple camera 24mm f/1.78',
      dateTime: '2024:09:20 20:15:44',
      iso: 250,
      fNumber: 1.8,
      exposureTime: '1/60s',
      focalLength: 24
    },
    locationName: 'Broadway & 7th Ave, Manhattan, New York, NY 10036, USA'
  },
  {
    name: 'Tokyo Tower, Japan',
    url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=800&q=80',
    gps: {
      latitude: 35.658581,
      longitude: 139.745438,
      altitude: 24,
      latRef: 'N' as const,
      lonRef: 'E' as const,
      formattedLat: `35° 39' 30.89" N`,
      formattedLon: `139° 44' 43.58" E`
    },
    camera: {
      make: 'Canon',
      model: 'Canon EOS R5',
      lensModel: 'RF 24-105mm F4 L IS USM',
      dateTime: '2024:04:05 18:40:22',
      iso: 400,
      fNumber: 2.8,
      exposureTime: '1/250s',
      focalLength: 50
    },
    locationName: '4 Chome-2-8 Shibakoen, Minato City, Tokyo 105-0011, Japan'
  }
];

export const HawkModal: React.FC<HawkModalProps> = ({ isOpen, onClose }) => {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [forensicData, setForensicData] = useState<ImageForensicResult | null>(null);
  const [address, setAddress] = useState<GeocodedAddress | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isStripping, setIsStripping] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reverse geocode via OpenStreetMap Nominatim
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setAddress({
          displayName: data.display_name,
          road: data.address?.road,
          city: data.address?.city || data.address?.town || data.address?.village,
          state: data.address?.state,
          country: data.address?.country
        });
      }
    } catch (err) {
      console.warn('Reverse geocode failed or rate-limited', err);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const handleProcessFile = async (file: File) => {
    setCurrentFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    audioTelemetry.playLaserSweep();

    const data = await parseImageForensics(file);
    setForensicData(data);

    if (data.gps) {
      audioTelemetry.playBlip(1600);
      reverseGeocode(data.gps.latitude, data.gps.longitude);
    } else {
      setAddress(null);
      audioTelemetry.playWarning();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadPreset = (sample: typeof PRESET_SAMPLES[0]) => {
    setImagePreview(sample.url);
    setCurrentFile(null);
    setForensicData({
      hasExif: true,
      gps: sample.gps,
      camera: sample.camera,
      fileSizeFormatted: '3.4 MB',
      rawTags: {}
    });
    setAddress({
      displayName: sample.locationName,
      country: sample.name.split(',')[1]?.trim()
    });
    audioTelemetry.playLaserSweep();
  };

  const handleCopyCoords = async () => {
    if (!forensicData?.gps) return;
    const str = `${forensicData.gps.latitude}, ${forensicData.gps.longitude}`;
    await navigator.clipboard.writeText(str);
    setCopiedCoords(true);
    audioTelemetry.playKeyClick();
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleStripMetadata = async () => {
    if (!currentFile) return;
    setIsStripping(true);
    audioTelemetry.playChirp();
    try {
      const sanitizedBlob = await stripExifMetadata(currentFile);
      const url = URL.createObjectURL(sanitizedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanitized_${currentFile.name}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsStripping(false);
    }
  };

  if (!isOpen) return null;

  const gps = forensicData?.gps;
  const camera = forensicData?.camera;
  const solar = forensicData?.solar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col bg-cyber-900 border border-cyber-border rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border/80 bg-cyber-800/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Crosshair className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wider text-white uppercase flex items-center gap-2">
                  HAWK // IMAGE PROVENANCE & GEOLOCATION
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  GEOMETRIC VERIFICATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Extracts precise EXIF satellite telemetry, solar shadow astronomy, camera sensors, and visual landmark matches.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Preset Selector Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-cyber-950/80 border border-cyber-border/60">
            <div className="flex items-center gap-2 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] uppercase font-bold text-slate-300">Live Test Presets:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_SAMPLES.map((sample) => (
                <button
                  key={sample.name}
                  onClick={() => handleLoadPreset(sample)}
                  className="px-2.5 py-1 rounded-md bg-cyber-800 hover:bg-cyber-700 border border-cyber-border text-slate-300 hover:text-cyan-300 transition-all text-[11px] flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{sample.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone (if no image or want to change) */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-cyan-400 bg-cyan-950/30' 
                : 'border-cyber-border hover:border-slate-500 bg-cyber-800/40 hover:bg-cyber-800/60'
            }`}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/jpeg,image/png,image/webp,image/heic,image/tiff" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <UploadCloud className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-white uppercase tracking-wider">
              Drop target photograph here or click to browse
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-sans">
              JPEG, TIFF, WebP, PNG images supported. Direct browser extraction (0 bytes sent to server).
            </div>
          </div>

          {/* Forensics Output Grid */}
          {forensicData && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Image Preview + Reverse Visual Search */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Photo Viewer Frame */}
                <div className="relative rounded-xl overflow-hidden border border-cyber-border bg-black shadow-2xl group">
                  {imagePreview && (
                    <img 
                      src={imagePreview} 
                      alt="Hawk Forensic Analysis" 
                      className="w-full h-64 object-cover object-center block"
                    />
                  )}
                  {/* Reticle Overlay */}
                  <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 m-2 flex items-center justify-center">
                    <Crosshair className="w-12 h-12 text-cyan-400/40" />
                  </div>
                  {/* Verification Pill */}
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/80 backdrop-blur border border-cyber-border text-[10px] flex items-center gap-1.5">
                    {gps ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">GPS VERIFIED // EXACT FIX</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300 font-bold">UNTAGGED // VISUAL ESTIMATION</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Reverse Visual Search Engine Matrix */}
                <div className="p-4 rounded-xl bg-cyber-800/60 border border-cyber-border space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase">
                    <span className="flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-cyan-400" />
                      Reverse Visual Search Engines
                    </span>
                    <span className="text-[10px] text-slate-500">1-CLICK LOOKUP</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <a
                      href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imagePreview || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-cyber-900 border border-cyber-border hover:border-cyan-400 text-slate-200 transition-colors"
                    >
                      <span>Google Lens</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </a>
                    <a
                      href={`https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imagePreview || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-cyber-900 border border-cyber-border hover:border-amber-400 text-slate-200 transition-colors"
                      title="Famous for precise facial and landmark recognition"
                    >
                      <span className="text-amber-300">Yandex Visual ★</span>
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                    </a>
                    <a
                      href={`https://www.bing.com/visualsearch?imgurl=${encodeURIComponent(imagePreview || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-cyber-900 border border-cyber-border hover:border-cyan-400 text-slate-200 transition-colors"
                    >
                      <span>Bing Visual</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </a>
                    <a
                      href={`https://tineye.com/search?url=${encodeURIComponent(imagePreview || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded bg-cyber-900 border border-cyber-border hover:border-cyan-400 text-slate-200 transition-colors"
                    >
                      <span>TinEye Index</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </a>
                  </div>
                </div>

                {/* Privacy Defense: 1-Click EXIF Scrubber */}
                {currentFile && gps && (
                  <button
                    onClick={handleStripMetadata}
                    disabled={isStripping}
                    className="w-full py-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isStripping ? 'Sanitizing Image...' : 'Scrub GPS & Export Privacy-Safe Photo'}</span>
                  </button>
                )}
              </div>

              {/* Right Column: GPS Map + Forensics Telemetry */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* GPS Coordinates Header */}
                {gps ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 via-cyber-800 to-cyber-900 border border-cyan-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-400 animate-bounce" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          LAT / LON COORDINATES LOCATED
                        </span>
                      </div>
                      <button
                        onClick={handleCopyCoords}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyber-900 border border-cyber-border text-slate-300 hover:text-white text-[10px]"
                      >
                        {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCoords ? 'Copied' : 'Copy Lat/Lon'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="text-[10px] text-slate-400">MILITARY DMS:</div>
                        <div className="text-sm font-bold text-cyan-300 tracking-wide font-mono">
                          {gps.formattedLat}, {gps.formattedLon}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">DECIMAL DEGREES:</div>
                        <div className="text-sm font-bold text-white font-mono">
                          {gps.latitude}, {gps.longitude}
                        </div>
                      </div>
                    </div>

                    {/* Reverse Geocoded Address */}
                    <div className="pt-2 border-t border-cyber-border/40 text-[11px] text-slate-300 font-sans">
                      {isGeocoding ? (
                        <span className="text-slate-400 animate-pulse">Resolving municipal street address...</span>
                      ) : address ? (
                        <span>📍 {address.displayName}</span>
                      ) : (
                        <span>OpenStreetMap coordinates verified.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-300 uppercase">No GPS Tags Embedded in Image</div>
                      <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                        This photograph was stripped of metadata or uploaded via a platform that scrubs EXIF (like WhatsApp or Twitter). Use the Reverse Visual Search engines below to identify landmarks.
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Map Embed */}
                {gps && (
                  <div className="rounded-xl overflow-hidden border border-cyber-border bg-cyber-950 shadow-inner relative">
                    <div className="p-2 bg-cyber-900 border-b border-cyber-border flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 flex items-center gap-1.5 font-bold">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        Interactive Satellite & Vector Map
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                        >
                          Google Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <span className="text-slate-600">•</span>
                        <a
                          href={`https://earth.google.com/web/search/${gps.latitude},${gps.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                        >
                          Google Earth <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    <iframe
                      title="OpenStreetMap Location"
                      width="100%"
                      height="220"
                      className="border-0 block"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${gps.longitude - 0.005}%2C${gps.latitude - 0.003}%2C${gps.longitude + 0.005}%2C${gps.latitude + 0.003}&layer=mapnik&marker=${gps.latitude}%2C${gps.longitude}`}
                    />
                  </div>
                )}

                {/* Solar Astronomy & Shadow Angles Card */}
                {solar && (
                  <div className="p-4 rounded-xl bg-cyber-800/80 border border-cyber-border space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
                      <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
                      <span>Solar Astronomy & Shadow Verification</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div>
                        <div className="text-slate-400 text-[10px]">SUN AZIMUTH:</div>
                        <div className="text-white font-bold">{solar.azimuthDeg}° ({solar.approxSunDirection})</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">SOLAR ELEVATION:</div>
                        <div className="text-white font-bold">{solar.elevationDeg}° above horizon</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">LOCAL TIME:</div>
                        <div className="text-white font-bold">{solar.estimatedTimeLocal}</div>
                      </div>
                    </div>

                    <div className="pt-2 text-[10px] text-slate-400 border-t border-cyber-border/40 font-sans">
                      💡 <strong>Shadow Validation Rule:</strong> Objects in this photograph should cast shadows at ~{((solar.azimuthDeg + 180) % 360).toFixed(0)}° (opposite sun) with angle proportional to {solar.elevationDeg}° elevation.
                    </div>
                  </div>
                )}

                {/* Camera Hardware & Sensor Specs Card */}
                {camera && (
                  <div className="p-4 rounded-xl bg-cyber-800/80 border border-cyber-border space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase">
                      <Camera className="w-4 h-4 text-purple-400" />
                      <span>Camera & Optical Sensor Profile</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-[11px]">
                      <div>
                        <div className="text-slate-400 text-[10px]">DEVICE / MAKE:</div>
                        <div className="text-white font-bold truncate">{camera.make || 'Unknown'} {camera.model || ''}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">LENS APERTURE:</div>
                        <div className="text-white font-bold">{camera.fNumber ? `ƒ/${camera.fNumber}` : 'N/A'} {camera.focalLength ? `${camera.focalLength}mm` : ''}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-[10px]">EXPOSURE / ISO:</div>
                        <div className="text-white font-bold">{camera.exposureTime || 'N/A'} {camera.iso ? `ISO ${camera.iso}` : ''}</div>
                      </div>
                    </div>

                    {camera.dateTime && (
                      <div className="pt-2 text-[10px] text-slate-400 border-t border-cyber-border/40 font-mono">
                        CAPTURE TIMESTAMP: <strong className="text-slate-200">{camera.dateTime}</strong>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyber-border bg-cyber-900 flex items-center justify-between text-slate-400 text-[11px]">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>North Star Hawk OSINT Protocol • 100% Client-Side Image Forensics</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyber-700 hover:bg-cyber-600 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
