import { NextResponse } from 'next/server';
import { getCorpusProvenance } from '../../../src/corpus-provenance';

export const maxDuration = 60;

// Auditable corpus metadata behind every aggregate analysis: per-source
// volume, language mix, date coverage, % analyzed. Surfaces the
// selection/coverage limitations that confidence intervals cannot.
export async function GET() {
  try {
    const provenance = await getCorpusProvenance();
    return NextResponse.json(provenance);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provenance failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
