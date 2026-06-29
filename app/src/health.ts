import { getCorpusProvenance } from './corpus-provenance';
import { getMessageQueue, isRedisQueueActive } from './message-queue';
import { geocodePlace } from './geocoder';
import { listWatch } from './watchlist';
import { ConnectorManager } from './connector-manager';

// Platform health: aggregates every system vital into one snapshot for the
// ops command view. Read-only; calls underlying engines directly (no
// secret-gated HTTP hops).

export interface HealthSnapshot {
  generatedAt: string;
  status: 'ok' | 'degraded';
  corpus: { messages: number; findings: number; analyzedCoverage: number; distinctSources: number; postDateRange: string };
  pipeline: { queueBackend: string; nlpBacklog: number; anthropicConfigured: boolean };
  connectors: { active: string[]; count: number };
  geocoding: { providers: Record<string, boolean>; probe: string; healthy: boolean };
  watchlist: { count: number };
  alerts: string[];
}

export async function healthSnapshot(): Promise<HealthSnapshot> {
  const alerts: string[] = [];

  // Corpus
  let corpus = { messages: 0, findings: 0, analyzedCoverage: 0, distinctSources: 0, postDateRange: '—' };
  try {
    const p = await getCorpusProvenance();
    corpus = {
      messages: p.totals.messages,
      findings: p.totals.findings,
      analyzedCoverage: p.totals.analyzedCoverage,
      distinctSources: p.totals.distinctSources,
      postDateRange: `${(p.dateRange.earliestPost || '?').slice(0, 10)} → ${(p.dateRange.latestPost || '?').slice(0, 10)}`,
    };
  } catch (e: any) {
    alerts.push(`Corpus stats unavailable: ${e.message}`);
  }

  // Pipeline
  let nlpBacklog = 0;
  try { nlpBacklog = await getMessageQueue().size('nlp'); } catch { /* ignore */ }
  const anthropicConfigured = !!(process.env.ANTHROPIC_API_KEY ?? '').trim();
  if (!anthropicConfigured) alerts.push('ANTHROPIC_API_KEY not set — new content cannot be analyzed.');
  if (nlpBacklog > 500) alerts.push(`NLP backlog is high (${nlpBacklog}); analysis is behind ingestion.`);

  // Connectors
  let active: string[] = [];
  try { active = new ConnectorManager().getAvailableSources(); } catch { /* ignore */ }

  // Geocoding probe (live chain via a non-gazetteer name)
  const providers = {
    mapbox: !!(process.env.MAPBOX_TOKEN ?? '').trim(),
    google: !!(process.env.GOOGLE_GEOCODING_KEY ?? '').trim(),
    nominatim: true,
  };
  let probe = 'none', healthy = false;
  try {
    const r = await geocodePlace('Stuttgart');
    if (r) { healthy = true; probe = r.source; }
  } catch { /* ignore */ }
  if (!healthy) alerts.push('Geocoding probe failed.');

  // Watchlist
  let watchCount = 0;
  try { watchCount = (await listWatch()).length; } catch { /* ignore */ }

  const status: HealthSnapshot['status'] = alerts.some((a) => a.includes('ANTHROPIC') || a.includes('unavailable')) ? 'degraded' : 'ok';

  return {
    generatedAt: new Date().toISOString(),
    status,
    corpus,
    pipeline: { queueBackend: isRedisQueueActive() ? 'redis-streams' : 'in-process', nlpBacklog, anthropicConfigured },
    connectors: { active, count: active.length },
    geocoding: { providers, probe, healthy },
    watchlist: { count: watchCount },
    alerts,
  };
}
