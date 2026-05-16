import { MoodDimension, SignalSource, AgentPersonality } from './types';

export const BASE_PRIORITY_TABLE: Record<string, number> = {
  'user.message':             0.95,
  'user.message.urgent':      1.00,
  'user.click.eye':           0.70,
  'user.click.agent':         0.75,
  'user.scroll':              0.20,
  'user.mousemove.hotzone':   0.15,
  'user.returns':             0.60,
  'admin.config_changed':     0.50,
  'admin.force_action':       0.90,
  'portal.theme_change':      0.40,
  'system.error':             0.55,
  'system.warning':           0.45,
  'timer.boredom':            0.15,
  'timer.creative_impulse':   0.20,
  'timer.mood_decay':         0.10,
  'timer.budget_refill':      0.05,
  'autonomous.curious':       0.18,
  'autonomous.memory':        0.12,
  'autonomous.milestone':     0.50,
};

export const MOOD_PRIORITY_MULTIPLIERS: Record<MoodDimension, Record<string, number>> = {
  curious: {
    user:       1.2,
    external:   1.1,
    autonomous: 1.4,
    system:     0.9,
  },
  excited: {
    user:       1.3,
    external:   1.2,
    autonomous: 1.5,
    system:     0.8,
  },
  thoughtful: {
    user:       1.0,
    external:   0.8,
    autonomous: 0.7,
    system:     1.1,
  },
  mischievous: {
    user:       1.2,
    external:   1.0,
    autonomous: 1.3,
    system:     0.9,
  },
  calm: {
    user:       0.9,
    external:   0.7,
    autonomous: 0.4,
    system:     0.8,
  },
  focused: {
    user:       1.1,
    external:   0.5,
    autonomous: 0.3,
    system:     1.0,
  },
  sleepy: {
    user:       0.6,
    external:   0.4,
    autonomous: 0.2,
    system:     0.7,
  },
  surprised: {
    user:       1.5,
    external:   1.4,
    autonomous: 0.8,
    system:     1.2,
  },
};

export function computePriority(
    basePriority: number,
    moodMultiplier: number,
    personalityWeight: number,
    cooldownPenalty: number,
    budgetPenalty: number
): number {
    const rawPriority = basePriority * moodMultiplier * personalityWeight * cooldownPenalty * budgetPenalty;
    return Math.max(0, Math.min(rawPriority, 1.0)); // Clamp between 0 and 1
}
