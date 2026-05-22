import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test';
import { CooldownManager, DEFAULT_COOLDOWN_DURATIONS } from './cooldownManager';
import { QuietPeriodState } from './types';

describe('CooldownManager', () => {
  let dateNowSpy: any;
  let currentTime = 1000000;

  beforeEach(() => {
    currentTime = 1000000;
    // bun's spyOn does not fully support overriding globals as easily without the right signature,
    // but we can mock globalThis.Date.now directly or use a mock Date object.
    const originalDateNow = Date.now;
    dateNowSpy = spyOn(globalThis.Date, 'now').mockImplementation(() => currentTime);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default durations if no custom ones are provided', () => {
      const manager = new CooldownManager();
      expect(manager.getRegistry().durations).toEqual(DEFAULT_COOLDOWN_DURATIONS);
    });

    it('should initialize with custom durations overriding defaults', () => {
      const custom = { 'agent.message': 2000, 'system.log': 500 };
      const manager = new CooldownManager(custom);
      expect(manager.getRegistry().durations['agent.message']).toBe(2000);
      expect(manager.getRegistry().durations['system.log']).toBe(500);
      // Ensure defaults are still there
      expect(manager.getRegistry().durations['agent.thinking']).toBe(DEFAULT_COOLDOWN_DURATIONS['agent.thinking']);
    });
  });

  describe('getRegistry', () => {
    it('should return the internal registry', () => {
      const manager = new CooldownManager();
      const registry = manager.getRegistry();
      expect(registry).toBeDefined();
      expect(registry.durations).toBeDefined();
      expect(registry.lastEmit).toBeDefined();
      expect(registry.globalRateLimit).toBeDefined();
      expect(registry.quietPeriod).toBeNull();
    });
  });

  describe('isEventReady', () => {
    it('should return true initially for any event', () => {
      const manager = new CooldownManager();
      expect(manager.isEventReady('agent.message')).toBe(true);
    });

    it('should return false if lastEmit is within the duration', () => {
      const manager = new CooldownManager({ 'agent.message': 1000 });
      manager.recordEvent('agent.message');

      // Advance time by 500ms (less than 1000ms cooldown)
      currentTime += 500;

      expect(manager.isEventReady('agent.message')).toBe(false);
    });

    it('should return true if lastEmit is older than the duration', () => {
      const manager = new CooldownManager({ 'agent.message': 1000 });
      manager.recordEvent('agent.message');

      // Advance time by 1000ms (equal to cooldown)
      currentTime += 1000;
      expect(manager.isEventReady('agent.message')).toBe(true);

      // Advance time by more
      currentTime += 500;
      expect(manager.isEventReady('agent.message')).toBe(true);
    });
  });

  describe('isGlobalRateLimitExceeded', () => {
    it('should return false initially', () => {
      const manager = new CooldownManager();
      expect(manager.isGlobalRateLimitExceeded()).toBe(false);
    });

    it('should return true if max actions per window is exceeded', () => {
      const manager = new CooldownManager();
      const max = manager.getRegistry().globalRateLimit.maxPerWindow;

      for (let i = 0; i < max; i++) {
        manager.recordEvent('system.log');
      }

      expect(manager.isGlobalRateLimitExceeded()).toBe(true);
    });

    it('should return false and reset if window is passed', () => {
      const manager = new CooldownManager();
      const max = manager.getRegistry().globalRateLimit.maxPerWindow;

      for (let i = 0; i < max; i++) {
        manager.recordEvent('system.log');
      }

      expect(manager.isGlobalRateLimitExceeded()).toBe(true);

      // Advance time beyond window
      const windowMs = manager.getRegistry().globalRateLimit.windowMs;
      currentTime += windowMs + 100;

      expect(manager.isGlobalRateLimitExceeded()).toBe(false);
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(0);
    });
  });

  describe('isQuietPeriodActive', () => {
    it('should return false if no quiet period is set', () => {
      const manager = new CooldownManager();
      expect(manager.isQuietPeriodActive()).toBe(false);
    });

    it('should return true if quiet period is active', () => {
      const manager = new CooldownManager();
      manager.setQuietPeriod({
        startedAt: currentTime,
        maxDuration: 5000,
        mode: 'sleep_mode',
        minDuration: 1000,
        wakeTriggers: [],
        visualExpression: 'sleeping'
      });

      expect(manager.isQuietPeriodActive()).toBe(true);
    });

    it('should auto-clear and return false if quiet period has expired', () => {
      const manager = new CooldownManager();
      manager.setQuietPeriod({
        startedAt: currentTime,
        maxDuration: 5000,
        mode: 'sleep_mode',
        minDuration: 1000,
        wakeTriggers: [],
        visualExpression: 'sleeping'
      });

      currentTime += 5001; // Advance past maxDuration
      expect(manager.isQuietPeriodActive()).toBe(false);
      expect(manager.getRegistry().quietPeriod).toBeNull();
    });
  });

  describe('canExecute', () => {
    it('should return true if no restrictions apply', () => {
      const manager = new CooldownManager();
      expect(manager.canExecute('agent.message')).toBe(true);
    });

    it('should return false if quiet period is active and not emergency wake', () => {
      const manager = new CooldownManager();
      manager.setQuietPeriod({
        startedAt: currentTime,
        maxDuration: 5000,
        mode: 'sleep_mode',
        minDuration: 1000,
        wakeTriggers: [],
        visualExpression: 'sleeping'
      });

      expect(manager.canExecute('agent.message')).toBe(false);
    });

    it('should return true if quiet period is active but is emergency wake', () => {
      const manager = new CooldownManager();
      manager.setQuietPeriod({
        startedAt: currentTime,
        maxDuration: 5000,
        mode: 'sleep_mode',
        minDuration: 1000,
        wakeTriggers: [],
        visualExpression: 'sleeping'
      });

      expect(manager.canExecute('agent.message', true)).toBe(true);
    });

    it('should return false if global rate limit is exceeded', () => {
      const manager = new CooldownManager();
      const max = manager.getRegistry().globalRateLimit.maxPerWindow;

      for (let i = 0; i < max; i++) {
        manager.recordEvent('system.log');
      }

      expect(manager.canExecute('agent.message')).toBe(false);
    });

    it('should return false if event cooldown has not passed', () => {
      const manager = new CooldownManager({ 'agent.message': 1000 });
      manager.recordEvent('agent.message');
      expect(manager.canExecute('agent.message')).toBe(false);
    });
  });

  describe('recordEvent', () => {
    it('should update lastEmit for the given event', () => {
      const manager = new CooldownManager();
      manager.recordEvent('agent.message');
      expect(manager.getRegistry().lastEmit['agent.message']).toBe(currentTime);
    });

    it('should increment actionsThisWindow', () => {
      const manager = new CooldownManager();
      manager.recordEvent('agent.message');
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(1);
    });

    it('should reset actionsThisWindow if recorded past window', () => {
      const manager = new CooldownManager();
      manager.recordEvent('agent.message');

      const windowMs = manager.getRegistry().globalRateLimit.windowMs;
      currentTime += windowMs + 100;

      manager.recordEvent('agent.message');
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(1);
      expect(manager.getRegistry().globalRateLimit.currentWindowStart).toBe(currentTime);
    });
  });

  describe('setQuietPeriod and clearQuietPeriod', () => {
    it('should set quiet period', () => {
      const manager = new CooldownManager();
      const state: QuietPeriodState = {
        startedAt: currentTime,
        maxDuration: 5000,
        mode: 'sleep_mode',
        minDuration: 1000,
        wakeTriggers: [],
        visualExpression: 'sleeping'
      };
      manager.setQuietPeriod(state);
      expect(manager.getRegistry().quietPeriod).toBe(state);
    });

    it('should clear quiet period', () => {
      const manager = new CooldownManager();
      manager.setQuietPeriod({
        startedAt: currentTime,
        maxDuration: 5000,
        mode: 'sleep_mode',
        minDuration: 1000,
        wakeTriggers: [],
        visualExpression: 'sleeping'
      });
      manager.clearQuietPeriod();
      expect(manager.getRegistry().quietPeriod).toBeNull();
    });
  });
});
