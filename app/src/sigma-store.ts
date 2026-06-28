import { StandardizedData } from './base-connector';
import { getSupabaseAdmin } from './supabase-admin';

// Reads ingested Telegram messages from Supabase for instant full-text search,
// returning the same StandardizedData shape the connectors produce so the
// analyzer/UI can treat stored and live results identically.
export async function searchStoredMessages(
  query: string,
  limit = 100
): Promise<StandardizedData[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase admin client not configured — set SUPABASE_SERVICE_ROLE_KEY');
  }

  let q = supabase
    .from('sigma_messages')
    .select('channel, content, author, posted_at, url, msg_key')
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (query.trim()) {
    q = q.textSearch('content', query, { type: 'websearch', config: 'simple' });
  }

  const { data, error } = await q;
  if (error) throw new Error(`Stored search failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: `telegram-${row.msg_key}`,
    source: 'Telegram',
    content: row.content,
    author: row.author ?? row.channel,
    timestamp: row.posted_at ? new Date(row.posted_at) : new Date(),
    metadata: { url: row.url, channel: row.channel },
  }));
}

// Reads precomputed findings (produced by the async process worker) joined to
// their source message, so the dashboard shows analysis without recomputing.
export async function searchStoredFindings(query: string, limit = 100) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase admin client not configured — set SUPABASE_SERVICE_ROLE_KEY');
  }

  // Filtering on an embedded resource's column is unreliable in PostgREST, so
  // when there's a query we first resolve matching message keys from
  // sigma_messages (full-text search works directly there), then fetch the
  // findings for those keys.
  let matchKeys: string[] | null = null;
  if (query.trim()) {
    const { data: msgs, error: msgErr } = await supabase
      .from('sigma_messages')
      .select('msg_key')
      .textSearch('content', query, { type: 'websearch', config: 'simple' })
      .order('posted_at', { ascending: false })
      .limit(limit);
    if (msgErr) throw new Error(`Stored findings search failed: ${msgErr.message}`);
    matchKeys = (msgs ?? []).map((m: any) => m.msg_key);
    if (matchKeys.length === 0) return [];
  }

  let q = supabase
    .from('sigma_findings')
    .select('msg_key, channel, finding, confidence, language, sentiment, sentiment_score, entities, topics, coordination, recommended_action, sigma_messages!inner(content, url, posted_at)')
    .order('analyzed_at', { ascending: false })
    .limit(limit);

  if (matchKeys) {
    q = q.in('msg_key', matchKeys);
  }

  const { data, error } = await q;
  if (error) throw new Error(`Stored findings search failed: ${error.message}`);

  return (data ?? []).map((row: any) => ({
    finding: row.finding,
    confidence_score: row.confidence,
    reasoning_chain: [],
    source_citations: [
      {
        source: 'Telegram',
        url: row.sigma_messages?.url,
        author: row.channel,
        timestamp: row.sigma_messages?.posted_at,
      },
    ],
    recommended_action: row.recommended_action,
    nlp: {
      language: row.language,
      sentiment: row.sentiment,
      sentimentScore: row.sentiment_score,
      entities: row.entities ?? [],
      topics: row.topics ?? [],
    },
    coordination: row.coordination ?? { isFlagged: false, reasons: [], score: 0 },
    raw: { content: row.sigma_messages?.content, source: 'Telegram', author: row.channel },
  }));
}
