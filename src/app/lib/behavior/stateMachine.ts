import { AgentPresenceState, BehaviorDirectorState, Signal } from './types';

export const VALID_TRANSITIONS: Record<AgentPresenceState, AgentPresenceState[]> = {
  silent: ['attentive', 'responding', 'creating', 'spectacle', 'sleeping', 'silent'],
  attentive: ['silent', 'responding', 'spectacle', 'sleeping', 'attentive'],
  responding: ['silent', 'creating', 'responding'],
  creating: ['silent', 'responding', 'creating'],
  spectacle: ['silent', 'attentive', 'spectacle'],
  sleeping: ['silent', 'attentive', 'responding', 'sleeping'],
};

export function canTransition(from: AgentPresenceState, to: AgentPresenceState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

export function executeTransition(
  state: BehaviorDirectorState,
  to: AgentPresenceState,
  trigger: string,
  guardCondition: string
): BehaviorDirectorState {
  if (!canTransition(state.presence, to)) {
    throw new Error(`Invalid presence transition from ${state.presence} to ${to}`);
  }

  const newState = { ...state };
  const now = Date.now();

  newState.presenceHistory = [
    ...newState.presenceHistory,
    {
      from: state.presence,
      to,
      timestamp: now,
      trigger,
      guardCondition,
      cycleNumber: state.cycleCount,
    }
  ];

  // Keep history bounded
  if (newState.presenceHistory.length > 50) {
    newState.presenceHistory = newState.presenceHistory.slice(-50);
  }

  newState.presence = to;
  newState.presenceSince = now;

  return newState;
}
