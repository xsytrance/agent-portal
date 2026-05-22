import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

    // Constant-time string comparison for Edge Runtime
    const a = new TextEncoder().encode(expectedAuth);
    const b = new TextEncoder().encode(authHeader || '');

    let isAuthorized = true;
    if (a.length !== b.length) {
      isAuthorized = false;
    }

    // Always compare arrays of the same length to avoid timing leaks based on length difference
    const compareLength = a.length;
    const compareB = a.length === b.length ? b : a;

    let result = 0;
    for (let i = 0; i < compareLength; i++) {
        // Bitwise operations for constant-time comparison
        result |= a[i] ^ compareB[i];
    }

    if (result !== 0) {
        isAuthorized = false;
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
