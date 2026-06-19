import { describe, it, expect, beforeEach, afterEach, setSystemTime } from 'bun:test';
import { normalizeWebhookPayload } from './normalizer';

describe('normalizeWebhookPayload', () => {
  beforeEach(() => {
    // Mock crypto.randomUUID to ensure deterministic tests if needed, or just let it generate
    // the UUID since we can check its presence.
  });

  afterEach(() => {
    setSystemTime(); // Restore time
  });

  it('should return null for non-object payloads', () => {
    expect(normalizeWebhookPayload(null)).toBeNull();
    expect(normalizeWebhookPayload(undefined)).toBeNull();
    expect(normalizeWebhookPayload('string payload')).toBeNull();
    expect(normalizeWebhookPayload(123)).toBeNull();
    expect(normalizeWebhookPayload(true)).toBeNull();
  });

  it('should return null if eventType is missing or invalid', () => {
    expect(normalizeWebhookPayload({})).toBeNull();
    expect(normalizeWebhookPayload({ source: 'test' })).toBeNull();
    expect(normalizeWebhookPayload({ eventType: 123 })).toBeNull();
    expect(normalizeWebhookPayload({ eventType: null })).toBeNull();
  });

  it('should normalize a full valid payload correctly', () => {
    const payload = {
      source: 'test_source',
      eventType: 'user_action',
      data: { key: 'value' },
      timestamp: 1600000000000,
      urgency: 0.8,
    };

    const result = normalizeWebhookPayload(payload);

    expect(result).not.toBeNull();
    expect(typeof result?.id).toBe('string');
    expect(result?.source).toBe('external');
    expect(result?.type).toBe('external.test_source.user_action');
    expect(result?.payload).toEqual({ key: 'value' });
    expect(result?.timestamp).toBe(1600000000000);
    expect(result?.urgency).toBe(0.8);
  });

  it('should apply fallbacks for missing optional fields', () => {
    const mockTime = new Date('2023-01-01T00:00:00Z');
    setSystemTime(mockTime);

    const payload = {
      eventType: 'minimal_event',
    };

    const result = normalizeWebhookPayload(payload);

    expect(result).not.toBeNull();
    expect(typeof result?.id).toBe('string');
    expect(result?.source).toBe('external');
    expect(result?.type).toBe('external.unknown_external.minimal_event');
    expect(result?.payload).toEqual({});
    expect(result?.timestamp).toBe(mockTime.getTime());
    expect(result?.urgency).toBe(0.5);
  });

  it('should apply fallbacks when data is invalid', () => {
    const mockTime = new Date('2023-01-01T00:00:00Z');
    setSystemTime(mockTime);

    const payload = {
      eventType: 'minimal_event',
      data: 'invalid data type', // Should fallback to {}
    };

    const result = normalizeWebhookPayload(payload);

    expect(result).not.toBeNull();
    expect(result?.payload).toEqual({});
  });

  it('should apply fallbacks when source is invalid type', () => {
    const payload = {
      source: 123, // Invalid source type, should fallback to unknown_external
      eventType: 'test_event'
    };

    const result = normalizeWebhookPayload(payload);

    expect(result?.type).toBe('external.unknown_external.test_event');
  });

  it('should apply fallbacks when urgency is invalid type', () => {
    const payload = {
      eventType: 'test_event',
      urgency: 'high' // Invalid urgency type, should fallback to 0.5
    };

    const result = normalizeWebhookPayload(payload);

    expect(result?.urgency).toBe(0.5);
  });

  it('should apply fallbacks when timestamp is invalid type', () => {
    const mockTime = new Date('2023-01-01T00:00:00Z');
    setSystemTime(mockTime);

    const payload = {
      eventType: 'test_event',
      timestamp: '2023-01-01T00:00:00Z' // Invalid timestamp type, should fallback to Date.now()
    };

    const result = normalizeWebhookPayload(payload);

    expect(result?.timestamp).toBe(mockTime.getTime());
  });
});
