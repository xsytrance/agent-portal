import { test, expect, describe, it, setSystemTime, afterEach, beforeEach } from "bun:test";
import { CooldownManager, DEFAULT_COOLDOWN_DURATIONS } from "./cooldownManager";
import { QuietPeriodState } from "./types";

describe("CooldownManager", () => {
  afterEach(() => {
    setSystemTime(); // reset time
  });

  describe("constructor", () => {
    it("initializes with default durations", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      const registry = manager.getRegistry();
      expect(registry.durations).toEqual(DEFAULT_COOLDOWN_DURATIONS);
      expect(registry.globalRateLimit.currentWindowStart).toBe(1000);
      expect(registry.globalRateLimit.actionsThisWindow).toBe(0);
    });

    it("initializes with custom durations", () => {
      const manager = new CooldownManager({ "agent.message": 9999 });
      const registry = manager.getRegistry();
      expect(registry.durations["agent.message"]).toBe(9999);
      expect(registry.durations["agent.thinking"]).toBe(DEFAULT_COOLDOWN_DURATIONS["agent.thinking"]);
    });
  });

  describe("isEventReady", () => {
    it("returns true initially for a new event", () => {
      const manager = new CooldownManager();
      expect(manager.isEventReady("agent.message")).toBe(true);
    });

    it("returns false if event is on cooldown", () => {
      const manager = new CooldownManager();
      setSystemTime(new Date(1000));
      manager.recordEvent("agent.message");

      expect(manager.isEventReady("agent.message")).toBe(false);
    });

    it("returns true after cooldown duration has passed", () => {
      const manager = new CooldownManager();
      setSystemTime(new Date(1000));
      manager.recordEvent("agent.message");

      const duration = DEFAULT_COOLDOWN_DURATIONS["agent.message"];
      setSystemTime(new Date(1000 + duration));

      expect(manager.isEventReady("agent.message")).toBe(true);
    });
  });

  describe("isGlobalRateLimitExceeded", () => {
    it("returns false initially", () => {
      const manager = new CooldownManager();
      expect(manager.isGlobalRateLimitExceeded()).toBe(false);
    });

    it("returns true when actions exceed maxPerWindow", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      // Default maxPerWindow is 20
      for (let i = 0; i < 20; i++) {
        manager.recordEvent("system.log");
      }
      expect(manager.isGlobalRateLimitExceeded()).toBe(true);
    });

    it("resets window after windowMs passes", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      for (let i = 0; i < 20; i++) {
        manager.recordEvent("system.log");
      }
      expect(manager.isGlobalRateLimitExceeded()).toBe(true);

      // Default windowMs is 60000
      setSystemTime(new Date(1000 + 60000));
      expect(manager.isGlobalRateLimitExceeded()).toBe(false);
    });
  });

  describe("isQuietPeriodActive", () => {
    it("returns false initially", () => {
      const manager = new CooldownManager();
      expect(manager.isQuietPeriodActive()).toBe(false);
    });

    it("returns true when quiet period is set and active", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      const quietState: QuietPeriodState = {
        mode: "sleep_mode",
        startedAt: 1000,
        minDuration: 5000,
        maxDuration: 10000,
        wakeTriggers: [],
        visualExpression: "sleeping"
      };
      manager.setQuietPeriod(quietState);
      expect(manager.isQuietPeriodActive()).toBe(true);
    });

    it("auto-clears and returns false when maxDuration is exceeded", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      const quietState: QuietPeriodState = {
        mode: "sleep_mode",
        startedAt: 1000,
        minDuration: 5000,
        maxDuration: 10000,
        wakeTriggers: [],
        visualExpression: "sleeping"
      };
      manager.setQuietPeriod(quietState);

      setSystemTime(new Date(1000 + 10000));
      expect(manager.isQuietPeriodActive()).toBe(false);
      expect(manager.getRegistry().quietPeriod).toBeNull();
    });
  });

  describe("setQuietPeriod & clearQuietPeriod", () => {
    it("sets and clears quiet period correctly", () => {
      const manager = new CooldownManager();
      const quietState: QuietPeriodState = {
        mode: "sleep_mode",
        startedAt: 1000,
        minDuration: 5000,
        maxDuration: 10000,
        wakeTriggers: [],
        visualExpression: "sleeping"
      };

      manager.setQuietPeriod(quietState);
      expect(manager.getRegistry().quietPeriod).toEqual(quietState);

      manager.clearQuietPeriod();
      expect(manager.getRegistry().quietPeriod).toBeNull();
    });
  });

  describe("canExecute", () => {
    it("returns true when no limits are hit", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      expect(manager.canExecute("agent.message")).toBe(true);
    });

    it("returns false if event is on cooldown", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      manager.recordEvent("agent.message");
      expect(manager.canExecute("agent.message")).toBe(false);
    });

    it("returns false during quiet period", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      manager.setQuietPeriod({
        mode: "sleep_mode",
        startedAt: 1000,
        minDuration: 5000,
        maxDuration: 10000,
        wakeTriggers: [],
        visualExpression: "sleeping"
      });
      expect(manager.canExecute("agent.message")).toBe(false);
    });

    it("returns true during quiet period if isEmergencyWake is true", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      manager.setQuietPeriod({
        mode: "sleep_mode",
        startedAt: 1000,
        minDuration: 5000,
        maxDuration: 10000,
        wakeTriggers: [],
        visualExpression: "sleeping"
      });
      // Emergency wake bypasses quiet period
      expect(manager.canExecute("agent.message", true)).toBe(true);
    });

    it("returns false if global rate limit exceeded", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      for (let i = 0; i < 20; i++) {
        manager.recordEvent("system.log");
      }
      expect(manager.canExecute("agent.message")).toBe(false);
    });
  });

  describe("recordEvent", () => {
    it("records the event timestamp", () => {
      setSystemTime(new Date(2000));
      const manager = new CooldownManager();
      manager.recordEvent("agent.message");
      expect(manager.getRegistry().lastEmit["agent.message"]).toBe(2000);
    });

    it("increments actionsThisWindow", () => {
      setSystemTime(new Date(2000));
      const manager = new CooldownManager();
      const initialActions = manager.getRegistry().globalRateLimit.actionsThisWindow;
      manager.recordEvent("agent.message");
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(initialActions + 1);
    });

    it("resets window if event occurs after windowMs", () => {
      setSystemTime(new Date(1000));
      const manager = new CooldownManager();
      manager.recordEvent("agent.message");
      manager.recordEvent("agent.message");
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(2);

      setSystemTime(new Date(1000 + 60000));
      manager.recordEvent("agent.message");
      expect(manager.getRegistry().globalRateLimit.actionsThisWindow).toBe(1);
      expect(manager.getRegistry().globalRateLimit.currentWindowStart).toBe(1000 + 60000);
    });
  });
});
