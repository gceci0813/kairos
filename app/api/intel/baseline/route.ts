import { NextRequest, NextResponse } from 'next/server';
import { trendDeviations } from '../../../src/baseline';

export const maxDuration = 60;

// Comparative baseline / trend-deviation: what's abnormal now vs the historical
// norm. ?window=180&recent=7
export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const result = await trendDeviations({
      windowDays: Math.min(parseInt(p.get('window') || '180', 10) || 180, 1825),
      recentDays: Math.min(parseInt(p.get('recent') || '7', 10) || 7, 90),
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Baseline failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
