'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import type { ConflictZone, MilitaryAircraft } from '@/lib/types';
import { NUCLEAR_FACILITIES, NAVAL_VESSELS } from '@/lib/globe-layers';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const GlobeClient = dynamic(() => import('./GlobeClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <span className="font-mono text-[#3a6a4a] text-sm animate-pulse tracking-widest">
        ⟳ LOADING GLOBE...
      </span>
    </div>
  ),
});

interface Props {
  onSelectZone?: (zone: ConflictZone | null) => void;
  selectedZone?: ConflictZone | null;
}

export default function ConflictGlobe({ onSelectZone, selectedZone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });

  // Layer visibility toggles
  const [showAircraft, setShowAircraft] = useState(false);
  const [showNuclear,  setShowNuclear]  = useState(false);
  const [showNaval,    setShowNaval]    = useState(false);

  // Only fetch when the aircraft layer is active — conserves OpenSky's 400 req/day limit
  const { data: aircraftData } = useSWR<{ aircraft: MilitaryAircraft[] }>(
    showAircraft ? '/api/aircraft' : null,
    fetcher,
    { refreshInterval: 30_000 },
  );

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.max(1, width), h: Math.max(300, height) });
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-[#030805]"
      style={{ minHeight: 360 }}
    >
      <GlobeClient
        width={size.w}
        height={size.h}
        onSelectZone={onSelectZone}
        selectedZone={selectedZone}
        aircraft={aircraftData?.aircraft ?? []}
        nuclearFacilities={NUCLEAR_FACILITIES}
        navalVessels={NAVAL_VESSELS}
        showAircraft={showAircraft}
        showNuclear={showNuclear}
        showNaval={showNaval}
        onToggleAircraft={() => setShowAircraft(v => !v)}
        onToggleNuclear={() => setShowNuclear(v => !v)}
        onToggleNaval={() => setShowNaval(v => !v)}
      />
    </div>
  );
}
