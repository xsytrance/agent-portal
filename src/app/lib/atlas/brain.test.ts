import { describe, it, expect, beforeEach, afterEach, setSystemTime } from 'bun:test';
import { AtlasBrain } from './brain';
import { DEFAULT_ATLAS_CONFIG } from './config';

describe('AtlasBrain', () => {
  let brain: AtlasBrain;

  beforeEach(() => {
    // Reset timers and system time for deterministic tests
    setSystemTime(new Date('2024-01-01T00:00:00Z'));
    brain = new AtlasBrain();
  });

  afterEach(() => {
    brain.destroy();
    setSystemTime(); // Reset to real time
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const state = brain.getState();
      expect(state.mode).toBe('OBSERVING');
      expect(state.mood).toBe('calm');
      expect(state.attentionLevel).toBe(100);
      expect(state.silenceMode).toBe('OBSERVING');
      expect(state.isIdle).toBe(false);
      expect(state.density).toBe('low');
    });
  });

  describe('Signal Processing', () => {
    it('should handle IDLE signal by transitioning to RESTING mode', () => {
      // Advance time to allow behavior change
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs + 100);
      brain.tick({ type: 'IDLE' });
      expect(brain.getState().mode).toBe('RESTING');
    });

    it('should handle HOVER signal and trigger REACTING on 5th interaction', () => {
      // Initial state attention 100
      expect(brain.getState().attentionLevel).toBe(100);

      // Advance time
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs + 100);

      // Send 4 HOVER signals
      for (let i = 0; i < 4; i++) {
        brain.tick({ type: 'HOVER' });
      }
      expect(brain.getState().mode).toBe('OBSERVING'); // Hasn't changed yet

      // Send 5th HOVER signal
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs + 100);
      brain.tick({ type: 'HOVER' });

      expect(brain.getState().mode).toBe('REACTING');
      expect(brain.getState().mood).toBe('curious');
      expect(brain.getState().attentionLevel).toBeLessThan(100);
    });

    it('should handle CHAT signal by transitioning to THINKING mode', () => {
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs + 100);
      brain.tick({ type: 'CHAT' });

      expect(brain.getState().mode).toBe('THINKING');
      expect(brain.getState().mood).toBe('thoughtful');
    });

    it('should handle SCROLL signal by setting mood to curious', () => {
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs + 100);
      brain.tick({ type: 'SCROLL' });

      expect(brain.getState().mode).toBe('OBSERVING');
      expect(brain.getState().mood).toBe('curious');
    });

    it('should handle AGENT_SWITCH signal by resetting to OBSERVING mode', () => {
      // First, get into another mode
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs + 100);
      brain.tick({ type: 'CHAT' });
      expect(brain.getState().mode).toBe('THINKING');

      // Then trigger switch
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs + 100);
      brain.tick({ type: 'AGENT_SWITCH' });

      expect(brain.getState().mode).toBe('OBSERVING');
      expect(brain.getState().mood).toBe('calm');
      expect(brain.getState().attentionLevel).toBe(100);
    });
  });

  describe('Tick Management and Idle State', () => {
    it('should become idle after idleThresholdMs of TICK signals', () => {
      expect(brain.isIdle()).toBe(false);

      // Advance time past the idle threshold and min behavior change interval
      setSystemTime(Date.now() + Math.max(DEFAULT_ATLAS_CONFIG.idleThresholdMs, DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs) + 100);
      brain.tick({ type: 'TICK' });

      expect(brain.isIdle()).toBe(true);
      expect(brain.getState().mode).toBe('RESTING');
    });

    it('should recover attention level when idle', () => {
      // First drop attention
      brain.tick({ type: 'CHAT' });
      expect(brain.getState().attentionLevel).toBeLessThan(100);
      const initialAttention = brain.getState().attentionLevel;

      // Advance time to become idle
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.idleThresholdMs + 100);
      brain.tick({ type: 'TICK' });
      expect(brain.isIdle()).toBe(true);

      // Advance time and tick to recover attention
      setSystemTime(Date.now() + 1000);
      brain.tick({ type: 'TICK' });

      expect(brain.getState().attentionLevel).toBeGreaterThan(initialAttention);
    });
  });

  describe('Emotional Polish', () => {
    it('should trigger partial attention during OBSERVING mode', () => {
      const b = new AtlasBrain({ partialAttentionChance: 1.0 }); // Guarantee it triggers

      // Tick quickly so it is not idle
      setSystemTime(Date.now() + 100);
      const decision = b.tick({ type: 'TICK' });

      expect(b.getState().mode).toBe('OBSERVING');
      expect(decision.eyeBehavior.partialAttention).toBe(true);
      expect(decision.eyeBehavior.secondaryTarget).not.toBeNull();

      b.destroy();
    });

    it('should show cognition cues during THINKING mode', () => {
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.minBehaviorChangeIntervalMs + 100);

      // Trigger THINKING
      brain.tick({ type: 'CHAT' });

      // Fast forward past cognition cue interval
      setSystemTime(Date.now() + DEFAULT_ATLAS_CONFIG.cognitionCueIntervalMs + 100);
      const decision = brain.tick({ type: 'TICK' });

      expect(['processing', 'recalling']).toContain(decision.eyeBehavior.cognitionCue);
    });
  });
});
