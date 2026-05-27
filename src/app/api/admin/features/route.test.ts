import { describe, it, expect, mock } from 'bun:test';

mock.module('next/server', () => ({
  NextResponse: {
    json: (body: any) => ({ body, status: 200 }),
  },
}));

const { POST, GET } = await import('./route');

describe('Features API', () => {
  it('allows updating valid boolean features', async () => {
    const request = {
      json: async () => ({
        floatingEye: false,
        soundEffects: true,
      }),
    } as unknown as Request;

    const response = await POST(request) as any;
    expect(response.body.features.floatingEye).toBe(false);
    expect(response.body.features.soundEffects).toBe(true);
  });

  it('ignores non-boolean updates to valid features', async () => {
    const request = {
      json: async () => ({
        cursorTrail: 'true',
        particleBackground: 1,
        chatPanel: {},
      }),
    } as unknown as Request;

    const response = await POST(request) as any;
    // Should retain their default original values
    expect(response.body.features.cursorTrail).toBe(true);
    expect(response.body.features.particleBackground).toBe(true);
    expect(response.body.features.chatPanel).toBe(true);
  });

  it('prevents mass assignment and prototype pollution', async () => {
    const request = {
      json: async () => ({
        isAdmin: true,
        __proto__: { polluted: true },
        constructor: { prototype: { polluted: true } },
      }),
    } as unknown as Request;

    const response = await POST(request) as any;

    // Unrecognized keys should not be added
    expect(response.body.features.isAdmin).toBeUndefined();
    expect('__proto__' in response.body.features && response.body.features.__proto__ !== Object.prototype).toBe(false);

    // Check if Object.prototype was polluted
    const obj = {};
    expect((obj as any).polluted).toBeUndefined();
  });
});
