export type WebhookSourceId = 'openclaw' | 'hermes' | 'scrapers' | 'generic';

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Module-level variable to persist state across requests within the same Node process.
// This is necessary because Next.js App Router API routes may re-instantiate objects,
// but the underlying module cache is generally retained between requests in the same process.
const globalWindows = new Map<string, RateLimitEntry>();

export class SlidingWindowRateLimiter {
  constructor(private config: Record<string, { requests: number; windowMs: number }>) {}

  /** Returns true if request is allowed */
  allow(sourceId: string): boolean {
    const now = Date.now();
    const cfg = this.config[sourceId];
    if (!cfg) return false; // unknown source = deny

    const entry = globalWindows.get(sourceId);
    if (!entry || now - entry.windowStart > cfg.windowMs) {
      // New window
      globalWindows.set(sourceId, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= cfg.requests) return false;
    entry.count++;
    return true;
  }

  getRetryAfter(sourceId: string): number {
    const cfg = this.config[sourceId];
    const entry = globalWindows.get(sourceId);
    if (!cfg || !entry) return 0;
    return Math.ceil((entry.windowStart + cfg.windowMs - Date.now()) / 1000);
  }

  // For testing
  reset() {
      globalWindows.clear();
  }
}

// Configured per-source
export const webhookRateLimiter = new SlidingWindowRateLimiter({
  openclaw:  { requests: 60,  windowMs: 60000 },
  hermes:    { requests: 30,  windowMs: 60000 },
  scrapers:  { requests: 120, windowMs: 60000 },
  generic:   { requests: 30,  windowMs: 60000 },
});