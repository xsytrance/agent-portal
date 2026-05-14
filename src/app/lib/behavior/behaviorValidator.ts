import {
  type BehaviorPlan,
  type PlannedEvent,
  isBehaviorState,
  isBudgetStatus,
  isCostTier,
} from './behaviorTypes';

export interface BehaviorValidationResult<T> {
  valid: boolean;
  errors: string[];
  sanitized?: T;
}

const MAX_PLAN_EVENTS = 25;
const MAX_REASON_LENGTH = 2000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validatePlannedEvent(input: unknown, index: number): BehaviorValidationResult<PlannedEvent> {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: [`events[${index}] must be an object`] };
  }

  if (!isNonEmptyString(input.eventType)) errors.push(`events[${index}].eventType is required`);
  if (!isNonEmptyString(input.agentId)) errors.push(`events[${index}].agentId is required`);
  if (!isNonEmptyString(input.source)) errors.push(`events[${index}].source is required`);
  if (!isRecord(input.payload)) errors.push(`events[${index}].payload must be an object`);
  if (typeof input.delayMs !== 'number' || input.delayMs < 0) errors.push(`events[${index}].delayMs must be a non-negative number`);
  if (typeof input.durationMs !== 'number' || input.durationMs < 0) errors.push(`events[${index}].durationMs must be a non-negative number`);
  if (typeof input.blocking !== 'boolean') errors.push(`events[${index}].blocking must be a boolean`);
  if (!isNonEmptyString(input.animation)) errors.push(`events[${index}].animation is required`);
  if (input.expiresAt !== undefined && !isIsoDate(input.expiresAt)) errors.push(`events[${index}].expiresAt must be ISO 8601`);

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    sanitized: input as unknown as PlannedEvent,
  };
}

export function validateBehaviorPlan(input: unknown): BehaviorValidationResult<BehaviorPlan> {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ['BehaviorPlan must be an object'] };
  }

  if (!isNonEmptyString(input.id)) errors.push('id is required');
  if (!isIsoDate(input.createdAt)) errors.push('createdAt must be ISO 8601');
  if (!isNonEmptyString(input.source)) errors.push('source is required');
  if (!isNonEmptyString(input.triggerSignalId)) errors.push('triggerSignalId is required');
  if (!isNonEmptyString(input.targetAgentId)) errors.push('targetAgentId is required');
  if (!isBehaviorState(input.state)) errors.push('state is invalid');
  if (!isRecord(input.mood)) errors.push('mood must be an object');
  if (typeof input.priority !== 'number' || input.priority < 0 || input.priority > 100) errors.push('priority must be 0-100');
  if (!isCostTier(input.costTier)) errors.push('costTier is invalid');
  if (!isBudgetStatus(input.budgetStatus)) errors.push('budgetStatus is invalid');
  if (!isNonEmptyString(input.reason)) errors.push('reason is required');
  if (isNonEmptyString(input.reason) && input.reason.length > MAX_REASON_LENGTH) errors.push(`reason exceeds ${MAX_REASON_LENGTH} chars`);
  if (!Array.isArray(input.events)) errors.push('events must be an array');
  if (Array.isArray(input.events) && input.events.length > MAX_PLAN_EVENTS) errors.push(`events exceeds max ${MAX_PLAN_EVENTS}`);
  if (!isNonEmptyString(input.visibility)) errors.push('visibility is required');
  if (!isNonEmptyString(input.importance)) errors.push('importance is required');
  if (typeof input.cancellable !== 'boolean') errors.push('cancellable must be a boolean');
  if (input.expiresAt !== undefined && !isIsoDate(input.expiresAt)) errors.push('expiresAt must be ISO 8601');

  const eventResults = Array.isArray(input.events)
    ? input.events.map((event, index) => validatePlannedEvent(event, index))
    : [];
  for (const result of eventResults) errors.push(...result.errors);

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    sanitized: {
      ...(input as unknown as BehaviorPlan),
      events: eventResults.map((result) => result.sanitized as PlannedEvent),
    },
  };
}
