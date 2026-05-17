import { SilenceMode, MoodDimension, AgentPersonality } from '../types';
import { SILENCE_MODE_CONFIGS, AGENT_SILENCE_PROFILES } from './silenceModes';
import { TokenBudget } from '../../budget/types';

export class SilenceEngine {
  private lastModes: SilenceMode[] = [];

  public selectSilenceMode(
    agentId: AgentPersonality,
    budget: TokenBudget,
    currentMood: MoodDimension,
    userIdleMs: number
  ): SilenceMode | null {
    // 1. Budget check
    if (budget.status === 'exhausted' || budget.status === 'critical') {
       return 'low_power';
    }

    if (userIdleMs < 5000) {
        return null;
    }

    // 2. Agent preference & trigger filtering
    const profile = AGENT_SILENCE_PROFILES[agentId];
    const preferredModes = profile ? profile.preferredModes : ['passive_idle' as SilenceMode];

    // 3 & 4. Filter by mood compatibility and idle time
    const eligibleModes = preferredModes.filter(modeName => {
        const config = SILENCE_MODE_CONFIGS[modeName];
        if (!config) return false;

        if (config.moodRequirement && config.moodRequirement !== currentMood) {
            return false;
        }

        if (userIdleMs < config.minUserIdleTime) {
            return false;
        }

        return true;
    });

    if (eligibleModes.length === 0) {
        return 'passive_idle';
    }

    // 5. Selection with recency penalty
    let bestMode = eligibleModes[0];
    let highestWeight = -1;

    for (const mode of eligibleModes) {
       let weight = Math.random(); // Base random

       // Recency penalty
       if (this.lastModes.includes(mode)) {
           weight *= 0.5;
       }

       if (weight > highestWeight) {
           highestWeight = weight;
           bestMode = mode;
       }
    }

    // 6. Record and return
    this.lastModes.push(bestMode);
    if (this.lastModes.length > 5) {
       this.lastModes.shift();
    }

    return bestMode;
  }
}
