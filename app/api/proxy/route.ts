import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Kairos-styled fallback page shown inside the iframe when a site blocks
 *  server-side fetching (Cloudflare, WAF, bot detection, etc.).
 *  Uses target="_top" so "Open" navigates the whole browser tab — same
 *  window, no new tab — and the user can press Back to return.
 */
function blockedPage(url: string, name: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #080D18;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', ui-monospace, monospace;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 32px;
    }
    .card { max-width: 420px; width: 100%; }
    .meta {
      display: flex; align-items: center; gap: 10px; margin-bottom: 24px;
    }
    .dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #DC2626; box-shadow: 0 0 8px #DC2626;
      flex-shrink: 0;
    }
    .badge {
      font-size: 10px; font-weight: 700; letter-spacing: .15em; color: #EF4444;
      background: #3B0A0A; border: 1px solid #EF4444;
      padding: 2px 8px; border-radius: 4px;
    }
    .mono { font-size: 10px; color: #475569; font-family: monospace; margin-left: auto; }
    h2 { font-size: 22px; font-weight: 700; color: #F1F5F9; margin-bottom: 8px; }
    p { font-size: 13px; color: #64748B; line-height: 1.65; margin-bottom: 20px; }
    .url-bar {
      background: #0F172A; border: 1px solid #1E293B; border-radius: 8px;
      padding: 10px 14px; display: flex; align-items: center; gap: 10px;
      margin-bottom: 20px;
    }
    .url-dot { width: 6px; height: 6px; border-radius: 50%; background: #16A34A; flex-shrink: 0; }
    .url-text { font-size: 11px; color: #475569; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .btn {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; background: #2563EB; color: #fff;
      font-size: 13px; font-weight: 600; padding: 14px 20px;
      border-radius: 8px; text-decoration: none;
      transition: background .15s;
    }
    .btn:hover { background: #1D4ED8; }
    .note { font-size: 11px; color: #334155; text-align: center; margin-top: 12px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="meta">
      <div class="dot"></div>
      <span class="badge">BOT PROTECTION</span>
      <span class="mono">DIRECT ACCESS REQUIRED</span>
    </div>
    <h2>${name}</h2>
    <p>
      This source uses bot-detection (Cloudflare or similar WAF) that blocks
      server-side embedding. Click below to open it directly — it will load in
      this same window and you can press <strong style="color:#94A3B8">Back</strong> to return to Kairos.
    </p>
    <div class="url-bar">
      <div class="url-dot"></div>
      <span class="url-text">${url}</span>
    </div>
    <a class="btn" href="${url}" target="_top">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
        <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
      </svg>
      Open ${name}
    </a>
    <p class="note">Opens in this tab · press Back to return to Kairos</p>
  </div>
</body>
</html>`;

  const res = new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
  res.headers.delete('X-Frame-Options');
  res.headers.delete('Content-Security-Policy');
  return res;
}

/** Signals that indicate a bot-protection / challenge page rather than real content */
function isBotBlock(status: number, html: string): boolean {
  if (status === 403 || status === 503) return true;
  return (
    html.includes('cf-browser-verification') ||
    html.includes('cf-chl-') ||
    html.includes('challenge-platform') ||
    html.includes('Just a moment') ||
    html.includes('Enable JavaScript and cookies') ||
    html.includes('Checking your browser') ||
    html.includes('DDoS protection by')
  );
}

/** Detects active iframe-busting JavaScript that would navigate the parent window */
function hasFrameBuster(html: string): boolean {
  return (
    // Assignment to top.location or top.location.href
    /top\.location(?:\.href)?\s*=(?!=)/.test(html) ||
    // top.location.replace( ... )
    /top\.location\.replace\s*\(/.test(html) ||
    // parent.location assignment
    /parent\.location(?:\.href)?\s*=(?!=)/.test(html) ||
    // window.top.location navigation
    /window\.top\.location(?:\.href)?\s*=(?!=)/.test(html)
  );
}

export async function GET(request: NextRequest) {
  const raw  = request.nextUrl.searchParams.get('url');
  const name = request.nextUrl.searchParams.get('name') ?? '';

  if (!raw) return new NextResponse('Missing url parameter', { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return new NextResponse('Invalid protocol', { status: 400 });
  }

  const displayName = name || target.hostname;

  // ── Fetch upstream ─────────────────────────────────────────────────
  let upstream: Response;
  try {
    upstream = await fetch(raw, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[proxy] upstream fetch failed:', err);
    // Network error — show fallback so the user can still open the site
    return blockedPage(raw, displayName);
  }

  const ct = upstream.headers.get('content-type') ?? 'text/html; charset=utf-8';

  // ── Non-HTML assets — stream through unchanged ─────────────────────
  if (!ct.includes('text/html')) {
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { 'Content-Type': ct, 'Cache-Control': 'public, max-age=60' },
    });
  }

  // ── HTML ───────────────────────────────────────────────────────────
  let html = await upstream.text();

  // Detect bot-protection / Cloudflare challenge pages
  if (isBotBlock(upstream.status, html)) {
    return blockedPage(raw, displayName);
  }

  // Detect active iframe-busting JS — show fallback rather than risk parent navigation
  if (hasFrameBuster(html)) {
    return blockedPage(raw, displayName);
  }

  // Remove any existing <base> tags to avoid conflicts
  html = html.replace(/<base[^>]*>/gi, '');

  // Strip known third-party ad/analytics scripts that contain iframe-busting code
  // (e.g. Infolinks, which uses packed JS to detect and escape iframes)
  html = html.replace(
    /<script[^>]+src=["'][^"']*(?:infolinks\.com|doubleclick\.net\/pagead)[^"']*["'][^>]*>\s*<\/script>/gi,
    ''
  );

  // Frame-buster countermeasure: override window.top/parent/frameElement so
  // anti-framing JS (e.g. "if (top !== self) top.location = ...") believes it
  // is already the top-level window and does NOT navigate away.
  const frameBustDefense = `<script>(function(){try{var w=window;Object.defineProperty(w,'top',{get:function(){return w;},configurable:true});Object.defineProperty(w,'parent',{get:function(){return w;},configurable:true});Object.defineProperty(w,'frameElement',{get:function(){return null;},configurable:true});}catch(e){}})();</script>`;

  // Inject <base href> + frame-bust defense as the very first things in <head>
  if (/<head[\s>]/i.test(html)) {
    html = html.replace(/(<head[^>]*>)/i, `$1<base href="${raw}">${frameBustDefense}`);
  } else {
    html = `<base href="${raw}">${frameBustDefense}` + html;
  }

  const response = new NextResponse(html, {
    status: upstream.status,
    headers: { 'Content-Type': ct },
  });

  // Strip headers that prevent iframe embedding
  response.headers.delete('X-Frame-Options');
  response.headers.delete('Content-Security-Policy');
  response.headers.delete('Content-Security-Policy-Report-Only');

  return response;
}
