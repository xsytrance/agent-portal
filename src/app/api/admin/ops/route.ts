import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';
import { getAllowedModels, isProviderEmergencyDisabled } from '@/app/lib/providers/commercialPricing';

function money(value: bigint | number | null | undefined): string {
  return (value ?? 0).toString();
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      success: true,
      databaseBacked: false,
      totals: {
        revenueMicrocredits: '0',
        estimatedProviderSpendMicrocredits: '0',
        activeUsers: 0,
        blockedRequests: 0,
      },
      wallets: [],
      recentTransactions: [],
      topSpenders: [],
      providerHealth: {
        openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
        emergencyDisabled: isProviderEmergencyDisabled(),
        allowedModels: getAllowedModels(),
      },
    });
  }

  const [
    revenue,
    providerSpend,
    activeUsers,
    blockedRequests,
    wallets,
    recentTransactions,
    topUsage,
  ] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { type: 'credit_purchase' },
      _sum: { amountMicrocredits: true },
    }),
    prisma.providerRequestLog.aggregate({
      where: { status: 'completed' },
      _sum: { actualCostMicrocredits: true, estimatedCostMicrocredits: true },
    }),
    prisma.user.count({
      where: { updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.providerRequestLog.count({ where: { status: 'blocked' } }),
    prisma.userWallet.findMany({
      orderBy: { balanceMicrocredits: 'desc' },
      take: 10,
      include: { user: { select: { email: true, name: true, isGuest: true } } },
    }),
    prisma.walletTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { email: true, name: true, isGuest: true } } },
    }),
    prisma.usageEvent.groupBy({
      by: ['userId'],
      _sum: { actualMicrocredits: true },
      orderBy: { _sum: { actualMicrocredits: 'desc' } },
      take: 10,
    }),
  ]);

  const topUsers = await prisma.user.findMany({
    where: { id: { in: topUsage.map((row) => row.userId) } },
    select: { id: true, email: true, name: true, isGuest: true },
  });

  return NextResponse.json({
    success: true,
    databaseBacked: true,
    totals: {
      revenueMicrocredits: money(revenue._sum.amountMicrocredits),
      estimatedProviderSpendMicrocredits: money(providerSpend._sum.actualCostMicrocredits ?? providerSpend._sum.estimatedCostMicrocredits),
      activeUsers,
      blockedRequests,
    },
    wallets: wallets.map((wallet) => ({
      userId: wallet.userId,
      user: wallet.user,
      balanceMicrocredits: money(wallet.balanceMicrocredits),
      lifetimePurchasedMicrocredits: money(wallet.lifetimePurchasedMicrocredits),
      lifetimeUsedMicrocredits: money(wallet.lifetimeUsedMicrocredits),
    })),
    recentTransactions: recentTransactions.map((txn) => ({
      id: txn.id,
      userId: txn.userId,
      user: txn.user,
      type: txn.type,
      amountMicrocredits: money(txn.amountMicrocredits),
      balanceAfterMicrocredits: money(txn.balanceAfterMicrocredits),
      description: txn.description,
      createdAt: txn.createdAt.toISOString(),
    })),
    topSpenders: topUsage.map((row) => ({
      userId: row.userId,
      user: topUsers.find((user) => user.id === row.userId) ?? null,
      actualMicrocredits: money(row._sum.actualMicrocredits),
    })),
    providerHealth: {
      openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
      emergencyDisabled: isProviderEmergencyDisabled(),
      allowedModels: getAllowedModels(),
    },
  });
}
