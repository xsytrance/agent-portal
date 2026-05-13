export const BEHAVIOR_PORTAL_EVENT_TYPES = [
  'behavior.signal_received',
  'behavior.plan_created',
  'behavior.plan_cancelled',
  'behavior.decision',
  'behavior.silence',
  'behavior.cooldown',
  'behavior.budget_blocked',
  'behavior.state_changed',
] as const;

export type BehaviorPortalEventType = typeof BEHAVIOR_PORTAL_EVENT_TYPES[number];

export type PortalEventType =
  | 'agent.message'
  | 'agent.thinking'
  | 'agent.typing'
  | 'agent.error'
  | 'agent.eye_emotion'
  | 'portal.repaint'
  | 'portal.spawn_card'
  | 'portal.create_page'
  | 'portal.report_ready'
  | 'portal.feed_item'
  | 'portal.deal_card'
  | 'portal.news_card'
  | 'portal.demo_action'
  | 'portal.theme_change'
  | 'portal.sound_cue'
  | 'system.log'
  | 'admin.config_changed'
  | BehaviorPortalEventType;

export type PortalEventSource = 'user' | 'agent' | 'system' | 'admin' | 'external';
export type PortalEventVisibility = 'public' | 'admin' | 'internal';
export type PortalEventImportance = 'low' | 'normal' | 'high' | 'critical';

export interface PortalEvent {
  id: string;
  type: PortalEventType;
  timestamp: string;
  source: PortalEventSource;
  agentId?: string;
  payload: Record<string, unknown>;
  visibility: PortalEventVisibility;
  importance: PortalEventImportance;
  artifactId?: string;
  expiresAt?: string;
}

export interface PortalEventEnvelope {
  event: PortalEvent;
  sequence: number;
}
