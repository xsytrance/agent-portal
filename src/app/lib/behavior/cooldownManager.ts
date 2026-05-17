import { CooldownRegistry, CooldownDurations, QuietPeriodState, DirectorEventType } from './types';

export const DEFAULT_COOLDOWN_DURATIONS: CooldownDurations = {
  'agent.message': 1000,
  'agent.thinking': 500,
  'agent.eye_emotion': 5000,
  'agent.mood_shift': 15000,
  'portal.spawn_card': 60000,
  'portal.demo_action': 60000,
  'portal.repaint': 120000,
  'portal.theme_change': 300000,
  'portal.sound_cue': 10000,
  'system.log': 0,
};

export class CooldownManager {
  private registry: CooldownRegistry;

  constructor(customDurations?: Partial<CooldownDurations>) {
    this.registry = {
      lastEmit: {},
      durations: {
        ...DEFAULT_COOLDOWN_DURATIONS,
        ...customDurations,
      },
      globalRateLimit: {
        windowMs: 60000,
        maxPerWindow: 20,
        currentWindowStart: Date.now(),
        actionsThisWindow: 0,
      },
      quietPeriod: null,
    };
  }

  public getRegistry(): CooldownRegistry {
    return this.registry;
  }

  public isEventReady(eventType: DirectorEventType): boolean {
    const lastEmit = this.registry.lastEmit[eventType] || 0;
    const duration = this.registry.durations[eventType];
    return Date.now() - lastEmit >= duration;
  }

  public isGlobalRateLimitExceeded(): boolean {
    const now = Date.now();
    const limit = this.registry.globalRateLimit;

    if (now - limit.currentWindowStart >= limit.windowMs) {
      limit.currentWindowStart = now;
      limit.actionsThisWindow = 0;
    }

    return limit.actionsThisWindow >= limit.maxPerWindow;
  }

  public isQuietPeriodActive(): boolean {
    if (!this.registry.quietPeriod) {
      return false;
    }

    const now = Date.now();
    const state = this.registry.quietPeriod;

    if (now - state.startedAt >= state.maxDuration) {
      this.registry.quietPeriod = null; // Auto-clear if expired
      return false;
    }

    return true;
  }

  public canExecute(eventType: DirectorEventType, isEmergencyWake: boolean = false): boolean {
    if (!isEmergencyWake && this.isQuietPeriodActive()) {
      return false;
    }

    if (this.isGlobalRateLimitExceeded()) {
      return false;
    }

    return this.isEventReady(eventType);
  }

  public recordEvent(eventType: DirectorEventType): void {
    const now = Date.now();
    this.registry.lastEmit[eventType] = now;

    const limit = this.registry.globalRateLimit;
    if (now - limit.currentWindowStart >= limit.windowMs) {
      limit.currentWindowStart = now;
      limit.actionsThisWindow = 1;
    } else {
      limit.actionsThisWindow += 1;
    }
  }

  public setQuietPeriod(state: QuietPeriodState): void {
    this.registry.quietPeriod = state;
  }

  public clearQuietPeriod(): void {
    this.registry.quietPeriod = null;
  }
}
