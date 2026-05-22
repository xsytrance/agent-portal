import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import { StateMachine } from '../stateMachine';
import { BehaviorDirectorState, Signal, AgentPresenceState, MoodState } from '../types';

describe('StateMachine Edge Cases', () => {
  let stateMachine: StateMachine;

  const createMockState = (presence: AgentPresenceState = 'silent', lastDecisionTime: number = 0): BehaviorDirectorState => ({
    sessionId: 'test-session',
    agentId: 'nova',
    cycleCount: 1,
    sessionStartTime: Date.now() - 300000,
    lastDecisionTime,
    presence,
    presenceSince: Date.now() - 60000,
    presenceHistory: [],
    mood: {
      primary: 'calm',
      secondary: null,
      intensity: 0.5,
      transitionTarget: null,
      transitionProgress: 0,
      modifiers: [],
      lastShiftTime: Date.now()
    } as MoodState,
    moodHistory: [],
    recentActions: [],
    actionCountThisMinute: 0,
    actionCountThisSession: 0
  });

  const createMockSignal = (type: string, payload: Record<string, unknown> = {}): Signal => ({
    id: 'test-signal',
    source: 'system',
    type,
    payload,
    timestamp: Date.now(),
    urgency: 1
  });

  beforeEach(() => {
    stateMachine = new StateMachine();
  });

  it('should return null when no rules match the current state or signal', () => {
    // Current state is 'creating', signal is 'user.message'
    // 'creating' state only has rule for 'creation_complete'
    const state = createMockState('creating');
    const signal = createMockSignal('user.message');

    const result = stateMachine.evaluateTransitions(state, signal);
    expect(result).toBeNull();
  });

  it('should return null when guards fail due to missing payload data', () => {
    // silent -> sleeping requires system.timer, silentDuration > 120s, and userIdle > 60s
    // Provide state with lastDecisionTime > 120s ago, but signal missing userIdleMs
    const state = createMockState('silent', Date.now() - 130000);
    const signal = createMockSignal('system.timer', {}); // userIdleMs will default to 0

    const result = stateMachine.evaluateTransitions(state, signal);
    expect(result).toBeNull();
  });

  it('should fallback to 0 silentDuration when state.lastDecisionTime is missing/0', () => {
    // silent -> sleeping requires system.timer, silentDuration > 120s, and userIdle > 60s
    // Provide state with missing/0 lastDecisionTime, signal with userIdleMs > 60s
    const state = createMockState('silent', 0); // No lastDecisionTime
    const signal = createMockSignal('system.timer', { userIdleMs: 70000 });

    const result = stateMachine.evaluateTransitions(state, signal);
    expect(result).toBeNull(); // Fails silentDuration > 120s check
  });

  it('should correctly prioritize rules when multiple match', () => {
    // sleeping -> attentive (priority 10) vs sleeping -> responding (priority 20)
    // Both triggers are different ('user_mouse_move' vs 'user.message'), but let's
    // inject a rule to test priority explicitly
    const state = createMockState('silent');
    const signal = createMockSignal('custom.trigger');

    // Using cast to bypass private access for testing priority
    const sm = stateMachine as any;

    sm.rules.push({
      from: 'silent',
      to: 'spectacle',
      trigger: 'custom',
      guards: [{ description: 'Always pass', check: () => true }],
      priority: 5,
      probability: 1.0
    });

    sm.rules.push({
      from: 'silent',
      to: 'creating',
      trigger: 'custom',
      guards: [{ description: 'Always pass', check: () => true }],
      priority: 15,
      probability: 1.0
    });

    const result = sm.evaluateTransitions(state, signal);
    // Should choose the one with priority 15 ('creating')
    expect(result).toBe('creating');
  });

  it('should fail transition if probability check fails', () => {
    const state = createMockState('silent');
    const signal = createMockSignal('user.message'); // Matches silent -> responding, priority 20, prob 1.0

    // Force Math.random to return 1.5 (which is > 1.0)
    const randomSpy = spyOn(Math, 'random').mockReturnValue(1.5);

    const result = stateMachine.evaluateTransitions(state, signal);

    // Even though it matches, probability check fails, so it should fallback to null or next rule (none match)
    expect(result).toBeNull();

    randomSpy.mockRestore();
  });

  it('should evaluate transition properly when probability check succeeds', () => {
    const state = createMockState('silent');
    const signal = createMockSignal('user.message'); // Matches silent -> responding, priority 20, prob 1.0

    // Force Math.random to return 0.5 (which is <= 1.0)
    const randomSpy = spyOn(Math, 'random').mockReturnValue(0.5);

    const result = stateMachine.evaluateTransitions(state, signal);

    expect(result).toBe('responding');

    randomSpy.mockRestore();
  });

  it('should correctly evaluate missing payload in attentive guards', () => {
    const state = createMockState('attentive');
    // Attentive has two timer guards (userIdle > 30s vs userIdle > 60s)
    const signal = createMockSignal('system.timer', {}); // Missing userIdleMs, defaults to 0

    const result = stateMachine.evaluateTransitions(state, signal);
    // Both guards should fail
    expect(result).toBeNull();
  });
});
