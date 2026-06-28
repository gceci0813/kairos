import { NextRequest, NextResponse } from 'next/server';
import { ingestQuery } from '../../../src/sigma-ingest-query';
import { getTrackedQueries } from '../../../src/tracked-queries';

export const maxDuration = 60;

// Daily cron: ingests the standing list of election topics into the corpus.
// Bounded by a wall-clock budget so it stays under the function limit; any
// queries not reached this run are picked up next run (rotating by offset).
// CRON_SECRET protected (Vercel cron sends it as a Bearer token).
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  if (new URL(request.url).searchParams.get('secret') === secret) return true;
  return false;
}

const TIME_BUDGET_MS = 50_000;

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const all = getTrackedQueries();
  // Rotate start offset by day-of-year so the whole list cycles even if one
  // run can't reach every query.
  const offsetParam = new URL(request.url).searchParams.get('offset');
  const dayOffset = offsetParam != null ? parseInt(offsetParam, 10) || 0 :
    Math.floor(Date.now() / 86400000) % all.length;
  const ordered = [...all.slice(dayOffset), ...all.slice(0, dayOffset)];

  const start = Date.now();
  const results: { query: string; upserted: number; queued: number }[] = [];
  let totalQueued = 0;

  for (const query of ordered) {
    if (Date.now() - start > TIME_BUDGET_MS) break;
    try {
      const r = await ingestQuery(query);
      results.push({ query, upserted: r.upserted, queued: r.queued });
      totalQueued += r.queued;
    } catch (err: any) {
      results.push({ query, upserted: 0, queued: 0 });
    }
  }

  return NextResponse.json({
    trackedTotal: all.length,
    processedThisRun: results.length,
    totalQueued,
    results,
    note: 'Queued messages are analyzed by the process cron. On Hobby (daily cron, ~40 analyzed/run) heavy ingestion outpaces analysis — narrow the query list or upgrade for full coverage.',
  });
}
