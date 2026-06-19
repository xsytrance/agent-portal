import { WebhookSourceId } from './rateLimiter';

export interface WebhookAuthResult {
  authenticated: boolean;
  sourceId?: string;
  error?: string;
}

export interface AuthConfig {
  type: 'shared_secret' | 'hmac_sha256' | 'api_key_header';
  secretEnvVar: string;
  headerName?: string;
}

export interface WebhookSourceConfig {
  sourceId: WebhookSourceId;
  displayName: string;
  auth: AuthConfig;
  enabled: boolean;
}

export const sourceRegistry = new Map<WebhookSourceId, WebhookSourceConfig>([
  [
    'openclaw',
    {
      sourceId: 'openclaw',
      displayName: 'OpenClaw Agent System',
      auth: { type: 'shared_secret', secretEnvVar: 'WEBHOOK_SECRET_OPENCLAW', headerName: 'x-openclaw-secret' },
      enabled: true,
    },
  ],
  [
    'hermes',
    {
      sourceId: 'hermes',
      displayName: 'Hermes Orchestrator',
      auth: { type: 'hmac_sha256', secretEnvVar: 'WEBHOOK_SECRET_HERMES', headerName: 'x-hermes-signature' },
      enabled: true,
    },
  ],
  [
    'scrapers',
    {
      sourceId: 'scrapers',
      displayName: 'Scrapers',
      auth: { type: 'api_key_header', secretEnvVar: 'WEBHOOK_SECRET_SCRAPERS', headerName: 'x-scraper-key' },
      enabled: true,
    },
  ],
  [
    'generic',
    {
      sourceId: 'generic',
      displayName: 'Generic Webhooks',
      auth: { type: 'shared_secret', secretEnvVar: 'WEBHOOK_SECRET_GENERIC', headerName: 'x-webhook-secret' },
      enabled: true,
    },
  ]
]);

// Constant-time string comparison function to replace node:crypto/timingSafeEqual
// Edge runtime compatibility
function secureCompare(a: string, b: string): boolean {
  let mismatch = a.length === b.length ? 0 : 1;
  if (mismatch === 1) {
    a = b;
  }
  for (let i = 0; i < b.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

// Function to generate an HMAC-SHA256 signature using the Web Crypto API
// Edge runtime compatibility
async function generateHmacSignature(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return signatureHex;
}

export async function authenticateWebhook(
  sourceId: WebhookSourceId,
  request: Request
): Promise<WebhookAuthResult> {
  const config = sourceRegistry.get(sourceId);
  if (!config) return { authenticated: false, error: 'Unknown source' };
  if (!config.enabled) return { authenticated: false, error: 'Source disabled' };

  // For testing convenience
  const secret = process.env[config.auth.secretEnvVar] || (process.env.NODE_ENV === 'test' ? 'test_secret' : undefined);

  if (!secret) return { authenticated: false, error: 'Webhook secret not configured' };

  switch (config.auth.type) {
    case 'shared_secret': {
      const headerValue = request.headers.get(config.auth.headerName || 'x-webhook-secret');
      if (!headerValue) return { authenticated: false, error: 'Missing secret header' };
      if (!secureCompare(headerValue, secret)) {
        return { authenticated: false, error: 'Invalid secret' };
      }
      return { authenticated: true, sourceId };
    }

    case 'hmac_sha256': {
      const signature = request.headers.get(config.auth.headerName || 'x-hermes-signature');
      if (!signature) return { authenticated: false, error: 'Missing HMAC signature' };

      let bodyText = '';
      try {
        const clonedReq = request.clone();
        bodyText = await clonedReq.text();
      } catch (err) {
         return { authenticated: false, error: 'Could not read request body' };
      }

      const expected = await generateHmacSignature(secret, bodyText);
      if (!secureCompare(signature, expected)) {
        return { authenticated: false, error: 'Invalid HMAC signature' };
      }
      return { authenticated: true, sourceId };
    }

    case 'api_key_header': {
      const apiKey = request.headers.get(config.auth.headerName || 'x-api-key');
      if (!apiKey) return { authenticated: false, error: 'Missing API key' };
      if (!secureCompare(apiKey, secret)) {
        return { authenticated: false, error: 'Invalid API key' };
      }
      return { authenticated: true, sourceId };
    }

    default:
      return { authenticated: false, error: 'Unknown auth type' };
  }
}