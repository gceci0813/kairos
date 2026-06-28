import { getSupabaseAdmin } from './supabase-admin';
import { TelegramConnector } from './telegram-connector';
import { getMessageQueue } from './message-queue';

export const NLP_TOPIC = 'nlp';

// Vercel Hobby caps function duration at 60s. Each channel preview fetch is
// ~0.5-1s, so we process a conservative batch per run to stay well clear of
// the timeout. The cron rotates through channels by last_crawled.
const BATCH_SIZE = 40;

export interface IngestResult {
  channelsProcessed: number;
  messagesUpserted: number;
  queued: number;
  errors: string[];
}

export async function runIngest(batchSize = BATCH_SIZE): Promise<IngestResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase admin client not configured — set SUPABASE_SERVICE_ROLE_KEY');
  }

  // Least-recently-crawled first, highest reach as tiebreaker.
  const { data: channels, error } = await supabase
    .from('sigma_channels')
    .select('username')
    .order('last_crawled', { ascending: true, nullsFirst: true })
    .order('p90_views', { ascending: false })
    .limit(batchSize);

  if (error) throw new Error(`Failed to load channels: ${error.message}`);
  if (!channels || channels.length === 0) {
    return { channelsProcessed: 0, messagesUpserted: 0, queued: 0, errors: ['No channels seeded'] };
  }

  const errors: string[] = [];
  const queue = getMessageQueue<{ msg_key: string; channel: string; content: string }>();
  let messagesUpserted = 0;
  let queued = 0;
  const nowIso = new Date().toISOString();

  for (const { username } of channels) {
    try {
      const connector = new TelegramConnector([username]);
      const messages = await connector.fetchData('');

      if (messages.length > 0) {
        const rows = messages.map((m) => ({
          channel: username,
          msg_key: m.id.replace(/^telegram-/, ''),
          content: m.content,
          author: m.author,
          posted_at: isNaN(m.timestamp.getTime()) ? nowIso : m.timestamp.toISOString(),
          url: m.metadata?.url ?? null,
        }));

        const { error: upsertError } = await supabase
          .from('sigma_messages')
          .upsert(rows, { onConflict: 'msg_key', ignoreDuplicates: true });

        if (upsertError) {
          errors.push(`${username}: ${upsertError.message}`);
        } else {
          messagesUpserted += rows.length;
          // Publish to the NLP queue for async processing. The process worker
          // consumes these and writes findings; ingest stays fast and isn't
          // blocked on per-message LLM calls.
          await queue.publish(
            NLP_TOPIC,
            rows.map((r) => ({ msg_key: r.msg_key, channel: r.channel, content: r.content }))
          );
          queued += rows.length;
        }
      }

      await supabase
        .from('sigma_channels')
        .update({ last_crawled: nowIso })
        .eq('username', username);
    } catch (err: any) {
      errors.push(`${username}: ${err.message ?? 'fetch failed'}`);
    }
  }

  return { channelsProcessed: channels.length, messagesUpserted, queued, errors };
}
