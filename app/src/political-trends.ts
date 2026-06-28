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
  channel: string | null;
}

async function loadFindings(sinceDays: number, limit = 8000): Promise<FindingRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const { data, error } = await supabase
    .from('sigma_findings')
    .select('entities, topics, sentiment_score, coordination, analyzed_at, channel')
    .gte('analyzed_at', since)
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as FindingRow[];
}

// Herfindahl-Hirschman Index over source shares: 1 = single source (max
// concentration), → 0 = many evenly-distributed sources.
function herfindahl(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 1;
  return counts.reduce((a, c) => a + (c / total) ** 2, 0);
}

// Wilson score interval for a binomial proportion — well-behaved at small n,
// unlike the Wald interval. Returns [low, high] for share p over n samples.
function wilsonInterval(p: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 1];
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
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

export interface SourceMix {
  distinctSources: number;
  concentration: number;      // HHI, 1 = single source
  effectiveSources: number;   // 1/HHI, "effective number" of independent sources
  topSources: { source: string; count: number; share: number }[];
}

export interface EntityTrend {
  entity: string;
  totalVolume: number;
  overallSentiment: number;
  momentum: number;       // recent-half avg sentiment minus prior-half
  volumeMomentum: number; // recent-half volume / prior-half volume
  series: TimeSeriesPoint[];
  sourceMix: SourceMix;
  // Effective sample size after discounting for source concentration —
  // single-source signals get a much smaller n_eff than diverse ones.
  effectiveSampleSize: number;
}

export async function entitySentimentSeries(entity: string, sinceDays = 30): Promise<EntityTrend> {
  const findings = await loadFindings(sinceDays);
  return computeTrend(entity, findings, sinceDays);
}

function computeTrend(entity: string, findings: FindingRow[], sinceDays: number): EntityTrend {
  const midpoint = Date.now() - (sinceDays / 2) * 86400000;

  const byDay = new Map<string, { vol: number; sentSum: number; sentN: number }>();
  const bySource = new Map<string, number>();
  let recentVol = 0, priorVol = 0, recentSent = 0, recentSentN = 0, priorSent = 0, priorSentN = 0;

  for (const f of findings) {
    if (!mentionsEntity(f, entity)) continue;
    const day = f.analyzed_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { vol: 0, sentSum: 0, sentN: 0 });
    const b = byDay.get(day)!;
    b.vol++;
    const src = f.channel ?? 'unknown';
    bySource.set(src, (bySource.get(src) ?? 0) + 1);
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

  const sourceCounts = Array.from(bySource.entries());
  const hhi = herfindahl(sourceCounts.map(([, c]) => c));
  const topSources = sourceCounts
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count, share: totalVolume > 0 ? count / totalVolume : 0 }));

  // Effective sample size: discount raw volume by source concentration. A
  // single-source corpus (hhi→1) yields n_eff ≈ effectiveSources; a diverse
  // one keeps most of its volume.
  const effectiveSources = hhi > 0 ? 1 / hhi : 1;
  const effectiveSampleSize = totalVolume * (1 - hhi) + effectiveSources;

  return {
    entity,
    totalVolume,
    overallSentiment,
    momentum: recentAvg - priorAvg,
    volumeMomentum: priorVol > 0 ? recentVol / priorVol : (recentVol > 0 ? 2 : 1),
    series,
    sourceMix: {
      distinctSources: sourceCounts.length,
      concentration: hhi,
      effectiveSources,
      topSources,
    },
    effectiveSampleSize,
  };
}

export type Reliability = 'very low' | 'low' | 'moderate' | 'high';

export interface CandidateForecast {
  candidate: string;
  volume: number;
  effectiveSampleSize: number;
  shareOfVolume: number;
  shareCI: [number, number];      // 95% Wilson interval on share-of-voice
  avgSentiment: number;
  momentum: number;
  score: number;                  // weighted composite
  probability: number;            // normalized across the field
  probabilityCI: [number, number]; // CI propagated to the normalized estimate
  sourceMix: SourceMix;
  reliability: Reliability;
}

function reliabilityOf(effectiveN: number, distinctSources: number): Reliability {
  if (effectiveN < 5 || distinctSources < 2) return 'very low';
  if (effectiveN < 20 || distinctSources < 4) return 'low';
  if (effectiveN < 80) return 'moderate';
  return 'high';
}

// Election forecast: front-runner probability from weighted sentiment + share
// of volume across a candidate set, WITH 95% confidence intervals and
// source-mix weighting. This is sentiment-aggregation forecasting over public
// discourse (a sentiment-weighted share-of-voice estimate), not a prediction
// about any individual's private behavior and not a representative poll.
//
// sourceWeighted=true uses each candidate's effective sample size (volume
// discounted by source concentration) instead of raw volume, so a single
// loud source can't dominate the field.
export async function electionForecast(
  candidates: string[],
  sinceDays = 30,
  weights = { sentiment: 0.5, volume: 0.3, momentum: 0.2 },
  sourceWeighted = true
): Promise<{
  asOf: string;
  windowDays: number;
  sourceWeighted: boolean;
  field: CandidateForecast[];
  caveats: string[];
}> {
  const trends = await Promise.all(candidates.map((c) => entitySentimentSeries(c, sinceDays)));

  const volumeBasis = (t: EntityTrend) => (sourceWeighted ? t.effectiveSampleSize : t.totalVolume);
  const totalBasis = trends.reduce((a, t) => a + volumeBasis(t), 0) || 1;
  const totalRawVolume = trends.reduce((a, t) => a + t.totalVolume, 0) || 1;

  const raw = trends.map((t) => {
    const sentNorm = (t.overallSentiment + 1) / 2;
    const share = volumeBasis(t) / totalBasis;
    const momNorm = Math.max(0, Math.min(1, t.momentum + 0.5));
    const score = sentNorm * weights.sentiment + share * weights.volume + momNorm * weights.momentum;
    // CI on the raw share-of-voice, using effective sample size for n.
    const rawShare = t.totalVolume / totalRawVolume;
    const shareCI = wilsonInterval(rawShare, Math.max(1, Math.round(t.effectiveSampleSize)));
    return { trend: t, share, score, rawShare, shareCI };
  });

  const scoreSum = raw.reduce((a, r) => a + r.score, 0) || 1;

  const field: CandidateForecast[] = raw
    .map((r) => {
      // Propagate the share CI onto the probability proportionally (volume
      // contributes `weights.volume` of the composite), as a transparent
      // first-order band rather than a false-precision figure.
      const prob = r.score / scoreSum;
      const halfBand = ((r.shareCI[1] - r.shareCI[0]) / 2) * weights.volume;
      return {
        candidate: r.trend.entity,
        volume: r.trend.totalVolume,
        effectiveSampleSize: Math.round(r.trend.effectiveSampleSize * 10) / 10,
        shareOfVolume: r.rawShare,
        shareCI: r.shareCI,
        avgSentiment: r.trend.overallSentiment,
        momentum: r.trend.momentum,
        score: r.score,
        probability: prob,
        probabilityCI: [Math.max(0, prob - halfBand), Math.min(1, prob + halfBand)] as [number, number],
        sourceMix: r.trend.sourceMix,
        reliability: reliabilityOf(r.trend.effectiveSampleSize, r.trend.sourceMix.distinctSources),
      };
    })
    .sort((a, b) => b.probability - a.probability);

  const caveats = [
    'Sentiment-weighted share-of-voice over the ingested corpus — not a representative electorate sample.',
    'Skews toward whatever sources are collected; see each candidate’s sourceMix and reliability.',
    'Confidence intervals reflect sampling/source-concentration uncertainty only, not model or coverage bias.',
  ];
  if (field.some((c) => c.reliability === 'very low' || c.reliability === 'low')) {
    caveats.push('One or more candidates have low effective sample size or few distinct sources — treat their figures as indicative only.');
  }

  return { asOf: new Date().toISOString(), windowDays: sinceDays, sourceWeighted, field, caveats };
}
