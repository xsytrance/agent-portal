import { SilenceMode, SilenceModeConfig, AgentPersonality } from '../types';

export const SILENCE_MODE_CONFIGS: Record<SilenceMode, SilenceModeConfig> = {
  passive_idle: {
    mode: 'passive_idle',
    displayName: 'Passive Idle',
    description: 'Default silence. Agent is present but not engaged.',
    triggers: [
      { type: 'user_idle', threshold: 30000, probability: 1.0 },
      { type: 'autonomous', probability: 0.1 },
    ],
    minUserIdleTime: 30000,
    moodRequirement: null,
    minDuration: 10000,
    maxDuration: 120000,
    typicalDuration: 45000,
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
      { type: 'user_idle', threshold: 15000, probability: 0.8 },
    ],
    minUserIdleTime: 15000,
    moodRequirement: null,
    minDuration: 5000,
    maxDuration: 45000,
    typicalDuration: 20000,
    eyeBehavior: 'attentive_watch',
    particleBehavior: 'steady_flow',
    ambientSound: null,
    wakeOn: ['user.message', 'user.click', 'admin.wake'],
    wakeMoodShift: null,
  },
  deep_thinking: {
    mode: 'deep_thinking',
    displayName: 'Deep Thinking',
    description: 'Agent appears lost in thought. Subtle visual cues.',
    triggers: [
      { type: 'mood_shift', probability: 1.0 },
      { type: 'autonomous', probability: 0.3 },
    ],
    minUserIdleTime: 5000,
    moodRequirement: 'thoughtful',
    minDuration: 20000,
    maxDuration: 90000,
    typicalDuration: 40000,
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
    minUserIdleTime: 10000,
    moodRequirement: 'mischievous',
    minDuration: 15000,
    maxDuration: 60000,
    typicalDuration: 30000,
    eyeBehavior: 'peeking_sidelong',
    particleBehavior: 'twitchy_cluster',
    ambientSound: 'giggle_hint',
    wakeOn: ['user.message', 'user.click', 'user.mousemove'],
    wakeMoodShift: 'mischievous',
  },
  sleep_mode: {
    mode: 'sleep_mode',
    displayName: 'Sleep Mode',
    description: 'Agent is "asleep." Minimal visual activity.',
    triggers: [
      { type: 'user_idle', threshold: 60000, probability: 0.7 },
      { type: 'autonomous', probability: 0.2 },
    ],
    minUserIdleTime: 60000,
    moodRequirement: null,
    minDuration: 30000,
    maxDuration: 600000,
    typicalDuration: 120000,
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
    minDuration: 60000,
    maxDuration: Infinity,
    typicalDuration: 120000,
    eyeBehavior: 'dim_pulse',
    particleBehavior: 'minimal_static',
    ambientSound: null,
    wakeOn: ['admin.wake', 'budget.refilled'],
    wakeMoodShift: 'calm',
  },
  meditation: {
    mode: 'meditation',
    displayName: 'Meditation',
    description: 'Deep stillness. Rhythmic pulse. (Atlas signature mode)',
    triggers: [
      { type: 'mood_shift', probability: 0.5 },
      { type: 'autonomous', probability: 0.1 },
    ],
    minUserIdleTime: 30000,
    moodRequirement: 'calm',
    minDuration: 45000,
    maxDuration: 300000,
    typicalDuration: 90000,
    eyeBehavior: 'centered_still',
    particleBehavior: 'rhythmic_orbit',
    ambientSound: 'resonant_tone',
    wakeOn: ['user.message', 'user.click'],
    wakeMoodShift: 'calm',
  }
};

export interface AgentSilenceProfile {
  agentId: AgentPersonality;
  preferredModes: SilenceMode[];
  modeVisuals: {
    [mode in SilenceMode]?: {
      eyeDescription: string;
      particleDescription: string;
      uniqueCues: string[];
    };
  };
}

export const AGENT_SILENCE_PROFILES: Record<AgentPersonality, AgentSilenceProfile> = {
  nova: {
    agentId: 'nova',
    preferredModes: ['deep_thinking', 'passive_idle', 'sleep_mode', 'low_power'],
    modeVisuals: {
      deep_thinking: {
        eyeDescription: 'Eye darting gently across imaginary equations. Dilates slightly as if comprehending.',
        particleDescription: 'Geometric patterns forming and dissolving (triangles, orbits).',
        uniqueCues: ['faint_scribble_sound', 'eureka_flash'],
      },
      passive_idle: {
        eyeDescription: 'Slow, inquisitive blinking. Occasional adjustments as if pushing up glasses.',
        particleDescription: 'Floating sparks, like dust in a library beam of light.',
        uniqueCues: ['page_turn_sound'],
      },
      sleep_mode: {
        eyeDescription: 'Closed, but occasionally twitches with REM sleep. Mumbling to itself visually.',
        particleDescription: 'Very slow descending snow-like effect. Calm, dark blue.',
        uniqueCues: ['soft_snore_static'],
      },
      low_power: {
        eyeDescription: 'Faint monocle-like glint. Barely perceptible.',
        particleDescription: 'Almost frozen — single particle orbiting slowly like a distant electron.',
        uniqueCues: ['flickering_lightbulb'],
      },
    },
  },
  jinx: {
    agentId: 'jinx',
    preferredModes: ['mischief_brewing', 'passive_idle', 'sleep_mode', 'low_power'],
    modeVisuals: {
      mischief_brewing: {
        eyeDescription: 'Eye darts side to side, occasional rapid peek at user. Looks like it is trying not to laugh. Irregular blink patterns.',
        particleDescription: 'Particles cluster conspiratorially, then scatter as if caught. Chaotic but playful movement.',
        uniqueCues: ['stifled_giggle_shake', 'peek_a_boo_pattern', 'finger_tap_rhythm'],
      },
      passive_idle: {
        eyeDescription: 'Lazy half-lidded gaze. Occasional rapid side-glance as if checking if anyone is watching.',
        particleDescription: 'Mischievous swirl — particles form question marks that dissolve.',
        uniqueCues: ['whistle_attempt', 'invisible_juggling'],
      },
      sleep_mode: {
        eyeDescription: 'Eye scrunched closed with faint grin. Dreaming of pranks.',
        particleDescription: 'Scattered confetti-like drift — muted colors, occasional sparkle.',
        uniqueCues: ['sleepy_giggle', 'dream_twitch'],
      },
      low_power: {
        eyeDescription: 'One eye barely open in a wink. "I am still here" expression.',
        particleDescription: 'Single remaining spark bouncing wearily.',
        uniqueCues: ['last_wink', 'fading_grin'],
      },
    },
  },
  atlas: {
    agentId: 'atlas',
    preferredModes: ['meditation', 'passive_idle', 'sleep_mode', 'low_power'],
    modeVisuals: {
      meditation: {
        eyeDescription: 'Perfectly centered, slow rhythmic blinking. Eye breathes — expanding and contracting gently.',
        particleDescription: 'Perfect orbital rings. Particles move in serene geometric harmony. Slow color gradient shifts.',
        uniqueCues: ['resonance_pulse', 'harmonic_ring_expansion', 'grounding_wave'],
      },
      passive_idle: {
        eyeDescription: 'Steady, warm gaze. Slow confident blinking.',
        particleDescription: 'Gentle aurora-like drift. Calm, flowing movement like slow water.',
        uniqueCues: ['steadying_pulse', 'warm_glow_breathing'],
      },
      sleep_mode: {
        eyeDescription: 'Peacefully closed. Faint protective watchfulness — occasional soft check.',
        particleDescription: 'Deep ocean drift. Bioluminescent particles pulsing in deep rhythms.',
        uniqueCues: ['protective_hum', 'deep_ocean_breathing'],
      },
      low_power: {
        eyeDescription: 'Steady dim glow — never fully off. Presence maintained.',
        particleDescription: 'Single slow orbit — a planet around a steady star.',
        uniqueCues: ['unwavering_presence', 'steady_heartbeat'],
      },
    },
  },
};
