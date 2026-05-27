import { describe, it, expect, mock } from 'bun:test';

mock.module('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
      return {
        status: init?.status || 200,
        json: async () => body,
      };
    },
  },
}));

import { POST } from './route';

describe('Chat Route API', () => {
  it('should return 400 if message is too long', async () => {
    const longMessage = 'a'.repeat(4001);
    const request = new Request('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message: longMessage }),
    });

    const response = await POST(request) as any;
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('message exceeds maximum length of 4000 characters');
  });

  it('should return 400 if message is missing', async () => {
    const request = new Request('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ agentId: 'nova' }),
    });

    const response = await POST(request) as any;
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('message is required and must be a string');
  });

  it('should process a valid message (mocked response)', async () => {
    const request = new Request('http://localhost:3000/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hello, World!', agentId: 'nova' }),
    });

    const response = await POST(request) as any;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toContain('Hello, World!');
    expect(data.mock).toBe(true);
  });
});
