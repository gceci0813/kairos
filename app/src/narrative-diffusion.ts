import { getSupabaseAdmin } from './supabase-admin';
import { canonicalizeEntity } from './entity-resolution';
import { ensureCanonicalMap } from './entity-canonical';
import { lookupPlace } from './atlas-gazetteer';
import { resolvePlacesCached } from './geocoder';

// Narrative diffusion: for a given narrative/topic, trace how it spreads —
// which source carried it first (origin), the order sources and regions picked
// it up, and how fast it propagated. Aggregate over sources/places/time; no
// individuals.

export interface SourceAdoption {
  source: string;
  firstSeen: string;
  mentions: number;
  hoursAfterOrigin: number;
}

export interface RegionAdoption {
  place: string;
  firstSeen: string;
  mentions: number;
}

export interface DiffusionResult {
  topic: string;
  totalMentions: number;
  origin: { source: string; firstSeen: string } | null;
  span: { start: string; end: string; days: number };
  velocity: { day: string; count: number }[];
  sources: SourceAdoption[];
  regions: RegionAdoption[];
  reach: { distinctSources: number; distinctRegions: number };
}

interface Row {
  channel: string | null;
  topics: string[] | null;
  entities: Array<{ text: string; type: string }> | null;
  analyzed_at: string;
}

export async function narrativeDiffusion(topic: string, windowDays = 365): Promise<DiffusionResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');
  await ensureCanonicalMap();

  const target = canonicalizeEntity(topic).toLowerCase();
  const since = new Date(Date.now() - windowDays * 86400000).toISOString();

  // Paginate (Supabase 1000-row cap).
  const rows: Row[] = [];
  for (let from = 0; from < 8000; from += 1000) {
    const { data, error } = await supabase
      .from('sigma_findings')
      .select('channel, topics, entities, analyzed_at, sigma_messages!inner(posted_at)')
      .gte('analyzed_at', since)
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    for (const r of data as any[]) {
      rows.push({
        channel: r.channel,
        topics: r.topics,
        entities: r.entities,
        analyzed_at: (Array.isArray(r.sigma_messages) ? r.sigma_messages[0] : r.sigma_messages)?.posted_at ?? r.analyzed_at,
      });
    }
    if (data.length < 1000) break;
  }

  // Keep only findings carrying the target narrative.
  const matched = rows.filter((r) =>
    (r.topics ?? []).some((t) => canonicalizeEntity(t).toLowerCase() === target || t.toLowerCase().includes(topic.toLowerCase()))
  );

  if (matched.length === 0) {
    return {
      topic, totalMentions: 0, origin: null,
      span: { start: '', end: '', days: 0 }, velocity: [], sources: [], regions: [],
      reach: { distinctSources: 0, distinctRegions: 0 },
    };
  }

  // Resolve regions for the matched set.
  const names = matched.flatMap((r) => (r.entities ?? []).filter((e) => e.type === 'location').map((e) => e.text));
  const geo = await resolvePlacesCached(names);

  const bySource = new Map<string, { first: number; count: number }>();
  const byRegion = new Map<string, { first: number; count: number }>();
  const byDay = new Map<string, number>();
  let minTs = Infinity, maxTs = -Infinity;

  for (const r of matched) {
    const ts = new Date(r.analyzed_at).getTime();
    if (isNaN(ts)) continue;
    minTs = Math.min(minTs, ts);
    maxTs = Math.max(maxTs, ts);

    const src = r.channel ?? 'unknown';
    const s = bySource.get(src) ?? { first: ts, count: 0 };
    s.first = Math.min(s.first, ts); s.count++;
    bySource.set(src, s);

    const day = new Date(ts).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);

    const places = new Set<string>();
    for (const e of (r.entities ?? []).filter((x) => x.type === 'location')) {
      const g = geo.get(e.text.trim()) ?? (lookupPlace(e.text) ? { displayName: lookupPlace(e.text)!.canonical } as any : null);
      if (!g) continue;
      if (places.has(g.displayName)) continue;
      places.add(g.displayName);
      const rr = byRegion.get(g.displayName) ?? { first: ts, count: 0 };
      rr.first = Math.min(rr.first, ts); rr.count++;
      byRegion.set(g.displayName, rr);
    }
  }

  const originEntry = Array.from(bySource.entries()).sort((a, b) => a[1].first - b[1].first)[0];
  const originTs = originEntry ? originEntry[1].first : minTs;

  const sources: SourceAdoption[] = Array.from(bySource.entries())
    .map(([source, v]) => ({
      source,
      firstSeen: new Date(v.first).toISOString(),
      mentions: v.count,
      hoursAfterOrigin: Number(((v.first - originTs) / 3600000).toFixed(1)),
    }))
    .sort((a, b) => a.hoursAfterOrigin - b.hoursAfterOrigin);

  const regions: RegionAdoption[] = Array.from(byRegion.entries())
    .map(([place, v]) => ({ place, firstSeen: new Date(v.first).toISOString(), mentions: v.count }))
    .sort((a, b) => a.firstSeen.localeCompare(b.firstSeen));

  const velocity = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ day, count }));

  return {
    topic,
    totalMentions: matched.length,
    origin: originEntry ? { source: originEntry[0], firstSeen: new Date(originTs).toISOString() } : null,
    span: {
      start: new Date(minTs).toISOString(),
      end: new Date(maxTs).toISOString(),
      days: Number(((maxTs - minTs) / 86400000).toFixed(1)),
    },
    velocity,
    sources: sources.slice(0, 30),
    regions: regions.slice(0, 30),
    reach: { distinctSources: bySource.size, distinctRegions: byRegion.size },
  };
}
