import { geographicDensity } from './atlas-geo';
import { emergingNarratives } from './emerging-narratives';
import { detectAnomalies, regionalAssessments } from './oracle-analytics';

// Assembles a structured intelligence briefing from the existing analytics
// (ORACLE regional risk + anomalies, ATLAS geography, emerging narratives).
// Aggregate regions/narratives only.

export interface Briefing {
  generatedAt: string;
  windowDays: number;
  headline: string;
  topRisks: { key: string; kind: string; riskLevel: string; drivers: string[] }[];
  emerging: { topic: string; status: string; growth: number }[];
  anomalies: { key: string; kind: string; direction: string; ratio: number }[];
  topRegions: { place: string; mentions: number; avgSentiment: number }[];
}

export async function buildBriefing(windowDays = 14): Promise<Briefing> {
  const [{ regions, narratives }, anomalies, emerging, density] = await Promise.all([
    regionalAssessments(windowDays),
    detectAnomalies(windowDays),
    emergingNarratives(windowDays),
    geographicDensity(null, windowDays, 'country'),
  ]);

  const allRisks = [...regions, ...narratives].sort((a, b) => b.riskScore - a.riskScore);
  const topRisks = allRisks.slice(0, 6).map((r) => ({ key: r.key, kind: r.kind, riskLevel: r.riskLevel, drivers: r.drivers }));

  const critical = allRisks.filter((r) => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH');
  const headline =
    critical.length > 0
      ? `${critical.length} elevated-risk ${critical.length === 1 ? 'item' : 'items'}; top concern: ${allRisks[0]?.key ?? 'n/a'}`
      : `No high-risk items in the last ${windowDays}d; top activity: ${allRisks[0]?.key ?? 'n/a'}`;

  return {
    generatedAt: new Date().toISOString(),
    windowDays,
    headline,
    topRisks,
    emerging: emerging.narratives.slice(0, 8).map((e) => ({ topic: e.topic, status: e.status, growth: e.growth })),
    anomalies: anomalies.slice(0, 8).map((a) => ({ key: a.key, kind: a.kind, direction: a.direction, ratio: Number(a.ratio.toFixed(1)) })),
    topRegions: density.slice(0, 8).map((d) => ({ place: d.place, mentions: d.mentions, avgSentiment: Number(d.avgSentiment.toFixed(2)) })),
  };
}

export function briefingToMarkdown(b: Briefing): string {
  const lines: string[] = [];
  lines.push(`# Intelligence Briefing`);
  lines.push(`*Generated ${b.generatedAt} · window ${b.windowDays}d · aggregate regions/narratives*`);
  lines.push('');
  lines.push(`**${b.headline}**`);
  lines.push('');
  lines.push(`## Top risks`);
  for (const r of b.topRisks) lines.push(`- **${r.key}** (${r.kind}) — ${r.riskLevel}${r.drivers.length ? ` · ${r.drivers.join('; ')}` : ''}`);
  lines.push('');
  lines.push(`## Emerging narratives`);
  for (const e of b.emerging) lines.push(`- ${e.topic} — ${e.status} (${e.growth}x)`);
  lines.push('');
  lines.push(`## Anomalies`);
  for (const a of b.anomalies) lines.push(`- ${a.key} (${a.kind}) — ${a.direction} ${a.ratio}x`);
  lines.push('');
  lines.push(`## Geographic activity (by country)`);
  for (const g of b.topRegions) lines.push(`- ${g.place} — ${g.mentions} mentions, sentiment ${g.avgSentiment}`);
  lines.push('');
  lines.push(`_Coverage limited to ingested sources; see source-provenance for bias context._`);
  return lines.join('\n');
}
