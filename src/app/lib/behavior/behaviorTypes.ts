import type {
  PortalEventImportance,
  PortalEventSource,
  PortalEventType,
  PortalEventVisibility,
} from '@/app/lib/events/eventTypes';

export type BehaviorState =
  | 'silent'
  | 'attentive'
  | 'responding'
  | 'creating'
  | 'spectacle'
  | 'sleep';

export const BEHAVIOR_STATES = [
  'silent',
  'attentive',
  'responding',
  'creating',
  'spectacle',
  'sleep',
] as const satisfies readonly BehaviorState[];

export type MoodDimension =
  | 'calm'
  | 'curious'
  | 'playful'
  | 'focused'
  | 'mischievous'
  | 'thoughtful'
  | 'excited'
  | 'lowPower';

export type MoodVector = Record<MoodDimension, number>;

export type CostTier = 'free' | 'cheap' | 'expensive';
export type BudgetStatus = 'healthy' | 'warning' | 'critical' | 'exhausted';

export type AnimationPreset =
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'typewriter'
  | 'bounce'
  | 'shake'
  | 'pulse'
  | 'morph'
  | 'instant'
  | 'none';

export type ViewportHint =
  | 'chat'
  | 'card'
  | 'banner'
  | 'sidebar'
  | 'fullscreen'
  | 'toast'
  | 'none';

export interface PlannedEvent {
  eventType: PortalEventType;
  agentId: string;
  source: PortalEventSource;
  payload: Record<string, unknown>;
  delayMs: number;
  durationMs: number;
  blocking: boolean;
  animation: AnimationPreset;
  cssClass?: string;
  soundCue?: 'chime' | 'pop' | 'alert' | 'silence' | 'typing' | 'success' | 'error';
  viewportHint?: ViewportHint;
  expiresAt?: string;
  artifactId?: string;
  importance?: PortalEventImportance;
  visibility?: PortalEventVisibility;
}

export interface BehaviorPlan {
  id: string;
  createdAt: string;
  source: PortalEventSource;
  triggerSignalId: string;
  targetAgentId: string;
  state: BehaviorState;
  mood: MoodVector;
  priority: number;
  costTier: CostTier;
  budgetStatus: BudgetStatus;
  reason: string;
  events: PlannedEvent[];
  visibility: PortalEventVisibility;
  importance: PortalEventImportance;
  cancellable: boolean;
  expiresAt?: string;
}

export interface DirectorDecision {
  state: BehaviorState;
  reason: string;
  shouldCallProvider: boolean;
  costTier: CostTier;
  budgetStatus: BudgetStatus;
  plan?: BehaviorPlan;
  audit: {
    signalId: string;
    agentId: string;
    decidedAt: string;
    suppressedBy?: 'cooldown' | 'budget' | 'safety' | 'attention' | 'none';
  };
}

export function isBehaviorState(value: unknown): value is BehaviorState {
  return typeof value === 'string' && BEHAVIOR_STATES.includes(value as BehaviorState);
}

export function isBudgetStatus(value: unknown): value is BudgetStatus {
  return value === 'healthy' || value === 'warning' || value === 'critical' || value === 'exhausted';
}

export function isCostTier(value: unknown): value is CostTier {
  return value === 'free' || value === 'cheap' || value === 'expensive';
}
