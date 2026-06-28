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
