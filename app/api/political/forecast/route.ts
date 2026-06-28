import { NextRequest, NextResponse } from 'next/server';
import { electionForecast } from '../../../src/political-trends';

export const maxDuration = 60;

// Sentiment-weighted election forecast across a candidate field.
// POST { candidates: string[], days?: number, weights?: {...} }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const candidates: string[] = body.candidates;
    if (!Array.isArray(candidates) || candidates.length < 2) {
      return NextResponse.json({ error: 'Provide at least 2 candidates' }, { status: 400 });
    }
    const days = Math.min(parseInt(String(body.days || 30), 10) || 30, 365);
    const sourceWeighted = body.sourceWeighted !== false; // default on
    const result = await electionForecast(candidates.slice(0, 12), days, body.weights, sourceWeighted);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forecast failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
