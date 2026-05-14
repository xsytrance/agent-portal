import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';
import { getCommercialCaps } from '@/app/lib/providers/commercialPricing';

const requestBuckets = new Map<string, number[]>();

export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

function pruneRecent(timestamps: number[], now: number, windowMs: number): number[] {
  return timestamps.filter((timestamp) => now - timestamp <= windowMs);
}

export async function enforcePromptAndRateGuards(
  userId: string,
  prompt: string,
  estimatedMicrocredits: bigint,
): Promise<GuardResult> {
  const caps = getCommercialCaps();

  if (prompt.length > caps.maxPromptChars) {
    return { allowed: false, reason: `Prompt exceeds max size of ${caps.maxPromptChars} characters.` };
  }

  const now = Date.now();
  const key = `${userId}:chat`;
  const recent = pruneRecent(requestBuckets.get(key) ?? [], now, 60_000);
  if (recent.length >= 20) {
    return { allowed: false, reason: 'Rate limit exceeded. Please slow down.' };
  }
  recent.push(now);
  requestBuckets.set(key, recent);

  if (!isDatabaseConfigured()) return { allowed: true };

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const daily = await prisma.userDailySpend.findUnique({
    where: { userId_spendDate: { userId, spendDate: startOfDay } },
  });
  const userSpend = daily?.spentMicrocredits ?? 0n;
  if (userSpend + estimatedMicrocredits > caps.dailySpendCapMicrocredits) {
    return { allowed: false, reason: 'Daily user spend cap would be exceeded.' };
  }

  const global = await prisma.userDailySpend.aggregate({
    where: { spendDate: startOfDay },
    _sum: { spentMicrocredits: true },
  });
  const globalSpend = global._sum.spentMicrocredits ?? 0n;
  if (globalSpend + estimatedMicrocredits > caps.globalDailySpendCapMicrocredits) {
    return { allowed: false, reason: 'Emergency global spend cap would be exceeded.' };
  }

  return { allowed: true };
}

export async function recordDailySpend(userId: string, amountMicrocredits: bigint, blocked = false) {
  if (!isDatabaseConfigured()) return;

  const spendDate = new Date();
  spendDate.setUTCHours(0, 0, 0, 0);

  await prisma.userDailySpend.upsert({
    where: { userId_spendDate: { userId, spendDate } },
    update: blocked
      ? {
          blockedRequestCount: { increment: 1 },
        }
      : {
          spentMicrocredits: { increment: amountMicrocredits },
          requestCount: { increment: 1 },
        },
    create: {
      userId,
      spendDate,
      spentMicrocredits: blocked ? 0n : amountMicrocredits,
      requestCount: blocked ? 0 : 1,
      blockedRequestCount: blocked ? 1 : 0,
    },
  });
}
