/**
 * Server-side RBAC utilities.
 * Import this ONLY in API routes and server components.
 * For client components, import types/constants from lib/rbac-types.ts instead.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Re-export everything from the shared types file so API routes only need one import
export type { Role } from './rbac-types';
export {
  ROLE_LABELS,
  ROLE_COLORS,
  ROLE_PERMISSIONS,
} from './rbac-types';

import type { Role } from './rbac-types';

// ─── Role lookup ───────────────────────────────────────────────────────────────

/**
 * Fetch the role for a given user ID from the `user_roles` table.
 * Falls back to 'analyst' when:
 *   - Supabase is not configured (dev/demo mode)
 *   - The user has no row in user_roles yet (new user)
 *   - Any unexpected error occurs
 */
export async function getUserRole(userId: string): Promise<Role> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || url.includes('your_supabase') || !key) return 'analyst';

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch { /* read-only context */ }
          });
        },
      },
    });

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    return (data?.role as Role) ?? 'analyst';
  } catch {
    return 'analyst'; // safe default — never block on RBAC failure
  }
}

// ─── Permission gates ──────────────────────────────────────────────────────────

/** Can generate new AI analysis (oracle / sentinel / actor) */
export function canGenerateAnalysis(role: Role): boolean {
  return role === 'admin' || role === 'analyst';
}

/** Can read audit logs */
export function canViewAuditLogs(role: Role): boolean {
  return role === 'admin';
}

/** Can assign or change user roles */
export function canManageUsers(role: Role): boolean {
  return role === 'admin';
}

/** Can access the admin panel */
export function canAccessAdmin(role: Role): boolean {
  return role === 'admin';
}
