import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import {
  DEFAULT_THRESHOLDS,
  RiskThresholds,
  detectAnomalies,
  regionalAssessments,
} from '../../../src/oracle-analytics';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Aggregate regional forecasting: risk levels, sentiment momentum, anomalies,
// and an optional auto-generated narrative report with reasoning chain. Keyed
// on regions/narratives, not individuals.
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const days = Math.min(parseInt(params.get('days') || '30', 10) || 30, 365);
    const withReport = params.get('report') === 'true';

    const thresholds: RiskThresholds = {
      guarded: Number(params.get('t_guarded')) || DEFAULT_THRESHOLDS.guarded,
      elevated: Number(params.get('t_elevated')) || DEFAULT_THRESHOLDS.elevated,
      high: Number(params.get('t_high')) || DEFAULT_THRESHOLDS.high,
      critical: Number(params.get('t_critical')) || DEFAULT_THRESHOLDS.critical,
    };

    const { regions, narratives } = await regionalAssessments(days, thresholds);
    const anomalies = await detectAnomalies(days);

    let report: { summary: string; reasoning_chain: string[] } | null = null;
    if (withReport) {
      report = await generateReport(regions.slice(0, 8), narratives.slice(0, 8), anomalies.slice(0, 8), days);
    }

    return NextResponse.json({
      windowDays: days,
      thresholds,
      regions: regions.slice(0, 25),
      narratives: narratives.slice(0, 25),
      anomalies,
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ORACLE regional failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generateReport(regions: any[], narratives: any[], anomalies: any[], days: number) {
  const data = {
    regions: regions.map((r) => ({ region: r.key, risk: r.riskLevel, sentiment: r.avgSentiment.toFixed(2), momentum: r.momentum.toFixed(2), volume: r.volume, drivers: r.drivers })),
    narratives: narratives.map((n) => ({ narrative: n.key, risk: n.riskLevel, sentiment: n.avgSentiment.toFixed(2), volume: n.volume })),
    anomalies: anomalies.map((a) => ({ what: a.key, kind: a.kind, direction: a.direction, ratio: a.ratio.toFixed(1) })),
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      summary: 'Report generation requires ANTHROPIC_API_KEY. Structured assessment data is available in the regions/narratives/anomalies fields.',
      reasoning_chain: [],
    };
  }

  const tool = {
    name: 'record_report',
    description: 'Record a concise regional intelligence summary with an explicit reasoning chain.',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string', description: '3-5 sentence aggregate regional assessment' },
        reasoning_chain: { type: 'array', items: { type: 'string' }, description: 'Ordered reasoning steps citing the data' },
      },
      required: ['summary', 'reasoning_chain'],
    },
  };

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    tools: [tool],
    tool_choice: { type: 'tool', name: 'record_report' },
    messages: [
      {
        role: 'user',
        content:
          `Aggregate regional intelligence over the last ${days} days. This is AGGREGATE analysis of places and narratives, not individuals. ` +
          `Summarize the highest-risk regions and narratives and notable anomalies, with a reasoning chain citing the figures.\n\n` +
          JSON.stringify(data, null, 2),
      },
    ],
  });

  const block = res.content.find((b) => b.type === 'tool_use');
  if (block && block.type === 'tool_use') {
    const input = block.input as { summary: string; reasoning_chain: string[] };
    return { summary: input.summary, reasoning_chain: input.reasoning_chain ?? [] };
  }
  return { summary: 'No report produced.', reasoning_chain: [] };
}
