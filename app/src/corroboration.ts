import { getSupabaseAdmin } from './supabase-admin';
import { dedupFindings } from './entity-resolution';

// Cross-source corroboration: clusters near-duplicate reporting and scores
// each event/claim by how many INDEPENDENT sources carry it. Core intel
// tradecraft — a claim in 1 channel is weak; the same claim across many
// independent outlets is strong.

export interface CorroboratedEvent {
  summary: string;        // representative snippet
  reportCount: number;    // raw items in the cluster
  sourceCount: number;    // distinct sources
  sources: string[];
  corroboration: 'single-source' | 'weak' | 'moderate' | 'strong';
  url?: string;
  sampleSentiment?: number;
}

function level(sourceCount: number): CorroboratedEvent['corroboration'] {
  if (sourceCount <= 1) return 'single-source';
  if (sourceCount === 2) return 'weak';
  if (sourceCount <= 4) return 'moderate';
  return 'strong';
}

export async function corroborate(query: string, sinceDays = 30, limit = 1000): Promise<{
  query: string;
  events: CorroboratedEvent[];
  note: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');

  // Resolve matching messages by full-text search, then pull their findings +
  // content for clustering.
  const { data: msgs, error: msgErr } = await supabase
    .from('sigma_messages')
    .select('msg_key, channel, content, url, posted_at')
    .textSearch('content', query, { type: 'websearch', config: 'simple' })
    .order('posted_at', { ascending: false })
    .limit(limit);
  if (msgErr) throw new Error(msgErr.message);
  if (!msgs || msgs.length === 0) {
    return { query, events: [], note: 'No matching content in corpus for this query.' };
  }

  // Optional sentiment from findings, keyed by msg_key.
  const keys = msgs.map((m: any) => m.msg_key);
  const { data: finds } = await supabase
    .from('sigma_findings')
    .select('msg_key, sentiment_score')
    .in('msg_key', keys);
  const sentByKey = new Map<string, number>((finds ?? []).map((f: any) => [f.msg_key, f.sentiment_score]));

  const rows = msgs.map((m: any) => ({ content: m.content, channel: m.channel, url: m.url, msg_key: m.msg_key }));
  const clusters = dedupFindings(rows, 0.5);

  const events: CorroboratedEvent[] = clusters
    .map((c) => {
      const rep: any = c.representative;
      return {
        summary: (rep.content as string).slice(0, 200),
        reportCount: c.size,
        sourceCount: c.sources.length,
        sources: c.sources.slice(0, 10),
        corroboration: level(c.sources.length),
        url: rep.url ?? undefined,
        sampleSentiment: sentByKey.get(rep.msg_key),
      };
    })
    .sort((a, b) => b.sourceCount - a.sourceCount || b.reportCount - a.reportCount);

  return {
    query,
    events,
    note: 'Source counts reflect independent outlets in the ingested corpus only; coverage bias applies (see provenance).',
  };
}
