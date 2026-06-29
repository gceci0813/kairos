import { detectAnomalies, regionalAssessments } from './oracle-analytics';
import { emergingNarratives } from './emerging-narratives';
import { trendDeviations } from './baseline';
import { sentimentShifts } from './sentiment-shift';

// Turns the analytics from reactive to proactive: evaluates current state
// against thresholds and emits active alerts. Aggregate regions/narratives.

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: 'risk' | 'anomaly' | 'emerging' | 'deviation' | 'sentiment';
  subject: string;
  message: string;
  value?: number;
}

export interface AlertConfig {
  riskLevels?: string[];       // which ORACLE risk levels trigger (default HIGH, CRITICAL)
  anomalyRatio?: number;       // min spike ratio (default 2.5)
  emergingGrowth?: number;     // min growth for emerging alert (default 3)
  windowDays?: number;
}

export async function evaluateAlerts(config: AlertConfig = {}): Promise<{ generatedAt: string; alerts: Alert[] }> {
  const windowDays = config.windowDays ?? 14;
  const riskLevels = new Set(config.riskLevels ?? ['HIGH', 'CRITICAL']);
  const anomalyRatio = config.anomalyRatio ?? 2.5;
  const emergingGrowth = config.emergingGrowth ?? 3;

  const [{ regions, narratives }, anomalies, emerging, deviations, shifts] = await Promise.all([
    regionalAssessments(windowDays),
    detectAnomalies(windowDays),
    emergingNarratives(windowDays),
    trendDeviations({ windowDays: Math.max(60, windowDays * 4), recentDays: Math.min(14, windowDays) }),
    sentimentShifts({ windowDays: Math.max(60, windowDays * 4), recentDays: Math.min(14, windowDays) }),
  ]);

  const alerts: Alert[] = [];

  // Sentiment direction flips / large tone swings.
  for (const sh of [...shifts.regions, ...shifts.narratives]) {
    if (!sh.flipped && Math.abs(sh.delta) < 0.4) continue;
    alerts.push({
      id: `sentiment-${sh.kind}-${sh.key}`,
      severity: sh.flipped ? 'warning' : 'info',
      category: 'sentiment',
      subject: sh.key,
      message: `${sh.kind} sentiment ${sh.direction}${sh.flipped ? ' (flipped sign)' : ''}: ${sh.priorSentiment} → ${sh.recentSentiment}`,
      value: sh.delta,
    });
  }

  // Statistical deviations vs historical baseline (z-score spikes/drops).
  for (const dv of [...deviations.regions, ...deviations.narratives]) {
    if (dv.direction === 'normal' || Math.abs(dv.z) < 3) continue;
    alerts.push({
      id: `deviation-${dv.kind}-${dv.key}`,
      severity: Math.abs(dv.z) >= 5 ? 'warning' : 'info',
      category: 'deviation',
      subject: dv.key,
      message: `${dv.kind} ${dv.direction} vs baseline (z=${dv.z}; recent avg ${dv.recentMean}/day vs ${dv.baselineMean})`,
      value: dv.z,
    });
  }

  for (const r of [...regions, ...narratives]) {
    if (riskLevels.has(r.riskLevel)) {
      alerts.push({
        id: `risk-${r.kind}-${r.key}`,
        severity: r.riskLevel === 'CRITICAL' ? 'critical' : 'warning',
        category: 'risk',
        subject: r.key,
        message: `${r.kind} at ${r.riskLevel} risk${r.drivers.length ? ` — ${r.drivers.join('; ')}` : ''}`,
        value: r.riskScore,
      });
    }
  }

  for (const a of anomalies) {
    if (a.direction === 'spike' && a.ratio >= anomalyRatio) {
      alerts.push({
        id: `anomaly-${a.kind}-${a.key}`,
        severity: a.ratio >= anomalyRatio * 1.6 ? 'critical' : 'warning',
        category: 'anomaly',
        subject: a.key,
        message: `${a.kind} volume spike ${a.ratio.toFixed(1)}x baseline`,
        value: a.ratio,
      });
    }
  }

  for (const e of emerging.narratives) {
    if (e.status === 'surging' || (e.status === 'new' && e.recentCount >= 5) || e.growth >= emergingGrowth) {
      alerts.push({
        id: `emerging-${e.topic}`,
        severity: 'info',
        category: 'emerging',
        subject: e.topic,
        message: `Emerging narrative (${e.status}, ${e.growth}x)`,
        value: e.growth,
      });
    }
  }

  // Critical first.
  const order = { critical: 0, warning: 1, info: 2 } as const;
  alerts.sort((a, b) => order[a.severity] - order[b.severity] || (b.value ?? 0) - (a.value ?? 0));

  return { generatedAt: new Date().toISOString(), alerts };
}
