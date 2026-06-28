import { NextRequest, NextResponse } from 'next/server';
import { runIngest } from '../../../src/sigma-ingest';
import { ingestQuery } from '../../../src/sigma-ingest-query';
import { getTrackedQueries } from '../../../src/tracked-queries';

export const maxDuration = 60;

// Combined daily ingest (Hobby has only 2 cron slots, so channel refresh +
// tracked election queries share one). Time-budgeted to stay under the limit;
// tracked queries rotate by day so the whole list cycles across runs.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  if (new URL(request.url).searchParams.get('secret') === secret) return true;
  return false;
}

const TOTAL_BUDGET_MS = 52_000;
const CHANNEL_BATCH = 15;

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();

  // 1) Refresh a slice of standing Telegram channels.
  let channels: any = null;
  try {
    channels = await runIngest(CHANNEL_BATCH);
  } catch (err: any) {
    channels = { error: err.message };
  }

  // 2) Ingest tracked election queries with the remaining time budget.
  const all = getTrackedQueries();
  const dayOffset = Math.floor(Date.now() / 86400000) % Math.max(1, all.length);
  const ordered = [...all.slice(dayOffset), ...all.slice(0, dayOffset)];

  const queryResults: { query: string; upserted: number; queued: number }[] = [];
  let queriesQueued = 0;
  for (const query of ordered) {
    if (Date.now() - start > TOTAL_BUDGET_MS) break;
    try {
      const r = await ingestQuery(query);
      queryResults.push({ query, upserted: r.upserted, queued: r.queued });
      queriesQueued += r.queued;
    } catch {
      queryResults.push({ query, upserted: 0, queued: 0 });
    }
  }

  return NextResponse.json({
    channels,
    trackedTotal: all.length,
    queriesRun: queryResults.length,
    queriesQueued,
    queryResults,
    note: 'Analysis runs on the process cron. On Hobby (~40 analyzed/day) heavy ingestion outpaces analysis — see provenance panel for actual coverage.',
  });
}
