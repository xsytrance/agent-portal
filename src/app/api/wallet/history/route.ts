import { NextResponse } from 'next/server';
import { getUserContext } from '@/app/lib/auth/userContext';
import { getWalletHistory } from '@/app/lib/wallet/walletService';

export async function GET(request: Request) {
  const user = await getUserContext(request);
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? 50);
  const transactions = await getWalletHistory(user.userId, limit);

  return NextResponse.json({
    success: true,
    user,
    transactions,
  });
}
