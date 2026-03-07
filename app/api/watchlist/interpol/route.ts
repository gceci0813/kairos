import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { logAuditEvent } from '@/lib/audit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const name     = searchParams.get('name')?.trim()     ?? '';
  const forename = searchParams.get('forename')?.trim() ?? '';
  const page     = searchParams.get('page')             ?? '1';

  await logAuditEvent({
    user_id:       user?.id,
    user_email:    user?.email,
    module:        'watchlist',
    action:        'query',
    input_summary: { type: 'interpol', name, forename, page },
  });

  try {
    const params = new URLSearchParams({ page, resultPerPage: '20' });
    if (name)     params.set('name',     name);
    if (forename) params.set('forename', forename);

    const res = await fetch(
      `https://ws-public.interpol.int/notices/v1/red?${params}`,
      {
        headers: {
          Accept:           'application/json',
          'User-Agent':     'Mozilla/5.0 (compatible; KAIROS-Intelligence/1.0)',
          'Accept-Language':'en-US,en;q=0.9',
        },
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Interpol API error: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      notices: data._embedded?.notices ?? [],
      total:   data.total ?? 0,
      links:   data._links ?? {},
    });
  } catch (err) {
    console.error('[watchlist/interpol]', err);
    return NextResponse.json({ error: 'Failed to fetch Interpol data' }, { status: 500 });
  }
}
