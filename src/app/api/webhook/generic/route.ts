import { NextResponse } from 'next/server';
import { getBehaviorDirector } from '@/app/lib/behavior/instance';
import { normalizeWebhookPayload } from '@/app/lib/webhook/normalizer';
import { WebhookSourceId } from '@/app/lib/webhook/types';

export async function POST(request: Request) {
  try {
    // 1. Basic generic API key validation
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization');

    // Fallback/loose checking for Phase 2 implementation.
    // In production, compare against process.env.WEBHOOK_SECRET_GENERIC
    if (!apiKey) {
       return NextResponse.json({ error: 'Unauthorized: Missing API Key' }, { status: 401 });
    }

    const body = await request.json();

    // 2. Determine source logic (e.g. from a custom header, URL param, or default generic)
    const sourceHeader = request.headers.get('x-webhook-source');
    const sourceId: WebhookSourceId =
       ['openclaw', 'hermes', 'scrapers', 'generic'].includes(sourceHeader || '')
         ? (sourceHeader as WebhookSourceId)
         : 'generic';

    // 3. Normalize external payload into internal Signal format
    const externalSignal = normalizeWebhookPayload(sourceId, body);

    // Map `ExternalSignal` to `Signal` core structure for the Behavior Director
    const internalSignal = {
        id: externalSignal.id,
        source: 'external' as const,
        type: externalSignal.kind,
        payload: externalSignal.payload,
        timestamp: new Date(externalSignal.timestamp).getTime(),
        urgency: 0.8, // Webhooks generally map higher urgency unless specified
        targetAgentId: externalSignal.targetAgentId
    };

    // 4. Dispatch to the singleton Behavior Director
    const director = getBehaviorDirector(externalSignal.targetAgentId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    director.ingestSignal(internalSignal as any);

    return NextResponse.json({ success: true, processed: 1, source: sourceId });

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error processing webhook';
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }
}
