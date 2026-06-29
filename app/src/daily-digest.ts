import { evaluateAlerts } from './alerting';
import { emergingNarratives } from './emerging-narratives';
import { eventTimeline } from './event-timeline';
import { narrativeCoCorrelation } from './narrative-cocorrelation';

// Unified "what changed" digest: fuses every analytical signal into one ranked
// brief. Aggregate regions/narratives/events — the capstone view that answers
// "what should an analyst look at first."

export interface DigestItem {
  rank: number;
  signal: 'alert' | 'emerging' | 'burst' | 'co-movement';
  severity: 'critical' | 'warning' | 'info';
  headline: string;
  detail: string;
  score: number;
}

export interface Digest {
  generatedAt: string;
  windowDays: number;
  headline: string;
  itemCount: number;
  items: DigestItem[];
}

const SEV_WEIGHT = { critical: 1.0, warning: 0.65, info: 0.35 } as const;

export async function buildDigest(windowDays = 14): Promise<Digest> {
  const [alerts, emerging, timeline, coMove] = await Promise.all([
    evaluateAlerts({ windowDays }),
    emergingNarratives(windowDays),
    eventTimeline({ sinceDays: Math.max(60, windowDays * 6), granularity: 'day' }),
    narrativeCoCorrelation({ windowDays: Math.max(120, windowDays * 8) }),
  ]);

  const raw: Omit<DigestItem, 'rank'>[] = [];

  // 1) Fused alerts (risk/anomaly/deviation/sentiment/emerging).
  for (const a of alerts.alerts) {
    raw.push({
      signal: 'alert',
      severity: a.severity,
      headline: `${a.category.toUpperCase()}: ${a.subject}`,
      detail: a.message,
      score: SEV_WEIGHT[a.severity] + Math.min(0.3, Math.abs(a.value ?? 0) / 20),
    });
  }

  // 2) Newly emerging narratives (status new/surging).
  for (const e of emerging.narratives.filter((n) => n.status !== 'rising').slice(0, 6)) {
    raw.push({
      signal: 'emerging',
      severity: e.status === 'surging' ? 'warning' : 'info',
      headline: `Emerging narrative: ${e.topic}`,
      detail: `${e.status} (${e.growth}× vs baseline, ${e.recentCount} recent mentions)`,
      score: 0.4 + Math.min(0.4, e.growth / 10),
    });
  }

  // 3) Sharpest event-volume bursts.
  for (const p of (timeline.patterns || []).slice(0, 4)) {
    raw.push({
      signal: 'burst',
      severity: p.ratioToBaseline >= 4 ? 'warning' : 'info',
      headline: `Event burst on ${p.bucket}`,
      detail: `${p.count} events (${p.ratioToBaseline}× the daily norm)`,
      score: 0.35 + Math.min(0.4, p.ratioToBaseline / 12),
    });
  }

  // 4) Strongest narrative co-movements (situational context).
  for (const c of (coMove.positive || []).slice(0, 3)) {
    raw.push({
      signal: 'co-movement',
      severity: 'info',
      headline: `Co-moving narratives: ${c.a} + ${c.b}`,
      detail: `move together (r=${c.correlation}) over ${c.overlapDays} shared days`,
      score: 0.3 + c.correlation * 0.2,
    });
  }

  // Rank, dedupe by headline, cap.
  const seen = new Set<string>();
  const items: DigestItem[] = raw
    .sort((a, b) => b.score - a.score)
    .filter((i) => (seen.has(i.headline) ? false : (seen.add(i.headline), true)))
    .slice(0, 25)
    .map((i, idx) => ({ rank: idx + 1, ...i, score: Number(i.score.toFixed(2)) }));

  const crit = items.filter((i) => i.severity === 'critical').length;
  const warn = items.filter((i) => i.severity === 'warning').length;
  const headline =
    crit > 0 ? `${crit} critical and ${warn} elevated signal(s); lead: ${items[0]?.headline ?? 'n/a'}`
    : warn > 0 ? `${warn} elevated signal(s); lead: ${items[0]?.headline ?? 'n/a'}`
    : items.length > 0 ? `${items.length} notable signal(s); lead: ${items[0]?.headline ?? 'n/a'}`
    : 'No notable changes in window.';

  return { generatedAt: new Date().toISOString(), windowDays, headline, itemCount: items.length, items };
}

export function digestToMarkdown(d: Digest): string {
  const lines: string[] = [];
  lines.push(`# What Changed — Intelligence Digest`);
  lines.push(`*${d.generatedAt} · ${d.windowDays}d window · aggregate signals*`);
  lines.push('');
  lines.push(`**${d.headline}**`);
  lines.push('');
  for (const i of d.items) {
    lines.push(`${i.rank}. **[${i.severity.toUpperCase()} · ${i.signal}]** ${i.headline}`);
    lines.push(`   - ${i.detail}`);
  }
  lines.push('');
  lines.push(`_Signals fused from alerts, baselines, sentiment shifts, emerging narratives, event bursts, and co-movement. Magnitudes scale with corpus density._`);
  return lines.join('\n');
}
