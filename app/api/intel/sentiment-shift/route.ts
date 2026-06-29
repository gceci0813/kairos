import { NextRequest, NextResponse } from 'next/server';
import { sentimentShifts } from '../../../src/sentiment-shift';

export const maxDuration = 60;

// Sentiment-shift detection: where coverage tone changed direction.
// ?window=90&recent=14
export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const result = await sentimentShifts({
      windowDays: Math.min(parseInt(p.get('window') || '90', 10) || 90, 1825),
      recentDays: Math.min(parseInt(p.get('recent') || '14', 10) || 14, 90),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sentiment-shift failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
