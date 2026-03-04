import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Validates the Supabase session from cookies inside an API route handler.
 *
 * Returns { user, skip }:
 *   - skip = true  → Supabase not configured (dev/demo); caller should allow the request
 *   - user = null  → Supabase configured but no valid session; caller must return 401
 *   - user = User  → authenticated
 *
 * Uses getUser() (not getSession()) which validates the JWT with Supabase's server,
 * preventing forged tokens from bypassing auth.
 */
export async function getAuthenticatedUser() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  // If Supabase is not configured, skip auth (mirrors middleware behaviour in proxy.ts)
  if (!url || url.includes('your_supabase') || !key) {
    return { user: null, skip: true as const };
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Route handlers can't always set cookies but this satisfies the interface
        cookiesToSet.forEach(({ name, value, options }) => {
          try { cookieStore.set(name, value, options); } catch { /* read-only context */ }
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  return { user, skip: false as const };
}
