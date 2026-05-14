import { NextResponse } from 'next/server';
import { getRuntimeMode, isMockMode, isDebugEnabled } from '@/app/lib/config/serverConfig';
import { getBudgetConfig } from '@/app/lib/budget/budgetManager';

export async function GET() {
  const mode = await getRuntimeMode();
  return NextResponse.json({
    mode,
    mock: await isMockMode(),
    debug: await isDebugEnabled(),
    budget: getBudgetConfig(),
    autonomous: { enabled: true, checkIntervalSeconds: 20, idleThresholdSeconds: 5, cooldownSeconds: 30 },
    features: { floatingEye: true, cursorTrail: true, particleBackground: true, chatPanel: true, autonomousActions: true, soundEffects: false },
  });
}
