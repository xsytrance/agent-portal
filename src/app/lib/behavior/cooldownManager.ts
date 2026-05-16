import { CooldownDurations, CooldownRegistry, AgentPersonality, DirectorEventType, CostTier } from './types';

export const BASE_COOLDOWN_DURATIONS: CooldownDurations = {
  'agent.message':         1_000,
  'agent.thinking':          500,
  'agent.eye_emotion':      5_000,
  'agent.mood_shift':      15_000,
  'portal.spawn_card':     60_000,
  'portal.repaint':       120_000,
  'portal.theme_change':  300_000,
  'portal.sound_cue':      10_000,
  'system.log':                 0,
};

export const AGENT_COOLDOWN_OVERRIDES: Record<AgentPersonality, Partial<CooldownDurations>> = {
  nova: {
    'agent.mood_shift':    20_000,
    'agent.thinking':        800,
    'portal.spawn_card':   45_000,
  },
  jinx: {
    'agent.eye_emotion':   2_500,
    'portal.sound_cue':    5_000,
    'portal.spawn_card':   30_000,
  },
  atlas: {
    'agent.message':       2_000,
    'agent.eye_emotion':   8_000,
    'portal.repaint':     180_000,
    'portal.sound_cue':   15_000,
  },
};

export const RATE_LIMIT_CONFIG = {
  windowMs: 60_000,
  maxPerWindow: 20,
  maxHighTierPerWindow: 8,
  burstAllowance: 5,
  burstWindowMs: 5_000,
};

export interface RateLimitState {
  windowStart: number;
  actions: Array<{ timestamp: number; tier: CostTier }>;
}

export function checkCooldowns(
  registry: CooldownRegistry,
  rateLimitState: RateLimitState,
  eventType: DirectorEventType,
  tier: CostTier,
  now: number
): { allowed: boolean; reason?: string } {
  // 1. Per-event check
  const lastEmit = registry.lastEmit[eventType];
  const duration = registry.durations[eventType] || 0;
  if (lastEmit && (lastEmit + duration > now)) {
    return { allowed: false, reason: 'cooldown_active' };
  }

  // 2. Remove old actions from rate limit window
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;
  rateLimitState.actions = rateLimitState.actions.filter(a => a.timestamp > windowStart);

  // 3. Count
  const currentCount = rateLimitState.actions.length;
  const highTierCount = rateLimitState.actions.filter(a => a.tier === 'medium' || a.tier === 'high').length;

  // 4. Rate Limit Check
  if (currentCount >= RATE_LIMIT_CONFIG.maxPerWindow) {
    return { allowed: false, reason: 'rate_limited' };
  }

  // 5. Tier Budget Check
  if ((tier === 'medium' || tier === 'high') && highTierCount >= RATE_LIMIT_CONFIG.maxHighTierPerWindow) {
      return { allowed: false, reason: 'tier_limited' };
  }

  return { allowed: true };
}
