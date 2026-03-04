import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';

// Use @supabase/ssr's browser client — stores session in cookies (not localStorage)
// so the server-side middleware can read the session and auth works correctly.
export function createBrowserClient() {
  return createSSRBrowserClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  );
}
