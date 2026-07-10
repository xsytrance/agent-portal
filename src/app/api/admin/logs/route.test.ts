import { describe, it, expect, mock, afterEach } from 'bun:test';

// Mock NextResponse
mock.module('next/server', () => ({
  NextResponse: {
    json: (body: unknown) => ({
      status: 200,
      json: async () => body,
    }),
  },
}));

// Mock the eventStore
mock.module('@/app/lib/events/eventStore', () => ({
  getRecentEvents: async () => [
    {
      id: 'event-1',
      timestamp: '2023-01-01T00:00:00.000Z',
      importance: 'info',
      source: 'test',
      type: 'test-event',
      agentId: 'agent-1',
      payload: {
        short: 'short string',
        long: 'a'.repeat(300),
        nested: {
          veryLong: 'b'.repeat(300)
        }
      }
    }
  ],
  getStats: async () => ({
    totalStored: 1,
    sequence: 1,
    lastPruned: '2023-01-01T00:00:00.000Z'
  })
}));

describe('Admin Logs API Route', () => {
  afterEach(() => {
    mock.restore();
  });

  it('should securely truncate long strings in JSON payloads without breaking JSON syntax', async () => {
    // Dynamic import to avoid module caching issues with mocked modules
    const { GET } = await import('./route');

    const response = await GET();
    const data = await response.json();

    expect(data.logs.length).toBe(1);
    const log = data.logs[0];

    expect(log.message.startsWith('[test-event] ')).toBe(true);

    // Extract the JSON part of the message
    const jsonStr = log.message.substring('[test-event] '.length);

    // Parse the JSON to ensure it is valid
    const parsedPayload = JSON.parse(jsonStr);

    // Verify string truncations
    expect(parsedPayload.short).toBe('short string');
    expect(parsedPayload.long).toBe('a'.repeat(100) + '...');
    expect(parsedPayload.nested.veryLong).toBe('b'.repeat(100) + '...');

    // Verify overall length is well within bounds, avoiding massive log bombs
    expect(log.message.length).toBeLessThan(500);
  });
});
