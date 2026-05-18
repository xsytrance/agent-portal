export type InputSignal =
  | UserSignal
  | BackendSignal
  | ExternalSignal
  | AutonomousSignal;

export interface InputSignalBase {
  id: string;
  kind: InputSignal['kind'];
  timestamp: string;
  targetAgentId: string;
}

export interface UserSignal extends InputSignalBase {
  kind:
    | 'user.message'
    | 'user.command'
    | 'user.hover'
    | 'user.scroll'
    | 'user.click'
    | 'user.idle'
    | 'user.switch_agent'
    | 'user.feedback'
    | 'user.dismiss'
    | 'user.expand_card';
  userId: string;
  currentAgentId: string;
  payload: UserSignalPayload;
}

export type UserSignalPayload =
  | UserMessagePayload
  | UserCommandPayload
  | UserHoverPayload
  | UserScrollPayload
  | UserClickPayload
  | UserIdlePayload
  | UserSwitchAgentPayload
  | UserFeedbackPayload
  | UserDismissPayload
  | UserExpandCardPayload;

export interface UserMessagePayload {
  subKind: 'user.message';
  text: string;
  messageId: string;
  mentionedAgentId?: string;
  attachments?: AttachmentRef[];
}

export interface UserCommandPayload {
  subKind: 'user.command';
  command: string;
  args: Record<string, string | number | boolean>;
}

export interface UserHoverPayload {
  subKind: 'user.hover';
  elementId: string;
  elementType: 'card' | 'button' | 'agent-avatar' | 'deal-badge' | 'chart' | 'other';
  hoverDurationMs: number;
  position: { x: number; y: number };
}

export interface UserScrollPayload {
  subKind: 'user.scroll';
  scrollPercent: number;
  direction: 'up' | 'down';
  region: 'chat-panel' | 'card-deck' | 'main-viewport' | 'sidebar';
  velocityPxPerSec: number;
}

export interface UserClickPayload {
  subKind: 'user.click';
  elementId: string;
  elementType: 'card' | 'button' | 'agent-avatar' | 'deal-badge' | 'send-button' | 'close-button' | 'theme-toggle' | 'expand' | 'other';
}

export interface UserIdlePayload {
  subKind: 'user.idle';
  idleDurationMs: number;
  lastActivity: 'chat' | 'scroll' | 'hover' | 'click' | 'none';
  phase: 'start' | 'continuing' | 'end';
}

export interface UserSwitchAgentPayload {
  subKind: 'user.switch_agent';
  fromAgentId: string;
  toAgentId: string;
}

export interface UserFeedbackPayload {
  subKind: 'user.feedback';
  feedbackType: 'thumbs-up' | 'thumbs-down' | 'text';
  targetMessageId?: string;
  targetCardId?: string;
  comments?: string;
}

export interface UserDismissPayload {
  subKind: 'user.dismiss';
  dismissedType: 'card' | 'toast' | 'banner' | 'suggestion';
  dismissedId: string;
}

export interface UserExpandCardPayload {
  subKind: 'user.expand_card';
  cardId: string;
  cardType: 'deal' | 'news' | 'report' | 'demo' | 'custom';
}

export interface AttachmentRef {
  attachmentId: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  url: string;
}

// ---------------------------------------------------------------------------
// BackendSignals
// ---------------------------------------------------------------------------

export interface BackendSignal extends InputSignalBase {
  kind:
    | 'backend.llm_complete'
    | 'backend.llm_error'
    | 'backend.card_ready'
    | 'backend.report_generated'
    | 'backend.config_change'
    | 'backend.agent_state_change'
    | 'backend.token_budget_alert'
    | 'backend.system_alert';
  subsystem: 'llm' | 'card-engine' | 'report-engine' | 'config' | 'agent-manager' | 'token-budget' | 'monitoring';
  payload: BackendSignalPayload;
}

export type BackendSignalPayload =
  | LLMCompletePayload
  | LLMErrorPayload
  | CardReadyPayload
  | ReportGeneratedPayload
  | ConfigChangePayload
  | AgentStateChangePayload
  | TokenBudgetAlertPayload
  | SystemAlertPayload;

export interface LLMCompletePayload {
  subKind: 'backend.llm_complete';
  responseText: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  model: string;
  latencyMs: number;
}

export interface LLMErrorPayload {
  subKind: 'backend.llm_error';
  errorCode: 'rate-limit' | 'timeout' | 'context-length' | 'provider-down' | 'auth-failure' | 'unknown';
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}

export interface CardReadyPayload {
  subKind: 'backend.card_ready';
  cardId: string;
  cardType: 'deal' | 'news' | 'report' | 'demo' | 'custom';
  cardData: Record<string, unknown>;
}

export interface ReportGeneratedPayload {
  subKind: 'backend.report_generated';
  reportId: string;
  reportType: string;
  summary: string;
}

export interface ConfigChangePayload {
  subKind: 'backend.config_change';
  changedKeys: string[];
}

export interface AgentStateChangePayload {
  subKind: 'backend.agent_state_change';
  agentId: string;
  newState: AgentState;
  oldState: AgentState;
  reason: string;
}

export type AgentState = 'idle' | 'thinking' | 'typing' | 'speaking' | 'observing' | 'error' | 'offline' | 'loading' | 'cooldown';

export interface TokenBudgetAlertPayload {
  subKind: 'backend.token_budget_alert';
  budgetWindow: 'minute' | 'hour' | 'day' | 'month';
  consumedPercent: number;
  severity: 'info' | 'warning' | 'critical';
  remainingTokens: number;
}

export interface SystemAlertPayload {
  subKind: 'backend.system_alert';
  alertLevel: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
}

// ---------------------------------------------------------------------------
// ExternalSignals
// ---------------------------------------------------------------------------

export interface ExternalSignal extends InputSignalBase {
  kind:
    | 'external.webhook'
    | 'external.api_call'
    | 'external.stream_event'
    | 'external.scheduled_job';
  integrationId: string;
  authLevel: 'anonymous' | 'api-key' | 'oauth' | 'internal';
  payload: ExternalSignalPayload;
}

export type ExternalSignalPayload =
  | WebhookPayload
  | ApiCallPayload
  | StreamEventPayload
  | ScheduledJobPayload;

export interface WebhookPayload {
  subKind: 'external.webhook';
  webhookId: string;
  eventName: string;
  body: Record<string, unknown>;
}

export interface ApiCallPayload {
  subKind: 'external.api_call';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params: Record<string, unknown>;
}

export interface StreamEventPayload {
  subKind: 'external.stream_event';
  streamId: string;
  eventType: string;
  data: Record<string, unknown>;
}

export interface ScheduledJobPayload {
  subKind: 'external.scheduled_job';
  jobId: string;
  scheduledTime: string;
}

// ---------------------------------------------------------------------------
// AutonomousSignals
// ---------------------------------------------------------------------------

export interface AutonomousSignal extends InputSignalBase {
  kind:
    | 'autonomous.timer'
    | 'autonomous.mood'
    | 'autonomous.curiosity'
    | 'autonomous.memory'
    | 'autonomous.social';
  agentId: string;
  payload: AutonomousSignalPayload;
}

export type AutonomousSignalPayload =
  | TimerTickPayload
  | MoodShiftPayload
  | CuriosityPayload
  | MemoryTriggerPayload
  | SocialCuePayload;

export interface TimerTickPayload {
  subKind: 'autonomous.timer_tick';
  timerId: string;
  tickCount: number;
  intervalMs: number;
}

export interface MoodShiftPayload {
  subKind: 'autonomous.mood_shift';
  oldMood: string;
  newMood: string;
  cause: string;
}

export interface CuriosityPayload {
  subKind: 'autonomous.curiosity';
  topic: string;
  intensity: number;
  suggestion?: string;
}

export interface MemoryTriggerPayload {
  subKind: 'autonomous.memory_trigger';
  memoryId: string;
  relevanceScore: number;
  memoryDigest: string;
}

export interface SocialCuePayload {
  subKind: 'autonomous.social cue';
  cueType: 'user-frustrated' | 'user-engaged' | 'user-confused' | 'user-happy' | 'conversation-lull' | 'topic-shift' | 'user-rushed';
  confidence: number;
  evidence: string;
}
