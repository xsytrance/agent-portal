import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';

mock.module('next/server', () => {
  class NextResponse {
    public readonly status: number;
    public readonly headers: Headers;
    public readonly body: unknown;
    constructor(body?: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Headers(init?.headers);
    }
    static json(body: unknown, init?: { status?: number }) {
      return new NextResponse(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json' } });
    }
  }
  return { NextResponse };
});

describe('GET /api/agent/stream', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.ADMIN_PASSWORD;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = originalEnv;
    }
    mock.restore();
  });

  it('should return 401 when ADMIN_PASSWORD is not set', async () => {
    delete process.env.ADMIN_PASSWORD;
    const { GET } = await import('./route');
    const req = new Request('http://localhost/api/agent/stream');
    const res = await GET(req) as unknown as { status: number; headers: Headers };
    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toBe('Basic realm="Agent Portal Stream"');
  });

  it('should return 401 when authorization header is missing', async () => {
    process.env.ADMIN_PASSWORD = 'test_password';
    const { GET } = await import('./route');
    const req = new Request('http://localhost/api/agent/stream');
    const res = await GET(req) as unknown as { status: number; headers: Headers };
    expect(res.status).toBe(401);
    expect(res.headers.get('WWW-Authenticate')).toBe('Basic realm="Agent Portal Stream"');
  });

  it('should return 401 when authorization header is invalid', async () => {
    process.env.ADMIN_PASSWORD = 'test_password';
    const { GET } = await import('./route');
    const req = new Request('http://localhost/api/agent/stream', {
      headers: {
        'authorization': 'Basic ' + Buffer.from('admin:wrong_password').toString('base64'),
      },
    });
    const res = await GET(req) as unknown as { status: number; headers: Headers };
    expect(res.status).toBe(401);
  });

  it('should return 200 and stream when authorization is valid via header', async () => {
    process.env.ADMIN_PASSWORD = 'test_password';
    const { GET } = await import('./route');
    const req = new Request('http://localhost/api/agent/stream', {
      headers: {
        'authorization': 'Basic ' + Buffer.from('admin:test_password').toString('base64'),
      },
    });
    const res = await GET(req) as unknown as { status: number; headers: Headers; body: unknown };
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.body instanceof ReadableStream).toBe(true);
  });

  it('should return 200 and stream when authorization is valid via token query parameter', async () => {
    process.env.ADMIN_PASSWORD = 'test_password';
    const { GET } = await import('./route');
    const token = Buffer.from('admin:test_password').toString('base64');
    const req = new Request(`http://localhost/api/agent/stream?token=${token}`);
    const res = await GET(req) as unknown as { status: number; headers: Headers; body: unknown };
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
    expect(res.body instanceof ReadableStream).toBe(true);
  });
});
