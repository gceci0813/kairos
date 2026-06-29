import { NextRequest, NextResponse } from 'next/server';
import { watchlistStatus } from '../../../../src/watchlist';

export const maxDuration = 60;

// Current state of each watched term (volume, sentiment, momentum, deviation).
export async function GET(request: NextRequest) {
  try {
    const days = Math.min(parseInt(new URL(request.url).searchParams.get('days') || '90', 10) || 90, 1825);
    return NextResponse.json({ items: await watchlistStatus(days) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}
