import { NextRequest, NextResponse } from 'next/server';
import { unifiedLookup } from '../../../src/lookup';

export const maxDuration = 60;

// Unified cross-engine lookup. ?q=Russia
export async function GET(request: NextRequest) {
  try {
    const q = new URL(request.url).searchParams.get('q');
    if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 });
    const result = await unifiedLookup(q);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
