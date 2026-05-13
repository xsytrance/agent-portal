import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';

export interface PersistChatInput {
  userId: string;
  chatSessionId?: string;
  agentId: string;
  userMessage: string;
  assistantMessage: string;
  metadata?: Prisma.InputJsonValue;
}

export async function persistChatExchange(input: PersistChatInput): Promise<string | undefined> {
  if (!isDatabaseConfigured()) return undefined;

  const session = input.chatSessionId
    ? await prisma.chatSession.upsert({
        where: { id: input.chatSessionId },
        update: { updatedAt: new Date() },
        create: {
          id: input.chatSessionId,
          userId: input.userId,
          agentId: input.agentId,
          title: input.userMessage.slice(0, 80),
        },
      })
    : await prisma.chatSession.create({
        data: {
          userId: input.userId,
          agentId: input.agentId,
          title: input.userMessage.slice(0, 80),
        },
      });

  await prisma.chatMessage.createMany({
    data: [
      {
        userId: input.userId,
        chatSessionId: session.id,
        agentId: input.agentId,
        role: 'user',
        content: input.userMessage,
      },
      {
        userId: input.userId,
        chatSessionId: session.id,
        agentId: input.agentId,
        role: 'assistant',
        content: input.assistantMessage,
        metadata: input.metadata,
      },
    ],
  });

  return session.id;
}
