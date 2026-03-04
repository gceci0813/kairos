import { createClient } from '@supabase/supabase-js';

// Browser client — call inside components/handlers, not at module level
export function createBrowserClient() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()
  );
}
