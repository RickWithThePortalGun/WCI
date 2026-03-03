'use client';

import { useEffect, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import type { ConflictZone } from '@/lib/types';
import { CONFLICT_ZONES, SEVERITY_COLORS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const hexToRgba = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const a = parseInt(hex.slice(7, 9) || 'ff', 16) / 255;
  return `rgba(${r},${g},${b},${a.toFixed(2)})`;
};

const ARCS = [
  { startLat: 48.3794, startLng: 31.1656, endLat: 38.9072, endLng: -77.0369, color: hexToRgba('#44aaff80') },
  { startLat: 31.35, startLng: 34.3, endLat: 38.9072, endLng: -77.0369, color: hexToRgba('#ff440080') },
  { startLat: 31.35, startLng: 34.3, endLat: 35.6762, endLng: 139.6503, color: hexToRgba('#ffaa0080') },
  { startLat: 48.3794, startLng: 31.1656, endLat: 51.5074, endLng: -0.1278, color: hexToRgba('#44aaff40') },
  { startLat: 31.35, startLng: 34.3, endLat: 25.2048, endLng: 55.2708, color: hexToRgba('#ff880060') },
  { startLat: 23.5, startLng: 120.96, endLat: 38.9072, endLng: -77.0369, color: hexToRgba('#ffcc0080') },
  { startLat: 15.5, startLng: 32.5, endLat: 24.6877, endLng: 46.7219, color: hexToRgba('#ff660060') },
  { startLat: -1.5, startLng: 29.5, endLat: 48.8566, endLng: 2.3522, color: hexToRgba('#ff440040') },
];

interface Props {
  width: number;
  height: number;
  onSelectZone?: (zone: ConflictZone | null) => void;
  selectedZone?: ConflictZone | null;
}

export default function GlobeClient({ width, height, onSelectZone, selectedZone }: Props) {
  const globeRef = useRef<any>(null);

  useEffect(() => {
    const applyRotation = () => {
      const controls = globeRef.current?.controls?.();
      if (!controls) return false;
      controls.autoRotate = !selectedZone;
      controls.autoRotateSpeed = 0.35;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      return true;
    };

    if (!applyRotation()) {
      const t1 = setTimeout(applyRotation, 300);
      const t2 = setTimeout(applyRotation, 900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [selectedZone]);

  useEffect(() => {
    if (selectedZone) {
      globeRef.current?.pointOfView(
        { lat: selectedZone.lat, lng: selectedZone.lng, altitude: 1.8 },
        1200
      );
    }
  }, [selectedZone]);

  const handlePointClick = useCallback((point: object) => {
    const zone = point as ConflictZone;
    onSelectZone?.(selectedZone?.name === zone.name ? null : zone);
  }, [onSelectZone, selectedZone]);

  const handleGlobeReady = useCallback(() => {
    const controls = globeRef.current?.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    }
  }, []);

  return (
    <>
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor="rgba(3,8,5,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#1a4a2a"
        atmosphereAltitude={0.12}
        onGlobeReady={handleGlobeReady}
        pointsData={CONFLICT_ZONES}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(d: object) => ((d as ConflictZone).severity / 10) * 0.06}
        pointRadius={(d: object) => 0.6 + ((d as ConflictZone).severity / 10) * 1.2}
        pointColor={(d: object) => SEVERITY_COLORS((d as ConflictZone).severity)}
        pointLabel={(d: object) => {
          const z = d as ConflictZone;
          return `<div style="background:#060f07;border:1px solid #1a3a1a;padding:8px 12px;border-radius:4px;font-family:monospace;font-size:11px;max-width:200px">
            <div style="color:#ff6600;font-weight:bold;margin-bottom:4px">${z.name}</div>
            <div style="color:#5a8a6a">Severity: <span style="color:${SEVERITY_COLORS(z.severity)}">${z.severity}/10</span></div>
            <div style="color:#5a8a6a">Type: ${z.type}</div>
            <div style="color:#4a7a5a;margin-top:4px;font-size:10px">${z.description.slice(0, 80)}…</div>
          </div>`;
        }}
        onPointClick={handlePointClick}
        ringsData={CONFLICT_ZONES.filter(z => z.severity >= 8)}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => '#ff220033'}
        ringMaxRadius={(d: object) => ((d as ConflictZone).severity / 10) * 3}
        ringPropagationSpeed={0.8}
        ringRepeatPeriod={1500}
        arcsData={ARCS}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.3}
        arcDashAnimateTime={2500}
        arcStroke={0.5}
        arcAltitude={0.3}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[#060f07cc] border border-[#1a3a1a] rounded p-3 text-[9px] font-mono space-y-1.5 backdrop-blur-sm pointer-events-none">
        <div className="text-[#3a6a4a] tracking-widest mb-2">SEVERITY SCALE</div>
        {[
          { label: 'CRITICAL (9-10)', color: '#ff0000' },
          { label: 'HIGH (7.5-9)',    color: '#ff4400' },
          { label: 'ELEVATED (6-7.5)', color: '#ff8800' },
          { label: 'MODERATE (<6)',   color: '#ffcc00' },
        ].map(i => (
          <div key={i.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: i.color, boxShadow: `0 0 4px ${i.color}` }} />
            <span style={{ color: i.color }}>{i.label}</span>
          </div>
        ))}
        <div className="border-t border-[#1a3a1a] pt-1.5 mt-1 flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[#44aaff]" style={{ opacity: 0.6 }} />
          <span className="text-[#44aaff]">News flow arcs</span>
        </div>
      </div>

      {/* Selected zone panel */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 bg-[#060f07ee] border border-[#1a3a1a] rounded p-4 w-72 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] font-mono text-[#3a6a4a] tracking-widest mb-1">CONFLICT ZONE</div>
                <div className="font-bold text-[#ff6600] font-mono text-sm leading-tight">{selectedZone.name}</div>
              </div>
              <button onClick={() => onSelectZone?.(null)} className="text-[#3a6a4a] hover:text-[#8aaa8a] text-lg leading-none">×</button>
            </div>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-[#3a6a4a]">Severity</span>
                <span style={{ color: SEVERITY_COLORS(selectedZone.severity) }} className="font-bold">{selectedZone.severity}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3a6a4a]">Type</span>
                <span className="text-[#8aaa8a] uppercase">{selectedZone.type}</span>
              </div>
              {selectedZone.casualties && (
                <div className="flex justify-between">
                  <span className="text-[#3a6a4a]">Casualties</span>
                  <span className="text-[#ff8844]">{selectedZone.casualties}</span>
                </div>
              )}
              {selectedZone.startDate && (
                <div className="flex justify-between">
                  <span className="text-[#3a6a4a]">Since</span>
                  <span className="text-[#5a8a6a]">{selectedZone.startDate}</span>
                </div>
              )}
              <div className="border-t border-[#1a3a1a] pt-2">
                <div className="text-[#3a6a4a] mb-1">FACTIONS</div>
                <div className="text-[#8aaa8a]">{selectedZone.factions.join(' vs ')}</div>
              </div>
              <div>
                <div className="text-[#3a6a4a] mb-1">DESCRIPTION</div>
                <div className="text-[#5a8a6a] leading-relaxed">{selectedZone.description}</div>
              </div>
              <div>
                <div className="text-[#3a6a4a] mb-1">RELATED</div>
                <div className="flex flex-wrap gap-1">
                  {selectedZone.relatedCountries.map(c => (
                    <span key={c} className="px-1.5 py-0.5 bg-[#0a1a0c] border border-[#1a3a1a] text-[9px] text-[#5a8a6a] rounded">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
