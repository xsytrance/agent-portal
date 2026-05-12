import {
  AtlasState, AtlasMode, AtlasMood, SilenceMode,
  BehaviorSignal, BehaviorDecision, EyeBehavior, ParticleMood, AtlasConfig,
} from './types';
import { DEFAULT_ATLAS_CONFIG } from './config';
import { getRareMessage } from './rare';

export class AtlasBrain {
  private state: AtlasState;
  private config: AtlasConfig;
  private startTime: number;
  private lastTick: number;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(config?: Partial<AtlasConfig>) {
    this.config = { ...DEFAULT_ATLAS_CONFIG, ...config };
    this.startTime = Date.now();
    this.lastTick = this.startTime;
    this.state = {
      mode: 'OBSERVING',
      mood: 'calm',
      attentionLevel: 100,
      silenceMode: 'OBSERVING',
      sessionTimeMs: 0,
      lastActivityMs: 0,
      lastBehaviorChangeMs: 0,
      behaviorChangeCount: 0,
      rareEventFired: false,
      userInteractionCount: 0,
      isIdle: false,
      density: 'low',
    };
  }

  tick(signal: BehaviorSignal): BehaviorDecision {
    const now = Date.now();
    this.state.sessionTimeMs = now - this.startTime;
    const deltaMs = now - this.lastTick;
    this.lastTick = now;

    if (signal.type !== 'TICK') {
      this.state.lastActivityMs = 0;
      this.state.userInteractionCount++;
      this.state.isIdle = false;
    } else {
      this.state.lastActivityMs += deltaMs;
      this.state.isIdle = this.state.lastActivityMs > this.config.idleThresholdMs;
    }

    if (this.state.isIdle && this.state.attentionLevel < 100) {
      const recovery = (this.config.attentionRecoveryRate * deltaMs) / 10000;
      this.state.attentionLevel = Math.min(100, this.state.attentionLevel + recovery);
    }

    this.processSignal(signal);
    this.checkRareEvent(signal);
    this.updateDensity();

    return this.buildDecision();
  }

  private processSignal(signal: BehaviorSignal): void {
    const timeSinceChange = this.state.sessionTimeMs - this.state.lastBehaviorChangeMs;
    const canChange = timeSinceChange > this.config.minBehaviorChangeIntervalMs;

    switch (signal.type) {
      case 'IDLE':
        if (canChange && this.state.mode !== 'RESTING') this.goTo('RESTING');
        break;
      case 'HOVER':
        if (this.state.isIdle) {
          this.state.isIdle = false;
          this.state.lastActivityMs = 0;
        }
        if (canChange && this.state.userInteractionCount % 5 === 0) {
          this.setMood('curious');
          this.goTo('REACTING');
          this.schedule(() => { this.setMood('calm'); this.goTo('OBSERVING'); }, 2000);
        }
        this.state.attentionLevel = Math.max(0, this.state.attentionLevel - this.config.attentionEventCost * 0.5);
        break;
      case 'CHAT':
        this.setMood('thoughtful');
        this.goTo('THINKING');
        this.state.attentionLevel = Math.max(0, this.state.attentionLevel - this.config.attentionEventCost);
        this.schedule(() => { if (this.state.mode === 'THINKING') this.goTo('REACTING'); }, this.config.thinkingDurationMs);
        break;
      case 'SCROLL':
        if (canChange && this.state.mode === 'OBSERVING') {
          this.setMood('curious');
          this.schedule(() => this.setMood('calm'), 3000);
        }
        break;
      case 'AGENT_SWITCH':
        this.goTo('OBSERVING');
        this.setMood('calm');
        this.state.attentionLevel = 100;
        break;
      case 'TICK':
        if (this.state.isIdle && canChange && this.state.mode !== 'RESTING') {
          this.goTo('RESTING');
        }
        if (this.state.mode === 'REACTING' && canChange) {
          this.goTo('OBSERVING');
        }
        break;
    }
  }

  private goTo(mode: AtlasMode): void {
    if (this.state.mode === mode) return;
    this.state.mode = mode;
    this.state.lastBehaviorChangeMs = this.state.sessionTimeMs;
    this.state.behaviorChangeCount++;
    const sm: Record<AtlasMode, SilenceMode> = {
      OBSERVING: 'OBSERVING', RESTING: 'RESTING',
      THINKING: 'THINKING', REACTING: 'OBSERVING',
    };
    this.state.silenceMode = sm[mode];
  }

  private setMood(mood: AtlasMood): void { this.state.mood = mood; }

  private updateDensity(): void {
    if (this.state.attentionLevel < this.config.attentionThresholdCritical) this.state.density = 'ambient';
    else if (this.state.attentionLevel < this.config.attentionThresholdLow) this.state.density = 'low';
    else this.state.density = 'medium';
  }

  private checkRareEvent(signal: BehaviorSignal): void {
    if (this.state.rareEventFired || signal.type === 'TICK') return;
    const engaged = this.state.sessionTimeMs > this.config.rareEventTriggerTimeMs;
    const interactive = this.state.userInteractionCount >= this.config.rareEventMinInteractions;
    if (engaged && interactive) {
      this.state.rareEventFired = true;
    }
  }

  private buildDecision(): BehaviorDecision {
    const eye = this.buildEyeBehavior();
    const particles = this.buildParticleMood();
    const rareTrigger = this.state.rareEventFired && this.state.mode === 'REACTING';
    return {
      eyeBehavior: eye,
      particleMood: particles,
      silenceMode: this.state.silenceMode,
      shouldSpeak: this.state.mode === 'REACTING' || rareTrigger,
      speakDelayMs: this.state.mode === 'THINKING' ? this.config.thinkingDurationMs : 0,
      message: rareTrigger ? getRareMessage(this.state) : undefined,
      rareEventTrigger: rareTrigger,
    };
  }

  private buildEyeBehavior(): EyeBehavior {
    const base: EyeBehavior = {
      trackingSpeed: 0.04, blinkRateMin: this.config.observingBlinkRateMin,
      blinkRateMax: this.config.observingBlinkRateMax, movementRange: 35,
      lookAtCursor: true, lookAway: false, returnToCenter: false,
      animationIntensity: 0.4, pupilDilation: 1.0, eyelidOpenness: 0.9,
      thinkingWobble: false,
    };
    switch (this.state.mode) {
      case 'OBSERVING':
        if (this.state.mood === 'curious') { base.animationIntensity = 0.6; base.pupilDilation = 1.15; }
        break;
      case 'RESTING':
        base.trackingSpeed = 0.01; base.blinkRateMin = this.config.restingBlinkRateMin;
        base.blinkRateMax = this.config.restingBlinkRateMax; base.movementRange = 10;
        base.lookAtCursor = false; base.returnToCenter = true;
        base.animationIntensity = 0.15; base.pupilDilation = 0.85; base.eyelidOpenness = 0.7;
        break;
      case 'THINKING':
        base.trackingSpeed = 0.02; base.lookAtCursor = false; base.lookAway = true;
        base.movementRange = 20; base.animationIntensity = 0.3;
        base.pupilDilation = 1.1; base.thinkingWobble = true;
        break;
      case 'REACTING':
        base.trackingSpeed = 0.06; base.movementRange = 40;
        base.animationIntensity = 0.7; base.pupilDilation = 1.2; base.eyelidOpenness = 1.0;
        break;
    }
    if (this.state.attentionLevel < 50) { base.animationIntensity *= 0.5; base.movementRange *= 0.6; }
    if (this.state.attentionLevel < 25) { base.animationIntensity *= 0.3; base.trackingSpeed *= 0.5; }
    return base;
  }

  private buildParticleMood(): ParticleMood {
    const base: ParticleMood = {
      speed: 0.8, count: 35, connectionOpacity: 0.1,
      cursorRepulsion: true, color: '#3B82F6', driftAmplitude: 15,
    };
    switch (this.state.mode) {
      case 'RESTING': base.speed = 0.3; base.count = 20; base.connectionOpacity = 0.05; base.driftAmplitude = 5; break;
      case 'THINKING': base.speed = 0.5; base.count = 25; base.connectionOpacity = 0.08; base.driftAmplitude = 8; break;
      case 'REACTING': base.speed = 1.2; base.count = 40; base.connectionOpacity = 0.15; base.driftAmplitude = 20; break;
    }
    if (this.state.density === 'ambient') base.count = Math.floor(base.count * 0.5);
    if (this.state.density === 'low') base.count = Math.floor(base.count * 0.75);
    if (this.state.mood === 'curious') { base.color = '#60A5FA'; base.speed *= 1.2; }
    if (this.state.mood === 'thoughtful') { base.color = '#2563EB'; base.speed *= 0.8; }
    return base;
  }

  private schedule(fn: () => void, delay: number): void {
    const t = setTimeout(fn, delay);
    this.timers.push(t);
  }

  getState(): Readonly<AtlasState> { return this.state; }
  isIdle(): boolean { return this.state.isIdle; }
  getAttentionLevel(): number { return this.state.attentionLevel; }
  getMode(): AtlasMode { return this.state.mode; }

  destroy(): void {
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];
  }
}
