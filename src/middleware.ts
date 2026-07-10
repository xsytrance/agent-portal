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

    if (!authHeader || !secureCompare(authHeader, expectedAuth)) {
      return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Agent Portal Admin"' },
      });
    }
  }

  return NextResponse.next();
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function secureCompare(a: string, b: string): boolean {
  const mismatch = a.length === b.length ? 0 : 1;
  const actualB = mismatch === 1 ? a : b;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ actualB.charCodeAt(i);
  }
  return result === 0 && mismatch === 0;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
