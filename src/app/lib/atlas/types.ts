// ============================================
// Atlas Brain — Shared Types (all agents use)
// ============================================

export type AtlasMode = "OBSERVING" | "REACTING" | "THINKING" | "RESTING";
export type AtlasMood = "calm" | "curious" | "thoughtful";
export type SilenceMode = "OBSERVING" | "RESTING" | "THINKING";

export interface AtlasState {
  mode: AtlasMode;
  mood: AtlasMood;
  attentionLevel: number; // 0-100
  silenceMode: SilenceMode;
  sessionTimeMs: number; // ms since session start
  lastActivityMs: number; // ms since last user activity
  lastBehaviorChangeMs: number; // ms since last mode change
  behaviorChangeCount: number;
  rareEventFired: boolean;
  userInteractionCount: number; // hovers, clicks, scrolls, messages
  isIdle: boolean;
  density: "ambient" | "low" | "medium";
}

export interface EyeBehavior {
  trackingSpeed: number; // lerp factor (0.01-0.1)
  blinkRateMin: number; // ms min between blinks
  blinkRateMax: number; // ms max between blinks
  movementRange: number; // max movement from center (px)
  lookAtCursor: boolean;
  lookAway: boolean; // look up/away (thinking mode)
  returnToCenter: boolean; // return to center (resting)
  animationIntensity: number; // 0-1, controls all animation speed
  pupilDilation: number; // 0.8-1.3
  eyelidOpenness: number; // 0.3-1.0
  thinkingWobble: boolean; // subtle eye wobble when thinking
  cognitionCue?: "none" | "processing" | "recalling"; // brief cognition flash
  breathPhase: number; // 0-1, sine-wave cycle position
  breathRate: number; // ms per full breath cycle
  partialAttention?: boolean; // when true, eye drifts to secondary target
  secondaryTarget?: { x: number; y: number } | null; // drift target when partially attentive
}

export interface ParticleMood {
  speed: number; // 0.2-2.0
  count: number; // 20-50
  connectionOpacity: number; // 0.05-0.3
  cursorRepulsion: boolean;
  color: string; // hex color
  driftAmplitude: number; // 0-30
}

export interface BehaviorSignal {
  type: "IDLE" | "HOVER" | "SCROLL" | "CHAT" | "AGENT_SWITCH" | "TICK";
  timestamp: number;
  payload?: Record<string, unknown>;
}

export interface BehaviorDecision {
  eyeBehavior: EyeBehavior;
  particleMood: ParticleMood;
  silenceMode: SilenceMode;
  shouldSpeak: boolean;
  speakDelayMs: number;
  message?: string;
  rareEventTrigger?: boolean;
}

export interface AtlasConfig {
  tickIntervalMs: number;
  idleThresholdMs: number;
  thinkingDurationMs: number;
  restingBlinkRateMin: number;
  restingBlinkRateMax: number;
  observingBlinkRateMin: number;
  observingBlinkRateMax: number;
  minBehaviorChangeIntervalMs: number;
  rareEventTriggerTimeMs: number;
  rareEventMinInteractions: number;
  attentionRecoveryRate: number;
  attentionEventCost: number;
  attentionThresholdLow: number;
  attentionThresholdCritical: number;
  attentionInertiaRate: number; // lerp factor for smooth attention transitions
  partialAttentionChance: number; // probability per tick of partial attention while OBSERVING
  cognitionCueDurationMs: number; // how long a cognition cue lasts
  cognitionCueIntervalMs: number; // minimum time between cognition cues
}
