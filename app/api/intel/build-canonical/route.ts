import { NextRequest, NextResponse } from 'next/server';
import { buildCanonicalMappings } from '../../../src/entity-canonical';

export const runtime = 'nodejs';
export const maxDuration = 60;

// One-time (repeatable) build of the LLM canonical entity map. Scans distinct
// entity surface forms in the corpus, maps unmapped ones to English canonical
// names via the LLM, and stores them. CRON_SECRET protected. Re-run to extend.
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
    const max = Math.min(parseInt(new URL(request.url).searchParams.get('max') || '400', 10) || 400, 800);
    const result = await buildCanonicalMappings(max);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Build canonical failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
