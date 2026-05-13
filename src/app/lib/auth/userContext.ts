import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { authOptions } from './authOptions';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';

export interface UserContext {
  userId: string;
  isGuest: boolean;
  databaseBacked: boolean;
}

function guestIdFromRequest(request?: Request | NextRequest): string {
  const headerGuestId = request?.headers.get('x-agent-portal-guest-id');
  if (headerGuestId && /^[a-zA-Z0-9_-]{3,80}$/.test(headerGuestId)) return `guest_${headerGuestId}`;
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

  if (!isDatabaseConfigured()) {
    return {
      userId,
      isGuest: true,
      databaseBacked: false,
    };
  }

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: 'Guest',
      isGuest: true,
    },
  });

  await prisma.userWallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return {
    userId,
    isGuest: true,
    databaseBacked: true,
  };
}
