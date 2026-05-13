import { NextResponse } from 'next/server';
import { decideBehavior } from '@/app/lib/behavior/behaviorDirector';
import { validateBehaviorPlan } from '@/app/lib/behavior/behaviorValidator';
import { validateInputSignal } from '@/app/lib/signals/signalValidator';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, errors: ['Invalid JSON body'] }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, errors: ['Request body must be an object'] }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const signalResult = validateInputSignal(raw.signal);
  if (!signalResult.valid || !signalResult.sanitized) {
    return NextResponse.json({ success: false, errors: signalResult.errors }, { status: 400 });
  }

  const decision = decideBehavior({
    signal: signalResult.sanitized,
    session: raw.session && typeof raw.session === 'object' && !Array.isArray(raw.session) ? raw.session : undefined,
    budget: raw.budget && typeof raw.budget === 'object' && !Array.isArray(raw.budget) ? raw.budget : undefined,
    now: typeof raw.now === 'string' ? raw.now : undefined,
  });

  const planValidation = decision.plan ? validateBehaviorPlan(decision.plan) : undefined;
  if (planValidation && !planValidation.valid) {
    return NextResponse.json(
      { success: false, errors: planValidation.errors, decision },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    decision,
    planValidation: planValidation ? { valid: planValidation.valid } : undefined,
  });
}
