import { describe, it, expect, setSystemTime, afterEach } from 'bun:test';
import { SlidingWindowRateLimiter } from './rateLimiter';

describe('SlidingWindowRateLimiter', () => {
  afterEach(() => {
    setSystemTime(); // reset system time
  });

  it('should allow requests under the limit', () => {
    const limiter = new SlidingWindowRateLimiter({
      test_source: { requests: 2, windowMs: 1000 },
    });

    expect(limiter.allow('test_source')).toBe(true);
    expect(limiter.allow('test_source')).toBe(true);
  });

  it('should block requests over the limit', () => {
    const limiter = new SlidingWindowRateLimiter({
      test_source: { requests: 2, windowMs: 1000 },
    });

    expect(limiter.allow('test_source')).toBe(true);
    expect(limiter.allow('test_source')).toBe(true);
    expect(limiter.allow('test_source')).toBe(false); // 3rd request blocked
  });

  it('should allow requests again after the time window expires', () => {
    const limiter = new SlidingWindowRateLimiter({
      test_source: { requests: 2, windowMs: 1000 },
    });

    // Initial requests
    expect(limiter.allow('test_source')).toBe(true);
    expect(limiter.allow('test_source')).toBe(true);
    expect(limiter.allow('test_source')).toBe(false);

    // Fast-forward time past the window
    setSystemTime(Date.now() + 1001);

    // Should be allowed again
    expect(limiter.allow('test_source')).toBe(true);
  });

  it('should deny requests from unknown sources', () => {
    const limiter = new SlidingWindowRateLimiter({
      test_source: { requests: 2, windowMs: 1000 },
    });

    expect(limiter.allow('unknown_source')).toBe(false);
  });

  it('should return correct retry-after time', () => {
    const limiter = new SlidingWindowRateLimiter({
      test_source: { requests: 2, windowMs: 5000 },
    });

    // Make an initial request to start the window
    limiter.allow('test_source');

    const retryAfter = limiter.getRetryAfter('test_source');
    // Math.ceil(5000 / 1000) -> 5
    expect(retryAfter).toBe(5);

    // Fast-forward 2.5 seconds
    setSystemTime(Date.now() + 2500);
    const retryAfterLater = limiter.getRetryAfter('test_source');
    // Math.ceil(2500 / 1000) -> 3
    expect(retryAfterLater).toBe(3);
  });

  it('should return 0 retry-after time for unknown sources or sources with no requests', () => {
    const limiter = new SlidingWindowRateLimiter({
      test_source: { requests: 2, windowMs: 1000 },
    });

    expect(limiter.getRetryAfter('unknown_source')).toBe(0);
    expect(limiter.getRetryAfter('test_source')).toBe(0);
  });

  it('should clear windows on reset', () => {
    const limiter = new SlidingWindowRateLimiter({
      test_source: { requests: 2, windowMs: 1000 },
    });

    limiter.allow('test_source');
    limiter.allow('test_source');
    expect(limiter.allow('test_source')).toBe(false);

    limiter.reset();

    // Should be allowed again after reset
    expect(limiter.allow('test_source')).toBe(true);
  });
});
