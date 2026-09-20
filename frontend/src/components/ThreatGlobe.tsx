import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe, RefreshCw } from 'lucide-react';
import { EntityNode, EntityEdge } from '../types';
import { audioTelemetry } from '../utils/audioTelemetry';

interface ThreatGlobeProps {
  nodes: EntityNode[];
  edges?: EntityEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: EntityNode | null) => void;
}

interface GeoPoint {
  node: EntityNode;
  lat: number;
  lon: number;
  isOriginLeak: boolean;
  position: THREE.Vector3;
}

export const ThreatGlobe: React.FC<ThreatGlobeProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<GeoPoint | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Extract geolocated nodes
  const geoPoints: GeoPoint[] = React.useMemo(() => {
    const points: GeoPoint[] = [];
    const radius = 5.0;

    nodes.forEach((node) => {
      let lat = node.properties?.latitude;
      let lon = node.properties?.longitude;

      // Fallback deterministic coordinates based on ASN or City/Country if coordinates not exact
      if (lat === undefined || lon === undefined) {
        if (node.type === 'ip' || node.type === 'origin_ip') {
          const hash = node.value.split('.').reduce((acc, part) => acc * 31 + parseInt(part || '0', 10), 0);
          // Scatter across major data center latitudes/longitudes
          const latCenters = [50.1109, 37.7749, 52.5200, 1.3521, 35.6762, 51.5074, 38.9072];
          const lonCenters = [8.6821, -122.4194, 13.4050, 103.8198, 139.6503, -0.1278, -77.0369];
          const idx = Math.abs(hash) % latCenters.length;
          lat = latCenters[idx] + ((hash % 10) * 0.5);
          lon = lonCenters[idx] + (((hash >> 3) % 10) * 0.5);
        } else {
          return;
        }
      }

      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);

      const isOriginLeak = node.type === 'origin_ip' || !!node.properties?.is_origin_leak;

      points.push({
        node,
        lat,
        lon,
        isOriginLeak,
        position: new THREE.Vector3(x, y, z)
      });
    });

    return points;
  }, [nodes]);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Earth Sphere Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Dark Base Sphere
    const sphereRadius = 5.0;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x050a14,
      transparent: true,
      opacity: 0.95
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(sphere);

    // 2. Wireframe Grid / Parallels & Meridians
    const wireframeGeo = new THREE.SphereGeometry(sphereRadius * 1.002, 36, 18);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const wireframe = new THREE.Mesh(wireframeGeo, wireframeMat);
    globeGroup.add(wireframe);

    // 3. Glowing Atmosphere Halo Rim
    const haloGeo = new THREE.SphereGeometry(sphereRadius * 1.05, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.0, 0.85, 1.0, 1.0) * intensity * 0.45;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(halo);

    // 4. Geospatial Target Pins & Extruded Neon Pillars
    const pinGroup = new THREE.Group();
    globeGroup.add(pinGroup);

    const interactiveMeshes: THREE.Mesh[] = [];

    geoPoints.forEach(pt => {
      const pinHeight = pt.isOriginLeak ? 1.5 : 0.8;
      const pinColor = pt.isOriginLeak ? 0xef4444 : 0x00f2fe;

      // Cylinder pillar pointing outward normal to the sphere
      const cylGeo = new THREE.CylinderGeometry(0.04, 0.04, pinHeight, 8);
      cylGeo.translate(0, pinHeight / 2, 0);

      const cylMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.85
      });
      const cylinder = new THREE.Mesh(cylGeo, cylMat);

      // Align cylinder with normal vector from center to point
      const normal = pt.position.clone().normalize();
      cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      cylinder.position.copy(pt.position);

      // Top beacon sphere with dynamic selection glow
      const isSelected = selectedNodeId === pt.node.id;
      const beaconRadius = isSelected ? 0.2 : (pt.isOriginLeak ? 0.14 : 0.09);
      const beaconGeo = new THREE.SphereGeometry(beaconRadius, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xffffff : (pt.isOriginLeak ? 0xff4444 : 0x34d399)
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(pt.position.clone().add(normal.clone().multiplyScalar(pinHeight)));

      // Store reference on mesh userData for Raycaster picking
      beacon.userData = { geoPoint: pt };
      interactiveMeshes.push(beacon);

      pinGroup.add(cylinder);
      pinGroup.add(beacon);
    });

    // 5. Connecting Cyber Arcs (Undersea & Satellite Route hops)
    if (geoPoints.length > 1) {
      for (let i = 0; i < geoPoints.length - 1; i++) {
        const start = geoPoints[i].position;
        const end = geoPoints[i + 1].position;

        // Middle control point lifted outwards from sphere for bezier curve arc
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const distance = start.distanceTo(end);
        const elevation = sphereRadius + (distance * 0.35);
        mid.normalize().multiplyScalar(elevation);

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const points = curve.getPoints(36);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(points);

        const arcMat = new THREE.LineBasicMaterial({
          color: geoPoints[i + 1].isOriginLeak ? 0xef4444 : 0x06b6d4,
          transparent: true,
          opacity: 0.45
        });

        const arcLine = new THREE.Line(arcGeo, arcMat);
        globeGroup.add(arcLine);
      }
    }

    // Interactive Drag Controls & Raycasting
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        globeGroup.rotation.y += deltaX * 0.006;
        globeGroup.rotation.x += deltaY * 0.006;

        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        // Raycast for hover
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes);

        if (intersects.length > 0) {
          const pt = intersects[0].object.userData.geoPoint as GeoPoint;
          setHoveredPoint(pt);
          container.style.cursor = 'pointer';
        } else {
          setHoveredPoint(null);
          container.style.cursor = 'grab';
        }
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        const pt = intersects[0].object.userData.geoPoint as GeoPoint;
        if (pt.isOriginLeak) {
          audioTelemetry.playWarning();
        } else {
          audioTelemetry.playBlip(1250);
        }
        onSelectNode(pt.node);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.01, 8.0, 24.0);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        globeGroup.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [geoPoints, autoRotate, onSelectNode]);

  return (
    <div className="relative w-full h-full bg-[#040711] overflow-hidden select-none font-mono">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="bg-slate-950/85 border border-cyan-500/40 rounded-xl p-3 backdrop-blur-md text-xs space-y-1.5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold tracking-wider">
            <Globe className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
            <span>3D THREAT GLOBE // GEOSPATIAL MATRIX</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>TRACKED IPS: <strong className="text-cyan-300">{geoPoints.length}</strong></span>
            <span>LEAKS: <strong className="text-red-400">{geoPoints.filter(p => p.isOriginLeak).length}</strong></span>
          </div>
        </div>

        {/* Hover Readout Tooltip */}
        {hoveredPoint && (
          <div className="bg-slate-950/95 border border-cyan-400/60 rounded-lg p-2.5 backdrop-blur text-xs space-y-1 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-in fade-in">
            <div className="flex justify-between items-center text-cyan-300 font-bold">
              <span>{hoveredPoint.node.label}</span>
              {hoveredPoint.isOriginLeak && (
                <span className="text-[10px] px-1.5 py-0.2 bg-red-950 border border-red-500 text-red-300 rounded font-bold">
                  ORIGIN LEAK
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              <span>GEO: {hoveredPoint.lat.toFixed(2)}°, {hoveredPoint.lon.toFixed(2)}°</span>
              {hoveredPoint.node.properties?.asn && (
                <span className="block text-slate-300">ASN: {hoveredPoint.node.properties.asn}</span>
              )}
              {hoveredPoint.node.properties?.city && (
                <span className="block text-slate-300">LOCATION: {hoveredPoint.node.properties.city}, {hoveredPoint.node.properties?.country}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Globe Controls Bar */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg p-1.5 backdrop-blur text-xs text-slate-400">
        <button
          onClick={() => {
            setAutoRotate(!autoRotate);
            audioTelemetry.playKeyClick();
          }}
          className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors ${
            autoRotate ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300' : 'hover:bg-slate-800 text-slate-400'
          }`}
          title="Toggle Auto-Rotation"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          <span>ORBIT {autoRotate ? 'ON' : 'PAUSED'}</span>
        </button>

        <span className="text-slate-600">|</span>
        <span className="text-[10px] text-slate-500 px-1">Drag to rotate • Scroll to zoom • Click pin to inspect</span>
      </div>
    </div>
  );
};
