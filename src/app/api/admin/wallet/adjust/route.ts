import { NextResponse } from 'next/server';
import type { WalletTransactionType } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';
import { createLedgerEntry } from '@/app/lib/wallet/walletService';

const ALLOWED_TYPES: WalletTransactionType[] = ['admin_adjustment', 'refund', 'promotional_credit'];

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: 'Database is required for wallet adjustments' }, { status: 503 });
  }

  let body: {
    userId?: string;
    type?: WalletTransactionType;
    amountMicrocredits?: string;
    description?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.userId || typeof body.userId !== 'string') {
    return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
  }
  if (!body.type || !ALLOWED_TYPES.includes(body.type)) {
    return NextResponse.json({ success: false, error: `type must be one of ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
  }
  if (!body.amountMicrocredits || !/^-?\d+$/.test(body.amountMicrocredits)) {
    return NextResponse.json({ success: false, error: 'amountMicrocredits must be an integer string' }, { status: 400 });
  }

  const amountMicrocredits = BigInt(body.amountMicrocredits);
  if ((body.type === 'refund' || body.type === 'promotional_credit') && amountMicrocredits <= 0n) {
    return NextResponse.json({ success: false, error: `${body.type} must be a positive credit` }, { status: 400 });
  }
  if (amountMicrocredits === 0n) {
    return NextResponse.json({ success: false, error: 'amountMicrocredits cannot be zero' }, { status: 400 });
  }

  await prisma.user.upsert({
    where: { id: body.userId },
    update: {},
    create: {
      id: body.userId,
      name: body.userId.startsWith('guest_') ? 'Guest' : undefined,
      isGuest: body.userId.startsWith('guest_'),
    },
  });

  try {
    const transaction = await createLedgerEntry({
      userId: body.userId,
      type: body.type,
      amountMicrocredits,
      idempotencyKey: `admin:${body.userId}:${body.type}:${Date.now()}`,
      description: body.description || `Admin ${body.type}`,
      metadata: {
        source: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amountMicrocredits: transaction.amountMicrocredits.toString(),
        balanceAfterMicrocredits: transaction.balanceAfterMicrocredits.toString(),
        createdAt: transaction.createdAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Wallet adjustment failed' },
      { status: 400 },
    );
  }
}
