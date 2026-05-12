import { PortalEvent, PortalEventType, PortalEventSource, PortalEventVisibility, PortalEventImportance } from './eventTypes';

const VALID_TYPES: PortalEventType[] = [
  'agent.message', 'agent.thinking', 'agent.typing', 'agent.error', 'agent.eye_emotion',
  'portal.repaint', 'portal.spawn_card', 'portal.create_page', 'portal.report_ready',
  'portal.feed_item', 'portal.deal_card', 'portal.news_card', 'portal.demo_action',
  'portal.theme_change', 'portal.sound_cue', 'system.log', 'admin.config_changed',
];
const VALID_SOURCES: PortalEventSource[] = ['user', 'agent', 'system', 'admin', 'external'];
const VALID_VIS: PortalEventVisibility[] = ['public', 'admin', 'internal'];
const VALID_IMPORTANCE: PortalEventImportance[] = ['low', 'normal', 'high', 'critical'];
const MAX_PAYLOAD_SIZE = 65536;
const MAX_STRING_LENGTH = 4096;
const MAX_PAYLOAD_KEYS = 50;

interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: PortalEvent;
}

function isValidISODate(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  const d = new Date(str);
  return !isNaN(d.getTime());
}

function isString(val: unknown): val is string { return typeof val === 'string'; }

function checkStringLength(val: unknown, field: string, errors: string[]): void {
  if (isString(val) && val.length > MAX_STRING_LENGTH) errors.push(`${field} exceeds max length of ${MAX_STRING_LENGTH}`);
}

export function validateEvent(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, errors: ['Event must be an object'] };
  }

  const raw = input as Record<string, unknown>;

  if (!isString(raw.id)) errors.push('id is required and must be a string');
  if (!isString(raw.type)) errors.push('type is required and must be a string');
  if (!isString(raw.timestamp)) errors.push('timestamp is required and must be a string');
  if (!isString(raw.source)) errors.push('source is required and must be a string');

  if (isString(raw.type) && !VALID_TYPES.includes(raw.type as PortalEventType)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (isString(raw.source) && !VALID_SOURCES.includes(raw.source as PortalEventSource)) {
    errors.push(`source must be one of: ${VALID_SOURCES.join(', ')}`);
  }

  const visibility = (isString(raw.visibility) ? raw.visibility : 'public') as PortalEventVisibility;
  if (!VALID_VIS.includes(visibility)) errors.push(`visibility must be one of: ${VALID_VIS.join(', ')}`);

  const importance = (isString(raw.importance) ? raw.importance : 'normal') as PortalEventImportance;
  if (!VALID_IMPORTANCE.includes(importance)) errors.push(`importance must be one of: ${VALID_IMPORTANCE.join(', ')}`);

  if (isString(raw.timestamp) && !isValidISODate(raw.timestamp)) errors.push('timestamp must be a valid ISO 8601 string');

  if (raw.payload !== undefined) {
    if (typeof raw.payload !== 'object' || raw.payload === null || Array.isArray(raw.payload)) {
      errors.push('payload must be an object');
    } else {
      const payload = raw.payload as Record<string, unknown>;
      if (Object.keys(payload).length > MAX_PAYLOAD_KEYS) errors.push(`payload exceeds max ${MAX_PAYLOAD_KEYS} keys`);
      try {
        if (JSON.stringify(payload).length > MAX_PAYLOAD_SIZE) errors.push(`payload exceeds max size of ${MAX_PAYLOAD_SIZE} bytes`);
      } catch { errors.push('payload is not serializable'); }
    }
  }

  checkStringLength(raw.id, 'id', errors);
  checkStringLength(raw.type, 'type', errors);
  checkStringLength(raw.agentId, 'agentId', errors);

  if (errors.length > 0) return { valid: false, errors };

  const sanitized: PortalEvent = {
    id: String(raw.id).trim(),
    type: raw.type as PortalEventType,
    timestamp: isString(raw.timestamp) ? raw.timestamp : new Date().toISOString(),
    source: raw.source as PortalEventSource,
    agentId: isString(raw.agentId) ? raw.agentId.trim() : undefined,
    payload: (raw.payload && typeof raw.payload === 'object' && !Array.isArray(raw.payload)) ? raw.payload as Record<string, unknown> : {},
    visibility,
    importance,
    artifactId: isString(raw.artifactId) ? raw.artifactId.trim() : undefined,
    expiresAt: isString(raw.expiresAt) ? raw.expiresAt : undefined,
  };

  return { valid: true, errors: [], sanitized };
}
