import { NextRequest, NextResponse } from 'next/server';
import { evaluateAlerts } from '../../../src/alerting';

export const maxDuration = 60;

// Active alerts from current risk/anomaly/emerging state. ?days=14
export async function GET(request: NextRequest) {
  try {
    const days = Math.min(parseInt(new URL(request.url).searchParams.get('days') || '14', 10) || 14, 180);
    const result = await evaluateAlerts({ windowDays: days });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Alert evaluation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
