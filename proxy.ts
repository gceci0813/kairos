import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  // Skip auth check if Supabase is not configured
  if (!supabaseUrl || supabaseUrl.includes('your_supabase') || !supabaseKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh session — ignore errors, default to no user
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({
      data: { user: null },
    }));

    const { pathname } = request.nextUrl;

    // Protect /dashboard routes
    if (pathname.startsWith('/dashboard') && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect logged-in users away from auth pages
    if ((pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) && user) {
      const dashUrl = request.nextUrl.clone();
      dashUrl.pathname = '/dashboard';
      return NextResponse.redirect(dashUrl);
    }

    return supabaseResponse;
  } catch {
    // If middleware throws for any reason, let the request through
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
