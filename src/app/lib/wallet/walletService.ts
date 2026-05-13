import { Prisma, type WalletTransactionType } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';

export interface WalletSummary {
  userId: string;
  databaseBacked: boolean;
  balanceMicrocredits: string;
  lifetimePurchasedMicrocredits: string;
  lifetimeUsedMicrocredits: string;
}

export interface LedgerEntryInput {
  userId: string;
  type: WalletTransactionType;
  amountMicrocredits: bigint;
  idempotencyKey?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  providerRequestId?: string;
  description?: string;
  metadata?: Prisma.InputJsonValue;
}

function stringifyBigInt(value: bigint): string {
  return value.toString();
}

export async function ensureWallet(userId: string) {
  return prisma.userWallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getWalletSummary(userId: string): Promise<WalletSummary> {
  if (!isDatabaseConfigured()) {
    return {
      userId,
      databaseBacked: false,
      balanceMicrocredits: '0',
      lifetimePurchasedMicrocredits: '0',
      lifetimeUsedMicrocredits: '0',
    };
  }

  const wallet = await ensureWallet(userId);
  return {
    userId,
    databaseBacked: true,
    balanceMicrocredits: stringifyBigInt(wallet.balanceMicrocredits),
    lifetimePurchasedMicrocredits: stringifyBigInt(wallet.lifetimePurchasedMicrocredits),
    lifetimeUsedMicrocredits: stringifyBigInt(wallet.lifetimeUsedMicrocredits),
  };
}

export async function getWalletHistory(userId: string, limit = 50) {
  if (!isDatabaseConfigured()) return [];

  const rows = await prisma.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 100),
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    amountMicrocredits: stringifyBigInt(row.amountMicrocredits),
    balanceAfterMicrocredits: stringifyBigInt(row.balanceAfterMicrocredits),
    idempotencyKey: row.idempotencyKey,
    stripeCheckoutSessionId: row.stripeCheckoutSessionId,
    providerRequestId: row.providerRequestId,
    description: row.description,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createLedgerEntry(input: LedgerEntryInput) {
  if (!isDatabaseConfigured()) {
    throw new Error('Database is required for wallet ledger writes');
  }

  return prisma.$transaction(async (tx) => {
    if (input.idempotencyKey) {
      const existing = await tx.walletTransaction.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return existing;
    }

    const wallet = await tx.userWallet.upsert({
      where: { userId: input.userId },
      update: {},
      create: { userId: input.userId },
    });

    const nextBalance = wallet.balanceMicrocredits + input.amountMicrocredits;
    if (nextBalance < 0n) {
      throw new Error('Insufficient wallet balance');
    }

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: input.userId,
        type: input.type,
        amountMicrocredits: input.amountMicrocredits,
        balanceAfterMicrocredits: nextBalance,
        idempotencyKey: input.idempotencyKey,
        stripeCheckoutSessionId: input.stripeCheckoutSessionId,
        stripePaymentIntentId: input.stripePaymentIntentId,
        providerRequestId: input.providerRequestId,
        description: input.description,
        metadata: input.metadata,
      },
    });

    await tx.userWallet.update({
      where: { id: wallet.id },
      data: {
        balanceMicrocredits: nextBalance,
        lifetimePurchasedMicrocredits: input.amountMicrocredits > 0n && input.type === 'credit_purchase'
          ? wallet.lifetimePurchasedMicrocredits + input.amountMicrocredits
          : wallet.lifetimePurchasedMicrocredits,
        lifetimeUsedMicrocredits: input.amountMicrocredits < 0n && input.type === 'usage_deduction'
          ? wallet.lifetimeUsedMicrocredits + (input.amountMicrocredits * -1n)
          : wallet.lifetimeUsedMicrocredits,
      },
    });

    return transaction;
  });
}

export async function hasSufficientBalance(userId: string, amountMicrocredits: bigint): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  const wallet = await ensureWallet(userId);
  return wallet.balanceMicrocredits >= amountMicrocredits;
}
