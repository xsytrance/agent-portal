import {
  AgentPersonality,
  AgentSilenceProfile,
  MoodDimension,
  DecayEngineConfig,
  CooldownDurations,
  MoodTrigger
} from './types';

export const AGENT_SILENCE_PROFILES: Record<AgentPersonality, AgentSilenceProfile> = {
  nova: {
    agentId: 'nova',
    preferredModes: ['deep_thinking', 'passive_idle', 'sleep_mode', 'low_power'],
    modeVisuals: {
      deep_thinking: {
        eyeDescription: 'Eye narrows, looks upward-left. Periodic "aha" micro-expression. Eye tracks invisible "equations" moving across space.',
        particleDescription: 'Particles form loose geometric patterns — circles, spirals — as if orbiting mathematical concepts.',
        uniqueCues: ['invisible_scribbling', 'subtle_nodding', 'glasses_adjust_gesture'],
      },
      passive_idle: {
        eyeDescription: 'Soft half-gaze, slow blinking. Eye drifts like reading an invisible book.',
        particleDescription: 'Gentle starfield drift. Particles twinkle like distant knowledge.',
        uniqueCues: ['page_turn_eye_motion', 'soft_hmm_expression'],
      },
      sleep_mode: {
        eyeDescription: 'Eye half-closed behind invisible "spectacles." Slow deep blinks.',
        particleDescription: 'Dimmed constellation patterns — stars slowly connecting into constellations.',
        uniqueCues: ['dreamy_mumble', 'spectacle_glint'],
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

export const PERSONALITY_PRIORITY_WEIGHTS: Record<AgentPersonality, Record<string, number>> = {
  nova: {
    'user.message.long':        1.3,
    'user.message.technical':   1.4,
    'timer.creative_impulse':   1.2,
    'autonomous.memory':        1.3,
    'user.compliment':          1.1,
    'mischief_brewing':         0.0,
    'timer.boredom':            0.6,
  },
  jinx: {
    'user.click.eye':           1.5,
    'user.message.short':       1.3,
    'timer.boredom':            1.4,
    'timer.creative_impulse':   1.3,
    'autonomous.curious':       1.4,
    'deep_thinking':            0.3,
    'meditation':               0.0,
  },
  atlas: {
    'user.message.emotional':   1.4,
    'user.returns':             1.3,
    'admin.config_changed':     0.6,
    'timer.mood_decay':         1.2,
    'mischief_brewing':         0.0,
    'timer.boredom':            0.4,
    'autonomous.curious':       0.5,
  },
};

export interface AgentBehaviorConfig {
  agentId: AgentPersonality;
  defaultMood: MoodDimension;
  decayConfig: DecayEngineConfig;
  cooldownOverrides: Partial<CooldownDurations>;
  moodTriggers: MoodTrigger[];
  silenceProfile: AgentSilenceProfile;
  priorityWeights: Record<string, number>;
  budgetConfig: {
    total: number;
    refillRatePerMinute: number;
  };
}

export const AGENT_BEHAVIOR_CONFIGS: Record<AgentPersonality, AgentBehaviorConfig> = {
  nova: {
    agentId: 'nova',
    defaultMood: 'curious',
    decayConfig: {
      baseDecayPerSecond: 0.006,
      personalityAnchorStrength: 0.35,
      transitionSpeed: 0.12,
    },
    cooldownOverrides: {
      'agent.mood_shift':    20_000,
      'agent.thinking':         800,
      'portal.spawn_card':   45_000,
    },
    moodTriggers: [
      { trigger: 'user.question.complex', targetMood: 'thoughtful', strength: 0.5, duration: 60_000, stackable: true, maxStacks: 2 },
      { trigger: 'user.mention.science',  targetMood: 'excited',    strength: 0.6, duration: 45_000, stackable: false, maxStacks: 1 },
      { trigger: 'user.ask.opinion',      targetMood: 'curious',    strength: 0.4, duration: 30_000, stackable: true, maxStacks: 2 },
    ],
    silenceProfile: AGENT_SILENCE_PROFILES.nova,
    priorityWeights: PERSONALITY_PRIORITY_WEIGHTS.nova,
    budgetConfig: { total: 200, refillRatePerMinute: 1.0 },
  },

  jinx: {
    agentId: 'jinx',
    defaultMood: 'mischievous',
    decayConfig: {
      baseDecayPerSecond: 0.010,
      personalityAnchorStrength: 0.25,
      transitionSpeed: 0.20,
    },
    cooldownOverrides: {
      'agent.eye_emotion':   2_500,
      'portal.sound_cue':    5_000,
      'portal.spawn_card':   30_000,
    },
    moodTriggers: [
      { trigger: 'user.message.short',    targetMood: 'mischievous', strength: 0.4, duration: 25_000, stackable: true, maxStacks: 3 },
      { trigger: 'user.click.eye',        targetMood: 'excited',     strength: 0.7, duration: 30_000, stackable: true, maxStacks: 2 },
      { trigger: 'user.play.along',       targetMood: 'excited',     strength: 0.6, duration: 40_000, stackable: false, maxStacks: 1 },
      { trigger: 'timer.boredom',         targetMood: 'mischievous', strength: 0.5, duration: 30_000, stackable: false, maxStacks: 1 },
    ],
    silenceProfile: AGENT_SILENCE_PROFILES.jinx,
    priorityWeights: PERSONALITY_PRIORITY_WEIGHTS.jinx,
    budgetConfig: { total: 200, refillRatePerMinute: 1.5 },
  },

  atlas: {
    agentId: 'atlas',
    defaultMood: 'calm',
    decayConfig: {
      baseDecayPerSecond: 0.004,
      personalityAnchorStrength: 0.40,
      transitionSpeed: 0.10,
    },
    cooldownOverrides: {
      'agent.message':       2_000,
      'agent.eye_emotion':   8_000,
      'portal.repaint':     180_000,
      'portal.sound_cue':   15_000,
    },
    moodTriggers: [
      { trigger: 'user.message.emotional', targetMood: 'focused',   strength: 0.5, duration: 60_000, stackable: false, maxStacks: 1 },
      { trigger: 'user.returns',           targetMood: 'curious',   strength: 0.3, duration: 30_000, stackable: false, maxStacks: 1 },
      { trigger: 'user.idle.long',         targetMood: 'calm',      strength: 0.4, duration: 60_000, stackable: false, maxStacks: 1 },
      { trigger: 'autonomous.memory',      targetMood: 'thoughtful',strength: 0.4, duration: 90_000, stackable: false, maxStacks: 1 },
    ],
    silenceProfile: AGENT_SILENCE_PROFILES.atlas,
    priorityWeights: PERSONALITY_PRIORITY_WEIGHTS.atlas,
    budgetConfig: { total: 200, refillRatePerMinute: 0.8 },
  },
};
