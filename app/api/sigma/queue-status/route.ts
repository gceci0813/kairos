import { NextRequest, NextResponse } from 'next/server';
import { getMessageQueue, isRedisQueueActive } from '../../../src/message-queue';

// Diagnostic: confirms which queue backend is active and, for Redis, does a
// real publish→consume round-trip to prove connectivity. CRON_SECRET gated.
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

  const backend = isRedisQueueActive() ? 'redis-streams' : 'in-process';

  // Admin: purge a topic's backlog (?purge=nlp).
  const purgeTopic = new URL(request.url).searchParams.get('purge');
  if (purgeTopic) {
    try {
      const queue = getMessageQueue();
      const before = await queue.size(purgeTopic);
      await queue.purge(purgeTopic);
      return NextResponse.json({ backend, purged: purgeTopic, removed: before });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purge failed';
      return NextResponse.json({ backend, error: message }, { status: 500 });
    }
  }

  try {
    const queue = getMessageQueue<{ ping: string; at: number }>();
    const topic = 'healthcheck';
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await queue.publish(topic, [{ ping: token, at: Date.now() }]);
    const consumed = await queue.consume(topic, 100);
    const roundTripOk = consumed.some((m) => m.ping === token);

    // Also report the real NLP backlog depth.
    const nlpBacklog = await queue.size('nlp');

    return NextResponse.json({ backend, roundTripOk, consumedCount: consumed.length, nlpBacklog });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Queue check failed';
    return NextResponse.json({ backend, error: message }, { status: 500 });
  }
}
