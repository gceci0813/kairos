import { NextRequest, NextResponse } from 'next/server';
import { addWatch, listWatch, removeWatch } from '../../../src/watchlist';

export const maxDuration = 30;

// Watchlist CRUD (aggregate subjects, not individuals).
//   GET  → list
//   POST { term, kind }  → add
//   DELETE ?term=...     → remove
export async function GET() {
  try {
    return NextResponse.json({ items: await listWatch() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const term = String(body.term || '').trim();
    if (!term) return NextResponse.json({ error: 'term is required' }, { status: 400 });
    const kind = ['region', 'narrative', 'query'].includes(body.kind) ? body.kind : 'query';
    return NextResponse.json({ item: await addWatch(term, kind) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const term = new URL(request.url).searchParams.get('term');
    if (!term) return NextResponse.json({ error: 'term is required' }, { status: 400 });
    await removeWatch(term);
    return NextResponse.json({ removed: term });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}
