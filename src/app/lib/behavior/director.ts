import { BehaviorDirectorState, Signal, BehaviorDecision } from './types';
import { executeDecisionFlow } from './decisionFlow';
import { RateLimitState } from './cooldownManager';
import { AGENT_SILENCE_PROFILES, AGENT_BEHAVIOR_CONFIGS } from './profiles';

export class BehaviorDirector {
  private state: BehaviorDirectorState;
  private intervalId: NodeJS.Timeout | null = null;
  private rateLimitState: RateLimitState;

  constructor(initialState: BehaviorDirectorState) {
    this.state = initialState;
    this.rateLimitState = {
        windowStart: Date.now(),
        actions: []
    };
  }

  public signal(incomingSignal: Signal) {
      this.state.pendingSignals.push(incomingSignal);
      this.state.lastSignalTime = Date.now();
  }

  public start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.tick();
    }, 500); // 500ms cycle loop
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
      this.state.cycleCount++;
      const now = Date.now();

      // Take the most urgent signal from the queue, or null if empty
      let currentSignal: Signal | null = null;
      if (this.state.pendingSignals.length > 0) {
          // Sort by urgency, pop highest
          this.state.pendingSignals.sort((a, b) => a.urgency - b.urgency);
          currentSignal = this.state.pendingSignals.pop() || null;
      }

      const agentSilenceProfile = AGENT_SILENCE_PROFILES[this.state.agentId];

      const { newState, decision } = executeDecisionFlow(
          this.state,
          currentSignal,
          this.rateLimitState,
          agentSilenceProfile
      );

      this.state = newState;

      if (decision) {
          this.state.lastDecisionTime = now;
          this.executeDecision(decision);
      }
  }

  private executeDecision(decision: BehaviorDecision) {
      // In a full implementation, this would enqueue the PlannedEvents to the eventQueue
      // and decrement the budget based on decision.costTier
      console.log(`[BehaviorDirector] Executing decision: \${decision.action}`);
  }

  public getState(): BehaviorDirectorState {
      return this.state;
  }
}
