import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to login page and API routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionToken = request.cookies.get('kairos_session')?.value;
  
  if (!sessionToken) {
    // Redirect to login if no session
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Decode session token
  const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
  const [username, timestamp] = decoded.split(':');
  
  // Check if session is valid (24 hours)
  const sessionAge = Date.now() - parseInt(timestamp);
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  if (sessionAge > maxAge) {
    // Redirect to login if session expired
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Allow access to dashboard
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};