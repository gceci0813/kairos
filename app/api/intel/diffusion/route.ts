import { NextRequest, NextResponse } from 'next/server';
import { narrativeDiffusion } from '../../../src/narrative-diffusion';

export const maxDuration = 60;

// Narrative diffusion: how a narrative spread across sources/regions/time.
// ?topic=Sanctions&days=365
export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const topic = p.get('topic');
    if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });
    const days = Math.min(parseInt(p.get('days') || '365', 10) || 365, 1825);
    const result = await narrativeDiffusion(topic, days);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Diffusion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
