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
  const title = searchParams.get('title')?.trim() ?? '';
  const page  = searchParams.get('page')          ?? '1';

  await logAuditEvent({
    user_id:       user?.id,
    user_email:    user?.email,
    module:        'watchlist',
    action:        'query',
    input_summary: { type: 'fbi', title, page },
  });

  try {
    const params = new URLSearchParams({ page });
    if (title) params.set('title', title);

    const res = await fetch(
      `https://api.fbi.gov/wanted/v1/list?${params}`,
      {
        headers: {
          Accept:          'application/json',
          'User-Agent':    'Mozilla/5.0 (compatible; KAIROS-Intelligence/1.0)',
          'Accept-Language':'en-US,en;q=0.9',
        },
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `FBI API error: ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      items: data.items ?? [],
      total: data.total ?? 0,
      page:  data.page  ?? 1,
    });
  } catch (err) {
    console.error('[watchlist/fbi]', err);
    return NextResponse.json({ error: 'Failed to fetch FBI data' }, { status: 500 });
  }
}
