import { NextResponse } from 'next/server';
import type { MilitaryAircraft } from '@/lib/types';

// OpenSky Network — free, no auth, 400 req/day limit
// Vercel CDN s-maxage=30 means all users share one origin fetch per 30s
const OPENSKY_URL = 'https://opensky-network.org/api/states/all?extended=1';

// State vector field indices
const F_ICAO24   = 0;
const F_CALLSIGN = 1;
const F_COUNTRY  = 2;
const F_LNG      = 5;
const F_LAT      = 6;
const F_ALT      = 7;  // barometric altitude, metres
const F_GROUND   = 8;  // on_ground boolean
const F_VELOCITY = 9;  // m/s
const F_HEADING  = 10; // degrees true
const F_CATEGORY = 17; // ADS-B emitter category — 21 = Military

// Many military aircraft transpond with category=0 (no info) and are only
// identifiable by callsign prefix. This covers USAF, USN, RAF, and others.
const MILITARY_PREFIXES = [
  'RCH', 'REACH',  // USAF Air Mobility Command
  'SAM',           // Special Air Mission (VIP / Air Force One support)
  'MAGMA', 'POLO', 'GHOST', 'NIGHT', 'BARON', 'JAKE', 'ATLAS',
  'TOPGN',         // USN
  'RRR', 'ASCOT', 'TARTAN',  // RAF
  'CNV',           // US Navy patrol
  'IRON', 'STEEL', 'SWORD',
  'FORTE',         // USAF strategic
];

function isMilitary(state: (string | number | boolean | null)[]): boolean {
  if (state[F_CATEGORY] === 21) return true;
  const cs = String(state[F_CALLSIGN] ?? '').trim().toUpperCase();
  return cs.length > 0 && MILITARY_PREFIXES.some(p => cs.startsWith(p));
}

// Dev mock — shown when OpenSky is unreachable (common on local/non-Vercel IPs)
const DEV_MOCK: MilitaryAircraft[] = [
  { layerType: 'aircraft', icao24: 'ae1234', callsign: 'REACH101', country: 'United States', lat: 50.2, lng: 28.5, altitude: 10500, velocity: 240, heading: 90 },
  { layerType: 'aircraft', icao24: 'ae5678', callsign: 'SAM001',   country: 'United States', lat: 33.8, lng: 36.5, altitude: 11000, velocity: 230, heading: 270 },
  { layerType: 'aircraft', icao24: 'ae9abc', callsign: 'RRR7701',  country: 'United Kingdom', lat: 51.5, lng: 2.0,  altitude: 9800,  velocity: 220, heading: 180 },
  { layerType: 'aircraft', icao24: 'ae1111', callsign: 'MAGMA11',  country: 'United States', lat: 36.2, lng: 30.1, altitude: 10200, velocity: 250, heading: 120 },
  { layerType: 'aircraft', icao24: 'ae2222', callsign: 'REACH205', country: 'United States', lat: 21.5, lng: 59.0, altitude: 11200, velocity: 245, heading: 45 },
  { layerType: 'aircraft', icao24: 'ae3333', callsign: 'CNV441',   country: 'United States', lat: 15.0, lng: 43.5, altitude: 8500,  velocity: 180, heading: 200 },
  { layerType: 'aircraft', icao24: 'ae4444', callsign: 'FORTE10',  country: 'United States', lat: 25.0, lng: 55.0, altitude: 12000, velocity: 260, heading: 310 },
];

export async function GET() {
  const isDev = process.env.NODE_ENV === 'development';

  try {
    const res = await fetch(OPENSKY_URL, {
      next: { revalidate: 30 },
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(`[aircraft] OpenSky returned ${res.status}`);
      return NextResponse.json(
        { aircraft: [], fetchedAt: new Date().toISOString(), source: 'error' },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
      );
    }

    const json = await res.json() as { states?: (string | number | boolean | null)[][] };
    const states = json.states ?? [];

    const aircraft: MilitaryAircraft[] = states
      .filter(s =>
        isMilitary(s)
        && !s[F_GROUND]   // airborne only
        && s[F_LAT] != null
        && s[F_LNG] != null,
      )
      .map(s => ({
        layerType: 'aircraft' as const,
        icao24:   String(s[F_ICAO24]   ?? ''),
        callsign: String(s[F_CALLSIGN] ?? '').trim(),
        country:  String(s[F_COUNTRY]  ?? ''),
        lat:      s[F_LAT]      as number,
        lng:      s[F_LNG]      as number,
        altitude: (s[F_ALT]      as number) ?? 0,
        velocity: (s[F_VELOCITY] as number) ?? 0,
        heading:  (s[F_HEADING]  as number) ?? 0,
      }));

    return NextResponse.json(
      { aircraft, fetchedAt: new Date().toISOString(), total: states.length },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
    );
  } catch (err: unknown) {
    console.error('[aircraft] Fetch failed:', err instanceof Error ? err.message : err);
    // In dev, return mock aircraft so the layer is testable without OpenSky access
    const aircraft = isDev ? DEV_MOCK : [];
    return NextResponse.json(
      { aircraft, fetchedAt: new Date().toISOString(), source: isDev ? 'mock' : 'error' },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } },
    );
  }
}
