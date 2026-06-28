import { ConnectorManager } from './connector-manager';
import { getMessageQueue } from './message-queue';
import { NLP_TOPIC } from './sigma-ingest';
import { getSupabaseAdmin } from './supabase-admin';

// Query-seeded ingestion: pulls public news articles matching an arbitrary
// topic (e.g. "US presidential election", "Norwalk CT mayor") from NewsAPI +
// GDELT into the corpus, so the aggregate analytics (Political/ATLAS/ORACLE)
// can cover topics beyond the standing Telegram channel set. Aggregate public
// news about public figures/elections — not individual tracking.

const connectorManager = new ConnectorManager();

export interface QueryIngestResult {
  query: string;
  sources: string[];
  fetched: number;
  upserted: number;
  queued: number;
  errors: string[];
}

export async function ingestQuery(query: string): Promise<QueryIngestResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');

  const errors: string[] = [];
  const sourcesUsed: string[] = [];
  const available = connectorManager.getAvailableSources();

  // News + free social (Bluesky) connectors.
  const newsSources = ['newsapi', 'gdelt', 'bluesky'].filter((s) => available.includes(s));
  if (newsSources.length === 0) {
    return { query, sources: [], fetched: 0, upserted: 0, queued: 0, errors: ['No news/social connectors configured'] };
  }

  const allRows: { channel: string; msg_key: string; content: string; author: string; posted_at: string; url: string | null }[] = [];

  for (const source of newsSources) {
    try {
      const results = await connectorManager.fetchDataFromSource(source, query, { pageSize: 100 });
      sourcesUsed.push(source);
      for (const m of results) {
        const posted = isNaN(m.timestamp.getTime()) ? new Date().toISOString() : m.timestamp.toISOString();
        // Use the publication name as the "channel" so source-mix/provenance
        // reflects real outlet diversity.
        const channel = (m.metadata?.sourceName as string) || m.source || source;
        allRows.push({
          channel,
          msg_key: m.id,
          content: m.content,
          author: m.author,
          posted_at: posted,
          url: (m.metadata?.url as string) ?? null,
        });
      }
    } catch (err: any) {
      errors.push(`${source}: ${err.message ?? 'fetch failed'}`);
    }
  }

  if (allRows.length === 0) {
    return { query, sources: sourcesUsed, fetched: 0, upserted: 0, queued: 0, errors: [...errors, 'No articles found for this query'] };
  }

  // Dedup by msg_key within this batch.
  const seen = new Set<string>();
  const rows = allRows.filter((r) => (seen.has(r.msg_key) ? false : (seen.add(r.msg_key), true)));

  const { error: upsertErr } = await supabase
    .from('sigma_messages')
    .upsert(rows, { onConflict: 'msg_key', ignoreDuplicates: true });
  if (upsertErr) errors.push(`upsert: ${upsertErr.message}`);

  // Queue for NLP so they become analyzable findings.
  let queued = 0;
  if (!upsertErr) {
    const queue = getMessageQueue<{ msg_key: string; channel: string; content: string }>();
    await queue.publish(NLP_TOPIC, rows.map((r) => ({ msg_key: r.msg_key, channel: r.channel, content: r.content })));
    queued = rows.length;
  }

  return {
    query,
    sources: sourcesUsed,
    fetched: allRows.length,
    upserted: upsertErr ? 0 : rows.length,
    queued,
    errors,
  };
}
