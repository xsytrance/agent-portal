import { AtlasConfig } from './types';

export const DEFAULT_ATLAS_CONFIG: AtlasConfig = {
  tickIntervalMs: 500,
  idleThresholdMs: 5000,
  thinkingDurationMs: 2000,
  restingBlinkRateMin: 3000,
  restingBlinkRateMax: 6000,
  observingBlinkRateMin: 2000,
  observingBlinkRateMax: 4000,
  minBehaviorChangeIntervalMs: 8000,
  rareEventTriggerTimeMs: 300000,
  rareEventMinInteractions: 5,
  attentionRecoveryRate: 5,
  attentionEventCost: 8,
  attentionThresholdLow: 50,
  attentionThresholdCritical: 25,
};

export function getConfig(overrides?: Partial<AtlasConfig>): AtlasConfig {
  return { ...DEFAULT_ATLAS_CONFIG, ...overrides };
}
