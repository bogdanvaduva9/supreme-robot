import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/access', '/api/auth/access'];

export function middleware(request: NextRequest) {
  // If no key is configured (local dev), skip the gate entirely
  if (!process.env.ALPHA_ACCESS_KEY) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // If already authenticated, redirect away from /access
    if (pathname === '/access') {
      const hasAccess = request.cookies.get('lifesim_access')?.value === 'granted';
      if (hasAccess) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  const hasAccess = request.cookies.get('lifesim_access')?.value === 'granted';

  if (!hasAccess) {
    const url = new URL('/access', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
};
