'use client';

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Vector3 } from 'three';
import Globe from 'react-globe.gl';
import type { ConflictZone, MilitaryAircraft, NuclearFacility, NavalVessel, GlobeHtmlLayer, TrailPoint } from '@/lib/types';
import { CONFLICT_ZONES, SEVERITY_COLORS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

// Matches three-globe's internal GLOBE_RADIUS and polar2Cartesian exactly
const GLOBE_RADIUS = 100;

function itemToWorld(lat: number, lng: number, alt: number): Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (90 - lng) * (Math.PI / 180);
  const r     = GLOBE_RADIUS * (1 + alt);
  const sinP  = Math.sin(phi);
  return new Vector3(r * sinP * Math.cos(theta), r * Math.cos(phi), r * sinP * Math.sin(theta));
}

function itemAlt(item: GlobeHtmlLayer): number {
  if (item.layerType === 'trail')    return item.altGlobe;
  if (item.layerType === 'aircraft') return Math.max(0.001, (item.altitude / 13000) * 0.08);
  return 0.002;
}

function itemId(item: GlobeHtmlLayer): string {
  if (item.layerType === 'trail')    return '';
  if (item.layerType === 'aircraft') return `ac_${item.icao24}`;
  return `${item.layerType}_${item.lat}_${item.lng}`;
}

// Geodesic offset — moves a point backwards along an aircraft's heading
const D2R = Math.PI / 180;
function trailCoords(lat: number, lng: number, headingDeg: number, i: number) {
  const bearing = ((headingDeg + 180) % 360) * D2R;
  const dist    = 0.6 * i * D2R; // ~0.6° (~66 km) per step
  const lat1    = lat * D2R;
  const lng1    = lng * D2R;
  const lat2    = Math.asin(
    Math.sin(lat1) * Math.cos(dist) + Math.cos(lat1) * Math.sin(dist) * Math.cos(bearing),
  );
  const lng2    = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(dist) * Math.cos(lat1),
    Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2),
  );
  return { lat: lat2 / D2R, lng: lng2 / D2R };
}

const row = (label: string, val: string, vc = '#8aaa8a') =>
  `<div style="display:flex;justify-content:space-between;gap:12px;"><span style="color:#3a6a4a;">${label}</span><span style="color:${vc};text-align:right;">${val}</span></div>`;

function buildTooltip(item: GlobeHtmlLayer, nucColors: Record<string, string>): { html: string; color: string } {
  if (item.layerType === 'aircraft') {
    const altFt = Math.round(item.altitude * 3.28084).toLocaleString();
    const spdKt = Math.round(item.velocity * 1.94384);
    return { color: '#44aaff', html:
      `<div style="color:#44aaff;font-weight:bold;margin-bottom:5px;">${item.callsign || item.icao24}</div>` +
      row('Country', item.country) + row('Altitude', `${altFt} ft`) +
      row('Speed', `${spdKt} kt`) + row('Heading', `${Math.round(item.heading)}°`) };
  }
  if (item.layerType === 'nuclear') {
    const color = nucColors[item.status];
    return { color, html:
      `<div style="color:${color};font-weight:bold;margin-bottom:5px;">${item.name}</div>` +
      row('Country', item.country) + row('Type', item.type.replace('-', ' ').toUpperCase()) +
      row('Status', item.status.replace('-', ' ').toUpperCase(), color) +
      (item.warheads ? row('Warheads', `~${item.warheads.toLocaleString()}`, '#ff8844') : '') +
      (item.notes ? `<div style="color:#4a7a5a;margin-top:5px;font-size:9px;max-width:180px;line-height:1.4;">${item.notes}</div>` : '') };
  }
  if (item.layerType === 'naval') {
    return { color: '#44aaff', html:
      `<div style="color:#44aaff;font-weight:bold;margin-bottom:5px;">${item.name}</div>` +
      row('Country', item.country) + row('Type', item.type.toUpperCase()) + row('Class', item.class) +
      `<div style="color:#4a7a5a;margin-top:5px;font-size:9px;max-width:180px;line-height:1.4;">${item.status}</div>` };
  }
  return { color: '#44aaff', html: '' }; // trail — never called
}

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

const NUCLEAR_COLOR: Record<NuclearFacility['status'], string> = {
  'operational':        '#ff4400',
  'under-construction': '#ffcc00',
  'decommissioned':     '#3a6a4a',
  'alleged':            '#ff8800',
};

interface Props {
  width: number;
  height: number;
  onSelectZone?: (zone: ConflictZone | null) => void;
  selectedZone?: ConflictZone | null;
  aircraft: MilitaryAircraft[];
  nuclearFacilities: NuclearFacility[];
  navalVessels: NavalVessel[];
  showAircraft: boolean;
  showNuclear: boolean;
  showNaval: boolean;
  onToggleAircraft: () => void;
  onToggleNuclear: () => void;
  onToggleNaval: () => void;
}

export default function GlobeClient({
  width, height, onSelectZone, selectedZone,
  aircraft, nuclearFacilities, navalVessels,
  showAircraft, showNuclear, showNaval,
  onToggleAircraft, onToggleNuclear, onToggleNaval,
}: Props) {
  const globeRef       = useRef<any>(null);
  const tooltipRef     = useRef<HTMLDivElement | null>(null);
  const wrapperRef     = useRef<HTMLDivElement | null>(null);
  const hoveredElemRef = useRef<HTMLElement | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<Exclude<GlobeHtmlLayer, TrailPoint> | null>(null);

  // Single shared tooltip div at document.body — fully outside any stacking context.
  useEffect(() => {
    const tip = document.createElement('div');
    tip.style.cssText = [
      'position:fixed', 'background:#060f07ee', 'border:1px solid #1a3a1a',
      'border-radius:4px', 'padding:8px 10px', 'font-family:monospace',
      'font-size:10px', 'max-width:220px', 'pointer-events:none',
      'opacity:0', 'transition:opacity 0.15s', 'z-index:99999',
    ].join(';');
    document.body.appendChild(tip);
    tooltipRef.current = tip;
    return () => { document.body.removeChild(tip); tooltipRef.current = null; };
  }, []);

  const combinedLayers = useMemo<GlobeHtmlLayer[]>(() => {
    const layers: GlobeHtmlLayer[] = [
      ...(showAircraft ? aircraft : []),
      ...(showNuclear  ? nuclearFacilities : []),
      ...(showNaval    ? navalVessels : []),
    ];
    // Add fading trail dots behind each aircraft based on heading
    if (showAircraft) {
      for (const ac of aircraft) {
        const acAlt = Math.max(0.001, (ac.altitude / 13000) * 0.08);
        for (let i = 1; i <= 4; i++) {
          const pos = trailCoords(ac.lat, ac.lng, ac.heading, i);
          const trail: TrailPoint = {
            layerType: 'trail',
            lat: pos.lat, lng: pos.lng,
            altGlobe: acAlt,
            opacity: 1 - i * 0.2,
            size: 9 - i,     // 8, 7, 6, 5 px
            color: '#44aaff',
          };
          layers.push(trail);
        }
      }
    }
    return layers;
  }, [showAircraft, showNuclear, showNaval, aircraft, nuclearFacilities, navalVessels]);

  // Keep a ref so the document mousemove handler always sees the current layer list
  // without needing to re-register on every render.
  const layersRef = useRef<GlobeHtmlLayer[]>(combinedLayers);
  useEffect(() => { layersRef.current = combinedLayers; }, [combinedLayers]);

  // Three.js raycasting hover — project each layer item's lat/lng to screen coords
  // using the globe's live camera, then find whichever is closest to the cursor.
  // This works regardless of z-ordering between the canvas and the HTML element overlay.
  useEffect(() => {
    const clearHover = () => {
      if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      if (hoveredElemRef.current) {
        (hoveredElemRef.current.firstElementChild as HTMLElement | null)
          ?.style.setProperty('transform', 'scale(1)');
        hoveredElemRef.current = null;
      }
    };

    const onDocMove = (e: MouseEvent) => {
      const tip    = tooltipRef.current;
      const globe  = globeRef.current;
      if (!tip || !globe) return;

      // Ignore moves outside the globe wrapper
      const wrapper = wrapperRef.current;
      if (wrapper) {
        const wr = wrapper.getBoundingClientRect();
        if (e.clientX < wr.left || e.clientX > wr.right ||
            e.clientY < wr.top  || e.clientY > wr.bottom) { clearHover(); return; }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const camera   = globe.camera?.()   as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderer = globe.renderer?.() as any;
      if (!camera || !renderer) return;

      const cr = renderer.domElement.getBoundingClientRect();
      const HIT_PX = 28; // pixels — generous for 22px icons

      let closestItem: GlobeHtmlLayer | null = null;
      let closestDist = HIT_PX;

      for (const item of layersRef.current) {
        if (item.layerType === 'trail') continue; // trail dots are decorative, not interactive
        const v = itemToWorld(item.lat, item.lng, itemAlt(item)).project(camera);
        if (v.z > 1) continue; // behind the globe
        const sx = ((v.x + 1) / 2) * cr.width  + cr.left;
        const sy = ((-v.y + 1) / 2) * cr.height + cr.top;
        const d  = Math.hypot(e.clientX - sx, e.clientY - sy);
        if (d < closestDist) { closestDist = d; closestItem = item; }
      }

      // Scale effect — find the HTML element by data-layer-id
      const newId = closestItem ? itemId(closestItem) : null;
      const prevEl = hoveredElemRef.current;
      if (prevEl && prevEl.dataset.layerId !== newId) {
        (prevEl.firstElementChild as HTMLElement | null)?.style.setProperty('transform', 'scale(1)');
        hoveredElemRef.current = null;
      }
      if (closestItem && !hoveredElemRef.current) {
        const el = wrapperRef.current?.querySelector<HTMLElement>(`[data-layer-id="${newId}"]`);
        if (el) {
          (el.firstElementChild as HTMLElement | null)?.style.setProperty('transform', 'scale(1.3)');
          hoveredElemRef.current = el;
        }
      }

      if (closestItem) {
        const { html, color } = buildTooltip(closestItem, NUCLEAR_COLOR);
        tip.innerHTML = html;
        tip.style.boxShadow = `0 0 12px ${color}55`;
        tip.style.left      = `${e.clientX}px`;
        tip.style.top       = `${e.clientY - 12}px`;
        tip.style.transform = 'translate(-50%, -100%)';
        tip.style.opacity   = '1';
      } else {
        tip.style.opacity = '0';
      }
    };

    document.addEventListener('mousemove', onDocMove);
    return () => document.removeEventListener('mousemove', onDocMove);
  }, []);

  useEffect(() => {
    const applyRotation = () => {
      const controls = globeRef.current?.controls?.();
      if (!controls) return false;
      controls.autoRotate = !selectedZone && !selectedLayer;
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
  }, [selectedZone, selectedLayer]);

  useEffect(() => {
    if (selectedZone) {
      globeRef.current?.pointOfView(
        { lat: selectedZone.lat, lng: selectedZone.lng, altitude: 1.8 },
        1200,
      );
    }
  }, [selectedZone]);

  const handlePointClick = useCallback((point: object) => {
    const zone = point as ConflictZone;
    setSelectedLayer(null); // dismiss layer card when a conflict zone is clicked
    onSelectZone?.(selectedZone?.name === zone.name ? null : zone);
  }, [onSelectZone, selectedZone]);

  // Click-to-zoom for layer markers — same Three.js raycasting as the hover handler
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const globe = globeRef.current;
      if (!globe) return;
      const wrapper = wrapperRef.current;
      if (wrapper) {
        const wr = wrapper.getBoundingClientRect();
        if (e.clientX < wr.left || e.clientX > wr.right ||
            e.clientY < wr.top  || e.clientY > wr.bottom) return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const camera = globe.camera?.() as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderer = globe.renderer?.() as any;
      if (!camera || !renderer) return;
      const cr = renderer.domElement.getBoundingClientRect();
      let closest: GlobeHtmlLayer | null = null;
      let minDist = 28;
      for (const item of layersRef.current) {
        if (item.layerType === 'trail') continue;
        const v = itemToWorld(item.lat, item.lng, itemAlt(item)).project(camera);
        if (v.z > 1) continue;
        const sx = ((v.x + 1) / 2) * cr.width  + cr.left;
        const sy = ((-v.y + 1) / 2) * cr.height + cr.top;
        const d  = Math.hypot(e.clientX - sx, e.clientY - sy);
        if (d < minDist) { minDist = d; closest = item; }
      }
      if (closest) {
        setSelectedLayer(closest as Exclude<GlobeHtmlLayer, TrailPoint>);
        onSelectZone?.(null); // dismiss conflict zone card
        globe.pointOfView?.({ lat: closest.lat, lng: closest.lng, altitude: 1.5 }, 1000);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSelectZone]);

  const handleGlobeReady = useCallback(() => {
    const controls = globeRef.current?.controls?.();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    }
  }, []);

  const buildHtmlElement = useCallback((d: object): HTMLElement => {
    const item = d as GlobeHtmlLayer;
    const el = document.createElement('div');

    // Trail dot — tiny fading circle, no interaction
    if (item.layerType === 'trail') {
      el.style.cssText =
        `width:${item.size}px;height:${item.size}px;border-radius:50%;` +
        `background:${item.color};opacity:${item.opacity};pointer-events:none;`;
      return el;
    }

    el.style.cssText = 'cursor:pointer;user-select:none;position:relative;padding:6px;';
    el.dataset.layerId = itemId(item);

    let icon = ''; let color = '#44aaff'; let iconRotation = 0;
    if (item.layerType === 'aircraft') {
      icon = '✈'; iconRotation = item.heading - 90;
    } else if (item.layerType === 'nuclear') {
      icon = '☢'; color = NUCLEAR_COLOR[item.status];
    } else {
      icon = '⚓';
    }

    el.innerHTML =
      `<div style="display:flex;flex-direction:column;align-items:center;transition:transform 0.15s;">` +
      `<span style="font-size:22px;display:block;transform:rotate(${iconRotation}deg);` +
      `filter:drop-shadow(0 0 6px ${color});line-height:1;">${icon}</span></div>`;

    return el;
  }, []);

  const TOGGLES = [
    { icon: '✈', label: 'AIRCRAFT', active: showAircraft, onToggle: onToggleAircraft, color: '#44aaff' },
    { icon: '☢', label: 'NUCLEAR',  active: showNuclear,  onToggle: onToggleNuclear,  color: '#ff4400' },
    { icon: '⚓', label: 'NAVAL',    active: showNaval,    onToggle: onToggleNaval,    color: '#44aaff' },
  ];

  return (
    <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }}>
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
        htmlElementsData={combinedLayers}
        htmlLat={(d: object) => (d as GlobeHtmlLayer).lat}
        htmlLng={(d: object) => (d as GlobeHtmlLayer).lng}
        htmlAltitude={(d: object) => itemAlt(d as GlobeHtmlLayer)}
        htmlElement={buildHtmlElement}
      />

      {/* Layer toggles — top-left */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-[500]">
        {TOGGLES.map(({ icon, label, active, onToggle, color }) => (
          <button
            key={label}
            onClick={onToggle}
            style={{
              borderColor: active ? color : '#1a3a1a',
              color: active ? color : '#3a6a4a',
              boxShadow: active ? `0 0 8px ${color}44` : 'none',
            }}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#060f07cc] border rounded text-[9px] font-mono tracking-widest backdrop-blur-sm hover:border-[#2a5a3a] transition-all duration-150"
          >
            <span style={{ fontSize: 11 }}>{icon}</span>
            {label}
            <span className="ml-1" style={{ color: active ? color : '#1a3a1a' }}>
              {active ? '●' : '○'}
            </span>
          </button>
        ))}
      </div>

      {/* Severity legend — bottom-left */}
      <div className="absolute bottom-4 left-4 bg-[#060f07cc] border border-[#1a3a1a] rounded p-3 text-[9px] font-mono space-y-1.5 backdrop-blur-sm pointer-events-none z-[500]">
        <div className="text-[#3a6a4a] tracking-widest mb-2">SEVERITY SCALE</div>
        {[
          { label: 'CRITICAL (9-10)',   color: '#ff0000' },
          { label: 'HIGH (7.5-9)',      color: '#ff4400' },
          { label: 'ELEVATED (6-7.5)', color: '#ff8800' },
          { label: 'MODERATE (<6)',     color: '#ffcc00' },
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

      {/* Selected zone panel — top-right */}
      <AnimatePresence>
        {selectedZone && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 bg-[#060f07ee] border border-[#1a3a1a] rounded p-4 w-72 backdrop-blur-sm z-[500]"
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

      {/* Selected layer panel — top-right (mutually exclusive with zone panel) */}
      <AnimatePresence>
        {selectedLayer && (
          <motion.div
            key={itemId(selectedLayer)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 bg-[#060f07ee] border border-[#1a3a1a] rounded p-4 w-72 backdrop-blur-sm z-[500]"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] font-mono text-[#3a6a4a] tracking-widest mb-1">
                  {selectedLayer.layerType === 'aircraft' ? 'MILITARY AIRCRAFT'
                   : selectedLayer.layerType === 'nuclear'  ? 'NUCLEAR FACILITY'
                   : 'NAVAL VESSEL'}
                </div>
                <div
                  className="font-bold font-mono text-sm leading-tight"
                  style={{ color: selectedLayer.layerType === 'nuclear'
                    ? NUCLEAR_COLOR[selectedLayer.status] : '#44aaff' }}
                >
                  {selectedLayer.layerType === 'aircraft'
                    ? (selectedLayer.callsign || selectedLayer.icao24)
                    : selectedLayer.name}
                </div>
              </div>
              <button
                onClick={() => setSelectedLayer(null)}
                className="text-[#3a6a4a] hover:text-[#8aaa8a] text-lg leading-none"
              >×</button>
            </div>

            {/* Body */}
            <div className="space-y-2 text-[11px] font-mono">
              {selectedLayer.layerType === 'aircraft' && (() => {
                const altFt = Math.round(selectedLayer.altitude * 3.28084).toLocaleString();
                const spdKt = Math.round(selectedLayer.velocity * 1.94384);
                return (<>
                  <div className="flex justify-between"><span className="text-[#3a6a4a]">Country</span><span className="text-[#8aaa8a]">{selectedLayer.country}</span></div>
                  <div className="flex justify-between"><span className="text-[#3a6a4a]">Altitude</span><span className="text-[#8aaa8a]">{altFt} ft</span></div>
                  <div className="flex justify-between"><span className="text-[#3a6a4a]">Speed</span><span className="text-[#8aaa8a]">{spdKt} kt</span></div>
                  <div className="flex justify-between"><span className="text-[#3a6a4a]">Heading</span><span className="text-[#8aaa8a]">{Math.round(selectedLayer.heading)}°</span></div>
                  <div className="flex justify-between"><span className="text-[#3a6a4a]">ICAO24</span><span className="text-[#5a8a6a]">{selectedLayer.icao24}</span></div>
                </>);
              })()}
              {selectedLayer.layerType === 'nuclear' && (() => {
                const c = NUCLEAR_COLOR[selectedLayer.status];
                return (<>
                  <div className="flex justify-between"><span className="text-[#3a6a4a]">Country</span><span className="text-[#8aaa8a]">{selectedLayer.country}</span></div>
                  <div className="flex justify-between"><span className="text-[#3a6a4a]">Type</span><span className="text-[#8aaa8a] uppercase">{selectedLayer.type.replace('-', ' ')}</span></div>
                  <div className="flex justify-between"><span className="text-[#3a6a4a]">Status</span><span style={{ color: c }} className="uppercase">{selectedLayer.status.replace('-', ' ')}</span></div>
                  {selectedLayer.warheads && (
                    <div className="flex justify-between"><span className="text-[#3a6a4a]">Warheads</span><span className="text-[#ff8844]">~{selectedLayer.warheads.toLocaleString()}</span></div>
                  )}
                  {selectedLayer.notes && (
                    <div className="border-t border-[#1a3a1a] pt-2">
                      <div className="text-[#3a6a4a] mb-1">NOTES</div>
                      <div className="text-[#5a8a6a] leading-relaxed">{selectedLayer.notes}</div>
                    </div>
                  )}
                </>);
              })()}
              {selectedLayer.layerType === 'naval' && (<>
                <div className="flex justify-between"><span className="text-[#3a6a4a]">Country</span><span className="text-[#8aaa8a]">{selectedLayer.country}</span></div>
                <div className="flex justify-between"><span className="text-[#3a6a4a]">Type</span><span className="text-[#8aaa8a] uppercase">{selectedLayer.type}</span></div>
                <div className="flex justify-between"><span className="text-[#3a6a4a]">Class</span><span className="text-[#8aaa8a]">{selectedLayer.class}</span></div>
                <div className="border-t border-[#1a3a1a] pt-2">
                  <div className="text-[#3a6a4a] mb-1">STATUS</div>
                  <div className="text-[#5a8a6a] leading-relaxed">{selectedLayer.status}</div>
                </div>
              </>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
