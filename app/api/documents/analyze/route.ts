import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getUserRole, canGenerateAnalysis } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are a document intelligence analyst for an intelligence platform.
Analyze the provided document image and extract structured intelligence.

Respond in the following JSON structure (no markdown, raw JSON only):
{
  "extracted_text": "full verbatim text extracted from the document",
  "document_type": "e.g. Official Report / Diplomatic Cable / News Article / Map / Handwritten / Unknown",
  "language": "detected language(s)",
  "date_references": ["any dates found in the document"],
  "entities": {
    "persons": ["named individuals"],
    "organizations": ["organizations, agencies, groups"],
    "locations": ["places, countries, cities, coordinates"],
    "other": ["notable terms, codes, designations"]
  },
  "classification_markers": "any classification level indicators found (e.g. SECRET, CONFIDENTIAL, UNCLASSIFIED, or none detected)",
  "intelligence_summary": "2-4 sentence analytical summary of the document's intelligence value and key findings",
  "confidence": "HIGH | MEDIUM | LOW — your confidence in the extraction quality"
}`;

export async function POST(req: NextRequest) {
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!skip && user) {
    const role = await getUserRole(user.id);
    if (!canGenerateAnalysis(role)) {
      return NextResponse.json(
        { error: 'Forbidden: read-only role cannot run document analysis.' },
        { status: 403 },
      );
    }
  }

  let body: { image: string; mediaType: string; filename?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { image, mediaType, filename } = body;
  if (!image || !mediaType) {
    return NextResponse.json({ error: 'image and mediaType are required' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(mediaType)) {
    return NextResponse.json(
      { error: `Unsupported media type. Accepted: ${allowedTypes.join(', ')}` },
      { status: 400 },
    );
  }

  // ── API key check ─────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { unconfigured: true, error: 'ANTHROPIC_API_KEY is not set. Add it to your environment variables.' },
      { status: 503 },
    );
  }

  await logAuditEvent({
    user_id:       user?.id,
    user_email:    user?.email,
    module:        'documents',
    action:        'query',
    input_summary: { filename: filename ?? 'unknown', mediaType },
  });

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      system:     SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type:   'image',
              source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: image },
            },
            {
              type: 'text',
              text: 'Analyze this document and return the structured JSON response.',
            },
          ],
        },
      ],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';

    // Strip any accidental markdown fencing
    const clean = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Return raw if JSON parse fails (Claude occasionally wraps in prose)
      return NextResponse.json({ raw, parseError: true });
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error('[documents/analyze]', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
