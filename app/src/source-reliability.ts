import { getSupabaseAdmin } from './supabase-admin';
import { dedupFindings } from './entity-resolution';

// Source-reliability scoring: rates each source (channel/outlet) by how often
// its content is independently corroborated by OTHER sources. A source whose
// stories consistently appear across many independent outlets scores higher
// than one publishing claims nobody else carries. Aggregate over sources.

export interface SourceReliability {
  source: string;
  messages: number;
  corroborated: number;       // # of its messages echoed by ≥1 other source
  corroborationRate: number;  // 0-1
  avgCorroboratingSources: number;
  reliability: number;        // 0-1 composite
  rating: 'unverified' | 'low' | 'moderate' | 'high';
}

function rate(r: number): SourceReliability['rating'] {
  if (r >= 0.7) return 'high';
  if (r >= 0.45) return 'moderate';
  if (r >= 0.2) return 'low';
  return 'unverified';
}

export async function sourceReliability(limit = 6000): Promise<{ sources: SourceReliability[]; clustersAnalyzed: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');

  // Pull messages (paginate around the 1000-row cap).
  const rows: { channel: string | null; content: string | null }[] = [];
  for (let from = 0; from < limit; from += 1000) {
    const { data, error } = await supabase
      .from('sigma_messages')
      .select('channel, content')
      .order('posted_at', { ascending: false })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    rows.push(...(data as any[]));
    if (data.length < 1000) break;
  }

  // Cluster near-duplicate content across sources.
  const clusters = dedupFindings(rows, 0.5);

  // Per-source tallies.
  const perSource = new Map<string, { messages: number; corroborated: number; corrSourceSum: number }>();

  for (const row of rows) {
    const src = row.channel ?? 'unknown';
    if (!perSource.has(src)) perSource.set(src, { messages: 0, corroborated: 0, corrSourceSum: 0 });
    perSource.get(src)!.messages++;
  }

  // For each multi-source cluster, every member source gets credit:
  // corroborated++ and += (otherSourceCount).
  for (const c of clusters) {
    const sources = c.sources;
    if (sources.length < 2) continue; // single-source = no corroboration
    for (const src of sources) {
      const s = perSource.get(src);
      if (!s) continue;
      s.corroborated++;
      s.corrSourceSum += sources.length - 1;
    }
  }

  const sources: SourceReliability[] = Array.from(perSource.entries())
    .filter(([, v]) => v.messages >= 2)
    .map(([source, v]) => {
      const corroborationRate = v.messages > 0 ? v.corroborated / v.messages : 0;
      const avgCorr = v.corroborated > 0 ? v.corrSourceSum / v.corroborated : 0;
      // Composite: corroboration rate dominates; reach (avg corroborating
      // sources) and volume provide a modest lift.
      const reliability = Math.min(
        1,
        corroborationRate * 0.7 + Math.min(1, avgCorr / 4) * 0.2 + Math.min(1, v.messages / 50) * 0.1
      );
      return {
        source,
        messages: v.messages,
        corroborated: v.corroborated,
        corroborationRate: Number(corroborationRate.toFixed(3)),
        avgCorroboratingSources: Number(avgCorr.toFixed(2)),
        reliability: Number(reliability.toFixed(3)),
        rating: rate(reliability),
      };
    })
    .sort((a, b) => b.reliability - a.reliability);

  return { sources, clustersAnalyzed: clusters.length };
}

// Convenience: reliability lookup map (source → score), cached briefly so
// other engines can weight by it without recomputing.
let cached: { at: number; map: Map<string, number> } | null = null;
export async function reliabilityMap(): Promise<Map<string, number>> {
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.map;
  const { sources } = await sourceReliability();
  const map = new Map(sources.map((s) => [s.source, s.reliability]));
  cached = { at: Date.now(), map };
  return map;
}
