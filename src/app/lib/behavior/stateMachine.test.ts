import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { StateMachine } from './stateMachine';
import { AgentPresenceState, BehaviorDirectorState, Signal } from './types';

// Mock state factory function
const createMockState = (overrides: Partial<BehaviorDirectorState> = {}): BehaviorDirectorState => ({
  sessionId: 'test-session',
  agentId: 'nova',
  cycleCount: 0,
  sessionStartTime: Date.now(),
  lastDecisionTime: Date.now(),
  presence: 'silent',
  presenceSince: Date.now(),
  presenceHistory: [],
  mood: {
    primary: 'calm',
    secondary: null,
    intensity: 0.5,
    transitionTarget: null,
    transitionProgress: 0,
    modifiers: [],
    lastShiftTime: Date.now()
  },
  moodHistory: [],
  recentActions: [],
  actionCountThisMinute: 0,
  actionCountThisSession: 0,
  ...overrides
});

// Mock signal factory function
const createMockSignal = (type: string, overrides: Partial<Signal> = {}): Signal => ({
  id: 'test-signal',
  source: 'system',
  type,
  payload: {},
  timestamp: Date.now(),
  urgency: 1,
  ...overrides
});

describe('StateMachine', () => {
  let stateMachine: StateMachine;

  beforeEach(() => {
    stateMachine = new StateMachine();
  });

  describe('Configuration Resolution', () => {
    it('initializes rules array correctly with expected transitions', () => {
      // Access private rules array for testing configuration correctness
      const rules = (stateMachine as any).rules;

      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);

      // Verify some key configurations are present

      // silent -> attentive on user_mouse_enter
      const silentToAttentive = rules.find((r: any) => r.from === 'silent' && r.to === 'attentive');
      expect(silentToAttentive).toBeDefined();
      expect(silentToAttentive.trigger).toBe('user_mouse_enter');
      expect(silentToAttentive.priority).toBe(10);

      // silent -> sleeping on idle_timeout
      const silentToSleeping = rules.find((r: any) => r.from === 'silent' && r.to === 'sleeping');
      expect(silentToSleeping).toBeDefined();
      expect(silentToSleeping.trigger).toBe('idle_timeout');
      expect(silentToSleeping.priority).toBe(5);

      // Check priority differences
      const silentToResponding = rules.find((r: any) => r.from === 'silent' && r.to === 'responding');
      expect(silentToResponding).toBeDefined();
      expect(silentToResponding.priority).toBe(20); // user_message should have higher priority
    });
  });

  describe('Simple Transitions', () => {
    it('transitions from silent to attentive on user_mouse_enter', () => {
      const state = createMockState({ presence: 'silent' });
      const signal = createMockSignal('user.mouse_enter');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('attentive');
    });

    it('transitions from silent to responding on user_message', () => {
      const state = createMockState({ presence: 'silent' });
      const signal = createMockSignal('user.message');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('responding');
    });

    it('transitions from attentive to responding on user_message', () => {
      const state = createMockState({ presence: 'attentive' });
      const signal = createMockSignal('user.message');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('responding');
    });

    it('transitions from responding to silent on agent.response_complete', () => {
      const state = createMockState({ presence: 'responding' });
      const signal = createMockSignal('agent.response_complete');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('silent');
    });

    it('transitions from responding to creating on agent.response_creating', () => {
      const state = createMockState({ presence: 'responding' });
      const signal = createMockSignal('agent.response_creating');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('creating');
    });

    it('transitions from creating to silent on agent.creation_complete', () => {
      const state = createMockState({ presence: 'creating' });
      const signal = createMockSignal('agent.creation_complete');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('silent');
    });

    it('transitions from spectacle to silent on agent.spectacle_complete', () => {
      const state = createMockState({ presence: 'spectacle' });
      const signal = createMockSignal('agent.spectacle_complete');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('silent');
    });

    it('transitions from sleeping to attentive on user_mouse_move', () => {
      const state = createMockState({ presence: 'sleeping' });
      const signal = createMockSignal('user.mouse_move');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('attentive');
    });

    it('transitions from sleeping to responding on user_message', () => {
      const state = createMockState({ presence: 'sleeping' });
      const signal = createMockSignal('user.message');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('responding');
    });
  });

  describe('Complex Transitions with Time-based Checks', () => {
    it('transitions from silent to sleeping when silentDuration > 120s and userIdle > 60s', () => {
      const now = Date.now();
      const state = createMockState({
        presence: 'silent',
        lastDecisionTime: now - 121000 // 121 seconds ago
      });
      const signal = createMockSignal('system.timer', {
        payload: { userIdleMs: 61000 }
      });

      const dateSpy = spyOn(Date, 'now').mockReturnValue(now);

      const result = stateMachine.evaluateTransitions(state, signal);

      dateSpy.mockRestore();
      expect(result).toBe('sleeping');
    });

    it('does not transition from silent to sleeping when silentDuration <= 120s', () => {
      const now = Date.now();
      const state = createMockState({
        presence: 'silent',
        lastDecisionTime: now - 119000 // 119 seconds ago
      });
      const signal = createMockSignal('system.timer', {
        payload: { userIdleMs: 61000 }
      });

      const dateSpy = spyOn(Date, 'now').mockReturnValue(now);

      const result = stateMachine.evaluateTransitions(state, signal);

      dateSpy.mockRestore();
      expect(result).toBeNull();
    });

    it('does not transition from silent to sleeping when userIdle <= 60s', () => {
      const now = Date.now();
      const state = createMockState({
        presence: 'silent',
        lastDecisionTime: now - 121000 // 121 seconds ago
      });
      const signal = createMockSignal('system.timer', {
        payload: { userIdleMs: 59000 }
      });

      const dateSpy = spyOn(Date, 'now').mockReturnValue(now);

      const result = stateMachine.evaluateTransitions(state, signal);

      dateSpy.mockRestore();
      expect(result).toBeNull();
    });

    it('transitions from attentive to silent when userIdle > 30s and <= 60s', () => {
      const state = createMockState({ presence: 'attentive' });
      const signal = createMockSignal('system.timer', {
        payload: { userIdleMs: 31000 }
      });
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('silent');
    });

    it('does not transition from attentive to silent when userIdle <= 30s', () => {
      const state = createMockState({ presence: 'attentive' });
      const signal = createMockSignal('system.timer', {
        payload: { userIdleMs: 29000 }
      });
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBeNull();
    });

    it('transitions from attentive to sleeping when userIdle > 60s', () => {
      const state = createMockState({ presence: 'attentive' });
      const signal = createMockSignal('system.timer', {
        payload: { userIdleMs: 61000 }
      });
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBe('sleeping');
    });
  });

  describe('Edge Cases and Logic Checks', () => {
    it('returns null when no transitions match for current state', () => {
      const state = createMockState({ presence: 'silent' });
      // spectacles complete is only for spectacle state
      const signal = createMockSignal('agent.spectacle_complete');
      const result = stateMachine.evaluateTransitions(state, signal);
      expect(result).toBeNull();
    });

    it('returns null when signal matches but guard fails', () => {
      const now = Date.now();
      const state = createMockState({
        presence: 'silent',
        lastDecisionTime: now - 10000 // 10 seconds ago
      });
      const signal = createMockSignal('system.timer', {
        payload: { userIdleMs: 10000 } // 10s idle
      });

      const dateSpy = spyOn(Date, 'now').mockReturnValue(now);

      const result = stateMachine.evaluateTransitions(state, signal);

      dateSpy.mockRestore();
      expect(result).toBeNull(); // Both guards fail for silent -> sleeping
    });

    it('skips a matching transition if Math.random() is strictly greater than rule probability', () => {
      const state = createMockState({ presence: 'silent' });
      const signal = createMockSignal('custom_trigger');

      // Override Math.random to return 0.999 while testing a transition with 0.5 probability (if we had one).
      // Since all rules have 1.0 probability, we can temporarily add a rule with 0.5 probability.
      const customStateMachine = new StateMachine();
      (customStateMachine as any).rules = [];
      (customStateMachine as any).addRule('silent', 'attentive', 'custom_trigger', [
        {
          description: 'Always passes',
          check: () => true
        }
      ], 10, 0.5);

      const randomSpy = spyOn(Math, 'random').mockReturnValue(0.999);

      const result = customStateMachine.evaluateTransitions(state, signal);

      randomSpy.mockRestore();

      expect(result).toBeNull();
    });

    it('respects priority when evaluating transitions by picking higher priority match', () => {
      // To test priority, we can dynamically add rules to stateMachine
      // or verify its behavior. Since addRule is private, we'll cast to any to test the internal logic.
      const customStateMachine = new StateMachine();

      (customStateMachine as any).rules = []; // clear existing

      // Add a low priority rule
      (customStateMachine as any).addRule('silent', 'sleeping', 'custom_trigger', [
        {
          description: 'Always passes',
          check: () => true
        }
      ], 5, 1.0);

      // Add a high priority rule with the same conditions
      (customStateMachine as any).addRule('silent', 'attentive', 'custom_trigger', [
        {
          description: 'Always passes',
          check: () => true
        }
      ], 10, 1.0);

      const state = createMockState({ presence: 'silent' });
      const signal = createMockSignal('custom_trigger');

      const result = customStateMachine.evaluateTransitions(state, signal);

      // Expect it to go to attentive, because priority 10 > priority 5
      expect(result).toBe('attentive');
    });
  });
});
