import { describe, it, expect, setSystemTime, afterEach, beforeEach } from 'bun:test';
import { SlidingWindowRateLimiter } from './rateLimiter';

describe('SlidingWindowRateLimiter', () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter({
      testSource: { requests: 2, windowMs: 1000 },
    });
  });

  afterEach(() => {
    setSystemTime(); // reset time
  });

  it('denies unknown sources', () => {
    expect(limiter.allow('unknown')).toBe(false);
  });

  it('allows requests up to the limit and blocks after', () => {
    expect(limiter.allow('testSource')).toBe(true);
    expect(limiter.allow('testSource')).toBe(true);
    expect(limiter.allow('testSource')).toBe(false);
  });

  it('resets window after time expires', () => {
    setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    expect(limiter.allow('testSource')).toBe(true);
    expect(limiter.allow('testSource')).toBe(true);
    expect(limiter.allow('testSource')).toBe(false); // limit reached

    // Move time forward by more than windowMs
    setSystemTime(new Date('2024-01-01T00:00:01.001Z'));
    expect(limiter.allow('testSource')).toBe(true); // new window
  });

  it('calculates retry after correctly', () => {
    setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    expect(limiter.getRetryAfter('unknown')).toBe(0); // unknown source

    limiter.allow('testSource'); // starts window
    // Window ends at 00:00:01.000Z

    setSystemTime(new Date('2024-01-01T00:00:00.500Z')); // 500ms elapsed
    // Remaining time is 500ms, which is 0.5s, Math.ceil(0.5) is 1
    expect(limiter.getRetryAfter('testSource')).toBe(1);

    setSystemTime(new Date('2024-01-01T00:00:00.000Z')); // 0ms elapsed
    expect(limiter.getRetryAfter('testSource')).toBe(1);
  });

  it('handles reset correctly', () => {
    expect(limiter.allow('testSource')).toBe(true);
    expect(limiter.allow('testSource')).toBe(true);
    expect(limiter.allow('testSource')).toBe(false);
    limiter.reset();
    expect(limiter.allow('testSource')).toBe(true);
  });
});
