import { entitySentimentSeries } from './political-trends';
import { corroborate } from './corroboration';
import { narrativeDiffusion } from './narrative-diffusion';

// Unified cross-engine lookup: one query (place / narrative / public entity) →
// a consolidated intelligence view fused from multiple engines. Aggregate
// public-discourse analysis of a topic/place — not individual profiling.

export interface LookupResult {
  query: string;
  summary: {
    mentions: number;
    overallSentiment: number;
    sentimentMomentum: number;
    distinctSources: number;
    reliability: string;
  };
  trend: { day: string; volume: number; avgSentiment: number }[];
  topSources: { source: string; count: number }[];
  diffusion: {
    origin: { source: string; firstSeen: string } | null;
    reach: { distinctSources: number; distinctRegions: number };
    regionsReached: string[];
  };
  corroboration: {
    strongestEvents: { summary: string; sourceCount: number; corroboration: string }[];
  };
}

function reliabilityOf(n: number, sources: number): string {
  if (n < 5 || sources < 2) return 'very low';
  if (n < 20 || sources < 4) return 'low';
  if (n < 80) return 'moderate';
  return 'high';
}

export async function unifiedLookup(query: string, windowDays = 1825): Promise<LookupResult> {
  // Fan out to the engines in parallel; each is independently resilient.
  const [trend, corrob, diffusion] = await Promise.all([
    entitySentimentSeries(query, { sinceDays: windowDays }).catch(() => null),
    corroborate(query, windowDays).catch(() => null),
    narrativeDiffusion(query, windowDays).catch(() => null),
  ]);

  const mentions = trend?.totalVolume ?? 0;
  const sources = trend?.sourceMix?.distinctSources ?? diffusion?.reach.distinctSources ?? 0;

  return {
    query,
    summary: {
      mentions,
      overallSentiment: Number((trend?.overallSentiment ?? 0).toFixed(2)),
      sentimentMomentum: Number((trend?.momentum ?? 0).toFixed(2)),
      distinctSources: sources,
      reliability: reliabilityOf(mentions, sources),
    },
    trend: (trend?.series ?? []).slice(-60),
    topSources: (trend?.sourceMix?.topSources ?? []).map((s: any) => ({ source: s.source, count: s.count })),
    diffusion: {
      origin: diffusion?.origin ?? null,
      reach: diffusion?.reach ?? { distinctSources: 0, distinctRegions: 0 },
      regionsReached: (diffusion?.regions ?? []).map((r: any) => r.place).slice(0, 12),
    },
    corroboration: {
      strongestEvents: (corrob?.events ?? []).slice(0, 6).map((e: any) => ({
        summary: e.summary,
        sourceCount: e.sourceCount,
        corroboration: e.corroboration,
      })),
    },
  };
}
