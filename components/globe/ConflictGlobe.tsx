'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ConflictZone } from '@/lib/types';


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
      />
    </div>
  );
}
