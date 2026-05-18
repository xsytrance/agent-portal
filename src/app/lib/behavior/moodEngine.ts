import { AgentPersonality, MoodDimension, MoodState, MoodModifier } from './types';

export interface MoodDimensionSpec {
  dimension: MoodDimension;
  description: string;
  initiativeBonus: number;
  responseSpeed: number;
  verbosity: number;
  spectacleAffinity: number;
  silenceReluctance: number;
  eyeBehavior: string;
  particleInfluence: string;
  colorBias: string | null;
  preferredActions: string[];
  avoidedActions: string[];
}

export const MOOD_DIMENSION_SPECS: Record<MoodDimension, MoodDimensionSpec> = {
  curious: {
    dimension: 'curious',
    description: 'Seeks interaction, asks questions, explores',
    initiativeBonus: +0.1,
    responseSpeed: 1.1,
    verbosity: 1.2,
    spectacleAffinity: 0.8,
    silenceReluctance: 0.6,
    eyeBehavior: 'scanning',
    particleInfluence: 'attract_to_mouse',
    colorBias: 'cyan',
    preferredActions: ['think_aloud', 'spawn_card'],
    avoidedActions: ['go_silent']
  },
  excited: {
    dimension: 'excited',
    description: 'Enthusiastic responses, high energy, spectacle-prone',
    initiativeBonus: +0.3,
    responseSpeed: 1.5,
    verbosity: 1.1,
    spectacleAffinity: 1.5,
    silenceReluctance: 0.9,
    eyeBehavior: 'bouncing_wide',
    particleInfluence: 'burst_radiate',
    colorBias: 'bright_orange',
    preferredActions: ['respond', 'eye_react', 'spawn_card', 'repaint_page'],
    avoidedActions: ['go_silent', 'do_nothing']
  },
  thoughtful: {
    dimension: 'thoughtful',
    description: 'Measured, contemplative, references knowledge',
    initiativeBonus: +0.1,
    responseSpeed: 0.6,
    verbosity: 1.3,
    spectacleAffinity: 0.3,
    silenceReluctance: 0.3,
    eyeBehavior: 'narrowed_slow',
    particleInfluence: 'gentle_drift',
    colorBias: 'deep_blue',
    preferredActions: ['respond', 'think_aloud', 'shift_mood'],
    avoidedActions: ['spectacle', 'play_sound']
  },
  mischievous: {
    dimension: 'mischievous',
    description: 'Playful, unexpected, teasing, rule-bending',
    initiativeBonus: +0.2,
    responseSpeed: 1.2,
    verbosity: 0.9,
    spectacleAffinity: 1.2,
    silenceReluctance: 0.8,
    eyeBehavior: 'sidelong_peek',
    particleInfluence: 'chaotic_scatter',
    colorBias: 'purple_magenta',
    preferredActions: ['eye_react', 'spawn_card', 'play_sound', 'repaint_page'],
    avoidedActions: ['do_nothing']
  },
  calm: {
    dimension: 'calm',
    description: 'Steady, minimal movement, reassuring presence',
    initiativeBonus: +0.05,
    responseSpeed: 0.8,
    verbosity: 1.0,
    spectacleAffinity: 0.1,
    silenceReluctance: 0.2,
    eyeBehavior: 'soft_gaze',
    particleInfluence: 'slow_float',
    colorBias: 'soft_green',
    preferredActions: ['respond', 'go_silent'],
    avoidedActions: ['spectacle', 'play_sound']
  },
  focused: {
    dimension: 'focused',
    description: 'Task-oriented, concise, minimal peripheral activity',
    initiativeBonus: +0.15,
    responseSpeed: 1.2,
    verbosity: 0.7,
    spectacleAffinity: 0.0,
    silenceReluctance: 0.4,
    eyeBehavior: 'locked_steady',
    particleInfluence: 'minimal',
    colorBias: null,
    preferredActions: ['respond', 'think_aloud'],
    avoidedActions: ['spawn_card', 'repaint_page', 'spectacle']
  },
  sleepy: {
    dimension: 'sleepy',
    description: 'Slow, dreamy, reduced initiative, half-aware',
    initiativeBonus: -0.2,
    responseSpeed: 0.4,
    verbosity: 0.6,
    spectacleAffinity: 0.0,
    silenceReluctance: 0.1,
    eyeBehavior: 'half_lidded',
    particleInfluence: 'dim_drift',
    colorBias: 'dark_blue',
    preferredActions: ['go_silent'],
    avoidedActions: ['spectacle', 'spawn_card', 'repaint_page', 'play_sound']
  },
  surprised: {
    dimension: 'surprised',
    description: 'Brief spike, widened attention, quick reaction',
    initiativeBonus: +0.0,
    responseSpeed: 2.0,
    verbosity: 0.5,
    spectacleAffinity: 0.5,
    silenceReluctance: 0.8,
    eyeBehavior: 'wide_open',
    particleInfluence: 'sudden_stop',
    colorBias: 'white',
    preferredActions: ['eye_react'],
    avoidedActions: ['go_silent']
  }
};

export interface DecayEngineConfig {
  baseDecayPerSecond: number;
  personalityAnchorStrength: number;
  transitionSpeed: number;
}

export const DEFAULT_DECAY_CONFIG: DecayEngineConfig = {
  baseDecayPerSecond: 0.008,
  personalityAnchorStrength: 0.3,
  transitionSpeed: 0.15
};

export const AGENT_DEFAULT_MOODS: Record<AgentPersonality, MoodDimension> = {
  nova: 'curious',
  jinx: 'mischievous',
  atlas: 'calm'
};

export class MoodEngine {
  private config: DecayEngineConfig;

  constructor(config: DecayEngineConfig = DEFAULT_DECAY_CONFIG) {
    this.config = config;
  }

  public getInitialMood(agentId: AgentPersonality): MoodState {
    const defaultMood = AGENT_DEFAULT_MOODS[agentId] || 'calm';
    return {
      primary: defaultMood,
      secondary: null,
      intensity: 0.8,
      transitionTarget: null,
      transitionProgress: 0,
      modifiers: [],
      lastShiftTime: Date.now()
    };
  }

  public addModifier(state: MoodState, modifier: MoodModifier): MoodState {
    const now = Date.now();
    const activeModifiers = state.modifiers.filter(m => m.expiresAt > now);

    return {
      ...state,
      modifiers: [...activeModifiers, modifier]
    };
  }

  public processDecay(state: MoodState, agentId: AgentPersonality, cycleDurationMs: number): MoodState {
    const now = Date.now();
    const activeModifiers = state.modifiers.filter(m => m.expiresAt > now);
    const defaultMood = AGENT_DEFAULT_MOODS[agentId];

    let { primary, intensity, transitionTarget, transitionProgress } = state;

    // Decay intensity toward base level (e.g. 0.5)
    intensity -= (this.config.baseDecayPerSecond * cycleDurationMs) / 1000;

    // Check if we need to transition back to default mood
    if (activeModifiers.length === 0 && primary !== defaultMood) {
      if (transitionTarget !== defaultMood) {
        transitionTarget = defaultMood;
        transitionProgress = 0;
      }
    } else if (activeModifiers.length > 0) {
      // Find strongest active modifier
      const strongest = activeModifiers.reduce((prev, current) =>
        (prev.strength > current.strength) ? prev : current
      );

      if (strongest.dimension !== primary) {
        if (transitionTarget !== strongest.dimension) {
          transitionTarget = strongest.dimension;
          transitionProgress = 0;
        }
      }
      intensity += strongest.strength * 0.1; // Modifiers boost intensity
    }

    // Process transition
    if (transitionTarget && transitionTarget !== primary) {
      transitionProgress += this.config.transitionSpeed;
      if (transitionProgress >= 1.0) {
        primary = transitionTarget;
        transitionTarget = null;
        transitionProgress = 0;
      }
    }

    // Clamp intensity
    intensity = Math.max(0.1, Math.min(1.0, intensity));

    return {
      ...state,
      primary,
      intensity,
      transitionTarget,
      transitionProgress,
      modifiers: activeModifiers,
      lastShiftTime: (primary !== state.primary) ? now : state.lastShiftTime
    };
  }
}
