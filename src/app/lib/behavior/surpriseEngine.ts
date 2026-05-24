import { BehaviorDirectorState, PlannedEvent } from './types';

export interface SurpriseConfig {
  baseProbability: number;
  cooldownMs: number;
}

export class SurpriseEngine {
  private lastSurpriseTime = 0;
  private readonly config: SurpriseConfig;

  constructor(config: Partial<SurpriseConfig> = {}) {
    this.config = {
      baseProbability: 0.05,
      cooldownMs: 60000 * 5, // 5 minutes default
      ...config,
    };
  }

  public evaluateSurprise(state: BehaviorDirectorState): PlannedEvent | null {
    const now = Date.now();
    if (now - this.lastSurpriseTime < this.config.cooldownMs) {
      return null;
    }

    // Only surprise if they are active, but not if the agent is already busy
    if (state.presence === 'responding' || state.presence === 'creating' || state.presence === 'sleeping') {
      return null;
    }

    let probability = this.config.baseProbability;

    // Mood modifiers
    if (state.mood.primary === 'mischievous') probability *= 2.0;
    if (state.mood.primary === 'calm' || state.mood.primary === 'focused') probability *= 0.1;

    // Agent personality modifiers
    if (state.agentId === 'jinx') probability *= 1.5;
    if (state.agentId === 'atlas') probability *= 0.2;

    if (Math.random() <= probability) {
      this.lastSurpriseTime = now;
      return this.generateSurpriseEvent(state.agentId);
    }

    return null;
  }

  private generateSurpriseEvent(agentId: string): PlannedEvent {
    // Generate different surprises based on agent
    if (agentId === 'jinx') {
      return {
        type: 'portal.repaint',
        payload: { theme: 'neon_chaos', duration: 5000 },
        delay: 0,
        costTier: 'free'
      };
    } else if (agentId === 'nova') {
       return {
        type: 'portal.spawn_card',
        payload: { content: 'Did you know? Spontaneous fact generation!' },
        delay: 0,
        costTier: 'free'
      };
    }

    // Default/Atlas gentle surprise
    return {
      type: 'portal.theme_change',
      payload: { mode: 'zen' },
      delay: 0,
      costTier: 'free'
    };
  }
}
