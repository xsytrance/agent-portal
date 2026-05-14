import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

function basicAuthAllowed(): boolean {
  if (process.env.ADMIN_BASIC_AUTH_ENABLED === 'true') return true;
  return process.env.NODE_ENV !== 'production' && process.env.ADMIN_BASIC_AUTH_ENABLED !== 'false';
}

function hasValidBasicAuth(request: NextRequest): boolean {
  if (!basicAuthAllowed()) return false;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return false;
  const authHeader = request.headers.get('authorization');
  const expectedAuth = 'Basic ' + Buffer.from(`admin:${expectedPassword}`).toString('base64');
  return authHeader === expectedAuth;
}

async function hasAdminSession(request: NextRequest): Promise<boolean> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET }).catch(() => null);
  if (!token) return false;
  if (token.role === 'admin') return true;
  const allowedEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const email = typeof token.email === 'string' ? token.email.toLowerCase() : '';
  return !!email && allowedEmails.includes(email);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    !pathname.startsWith('/admin/_next')
  ) {
    if (!(await hasAdminSession(request)) && !hasValidBasicAuth(request)) {
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
