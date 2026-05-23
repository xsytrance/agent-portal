import { describe, it, expect } from 'bun:test';
import { validateEvent } from './eventValidator';

describe('validateEvent', () => {
  it('should validate a correct event with minimal required fields', () => {
    const input = {
      id: 'event-1',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };
    const result = validateEvent(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.sanitized?.id).toBe('event-1');
    expect(result.sanitized?.type).toBe('agent.message');
    expect(result.sanitized?.source).toBe('agent');
    expect(result.sanitized?.visibility).toBe('public'); // Default
    expect(result.sanitized?.importance).toBe('normal'); // Default
  });

  it('should validate a correct event with all fields', () => {
    const timestamp = new Date().toISOString();
    const input = {
      id: 'event-2',
      type: 'system.log',
      timestamp,
      source: 'system',
      agentId: 'agent-123',
      payload: { foo: 'bar' },
      visibility: 'admin',
      importance: 'high',
      artifactId: 'art-456',
      expiresAt: new Date(Date.now() + 10000).toISOString(),
    };
    const result = validateEvent(input);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.sanitized).toEqual({
      id: 'event-2',
      type: 'system.log',
      timestamp,
      source: 'system',
      agentId: 'agent-123',
      payload: { foo: 'bar' },
      visibility: 'admin',
      importance: 'high',
      artifactId: 'art-456',
      expiresAt: input.expiresAt,
    });
  });

  it('should return error if input is not an object', () => {
    expect(validateEvent(null).valid).toBe(false);
    expect(validateEvent(undefined).valid).toBe(false);
    expect(validateEvent('string').valid).toBe(false);
    expect(validateEvent(123).valid).toBe(false);
    expect(validateEvent([]).valid).toBe(false);
  });

  it('should return error if required string fields are missing or not strings', () => {
    const baseInput = {
      id: 'event-1',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    let result = validateEvent({ ...baseInput, id: undefined });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('id is required and must be a string');

    result = validateEvent({ ...baseInput, type: 123 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('type is required and must be a string');

    result = validateEvent({ ...baseInput, timestamp: null });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('timestamp is required and must be a string');

    result = validateEvent({ ...baseInput, source: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('source is required and must be a string');
  });

  it('should return error for invalid enumerated values (type, source, visibility, importance)', () => {
    const baseInput = {
      id: 'event-1',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    let result = validateEvent({ ...baseInput, type: 'invalid.type' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('type must be one of:'))).toBe(true);

    result = validateEvent({ ...baseInput, source: 'invalid-source' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('source must be one of:'))).toBe(true);

    result = validateEvent({ ...baseInput, visibility: 'invalid-visibility' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('visibility must be one of:'))).toBe(true);

    result = validateEvent({ ...baseInput, importance: 'invalid-importance' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('importance must be one of:'))).toBe(true);
  });

  it('should return error for invalid ISO date timestamp', () => {
    const baseInput = {
      id: 'event-1',
      type: 'agent.message',
      source: 'agent',
    };

    let result = validateEvent({ ...baseInput, timestamp: 'invalid-date' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('timestamp must be a valid ISO 8601 string');

    result = validateEvent({ ...baseInput, timestamp: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('timestamp must be a valid ISO 8601 string');
  });

  it('should return error for invalid payload types', () => {
    const baseInput = {
      id: 'event-1',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    expect(validateEvent({ ...baseInput, payload: null }).valid).toBe(false);
    expect(validateEvent({ ...baseInput, payload: [] }).valid).toBe(false);
    expect(validateEvent({ ...baseInput, payload: 'string' }).valid).toBe(false);
    expect(validateEvent({ ...baseInput, payload: 123 }).valid).toBe(false);
  });

  it('should return error for payload exceeding max keys', () => {
    const baseInput = {
      id: 'event-1',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    const largePayload: Record<string, string> = {};
    for (let i = 0; i < 51; i++) {
      largePayload[`key${i}`] = 'val';
    }

    const result = validateEvent({ ...baseInput, payload: largePayload });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('payload exceeds max 50 keys');
  });

  it('should return error for payload exceeding max size', () => {
    const baseInput = {
      id: 'event-1',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    // 65536 bytes limit
    const largeString = 'a'.repeat(65537);
    const result = validateEvent({ ...baseInput, payload: { data: largeString } });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('payload exceeds max size of 65536 bytes');
  });

  it('should return error for non-serializable payload', () => {
    const baseInput = {
      id: 'event-1',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    const cyclicPayload: any = {};
    cyclicPayload.self = cyclicPayload;

    const result = validateEvent({ ...baseInput, payload: cyclicPayload });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('payload is not serializable');
  });

  it('should return error for string fields exceeding max length', () => {
    const baseInput = {
      id: 'event-1',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    const largeString = 'a'.repeat(4097);

    let result = validateEvent({ ...baseInput, id: largeString });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('id exceeds max length of 4096');

    // To hit the type max length check but still be a string (even though it'll fail the ENUM check as well)
    result = validateEvent({ ...baseInput, type: largeString });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('type exceeds max length of 4096');

    result = validateEvent({ ...baseInput, agentId: largeString });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('agentId exceeds max length of 4096');
  });
});
