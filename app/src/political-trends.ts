import { getSupabaseAdmin } from './supabase-admin';

// Aggregate political-trend analytics over the findings corpus. Treats named
// entities (candidates, parties, organizations, places) as TOPICS in public
// discourse — counts and sentiment of public mentions over time. No individual
// profiling, location, or per-person scoring.

interface FindingRow {
  entities: Array<{ text: string; type: string }> | null;
  topics: string[] | null;
  sentiment_score: number | null;
  coordination: { isFlagged?: boolean } | null;
  analyzed_at: string;
}

async function loadFindings(sinceDays: number, limit = 8000): Promise<FindingRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const { data, error } = await supabase
    .from('sigma_findings')
    .select('entities, topics, sentiment_score, coordination, analyzed_at')
    .gte('analyzed_at', since)
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as FindingRow[];
}

function mentionsEntity(f: FindingRow, name: string): boolean {
  const target = name.toLowerCase();
  if ((f.entities ?? []).some((e) => e.text.toLowerCase().includes(target))) return true;
  if ((f.topics ?? []).some((t) => t.toLowerCase().includes(target))) return true;
  return false;
}

export interface TimeSeriesPoint {
  day: string;
  volume: number;
  avgSentiment: number;
}

export interface EntityTrend {
  entity: string;
  totalVolume: number;
  overallSentiment: number;
  momentum: number;       // recent-half avg sentiment minus prior-half
  volumeMomentum: number; // recent-half volume / prior-half volume
  series: TimeSeriesPoint[];
}

export async function entitySentimentSeries(entity: string, sinceDays = 30): Promise<EntityTrend> {
  const findings = await loadFindings(sinceDays);
  const midpoint = Date.now() - (sinceDays / 2) * 86400000;

  const byDay = new Map<string, { vol: number; sentSum: number; sentN: number }>();
  let recentVol = 0, priorVol = 0, recentSent = 0, recentSentN = 0, priorSent = 0, priorSentN = 0;

  for (const f of findings) {
    if (!mentionsEntity(f, entity)) continue;
    const day = f.analyzed_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { vol: 0, sentSum: 0, sentN: 0 });
    const b = byDay.get(day)!;
    b.vol++;
    const recent = new Date(f.analyzed_at).getTime() >= midpoint;
    if (typeof f.sentiment_score === 'number') {
      b.sentSum += f.sentiment_score;
      b.sentN++;
      if (recent) { recentSent += f.sentiment_score; recentSentN++; } else { priorSent += f.sentiment_score; priorSentN++; }
    }
    if (recent) recentVol++; else priorVol++;
  }

  const series = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, b]) => ({ day, volume: b.vol, avgSentiment: b.sentN > 0 ? b.sentSum / b.sentN : 0 }));

  const totalVolume = series.reduce((a, p) => a + p.volume, 0);
  const allSentN = recentSentN + priorSentN;
  const overallSentiment = allSentN > 0 ? (recentSent + priorSent) / allSentN : 0;
  const recentAvg = recentSentN > 0 ? recentSent / recentSentN : overallSentiment;
  const priorAvg = priorSentN > 0 ? priorSent / priorSentN : overallSentiment;

  return {
    entity,
    totalVolume,
    overallSentiment,
    momentum: recentAvg - priorAvg,
    volumeMomentum: priorVol > 0 ? recentVol / priorVol : (recentVol > 0 ? 2 : 1),
    series,
  };
}

export interface CandidateForecast {
  candidate: string;
  volume: number;
  shareOfVolume: number;
  avgSentiment: number;
  momentum: number;
  score: number;       // weighted composite
  probability: number; // normalized across the field
}

// Election forecast: front-runner probability from weighted sentiment + share
// of volume across a candidate set. This is sentiment-aggregation forecasting
// over public discourse (like a sentiment-weighted poll), not a prediction
// about any individual's private behavior.
export async function electionForecast(
  candidates: string[],
  sinceDays = 30,
  weights = { sentiment: 0.5, volume: 0.3, momentum: 0.2 }
): Promise<{ asOf: string; windowDays: number; field: CandidateForecast[] }> {
  const trends = await Promise.all(candidates.map((c) => entitySentimentSeries(c, sinceDays)));
  const totalVolume = trends.reduce((a, t) => a + t.totalVolume, 0) || 1;

  // Raw score: normalized sentiment (0-1) * weight + share of volume * weight +
  // normalized momentum * weight.
  const raw = trends.map((t) => {
    const sentNorm = (t.overallSentiment + 1) / 2; // -1..1 → 0..1
    const share = t.totalVolume / totalVolume;
    const momNorm = Math.max(0, Math.min(1, (t.momentum + 0.5)));
    const score = sentNorm * weights.sentiment + share * weights.volume + momNorm * weights.momentum;
    return { trend: t, share, score };
  });

  const scoreSum = raw.reduce((a, r) => a + r.score, 0) || 1;

  const field: CandidateForecast[] = raw
    .map((r) => ({
      candidate: r.trend.entity,
      volume: r.trend.totalVolume,
      shareOfVolume: r.share,
      avgSentiment: r.trend.overallSentiment,
      momentum: r.trend.momentum,
      score: r.score,
      probability: r.score / scoreSum,
    }))
    .sort((a, b) => b.probability - a.probability);

  return { asOf: new Date().toISOString(), windowDays: sinceDays, field };
}
