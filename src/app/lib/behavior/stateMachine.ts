import { AgentPresenceState, BehaviorDirectorState, Signal } from './types';

export interface TransitionGuard {
  description: string;
  check: (state: BehaviorDirectorState, signal: Signal) => boolean;
}

export interface StateTransitionRule {
  from: AgentPresenceState;
  to: AgentPresenceState;
  trigger: string;
  guards: TransitionGuard[];
  priority: number;
  probability: number;
}

export class StateMachine {
  private rules: StateTransitionRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    // --- SILENT ---
    this.addRule('silent', 'attentive', 'user_mouse_enter', [
      {
        description: 'Mouse entered interaction zone',
        check: (_, signal) => signal.type === 'user.mouse_enter'
      }
    ], 10, 1.0);

    this.addRule('silent', 'responding', 'user_message', [
      {
        description: 'User sent a message',
        check: (_, signal) => signal.type === 'user.message'
      }
    ], 20, 1.0);

    this.addRule('silent', 'sleeping', 'idle_timeout', [
      {
        description: 'Silent duration > 120s and user idle > 60s',
        check: (state, signal) => {
          if (signal.type !== 'system.timer') return false;
          const silentDuration = state.lastDecisionTime ? Date.now() - state.lastDecisionTime : 0;
          const userIdle = signal.payload.userIdleMs as number || 0;
          return silentDuration > 120000 && userIdle > 60000;
        }
      }
    ], 5, 1.0);

    // --- ATTENTIVE ---
    this.addRule('attentive', 'responding', 'user_message', [
      {
        description: 'User sent a message',
        check: (_, signal) => signal.type === 'user.message'
      }
    ], 20, 1.0);

    this.addRule('attentive', 'silent', 'idle_timeout', [
      {
        description: 'User idle > 30s',
        check: (state, signal) => {
          if (signal.type !== 'system.timer') return false;
          const userIdle = signal.payload.userIdleMs as number || 0;
          return userIdle > 30000 && userIdle <= 60000;
        }
      }
    ], 5, 1.0);

    this.addRule('attentive', 'sleeping', 'idle_timeout', [
      {
        description: 'User idle > 60s',
        check: (state, signal) => {
          if (signal.type !== 'system.timer') return false;
          const userIdle = signal.payload.userIdleMs as number || 0;
          return userIdle > 60000;
        }
      }
    ], 6, 1.0);

    // --- RESPONDING ---
    this.addRule('responding', 'silent', 'response_complete', [
      {
        description: 'Response fully generated',
        check: (_, signal) => signal.type === 'agent.response_complete'
      }
    ], 10, 1.0);

    this.addRule('responding', 'creating', 'response_creating', [
      {
        description: 'Response requires creation',
        check: (_, signal) => signal.type === 'agent.response_creating'
      }
    ], 15, 1.0);

    // --- CREATING ---
    this.addRule('creating', 'silent', 'creation_complete', [
      {
        description: 'Creation finished',
        check: (_, signal) => signal.type === 'agent.creation_complete'
      }
    ], 10, 1.0);

    // --- SPECTACLE ---
    this.addRule('spectacle', 'silent', 'spectacle_complete', [
      {
        description: 'Spectacle finished',
        check: (_, signal) => signal.type === 'agent.spectacle_complete'
      }
    ], 10, 1.0);

    // --- SLEEPING ---
    this.addRule('sleeping', 'attentive', 'user_mouse_move', [
      {
        description: 'User moved mouse',
        check: (_, signal) => signal.type === 'user.mouse_move'
      }
    ], 10, 1.0);

    this.addRule('sleeping', 'responding', 'user_message', [
      {
        description: 'User sent a message',
        check: (_, signal) => signal.type === 'user.message'
      }
    ], 20, 1.0);
  }

  private addRule(
    from: AgentPresenceState,
    to: AgentPresenceState,
    trigger: string,
    guards: TransitionGuard[],
    priority: number,
    probability: number
  ) {
    this.rules.push({ from, to, trigger, guards, priority, probability });
  }

  public evaluateTransitions(state: BehaviorDirectorState, signal: Signal): AgentPresenceState | null {
    const applicableRules = this.rules
      .filter(r => r.from === state.presence)
      .filter(r => r.guards.every(g => g.check(state, signal)))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      if (Math.random() <= rule.probability) {
        return rule.to;
      }
    }

    return null;
  }
}
