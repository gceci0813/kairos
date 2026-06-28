import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only admin client using the service-role key. Bypasses RLS, so it
// must NEVER be imported into client components. Used by the ingest cron and
// seed route to write channels/messages.
let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  // Strip ALL whitespace/newlines — pasted keys sometimes wrap and embed a
  // newline mid-string, which .trim() won't catch and which breaks the
  // Authorization header.
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\s/g, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\s/g, '');
  if (!url || !serviceKey) return null;

  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
