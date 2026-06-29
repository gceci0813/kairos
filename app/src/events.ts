import { getSupabaseAdmin } from './supabase-admin';
import { resolvePlacesCached, GeocodeResult } from './geocoder';
import { canonicalizeEntity } from './entity-resolution';
import { ensureCanonicalMap } from './entity-canonical';

// Event model: a geocoded, time-stamped occurrence derived from a finding that
// has both a location and a publication date. Aggregate event-level data —
// places, times, narratives — not individuals.

export interface GeoEvent {
  msgKey: string;
  channel: string | null;
  place: string;
  lat: number;
  lon: number;
  postedAt: string;
  topics: string[];
  sentiment: number | null;
  snippet: string;
}

interface FindingRow {
  msg_key: string;
  channel: string | null;
  entities: Array<{ text: string; type: string }> | null;
  topics: string[] | null;
  sentiment_score: number | null;
  sigma_messages: { posted_at: string | null; content: string | null } | null;
}

export async function loadEvents(sinceDays: number, limit = 8000): Promise<GeoEvent[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');
  await ensureCanonicalMap();

  const { data, error } = await supabase
    .from('sigma_findings')
    .select('msg_key, channel, entities, topics, sentiment_score, sigma_messages!inner(posted_at, content)')
    .order('analyzed_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as FindingRow[];
  const sinceMs = Date.now() - sinceDays * 86400000;

  // Resolve all place names once via gazetteer + geocode cache.
  const allNames = rows.flatMap((r) => (r.entities ?? []).filter((e) => e.type === 'location').map((e) => e.text));
  const geo = await resolvePlacesCached(allNames);

  const events: GeoEvent[] = [];
  for (const r of rows) {
    const postedAt = r.sigma_messages?.posted_at;
    if (!postedAt) continue;
    const ts = new Date(postedAt).getTime();
    if (isNaN(ts) || ts < sinceMs) continue;

    // One event per (finding, distinct place).
    const placesSeen = new Set<string>();
    for (const e of (r.entities ?? []).filter((x) => x.type === 'location')) {
      const g: GeocodeResult | undefined = geo.get(e.text.trim());
      if (!g) continue;
      const place = g.displayName;
      if (placesSeen.has(place)) continue;
      placesSeen.add(place);
      events.push({
        msgKey: r.msg_key,
        channel: r.channel,
        place,
        lat: g.lat,
        lon: g.lon,
        postedAt: new Date(ts).toISOString(),
        topics: Array.from(new Set((r.topics ?? []).map((t) => canonicalizeEntity(t)))),
        sentiment: r.sentiment_score,
        snippet: (r.sigma_messages?.content ?? '').slice(0, 160),
      });
    }
  }

  return events.sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

// Haversine distance in km.
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
