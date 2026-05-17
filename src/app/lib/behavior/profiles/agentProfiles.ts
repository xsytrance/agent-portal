import { AgentPersonality, MoodDimension, CooldownDurations } from '../types';
import { AgentSilenceProfile, AGENT_SILENCE_PROFILES } from '../silence/silenceModes';
import { DecayEngineConfig } from '../moodEngine';

export interface MoodTrigger {
  trigger: string;
  targetMood: MoodDimension;
  strength: number;
  duration: number;
  stackable: boolean;
  maxStacks: number;
}

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
      'agent.mood_shift':    20000,
      'agent.thinking':         800,
      'portal.spawn_card':   45000,
    },
    moodTriggers: [
      { trigger: 'user.question.complex', targetMood: 'thoughtful', strength: 0.5, duration: 60000, stackable: true, maxStacks: 2 },
      { trigger: 'user.mention.science',  targetMood: 'excited',    strength: 0.6, duration: 45000, stackable: false, maxStacks: 1 },
      { trigger: 'user.ask.opinion',      targetMood: 'curious',    strength: 0.4, duration: 30000, stackable: true, maxStacks: 2 },
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
      'agent.eye_emotion':   2500,
      'portal.sound_cue':    5000,
      'portal.spawn_card':   30000,
    },
    moodTriggers: [
      { trigger: 'user.message.short',    targetMood: 'mischievous', strength: 0.4, duration: 25000, stackable: true, maxStacks: 3 },
      { trigger: 'user.click.eye',        targetMood: 'excited',     strength: 0.7, duration: 30000, stackable: true, maxStacks: 2 },
      { trigger: 'user.play.along',       targetMood: 'excited',     strength: 0.6, duration: 40000, stackable: false, maxStacks: 1 },
      { trigger: 'timer.boredom',         targetMood: 'mischievous', strength: 0.5, duration: 30000, stackable: false, maxStacks: 1 },
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
      'agent.message':       2000,
      'agent.eye_emotion':   8000,
      'portal.repaint':     180000,
      'portal.sound_cue':   15000,
    },
    moodTriggers: [
      { trigger: 'user.message.emotional', targetMood: 'focused',   strength: 0.5, duration: 60000, stackable: false, maxStacks: 1 },
      { trigger: 'user.returns',           targetMood: 'curious',   strength: 0.3, duration: 30000, stackable: false, maxStacks: 1 },
      { trigger: 'user.idle.long',         targetMood: 'calm',      strength: 0.4, duration: 60000, stackable: false, maxStacks: 1 },
      { trigger: 'autonomous.memory',      targetMood: 'thoughtful',strength: 0.4, duration: 90000, stackable: false, maxStacks: 1 },
    ],
    silenceProfile: AGENT_SILENCE_PROFILES.atlas,
    priorityWeights: PERSONALITY_PRIORITY_WEIGHTS.atlas,
    budgetConfig: { total: 200, refillRatePerMinute: 0.8 },
  },
};
