import { GeoEvent, distanceKm, loadEvents } from './events';

// Event correlation engine: links distinct events that are close in TIME,
// related in CONTENT (shared narratives), and optionally near in SPACE, to
// surface event chains / coordinated activity across locations. Aggregate
// event-level correlation — places, times, narratives; not individuals.

export interface EventLink {
  a: { place: string; postedAt: string; snippet: string };
  b: { place: string; postedAt: string; snippet: string };
  hoursApart: number;
  km: number | null;
  sharedTopics: string[];
  score: number; // 0-1
}

export interface EventCluster {
  topics: string[];
  places: string[];
  eventCount: number;
  spanHours: number;
  start: string;
  end: string;
  crossLocation: boolean;
}

function topicOverlap(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((t) => t.toLowerCase()));
  return a.filter((t) => setB.has(t.toLowerCase()));
}

export async function correlateEvents(opts: {
  sinceDays: number;
  maxHoursApart?: number;
  topic?: string;
}): Promise<{ links: EventLink[]; clusters: EventCluster[] }> {
  const maxHours = opts.maxHoursApart ?? 48;
  let events = await loadEvents(opts.sinceDays);
  if (opts.topic) {
    const t = opts.topic.toLowerCase();
    events = events.filter((e) => e.topics.some((x) => x.toLowerCase().includes(t)));
  }
  // Cap for O(n^2) safety.
  events = events.slice(0, 600);

  const links: EventLink[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      const hours = Math.abs(new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime()) / 3600000;
      if (hours > maxHours) continue;
      const shared = topicOverlap(a.topics, b.topics);
      if (shared.length === 0) continue; // require content relation
      if (a.place === b.place && a.msgKey === b.msgKey) continue;

      const km = a.lat && b.lat ? distanceKm(a.lat, a.lon, b.lat, b.lon) : null;
      // Score: more shared topics + closer in time → stronger. Cross-location
      // correlations (different places) are the interesting signal.
      const timeScore = 1 - hours / maxHours;
      const topicScore = Math.min(1, shared.length / 3);
      const crossBonus = a.place !== b.place ? 0.15 : 0;
      const score = Math.min(1, timeScore * 0.45 + topicScore * 0.4 + crossBonus);

      if (score >= 0.4) {
        links.push({
          a: { place: a.place, postedAt: a.postedAt, snippet: a.snippet },
          b: { place: b.place, postedAt: b.postedAt, snippet: b.snippet },
          hoursApart: Number(hours.toFixed(1)),
          km: km != null ? Math.round(km) : null,
          sharedTopics: shared,
          score: Number(score.toFixed(2)),
        });
      }
    }
  }
  links.sort((x, y) => y.score - x.score);

  // Cluster by dominant shared topic (connected via links) — a light event-chain view.
  const clusters = buildClusters(events, opts.topic);

  return { links: links.slice(0, 100), clusters };
}

function buildClusters(events: GeoEvent[], _topic?: string): EventCluster[] {
  // Group events by their top topic, then summarize each group's temporal/geo spread.
  const byTopic = new Map<string, GeoEvent[]>();
  for (const e of events) {
    const key = e.topics[0];
    if (!key) continue;
    if (!byTopic.has(key)) byTopic.set(key, []);
    byTopic.get(key)!.push(e);
  }

  const clusters: EventCluster[] = [];
  for (const [topic, evs] of byTopic) {
    if (evs.length < 3) continue;
    const times = evs.map((e) => new Date(e.postedAt).getTime()).sort((a, b) => a - b);
    const places = Array.from(new Set(evs.map((e) => e.place)));
    const spanHours = (times[times.length - 1] - times[0]) / 3600000;
    clusters.push({
      topics: [topic],
      places: places.slice(0, 12),
      eventCount: evs.length,
      spanHours: Number(spanHours.toFixed(1)),
      start: new Date(times[0]).toISOString(),
      end: new Date(times[times.length - 1]).toISOString(),
      crossLocation: places.length > 1,
    });
  }
  return clusters.sort((a, b) => b.eventCount - a.eventCount).slice(0, 30);
}
