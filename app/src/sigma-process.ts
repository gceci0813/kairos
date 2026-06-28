import { StandardizedData } from './base-connector';
import { getMessageQueue } from './message-queue';
import { analyzeBatch } from './sigma-analyzer';
import { NLP_TOPIC } from './sigma-ingest';
import { getSupabaseAdmin } from './supabase-admin';

interface QueuedMessage {
  msg_key: string;
  channel: string;
  content: string;
}

export interface ProcessResult {
  consumed: number;
  findingsWritten: number;
  errors: string[];
}

// Vercel Hobby: 60s cap. Each message costs one LLM call (~1-2s), so cap the
// per-run drain. The queue retains the backlog across runs — that's the point
// of decoupling ingest from analysis.
const MAX_PER_RUN = 30;

export async function runProcess(maxItems = MAX_PER_RUN): Promise<ProcessResult> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase admin client not configured — set SUPABASE_SERVICE_ROLE_KEY');
  }

  const queue = getMessageQueue<QueuedMessage>();
  const batch = await queue.consume(NLP_TOPIC, maxItems);
  if (batch.length === 0) {
    return { consumed: 0, findingsWritten: 0, errors: [] };
  }

  const errors: string[] = [];

  // Map queued items to the StandardizedData shape the analyzer expects.
  const asStandardized: StandardizedData[] = batch.map((m) => ({
    id: `telegram-${m.msg_key}`,
    source: 'Telegram',
    content: m.content,
    author: m.channel,
    timestamp: new Date(),
    metadata: { channel: m.channel },
  }));

  const findings = await analyzeBatch(asStandardized);

  const rows = findings.map((f, i) => ({
    msg_key: batch[i].msg_key,
    channel: batch[i].channel,
    finding: f.finding,
    confidence: f.confidence_score,
    language: f.nlp.language,
    sentiment: f.nlp.sentiment,
    sentiment_score: f.nlp.sentimentScore,
    entities: f.nlp.entities,
    topics: f.nlp.topics,
    coordination: f.coordination,
    recommended_action: f.recommended_action,
  }));

  const { error } = await supabase
    .from('sigma_findings')
    .upsert(rows, { onConflict: 'msg_key', ignoreDuplicates: false });

  if (error) errors.push(error.message);

  return {
    consumed: batch.length,
    findingsWritten: error ? 0 : rows.length,
    errors,
  };
}
