import type { PortalEventSource } from '@/app/lib/events/eventTypes';

export const INPUT_SIGNAL_TYPES = [
  'user.message',
  'user.idle.start',
  'user.idle.continue',
  'user.idle.end',
  'user.hover',
  'user.scroll',
  'user.focus',
  'user.blur',
  'agent.selected',
  'admin.config_changed',
  'system.tick',
  'external.event',
] as const;

export type InputSignalType = typeof INPUT_SIGNAL_TYPES[number];

export interface InputSignal {
  id: string;
  type: InputSignalType;
  timestamp: string;
  source: PortalEventSource;
  sessionId: string;
  agentId?: string;
  payload: Record<string, unknown>;
}

export function isInputSignalType(value: unknown): value is InputSignalType {
  return typeof value === 'string' && INPUT_SIGNAL_TYPES.includes(value as InputSignalType);
}
