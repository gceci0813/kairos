import { NextRequest, NextResponse } from 'next/server';
import { runProcess } from '../../../src/sigma-process';

export const maxDuration = 60;

// Drains the NLP queue, analyzes messages, writes findings. Triggered by a
// daily Vercel Cron (offset after ingest) and manually. CRON_SECRET protected.
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
    const maxParam = new URL(request.url).searchParams.get('max');
    const max = maxParam ? Math.min(parseInt(maxParam, 10) || 30, 40) : undefined;
    const result = await runProcess(max);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Process failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
