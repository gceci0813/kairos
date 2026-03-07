import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export type AuditModule = 'oracle' | 'sentinel' | 'actor' | 'watchlist';
export type AuditAction = 'query' | 'login' | 'logout' | 'export';

export interface AuditEntry {
  user_id?: string;
  user_email?: string;
  module: AuditModule;
  action?: AuditAction;
  /** Sanitized, non-sensitive summary of the request inputs */
  input_summary?: Record<string, unknown>;
}

/**
 * Write an audit log entry to Supabase.
 * Never throws — audit failure must not break the main request.
 */
export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  // Dev/demo mode — Supabase not configured, skip silently
  if (!url || url.includes('your_supabase') || !key) return;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch { /* read-only cookie context */ }
          });
        },
      },
    });

    await supabase.from('audit_logs').insert({
      user_id:       entry.user_id   ?? null,
      user_email:    entry.user_email ?? null,
      module:        entry.module,
      action:        entry.action ?? 'query',
      input_summary: entry.input_summary ?? {},
    });
  } catch {
    // Silently discard — audit logging must never break a request
  }
}
