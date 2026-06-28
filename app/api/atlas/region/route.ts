import { NextRequest, NextResponse } from 'next/server';
import { regionNarratives } from '../../../src/atlas-geo';

export const maxDuration = 60;

// Per-region narrative drill-down: ?place=Russia returns the top narratives/
// topics, volume, and sentiment for that region (includes its cities).
// Aggregate over places/narratives — no individuals.
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const place = params.get('place');
    if (!place) {
      return NextResponse.json({ error: 'place parameter is required' }, { status: 400 });
    }
    const days = Math.min(parseInt(params.get('days') || '30', 10) || 30, 365);
    const result = await regionNarratives(place, days);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ATLAS region drill-down failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
