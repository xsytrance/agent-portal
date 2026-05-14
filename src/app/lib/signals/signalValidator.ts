import { isInputSignalType, type InputSignal } from './signalTypes';

export interface SignalValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: InputSignal;
}

const VALID_SOURCES = ['user', 'agent', 'system', 'admin', 'external'] as const;
const MAX_PAYLOAD_SIZE = 32768;
const MAX_PAYLOAD_KEYS = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

export function validateInputSignal(input: unknown): SignalValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['InputSignal must be an object'] };
  }

  if (!isNonEmptyString(input.id)) errors.push('id is required');
  if (!isInputSignalType(input.type)) errors.push('type is invalid');
  if (!isIsoDate(input.timestamp)) errors.push('timestamp must be ISO 8601');
  if (!isNonEmptyString(input.source) || !VALID_SOURCES.includes(input.source as typeof VALID_SOURCES[number])) {
    errors.push(`source must be one of: ${VALID_SOURCES.join(', ')}`);
  }
  if (!isNonEmptyString(input.sessionId)) errors.push('sessionId is required');
  if (input.agentId !== undefined && !isNonEmptyString(input.agentId)) errors.push('agentId must be a non-empty string');

  const payload = input.payload ?? {};
  if (!isRecord(payload)) {
    errors.push('payload must be an object');
  } else {
    if (Object.keys(payload).length > MAX_PAYLOAD_KEYS) errors.push(`payload exceeds max ${MAX_PAYLOAD_KEYS} keys`);
    try {
      if (JSON.stringify(payload).length > MAX_PAYLOAD_SIZE) errors.push(`payload exceeds max size of ${MAX_PAYLOAD_SIZE} bytes`);
    } catch {
      errors.push('payload is not serializable');
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    sanitized: {
      id: String(input.id).trim(),
      type: input.type as InputSignal['type'],
      timestamp: String(input.timestamp),
      source: input.source as InputSignal['source'],
      sessionId: String(input.sessionId).trim(),
      agentId: isNonEmptyString(input.agentId) ? input.agentId.trim() : undefined,
      payload: payload as Record<string, unknown>,
    },
  };
}
