import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getUserRole, canGenerateAnalysis } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!skip && user) {
    const role = await getUserRole(user.id);
    if (!canGenerateAnalysis(role)) {
      return NextResponse.json(
        { error: 'Forbidden: read-only role cannot run watchlist queries.' },
        { status: 403 },
      );
    }
  }

  const apiKey = process.env.OPENSANCTIONS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ unconfigured: true, results: [], total: 0 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ results: [], total: 0 });

  await logAuditEvent({
    user_id:       user?.id,
    user_email:    user?.email,
    module:        'watchlist',
    action:        'query',
    input_summary: { type: 'sanctions', query: q },
  });

  try {
    const params = new URLSearchParams({ q, limit: '20' });
    const res = await fetch(
      `https://api.opensanctions.org/search/default?${params}`,
      {
        headers: { Authorization: `ApiKey ${apiKey}` },
        next: { revalidate: 60 },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenSanctions error: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      results: data.results ?? [],
      total:   data.total?.value ?? 0,
    });
  } catch (err) {
    console.error('[watchlist/sanctions]', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
