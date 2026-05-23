import { describe, expect, it, mock } from 'bun:test';

// Mock Next.js Server functions
mock.module('next/server', () => ({
  NextResponse: {
    json: (body: any) => ({
      json: async () => body,
      status: 200,
    }),
  },
}));

describe('Admin Features Route', () => {
  it('should allow updating valid features', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/admin/features', {
      method: 'POST',
      body: JSON.stringify({ floatingEye: false, soundEffects: true }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.features.floatingEye).toBe(false);
    expect(body.features.soundEffects).toBe(true);
  });

  it('should ignore invalid properties (prevent mass assignment)', async () => {
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/admin/features', {
      method: 'POST',
      body: JSON.stringify({
        __proto__: { polluted: true },
        isAdmin: true,
        secretKey: 'hacked',
        floatingEye: true,
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(body.features.isAdmin).toBeUndefined();
    expect(body.features.secretKey).toBeUndefined();
    expect((body.features as any).polluted).toBeUndefined();

    // Ensure the prototype wasn't modified
    expect(({} as any).polluted).toBeUndefined();
  });
});
