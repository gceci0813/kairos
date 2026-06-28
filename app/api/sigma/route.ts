import { NextRequest, NextResponse } from 'next/server';
import { ConnectorManager } from '../../src/connector-manager'
import { analyzeBatch } from '../../src/sigma-analyzer';
import { searchStoredMessages, searchStoredFindings } from '../../src/sigma-store';
const connectorManager = new ConnectorManager();

export const maxDuration = 60;

interface SigmaParams {
  query: string;
  source?: string;
  options?: any;
  analyze?: boolean;
  stored?: boolean; // read ingested messages from Supabase instead of live fetch
}

async function handle({ query, source, options, analyze, stored }: SigmaParams) {
  if (!query && !stored) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let results;

    // Stored + analyze → serve precomputed findings (no live LLM calls).
    if (stored && analyze) {
      const findings = await searchStoredFindings(query, 100);
      return NextResponse.json({ findings });
    }

    if (stored) {
      results = await searchStoredMessages(query, 100);
    } else if (source) {
      results = await connectorManager.fetchDataFromSource(source, query, options);
    } else {
      results = await connectorManager.fetchDataFromAllSources(query, options);
    }

    if (analyze) {
      const findings = await analyzeBatch(results);
      return NextResponse.json({ findings });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in sigma API:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return handle({
    query: searchParams.get('query') || '',
    source: searchParams.get('source') || undefined,
    analyze: searchParams.get('analyze') === 'true',
    stored: searchParams.get('stored') === 'true',
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return handle(body);
}
