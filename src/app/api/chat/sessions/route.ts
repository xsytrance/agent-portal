import { NextResponse } from 'next/server';
import { getUserContext } from '@/app/lib/auth/userContext';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';

export async function GET(request: Request) {
  const user = await getUserContext(request);
  if (!isDatabaseConfigured() || user.isGuest || !user.databaseBacked) {
    return NextResponse.json({ success: true, sessions: [] });
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.userId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    success: true,
    sessions: sessions.map((session) => ({
      id: session.id,
      title: session.title,
      agentId: session.agentId,
      updatedAt: session.updatedAt.toISOString(),
      latestMessage: session.messages[0]?.content ?? null,
    })),
  });
}
