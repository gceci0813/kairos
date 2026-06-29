import { NextRequest, NextResponse } from 'next/server';
import { correlateEvents } from '../../../src/event-correlation';

export const maxDuration = 60;

// Event correlation. ?days=30&maxHours=48&topic=
export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const result = await correlateEvents({
      sinceDays: Math.min(parseInt(p.get('days') || '30', 10) || 30, 1825),
      maxHoursApart: Math.min(parseInt(p.get('maxHours') || '48', 10) || 48, 336),
      topic: p.get('topic') || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Correlation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
