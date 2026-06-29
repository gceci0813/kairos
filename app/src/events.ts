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
  analyzed_at: string;
  sigma_messages: { posted_at: string | null; content: string | null } | null;
}

export const eventDebug = { rows: 0, withLocationEntity: 0, geocoded: 0, inWindow: 0 };

export async function loadEvents(sinceDays: number, limit = 8000): Promise<GeoEvent[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');
  await ensureCanonicalMap();

  // No embedded join — fetch findings, then look up posted_at separately. The
  // !inner embed silently returned nothing here; a plain select is robust.
  const { data, error } = await supabase
    .from('sigma_findings')
    .select('msg_key, channel, entities, topics, sentiment_score, analyzed_at')
    .order('analyzed_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  eventDebug.rows = (data ?? []).length;

  const rows = (data ?? []) as any[];
  const sinceMs = Date.now() - sinceDays * 86400000;

  // Fetch post dates + content snippets for these findings in one batched
  // query (avoids the unreliable embedded join).
  const keys = rows.map((r) => r.msg_key);
  const msgByKey = new Map<string, { posted_at: string | null; content: string | null }>();
  for (let i = 0; i < keys.length; i += 500) {
    const slice = keys.slice(i, i + 500);
    const { data: msgs } = await supabase
      .from('sigma_messages')
      .select('msg_key, posted_at, content')
      .in('msg_key', slice);
    for (const m of msgs ?? []) msgByKey.set((m as any).msg_key, { posted_at: (m as any).posted_at, content: (m as any).content });
  }

  // Resolve all place names once via gazetteer + geocode cache.
  const allNames = rows.flatMap((r) => (r.entities ?? []).filter((e: any) => e.type === 'location').map((e: any) => e.text));
  const geo = await resolvePlacesCached(allNames);

  const events: GeoEvent[] = [];
  for (const r of rows) {
    const locs = (r.entities ?? []).filter((x: any) => x.type === 'location');
    if (locs.length > 0) eventDebug.withLocationEntity++;

    const msg = msgByKey.get(r.msg_key);
    // Event time = publication date when available, else analysis date.
    const eventDate = msg?.posted_at ?? r.analyzed_at;
    const ts = new Date(eventDate).getTime();
    if (isNaN(ts) || ts < sinceMs) continue;
    eventDebug.inWindow++;

    const placesSeen = new Set<string>();
    for (const e of locs) {
      const g: GeocodeResult | undefined = geo.get(e.text.trim());
      if (!g) continue;
      const place = g.displayName;
      if (placesSeen.has(place)) continue;
      placesSeen.add(place);
      eventDebug.geocoded++;
      events.push({
        msgKey: r.msg_key,
        channel: r.channel,
        place,
        lat: g.lat,
        lon: g.lon,
        postedAt: new Date(ts).toISOString(),
        topics: Array.from(new Set((r.topics ?? []).map((t: string) => canonicalizeEntity(t)))),
        sentiment: r.sentiment_score,
        snippet: (msg?.content ?? '').slice(0, 160),
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
