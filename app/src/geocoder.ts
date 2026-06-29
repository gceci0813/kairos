import { Redis } from '@upstash/redis';
import { GeoPoint, lookupPlace } from './atlas-gazetteer';

// Event geocoding: resolves PLACE NAMES mentioned in reporting to coordinates,
// so ATLAS can map any location in the corpus rather than just the static
// gazetteer. Operates on place strings (cities, regions, countries) — not on
// individuals.
//
// Provider: Nominatim (OpenStreetMap) — free, no key required. Usage policy
// caps at ~1 req/sec and requires a descriptive User-Agent, so results are
// cached in Redis (when configured) to stay well within it. If a
// GEOCODER_USER_AGENT / contact is set, it's used per Nominatim policy.

export type GeocodeProvider = 'gazetteer' | 'mapbox' | 'google' | 'nominatim' | 'cache';

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  kind: GeoPoint['kind'];
  source: GeocodeProvider;
  confidence: number; // 0-1
}

function getRedis(): Redis | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  return url && token ? new Redis({ url, token }) : null;
}

const CACHE_PREFIX = 'geocode:';
const CACHE_TTL_S = 60 * 60 * 24 * 30; // 30 days — place coordinates are stable
const NEGATIVE = '__none__';

let lastCall = 0;
async function rateLimit(minIntervalMs = 1100) {
  const wait = lastCall + minIntervalMs - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

function cacheKey(name: string) {
  return CACHE_PREFIX + name.toLowerCase().trim();
}

// --- Providers (each returns null on miss/error) -------------------------

async function viaMapbox(q: string): Promise<GeocodeResult | null> {
  const token = (process.env.MAPBOX_TOKEN ?? '').trim();
  if (!token) return null;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?` +
    new URLSearchParams({ access_token: token, limit: '1', language: 'en' });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`mapbox ${res.status}`);
  const data = await res.json();
  const f = data?.features?.[0];
  if (!f) return null;
  const [lon, lat] = f.center;
  const place = (f.place_type ?? []).includes('country') ? 'country' : 'city';
  return { lat, lon, displayName: f.text ?? q, kind: place, source: 'mapbox', confidence: typeof f.relevance === 'number' ? f.relevance : 0.8 };
}

async function viaGoogle(q: string): Promise<GeocodeResult | null> {
  const key = (process.env.GOOGLE_GEOCODING_KEY ?? '').trim();
  if (!key) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?` +
    new URLSearchParams({ address: q, key });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`google ${res.status}`);
  const data = await res.json();
  if (data.status === 'ZERO_RESULTS') return null;
  if (data.status !== 'OK') throw new Error(`google ${data.status}`);
  const r = data.results?.[0];
  if (!r) return null;
  const loc = r.geometry.location;
  const isCountry = (r.types ?? []).includes('country');
  // Google location_type → confidence proxy.
  const lt = r.geometry.location_type;
  const conf = lt === 'ROOFTOP' ? 0.95 : lt === 'RANGE_INTERPOLATED' ? 0.85 : lt === 'GEOMETRIC_CENTER' ? 0.75 : 0.65;
  return { lat: loc.lat, lon: loc.lng, displayName: r.formatted_address?.split(',')[0] ?? q, kind: isCountry ? 'country' : 'city', source: 'google', confidence: conf };
}

async function viaNominatim(q: string): Promise<GeocodeResult | null> {
  await rateLimit(); // only Nominatim needs the 1/sec courtesy pacing
  const ua = (process.env.GEOCODER_USER_AGENT ?? 'Kairos-SIGMA/1.0 (osint research)').trim();
  const url = `https://nominatim.openstreetmap.org/search?` +
    new URLSearchParams({ q, format: 'json', limit: '1', addressdetails: '0' });
  const res = await fetch(url, { headers: { 'User-Agent': ua, 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = await res.json();
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit) return null;
  const lat = parseFloat(hit.lat), lon = parseFloat(hit.lon);
  if (isNaN(lat) || isNaN(lon)) return null;
  const imp = typeof hit.importance === 'number' ? hit.importance : 0.5;
  return {
    lat, lon,
    displayName: hit.display_name?.split(',')[0] ?? q,
    kind: /city|town|village|hamlet|suburb/i.test(hit.type ?? '') ? 'city' : 'country',
    source: 'nominatim',
    confidence: Math.max(0.4, Math.min(0.95, imp)),
  };
}

// Fallback chain: gazetteer → cache → Mapbox → Google → Nominatim. Higher-
// accuracy paid providers are tried first when configured.
export async function geocodePlace(name: string): Promise<GeocodeResult | null> {
  const clean = name.trim();
  if (!clean || clean.length < 2) return null;

  const gaz = lookupPlace(clean);
  if (gaz) {
    return { lat: gaz.lat, lon: gaz.lon, displayName: gaz.canonical, kind: gaz.kind, source: 'gazetteer', confidence: 1 };
  }

  const redis = getRedis();
  const key = cacheKey(clean);
  if (redis) {
    const cached = await redis.get<GeocodeResult | string>(key);
    if (cached === NEGATIVE) return null;
    if (cached && typeof cached === 'object') return { ...(cached as GeocodeResult), source: 'cache' };
  }

  const providers = [viaMapbox, viaGoogle, viaNominatim];
  for (const provider of providers) {
    try {
      const result = await provider(clean);
      if (result) {
        if (redis) await redis.set(key, result, { ex: CACHE_TTL_S });
        return result;
      }
    } catch (error) {
      // Provider error/outage — try the next in the chain.
      console.error(`Geocoder provider failed for "${clean}":`, error);
    }
  }

  // All providers returned no match — cache negative to avoid re-querying.
  if (redis) await redis.set(key, NEGATIVE, { ex: CACHE_TTL_S });
  return null;
}

// Cache-only batch resolve (gazetteer + Redis, NO live calls) — fast enough
// for dashboard requests. Unknown/uncached names are simply omitted; run the
// build pass to populate them.
export async function resolvePlacesCached(names: string[]): Promise<Map<string, GeocodeResult>> {
  const out = new Map<string, GeocodeResult>();
  const distinct = Array.from(new Set(names.map((n) => n.trim()).filter((n) => n.length >= 2)));
  const needCache: string[] = [];

  for (const name of distinct) {
    const gaz = lookupPlace(name);
    if (gaz) {
      out.set(name, { lat: gaz.lat, lon: gaz.lon, displayName: gaz.canonical, kind: gaz.kind, source: 'gazetteer', confidence: 1 });
    } else {
      needCache.push(name);
    }
  }

  const redis = getRedis();
  if (redis && needCache.length) {
    const keys = needCache.map(cacheKey);
    const values = await redis.mget<(GeocodeResult | string | null)[]>(...keys);
    needCache.forEach((name, i) => {
      const v = values[i];
      if (v && typeof v === 'object') out.set(name, { ...(v as GeocodeResult), source: 'cache' });
    });
  }
  return out;
}

// Build pass: live-geocode distinct unknown place names into the cache, paced
// to the provider's rate limit and bounded by a wall-clock budget.
export async function buildGeocodeCache(names: string[], timeBudgetMs = 50_000): Promise<{ attempted: number; resolved: number }> {
  const distinct = Array.from(new Set(names.map((n) => n.trim()).filter((n) => n.length >= 2)));
  const start = Date.now();
  let attempted = 0, resolved = 0;
  for (const name of distinct) {
    if (Date.now() - start > timeBudgetMs) break;
    if (lookupPlace(name)) continue; // already in gazetteer
    attempted++;
    const r = await geocodePlace(name); // checks cache, then live; caches result
    if (r) resolved++;
  }
  return { attempted, resolved };
}
