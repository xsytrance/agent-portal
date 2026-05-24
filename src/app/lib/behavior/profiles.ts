import { AgentPersonality, MoodDimension } from './types';

export interface BehaviorProfile {
  agentId: AgentPersonality;
  defaultMood: MoodDimension;
  talkativeness: number; // 0.0 to 1.0
  chaosLevel: number; // 0.0 to 1.0
  visualEnergy: number; // 0.0 to 1.0
  interruptionMaxPerMinute: number;
  cooldownMultipliers: {
    'portal.spawn_card': number;
    'portal.repaint': number;
    'agent.message': number;
  };
}

export const STARTER_PROFILES: Record<AgentPersonality, BehaviorProfile> = {
  nova: {
    agentId: 'nova',
    defaultMood: 'curious',
    talkativeness: 0.6,
    chaosLevel: 0.25,
    visualEnergy: 0.7,
    interruptionMaxPerMinute: 0.2, // 1 per 5 min
    cooldownMultipliers: {
      'portal.spawn_card': 1.0,
      'portal.repaint': 1.0,
      'agent.message': 1.0,
    },
  },
  jinx: {
    agentId: 'jinx',
    defaultMood: 'mischievous',
    talkativeness: 0.85,
    chaosLevel: 0.75,
    visualEnergy: 0.9,
    interruptionMaxPerMinute: 0.33, // 1 per 3 min
    cooldownMultipliers: {
      'portal.spawn_card': 0.66,
      'portal.repaint': 0.5,
      'agent.message': 0.66,
    },
  },
  atlas: {
    agentId: 'atlas',
    defaultMood: 'calm',
    talkativeness: 0.35,
    chaosLevel: 0.05,
    visualEnergy: 0.3,
    interruptionMaxPerMinute: 0.1, // 1 per 10 min
    cooldownMultipliers: {
      'portal.spawn_card': 2.0,
      'portal.repaint': 1.5,
      'agent.message': 1.5,
    },
  },
};

export function getProfile(agentId: AgentPersonality): BehaviorProfile {
  return STARTER_PROFILES[agentId];
}
