import { NextResponse } from 'next/server';
import { getBudgetSnapshot, listBudgetSnapshots } from '@/app/lib/budget/budgetManager';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (sessionId) {
    return NextResponse.json({
      success: true,
      budget: getBudgetSnapshot(sessionId),
    });
  }

  return NextResponse.json({
    success: true,
    budgets: listBudgetSnapshots(),
  });
}
