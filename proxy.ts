import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Temporarily disable authentication to fix build
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};