import { getSupabaseAdmin } from './supabase-admin';
import { lookupPlace } from './atlas-gazetteer';

// Aggregate forecasting/analytics over the findings corpus, keyed on REGIONS
// (places) and NARRATIVES (topics) — never individuals. Powers ORACLE's
// regional risk, momentum, anomaly detection, and scenario modeling.

export type RiskLevel = 'LOW' | 'GUARDED' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface RiskThresholds {
  guarded: number;
  elevated: number;
  high: number;
  critical: number;
}

export const DEFAULT_THRESHOLDS: RiskThresholds = {
  guarded: 0.25,
  elevated: 0.45,
  high: 0.65,
  critical: 0.82,
};

function toRiskLevel(score: number, t: RiskThresholds): RiskLevel {
  if (score >= t.critical) return 'CRITICAL';
  if (score >= t.high) return 'HIGH';
  if (score >= t.elevated) return 'ELEVATED';
  if (score >= t.guarded) return 'GUARDED';
  return 'LOW';
}

interface FindingRow {
  entities: Array<{ text: string; type: string }> | null;
  topics: string[] | null;
  sentiment_score: number | null;
  coordination: { isFlagged?: boolean; score?: number } | null;
  analyzed_at: string;
}

async function loadFindings(sinceDays: number, limit = 5000): Promise<FindingRow[]> {
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

interface Bucket {
  volume: number;
  sentSum: number;
  sentN: number;
  coordFlags: number;
  recentVolume: number;
  priorVolume: number;
  recentSentSum: number;
  recentSentN: number;
  priorSentSum: number;
  priorSentN: number;
}

function emptyBucket(): Bucket {
  return { volume: 0, sentSum: 0, sentN: 0, coordFlags: 0, recentVolume: 0, priorVolume: 0, recentSentSum: 0, recentSentN: 0, priorSentSum: 0, priorSentN: 0 };
}

export interface RegionalAssessment {
  key: string;
  kind: 'region' | 'narrative';
  volume: number;
  avgSentiment: number;
  momentum: number;       // sentiment change recent vs prior (negative = worsening)
  volumeAnomaly: number;  // z-like ratio of recent vs prior volume
  coordinationRate: number;
  riskScore: number;      // 0-1 composite
  riskLevel: RiskLevel;
  drivers: string[];
}

// Split window in half: "recent" vs "prior" for momentum/anomaly.
export async function regionalAssessments(
  sinceDays = 30,
  thresholds: RiskThresholds = DEFAULT_THRESHOLDS
): Promise<{ regions: RegionalAssessment[]; narratives: RegionalAssessment[] }> {
  const findings = await loadFindings(sinceDays);
  const midpoint = Date.now() - (sinceDays / 2) * 86400000;

  const regions = new Map<string, Bucket>();
  const narratives = new Map<string, Bucket>();

  const add = (map: Map<string, Bucket>, key: string, f: FindingRow, recent: boolean) => {
    if (!map.has(key)) map.set(key, emptyBucket());
    const b = map.get(key)!;
    b.volume++;
    if (typeof f.sentiment_score === 'number') {
      b.sentSum += f.sentiment_score;
      b.sentN++;
    }
    if (f.coordination?.isFlagged) b.coordFlags++;
    if (recent) {
      b.recentVolume++;
      if (typeof f.sentiment_score === 'number') { b.recentSentSum += f.sentiment_score; b.recentSentN++; }
    } else {
      b.priorVolume++;
      if (typeof f.sentiment_score === 'number') { b.priorSentSum += f.sentiment_score; b.priorSentN++; }
    }
  };

  for (const f of findings) {
    const recent = new Date(f.analyzed_at).getTime() >= midpoint;
    const places = new Set(
      (f.entities ?? [])
        .filter((e) => e.type === 'location')
        .map((e) => lookupPlace(e.text)?.canonical)
        .filter((x): x is string => !!x)
    );
    for (const p of places) add(regions, p, f, recent);
    for (const t of new Set(f.topics ?? [])) add(narratives, t, f, recent);
  }

  const assess = (map: Map<string, Bucket>, kind: 'region' | 'narrative'): RegionalAssessment[] => {
    const out: RegionalAssessment[] = [];
    for (const [key, b] of map) {
      if (b.volume < 2) continue;
      const avgSentiment = b.sentN > 0 ? b.sentSum / b.sentN : 0;
      const recentAvg = b.recentSentN > 0 ? b.recentSentSum / b.recentSentN : avgSentiment;
      const priorAvg = b.priorSentN > 0 ? b.priorSentSum / b.priorSentN : avgSentiment;
      const momentum = recentAvg - priorAvg; // negative = sentiment worsening
      const volumeAnomaly = b.priorVolume > 0 ? b.recentVolume / b.priorVolume : (b.recentVolume > 0 ? 2 : 1);
      const coordinationRate = b.volume > 0 ? b.coordFlags / b.volume : 0;

      // Composite risk: negative sentiment + worsening momentum + volume surge
      // + coordination presence. Each normalized to 0-1.
      const negSent = Math.max(0, -avgSentiment);                 // 0..1
      const worsening = Math.max(0, -momentum);                   // 0..~2 → clamp
      const surge = Math.max(0, Math.min(1, (volumeAnomaly - 1))); // >1 means growth
      const drivers: string[] = [];
      if (negSent > 0.3) drivers.push(`Negative sentiment (${avgSentiment.toFixed(2)})`);
      if (worsening > 0.1) drivers.push(`Worsening momentum (${momentum.toFixed(2)})`);
      if (surge > 0.2) drivers.push(`Volume surge (${volumeAnomaly.toFixed(1)}x)`);
      if (coordinationRate > 0.1) drivers.push(`Coordination signals (${(coordinationRate * 100).toFixed(0)}%)`);

      const riskScore = Math.min(
        1,
        negSent * 0.4 + Math.min(1, worsening) * 0.25 + surge * 0.2 + coordinationRate * 0.15
      );

      out.push({
        key,
        kind,
        volume: b.volume,
        avgSentiment,
        momentum,
        volumeAnomaly,
        coordinationRate,
        riskScore,
        riskLevel: toRiskLevel(riskScore, thresholds),
        drivers,
      });
    }
    return out.sort((a, b) => b.riskScore - a.riskScore);
  };

  return { regions: assess(regions, 'region'), narratives: assess(narratives, 'narrative') };
}

// Anomaly detection: which regions/narratives deviate most from their own
// baseline volume (recent vs prior half of the window).
export interface Anomaly {
  key: string;
  kind: 'region' | 'narrative';
  recentVolume: number;
  priorVolume: number;
  ratio: number;
  direction: 'spike' | 'drop';
}

export async function detectAnomalies(sinceDays = 30, minVolume = 4): Promise<Anomaly[]> {
  const { regions, narratives } = await regionalAssessments(sinceDays);
  const all = [...regions, ...narratives];
  return all
    .filter((a) => a.volume >= minVolume && (a.volumeAnomaly >= 1.8 || a.volumeAnomaly <= 0.4))
    .map((a) => ({
      key: a.key,
      kind: a.kind,
      recentVolume: Math.round((a.volume * a.volumeAnomaly) / (1 + a.volumeAnomaly)),
      priorVolume: Math.round(a.volume / (1 + a.volumeAnomaly)),
      ratio: a.volumeAnomaly,
      direction: a.volumeAnomaly >= 1.8 ? ('spike' as const) : ('drop' as const),
    }))
    .sort((a, b) => Math.abs(Math.log(b.ratio || 0.01)) - Math.abs(Math.log(a.ratio || 0.01)));
}

// Scenario modeling: apply hypothetical multipliers to a region/narrative's
// drivers and project the resulting risk level. Pure parametric model — no
// individual data, transparent math the caller can inspect.
export interface ScenarioInput {
  baseline: RegionalAssessment;
  sentimentDelta?: number;   // additive shift to avgSentiment, e.g. -0.3
  volumeMultiplier?: number; // e.g. 2 = doubling
  coordinationDelta?: number;
}

export function modelScenario(input: ScenarioInput, thresholds: RiskThresholds = DEFAULT_THRESHOLDS) {
  const b = input.baseline;
  const newSentiment = Math.max(-1, Math.min(1, b.avgSentiment + (input.sentimentDelta ?? 0)));
  const newVolAnomaly = b.volumeAnomaly * (input.volumeMultiplier ?? 1);
  const newCoord = Math.max(0, Math.min(1, b.coordinationRate + (input.coordinationDelta ?? 0)));

  const negSent = Math.max(0, -newSentiment);
  const worsening = Math.max(0, -(b.momentum));
  const surge = Math.max(0, Math.min(1, newVolAnomaly - 1));
  const riskScore = Math.min(1, negSent * 0.4 + Math.min(1, worsening) * 0.25 + surge * 0.2 + newCoord * 0.15);

  return {
    projectedRiskScore: riskScore,
    projectedRiskLevel: toRiskLevel(riskScore, thresholds),
    baselineRiskLevel: b.riskLevel,
    assumptions: {
      sentiment: newSentiment,
      volumeAnomaly: newVolAnomaly,
      coordinationRate: newCoord,
    },
  };
}
