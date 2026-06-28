import { NextRequest, NextResponse } from 'next/server';
import { ConnectorManager } from '../../src/connector-manager'
const connectorManager = new ConnectorManager();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const source = searchParams.get('source') || '';
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    let results;
    
    if (source) {
      results = await connectorManager.fetchDataFromSource(source, query);
    } else {
      results = await connectorManager.fetchDataFromAllSources(query);
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in sigma API:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { query, source, options } = body;
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    let results;
    
    if (source) {
      results = await connectorManager.fetchDataFromSource(source, query, options);
    } else {
      results = await connectorManager.fetchDataFromAllSources(query, options);
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error in sigma API:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}