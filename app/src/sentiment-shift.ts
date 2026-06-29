import { loadEvents } from './events';

// Sentiment-shift detection: for each region and narrative, compare average
// sentiment in a recent window vs a prior window, and flag direction flips
// (positive↔negative) and large-magnitude swings. Distinct from volume
// deviation — this tracks how the TONE of coverage changed. Aggregate.

export interface SentimentShift {
  key: string;
  kind: 'region' | 'narrative';
  priorSentiment: number;
  recentSentiment: number;
  delta: number;            // recent - prior
  flipped: boolean;         // crossed the neutral line
  priorN: number;
  recentN: number;
  direction: 'improving' | 'deteriorating';
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export async function sentimentShifts(opts: {
  windowDays?: number;
  recentDays?: number;
  minPerWindow?: number;
}): Promise<{ recentDays: number; regions: SentimentShift[]; narratives: SentimentShift[] }> {
  const windowDays = opts.windowDays ?? 90;
  const recentDays = opts.recentDays ?? 14;
  const minN = opts.minPerWindow ?? 3;
  const events = await loadEvents(windowDays);

  const days = events.map((e) => new Date(e.postedAt).getTime());
  if (days.length === 0) return { recentDays, regions: [], narratives: [] };
  const maxMs = Math.max(...days);
  const recentCutoff = maxMs - (recentDays - 1) * 86400000;

  function build(keyOf: (e: (typeof events)[number]) => string[], kind: 'region' | 'narrative'): SentimentShift[] {
    const recent = new Map<string, number[]>();
    const prior = new Map<string, number[]>();
    for (const e of events) {
      if (typeof e.sentiment !== 'number') continue;
      const isRecent = new Date(e.postedAt).getTime() >= recentCutoff;
      const bucket = isRecent ? recent : prior;
      for (const k of new Set(keyOf(e))) {
        if (!k) continue;
        if (!bucket.has(k)) bucket.set(k, []);
        bucket.get(k)!.push(e.sentiment);
      }
    }

    const out: SentimentShift[] = [];
    const keys = new Set([...recent.keys(), ...prior.keys()]);
    for (const key of keys) {
      const rVals = recent.get(key) ?? [];
      const pVals = prior.get(key) ?? [];
      if (rVals.length < minN || pVals.length < minN) continue;
      const r = avg(rVals), p = avg(pVals);
      const delta = r - p;
      if (Math.abs(delta) < 0.2) continue; // ignore noise
      out.push({
        key,
        kind,
        priorSentiment: Number(p.toFixed(2)),
        recentSentiment: Number(r.toFixed(2)),
        delta: Number(delta.toFixed(2)),
        flipped: Math.sign(p) !== Math.sign(r) && Math.abs(p) > 0.1 && Math.abs(r) > 0.1,
        priorN: pVals.length,
        recentN: rVals.length,
        direction: delta >= 0 ? 'improving' : 'deteriorating',
      });
    }
    return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  return {
    recentDays,
    regions: build((e) => [e.place], 'region').slice(0, 25),
    narratives: build((e) => e.topics, 'narrative').slice(0, 25),
  };
}
