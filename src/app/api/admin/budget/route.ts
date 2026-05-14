import { NextResponse } from 'next/server';
import { getBudgetSnapshot, listBudgetSnapshots } from '@/app/lib/budget/budgetManager';
import { getAllowedModels, getCommercialCaps, isProviderEmergencyDisabled } from '@/app/lib/providers/commercialPricing';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (sessionId) {
    return NextResponse.json({
      success: true,
      mode: 'legacy-session-budget',
      budget: getBudgetSnapshot(sessionId),
      commercial: {
        caps: {
          dailySpendCapMicrocredits: getCommercialCaps().dailySpendCapMicrocredits.toString(),
          globalDailySpendCapMicrocredits: getCommercialCaps().globalDailySpendCapMicrocredits.toString(),
          maxPromptChars: getCommercialCaps().maxPromptChars,
        },
        openRouterEmergencyDisabled: isProviderEmergencyDisabled(),
        allowedModels: getAllowedModels(),
      },
    });
  }

  return NextResponse.json({
    success: true,
    mode: 'legacy-session-budget',
    budgets: listBudgetSnapshots(),
    commercial: {
      caps: {
        dailySpendCapMicrocredits: getCommercialCaps().dailySpendCapMicrocredits.toString(),
        globalDailySpendCapMicrocredits: getCommercialCaps().globalDailySpendCapMicrocredits.toString(),
        maxPromptChars: getCommercialCaps().maxPromptChars,
      },
      openRouterEmergencyDisabled: isProviderEmergencyDisabled(),
      allowedModels: getAllowedModels(),
    },
  });
}
