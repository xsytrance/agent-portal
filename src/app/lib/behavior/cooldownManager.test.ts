import { describe, it, expect, beforeEach, afterEach, setSystemTime } from 'bun:test';
import { CooldownManager, DEFAULT_COOLDOWN_DURATIONS } from './cooldownManager';
import { QuietPeriodState } from './types';

describe('CooldownManager', () => {
  let manager: CooldownManager;

  beforeEach(() => {
    setSystemTime(1000000); // Set a fixed starting time first!
    manager = new CooldownManager();
  });

  afterEach(() => {
    setSystemTime(); // Reset time to system time
  });

  describe('constructor and getRegistry', () => {
    it('should initialize with default durations', () => {
      const registry = manager.getRegistry();
      expect(registry.durations).toEqual(DEFAULT_COOLDOWN_DURATIONS);
      expect(registry.quietPeriod).toBeNull();
      expect(registry.globalRateLimit.maxPerWindow).toBe(20);
      expect(registry.globalRateLimit.windowMs).toBe(60000);
      expect(registry.globalRateLimit.actionsThisWindow).toBe(0);
      expect(registry.globalRateLimit.currentWindowStart).toBe(1000000);
    });

    it('should allow custom duration overrides', () => {
      const customManager = new CooldownManager({ 'agent.message': 5000 });
      const registry = customManager.getRegistry();
      expect(registry.durations['agent.message']).toBe(5000);
      expect(registry.durations['agent.thinking']).toBe(DEFAULT_COOLDOWN_DURATIONS['agent.thinking']);
    });
  });

  describe('isEventReady', () => {
    it('should be ready initially', () => {
      expect(manager.isEventReady('agent.message')).toBe(true);
    });

    it('should not be ready immediately after recording an event', () => {
      manager.recordEvent('agent.message');
      expect(manager.isEventReady('agent.message')).toBe(false);
    });

    it('should be ready after the duration has elapsed', () => {
      manager.recordEvent('agent.message');

      const duration = DEFAULT_COOLDOWN_DURATIONS['agent.message'];
      setSystemTime(1000000 + duration); // Advance time exactly by duration

      expect(manager.isEventReady('agent.message')).toBe(true);
    });
  });

  describe('isGlobalRateLimitExceeded', () => {
    it('should return false initially', () => {
      expect(manager.isGlobalRateLimitExceeded()).toBe(false);
    });

    it('should return true when limit is exceeded', () => {
      const max = manager.getRegistry().globalRateLimit.maxPerWindow;
      for (let i = 0; i < max; i++) {
        manager.recordEvent('system.log');
      }
      expect(manager.isGlobalRateLimitExceeded()).toBe(true);
    });

    it('should reset window when time elapses', () => {
      const max = manager.getRegistry().globalRateLimit.maxPerWindow;
      for (let i = 0; i < max; i++) {
        manager.recordEvent('system.log');
      }
      expect(manager.isGlobalRateLimitExceeded()).toBe(true);

      const windowMs = manager.getRegistry().globalRateLimit.windowMs;
      setSystemTime(1000000 + windowMs + 1); // Advance time past window

      expect(manager.isGlobalRateLimitExceeded()).toBe(false);
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(0);
    });
  });

  describe('Quiet Period', () => {
    const mockQuietPeriod: QuietPeriodState = {
      mode: 'sleep_mode',
      startedAt: 1000000,
      minDuration: 1000,
      maxDuration: 5000,
      wakeTriggers: ['user'],
      visualExpression: 'sleeping',
    };

    it('should not be active initially', () => {
      expect(manager.isQuietPeriodActive()).toBe(false);
    });

    it('should be active after setting', () => {
      manager.setQuietPeriod(mockQuietPeriod);
      expect(manager.isQuietPeriodActive()).toBe(true);
    });

    it('should be inactive after clearing', () => {
      manager.setQuietPeriod(mockQuietPeriod);
      manager.clearQuietPeriod();
      expect(manager.isQuietPeriodActive()).toBe(false);
    });

    it('should auto-clear when max duration is exceeded', () => {
      manager.setQuietPeriod(mockQuietPeriod);

      setSystemTime(1000000 + 5000); // Max duration reached
      expect(manager.isQuietPeriodActive()).toBe(false);
      expect(manager.getRegistry().quietPeriod).toBeNull();
    });
  });

  describe('recordEvent', () => {
    it('should update lastEmit timestamp', () => {
      manager.recordEvent('agent.message');
      expect(manager.getRegistry().lastEmit['agent.message']).toBe(1000000);
    });

    it('should increment global actions', () => {
      manager.recordEvent('agent.message');
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(1);
    });

    it('should start a new window if current window has elapsed', () => {
      manager.recordEvent('agent.message');
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(1);

      const windowMs = manager.getRegistry().globalRateLimit.windowMs;
      setSystemTime(1000000 + windowMs + 1);

      manager.recordEvent('agent.thinking');
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(1);
      expect(manager.getRegistry().globalRateLimit.currentWindowStart).toBe(1000000 + windowMs + 1);
    });
  });

  describe('canExecute', () => {
    it('should return false if quiet period is active and not emergency wake', () => {
      manager.setQuietPeriod({
        mode: 'sleep_mode',
        startedAt: 1000000,
        minDuration: 1000,
        maxDuration: 5000,
        wakeTriggers: [],
        visualExpression: 'sleeping',
      });
      expect(manager.canExecute('agent.message')).toBe(false);
    });

    it('should evaluate further if quiet period is active but it is an emergency wake', () => {
      manager.setQuietPeriod({
        mode: 'sleep_mode',
        startedAt: 1000000,
        minDuration: 1000,
        maxDuration: 5000,
        wakeTriggers: [],
        visualExpression: 'sleeping',
      });
      expect(manager.canExecute('agent.message', true)).toBe(true);
    });

    it('should return false if global rate limit exceeded', () => {
      const max = manager.getRegistry().globalRateLimit.maxPerWindow;
      for (let i = 0; i < max; i++) {
        manager.recordEvent('system.log');
      }
      expect(manager.canExecute('agent.message')).toBe(false);
    });

    it('should return false if event cooldown has not elapsed', () => {
      manager.recordEvent('agent.message');
      expect(manager.canExecute('agent.message')).toBe(false);
    });

    it('should return true if all conditions are met', () => {
      expect(manager.canExecute('agent.message')).toBe(true);
    });
  });
});
