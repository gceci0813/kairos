import { NextRequest, NextResponse } from 'next/server';
import { emergingNarratives } from '../../../src/emerging-narratives';

export const maxDuration = 60;

// Surfaces accelerating/new narratives vs baseline. ?days=14
export async function GET(request: NextRequest) {
  try {
    const days = Math.min(parseInt(new URL(request.url).searchParams.get('days') || '14', 10) || 14, 180);
    const result = await emergingNarratives(days);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Emerging-narrative detection failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
