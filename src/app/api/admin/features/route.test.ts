import { expect, test, describe, beforeEach, afterEach, mock } from 'bun:test';

// Mock next/server BEFORE importing route.ts
mock.module('next/server', () => {
  return {
    NextResponse: class NextResponse extends Response {
      static json(data: any) {
        return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
  };
});

import { GET, POST } from './route';

describe('Admin Features API Route', () => {
  const originalEnv = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'test_password';
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.ADMIN_PASSWORD = originalEnv;
    } else {
      delete process.env.ADMIN_PASSWORD;
    }
  });

  test('GET returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/admin/features');
    const res = await GET(req) as any;
    expect(res.status).toBe(401);
  });

  test('GET returns features with correct auth', async () => {
    const expectedAuth = 'Basic ' + Buffer.from('admin:test_password').toString('base64');
    const req = new Request('http://localhost/api/admin/features', {
      headers: {
        authorization: expectedAuth
      }
    });
    const res = await GET(req) as any;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.features).toBeDefined();
  });

  test('POST returns 401 without auth', async () => {
    const req = new Request('http://localhost/api/admin/features', {
      method: 'POST',
      body: JSON.stringify({ floatingEye: false })
    });
    const res = await POST(req) as any;
    expect(res.status).toBe(401);
  });

  test('POST updates features with correct auth', async () => {
    const expectedAuth = 'Basic ' + Buffer.from('admin:test_password').toString('base64');
    const req = new Request('http://localhost/api/admin/features', {
      method: 'POST',
      headers: {
        authorization: expectedAuth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ floatingEye: false })
    });
    const res = await POST(req) as any;
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.features.floatingEye).toBe(false);
  });
});
