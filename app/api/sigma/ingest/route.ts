import { NextRequest, NextResponse } from 'next/server';
import { runIngest } from '../../../src/sigma-ingest';

// Allow up to the Hobby ceiling.
export const maxDuration = 60;

// Triggered by Vercel Cron (daily on Hobby) and manually. Protected by
// CRON_SECRET: cron sends it as a Bearer token automatically; manual callers
// must pass ?secret= or the same Bearer header.
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

  try {
    const batchParam = new URL(request.url).searchParams.get('batch');
    const batch = batchParam ? Math.min(parseInt(batchParam, 10) || 40, 50) : undefined;
    const result = await runIngest(batch);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ingest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
