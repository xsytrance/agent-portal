import { EventNormalizer, WebhookSourceId, OpenClawPayload, HermesPayload, ScraperPayload } from './types';
import { ExternalSignal } from '../signals/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeWebhookPayload: EventNormalizer = (source: WebhookSourceId, rawBody: Record<string, any>): ExternalSignal => {
  const timestamp = new Date().toISOString();

  const baseSignal: Omit<ExternalSignal, 'payload'> = {
    id: crypto.randomUUID(),
    kind: 'external.webhook',
    timestamp,
    targetAgentId: 'nova', // Default routing, could be extracted from payload
    integrationId: source,
    authLevel: 'api-key', // Baseline assumption for authorized route
  };

  switch (source) {
    case 'openclaw': {
      const payload = rawBody as unknown as OpenClawPayload;
      if (payload.agentId) {
         baseSignal.targetAgentId = payload.agentId;
      }
      return {
        ...baseSignal,
        payload: {
          subKind: 'external.webhook',
          webhookId: source,
          eventName: payload.eventType,
          body: payload.data || {},
        },
      };
    }

    case 'hermes': {
      const payload = rawBody as unknown as HermesPayload;
      if (payload.initiatedBy) {
          baseSignal.targetAgentId = payload.initiatedBy;
      }
      return {
        ...baseSignal,
        payload: {
          subKind: 'external.webhook',
          webhookId: source,
          eventName: payload.result?.eventType || 'system.log',
          body: payload.result?.data || { status: payload.status, taskId: payload.taskId },
        },
      };
    }

    case 'scrapers': {
      const payload = rawBody as unknown as ScraperPayload;
      const eventName = payload.contentType === 'deal' ? 'portal.deal_card' : 'portal.news_card';
      return {
        ...baseSignal,
        payload: {
          subKind: 'external.webhook',
          webhookId: source,
          eventName,
          body: payload.content || {},
        },
      };
    }

    case 'generic':
    default: {
      return {
        ...baseSignal,
        payload: {
          subKind: 'external.webhook',
          webhookId: source,
          eventName: rawBody.eventName || 'system.log',
          body: rawBody.data || rawBody,
        },
      };
    }
  }
};
