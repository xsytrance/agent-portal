import { NextResponse } from 'next/server';
import { getUserContext } from '@/app/lib/auth/userContext';
import { getWalletSummary } from '@/app/lib/wallet/walletService';

export async function GET(request: Request) {
  const user = await getUserContext(request);
  const wallet = user.databaseBacked
    ? await getWalletSummary(user.userId)
    : {
        userId: user.userId,
        databaseBacked: false,
        balanceMicrocredits: '0',
        lifetimePurchasedMicrocredits: '0',
        lifetimeUsedMicrocredits: '0',
      };

  return NextResponse.json({
    success: true,
    user,
    wallet,
  });
}
