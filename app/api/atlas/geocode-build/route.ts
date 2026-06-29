import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../src/supabase-admin';
import { buildGeocodeCache } from '../../../src/geocoder';

export const maxDuration = 60;

// Live-geocodes distinct place names found in the corpus into the cache, so
// ATLAS can map locations beyond the static gazetteer. Paced to the geocoder's
// rate limit; repeat until it stops resolving new ones. CRON_SECRET protected.
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
  if (!supabase) return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });

  try {
    const { data, error } = await supabase.from('sigma_findings').select('entities').limit(8000);
    if (error) throw new Error(error.message);

    const names: string[] = [];
    for (const f of data ?? []) {
      for (const e of ((f as any).entities ?? [])) {
        if (e.type === 'location' && e.text) names.push(e.text);
      }
    }
    const result = await buildGeocodeCache(names);
    return NextResponse.json({ distinctLocationsSeen: new Set(names).size, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Geocode build failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
