import { NextResponse } from 'next/server';
import type { SeismicEvent } from '@/lib/types';

const USGS_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';

// Known nuclear test sites [lat, lng, name]
const NUCLEAR_TEST_SITES: [number, number, string][] = [
  [41.27, 129.09, 'Punggye-ri (DPRK)'],
  [41.2, 89.2, 'Lop Nor (China)'],
  [37.1, -116.0, 'Nevada Test Site (USA)'],
  [50.1, 78.8, 'Semipalatinsk (Kazakhstan)'],
  [73.4, 54.9, 'Novaya Zemlya (Russia)'],
  [26.5, 63.6, 'Chagai Hills (Pakistan)'],
  [22.2, 100.0, 'Pokhran (India)'],
  [-22.2, -138.9, 'Mururoa (France)'],
];

const D2R = Math.PI / 180;
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * D2R;
  const dLng = (lng2 - lng1) * D2R;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * D2R) * Math.cos(lat2 * D2R) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestTestSite(lat: number, lng: number): string | undefined {
  for (const [slat, slng, name] of NUCLEAR_TEST_SITES) {
    if (haversineKm(lat, lng, slat, slng) < 150) return name;
  }
  return undefined;
}

export async function GET() {
  try {
    const res = await fetch(USGS_URL, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'WorldConflictIntel/1.0' },
    });
    if (!res.ok) throw new Error(`USGS ${res.status}`);

    const geojson = await res.json();
    const features: any[] = geojson.features ?? [];

    const events: SeismicEvent[] = features
      .filter(f => f.properties.mag >= 3.5 && f.geometry?.coordinates?.length >= 2)
      .map(f => {
        const [lng, lat, depth] = f.geometry.coordinates as [number, number, number];
        return {
          layerType: 'seismic' as const,
          lat,
          lng,
          magnitude: Math.round(f.properties.mag * 10) / 10,
          place: f.properties.place ?? 'Unknown',
          time: f.properties.time as number,
          depth: Math.round(depth),
          nearNuclearSite: nearestTestSite(lat, lng),
        };
      });

    return NextResponse.json({ events, fetchedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ events: [], fetchedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, s-maxage=60' },
    });
  }
}
