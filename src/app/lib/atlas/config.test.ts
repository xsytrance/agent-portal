import { describe, it, expect } from 'bun:test';
import { getConfig, DEFAULT_ATLAS_CONFIG } from './config';

describe('getConfig', () => {
  it('should return the default configuration when no overrides are provided', () => {
    const config = getConfig();
    expect(config).toEqual(DEFAULT_ATLAS_CONFIG);
  });

  it('should return a new object and not mutate the default configuration', () => {
    const config = getConfig();
    expect(config).not.toBe(DEFAULT_ATLAS_CONFIG);
  });

  it('should merge partial overrides with the default configuration', () => {
    const overrides = { tickIntervalMs: 1000, idleThresholdMs: 10000 };
    const config = getConfig(overrides);

    expect(config.tickIntervalMs).toBe(1000);
    expect(config.idleThresholdMs).toBe(10000);

    // Check that other values remain unchanged
    expect(config.thinkingDurationMs).toBe(DEFAULT_ATLAS_CONFIG.thinkingDurationMs);
    expect(config.restingBlinkRateMin).toBe(DEFAULT_ATLAS_CONFIG.restingBlinkRateMin);
  });

  it('should handle full overrides correctly', () => {
    const fullOverrides = {
      tickIntervalMs: 100,
      idleThresholdMs: 2000,
      thinkingDurationMs: 1000,
      restingBlinkRateMin: 1000,
      restingBlinkRateMax: 2000,
      observingBlinkRateMin: 500,
      observingBlinkRateMax: 1000,
      minBehaviorChangeIntervalMs: 4000,
      rareEventTriggerTimeMs: 150000,
      rareEventMinInteractions: 3,
      attentionRecoveryRate: 10,
      attentionEventCost: 5,
      attentionThresholdLow: 40,
      attentionThresholdCritical: 20,
      attentionInertiaRate: 0.05,
      partialAttentionChance: 0.1,
      cognitionCueDurationMs: 200,
      cognitionCueIntervalMs: 3000,
    };
    const config = getConfig(fullOverrides);

    expect(config).toEqual(fullOverrides);
  });

  it('should handle an empty object as override', () => {
    const config = getConfig({});
    expect(config).toEqual(DEFAULT_ATLAS_CONFIG);
    expect(config).not.toBe(DEFAULT_ATLAS_CONFIG);
  });
});
