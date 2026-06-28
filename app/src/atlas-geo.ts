import { getSupabaseAdmin } from './supabase-admin';
import { GeoPoint, lookupPlace } from './atlas-gazetteer';

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

// Build place → aggregate density from location entities.
export async function geographicDensity(query: string | null, sinceDays = 30): Promise<DensityFeature[]> {
  const findings = await loadFindings(query, sinceDays);

  const acc = new Map<string, { point: GeoPoint; mentions: number; sentSum: number; sentN: number; topics: Map<string, number> }>();

  for (const f of findings) {
    const locations = (f.entities ?? []).filter((e) => e.type === 'location');
    for (const loc of locations) {
      const point = lookupPlace(loc.text);
      if (!point) continue; // only map places we can position; unknown names skipped
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
