import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { normalizeWebhookPayload } from '@/app/lib/webhook/normalizer';
import { signalToPortalEvent } from '@/app/lib/webhook/toPortalEvent';
import { addEvent } from '@/app/lib/events/eventStore';
import { webhookRateLimiter } from '@/app/lib/webhook/rateLimiter';

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Compare against self to keep timing constant, then fail.
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  // Generic webhooks feed public portal events, so they must be
  // authenticated — otherwise anyone could put words on the page.
  const expected = process.env.WEBHOOK_SECRET_GENERIC;
  if (!expected) {
    return NextResponse.json({ error: 'Webhook not configured (WEBHOOK_SECRET_GENERIC unset)' }, { status: 503 });
  }
  const provided = req.headers.get('x-webhook-secret') || '';
  if (!secretsMatch(provided, expected)) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  if (!webhookRateLimiter.allow('generic')) {
    const retryAfter = webhookRateLimiter.getRetryAfter('generic');
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const rawBody = await req.json();

    const signal = normalizeWebhookPayload(rawBody);

    if (!signal) {
      return NextResponse.json({ error: 'Invalid webhook payload structure' }, { status: 400 });
    }

    // Hand off to the presence layer via the event store.
    const sequence = await addEvent(signalToPortalEvent(signal));

    return NextResponse.json({ success: true, processed: true, signalId: signal.id, sequence }, { status: 200 });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error processing webhook' }, { status: 500 });
  }
}
