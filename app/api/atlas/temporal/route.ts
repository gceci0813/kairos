import { NextRequest, NextResponse } from 'next/server';
import { temporalGeography } from '../../../src/atlas-geo';

export const maxDuration = 60;

// Per-place mention counts bucketed by day — shows how a narrative's
// geographic footprint shifts over time. Aggregate places, not individuals.
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const query = params.get('query');
    const days = Math.min(parseInt(params.get('days') || '30', 10) || 30, 365);
    const series = await temporalGeography(query, days);
    return NextResponse.json({ series });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ATLAS temporal failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
