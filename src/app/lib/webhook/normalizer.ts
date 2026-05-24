import { Signal } from '../behavior/types';

export interface ExternalSignalPayload {
  source: string;
  eventType: string;
  data: Record<string, unknown>;
  timestamp?: number;
  urgency?: number;
}

export function normalizeWebhookPayload(rawPayload: unknown): Signal | null {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return null;
  }

  const payload = rawPayload as Record<string, unknown>;
  const source = typeof payload.source === 'string' ? payload.source : 'unknown_external';

  // Basic validation to ensure we have something usable
  if (!payload.eventType || typeof payload.eventType !== 'string') {
    return null;
  }

  const data = typeof payload.data === 'object' && payload.data !== null ? payload.data as Record<string, unknown> : {};
  const urgency = typeof payload.urgency === 'number' ? payload.urgency : 0.5;

  return {
    id: crypto.randomUUID(),
    source: 'external', // Always classify webhook sources as external signals
    type: `external.${source}.${payload.eventType}`,
    payload: data,
    timestamp: typeof payload.timestamp === 'number' ? payload.timestamp : Date.now(),
    urgency,
  };
}
