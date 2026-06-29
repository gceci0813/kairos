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

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  kind: GeoPoint['kind'];
  source: 'gazetteer' | 'nominatim' | 'cache';
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

export async function geocodePlace(name: string): Promise<GeocodeResult | null> {
  const clean = name.trim();
  if (!clean || clean.length < 2) return null;

  // 1) Static gazetteer first (instant, curated centroids).
  const gaz = lookupPlace(clean);
  if (gaz) {
    return { lat: gaz.lat, lon: gaz.lon, displayName: gaz.canonical, kind: gaz.kind, source: 'gazetteer' };
  }

  const redis = getRedis();
  const key = cacheKey(clean);

  // 2) Cache.
  if (redis) {
    const cached = await redis.get<GeocodeResult | string>(key);
    if (cached === NEGATIVE) return null;
    if (cached && typeof cached === 'object') return { ...cached, source: 'cache' };
  }

  // 3) Live geocode via Nominatim.
  try {
    await rateLimit();
    const ua = (process.env.GEOCODER_USER_AGENT ?? 'Kairos-SIGMA/1.0 (osint research)').trim();
    const url = `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({ q: clean, format: 'json', limit: '1', addressdetails: '0' });
    const res = await fetch(url, { headers: { 'User-Agent': ua, 'Accept-Language': 'en' } });

    if (!res.ok) {
      // Don't cache transient failures.
      console.error(`Geocoder error for "${clean}": ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      if (redis) await redis.set(key, NEGATIVE, { ex: CACHE_TTL_S });
      return null;
    }
    const hit = data[0];
    const result: GeocodeResult = {
      lat: parseFloat(hit.lat),
      lon: parseFloat(hit.lon),
      displayName: hit.display_name?.split(',')[0] ?? clean,
      kind: /city|town|village|hamlet|suburb/i.test(hit.type ?? '') ? 'city' : 'country',
      source: 'nominatim',
    };
    if (isNaN(result.lat) || isNaN(result.lon)) return null;
    if (redis) await redis.set(key, result, { ex: CACHE_TTL_S });
    return result;
  } catch (error) {
    console.error(`Geocoder failed for "${clean}":`, error);
    return null;
  }
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
      out.set(name, { lat: gaz.lat, lon: gaz.lon, displayName: gaz.canonical, kind: gaz.kind, source: 'gazetteer' });
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
