import { NextRequest, NextResponse } from 'next/server';
import { entitySentimentSeries } from '../../../src/political-trends';
import { parseCorpusFilter, filterSummary } from '../../../src/corpus-filter';

export const maxDuration = 60;

// Aggregate sentiment/volume time-series with momentum for a named entity
// (candidate/party/org/place) over public discourse.
// ?entity=Name&days=30&curatedOnly=true&languages=en,ar&maxContentAgeDays=180
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const entity = params.get('entity');
    if (!entity) {
      return NextResponse.json({ error: 'entity parameter is required' }, { status: 400 });
    }
    const filter = parseCorpusFilter(params);
    const trend = await entitySentimentSeries(entity, filter);
    return NextResponse.json({ ...trend, filter: filterSummary(filter) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Political trends failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
