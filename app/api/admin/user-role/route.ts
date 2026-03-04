import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getUserRole, canManageUsers, canViewAuditLogs, Role } from '@/lib/rbac';

export const runtime = 'nodejs';

/** GET /api/admin/user-role — returns caller's own role */
export async function GET() {
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user) {
    // Dev/demo mode — report analyst by default
    return NextResponse.json({ role: 'analyst' });
  }

  const role = await getUserRole(user.id);
  return NextResponse.json({ role, user_id: user.id, email: user.email });
}

/** GET /api/admin/user-role/list — list all users with roles (admin only) */

/** PATCH /api/admin/user-role — update a user's role (admin only) */
export async function PATCH(req: NextRequest) {
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!skip && user) {
    const callerRole = await getUserRole(user.id);
    if (!canManageUsers(callerRole)) {
      return NextResponse.json({ error: 'Forbidden: admin access required.' }, { status: 403 });
    }
  }

  const { target_user_id, role } = await req.json();
  const VALID_ROLES: Role[] = ['admin', 'analyst', 'viewer'];

  if (!target_user_id || !role || !VALID_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: 'target_user_id and valid role required.' }, { status: 400 });
  }

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || url.includes('your_supabase') || !key) {
    return NextResponse.json({ error: 'Supabase not configured.' }, { status: 503 });
  }

  try {
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

    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id:     target_user_id,
        role,
        assigned_by: user?.id ?? null,
        updated_at:  new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: target_user_id, role });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** GET /api/admin/user-role?list=true — fetch all users + roles (admin only) */
export async function POST(req: NextRequest) {
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!skip && user) {
    const callerRole = await getUserRole(user.id);
    if (!canViewAuditLogs(callerRole)) {
      return NextResponse.json({ error: 'Forbidden: admin access required.' }, { status: 403 });
    }
  }

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || url.includes('your_supabase') || !key) {
    return NextResponse.json({ users: [] });
  }

  try {
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

    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    return NextResponse.json({ users: roles ?? [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
