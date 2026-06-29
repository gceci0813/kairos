import { loadEvents } from './events';

// Comparative baseline / trend-deviation engine. Builds per-entity daily
// volume series (regions and narratives), computes a rolling baseline
// (mean + stddev over the historical window excluding the most recent period),
// and flags how abnormal the recent period is via a z-score. Answers "what is
// unusual right now vs the historical norm" — aggregate places/narratives.

export interface Deviation {
  key: string;
  kind: 'region' | 'narrative';
  recentMean: number;     // avg daily volume in the recent window
  baselineMean: number;   // avg daily volume in the baseline window
  baselineStd: number;
  z: number;              // standardized deviation of recent vs baseline
  direction: 'spike' | 'drop' | 'normal';
  recentTotal: number;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function std(xs: number[], m: number): number {
  if (xs.length < 2) return 0;
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

export async function trendDeviations(opts: {
  windowDays?: number;     // total history to consider
  recentDays?: number;     // the "now" period compared against baseline
  minBaselineDays?: number;
}): Promise<{ recentDays: number; baselineDays: number; regions: Deviation[]; narratives: Deviation[] }> {
  const windowDays = opts.windowDays ?? 180;
  const recentDays = opts.recentDays ?? 7;
  const events = await loadEvents(windowDays);

  // Determine the date span actually present.
  const allDays = Array.from(new Set(events.map((e) => dayKey(e.postedAt)))).sort();
  if (allDays.length === 0) return { recentDays, baselineDays: 0, regions: [], narratives: [] };

  const maxDay = allDays[allDays.length - 1];
  const maxMs = new Date(maxDay).getTime();
  const recentCutoff = maxMs - (recentDays - 1) * 86400000;

  function build(map: (e: (typeof events)[number]) => string[], kind: 'region' | 'narrative'): Deviation[] {
    // key → day → count
    const series = new Map<string, Map<string, number>>();
    for (const e of events) {
      const day = dayKey(e.postedAt);
      for (const k of new Set(map(e))) {
        if (!k) continue;
        if (!series.has(k)) series.set(k, new Map());
        const m = series.get(k)!;
        m.set(day, (m.get(day) ?? 0) + 1);
      }
    }

    const out: Deviation[] = [];
    for (const [key, days] of series) {
      const recentVals: number[] = [];
      const baseVals: number[] = [];
      for (const day of allDays) {
        const c = days.get(day) ?? 0;
        if (new Date(day).getTime() >= recentCutoff) recentVals.push(c);
        else baseVals.push(c);
      }
      if (baseVals.length < (opts.minBaselineDays ?? 14)) continue;
      const bMean = mean(baseVals);
      const bStd = std(baseVals, bMean);
      const rMean = mean(recentVals);
      const recentTotal = recentVals.reduce((a, b) => a + b, 0);
      if (recentTotal < 3) continue; // ignore trivially small
      const z = bStd > 0 ? (rMean - bMean) / bStd : (rMean > bMean ? 3 : 0);
      out.push({
        key,
        kind,
        recentMean: Number(rMean.toFixed(2)),
        baselineMean: Number(bMean.toFixed(2)),
        baselineStd: Number(bStd.toFixed(2)),
        z: Number(z.toFixed(2)),
        direction: z >= 2 ? 'spike' : z <= -2 ? 'drop' : 'normal',
        recentTotal,
      });
    }
    return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  }

  const regions = build((e) => [e.place], 'region');
  const narratives = build((e) => e.topics, 'narrative');
  const baselineDays = allDays.filter((d) => new Date(d).getTime() < recentCutoff).length;

  return { recentDays, baselineDays, regions: regions.slice(0, 30), narratives: narratives.slice(0, 30) };
}
