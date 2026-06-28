import { getSupabaseAdmin } from './supabase-admin';
import { canonicalizeEntity } from './entity-resolution';
import { ensureCanonicalMap } from './entity-canonical';

// Emerging-narrative detection: surfaces topics whose recent share of
// discourse is rising sharply versus their own baseline — proactive signal of
// new/accelerating narratives, not just ones you already query for.

export interface EmergingNarrative {
  topic: string;
  recentCount: number;
  priorCount: number;
  growth: number;        // recent/prior ratio
  recentSentiment: number;
  status: 'new' | 'surging' | 'rising';
}

export async function emergingNarratives(sinceDays = 14, minRecent = 3): Promise<{
  windowDays: number;
  narratives: EmergingNarrative[];
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');
  await ensureCanonicalMap();

  // Key off the message's POST date (when published), not analyzed_at (when
  // processed) — otherwise a backfill makes everything look "new". Filter the
  // window in JS to avoid unreliable filtering on embedded columns.
  const sinceMs = Date.now() - sinceDays * 86400000;
  const { data, error } = await supabase
    .from('sigma_findings')
    .select('topics, sentiment_score, sigma_messages!inner(posted_at)')
    .order('analyzed_at', { ascending: false })
    .limit(8000);
  if (error) throw new Error(error.message);

  const midpoint = Date.now() - (sinceDays / 2) * 86400000;
  const stats = new Map<string, { recent: number; prior: number; recentSentSum: number; recentSentN: number }>();

  for (const f of data ?? []) {
    const postedAt = (f as any).sigma_messages?.posted_at;
    if (!postedAt) continue;
    const postedMs = new Date(postedAt).getTime();
    if (isNaN(postedMs) || postedMs < sinceMs) continue;
    const recent = postedMs >= midpoint;
    const sent = (f as any).sentiment_score;
    for (const t of new Set(((f as any).topics ?? []).map((x: string) => canonicalizeEntity(x)))) {
      const topic = t as string;
      if (!stats.has(topic)) stats.set(topic, { recent: 0, prior: 0, recentSentSum: 0, recentSentN: 0 });
      const s = stats.get(topic)!;
      if (recent) {
        s.recent++;
        if (typeof sent === 'number') { s.recentSentSum += sent; s.recentSentN++; }
      } else {
        s.prior++;
      }
    }
  }

  const narratives: EmergingNarrative[] = [];
  for (const [topic, s] of stats) {
    if (s.recent < minRecent) continue;
    const growth = s.prior > 0 ? s.recent / s.prior : Infinity;
    // Only surface genuinely accelerating narratives.
    if (growth < 1.5 && s.prior > 0) continue;
    const status: EmergingNarrative['status'] =
      s.prior === 0 ? 'new' : growth >= 3 ? 'surging' : 'rising';
    narratives.push({
      topic,
      recentCount: s.recent,
      priorCount: s.prior,
      growth: growth === Infinity ? s.recent : Number(growth.toFixed(2)),
      recentSentiment: s.recentSentN > 0 ? s.recentSentSum / s.recentSentN : 0,
      status,
    });
  }

  narratives.sort((a, b) => {
    // New first, then by growth, then recent volume.
    const order = { new: 0, surging: 1, rising: 2 } as const;
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return b.growth - a.growth || b.recentCount - a.recentCount;
  });

  return { windowDays: sinceDays, narratives: narratives.slice(0, 40) };
}
