import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    !pathname.startsWith('/admin/_next')
  ) {
    const authHeader = request.headers.get('authorization');
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Agent Portal Admin"' },
      });
    }

    const expectedAuth = 'Basic ' + Buffer.from(`admin:${expectedPassword}`).toString('base64');

    let isAuthorized = false;
    if (authHeader) {
      const a = Buffer.from(authHeader);
      const b = Buffer.from(expectedAuth);
      if (a.length === b.length) {
        isAuthorized = crypto.timingSafeEqual(a, b);
      }
    }

    if (!isAuthorized) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Agent Portal Admin"' },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
