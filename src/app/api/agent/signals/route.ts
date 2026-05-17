import { NextResponse } from 'next/server';
import { InputSignal } from '@/app/lib/signals/types';

// In a real application, this would route to an initialized BehaviorDirector tied to the session.
// For Phase 2c, we establish the endpoint and basic validation.

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support batching (array) or single signal
    const signals: InputSignal[] = Array.isArray(body) ? body : [body];

    if (!signals || signals.length === 0) {
      return NextResponse.json({ error: 'No signals provided' }, { status: 400 });
    }

    // Basic validation
    const validSignals = signals.filter(s => s.id && s.kind && s.targetAgentId);

    if (validSignals.length === 0) {
        return NextResponse.json({ error: 'Malformed signals' }, { status: 400 });
    }

    // Route to BehaviorDirector singleton
    const { getBehaviorDirector } = await import('@/app/lib/behavior/instance');
    const director = getBehaviorDirector();
    for (const signal of validSignals) {
       // Map InputSignal (from HTTP) to internal Director Signal format
       const internalSignal = {
           id: signal.id,
           source: signal.kind.split('.')[0] as 'user' | 'external' | 'autonomous' | 'system',
           type: signal.kind,
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           payload: (signal as any).payload || {},
           timestamp: new Date(signal.timestamp).getTime(),
           urgency: 0.5, // Standard urgency by default unless overridden
           targetAgentId: signal.targetAgentId
       };
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       director.ingestSignal(internalSignal as any);
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
        // console.log(`Ingested ${validSignals.length} signals:`, validSignals.map(s => s.kind).join(', '));
    }

    return NextResponse.json({ success: true, processed: validSignals.length });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
