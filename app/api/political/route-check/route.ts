import { NextRequest, NextResponse } from 'next/server';
import { routeContent, routerCapabilities } from '../../../src/slm-llm-router';

// Diagnostic: shows how the SLM↔LLM router would classify a given piece of
// content, and the active tier configuration.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content: string = body.content ?? '';
    const decision = routeContent({
      content,
      coordinationFlagged: !!body.coordinationFlagged,
      engagement: typeof body.engagement === 'number' ? body.engagement : 0,
    });
    return NextResponse.json({ decision, capabilities: routerCapabilities() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Route check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ capabilities: routerCapabilities() });
}
