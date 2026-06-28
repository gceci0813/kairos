import { NextRequest, NextResponse } from 'next/server';
import { modelScenario, regionalAssessments } from '../../../src/oracle-analytics';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Scenario modeling: pick a region/narrative baseline from the corpus, apply
// hypothetical deltas, and project the resulting risk level. Transparent
// parametric model over aggregate signals.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, kind, sentimentDelta, volumeMultiplier, coordinationDelta, days } = body;

    if (!target) {
      return NextResponse.json({ error: 'target (region or narrative) is required' }, { status: 400 });
    }

    const { regions, narratives } = await regionalAssessments(days || 30);
    const pool = kind === 'narrative' ? narratives : regions;
    const baseline = pool.find((a) => a.key.toLowerCase() === String(target).toLowerCase());

    if (!baseline) {
      return NextResponse.json(
        { error: `No baseline found for ${kind || 'region'} "${target}". Check /api/oracle/regional for available keys.` },
        { status: 404 }
      );
    }

    const projection = modelScenario({
      baseline,
      sentimentDelta: typeof sentimentDelta === 'number' ? sentimentDelta : 0,
      volumeMultiplier: typeof volumeMultiplier === 'number' ? volumeMultiplier : 1,
      coordinationDelta: typeof coordinationDelta === 'number' ? coordinationDelta : 0,
    });

    return NextResponse.json({ baseline, projection });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ORACLE scenario failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
