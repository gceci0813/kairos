import { NextRequest, NextResponse } from 'next/server';
import { analyzeAccounts } from '../../../src/account-analysis';

export const maxDuration = 60;

// Returns automated-account / coordination signals computed over the stored
// corpus. Read-only analysis; available to the dashboard. Heuristic output —
// these are leads for human review, not definitive bot determinations.
export async function GET(request: NextRequest) {
  try {
    const limitParam = new URL(request.url).searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 2000, 5000) : 2000;
    const signals = await analyzeAccounts(limit);
    return NextResponse.json({
      analyzed: signals.length,
      signals,
      note: 'Heuristic signals for human review, not definitive bot classification.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Coordination analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
