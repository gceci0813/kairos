import { NextRequest, NextResponse } from 'next/server';
import { corroborate } from '../../../src/corroboration';

export const maxDuration = 60;

// Cross-source corroboration for a claim/topic: ?query=...&days=30
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const query = params.get('query');
    if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 });
    const days = Math.min(parseInt(params.get('days') || '30', 10) || 30, 365);
    const result = await corroborate(query, days);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Corroboration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
