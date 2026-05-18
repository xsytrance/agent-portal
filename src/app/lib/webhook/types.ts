import { PortalEventType } from '../events/eventTypes';
import { ExternalSignal } from '../signals/types';

export type WebhookSourceId = 'openclaw' | 'hermes' | 'scrapers' | 'generic';

export interface AuthConfig {
  type: 'shared_secret' | 'hmac_sha256' | 'api_key_header';
  secretEnvVar: string;
  headerName?: string;
}

export interface WebhookSourceConfig {
  sourceId: WebhookSourceId;
  displayName: string;
  auth: AuthConfig;
  rateLimit: { requests: number; windowMs: number };
  allowedEventTypes: PortalEventType[];
  enabled: boolean;
}

export type EventNormalizer = (source: WebhookSourceId, rawBody: Record<string, unknown>) => ExternalSignal;

// ---------------------------------------------------------------------------
// Expected Payloads
// ---------------------------------------------------------------------------

export interface OpenClawPayload {
  eventType: PortalEventType;
  data: Record<string, unknown>;
  timestamp: string;
  agentId?: string;
  correlationId?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface HermesPayload {
  taskId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'progress';
  result?: {
    eventType: 'portal.report_ready' | 'portal.create_page';
    data: Record<string, unknown>;
  };
  progress?: { percent: number; message: string };
  timestamp: string;
  initiatedBy?: string;
}

export interface ScraperPayload {
  sourceUrl: string;
  scrapedAt: string;
  scraperName: string;
  contentType: 'deal' | 'news' | 'generic';
  content: {
    title: string;
    description?: string;
    url: string;
    imageUrl?: string;
    price?: { currency: string; amount: number; originalAmount?: number };
    tags?: string[];
  };
}
