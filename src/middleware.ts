import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    !pathname.startsWith('/admin/_next')
  ) {
    const authHeader = request.headers.get('authorization') || '';
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Agent Portal Admin"' },
      });
    }

    const expectedAuth = 'Basic ' + Buffer.from(`admin:${expectedPassword}`).toString('base64');

    // Constant-time string comparison to prevent timing attacks
    let mismatch = authHeader.length === expectedAuth.length ? 0 : 1;
    const len = Math.max(authHeader.length, expectedAuth.length);
    for (let i = 0; i < len; i++) {
      const charA = i < authHeader.length ? authHeader.charCodeAt(i) : 0;
      const charB = i < expectedAuth.length ? expectedAuth.charCodeAt(i) : 0;
      mismatch |= charA ^ charB;
    }

    if (mismatch !== 0) {
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
