import { NextResponse } from 'next/server';
import { Signal } from '@/app/lib/behavior/types';
import { error as logError } from '@/app/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Expected an array of signals' }, { status: 400 });
    }

    const validSignals: Signal[] = [];

    for (const item of body) {
      if (item && typeof item === 'object' && 'type' in item && 'source' in item && 'payload' in item && 'urgency' in item) {
          validSignals.push({
            id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
            source: typeof item.source === 'string' ? item.source as Signal['source'] : 'user',
            type: typeof item.type === 'string' ? item.type : 'unknown',
            payload: typeof item.payload === 'object' && item.payload !== null ? item.payload : {},
            timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
            urgency: typeof item.urgency === 'number' ? item.urgency : 1.0,
          });
      }
    }

    // In a full implementation, these validSignals would be passed to the BehaviorDirector
    // For example: validSignals.forEach(signal => behaviorDirector.ingestSignal(signal));

    return NextResponse.json({ success: true, processed: validSignals.length }, { status: 200 });

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await logError('signals-route', 'Error processing signals', {
      route: '/api/agent/signals',
      details: { error: errorMsg }
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
