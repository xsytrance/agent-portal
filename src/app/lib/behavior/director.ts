import {
  BehaviorDirectorState,
  Signal,
  BehaviorDecision,
  AgentPresenceState,
  DirectorEventType,
} from './types';
import { StateMachine } from './stateMachine';
import { MoodEngine } from './moodEngine';
import { CooldownManager } from './cooldownManager';
import { SurpriseSeeder } from './surprises/surpriseEngine';

export interface DirectorConfig {
  cycleIntervalMs: number;
}

const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = {
  cycleIntervalMs: 500,
};

export class BehaviorDirector {
  private state: BehaviorDirectorState;
  private stateMachine: StateMachine;
  private moodEngine: MoodEngine;
  private cooldownManager: CooldownManager;
  private surpriseSeeder: SurpriseSeeder;
  private config: DirectorConfig;

  private pendingSignals: Signal[] = [];
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private eventDispatcher: (decision: BehaviorDecision) => void;

  constructor(
    initialState: BehaviorDirectorState,
    eventDispatcher: (decision: BehaviorDecision) => void,
    config?: Partial<DirectorConfig>
  ) {
    this.state = initialState;
    this.eventDispatcher = eventDispatcher;
    this.config = { ...DEFAULT_DIRECTOR_CONFIG, ...config };

    this.stateMachine = new StateMachine();
    this.moodEngine = new MoodEngine();
    this.cooldownManager = new CooldownManager();
    this.surpriseSeeder = new SurpriseSeeder();
  }

  public start() {
    if (!this.cycleTimer) {
      this.cycleTimer = setInterval(() => this.tick(), this.config.cycleIntervalMs);
    }
  }

  public stop() {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  public ingestSignal(signal: Signal) {
    this.pendingSignals.push(signal);
  }

  private tick() {
    this.state.cycleCount += 1;
    const now = Date.now();

    // 1. Process Mood Decay
    this.state.mood = this.moodEngine.processDecay(
      this.state.mood,
      this.state.agentId,
      this.config.cycleIntervalMs
    );

    // 2. Process pending signals
    const signalsToProcess = [...this.pendingSignals];
    this.pendingSignals = []; // clear queue

    // Evaluate signals prioritizing by urgency (descending)
    signalsToProcess.sort((a, b) => b.urgency - a.urgency);

    for (const signal of signalsToProcess) {
      this.processSignal(signal);
    }

    // 3. Autonomous state checks
    this.checkAutonomousTransitions(now);

    // 4. Surprise evaluation
    const surprise = this.surpriseSeeder.evaluateSurprise(
      this.state.agentId,
      now - this.state.lastDecisionTime, // userIdleMs approx
      this.state.mood.primary
    );

    if (surprise) {
        this.executeDecision(surprise);
    }
  }

  private processSignal(signal: Signal) {
    const newState = this.stateMachine.evaluateTransitions(this.state, signal);

    if (newState && newState !== this.state.presence) {
      this.transitionState(newState, signal.type);
    }

    // Simplified decision creation
    // Determine action mapping based on signal type
    let actionType: BehaviorDecision['action'] = 'do_nothing';
    let eventType: DirectorEventType | undefined;

    if (signal.type === 'user.message') {
      actionType = 'respond';
      eventType = 'agent.message';
    } else if (signal.type === 'user.mouse_enter' || signal.type === 'user.mouse_move') {
      actionType = 'eye_react';
      eventType = 'agent.eye_emotion';
    }

    if (eventType && this.cooldownManager.canExecute(eventType)) {
      this.cooldownManager.recordEvent(eventType);

      const decision: BehaviorDecision = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        cycleNumber: this.state.cycleCount,
        signal,
        priority: {
          final: signal.urgency,
          base: signal.urgency,
          moodMultiplier: 1.0,
          personalityWeight: 1.0,
          cooldownPenalty: 0.0,
          budgetPenalty: 0.0,
          recencyBoost: 0.0,
        },
        action: actionType,
        costTier: 'free',
        rationale: {
          summary: `Reacting to ${signal.type}`,
          moodContext: 'Neutral',
          personalityContext: 'Neutral',
          budgetContext: 'Sufficient',
          alternativeConsidered: null,
        },
        events: [
          {
            type: eventType,
            payload: signal.payload,
            delay: 0,
            costTier: 'free'
          }
        ],
        executionDelay: 0,
      };

      this.executeDecision(decision);
    }
  }

  private executeDecision(decision: BehaviorDecision) {
    this.state.recentActions.push(decision);
    if (this.state.recentActions.length > 100) {
      this.state.recentActions.shift();
    }

    this.state.lastDecisionTime = decision.timestamp;
    this.state.actionCountThisSession += 1;
    this.state.actionCountThisMinute += 1;

    // Output to dispatcher
    this.eventDispatcher(decision);
  }

  private transitionState(newState: AgentPresenceState, triggerReason: string) {
    const now = Date.now();
    this.state.presenceHistory.push({
      from: this.state.presence,
      to: newState,
      timestamp: now,
      reason: triggerReason,
    });

    if (this.state.presenceHistory.length > 50) {
      this.state.presenceHistory.shift();
    }

    this.state.presence = newState;
    this.state.presenceSince = now;
  }

  private checkAutonomousTransitions(now: number) {
    // Generate a synthetic timer signal for checking idle timeouts
    const timerSignal: Signal = {
      id: crypto.randomUUID(),
      source: 'system',
      type: 'system.timer',
      payload: { userIdleMs: now - this.state.lastDecisionTime },
      timestamp: now,
      urgency: 0.1,
    };

    const newState = this.stateMachine.evaluateTransitions(this.state, timerSignal);
    if (newState && newState !== this.state.presence) {
      this.transitionState(newState, 'autonomous.timer');
    }
  }

  public getState(): Readonly<BehaviorDirectorState> {
    return this.state;
  }
}
