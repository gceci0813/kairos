import { NextRequest, NextResponse } from 'next/server';
import { buildBriefing, briefingToMarkdown } from '../../../src/intel-briefing';

export const maxDuration = 60;

// Auto-generated intel briefing from ATLAS/ORACLE/emerging analytics.
//   ?days=14&format=json|markdown
// JSON for the dashboard; markdown for export/download.
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const days = Math.min(parseInt(params.get('days') || '14', 10) || 14, 180);
    const briefing = await buildBriefing(days);

    if (params.get('format') === 'markdown') {
      return new NextResponse(briefingToMarkdown(briefing), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="intel-briefing-${briefing.generatedAt.slice(0, 10)}.md"`,
        },
      });
    }
    return NextResponse.json(briefing);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Briefing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
