import { SilenceMode, BehaviorDirectorState } from './types';

export interface SilenceConfig {
  mode: SilenceMode;
  visualExpression: string;
  particleBehavior: string;
}

export class SilenceEngine {
  public determineSilenceMode(state: BehaviorDirectorState): SilenceConfig {
    const idleTime = Date.now() - state.lastDecisionTime;
    const mood = state.mood.primary;

    // Based on idle time and mood, pick a silence mode
    if (idleTime > 120000) {
      return this.getModeConfig('sleep_mode', state.agentId);
    }

    if (mood === 'thoughtful') {
       return this.getModeConfig('deep_thinking', state.agentId);
    }

    if (mood === 'mischievous') {
        return this.getModeConfig('mischief_brewing', state.agentId);
    }

    if (mood === 'calm' && idleTime > 30000) {
       return this.getModeConfig('meditation', state.agentId);
    }

    if (idleTime > 10000) {
       return this.getModeConfig('passive_idle', state.agentId);
    }

    return this.getModeConfig('attentive_idle', state.agentId);
  }

  private getModeConfig(mode: SilenceMode, agentId: string): SilenceConfig {
      // Different agents have different visual expressions for the same silence mode

      const config: SilenceConfig = {
          mode,
          visualExpression: 'neutral',
          particleBehavior: 'ambient'
      };

      if (agentId === 'nova') {
         if (mode === 'deep_thinking') {
             config.visualExpression = 'scribbling_equations';
             config.particleBehavior = 'structured_orbit';
         } else if (mode === 'sleep_mode') {
             config.visualExpression = 'low_power';
             config.particleBehavior = 'minimal';
         }
      } else if (agentId === 'jinx') {
          if (mode === 'mischief_brewing') {
              config.visualExpression = 'peeking';
              config.particleBehavior = 'erratic_sparks';
          } else if (mode === 'passive_idle') {
              config.visualExpression = 'bored';
              config.particleBehavior = 'slow_drift';
          }
      } else if (agentId === 'atlas') {
          if (mode === 'meditation') {
              config.visualExpression = 'glowing_pulse';
              config.particleBehavior = 'harmonic_waves';
          } else if (mode === 'attentive_idle') {
              config.visualExpression = 'focused_glow';
              config.particleBehavior = 'steady_flow';
          }
      }

      return config;
  }
}
