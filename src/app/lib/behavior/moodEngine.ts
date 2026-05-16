import { MoodState, MoodDimension, MoodModifier, DecayEngineConfig, MoodTrigger } from './types';

export const DEFAULT_DECAY_CONFIG: DecayEngineConfig = {
  baseDecayPerSecond: 0.008,
  personalityAnchorStrength: 0.3,
  transitionSpeed: 0.15,
};

export const DEFAULT_MOOD_TRIGGERS: MoodTrigger[] = [
  { trigger: 'user.message.first',    targetMood: 'curious',   strength: 0.6,  duration: 30000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.message.long',     targetMood: 'thoughtful',strength: 0.4,  duration: 45000,  stackable: true,  maxStacks: 2 },
  { trigger: 'user.message.short',    targetMood: 'curious',   strength: 0.3,  duration: 20000,  stackable: true,  maxStacks: 3 },
  { trigger: 'user.message.surprise', targetMood: 'surprised', strength: 0.8,  duration: 10000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.compliment',       targetMood: 'excited',   strength: 0.7,  duration: 60000,  stackable: true,  maxStacks: 2 },
  { trigger: 'user.insult',           targetMood: 'focused',   strength: 0.5,  duration: 60000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.idle.short',       targetMood: 'calm',      strength: 0.3,  duration: 30000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.idle.long',        targetMood: 'sleepy',    strength: 0.5,  duration: 60000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.returns',          targetMood: 'surprised', strength: 0.4,  duration: 15000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.click.eye',        targetMood: 'mischievous',strength:0.5,  duration: 20000,  stackable: true,  maxStacks: 2 },
  { trigger: 'admin.config_changed',  targetMood: 'surprised', strength: 0.5,  duration: 20000,  stackable: false, maxStacks: 1 },
  { trigger: 'portal.theme_change',   targetMood: 'curious',   strength: 0.4,  duration: 30000,  stackable: false, maxStacks: 1 },
  { trigger: 'system.error',          targetMood: 'focused',   strength: 0.6,  duration: 45000,  stackable: false, maxStacks: 1 },
  { trigger: 'autonomous.boredom',    targetMood: 'curious',   strength: 0.3,  duration: 60000,  stackable: false, maxStacks: 1 },
  { trigger: 'autonomous.insight',    targetMood: 'excited',   strength: 0.5,  duration: 30000,  stackable: false, maxStacks: 1 },
  { trigger: 'autonomous.memory',     targetMood: 'thoughtful',strength: 0.4,  duration: 45000,  stackable: false, maxStacks: 1 },
  { trigger: 'timer.cycle.100',       targetMood: 'surprised', strength: 0.3,  duration: 10000,  stackable: false, maxStacks: 1 },
  { trigger: 'milestone.message.10',  targetMood: 'excited',   strength: 0.6,  duration: 60000,  stackable: false, maxStacks: 1 },
  { trigger: 'milestone.time.5min',   targetMood: 'curious',   strength: 0.4,  duration: 30000,  stackable: false, maxStacks: 1 },
];

export function applyMoodDecay(
  mood: MoodState,
  config: DecayEngineConfig,
  cycleDurationMs: number
): MoodState {
  const newMood = { ...mood };

  // Remove expired modifiers
  const now = Date.now();
  newMood.modifiers = newMood.modifiers.filter(m => m.expiresAt > now);

  // Apply decay
  const decayAmount = config.baseDecayPerSecond * (cycleDurationMs / 1000);
  newMood.intensity -= decayAmount;

  // Apply personality anchor pull
  if (newMood.current === newMood.defaultMood) {
      const distanceToDefault = 1.0 - newMood.intensity; // Pull towards 1.0 intensity of default mood
      // But typically "default mood" rests at some baseline (e.g. 0.5 or 0.7).
      // Assuming distance is to a baseline 1.0 for simplicity based on formula given
      newMood.intensity += config.personalityAnchorStrength * distanceToDefault;
  }

  // Handle transition
  if (newMood.targetMood) {
    newMood.transitionProgress += config.transitionSpeed;
    if (newMood.transitionProgress >= 1.0) {
      newMood.current = newMood.targetMood;
      newMood.targetMood = null;
      newMood.transitionProgress = 0;
      newMood.lastShiftTime = now;
    }
  }

  // Clamp intensity
  newMood.intensity = Math.max(0.1, Math.min(newMood.intensity, 1.0));

  return newMood;
}
