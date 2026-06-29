import { NextRequest, NextResponse } from 'next/server';
import { buildDigest, digestToMarkdown } from '../../../src/daily-digest';

export const maxDuration = 60;

// Unified what-changed digest. ?days=14&format=json|markdown
export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const days = Math.min(parseInt(p.get('days') || '14', 10) || 14, 180);
    const digest = await buildDigest(days);

    if (p.get('format') === 'markdown') {
      return new NextResponse(digestToMarkdown(digest), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="intel-digest-${digest.generatedAt.slice(0, 10)}.md"`,
        },
      });
    }
    return NextResponse.json(digest);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Digest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
