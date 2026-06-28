import { NextRequest, NextResponse } from 'next/server';
import { ingestQuery } from '../../../src/sigma-ingest-query';
import { runProcess } from '../../../src/sigma-process';

export const maxDuration = 60;

// Seed the corpus with public news for a topic, then (optionally) analyze it
// immediately. CRON_SECRET protected.
//   POST { query: "US presidential election", analyze?: true }
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  if (new URL(request.url).searchParams.get('secret') === secret) return true;
  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const query = String(body.query || '').trim();
    if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });

    const ingest = await ingestQuery(query);

    // Optionally run a processing pass right away so results are queryable.
    let processed = null;
    if (body.analyze && ingest.queued > 0) {
      processed = await runProcess(40);
    }

    return NextResponse.json({ ingest, processed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Query ingest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
