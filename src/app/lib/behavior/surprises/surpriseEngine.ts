import { AgentPersonality, MoodDimension, BehaviorDecision, DirectorEventType } from '../types';

export class SurpriseSeeder {
  private lastSurpriseTime: number = 0;
  private surprisesThisSession: number = 0;

  // Rate config mapping
  private maxSurprises: Record<AgentPersonality, number> = {
    nova: 1,
    jinx: 3,
    atlas: 1,
  };

  // Enforce a hard 90-second minimum gap between ANY two surprises across all agents.
  private MIN_GAP_MS = 90_000;

  public evaluateSurprise(
    agentId: AgentPersonality,
    userIdleMs: number,
    currentMood: MoodDimension
  ): BehaviorDecision | null {
    const now = Date.now();

    // Constraint 1: Hard limits
    if (this.surprisesThisSession >= this.maxSurprises[agentId]) return null;

    // Constraint 2: Min Gap
    if (now - this.lastSurpriseTime < this.MIN_GAP_MS) return null;

    // Constraint 3: Do not disrupt active users (e.g. typing or clicking recently).
    // We expect the BehaviorDirector to pass `userIdleMs`.
    if (userIdleMs < 3000) return null;

    const surprise = this.generateSurprise(agentId, currentMood, userIdleMs);

    if (surprise) {
       this.lastSurpriseTime = now;
       this.surprisesThisSession++;
    }

    return surprise;
  }

  private generateSurprise(agentId: AgentPersonality, currentMood: MoodDimension, userIdleMs: number): BehaviorDecision | null {
    if (agentId === 'jinx') {
        // Theme Shift: User has been idle for ~5 min, jinx gets bored
        if (userIdleMs > 300000 && currentMood === 'mischievous') {
            return this.buildDecision(
                agentId,
                'repaint_page',
                'portal.theme_change',
                { variant: 'chaotic' },
                'Jinx got bored and triggered a theme shift.'
            );
        }
    } else if (agentId === 'nova') {
        // Holographic Demo
        if (currentMood === 'excited' && Math.random() > 0.8) {
           return this.buildDecision(
               agentId,
               'spawn_demo',
               'portal.demo_action',
               { demoType: 'hologram_chart' },
               'Nova had an exciting thought and spawned a hologram.'
           );
        }
    } else if (agentId === 'atlas') {
        if (userIdleMs > 300000 && currentMood === 'calm') {
           // Welcome Back / Calm Ring
           return this.buildDecision(
               agentId,
               'eye_react',
               'agent.eye_emotion',
               { emotion: 'happy', visual: 'calm_ring' },
               'Atlas gently greeted the returning user.'
           );
        }
    }

    return null;
  }

  private buildDecision(
      targetAgentId: AgentPersonality,
      action: BehaviorDecision['action'],
      eventType: DirectorEventType,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: Record<string, any>,
      summary: string
  ): BehaviorDecision {
      const now = Date.now();
      return {
          id: crypto.randomUUID(),
          timestamp: now,
          cycleNumber: -1, // Substituted by director
          signal: {
             id: crypto.randomUUID(),
             source: 'autonomous',
             type: 'autonomous.surprise',
             payload: { targetAgentId },
             timestamp: now,
             urgency: 0.9,
          },
          priority: {
            final: 0.9,
            base: 0.9,
            moodMultiplier: 1.0,
            personalityWeight: 1.0,
            cooldownPenalty: 0.0,
            budgetPenalty: 0.0,
            recencyBoost: 0.0
          },
          action,
          costTier: 'free',
          rationale: {
              summary,
              moodContext: 'Enabled surprise',
              personalityContext: targetAgentId,
              budgetContext: 'Free',
              alternativeConsidered: null
          },
          events: [{
              type: eventType,
              payload,
              delay: 0,
              costTier: 'free'
          }],
          executionDelay: 0
      };
  }
}
