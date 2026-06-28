import { NextRequest, NextResponse } from 'next/server';
import { electionForecast } from '../../../src/political-trends';
import { CorpusFilter, filterSummary } from '../../../src/corpus-filter';

export const maxDuration = 60;

// Sentiment-weighted election forecast across a candidate field.
// POST { candidates, days?, weights?, sourceWeighted?, curatedOnly?,
//        languages?: string[], maxContentAgeDays? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const candidates: string[] = body.candidates;
    if (!Array.isArray(candidates) || candidates.length < 2) {
      return NextResponse.json({ error: 'Provide at least 2 candidates' }, { status: 400 });
    }
    const filter: CorpusFilter = {
      sinceDays: Math.min(parseInt(String(body.days || 30), 10) || 30, 365),
      curatedOnly: body.curatedOnly === true,
      languages: Array.isArray(body.languages) && body.languages.length ? body.languages : undefined,
      maxContentAgeDays: typeof body.maxContentAgeDays === 'number' ? body.maxContentAgeDays : undefined,
    };
    const sourceWeighted = body.sourceWeighted !== false; // default on
    const result = await electionForecast(candidates.slice(0, 12), filter, body.weights, sourceWeighted);
    return NextResponse.json({ ...result, filter: filterSummary(filter) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forecast failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
