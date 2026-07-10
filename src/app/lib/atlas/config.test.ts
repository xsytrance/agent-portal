import { describe, it, expect } from 'bun:test';
import { getConfig, DEFAULT_ATLAS_CONFIG } from './config';
import { AtlasConfig } from './types';

describe('getConfig', () => {
  it('returns the default configuration when no overrides are provided', () => {
    const config = getConfig();
    expect(config).toEqual(DEFAULT_ATLAS_CONFIG);
  });

  it('returns a merged configuration with single partial override', () => {
    const override = { tickIntervalMs: 1000 };
    const config = getConfig(override);

    expect(config.tickIntervalMs).toBe(1000);
    // ensure other default values remain untouched
    expect(config.idleThresholdMs).toBe(DEFAULT_ATLAS_CONFIG.idleThresholdMs);
  });

  it('returns the default configuration when an empty override is provided', () => {
    const config = getConfig({});
    expect(config).toEqual(DEFAULT_ATLAS_CONFIG);
  });

  it('returns a merged configuration with multiple partial overrides', () => {
    const overrides: Partial<AtlasConfig> = {
      tickIntervalMs: 1000,
      idleThresholdMs: 2000,
      cognitionCueDurationMs: 500
    };
    const config = getConfig(overrides);

    expect(config.tickIntervalMs).toBe(1000);
    expect(config.idleThresholdMs).toBe(2000);
    expect(config.cognitionCueDurationMs).toBe(500);
    // ensure other unoverridden properties are intact
    expect(config.thinkingDurationMs).toBe(DEFAULT_ATLAS_CONFIG.thinkingDurationMs);
  });

  it('does not mutate the DEFAULT_ATLAS_CONFIG object', () => {
    // Snapshot the original config string to check deep immutability
    const originalConfigStr = JSON.stringify(DEFAULT_ATLAS_CONFIG);

    const override = { tickIntervalMs: 99999 };
    const config = getConfig(override);

    expect(config.tickIntervalMs).toBe(99999);
    expect(JSON.stringify(DEFAULT_ATLAS_CONFIG)).toEqual(originalConfigStr);
  });
});
