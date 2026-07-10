import { describe, it, expect } from 'bun:test';
import { validateEvent } from './eventValidator';

describe('validateEvent', () => {
  it('should reject non-object inputs', () => {
    expect(validateEvent(null)).toEqual({ valid: false, errors: ['Event must be an object'] });
    expect(validateEvent(undefined)).toEqual({ valid: false, errors: ['Event must be an object'] });
    expect(validateEvent('string')).toEqual({ valid: false, errors: ['Event must be an object'] });
    expect(validateEvent(123)).toEqual({ valid: false, errors: ['Event must be an object'] });
    expect(validateEvent([])).toEqual({ valid: false, errors: ['Event must be an object'] });
  });

  it('should enforce required fields are present and strings', () => {
    const result = validateEvent({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('id is required and must be a string');
    expect(result.errors).toContain('type is required and must be a string');
    expect(result.errors).toContain('timestamp is required and must be a string');
    expect(result.errors).toContain('source is required and must be a string');
  });

  it('should enforce enum constraints for type, source, visibility, and importance', () => {
    const invalidEnums = {
      id: 'test-id',
      type: 'invalid_type',
      timestamp: new Date().toISOString(),
      source: 'invalid_source',
      visibility: 'invalid_vis',
      importance: 'invalid_importance',
    };

    const result = validateEvent(invalidEnums);
    expect(result.valid).toBe(false);
    expect(result.errors.find(e => e.startsWith('type must be one of:'))).toBeDefined();
    expect(result.errors.find(e => e.startsWith('source must be one of:'))).toBeDefined();
    expect(result.errors.find(e => e.startsWith('visibility must be one of:'))).toBeDefined();
    expect(result.errors.find(e => e.startsWith('importance must be one of:'))).toBeDefined();
  });

  it('should enforce ISO 8601 timestamps', () => {
    const invalidTime = {
      id: 'test-id',
      type: 'agent.message',
      timestamp: 'not-a-date',
      source: 'agent',
    };
    const result = validateEvent(invalidTime);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('timestamp must be a valid ISO 8601 string');
  });

  it('should enforce payload is an object, size limits, and key limits', () => {
    const base = {
      id: 'test-id',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    // Not an object
    expect(validateEvent({ ...base, payload: 'not-an-object' }).errors).toContain('payload must be an object');
    expect(validateEvent({ ...base, payload: null }).errors).toContain('payload must be an object');
    expect(validateEvent({ ...base, payload: [] }).errors).toContain('payload must be an object');

    // Too many keys
    const massivePayload: Record<string, string> = {};
    for (let i = 0; i < 51; i++) massivePayload[`key${i}`] = 'value';
    expect(validateEvent({ ...base, payload: massivePayload }).errors).toContain('payload exceeds max 50 keys');

    // Too large
    expect(validateEvent({ ...base, payload: { big: 'x'.repeat(65537) } }).errors).toContain('payload exceeds max size of 65536 bytes');

    // Not serializable
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(validateEvent({ ...base, payload: circular }).errors).toContain('payload is not serializable');
  });

  it('should enforce max string lengths', () => {
    const base = {
      id: 'test-id',
      type: 'agent.message',
      timestamp: new Date().toISOString(),
      source: 'agent',
    };

    const tooLong = 'x'.repeat(4097);

    expect(validateEvent({ ...base, id: tooLong }).errors).toContain('id exceeds max length of 4096');
    // We expect both the literal constraint AND the length constraint for a huge string, but since we use the raw type input we test length
    expect(validateEvent({ ...base, agentId: tooLong }).errors).toContain('agentId exceeds max length of 4096');
  });

  it('should sanitize and accept valid events', () => {
    const now = new Date().toISOString();
    const validRaw = {
      id: ' test-id ',
      type: 'agent.message',
      timestamp: now,
      source: 'agent',
      agentId: ' agent-1 ',
      payload: { foo: 'bar' },
      visibility: 'internal',
      importance: 'high',
      artifactId: ' art-1 ',
      expiresAt: now,
      // extra fields should be ignored by sanitization
      extra: 'ignore-me'
    };

    const result = validateEvent(validRaw);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    // Check sanitization details
    expect(result.sanitized).toEqual({
      id: 'test-id',
      type: 'agent.message',
      timestamp: now,
      source: 'agent',
      agentId: 'agent-1',
      payload: { foo: 'bar' },
      visibility: 'internal',
      importance: 'high',
      artifactId: 'art-1',
      expiresAt: now,
    });
  });

  it('should apply defaults for optional fields', () => {
    const now = new Date().toISOString();
    const minValidRaw = {
      id: 'test-id',
      type: 'agent.message',
      timestamp: now,
      source: 'agent',
    };

    const result = validateEvent(minValidRaw);
    expect(result.valid).toBe(true);

    expect(result.sanitized?.visibility).toBe('public');
    expect(result.sanitized?.importance).toBe('normal');
    expect(result.sanitized?.payload).toEqual({});
  });
});
