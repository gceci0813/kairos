import { NextResponse } from 'next/server';
import { sourceReliability } from '../../../src/source-reliability';

export const maxDuration = 60;

// Source-reliability scoring: each source rated by independent corroboration.
export async function GET() {
  try {
    return NextResponse.json(await sourceReliability());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'failed' }, { status: 500 });
  }
}
