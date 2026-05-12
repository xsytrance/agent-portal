/**
 * AtlasBrain — Behavioral decision engine stub
 *
 * This is a placeholder implementation. Another agent is building the
 * full behavioral engine. This stub returns sensible defaults so the
 * hooks that consume AtlasBrain can compile and run immediately.
 */

import {
  BehaviorSignal,
  BehaviorDecision,
  AtlasState,
  EyeBehavior,
  ParticleMood,
  SilenceMode,
} from './types';

const DEFAULT_DECISION: BehaviorDecision = {
  eyeBehavior: 'IDLE' as EyeBehavior,
  particleMood: 'CALM' as ParticleMood,
  silenceMode: 'OBSERVING' as SilenceMode,
  shouldSpeak: false,
  speakDelayMs: 0,
  rareEventTrigger: null,
};

export class AtlasBrain {
  private tickCount = 0;
  private lastSignalAt = Date.now();
  private recentDecisions: BehaviorDecision[] = [];
  private currentDecision: BehaviorDecision = { ...DEFAULT_DECISION };

  /** Process a signal and return a behavioral decision */
  tick(signal: BehaviorSignal): BehaviorDecision {
    this.tickCount++;
    this.lastSignalAt = signal.timestamp;

    // Minimal state machine based on signal type
    const decision = this.decide(signal);

    this.recentDecisions.push(decision);
    if (this.recentDecisions.length > 50) this.recentDecisions.shift();

    this.currentDecision = decision;
    return decision;
  }

  /** Return the current internal state snapshot */
  getState(): AtlasState {
    return {
      attention: this.getAttentionLevel(),
      mode: this.getMode(),
      tickCount: this.tickCount,
      lastSignalAt: this.lastSignalAt,
      recentDecisions: [...this.recentDecisions],
    };
  }

  /** Is the brain in idle state? */
  isIdle(): boolean {
    return this.currentDecision.eyeBehavior === 'IDLE';
  }

  /** 0-100 attention level */
  getAttentionLevel(): number {
    // Simple attention decay: starts at 50, decays over time
    const elapsed = Date.now() - this.lastSignalAt;
    const base = Math.max(0, 50 - elapsed / 200);
    return Math.min(100, base + this.tickCount * 0.5);
  }

  /** Current mode label */
  getMode(): string {
    return this.currentDecision.silenceMode.toLowerCase();
  }

  private decide(signal: BehaviorSignal): BehaviorDecision {
    // Stub decision logic — enough to drive the UI meaningfully
    switch (signal.type) {
      case 'IDLE':
        return {
          ...DEFAULT_DECISION,
          eyeBehavior: 'SLEEPY',
          particleMood: 'SLEEPY',
          silenceMode: 'SILENT',
        };
      case 'HOVER':
        return {
          ...DEFAULT_DECISION,
          eyeBehavior: 'CURIOUS',
          particleMood: 'CURIOUS',
          silenceMode: 'WHISPERING',
          shouldSpeak: Math.random() > 0.7,
          speakDelayMs: 500 + Math.random() * 1000,
        };
      case 'SCROLL':
        return {
          ...DEFAULT_DECISION,
          eyeBehavior: 'TRACKING',
          particleMood: 'EXCITED',
          silenceMode: 'OBSERVING',
        };
      case 'CHAT':
        return {
          ...DEFAULT_DECISION,
          eyeBehavior: 'SPEAKING',
          particleMood: 'EXCITED',
          silenceMode: 'SPEAKING',
          shouldSpeak: true,
          speakDelayMs: 200,
        };
      case 'AGENT_SWITCH':
        return {
          ...DEFAULT_DECISION,
          eyeBehavior: 'SURPRISED',
          particleMood: 'CHAOTIC',
          silenceMode: 'INTERRUPTED',
          shouldSpeak: true,
          speakDelayMs: 300,
          rareEventTrigger: Math.random() > 0.8 ? 'agent_switch_celebration' : null,
        };
      case 'TICK':
      default: {
        // On tick, slowly drift back to calm
        const lastMood = this.currentDecision.particleMood;
        return {
          ...this.currentDecision,
          eyeBehavior:
            this.currentDecision.eyeBehavior === 'SPEAKING'
              ? 'IDLE'
              : this.currentDecision.eyeBehavior,
          particleMood:
            lastMood === 'CHAOTIC'
              ? 'EXCITED'
              : lastMood === 'EXCITED'
                ? 'CURIOUS'
                : lastMood === 'CURIOUS'
                  ? 'CALM'
                  : lastMood,
          silenceMode:
            this.currentDecision.silenceMode === 'INTERRUPTED'
              ? 'OBSERVING'
              : this.currentDecision.silenceMode,
          rareEventTrigger: null, // consume rare events after one tick
        };
      }
    }
  }
}
