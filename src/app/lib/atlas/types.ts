/**
 * Atlas Brain — Core Type Definitions
 *
 * These types define the behavioral signal/decision loop that drives
 * the floating eye, particle mood, silence mode, and rare event triggers.
 */

/** User interaction signals fed into the brain on each tick */
export interface BehaviorSignal {
  type: 'IDLE' | 'HOVER' | 'SCROLL' | 'CHAT' | 'AGENT_SWITCH' | 'TICK';
  timestamp: number;
  payload?: Record<string, unknown>;
}

/** What the eye should be doing right now */
export type EyeBehavior =
  | 'IDLE'
  | 'TRACKING'
  | 'BLINK'
  | 'SLEEPY'
  | 'SURPRISED'
  | 'HAPPY'
  | 'CURIOUS'
  | 'SPEAKING';

/** Particle field mood state */
export type ParticleMood =
  | 'CALM'
  | 'CURIOUS'
  | 'EXCITED'
  | 'CHAOTIC'
  | 'SLEEPY';

/** Silence / communication mode */
export type SilenceMode =
  | 'SILENT'
  | 'OBSERVING'
  | 'WHISPERING'
  | 'SPEAKING'
  | 'INTERRUPTED';

/** The brain's behavioral output after processing a signal */
export interface BehaviorDecision {
  eyeBehavior: EyeBehavior;
  particleMood: ParticleMood;
  silenceMode: SilenceMode;
  shouldSpeak: boolean;
  speakDelayMs: number;
  rareEventTrigger?: string | null;
}

/** Full snapshot of AtlasBrain internal state */
export interface AtlasState {
  /** 0-100 attention level */
  attention: number;
  /** Current mode label */
  mode: string;
  /** How many ticks have elapsed */
  tickCount: number;
  /** When the last signal was received */
  lastSignalAt: number;
  /** History of recent decisions (last 50) */
  recentDecisions: BehaviorDecision[];
}
