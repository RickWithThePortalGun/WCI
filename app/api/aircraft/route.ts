import { NextResponse } from 'next/server';
import type { MilitaryAircraft } from '@/lib/types';

// adsb.fi — free community ADSB aggregator, no auth, works from cloud IPs
// /v1/mil returns globally-tracked military aircraft only
const ADSBFI_URL = 'https://api.adsb.fi/v1/mil';

// OpenSky fallback (works from residential/some cloud IPs)
const OPENSKY_URL = 'https://opensky-network.org/api/states/all?extended=1';

// OpenSky state vector field indices
const F_ICAO24   = 0;
const F_CALLSIGN = 1;
const F_COUNTRY  = 2;
const F_LNG      = 5;
const F_LAT      = 6;
const F_ALT      = 7;
const F_GROUND   = 8;
const F_VELOCITY = 9;
const F_HEADING  = 10;
const F_CATEGORY = 17; // 21 = Military

const MILITARY_PREFIXES = [
  'RCH', 'REACH', 'SAM', 'MAGMA', 'POLO', 'GHOST', 'NIGHT', 'BARON',
  'JAKE', 'ATLAS', 'TOPGN', 'RRR', 'ASCOT', 'TARTAN', 'CNV',
  'IRON', 'STEEL', 'SWORD', 'FORTE',
];

function isMilitary(state: (string | number | boolean | null)[]): boolean {
  if (state[F_CATEGORY] === 21) return true;
  const cs = String(state[F_CALLSIGN] ?? '').trim().toUpperCase();
  return cs.length > 0 && MILITARY_PREFIXES.some(p => cs.startsWith(p));
}

// Dev mock — used when all sources are unreachable
const DEV_MOCK: MilitaryAircraft[] = [
  { layerType: 'aircraft', icao24: 'ae1234', callsign: 'REACH101', country: 'United States',  lat: 50.2, lng: 28.5,  altitude: 10500, velocity: 240, heading: 90  },
  { layerType: 'aircraft', icao24: 'ae5678', callsign: 'SAM001',   country: 'United States',  lat: 33.8, lng: 36.5,  altitude: 11000, velocity: 230, heading: 270 },
  { layerType: 'aircraft', icao24: 'ae9abc', callsign: 'RRR7701',  country: 'United Kingdom', lat: 51.5, lng: 2.0,   altitude: 9800,  velocity: 220, heading: 180 },
  { layerType: 'aircraft', icao24: 'ae1111', callsign: 'MAGMA11',  country: 'United States',  lat: 36.2, lng: 30.1,  altitude: 10200, velocity: 250, heading: 120 },
  { layerType: 'aircraft', icao24: 'ae2222', callsign: 'REACH205', country: 'United States',  lat: 21.5, lng: 59.0,  altitude: 11200, velocity: 245, heading: 45  },
  { layerType: 'aircraft', icao24: 'ae3333', callsign: 'CNV441',   country: 'United States',  lat: 15.0, lng: 43.5,  altitude: 8500,  velocity: 180, heading: 200 },
  { layerType: 'aircraft', icao24: 'ae4444', callsign: 'FORTE10',  country: 'United States',  lat: 25.0, lng: 55.0,  altitude: 12000, velocity: 260, heading: 310 },
];

/** Parse adsb.fi /v1/mil response */
interface AdsbFiAircraft {
  hex: string;
  flight?: string;
  r?: string;        // registration
  lat?: number;
  lon?: number;
  alt_baro?: number | string; // metres or "ground"
  gs?: number;       // ground speed knots
  track?: number;    // heading degrees
  seen?: number;     // seconds since last message
  dbFlags?: number;  // bit 1 = military
}

function parseAdsbFi(data: { ac?: AdsbFiAircraft[] }): MilitaryAircraft[] {
  return (data.ac ?? [])
    .filter(a => a.lat != null && a.lon != null && a.alt_baro !== 'ground' && (a.seen ?? 0) < 60)
    .map(a => ({
      layerType: 'aircraft' as const,
      icao24:   a.hex,
      callsign: (a.flight ?? a.r ?? a.hex).trim(),
      country:  '',   // adsb.fi doesn't expose country reliably
      lat:      a.lat!,
      lng:      a.lon!,
      altitude: typeof a.alt_baro === 'number' ? Math.round(a.alt_baro * 0.3048) : 0, // ft→m
      velocity: a.gs ? Math.round(a.gs * 0.514) : 0, // knots→m/s
      heading:  a.track ?? 0,
    }));
}

export async function GET() {
  const isDev = process.env.NODE_ENV === 'development';
  const headers = { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' };

  // ── Primary: adsb.fi military endpoint (works from cloud IPs, free, no auth) ──
  try {
    const res = await fetch(ADSBFI_URL, {
      next: { revalidate: 30 },
      headers: { Accept: 'application/json', 'User-Agent': 'WCI-Intel/1.0' },
      signal: AbortSignal.timeout(8_000),
    });

    if (res.ok) {
      const json = await res.json() as { ac?: AdsbFiAircraft[] };
      const aircraft = parseAdsbFi(json);
      return NextResponse.json(
        { aircraft, fetchedAt: new Date().toISOString(), source: 'adsb.fi', total: aircraft.length },
        { headers },
      );
    }
    console.warn(`[aircraft] adsb.fi returned ${res.status} — trying OpenSky fallback`);
  } catch (err) {
    console.warn('[aircraft] adsb.fi failed:', err instanceof Error ? err.message : err);
  }

  // ── Fallback: OpenSky Network (may fail from cloud IPs) ──
  try {
    const res = await fetch(OPENSKY_URL, {
      next: { revalidate: 30 },
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.ok) {
      const json = await res.json() as { states?: (string | number | boolean | null)[][] };
      const aircraft: MilitaryAircraft[] = (json.states ?? [])
        .filter(s => isMilitary(s) && !s[F_GROUND] && s[F_LAT] != null && s[F_LNG] != null)
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
        { aircraft, fetchedAt: new Date().toISOString(), source: 'opensky', total: aircraft.length },
        { headers },
      );
    }
    console.warn(`[aircraft] OpenSky returned ${res.status}`);
  } catch (err) {
    console.warn('[aircraft] OpenSky failed:', err instanceof Error ? err.message : err);
  }

  // ── All sources failed ──
  const aircraft = isDev ? DEV_MOCK : [];
  return NextResponse.json(
    { aircraft, fetchedAt: new Date().toISOString(), source: isDev ? 'mock' : 'error' },
    { headers },
  );
}
