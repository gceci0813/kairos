import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { anthropic } from '@/lib/anthropic';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export const runtime = 'nodejs';

/**
 * POST /api/user/report
 *
 * Self-service analyst report. Scoped entirely to the authenticated user:
 *   1. Text analysis — Claude analyzes user-submitted content for key themes
 *   2. Image quality check — Claude Vision checks blur/lighting/face count (NO identity)
 *   3. Recent activity — last 10 audit log entries for this user only
 *
 * Python equivalent:
 *   assert_authorized(ctx)          → getAuthenticatedUser()
 *   claude_process(text)            → anthropic.messages.create()
 *   analyze_image_quality(path)     → Claude Vision (quality only, no identity)
 *   fetch_user_data(user_id)        → Supabase audit_logs WHERE user_id = user.id
 */
export async function POST(req: NextRequest) {
  // ── Auth (consent gate: authenticated session = user agreed to platform ToS) ─
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { text, image_base64, image_media_type } = body as {
    text?: string;
    image_base64?: string;
    image_media_type?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  };

  const result: Record<string, unknown> = {
    subject_user_id: user?.id ?? 'dev-mode',
    purpose:         'user_self_service',
    generated_at:    Math.floor(Date.now() / 1000),
  };

  // ── 1. Text analysis (user-submitted content only) ─────────────────────────
  if (text && text.trim().length > 0) {
    try {
      const msg = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 1200,
        messages: [{
          role:    'user',
          content: `Analyze this user-submitted text for key themes, action items, and notable points. Structure your response clearly:\n\n${text}`,
        }],
      });
      result.analysis = msg.content[0].type === 'text' ? msg.content[0].text : '';
    } catch (err) {
      result.analysis_error = err instanceof Error ? err.message : 'Analysis failed';
    }
  }

  // ── 2. Image quality check (NO identity — quality metrics only) ────────────
  if (image_base64 && image_media_type) {
    try {
      const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!VALID_TYPES.includes(image_media_type)) {
        result.image_quality_error = 'Unsupported image format. Use JPEG, PNG, GIF, or WebP.';
      } else {
        const imgMsg = await anthropic.messages.create({
          model:      'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: [
              {
                type:   'image',
                source: {
                  type:       'base64',
                  media_type: image_media_type,
                  data:       image_base64,
                },
              },
              {
                type: 'text',
                text: [
                  'Assess the TECHNICAL QUALITY of this image only.',
                  'Report ONLY these four metrics — nothing else:',
                  '1. Faces visible: count only (e.g., "2 faces visible"). Do NOT name, describe, or identify anyone.',
                  '2. Sharpness: sharp | acceptable | blurry',
                  '3. Lighting: good | poor | overexposed | underexposed',
                  '4. Overall usability: usable | unusable',
                  'Do not include any other information about the image content.',
                ].join('\n'),
              },
            ],
          }],
        });
        result.image_quality = imgMsg.content[0].type === 'text' ? imgMsg.content[0].text : '';
      }
    } catch (err) {
      result.image_quality_error = err instanceof Error ? err.message : 'Image check failed';
    }
  }

  // ── 3. User's own recent activity (scoped by JWT user_id, not by name) ─────
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim();
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (supabaseUrl && !supabaseUrl.includes('your_supabase') && supabaseKey && user) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options); } catch { /* read-only ctx */ }
            });
          },
        },
      });

      // Fetch only this user's own records — never a name-based lookup
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('module, action, created_at')
        .eq('user_id', user.id)          // UUID from JWT — not a name
        .order('created_at', { ascending: false })
        .limit(10);

      result.recent_activity = logs ?? [];
    } catch {
      result.recent_activity = [];
    }
  } else {
    result.recent_activity = [];
  }

  return NextResponse.json(result);
}
