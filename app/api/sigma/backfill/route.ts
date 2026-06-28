import { NextRequest, NextResponse } from 'next/server';
import { getMessageQueue } from '../../../src/message-queue';
import { NLP_TOPIC } from '../../../src/sigma-ingest';
import { getSupabaseAdmin } from '../../../src/supabase-admin';

export const maxDuration = 60;

// Re-queues stored messages that have no finding yet, so the existing corpus
// (ingested before the queue was wired in) flows through the process worker.
// Paginated via ?offset= so it can be called repeatedly within the Hobby
// 60s cap. CRON_SECRET protected.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  if (new URL(request.url).searchParams.get('secret') === secret) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase admin client not configured' },
      { status: 500 }
    );
  }

  try {
    const params = new URL(request.url).searchParams;
    const limit = Math.min(parseInt(params.get('limit') || '500', 10) || 500, 1000);

    // Find messages with no corresponding finding. PostgREST can't express an
    // anti-join directly, so pull a page of recent finding keys and exclude
    // them. We page by message id via offset for repeat calls.
    const offset = parseInt(params.get('offset') || '0', 10) || 0;

    const { data: msgs, error: msgErr } = await supabase
      .from('sigma_messages')
      .select('msg_key, channel, content')
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);

    if (msgErr) throw new Error(msgErr.message);
    if (!msgs || msgs.length === 0) {
      return NextResponse.json({ requeued: 0, scanned: 0, nextOffset: offset, done: true });
    }

    // Which of these already have findings?
    const keys = msgs.map((m: any) => m.msg_key);
    const { data: existing, error: findErr } = await supabase
      .from('sigma_findings')
      .select('msg_key')
      .in('msg_key', keys);
    if (findErr) throw new Error(findErr.message);

    const done = new Set((existing ?? []).map((f: any) => f.msg_key));
    const toQueue = msgs.filter((m: any) => !done.has(m.msg_key));

    const queue = getMessageQueue<{ msg_key: string; channel: string; content: string }>();
    await queue.publish(
      NLP_TOPIC,
      toQueue.map((m: any) => ({ msg_key: m.msg_key, channel: m.channel, content: m.content }))
    );

    return NextResponse.json({
      requeued: toQueue.length,
      scanned: msgs.length,
      nextOffset: offset + msgs.length,
      done: msgs.length < limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backfill failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
