import { NextResponse } from 'next/server';
import { getUserContext } from '@/app/lib/auth/userContext';
import { getWalletSummary } from '@/app/lib/wallet/walletService';

export async function GET(request: Request) {
  const user = await getUserContext(request);
  const wallet = await getWalletSummary(user.userId);

  return NextResponse.json({
    success: true,
    user,
    wallet,
  });
}
