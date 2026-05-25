import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateWebhook, sourceRegistry } from '@/app/lib/webhook/webhookAuth';
import { webhookRateLimiter, WebhookSourceId } from '@/app/lib/webhook/rateLimiter';
import { normalizeWebhookPayload } from '@/app/lib/webhook/normalizer';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  // 1. Source exists?
  const sourceConfig = sourceRegistry.get(source as WebhookSourceId);
  if (!sourceConfig) {
    return NextResponse.json({ error: 'Unknown webhook source' }, { status: 404 });
  }

  // 2. Authenticate
  const authResult = await authenticateWebhook(source as WebhookSourceId, request);
  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: 401 }
    );
  }

  // 3. Rate limit
  if (!webhookRateLimiter.allow(source)) {
    const retryAfter = webhookRateLimiter.getRetryAfter(source);
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  // 4. Parse body
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 5. Normalize to PortalEvent (currently mapped to Signal in normalizer)
  const signal = normalizeWebhookPayload(payload);

  if (!signal) {
     return NextResponse.json(
      { error: 'Normalization failed', details: 'Invalid payload structure' },
      { status: 422 }
    );
  }

  // In a full implementation, this signal would be passed to the BehaviorDirector
  // behaviorDirector.ingestSignal(signal);

  return NextResponse.json({ success: true, processed: true, signalId: signal.id }, { status: 200 });
}