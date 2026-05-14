import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { authOptions } from './authOptions';
import { isDatabaseConfigured } from '@/app/lib/db/prisma';

export interface UserContext {
  userId: string;
  isGuest: boolean;
  databaseBacked: boolean;
}

function guestIdFromRequest(request?: Request | NextRequest): string {
  // Persistent paid wallets require an authenticated user. Header-selected guest
  // IDs are intentionally ignored for DB-backed money paths.
  if (!isDatabaseConfigured()) {
    const headerGuestId = request?.headers.get('x-agent-portal-guest-id');
    if (headerGuestId && /^[a-zA-Z0-9_-]{3,80}$/.test(headerGuestId)) return `guest_${headerGuestId}`;
  }
  return 'guest_demo';
}

export async function getUserContext(request?: Request | NextRequest): Promise<UserContext> {
  const authConfigured = !!process.env.NEXTAUTH_SECRET || process.env.NODE_ENV !== 'production';
  const session = authConfigured ? await getServerSession(authOptions).catch(() => null) : null;
  const sessionUserId = session?.user?.id;

  if (sessionUserId) {
    return {
      userId: sessionUserId,
      isGuest: false,
      databaseBacked: isDatabaseConfigured(),
    };
  }

  const userId = guestIdFromRequest(request);

  return {
    userId,
    isGuest: true,
    databaseBacked: false,
  };
}
