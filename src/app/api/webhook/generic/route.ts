import { NextResponse } from 'next/server';
import { normalizeWebhookPayload } from '@/app/lib/webhook/normalizer';

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    const signal = normalizeWebhookPayload(rawBody);

    if (!signal) {
      return NextResponse.json({ error: 'Invalid webhook payload structure' }, { status: 400 });
    }

    // In a full implementation, this signal would be passed to the BehaviorDirector
    // behaviorDirector.ingestSignal(signal);

    return NextResponse.json({ success: true, processed: true, signalId: signal.id }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
