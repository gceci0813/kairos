import { NextRequest, NextResponse } from 'next/server';
import { narrativeCoCorrelation } from '../../../src/narrative-cocorrelation';

export const maxDuration = 60;

// Cross-narrative correlation: which narratives co-move over time. ?days=365
export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const result = await narrativeCoCorrelation({
      windowDays: Math.min(parseInt(p.get('days') || '365', 10) || 365, 1825),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Narrative correlation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
