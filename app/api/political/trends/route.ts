import { NextRequest, NextResponse } from 'next/server';
import { entitySentimentSeries } from '../../../src/political-trends';

export const maxDuration = 60;

// Aggregate sentiment/volume time-series with momentum for a named entity
// (candidate/party/org/place) over public discourse. ?entity=Name&days=30
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const entity = params.get('entity');
    if (!entity) {
      return NextResponse.json({ error: 'entity parameter is required' }, { status: 400 });
    }
    const days = Math.min(parseInt(params.get('days') || '30', 10) || 30, 365);
    const trend = await entitySentimentSeries(entity, days);
    return NextResponse.json(trend);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Political trends failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
