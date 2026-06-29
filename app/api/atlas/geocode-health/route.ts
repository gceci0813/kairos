import { NextResponse } from 'next/server';
import { geocodePlace } from '../../../src/geocoder';

export const maxDuration = 30;

// Geocoding health: which providers are configured, and a live probe of the
// active fallback chain. Surfaces provider outages (chain falls through or
// errors). Public read — no secrets exposed.
export async function GET() {
  const providers = {
    mapbox: !!(process.env.MAPBOX_TOKEN ?? '').trim(),
    google: !!(process.env.GOOGLE_GEOCODING_KEY ?? '').trim(),
    nominatim: true, // always available (free)
  };

  const probeStart = Date.now();
  let probe: any = null;
  let healthy = false;
  try {
    // Use a name NOT in the static gazetteer so it exercises the live chain.
    const r = await geocodePlace('Stuttgart');
    if (r) {
      healthy = true;
      probe = { resolved: true, via: r.source, confidence: r.confidence, lat: r.lat, lon: r.lon };
    } else {
      probe = { resolved: false };
    }
  } catch (error) {
    probe = { resolved: false, error: error instanceof Error ? error.message : 'probe failed' };
  }

  const latencyMs = Date.now() - probeStart;
  const status = healthy ? 'ok' : 'degraded';
  const alerts: string[] = [];
  if (!healthy) alerts.push('Geocoding probe failed — all providers in the chain returned no result or errored.');
  if (!providers.mapbox && !providers.google) {
    alerts.push('Only Nominatim (free, 1 req/s) is configured — set MAPBOX_TOKEN or GOOGLE_GEOCODING_KEY for higher throughput/accuracy.');
  }

  return NextResponse.json({ status, providers, probe, latencyMs, alerts });
}
