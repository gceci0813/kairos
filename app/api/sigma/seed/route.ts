import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getSupabaseAdmin } from '../../../src/supabase-admin';

export const maxDuration = 60;

// One-time (idempotent) loader: reads the committed verified seed and upserts
// it into sigma_channels. Protected by the same CRON_SECRET. Safe to re-run —
// upsert on username conflict.
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true;
  if (new URL(request.url).searchParams.get('secret') === secret) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase admin client not configured — set SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  try {
    const seedPath = path.join(process.cwd(), 'data', 'telegram-seed.json');
    const raw = await fs.readFile(seedPath, 'utf-8');
    const channels = JSON.parse(raw) as Array<{
      username: string;
      title?: string;
      language?: string;
      p90_views?: number;
    }>;

    const rows = channels.map((c) => ({
      username: c.username,
      title: c.title ?? null,
      language: c.language ?? null,
      p90_views: c.p90_views ?? 0,
    }));

    const { error } = await supabase
      .from('sigma_channels')
      .upsert(rows, { onConflict: 'username', ignoreDuplicates: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ seeded: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Seed failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
