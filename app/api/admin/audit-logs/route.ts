import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getUserRole, canViewAuditLogs } from '@/lib/rbac';

export const runtime = 'nodejs';

/** GET /api/admin/audit-logs?limit=50&offset=0&module=oracle */
export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Role check — admins only ─────────────────────────────
  if (!skip && user) {
    const role = await getUserRole(user.id);
    if (!canViewAuditLogs(role)) {
      return NextResponse.json(
        { error: 'Forbidden: admin access required.' },
        { status: 403 },
      );
    }
  }

  const url  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim();
  const key  = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || url.includes('your_supabase') || !key) {
    // Dev mode — return empty list
    return NextResponse.json({ logs: [], total: 0 });
  }

  try {
    const params  = req.nextUrl.searchParams;
    const limit   = Math.min(Number(params.get('limit')  ?? 50), 200);
    const offset  = Number(params.get('offset') ?? 0);
    const module  = params.get('module');
    const userId  = params.get('user_id');

    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch { /* read-only */ }
          });
        },
      },
    });

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (module) query = query.eq('module', module);
    if (userId) query = query.eq('user_id', userId);

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('[audit-logs]', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs.' }, { status: 500 });
    }

    return NextResponse.json({ logs: logs ?? [], total: count ?? 0 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
