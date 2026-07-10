import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { NextRequest } from 'next/server';

// We must mock next/server correctly for Next.js app router testing in bun
mock.module('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), {
      status: init?.status || 200,
      headers: init?.headers,
    }),
  },
  NextRequest: Request,
}));

const setNodeEnv = (value: string) => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
};

describe('Webhook Dynamic Route', () => {
  let POST: typeof import('./route').POST;
  let webhookRateLimiter: typeof import('@/app/lib/webhook/rateLimiter').webhookRateLimiter;

  beforeEach(async () => {
    // Reset env vars and modules
    setNodeEnv('test');
    process.env.WEBHOOK_SECRET_OPENCLAW = 'test_secret';

    // Dynamic import to avoid ESM issues after mock
    const route = await import('./route');
    POST = route.POST;

    const rateLimiterModule = await import('@/app/lib/webhook/rateLimiter');
    webhookRateLimiter = rateLimiterModule.webhookRateLimiter;
    webhookRateLimiter.reset();
  });

  afterEach(() => {
    setNodeEnv('development');
    delete process.env.WEBHOOK_SECRET_OPENCLAW;
    mock.restore();
  });

  it('should reject unknown sources with 404', async () => {
    const req = new Request('http://localhost:3000/api/webhook/unknown', {
      method: 'POST',
      body: JSON.stringify({}),
    }) as NextRequest;

    const res = await POST(req, { params: Promise.resolve({ source: 'unknown' }) });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error).toBe('Unknown webhook source');
  });

  it('should reject requests with missing auth headers with 401', async () => {
    const req = new Request('http://localhost:3000/api/webhook/openclaw', {
      method: 'POST',
      body: JSON.stringify({}),
    }) as NextRequest;

    const res = await POST(req, { params: Promise.resolve({ source: 'openclaw' }) });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Missing secret header');
  });

  it('should reject invalid JSON bodies with 400', async () => {
    const req = new Request('http://localhost:3000/api/webhook/openclaw', {
      method: 'POST',
      headers: { 'x-openclaw-secret': 'test_secret' },
      body: 'invalid-json',
    }) as NextRequest;

    const res = await POST(req, { params: Promise.resolve({ source: 'openclaw' }) });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid JSON body');
  });

  it('should reject invalid payload structure with 422', async () => {
    const req = new Request('http://localhost:3000/api/webhook/openclaw', {
      method: 'POST',
      headers: { 'x-openclaw-secret': 'test_secret' },
      body: JSON.stringify({ some_unknown_field: 'value' }),
    }) as NextRequest;

    const res = await POST(req, { params: Promise.resolve({ source: 'openclaw' }) });
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.error).toBe('Normalization failed');
  });

  it('should process a valid payload successfully', async () => {
    const validPayload = {
      source: 'openclaw',
      eventType: 'deal_card',
      data: { deal: '123' }
    };

    const req = new Request('http://localhost:3000/api/webhook/openclaw', {
      method: 'POST',
      headers: { 'x-openclaw-secret': 'test_secret' },
      body: JSON.stringify(validPayload),
    }) as NextRequest;

    const res = await POST(req, { params: Promise.resolve({ source: 'openclaw' }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.processed).toBe(true);
    expect(body.signalId).toBeDefined();
  });
});
