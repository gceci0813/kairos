import { getSupabaseAdmin } from './supabase-admin';
import { GeoPoint, lookupPlace, GAZETTEER } from './atlas-gazetteer';
import { ensureCanonicalMap } from './entity-canonical';
import { resolvePlacesCached, GeocodeResult } from './geocoder';

export type GeoLevel = 'all' | 'country' | 'city';

// Aggregate geographic analysis over the findings corpus. Operates purely on
// location ENTITIES (place names) and narratives/topics — never on individuals.
// Produces region-level density and temporal series for visualization.

export interface DensityFeature {
  place: string;
  lat: number;
  lon: number;
  kind: GeoPoint['kind'];
  mentions: number;
  avgSentiment: number;
  topics: string[];
}

interface FindingRow {
  entities: Array<{ text: string; type: string }> | null;
  topics: string[] | null;
  sentiment_score: number | null;
  analyzed_at: string;
}

async function loadFindings(query: string | null, sinceDays: number, limit = 5000): Promise<FindingRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');
  await ensureCanonicalMap();

  let matchKeys: string[] | null = null;
  if (query && query.trim()) {
    const { data: msgs, error } = await supabase
      .from('sigma_messages')
      .select('msg_key')
      .textSearch('content', query, { type: 'websearch', config: 'simple' })
      .limit(limit);
    if (error) throw new Error(error.message);
    matchKeys = (msgs ?? []).map((m: any) => m.msg_key);
    if (matchKeys.length === 0) return [];
  }

  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  let q = supabase
    .from('sigma_findings')
    .select('entities, topics, sentiment_score, analyzed_at')
    .gte('analyzed_at', since)
    .limit(limit);
  if (matchKeys) q = q.in('msg_key', matchKeys);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as FindingRow[];
}

// Find a country GeoPoint by canonical country name, for city→country rollup.
function countryPoint(countryName: string): GeoPoint | null {
  for (const p of Object.values(GAZETTEER)) {
    if (p.kind === 'country' && p.canonical === countryName) return p;
  }
  return null;
}

// Resolve a place to the GeoPoint it should aggregate under, given the level.
// level=country rolls cities up to their country; level=city keeps only cities;
// level=all keeps each place as-is.
function resolveForLevel(point: GeoPoint, level: GeoLevel): GeoPoint | null {
  if (level === 'all') return point;
  if (level === 'city') return point.kind === 'city' ? point : null;
  // level === 'country'
  if (point.kind === 'country') return point;
  // city → its country
  if (point.country) return countryPoint(point.country) ?? null;
  return null;
}

// Build place → aggregate density from location entities.
export async function geographicDensity(
  query: string | null,
  sinceDays = 30,
  level: GeoLevel = 'all'
): Promise<DensityFeature[]> {
  const findings = await loadFindings(query, sinceDays);

  // Resolve all location names up front: static gazetteer + geocode cache.
  // Geocoded (non-gazetteer) places have no country rollup, so they appear at
  // 'all'/'city' levels.
  const allNames = findings.flatMap((f) => (f.entities ?? []).filter((e) => e.type === 'location').map((e) => e.text));
  const geo = await resolvePlacesCached(allNames);

  const acc = new Map<string, { point: GeoPoint; mentions: number; sentSum: number; sentN: number; topics: Map<string, number> }>();

  for (const f of findings) {
    const locations = (f.entities ?? []).filter((e) => e.type === 'location');
    for (const loc of locations) {
      let raw = lookupPlace(loc.text);
      if (!raw) {
        const g = geo.get(loc.text.trim());
        if (g && g.source !== 'gazetteer') {
          raw = { lat: g.lat, lon: g.lon, kind: g.kind, canonical: g.displayName };
        }
      }
      if (!raw) continue; // unmappable place — skip
      const point = resolveForLevel(raw, level);
      if (!point) continue;
      const key = point.canonical;
      if (!acc.has(key)) acc.set(key, { point, mentions: 0, sentSum: 0, sentN: 0, topics: new Map() });
      const a = acc.get(key)!;
      a.mentions++;
      if (typeof f.sentiment_score === 'number') {
        a.sentSum += f.sentiment_score;
        a.sentN++;
      }
      for (const t of f.topics ?? []) a.topics.set(t, (a.topics.get(t) ?? 0) + 1);
    }
  }

  return Array.from(acc.values())
    .map((a) => ({
      place: a.point.canonical,
      lat: a.point.lat,
      lon: a.point.lon,
      kind: a.point.kind,
      mentions: a.mentions,
      avgSentiment: a.sentN > 0 ? a.sentSum / a.sentN : 0,
      topics: Array.from(a.topics.entries())
        .sort((x, y) => y[1] - x[1])
        .slice(0, 5)
        .map(([t]) => t),
    }))
    .sort((x, y) => y.mentions - x.mentions);
}

// Per-region drill-down: for a given place (country or city), return the top
// narratives/topics with their volume and sentiment. Matches both the place
// itself and (for countries) its cities, so drilling into "Russia" includes
// Moscow/Rostov mentions.
export interface RegionNarrative {
  topic: string;
  mentions: number;
  avgSentiment: number;
}

export async function regionNarratives(
  place: string,
  sinceDays = 30
): Promise<{ place: string; totalMentions: number; narratives: RegionNarrative[] }> {
  const findings = await loadFindings(null, sinceDays);
  const target = place.toLowerCase().trim();

  const topics = new Map<string, { mentions: number; sentSum: number; sentN: number }>();
  let totalMentions = 0;

  for (const f of findings) {
    const places = (f.entities ?? [])
      .filter((e) => e.type === 'location')
      .map((e) => lookupPlace(e.text))
      .filter((p): p is GeoPoint => !!p);

    // Does this finding reference the target place (or a city within it)?
    const matches = places.some(
      (p) => p.canonical.toLowerCase() === target || (p.country ?? '').toLowerCase() === target
    );
    if (!matches) continue;
    totalMentions++;

    for (const t of new Set(f.topics ?? [])) {
      if (!topics.has(t)) topics.set(t, { mentions: 0, sentSum: 0, sentN: 0 });
      const e = topics.get(t)!;
      e.mentions++;
      if (typeof f.sentiment_score === 'number') {
        e.sentSum += f.sentiment_score;
        e.sentN++;
      }
    }
  }

  const narratives = Array.from(topics.entries())
    .map(([topic, e]) => ({
      topic,
      mentions: e.mentions,
      avgSentiment: e.sentN > 0 ? e.sentSum / e.sentN : 0,
    }))
    .sort((a, b) => b.mentions - a.mentions);

  return { place, totalMentions, narratives };
}

export function toGeoJSON(features: DensityFeature[]) {
  return {
    type: 'FeatureCollection' as const,
    features: features.map((f) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [f.lon, f.lat] },
      properties: {
        place: f.place,
        kind: f.kind,
        mentions: f.mentions,
        avgSentiment: Number(f.avgSentiment.toFixed(3)),
        topics: f.topics,
      },
    })),
  };
}

// Temporal: per-place mention counts bucketed by day, to show how a topic's
// geographic footprint shifts over time.
export async function temporalGeography(query: string | null, sinceDays = 30) {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');
  const findings = await loadFindings(query, sinceDays);

  // place → day(YYYY-MM-DD) → count
  const series = new Map<string, Map<string, number>>();
  for (const f of findings) {
    const day = f.analyzed_at.slice(0, 10);
    for (const loc of (f.entities ?? []).filter((e) => e.type === 'location')) {
      const point = lookupPlace(loc.text);
      if (!point) continue;
      const place = point.canonical;
      if (!series.has(place)) series.set(place, new Map());
      const m = series.get(place)!;
      m.set(day, (m.get(day) ?? 0) + 1);
    }
  }

  return Array.from(series.entries())
    .map(([place, days]) => ({
      place,
      points: Array.from(days.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, count]) => ({ day, count })),
      total: Array.from(days.values()).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total);
}
