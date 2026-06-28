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

  try {
    const queue = getMessageQueue<{ ping: string; at: number }>();
    const topic = 'healthcheck';
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await queue.publish(topic, [{ ping: token, at: Date.now() }]);
    const consumed = await queue.consume(topic);
    const roundTripOk = consumed.some((m) => m.ping === token);

    return NextResponse.json({ backend, roundTripOk, consumedCount: consumed.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Queue check failed';
    return NextResponse.json({ backend, error: message }, { status: 500 });
  }
}
