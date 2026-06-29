import { GeoEvent, loadEvents } from './events';

// Event-timeline mapping: time-bucketed event series with optional place/topic
// filtering, plus simple temporal pattern detection (bursts).

export interface TimelineBucket {
  bucket: string;        // ISO date or hour
  count: number;
  places: Record<string, number>;
  topTopics: string[];
  avgSentiment: number;
}

export interface TimelinePattern {
  type: 'burst';
  bucket: string;
  count: number;
  ratioToBaseline: number;
}

function bucketKey(iso: string, granularity: 'hour' | 'day'): string {
  return granularity === 'hour' ? iso.slice(0, 13) + ':00' : iso.slice(0, 10);
}

export async function eventTimeline(opts: {
  sinceDays: number;
  place?: string;
  topic?: string;
  granularity?: 'hour' | 'day';
}): Promise<{ events: GeoEvent[]; buckets: TimelineBucket[]; patterns: TimelinePattern[] }> {
  const granularity = opts.granularity ?? 'day';
  let events = await loadEvents(opts.sinceDays);

  if (opts.place) {
    const p = opts.place.toLowerCase();
    events = events.filter((e) => e.place.toLowerCase().includes(p));
  }
  if (opts.topic) {
    const t = opts.topic.toLowerCase();
    events = events.filter((e) => e.topics.some((x) => x.toLowerCase().includes(t)));
  }

  const byBucket = new Map<string, { count: number; places: Map<string, number>; topics: Map<string, number>; sentSum: number; sentN: number }>();
  for (const e of events) {
    const k = bucketKey(e.postedAt, granularity);
    if (!byBucket.has(k)) byBucket.set(k, { count: 0, places: new Map(), topics: new Map(), sentSum: 0, sentN: 0 });
    const b = byBucket.get(k)!;
    b.count++;
    b.places.set(e.place, (b.places.get(e.place) ?? 0) + 1);
    for (const t of e.topics) b.topics.set(t, (b.topics.get(t) ?? 0) + 1);
    if (typeof e.sentiment === 'number') { b.sentSum += e.sentiment; b.sentN++; }
  }

  const buckets: TimelineBucket[] = Array.from(byBucket.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([bucket, b]) => ({
      bucket,
      count: b.count,
      places: Object.fromEntries(Array.from(b.places.entries()).sort((x, y) => y[1] - x[1]).slice(0, 8)),
      topTopics: Array.from(b.topics.entries()).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([t]) => t),
      avgSentiment: b.sentN > 0 ? b.sentSum / b.sentN : 0,
    }));

  // Burst detection: buckets whose count exceeds 2x the rolling mean.
  const counts = buckets.map((b) => b.count);
  const mean = counts.length ? counts.reduce((a, c) => a + c, 0) / counts.length : 0;
  const patterns: TimelinePattern[] = buckets
    .filter((b) => mean > 0 && b.count >= 2 * mean && b.count >= 3)
    .map((b) => ({ type: 'burst' as const, bucket: b.bucket, count: b.count, ratioToBaseline: Number((b.count / mean).toFixed(1)) }))
    .sort((a, b) => b.ratioToBaseline - a.ratioToBaseline);

  return { events: events.slice(0, 500), buckets, patterns };
}
