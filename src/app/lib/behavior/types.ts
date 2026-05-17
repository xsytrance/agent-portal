export type AgentPresenceState =
  | 'silent'
  | 'attentive'
  | 'responding'
  | 'creating'
  | 'spectacle'
  | 'sleeping';

export type MoodDimension =
  | 'curious'
  | 'excited'
  | 'thoughtful'
  | 'mischievous'
  | 'calm'
  | 'focused'
  | 'sleepy'
  | 'surprised';

export type SignalSource = 'user' | 'external' | 'autonomous' | 'system';

export type CostTier = 'free' | 'low' | 'medium' | 'high';

export type DirectorEventType =
  | 'agent.message'
  | 'agent.thinking'
  | 'agent.eye_emotion'
  | 'agent.mood_shift'
  | 'portal.spawn_card'
  | 'portal.repaint'
  | 'portal.theme_change'
  | 'portal.sound_cue'
  | 'system.log';

export type AgentPersonality = 'nova' | 'jinx' | 'atlas';

export type DirectorAction =
  | 'respond'
  | 'think_aloud'
  | 'eye_react'
  | 'spawn_card'
  | 'repaint_page'
  | 'play_sound'
  | 'shift_mood'
  | 'go_silent'
  | 'wake_up'
  | 'do_nothing';

export type SilenceMode =
  | 'passive_idle'
  | 'attentive_idle'
  | 'deep_thinking'
  | 'mischief_brewing'
  | 'sleep_mode'
  | 'low_power'
  | 'meditation';

export interface Signal {
  id: string;
  source: SignalSource;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  urgency: number;
}

export interface PriorityScore {
  final: number;
  base: number;
  moodMultiplier: number;
  personalityWeight: number;
  cooldownPenalty: number;
  budgetPenalty: number;
  recencyBoost: number;
}

export interface PlannedEvent {
  type: DirectorEventType;
  payload: Record<string, unknown>;
  delay: number;
  costTier: CostTier;
}

export interface DecisionRationale {
  summary: string;
  moodContext: string;
  personalityContext: string;
  budgetContext: string;
  alternativeConsidered: string | null;
}

export interface BehaviorDecision {
  id: string;
  timestamp: number;
  cycleNumber: number;
  signal: Signal;
  priority: PriorityScore;
  action: DirectorAction;
  costTier: CostTier;
  silenceMode?: SilenceMode;
  rationale: DecisionRationale;
  events: PlannedEvent[];
  executionDelay: number;
}

export interface MoodModifier {
  source: string;
  dimension: MoodDimension;
  strength: number;
  expiresAt: number;
}

export interface MoodTransition {
  from: MoodDimension;
  to: MoodDimension;
  timestamp: number;
  trigger: string;
  intensity: number;
}

export interface MoodState {
  primary: MoodDimension;
  secondary: MoodDimension | null;
  intensity: number;
  transitionTarget: MoodDimension | null;
  transitionProgress: number;
  modifiers: MoodModifier[];
  lastShiftTime: number;
}

export interface PresenceTransition {
  from: AgentPresenceState;
  to: AgentPresenceState;
  timestamp: number;
  reason: string;
}

export interface BehaviorDirectorState {
  sessionId: string;
  agentId: AgentPersonality;
  cycleCount: number;
  sessionStartTime: number;
  lastDecisionTime: number;
  presence: AgentPresenceState;
  presenceSince: number;
  presenceHistory: PresenceTransition[];
  mood: MoodState;
  moodHistory: MoodTransition[];
  recentActions: BehaviorDecision[];
  actionCountThisMinute: number;
  actionCountThisSession: number;
}

export interface CooldownDurations {
  'agent.message': number;
  'agent.thinking': number;
  'agent.eye_emotion': number;
  'agent.mood_shift': number;
  'portal.spawn_card': number;
  'portal.repaint': number;
  'portal.theme_change': number;
  'portal.sound_cue': number;
  'system.log': number;
}

export interface QuietPeriodState {
  mode: SilenceMode;
  startedAt: number;
  minDuration: number;
  maxDuration: number;
  wakeTriggers: string[];
  visualExpression: string;
}

export interface CooldownRegistry {
  lastEmit: {
    [key in DirectorEventType]?: number;
  };
  durations: CooldownDurations;
  globalRateLimit: {
    windowMs: number;
    maxPerWindow: number;
    currentWindowStart: number;
    actionsThisWindow: number;
  };
  quietPeriod: QuietPeriodState | null;
}

export interface ActionBudget {
  total: number;
  remaining: number;
  spentByTier: {
    free: number;
    low: number;
    medium: number;
    high: number;
  };
  refillRate: number;
  isEmergencyMode: boolean;
}

export interface SilenceTrigger {
  type: 'user_idle' | 'budget_low' | 'mood_shift' | 'command' | 'autonomous';
  threshold?: number;
  probability: number;
}

export interface SilenceModeConfig {
  mode: SilenceMode;
  displayName: string;
  description: string;
  triggers: SilenceTrigger[];
  minUserIdleTime: number;
  moodRequirement: MoodDimension | null;
  minDuration: number;
  maxDuration: number;
  typicalDuration: number;
  eyeBehavior: string;
  particleBehavior: string;
  ambientSound: string | null;
  wakeOn: string[];
  wakeMoodShift: MoodDimension | null;
}
