import { NextResponse } from 'next/server';
import { healthSnapshot } from '../../../src/health';

export const maxDuration = 30;

// Platform health snapshot for the ops command view.
export async function GET() {
  try {
    return NextResponse.json(await healthSnapshot());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Health failed' }, { status: 500 });
  }
}
