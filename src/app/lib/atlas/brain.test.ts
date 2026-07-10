import { describe, it, expect, beforeEach, afterEach, setSystemTime, spyOn } from 'bun:test';
import { AtlasBrain } from './brain';
import { AtlasConfig, BehaviorSignal } from './types';

describe('AtlasBrain Mode Transitions', () => {
  let brain: AtlasBrain;
  let setTimeoutSpy: ReturnType<typeof spyOn>;
  let scheduledCallbacks: { cb: () => void; delay: number }[] = [];

  const createBrain = (configOverrides?: Partial<AtlasConfig>) => {
    return new AtlasBrain({
      idleThresholdMs: 5000,
      minBehaviorChangeIntervalMs: 1000, // Reduced for easier testing
      thinkingDurationMs: 2000,
      ...configOverrides,
    });
  };

  const advanceTimeBy = (ms: number) => {
    const newTime = Date.now() + ms;
    setSystemTime(newTime);
    return newTime;
  };

  const tick = (type: BehaviorSignal['type'] = 'TICK') => {
    brain.tick({ type, timestamp: Date.now() });
  };

  beforeEach(() => {
    // Reset system time to a known point
    const baseTime = new Date('2024-01-01T00:00:00.000Z').getTime();
    setSystemTime(baseTime);

    // Reset callbacks
    scheduledCallbacks = [];

    // Mock setTimeout to capture callbacks without executing them
    setTimeoutSpy = spyOn(globalThis, 'setTimeout').mockImplementation(((cb: () => void, delay?: number) => {
      scheduledCallbacks.push({ cb, delay: delay ?? 0 });
      return 123 as unknown as ReturnType<typeof setTimeout>; // dummy timer id
    }) as unknown as typeof setTimeout);

    brain = createBrain();
  });

  afterEach(() => {
    brain.destroy();
    setTimeoutSpy.mockRestore();
    setSystemTime(); // Reset to system time
  });

  it('should initialize in OBSERVING mode', () => {
    expect(brain.getMode()).toBe('OBSERVING');
  });

  it('should transition to RESTING mode when IDLE signal is received', () => {
    // Need to advance time past minBehaviorChangeIntervalMs (1000ms)
    advanceTimeBy(1500);
    tick('IDLE');
    expect(brain.getMode()).toBe('RESTING');
  });

  it('should transition to RESTING mode automatically after idle threshold via TICK', () => {
    // Advance time past idleThresholdMs (5000ms)
    advanceTimeBy(6000);
    tick('TICK');
    expect(brain.getMode()).toBe('RESTING');
  });

  it('should transition to REACTING mode on 5th HOVER and schedule return to OBSERVING', () => {
    // Initial TICK to setup session
    tick('TICK');
    advanceTimeBy(1500);

    // 5 HOVER signals (userInteractionCount increments on each non-TICK signal)
    for (let i = 0; i < 4; i++) {
      tick('HOVER');
    }

    // Advance time to pass minBehaviorChangeIntervalMs (from initialization or last change)
    advanceTimeBy(1500);

    // 5th hover
    tick('HOVER');

    expect(brain.getMode()).toBe('REACTING');

    // Verify a callback was scheduled to return to OBSERVING
    expect(scheduledCallbacks.length).toBeGreaterThan(0);
    const returnCb = scheduledCallbacks[scheduledCallbacks.length - 1];
    expect(returnCb.delay).toBe(2000);

    // Advance time and execute the callback
    advanceTimeBy(2000);
    returnCb.cb();

    expect(brain.getMode()).toBe('OBSERVING');
  });

  it('should transition to THINKING mode on CHAT and schedule return to REACTING', () => {
    advanceTimeBy(1500);
    tick('CHAT');

    expect(brain.getMode()).toBe('THINKING');

    // Verify a callback was scheduled for thinking mode
    expect(scheduledCallbacks.length).toBeGreaterThan(0);

    // Find the callback scheduled for thinkingDurationMs (2000)
    const returnCb = scheduledCallbacks.find(cb => cb.delay === 2000);
    expect(returnCb).toBeDefined();

    advanceTimeBy(2000);
    returnCb!.cb();

    expect(brain.getMode()).toBe('REACTING');
  });

  it('should transition back to OBSERVING mode on AGENT_SWITCH', () => {
    // First go to RESTING to test the switch
    advanceTimeBy(1500);
    tick('IDLE');
    expect(brain.getMode()).toBe('RESTING');

    // Now trigger AGENT_SWITCH
    tick('AGENT_SWITCH');

    expect(brain.getMode()).toBe('OBSERVING');
    // Also verify attention level resets
    expect(brain.getAttentionLevel()).toBe(100);
  });

  it('should transition from REACTING to OBSERVING via TICK if enough time passed', () => {
     // Advance time past initial delay
     advanceTimeBy(1500);

     // We need to trigger exactly 5 interactions (only counts on non-TICK signals)
     // userInteractionCount starts at 0, need it to be exactly 5
     for (let i = 0; i < 5; i++) {
        tick('HOVER');
     }

     expect(brain.getMode()).toBe('REACTING');

     // Advance time past minBehaviorChangeIntervalMs
     advanceTimeBy(1500);
     tick('TICK'); // A tick will transition REACTING back to OBSERVING if canChange
     expect(brain.getMode()).toBe('OBSERVING');
  });
});
