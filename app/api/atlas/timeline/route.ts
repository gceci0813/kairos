import { NextRequest, NextResponse } from 'next/server';
import { eventTimeline } from '../../../src/event-timeline';

export const maxDuration = 60;

// Event timeline. ?days=30&place=&topic=&granularity=day|hour
export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const result = await eventTimeline({
      sinceDays: Math.min(parseInt(p.get('days') || '30', 10) || 30, 1825),
      place: p.get('place') || undefined,
      topic: p.get('topic') || undefined,
      granularity: p.get('granularity') === 'hour' ? 'hour' : 'day',
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Timeline failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
