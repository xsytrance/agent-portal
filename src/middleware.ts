import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Web Crypto API HMAC for constant-time comparison
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const aBuffer = encoder.encode(a);
  const bBuffer = encoder.encode(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  // Generate a random key for HMAC
  const key = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify']
  );

  // Sign string A
  const signature = await crypto.subtle.sign('HMAC', key, aBuffer);

  // Verify string B using the signature of string A
  // crypto.subtle.verify is guaranteed to be constant time
  return crypto.subtle.verify('HMAC', key, signature, bBuffer);
}

export async function middleware(request: NextRequest) {
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

    const isAuthorized = await timingSafeEqual(expectedAuth, authHeader || '');

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
