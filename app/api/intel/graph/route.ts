import { NextRequest, NextResponse } from 'next/server';
import { entityGraph } from '../../../src/entity-graph';

export const maxDuration = 60;

// Entity co-occurrence graph (orgs/places/topics). ?days=30&minEdge=2
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const days = Math.min(parseInt(params.get('days') || '30', 10) || 30, 365);
    const minEdgeWeight = Math.max(1, parseInt(params.get('minEdge') || '2', 10) || 2);
    const graph = await entityGraph(days, { minEdgeWeight });
    return NextResponse.json(graph);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Entity graph failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
