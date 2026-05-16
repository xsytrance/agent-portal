import { SilenceMode, SilenceModeConfig, BehaviorDirectorState, QuietPeriodState, MoodDimension, AgentSilenceProfile } from './types';

export const SILENCE_MODE_CONFIGS: Record<SilenceMode, SilenceModeConfig> = {
  passive_idle: {
    mode: 'passive_idle',
    displayName: 'Passive Idle',
    description: 'Default silence. Agent is present but not engaged.',
    triggers: [
      { type: 'user_idle', threshold: 30_000, probability: 1.0 },
      { type: 'autonomous', probability: 0.1 },
    ],
    minUserIdleTime: 30_000,
    moodRequirement: null,
    minDuration: 10_000,
    maxDuration: 120_000,
    typicalDuration: 45_000,
    eyeBehavior: 'slow_drift',
    particleBehavior: 'ambient_float',
    ambientSound: null,
    wakeOn: ['user.message', 'user.mousemove', 'user.click', 'admin.wake'],
    wakeMoodShift: null,
  },
  attentive_idle: {
    mode: 'attentive_idle',
    displayName: 'Attentive Idle',
    description: 'User is present but inactive. Agent watches quietly.',
    triggers: [
      { type: 'user_idle', threshold: 15_000, probability: 0.8 },
    ],
    minUserIdleTime: 15_000,
    moodRequirement: null,
    minDuration: 15_000,
    maxDuration: 60_000,
    typicalDuration: 30_000,
    eyeBehavior: 'tracking_soft',
    particleBehavior: 'breathing_glow',
    ambientSound: null,
    wakeOn: ['user.message', 'user.click', 'user.scroll'],
    wakeMoodShift: 'curious',
  },
  deep_thinking: {
    mode: 'deep_thinking',
    displayName: 'Deep Thinking',
    description: 'Agent appears lost in thought. Subtle visual cues.',
    triggers: [
      { type: 'mood_shift', probability: 1.0 },
      { type: 'autonomous', probability: 0.3 },
    ],
    minUserIdleTime: 5_000,
    moodRequirement: 'thoughtful',
    minDuration: 20_000,
    maxDuration: 90_000,
    typicalDuration: 40_000,
    eyeBehavior: 'focused_distant',
    particleBehavior: 'slow_spiral',
    ambientSound: 'soft_hum',
    wakeOn: ['user.message', 'user.click', 'admin.wake'],
    wakeMoodShift: 'focused',
  },
  mischief_brewing: {
    mode: 'mischief_brewing',
    displayName: 'Mischief Brewing',
    description: 'Agent is plotting something. Occasional peeks.',
    triggers: [
      { type: 'mood_shift', probability: 1.0 },
      { type: 'autonomous', probability: 0.4 },
    ],
    minUserIdleTime: 10_000,
    moodRequirement: 'mischievous',
    minDuration: 15_000,
    maxDuration: 60_000,
    typicalDuration: 30_000,
    eyeBehavior: 'peeking_sidelong',
    particleBehavior: 'twitchy_cluster',
    ambientSound: 'giggle_hint',
    wakeOn: ['user.message', 'user.click', 'user.mousemove'],
    wakeMoodShift: 'mischievous',
  },
  sleep_mode: {
    mode: 'sleep_mode',
    displayName: 'Sleep Mode',
    description: 'Agent is asleep. Minimal visual activity.',
    triggers: [
      { type: 'user_idle', threshold: 60_000, probability: 0.7 },
      { type: 'autonomous', probability: 0.2 },
    ],
    minUserIdleTime: 60_000,
    moodRequirement: null,
    minDuration: 30_000,
    maxDuration: 600_000,
    typicalDuration: 120_000,
    eyeBehavior: 'closed_breathe',
    particleBehavior: 'dim_drift',
    ambientSound: 'soft_breathing',
    wakeOn: ['user.message', 'user.click', 'user.mousemove', 'admin.wake'],
    wakeMoodShift: 'surprised',
  },
  low_power: {
    mode: 'low_power',
    displayName: 'Low Power',
    description: 'Emergency mode. Budget nearly exhausted. Minimal activity.',
    triggers: [
      { type: 'budget_low', threshold: 0.05, probability: 1.0 },
    ],
    minUserIdleTime: 0,
    moodRequirement: null,
    minDuration: 60_000,
    maxDuration: Infinity,
    typicalDuration: 120_000,
    eyeBehavior: 'dim_pulse',
    particleBehavior: 'minimal_static',
    ambientSound: null,
    wakeOn: ['admin.wake', 'budget.refilled'],
    wakeMoodShift: 'calm',
  },
  meditation: {
    mode: 'meditation',
    displayName: 'Meditation',
    description: 'Deep stillness. Rhythmic pulse.',
    triggers: [
      { type: 'mood_shift', probability: 0.5 },
      { type: 'autonomous', probability: 0.1 },
    ],
    minUserIdleTime: 30_000,
    moodRequirement: 'calm',
    minDuration: 45_000,
    maxDuration: 300_000,
    typicalDuration: 90_000,
    eyeBehavior: 'centered_still',
    particleBehavior: 'rhythmic_orbit',
    ambientSound: 'resonant_tone',
    wakeOn: ['user.message', 'user.click'],
    wakeMoodShift: 'calm',
  }
};

export function selectSilenceMode(
  state: BehaviorDirectorState,
  agentSilenceProfile: AgentSilenceProfile
): { mode: SilenceMode; wakeMoodShift: MoodDimension | null } {
  // 1. CHECK BUDGET
  const budgetRatio = state.budget.remaining / state.budget.total;
  if (budgetRatio < 0.10) {
    return { mode: 'low_power', wakeMoodShift: SILENCE_MODE_CONFIGS['low_power'].wakeMoodShift };
  }

  // 2. CHECK AGENT PREFERENCE & 3. CHECK MOOD COMPATIBILITY & 4. CHECK USER IDLE TIME
  let candidates = agentSilenceProfile.preferredModes.filter(mode => {
    const config = SILENCE_MODE_CONFIGS[mode];
    if (config.moodRequirement && config.moodRequirement !== state.mood.current) {
        return false;
    }
    if (state.userIdleTime < config.minUserIdleTime) {
        return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    candidates = ['passive_idle'];
  }

  // 5. RANDOM SELECTION (weighted - simplified to uniform random for now as per docs logic requirements being complex)
  // In a full implementation, apply recency penalties and trigger probabilities.
  const selectedMode = candidates[Math.floor(Math.random() * candidates.length)];
  const config = SILENCE_MODE_CONFIGS[selectedMode];

  // 6. CONFIGURE & ENTER logic happens in the calling function, but we return the selected configuration
  return {
      mode: selectedMode,
      wakeMoodShift: config.wakeMoodShift
  };
}
