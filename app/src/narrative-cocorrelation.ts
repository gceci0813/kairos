import { loadEvents } from './events';

// Cross-narrative correlation: builds a daily volume series for each narrative
// and computes pairwise Pearson correlation, surfacing narratives that move
// together (co-occurring storylines) or inversely. Aggregate narratives over
// time — no individuals.

export interface NarrativePair {
  a: string;
  b: string;
  correlation: number; // -1..1
  overlapDays: number;
  aTotal: number;
  bTotal: number;
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

export async function narrativeCoCorrelation(opts: {
  windowDays?: number;
  minTotal?: number;     // ignore narratives with too few mentions
  topN?: number;
}): Promise<{ positive: NarrativePair[]; negative: NarrativePair[]; narrativesConsidered: number }> {
  const windowDays = opts.windowDays ?? 365;
  const minTotal = opts.minTotal ?? 8;
  const events = await loadEvents(windowDays);

  // narrative → day → count
  const series = new Map<string, Map<string, number>>();
  const allDays = new Set<string>();
  for (const e of events) {
    const day = e.postedAt.slice(0, 10);
    allDays.add(day);
    for (const t of new Set(e.topics)) {
      if (!t) continue;
      if (!series.has(t)) series.set(t, new Map());
      const m = series.get(t)!;
      m.set(day, (m.get(day) ?? 0) + 1);
    }
  }

  const days = Array.from(allDays).sort();
  // Keep narratives with enough total volume.
  const narratives = Array.from(series.entries())
    .map(([topic, m]) => ({ topic, m, total: Array.from(m.values()).reduce((a, b) => a + b, 0) }))
    .filter((n) => n.total >= minTotal)
    .sort((a, b) => b.total - a.total)
    .slice(0, 40); // cap for O(n^2)

  // Vectorize each narrative over the full day axis.
  const vectors = narratives.map((n) => ({
    topic: n.topic,
    total: n.total,
    vec: days.map((d) => n.m.get(d) ?? 0),
  }));

  const pairs: NarrativePair[] = [];
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const a = vectors[i], b = vectors[j];
      const corr = pearson(a.vec, b.vec);
      // Overlap = days where both were active.
      let overlap = 0;
      for (let k = 0; k < days.length; k++) if (a.vec[k] > 0 && b.vec[k] > 0) overlap++;
      if (overlap < 2 || Math.abs(corr) < 0.3) continue;
      pairs.push({ a: a.topic, b: b.topic, correlation: Number(corr.toFixed(2)), overlapDays: overlap, aTotal: a.total, bTotal: b.total });
    }
  }

  const topN = opts.topN ?? 25;
  const positive = pairs.filter((p) => p.correlation > 0).sort((x, y) => y.correlation - x.correlation).slice(0, topN);
  const negative = pairs.filter((p) => p.correlation < 0).sort((x, y) => x.correlation - y.correlation).slice(0, topN);

  return { positive, negative, narrativesConsidered: vectors.length };
}
