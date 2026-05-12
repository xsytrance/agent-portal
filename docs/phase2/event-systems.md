# Phase 2: Event System Contracts & BehaviorPlan Architecture

> **Document:** Event System Contracts & BehaviorPlan Data Model
> **Phase:** Phase 2 — Behavior Director Integration
> **Status:** Architecture / Design Document — No Implementation

---

## 1. Executive Summary

This document defines the contract layer between the **Behavior Director** (decides what the agent does) and the **Event Execution Engine** (makes it happen). The BehaviorPlan is the core data structure: a typed, immutable plan that describes *what events should fire, in what order, with what timing, and what to do if they fail*.

The system introduces:

- **BehaviorPlan**: A declarative, serializable execution plan emitted by the Behavior Director.
- **PlannedEvent**: An enriched event descriptor that carries display metadata (animation, timing, CSS class hints, sound cues).
- **Priority Queue**: A behavior-aware queue that merges, cancels, and expires plans.
- **InputSignal**: A typed union of everything that can trigger the Behavior Director.
- **Six new event types** in the `behavior.*` namespace for introspection and control.
- **Bidirectional signal flow**: Frontend captures user activity signals; backend emits behavior events; both sides speak the same typed language.

---

## 2. Core Data Models

### 2.1 PlannedEvent

A `PlannedEvent` is a self-contained instruction for a single event emission. It extends the concept of a `PortalEvent` by adding **presentation-layer metadata** so the frontend "theater" knows *how* to render it, not just *what* happened.

```typescript
// ---------------------------------------------------------------------------
// PlannedEvent — A single event instruction inside a BehaviorPlan
// ---------------------------------------------------------------------------

interface PlannedEvent {
  // --- Identity & Routing ---
  /** The event type being emitted. Must be a registered PortalEventType. */
  eventType: PortalEventType | BehaviorEventType;

  /** Which agent emits this event. Overrides plan.targetAgentId if set. */
  agentId: string;

  /** The source of this specific event (may differ from plan source). */
  source: 'user' | 'agent' | 'system' | 'admin' | 'external';

  // --- Payload ---
  /** Structured payload. Shape is validated against eventType schema at emit time. */
  payload: Record<string, unknown>;

  // --- Timing & Sequencing ---
  /** Milliseconds to wait BEFORE emitting this event (relative to plan start). */
  delayMs: number;

  /** Milliseconds to hold this event on screen before auto-dismiss. 0 = permanent. */
  durationMs: number;

  /** If true, the next event in the plan waits for this one's `durationMs` to elapse. */
  blocking: boolean;

  // --- Display Instructions (Frontend Theater Hints) ---
  /** Animation preset to use when this event appears. */
  animation: AnimationPreset;

  /** CSS class hint(s) for custom frontend styling. */
  cssClass?: string;

  /** Sound cue to play when this event fires. */
  soundCue?: 'chime' | 'pop' | 'alert' | 'silence' | 'typing' | 'success' | 'error';

  /** Where on screen this event should manifest. */
  viewportHint?: 'chat' | 'card' | 'banner' | 'sidebar' | 'fullscreen' | 'toast' | 'none';

  // --- Lifecycle ---
  /** If set, this event auto-expires and is removed from the event store. */
  expiresAt?: string; // ISO 8601

  /** If this event references an artifact (card, page, deal, etc.). */
  artifactId?: string;

  /** Importance for UI highlighting. Inherits from BehaviorPlan if omitted. */
  importance?: 'low' | 'normal' | 'high' | 'critical';

  /** Visibility scope. Inherits from BehaviorPlan if omitted. */
  visibility?: 'public' | 'admin' | 'internal';
}

// ---------------------------------------------------------------------------
// Animation Presets — Predefined motion behaviors the frontend understands
// ---------------------------------------------------------------------------

type AnimationPreset =
  | 'fade-in'          // Simple opacity 0 → 1
  | 'slide-up'         // Translate Y + opacity
  | 'slide-down'       // Translate Y − opacity
  | 'slide-left'       // Translate X + opacity
  | 'slide-right'      // Translate X − opacity
  | 'scale-in'         // Scale 0.9 → 1.0 + opacity
  | 'typewriter'       // Character-by-character reveal
  | 'bounce'           // Spring-like overshoot
  | 'shake'            // Horizontal shake for errors/urgency
  | 'pulse'            // Subtle scale oscillation (attention)
  | 'morph'            // Shape-to-shape transition (cards changing state)
  | 'instant'          // No animation, appear immediately
  | 'none';            // Invisible event (metadata-only, no visual)
```

### 2.2 BehaviorPlan

A `BehaviorPlan` is the Behavior Director's output: a complete, ordered, typed description of everything the agent should do in response to a signal.

```typescript
// ---------------------------------------------------------------------------
// BehaviorPlan — The Behavior Director's complete output
// ---------------------------------------------------------------------------

interface BehaviorPlan {
  // --- Identity ---
  /** Unique plan identifier (UUID v4). */
  id: string;

  /** Human-readable reason this plan was created (for debugging & audit logs). */
  reason: string;

  // --- Priority & Scheduling ---
  /** Priority 1–100. 100 = user message (highest). 1 = ambient/background tick. */
  priority: number;

  /** Milliseconds to delay before the first event executes. 0 = immediate. */
  delayMs: number;

  /** Maximum lifetime of this plan. If not started by this time, auto-cancel. */
  deadlineMs: number;

  // --- Resource Requirements ---
  /** Does executing this plan require an LLM call? */
  requiresLLM: boolean;

  /** Estimated token cost tier for budget gating. */
  tokenCostEstimate: 'free' | 'cheap' | 'expensive';

  /** Cooldown bucket this plan consumes. Plans in the same bucket are rate-limited. */
  cooldownKey: CooldownKey;

  // --- Source & Target ---
  /** The signal that triggered this plan (for traceability). */
  sourceSignal: InputSignalSummary;

  /** Which agent is responsible for executing this plan. */
  targetAgentId: string;

  // --- Plan State (set by queue, not by Behavior Director) ---
  /** Current lifecycle state of this plan. */
  status: PlanStatus;

  // --- Event Sequence ---
  /** Ordered list of events to emit. Executed in index order. */
  events: PlannedEvent[];

  /** Events to emit if any primary event fails (error recovery theater). */
  fallback: PlannedEvent[];
}

// ---------------------------------------------------------------------------
// Supporting Types
// ---------------------------------------------------------------------------

type CooldownKey =
  | 'user-message'      // Responding to a user message
  | 'proactive-chat'    // Agent-initiated chat
  | 'card-spawn'        // Spawning a new card
  | 'theme-change'      // Changing the portal theme
  | 'eye-emotion'       // Eye animation updates
  | 'sound-cue'         // Playing sound effects
  | 'ambient-tick'      // Background ambient behavior
  | 'system-report'     // System status reports
  | 'token-budget';     // Budget-related announcements

type PlanStatus =
  | 'pending'           // In queue, waiting for execution slot
  | 'delayed'           // Waiting for delayMs to elapse
  | 'executing'         // Currently emitting events
  | 'completed'         // All events emitted successfully
  | 'cancelled'         // Cancelled by newer plan or timeout
  | 'failed'            // Primary failed, fallback executed
  | 'expired';          // Deadline passed before execution

/** A lightweight summary of the signal that triggered the plan (stored for tracing). */
interface InputSignalSummary {
  signalType: InputSignal['kind'];
  signalId: string;
  receivedAt: string;   // ISO 8601
  digest: string;       // One-line summary for logs (e.g., "user said 'hello'")
}
```

### 2.3 Plan Priority Bands

Priority values are grouped into semantic bands. The queue uses these for fast categorization:

| Band | Range | Description | Examples |
|------|-------|-------------|----------|
| **Critical** | 91–100 | Direct user interaction | User message, explicit command, interrupt |
| **High** | 71–90 | Important system/user events | Agent switch, error recovery, report ready |
| **Normal** | 41–70 | Standard agent behavior | Proactive chat, card spawn, news card |
| **Low** | 11–40 | Decorative / ambient | Eye emotion update, theme hint, sound cue |
| **Background** | 1–10 | Background ticks | Heartbeat, token budget check, cleanup |

```typescript
const PRIORITY_BANDS = {
  CRITICAL:   { min: 91, max: 100, label: 'critical'   },
  HIGH:       { min: 71, max: 90,  label: 'high'       },
  NORMAL:     { min: 41, max: 70,  label: 'normal'     },
  LOW:        { min: 11, max: 40,  label: 'low'        },
  BACKGROUND: { min: 1,  max: 10,  label: 'background' },
} as const;

/** Helper: derive a band label from a numeric priority. */
function priorityBand(priority: number): keyof typeof PRIORITY_BANDS {
  for (const [key, band] of Object.entries(PRIORITY_BANDS)) {
    if (priority >= band.min && priority <= band.max) return key as keyof typeof PRIORITY_BANDS;
  }
  return 'BACKGROUND';
}
```

---

## 3. InputSignal Type Definitions

The Behavior Director receives typed `InputSignal`s from four sources. Each variant carries enough context for the Director to make a decision without additional lookups.

```typescript
// ---------------------------------------------------------------------------
// InputSignal — Union of all signals that can trigger the Behavior Director
// ---------------------------------------------------------------------------

type InputSignal =
  | UserSignal
  | BackendSignal
  | ExternalSignal
  | AutonomousSignal;

/** Discriminated union tag present on all signal variants. */
type InputSignalBase = {
  /** Unique signal identifier (UUID v4). */
  id: string;

  /** Signal classification — discriminant for type narrowing. */
  kind: InputSignal['kind'];

  /** ISO 8601 timestamp of when the signal was emitted. */
  timestamp: string;

  /** Which agent this signal is addressed to (or 'any' for broadcast). */
  targetAgentId: string;
};

// ===========================================================================
// 3.1 UserSignal — Signals originating from user interaction
// ===========================================================================

interface UserSignal extends InputSignalBase {
  kind: 'user.message' | 'user.command' | 'user.hover' | 'user.scroll'
       | 'user.click' | 'user.idle' | 'user.switch_agent' | 'user.feedback'
       | 'user.dismiss' | 'user.expand_card';

  /** The user ID (anonymized session ID for guests). */
  userId: string;

  /** The agent currently active in the user's viewport. */
  currentAgentId: string;

  /** Signal-specific payload. */
  payload: UserSignalPayload;
}

type UserSignalPayload =
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

interface UserMessagePayload {
  subKind: 'user.message';
  text: string;
  /** Message ID for threading/ack. */
  messageId: string;
  /** If the message @-mentions a specific agent. */
  mentionedAgentId?: string;
  /** Attachments (images, files) included with the message. */
  attachments?: AttachmentRef[];
}

interface UserCommandPayload {
  subKind: 'user.command';
  /** The slash-command or action invoked. */
  command: string;
  /** Parsed arguments from the command. */
  args: Record<string, string | number | boolean>;
}

interface UserHoverPayload {
  subKind: 'user.hover';
  /** DOM element identifier the user is hovering over. */
  elementId: string;
  /** Semantic type of the hovered element. */
  elementType: 'card' | 'button' | 'agent-avatar' | 'deal-badge' | 'chart' | 'other';
  /** Duration of hover in ms at time of signal emission. */
  hoverDurationMs: number;
  /** Mouse position relative to viewport. */
  position: { x: number; y: number };
}

interface UserScrollPayload {
  subKind: 'user.scroll';
  /** Scroll depth as percentage (0–100). */
  scrollPercent: number;
  /** Direction of scroll. */
  direction: 'up' | 'down';
  /** Which scrollable region. */
  region: 'chat-panel' | 'card-deck' | 'main-viewport' | 'sidebar';
  /** Velocity in pixels per second (for momentum detection). */
  velocityPxPerSec: number;
}

interface UserClickPayload {
  subKind: 'user.click';
  /** DOM element identifier that was clicked. */
  elementId: string;
  /** Semantic type of the clicked element. */
  elementType: 'card' | 'button' | 'agent-avatar' | 'deal-badge' | 'send-button'
              | 'close-button' | 'theme-toggle' | 'expand' | 'other';
}

interface UserIdlePayload {
  subKind: 'user.idle';
  /** How long the user has been idle (ms). */
  idleDurationMs: number;
  /** What the user was last doing before going idle. */
  lastActivity: 'chat' | 'scroll' | 'hover' | 'click' | 'none';
  /** Whether this is the start of idle (first detection) or a continuing tick. */
  phase: 'start' | 'continuing' | 'end';
}

interface UserSwitchAgentPayload {
  subKind: 'user.switch_agent';
  /** The agent the user is switching FROM. */
  fromAgentId: string;
  /** The agent the user is switching TO. */
  toAgentId: string;
  /** How the switch was triggered. */
  trigger: 'user-click' | 'auto-route' | 'command';
}

interface UserFeedbackPayload {
  subKind: 'user.feedback';
  /** Thumbs up, thumbs down, or text. */
  sentiment: 'positive' | 'negative' | 'neutral';
  /** Optional free-text feedback. */
  comment?: string;
  /** Which agent/event the feedback is about. */
  targetEventId?: string;
}

interface UserDismissPayload {
  subKind: 'user.dismiss';
  /** What was dismissed. */
  dismissedType: 'card' | 'toast' | 'banner' | 'suggestion';
  /** ID of the dismissed item. */
  dismissedId: string;
}

interface UserExpandCardPayload {
  subKind: 'user.expand_card';
  cardId: string;
  cardType: 'deal' | 'news' | 'report' | 'demo' | 'custom';
}

interface AttachmentRef {
  attachmentId: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  url: string;
}

// ===========================================================================
// 3.2 BackendSignal — Signals from internal systems
// ===========================================================================

interface BackendSignal extends InputSignalBase {
  kind: 'backend.llm_complete' | 'backend.llm_error' | 'backend.card_ready'
       | 'backend.report_generated' | 'backend.config_change' | 'backend.agent_state_change'
       | 'backend.token_budget_alert' | 'backend.system_alert';

  /** Which subsystem emitted this signal. */
  subsystem: 'llm' | 'card-engine' | 'report-engine' | 'config' | 'agent-manager'
            | 'token-budget' | 'monitoring';

  payload: BackendSignalPayload;
}

type BackendSignalPayload =
  | LLMCompletePayload
  | LLMErrorPayload
  | CardReadyPayload
  | ReportGeneratedPayload
  | ConfigChangePayload
  | AgentStateChangePayload
  | TokenBudgetAlertPayload
  | SystemAlertPayload;

interface LLMCompletePayload {
  subKind: 'backend.llm_complete';
  /** The LLM response text. */
  responseText: string;
  /** Token usage summary. */
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  /** Which model was used. */
  model: string;
  /** Duration of the LLM call in ms. */
  latencyMs: number;
}

interface LLMErrorPayload {
  subKind: 'backend.llm_error';
  /** Error code category. */
  errorCode: 'rate-limit' | 'timeout' | 'context-length' | 'provider-down'
           | 'auth-failure' | 'unknown';
  /** Human-readable error message. */
  message: string;
  /** Whether the error is retryable. */
  retryable: boolean;
  /** Suggested retry delay in ms (if retryable). */
  retryAfterMs?: number;
}

interface CardReadyPayload {
  subKind: 'backend.card_ready';
  cardId: string;
  cardType: 'deal' | 'news' | 'report' | 'demo' | 'custom';
  /** Render-ready card data. */
  cardData: Record<string, unknown>;
}

interface ReportGeneratedPayload {
  subKind: 'backend.report_generated';
  reportId: string;
  reportType: string;
  /** URL or inline data for the report. */
  contentRef: string;
}

interface ConfigChangePayload {
  subKind: 'backend.config_change';
  /** Dot-path of the changed config key. */
  keyPath: string;
  /** The new value. */
  newValue: unknown;
  /** The previous value (for rollback). */
  oldValue?: unknown;
  /** Who made the change. */
  changedBy: 'admin' | 'system' | 'agent';
}

interface AgentStateChangePayload {
  subKind: 'backend.agent_state_change';
  agentId: string;
  /** The new state. */
  newState: AgentState;
  /** The previous state. */
  oldState: AgentState;
  /** Reason for the state change. */
  reason: string;
}

type AgentState = 'idle' | 'thinking' | 'typing' | 'speaking' | 'observing'
                | 'error' | 'offline' | 'loading' | 'cooldown';

interface TokenBudgetAlertPayload {
  subKind: 'backend.token_budget_alert';
  /** Which budget window this alert is for. */
  budgetWindow: 'minute' | 'hour' | 'day' | 'month';
  /** Percentage of budget consumed (0–100, can exceed 100). */
  consumedPercent: number;
  /** Severity of the alert. */
  severity: 'info' | 'warning' | 'critical';
  /** Remaining budget in tokens. */
  remainingTokens: number;
}

interface SystemAlertPayload {
  subKind: 'backend.system_alert';
  alertLevel: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  /** Related component. */
  component: string;
}

// ===========================================================================
// 3.3 ExternalSignal — Signals from outside integrations
// ===========================================================================

interface ExternalSignal extends InputSignalBase {
  kind: 'external.webhook' | 'external.api_call' | 'external.stream_event'
       | 'external.scheduled_job';

  /** Which external integration emitted this. */
  integrationId: string;

  /** Authentication level of the external caller. */
  authLevel: 'anonymous' | 'api-key' | 'oauth' | 'internal';

  payload: ExternalSignalPayload;
}

type ExternalSignalPayload =
  | WebhookPayload
  | ApiCallPayload
  | StreamEventPayload
  | ScheduledJobPayload;

interface WebhookPayload {
  subKind: 'external.webhook';
  webhookId: string;
  eventName: string;
  /** Raw webhook body (validated against schema before reaching Director). */
  body: Record<string, unknown>;
}

interface ApiCallPayload {
  subKind: 'external.api_call';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params: Record<string, unknown>;
}

interface StreamEventPayload {
  subKind: 'external.stream_event';
  streamId: string;
  eventType: string;
  data: Record<string, unknown>;
}

interface ScheduledJobPayload {
  subKind: 'external.scheduled_job';
  jobId: string;
  jobName: string;
  /** When this job was scheduled to run. */
  scheduledAt: string;
  /** Result of the job (if completed). */
  result?: Record<string, unknown>;
}

// ===========================================================================
// 3.4 AutonomousSignal — Self-generated signals from the agent itself
// ===========================================================================

interface AutonomousSignal extends InputSignalBase {
  kind: 'autonomous.timer_tick' | 'autonomous.mood_shift' | 'autonomous.curiosity'
       | 'autonomous.memory_trigger' | 'autonomous.social cue';

  /** Which agent generated this signal (always matches targetAgentId). */
  agentId: string;

  payload: AutonomousSignalPayload;
}

type AutonomousSignalPayload =
  | TimerTickPayload
  | MoodShiftPayload
  | CuriosityPayload
  | MemoryTriggerPayload
  | SocialCuePayload;

interface TimerTickPayload {
  subKind: 'autonomous.timer_tick';
  /** Which timer fired. */
  timerId: string;
  /** How many times this timer has fired. */
  tickCount: number;
  /** Interval duration in ms. */
  intervalMs: number;
}

interface MoodShiftPayload {
  subKind: 'autonomous.mood_shift';
  /** Previous mood. */
  oldMood: MoodState;
  /** New mood. */
  newMood: MoodState;
  /** What caused the mood shift. */
  cause: string;
}

type MoodState =
  | 'cheerful' | 'focused' | 'curious' | 'calm' | 'excited'
  | 'concerned' | 'tired' | 'playful' | 'professional' | 'neutral';

interface CuriosityPayload {
  subKind: 'autonomous.curiosity';
  /** What the agent is curious about. */
  topic: string;
  /** How strongly the agent feels this curiosity (0–1). */
  intensity: number;
  /** Suggested question or action to satisfy curiosity. */
  suggestion?: string;
}

interface MemoryTriggerPayload {
  subKind: 'autonomous.memory_trigger';
  /** Which memory was triggered. */
  memoryId: string;
  /** Memory relevance score (0–1). */
  relevanceScore: number;
  /** Summarized memory content. */
  memoryDigest: string;
}

interface SocialCuePayload {
  subKind: 'autonomous.social cue';
  /** Type of social cue detected. */
  cueType: 'user-frustrated' | 'user-engaged' | 'user-confused' | 'user-happy'
         | 'conversation-lull' | 'topic-shift' | 'user-rushed';
  /** Confidence in this detection (0–1). */
  confidence: number;
  /** Supporting evidence. */
  evidence: string;
}
```

---

## 4. Event Queue Design

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BEHAVIOR QUEUE                               │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  INCOMING    │───▶│   MERGE &    │───▶│   PRIORITY QUEUE     │  │
│  │  PLANS       │    │   CANCEL     │    │   (Min-Heap by       │  │
│  │              │    │              │    │    priority desc)    │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│                                                   │                 │
│                                                   ▼                 │
│                                          ┌──────────────────────┐  │
│                                          │   EXECUTION SLOT     │  │
│                                          │   (1 plan at a time) │  │
│                                          └──────────────────────┘  │
│                                                   │                 │
│                                                   ▼                 │
│                                          ┌──────────────────────┐  │
│                                          │   EVENT EMITTER      │  │
│                                          │   (Plan → Events)    │  │
│                                          └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Queue Semantics

The queue is a **priority-driven execution pipeline** with these properties:

#### 4.2.1 Priority Ordering

Plans are ordered by `priority` descending (highest first). Within the same priority, `delayMs` is respected (plans with shorter delays execute first). Tie-breaker: `timestamp` (FIFO).

```typescript
interface QueueEntry {
  plan: BehaviorPlan;
  /** When this entry was enqueued. */
  enqueuedAt: number; // epoch ms
  /** The effective execution time (enqueuedAt + plan.delayMs). */
  executeAfter: number; // epoch ms
  /** Absolute deadline (enqueuedAt + plan.deadlineMs). */
  hardDeadline: number; // epoch ms
}

/** Queue ordering function for the priority heap. */
function queueComparator(a: QueueEntry, b: QueueEntry): number {
  // 1. Higher priority first
  if (a.plan.priority !== b.plan.priority) {
    return b.plan.priority - a.plan.priority;
  }
  // 2. Earlier execution time first
  if (a.executeAfter !== b.executeAfter) {
    return a.executeAfter - b.executeAfter;
  }
  // 3. FIFO tie-breaker
  return a.enqueuedAt - b.enqueuedAt;
}
```

#### 4.2.2 Plan Merging

Two plans **can be merged** if they meet all criteria:

| Criterion | Rule |
|-----------|------|
| Same `targetAgentId` | Must target the same agent |
| Same `cooldownKey` | Must share a cooldown bucket |
| Compatible priority | Within 20 points of each other |
| Same `requiresLLM` | Both or neither need LLM |
| Time proximity | Enqueued within 5 seconds of each other |
| Non-blocking | Neither plan is currently executing |

When merged, the new plan:
- Inherits the **higher** priority of the two
- Combines `events` arrays (primary plan's events first, then secondary's)
- Takes the **shorter** `delayMs`
- Concatenates `reason` strings
- Keeps the primary plan's `fallback`

```typescript
interface MergeResult {
  merged: boolean;
  resultPlan?: BehaviorPlan;
  /** Which plan ID was absorbed (if merged). */
  absorbedPlanId?: string;
  /** Why merge was rejected (if not merged). */
  rejectionReason?: string;
}

function canMerge(a: BehaviorPlan, b: BehaviorPlan): MergeResult {
  if (a.targetAgentId !== b.targetAgentId) {
    return { merged: false, rejectionReason: 'different_target_agent' };
  }
  if (a.cooldownKey !== b.cooldownKey) {
    return { merged: false, rejectionReason: 'different_cooldown_key' };
  }
  if (Math.abs(a.priority - b.priority) > 20) {
    return { merged: false, rejectionReason: 'priority_gap_too_large' };
  }
  if (a.requiresLLM !== b.requiresLLM) {
    return { merged: false, rejectionReason: 'llm_requirement_mismatch' };
  }
  return { merged: true };
}
```

#### 4.2.3 Plan Cancellation

A new plan can **cancel** an existing pending plan if:

| Rule | Description |
|------|-------------|
| Supersedes | New plan has same `cooldownKey` and higher priority |
| Overrides | New plan has same `targetAgentId` and `sourceSignal` references the same user message |
| Expires | Existing plan's `hardDeadline` has passed |
| Agent Switch | New `user.switch_agent` signal cancels all pending plans for the old agent |
| Interrupt | `behavior.interrupt` event cancels the currently executing plan |

Cancellation cascade:
```
New Plan Arrives
    │
    ├──▶ Check same cooldownKey + higher priority ──▶ Cancel old plan
    │
    ├──▶ Check same targetAgentId + same user message ──▶ Cancel old plan
    │
    ├──▶ Check agent switch ──▶ Cancel ALL plans for old agent
    │
    └──▶ Check interrupt signal ──▶ Cancel currently executing plan immediately
```

```typescript
interface CancellationResult {
  cancelled: boolean;
  /** IDs of plans that were cancelled. */
  cancelledPlanIds: string[];
  /** The currently executing plan was interrupted. */
  interruptedExecution: boolean;
  /** Reason for cancellation. */
  reason: 'superseded' | 'overridden' | 'expired' | 'agent_switch' | 'interrupt' | 'none';
}

function evaluateCancellation(
  newPlan: BehaviorPlan,
  queue: QueueEntry[],
  currentlyExecuting: QueueEntry | null
): CancellationResult;
```

#### 4.2.4 Plan Expiration

Plans expire and are dropped from the queue when:

```typescript
interface ExpirationConfig {
  /** Maximum time a plan can sit in queue before being dropped. */
  maxQueueAgeMs: number;      // Default: 30000 (30s)

  /** Maximum total lifetime from creation to completion. */
  maxPlanLifetimeMs: number;  // Default: 120000 (2m)

  /** How often the expiration sweeper runs. */
  sweepIntervalMs: number;    // Default: 5000 (5s)

  /** Plans with priority >= this get extended lifetime. */
  highPriorityThreshold: number; // Default: 71

  /** Multiplier for high-priority plan max age. */
  highPriorityAgeMultiplier: number; // Default: 2.0
}

function shouldExpire(entry: QueueEntry, config: ExpirationConfig, now: number): boolean {
  const age = now - entry.enqueuedAt;
  const isHighPriority = entry.plan.priority >= config.highPriorityThreshold;
  const maxAge = isHighPriority
    ? config.maxQueueAgeMs * config.highPriorityAgeMultiplier
    : config.maxQueueAgeMs;

  return age > maxAge || now > entry.hardDeadline;
}
```

#### 4.2.5 Execution Ordering

The execution engine respects these rules:

```
1. Free events (tokenCostEstimate === 'free') are batched:
   - Up to 10 free events emitted in a single tick
   - No artificial delay between them

2. Cheap events wait for free events to complete, then execute

3. Expensive events require explicit confirmation OR budget check:
   - If token budget allows → execute
   - If token budget depleted → emit behavior.token_budget warning
   - If token budget critical → queue for later or downgrade to cheap

4. Blocking events:
   - If PlannedEvent.blocking === true:
     - Wait for durationMs before proceeding to next event
   - If blocking === false:
     - Fire and immediately proceed

5. Delay chains:
   - Each PlannedEvent.delayMs is RELATIVE to the previous event's emission
   - NOT absolute from plan start
```

```typescript
interface ExecutionContext {
  /** The plan being executed. */
  plan: BehaviorPlan;

  /** Current event index in plan.events. */
  currentIndex: number;

  /** When the plan started executing. */
  startedAt: number;

  /** Token budget snapshot at execution start. */
  budgetSnapshot: TokenBudgetSnapshot;

  /** Whether execution was interrupted. */
  interrupted: boolean;

  /** Events emitted so far. */
  emittedEvents: string[]; // event IDs
}

interface TokenBudgetSnapshot {
  minuteRemaining: number;
  hourRemaining: number;
  dayRemaining: number;
  critical: boolean;
}
```

### 4.3 Queue State Machine

```
                    ┌──────────────────────────────────────┐
                    │                                      │
     ┌──────────────▼──────────────┐    ┌──────────────────┴──────┐
     │         PENDING             │    │        DELAYED          │
     │  (in priority queue,        │───▶│  (waiting for delayMs   │
     │   waiting for slot)         │    │   to elapse)            │
     └──────────────┬──────────────┘    └──────────┬────────────┘
                    │                              │
                    │ executeAfter reached         │ delay elapsed
                    ▼                              ▼
     ┌──────────────────────────────────────────────────────────┐
     │                     EXECUTING                             │
     │  (emitting events one by one, respecting                  │
     │   blocking, delays, and budget checks)                    │
     └──────────────┬─────────────────────────────┬──────────────┘
                    │                             │
        all events │               event failed  │ interrupt
        emitted    │                             │
                    ▼                             ▼
     ┌──────────────────────┐      ┌──────────────────────────────┐
     │      COMPLETED       │      │         FAILED               │
     │  (success, all       │      │  (event error, fallback      │
     │   events emitted)    │      │   events executed)           │
     └──────────────────────┘      └──────────────┬───────────────┘
                                                  │
                                                  │ fallback done
                                                  ▼
     ┌──────────────────────┐      ┌──────────────────────────────┐
     │      EXPIRED         │      │       CANCELLED              │
     │  (deadline passed    │      │  (superseded by newer plan,  │
     │   before execution)  │      │   agent switch, or interrupt)│
     └──────────────────────┘      └──────────────────────────────┘
```

---

## 5. New Event Types for Phase 2

### 5.1 BehaviorEventType Extension

```typescript
// ---------------------------------------------------------------------------
// Extended PortalEventType with Phase 2 behavior events
// ---------------------------------------------------------------------------

type PortalEventType =
  // --- Phase 1.6 events (existing) ---
  | 'agent.message' | 'agent.thinking' | 'agent.typing' | 'agent.error' | 'agent.eye_emotion'
  | 'portal.repaint' | 'portal.spawn_card' | 'portal.create_page' | 'portal.report_ready'
  | 'portal.feed_item' | 'portal.deal_card' | 'portal.news_card' | 'portal.demo_action'
  | 'portal.theme_change' | 'portal.sound_cue'
  | 'system.log' | 'admin.config_changed'
  // --- Phase 2 behavior events (new) ---
  | BehaviorEventType;

// New behavior-namespace events
type BehaviorEventType =
  | 'behavior.observe'      // Agent observed something
  | 'behavior.decide'       // Behavior Director made a decision
  | 'behavior.silence'      // Intentional silence period started/ended
  | 'behavior.cooldown'     // A cooldown was enforced
  | 'behavior.token_budget' // Token budget status update
  | 'behavior.interrupt'    // Agent interrupted ongoing action
  | 'behavior.plan_created' // New BehaviorPlan was created
  | 'behavior.plan_merged'  // Two plans were merged
  | 'behavior.plan_expired' // A plan expired without executing
  | 'behavior.queue_state'; // Queue metrics update (admin only);
```

### 5.2 Event Schemas

```typescript
// ---------------------------------------------------------------------------
// behavior.observe — The agent observed something in the environment
// ---------------------------------------------------------------------------
interface BehaviorObservePayload {
  /** What was observed. */
  observation: string;

  /** Category of observation. */
  category: 'user-action' | 'system-state' | 'environment' | 'conversation-pattern';

  /** Confidence in this observation (0–1). */
  confidence: number;

  /** Related signal ID that triggered this observation. */
  sourceSignalId: string;

  /** What the agent thinks this observation means (interpretation). */
  interpretation?: string;
}

// ---------------------------------------------------------------------------
// behavior.decide — The Behavior Director made a decision
// ---------------------------------------------------------------------------
interface BehaviorDecidePayload {
  /** The decision that was made. */
  decision: string;

  /** The plan ID that was created as a result. */
  planId: string;

  /** Which signal triggered the decision. */
  triggerSignalId: string;

  /** Decision-making context at the time. */
  context: {
    agentState: AgentState;
    mood: MoodState;
    activeCooldowns: string[];
    recentPlanCount: number;
    queueDepth: number;
  };

  /** Alternative decisions that were considered and rejected. */
  alternatives?: Array<{
    decision: string;
    reasonRejected: string;
  }>;
}

// ---------------------------------------------------------------------------
// behavior.silence — Intentional silence period started or ended
// ---------------------------------------------------------------------------
interface BehaviorSilencePayload {
  /** Whether silence is starting or ending. */
  phase: 'start' | 'end';

  /** Why the agent chose to be silent. */
  reason: string;

  /** Expected silence duration in ms (null if open-ended). */
  expectedDurationMs?: number;

  /** The mood driving this silence. */
  mood: MoodState;

  /** What would break the silence early. */
  breakConditions: string[];
}

// ---------------------------------------------------------------------------
// behavior.cooldown — A cooldown was enforced on an action category
// ---------------------------------------------------------------------------
interface BehaviorCooldownPayload {
  /** Which cooldown bucket was triggered. */
  cooldownKey: CooldownKey;

  /** The cooldown duration in ms. */
  durationMs: number;

  /** When the cooldown expires. */
  expiresAt: string; // ISO 8601

  /** Which plan triggered the cooldown. */
  triggeringPlanId: string;

  /** Whether this was a forced cooldown (budget) or natural (rate limit). */
  reason: 'rate-limit' | 'token-budget' | 'user-preference' | 'manual';
}

// ---------------------------------------------------------------------------
// behavior.token_budget — Token budget status update
// ---------------------------------------------------------------------------
interface BehaviorTokenBudgetPayload {
  /** Which budget window this update is for. */
  budgetWindow: 'minute' | 'hour' | 'day' | 'month';

  /** Percentage consumed (0–100, can exceed 100). */
  consumedPercent: number;

  /** Remaining tokens. */
  remainingTokens: number;

  /** Severity indicator. */
  severity: 'ok' | 'caution' | 'warning' | 'critical';

  /** Whether further expensive plans are blocked. */
  expensivePlansBlocked: boolean;

  /** Whether cheap plans are still allowed. */
  cheapPlansAllowed: boolean;

  /** Time until budget resets. */
  resetsInMs: number;
}

// ---------------------------------------------------------------------------
// behavior.interrupt — An ongoing agent action was interrupted
// ---------------------------------------------------------------------------
interface BehaviorInterruptPayload {
  /** What was interrupted. */
  interruptedPlanId: string;

  /** Why the interruption happened. */
  reason: 'user-message' | 'agent-switch' | 'high-priority-plan' | 'system-command' | 'budget-cutoff';

  /** The plan that caused the interruption (if any). */
  interruptingPlanId?: string;

  /** How many events from the interrupted plan had already emitted. */
  eventsEmitted: number;

  /** How many events were remaining. */
  eventsRemaining: number;

  /** Whether the interrupted plan can be resumed later. */
  resumable: boolean;
}

// ---------------------------------------------------------------------------
// behavior.plan_created — A new BehaviorPlan was created
// ---------------------------------------------------------------------------
interface BehaviorPlanCreatedPayload {
  planId: string;
  priority: number;
  reason: string;
  eventCount: number;
  requiresLLM: boolean;
  tokenCostEstimate: string;
}

// ---------------------------------------------------------------------------
// behavior.plan_merged — Two plans were merged
// ---------------------------------------------------------------------------
interface BehaviorPlanMergedPayload {
  survivingPlanId: string;
  absorbedPlanId: string;
  mergedEventCount: number;
  mergeReason: string;
}

// ---------------------------------------------------------------------------
// behavior.plan_expired — A plan expired without executing
// ---------------------------------------------------------------------------
interface BehaviorPlanExpiredPayload {
  planId: string;
  priority: number;
  reason: string;
  /** How long the plan was in queue before expiring. */
  queueAgeMs: number;
  /** Why it expired. */
  expiryReason: 'timeout' | 'deadline' | 'queue-full';
}

// ---------------------------------------------------------------------------
// behavior.queue_state — Queue metrics (admin/internal visibility only)
// ---------------------------------------------------------------------------
interface BehaviorQueueStatePayload {
  /** Number of plans currently pending. */
  pendingCount: number;

  /** Number of plans currently executing. */
  executingCount: number;

  /** Plans by priority band. */
  plansByBand: Record<string, number>;

  /** Average plan age in ms. */
  averagePlanAgeMs: number;

  /** Number of plans cancelled in last minute. */
  cancellationsPerMinute: number;

  /** Number of plans merged in last minute. */
  mergesPerMinute: number;

  /** Number of plans expired in last minute. */
  expirationsPerMinute: number;

  /** Active cooldown keys and their remaining durations. */
  activeCooldowns: Array<{
    key: CooldownKey;
    expiresInMs: number;
  }>;
}
```

---

## 6. Frontend → Backend Signal Flow

### 6.1 Signal Transport

All frontend signals travel over the **existing SSE connection** (bidirectional via HTTP POST for upstream):

```
┌──────────────┐     HTTP POST      ┌──────────────┐     Signal Router      ┌──────────────────┐
│   Frontend   │ ─────────────────▶ │   Backend    │ ────────────────────▶  │ Behavior Director │
│  (Signals)   │  {signal payload}  │  Signal API  │   (typed, validated)   │   (decides)       │
└──────────────┘                    └──────────────┘                        └──────────────────┘
       ▲                                                                           │
       │                                                                           │ BehaviorPlan
       │                                                                           ▼
       │                                                                  ┌──────────────────┐
       │                                                                  │   Event Queue    │
       │                                                                  │   (priority)     │
       │                                                                  └────────┬─────────┘
       │                                                                           │
       │                              SSE Stream                                   │
       │◀──────────────────────────────────────────────────────────────────────────┘
       │                           {PortalEvent[]}
       │
┌──────┴──────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND SIGNAL CAPTURE                              │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌─────────┐  │
│  │   Mouse     │  │   Scroll    │  │    Hover    │  │   Chat   │  │  Idle   │  │
│  │  Tracking   │  │  Debounce   │  │  Immediate  │  │  Input   │  │  Timer  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬─────┘  └────┬────┘  │
│         │                │                │              │             │        │
│         ▼                ▼                ▼              ▼             ▼        │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                     BATCHING & THROTTLING LAYER                           │   │
│  │  (mouse: 50ms batch)  (scroll: 150ms debounce)  (hover: immediate)       │   │
│  └─────────────────────────────────────┬─────────────────────────────────────┘   │
│                                        │                                          │
│                                        ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                     SIGNAL SERIALIZER (to InputSignal)                     │   │
│  └─────────────────────────────────────┬─────────────────────────────────────┘   │
│                                        │                                          │
│                                        ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                     HTTP POST to /api/v2/signals                           │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Per-Signal-Type Flow

#### 6.2.1 Mouse Tracking

```typescript
// Mouse position tracking — batched + throttled
const MOUSE_CONFIG = {
  /** Collect mouse positions every N ms into a batch. */
  sampleIntervalMs: 50,

  /** Send batch every N ms. */
  batchIntervalMs: 500,

  /** Max positions per batch. */
  maxBatchSize: 20,

  /** Include velocity calculation. */
  includeVelocity: true,
} as const;

interface MouseBatchSignal extends Omit<UserSignal, 'kind' | 'payload'> {
  kind: 'user.mouse_batch';
  payload: {
    subKind: 'user.mouse_batch';
    /** Sampled mouse positions with timestamps. */
    positions: Array<{
      x: number;
      y: number;
      t: number; // relative ms from batch start
    }>;
    /** Computed velocity vector. */
    velocity: { dx: number; dy: number; speed: number };
    /** Elements under the mouse path. */
    hoveredElements: string[];
  };
}

// NOTE: 'user.mouse_batch' is NOT in InputSignal — it is pre-processed
// into 'user.hover' signals by the backend Signal Router before reaching
// the Behavior Director.
```

**Flow:**
```
Mouse moves ──▶ 50ms sampler ──▶ Position buffer ──▶ 500ms batch ──▶ HTTP POST
                                                         │
                                                         ▼
                                              Backend Signal Router
                                                         │
                              ┌────────────────────────┼────────────────────────┐
                              ▼                        ▼                        ▼
                         Hover element?          Significant movement?     Idle zone?
                              │                        │                        │
                              ▼                        ▼                        ▼
                        Emit user.hover         Skip (noise)           Emit user.idle start
```

#### 6.2.2 Scroll Events

```typescript
const SCROLL_CONFIG = {
  /** Debounce wait time before emitting scroll signal. */
  debounceMs: 150,

  /** Minimum scroll delta to trigger a signal. */
  minDeltaPx: 50,

  /** Include scroll velocity. */
  trackVelocity: true,
} as const;

// Scroll signals are debounced: the signal is only emitted after the user
// stops scrolling for 150ms. This prevents flood of signals during smooth scroll.
```

**Flow:**
```
User scrolls ──▶ Scroll accumulator ──▶ 150ms debounce timer ──▶ Signal emitted
                (sum of deltas)            (reset on new scroll)    (if minDeltaPx met)
```

#### 6.2.3 Hover Events

```typescript
const HOVER_CONFIG = {
  /** Minimum hover time before a signal is emitted. */
  minHoverMs: 300,

  /** Signal is emitted immediately once minHoverMs is reached. */
  emitMode: 'threshold';

  /** Don't re-emit for same element within this window. */
  dedupWindowMs: 2000,
} as const;

// Hover signals fire once the user has hovered over an element for 300ms.
// The backend may use this to trigger proactive agent behavior (e.g., agent
// offers help about the hovered card).
```

#### 6.2.4 Chat Events

```typescript
const CHAT_CONFIG = {
  /** Emit signal immediately on send. */
  emitMode: 'immediate',

  /** Include typing indicator signals (these become agent.typing events). */
  typingIndicators: true,

  /** Typing indicator throttle. */
  typingThrottleMs: 300,
} as const;
```

**Flow:**
```
User types ──▶ Typing indicator (throttled 300ms) ──▶ agent.typing event ──▶ SSE
     │
     └──▶ Presses Send ──▶ user.message signal ──▶ HTTP POST ──▶ Behavior Director
                                                              ──▶ agent.thinking event
```

#### 6.2.5 Idle Detection

```typescript
const IDLE_CONFIG = {
  /** Time of no activity before idle starts. */
  idleThresholdMs: 15000, // 15 seconds

  /** How often to emit continuing idle ticks. */
  tickIntervalMs: 30000, // 30 seconds

  /** Activities that reset the idle timer. */
  resetActivities: ['mousemove', 'click', 'scroll', 'keydown', 'touchstart'],

  /** Max idle time before auto-disconnect (optional). */
  maxIdleMs: 300000, // 5 minutes
} as const;
```

**Flow:**
```
User activity ──▶ Activity monitor ──▶ 15s timer ──▶ No activity?
   (any input)      (resets timer)      (countdown)
                                          │
                                          ▼
                                   Emit user.idle (phase: 'start')
                                          │
                                          ▼
                                   Every 30s: emit user.idle (phase: 'continuing')
                                          │
                              Activity detected ──▶ Emit user.idle (phase: 'end')
```

#### 6.2.6 Agent Switch

```typescript
// Agent switch is immediate — no batching or debouncing.
// It cancels all pending plans for the old agent and triggers
// a new behavior cycle for the new agent.

const AGENT_SWITCH_CONFIG = {
  emitMode: 'immediate',
  cancelOldAgentPlans: true,
  triggerNewAgentGreeting: true,
} as const;
```

### 6.3 Signal Router (Backend)

```typescript
/**
 * The Signal Router sits between the raw HTTP signal endpoint and the
 * Behavior Director. It validates, transforms, and routes signals.
 */
interface SignalRouter {
  /** Validate incoming signal against InputSignal schema. */
  validate(signal: unknown): ValidationResult<InputSignal>;

  /** Transform raw signals (e.g., mouse batch → hover). */
  transform(signal: InputSignal): InputSignal[];

  /** Route to the appropriate Behavior Director instance. */
  route(signal: InputSignal): string; // returns targetAgentId

  /** Apply rate limiting per user per signal type. */
  rateLimit(signal: InputSignal): { allowed: boolean; retryAfterMs?: number };

  /** Enrich signal with context (user session, agent state, recent history). */
  enrich(signal: InputSignal): EnrichedSignal;
}

interface EnrichedSignal {
  /** The original (validated, transformed) signal. */
  signal: InputSignal;

  /** Session context. */
  session: {
    sessionId: string;
    userId: string;
    connectedAt: string;
    lastActivityAt: string;
  };

  /** Current agent context. */
  agentContext: {
    agentId: string;
    agentState: AgentState;
    agentMood: MoodState;
    conversationTurns: number;
    lastMessageAt: string;
  };

  /** Recent signal history (last 10 signals). */
  recentSignals: Array<{
    signalType: string;
    timestamp: string;
    digest: string;
  }>;
}
```

---

## 7. Execution Engine Design

### 7.1 Execution Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXECUTION PIPELINE                                   │
│                                                                              │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐  │
│   │  PLAN    │──▶│  BUDGET  │──▶│  EVENT   │──▶│   SSE    │──▶│FRONTEND│  │
│   │  PULL    │   │  CHECK   │   │  EMITTER │   │  STREAM  │   │THEATER │  │
│   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └────────┘  │
│        │              │              │              │              │       │
│        ▼              ▼              ▼              ▼              ▼       │
│   Priority       Token budget   Sequential      WS/SSE        Animation   │
│   queue pop      gate           emit with       broadcast     + render    │
│                  (free/cheap/   delay +        (JSON)         + sound     │
│                  expensive)     blocking                                    │
│                                 resolution                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Server-Side Execution

```typescript
// ---------------------------------------------------------------------------
// ExecutionEngine — Server-side plan executor
// ---------------------------------------------------------------------------

interface ExecutionEngine {
  /** Start executing a plan. Returns execution context. */
  execute(plan: BehaviorPlan): Promise<ExecutionResult>;

  /** Interrupt the currently executing plan. */
  interrupt(planId: string, reason: BehaviorInterruptPayload['reason']): void;

  /** Get current execution status. */
  status(): ExecutionStatus;
}

interface ExecutionResult {
  planId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'interrupted';
  /** Events that were successfully emitted. */
  emittedEvents: string[];
  /** Events that were skipped (if any). */
  skippedEvents: string[];
  /** If fallback was used. */
  fallbackUsed: boolean;
  /** Total execution time in ms. */
  durationMs: number;
  /** Token cost actually incurred. */
  actualTokenCost: number;
}

interface ExecutionStatus {
  currentlyExecuting: string | null; // plan ID
  queueDepth: number;
  activeCooldowns: Array<{ key: CooldownKey; expiresInMs: number }>;
  lastExecutionAt: string | null;
  plansExecutedThisHour: number;
}
```

#### 7.2.1 Event Emission Sequence

```typescript
async function emitPlanEvents(
  plan: BehaviorPlan,
  context: ExecutionContext,
  eventStore: EventStore,
  sseStream: SSEStream
): Promise<ExecutionResult> {
  const emitted: string[] = [];

  for (let i = context.currentIndex; i < plan.events.length; i++) {
    // Check for interruption
    if (context.interrupted) {
      return handleInterrupted(plan, context, emitted);
    }

    const plannedEvent = plan.events[i];

    // 1. Wait for delay
    if (plannedEvent.delayMs > 0) {
      await sleep(plannedEvent.delayMs);
    }

    // 2. Check for interruption again after delay
    if (context.interrupted) {
      return handleInterrupted(plan, context, emitted);
    }

    // 3. Convert PlannedEvent to PortalEvent
    const portalEvent: PortalEvent = {
      id: generateUUID(),
      type: plannedEvent.eventType,
      timestamp: new Date().toISOString(),
      source: plannedEvent.source,
      agentId: plannedEvent.agentId,
      payload: plannedEvent.payload,
      visibility: plannedEvent.visibility ?? 'public',
      importance: plannedEvent.importance ?? 'normal',
      artifactId: plannedEvent.artifactId,
      expiresAt: plannedEvent.expiresAt,
    };

    // 4. Store in event store
    eventStore.push(portalEvent);

    // 5. Emit to SSE stream
    sseStream.emit(portalEvent);

    emitted.push(portalEvent.id);

    // 6. If blocking, wait for duration
    if (plannedEvent.blocking && plannedEvent.durationMs > 0) {
      await sleep(plannedEvent.durationMs);
    }
  }

  return {
    planId: plan.id,
    status: 'completed',
    emittedEvents: emitted,
    skippedEvents: [],
    fallbackUsed: false,
    durationMs: Date.now() - context.startedAt,
    actualTokenCost: 0, // populated by LLM layer if applicable
  };
}
```

### 7.3 Client-Side Theater (Frontend Event Interpreter)

The frontend **Theater** interprets incoming `PortalEvent`s and translates them into UI animations and state changes.

```typescript
// ---------------------------------------------------------------------------
// Theater — Frontend event interpreter
// ---------------------------------------------------------------------------

interface Theater {
  /** Register an event handler for a specific event type. */
  on(eventType: PortalEventType, handler: EventHandler): void;

  /** Process an incoming event from the SSE stream. */
  process(event: PortalEvent): void;

  /** Get current theater state. */
  state(): TheaterState;
}

type EventHandler = (event: PortalEvent, instructions: DisplayInstructions) => void;

interface DisplayInstructions {
  /** Animation to apply. */
  animation: AnimationPreset;

  /** Target DOM region. */
  viewport: ViewportRegion;

  /** Duration on screen (0 = permanent). */
  durationMs: number;

  /** Sound cue to play. */
  soundCue?: string;

  /** CSS class overrides. */
  cssClass?: string;

  /** Z-index hint. */
  zIndex?: number;
}

type ViewportRegion = 'chat-panel' | 'card-deck' | 'banner' | 'sidebar'
                     | 'fullscreen' | 'toast-stack' | 'agent-avatar' | 'background';

interface TheaterState {
  /** Currently visible events by region. */
  activeEvents: Record<ViewportRegion, string[]>;

  /** Whether an animation is currently playing. */
  isAnimating: boolean;

  /** Current agent being displayed. */
  currentAgentId: string;

  /** Pending events waiting for animation slot. */
  backlog: number;
}
```

### 7.4 Animation Timing Coordination

Animation timing is coordinated between server and frontend using a **relative timing model**:

```
Server Timeline:           Frontend Timeline:
─────────────────          ──────────────────
T+0ms   Event 1 emitted ──▶ T+0ms   Received
        (animation: fade-in)       (start fade-in animation)
        (blocking: true)            (duration: 500ms)
        (duration: 500ms)
                              T+500ms Animation complete
                              Notify server? NO — server already knows

T+500ms Event 2 emitted ──▶ T+500ms Received
        (animation: slide-up)      (start slide-up)
        (blocking: false)           (non-blocking, can overlap)
        (delayMs: 0 — immediate)

T+500ms Event 3 emitted ──▶ T+500ms Received simultaneously
        (animation: instant)        (renders immediately, no animation)
        (blocking: false)

T+800ms Event 4 emitted ──▶ T+800ms Received
        (animation: typewriter)      (start typewriter, char-by-char)
        (blocking: true)
        (duration: 2000ms)           (will block until T+2800ms)
```

**Key principle:** The server controls the *rhythm* (when events arrive). The frontend controls the *performance* (how they animate). Blocking is resolved server-side; the frontend simply plays what it receives.

### 7.5 Server vs Client Responsibility Split

| Concern | Server | Client |
|---------|--------|--------|
| **Event ordering** | Deterministic sequencing via plan.events[] | Receives in order over SSE |
| **Timing delays** | delayMs, durationMs, blocking logic | Respects timestamps, plays animations |
| **Animation choice** | PlannedEvent.animation hint | Chooses implementation, respects hint |
| **Sound cues** | PlannedEvent.soundCue | Plays audio if enabled |
| **Viewport placement** | PlannedEvent.viewportHint | Maps to actual DOM regions |
| **Event store** | 500-cap server store | Local ephemeral cache |
| **Cooldown enforcement** | Queue checks before execute | n/a |
| **Budget gating** | Pre-execution check | Shows budget warnings if forwarded |
| **CSS styling** | PlannedEvent.cssClass hint | Applies classes to components |
| **Interrupt handling** | Stops emitting, marks plan interrupted | Clears animations, resets theater |
| **Fallback execution** | Server emits fallback events | Renders fallback events normally |

---

## 8. Integration Points with Other Subsystems

### 8.1 Behavior Director (Consumer)

The Behavior Director is the primary consumer of this event system. The contracts below define what the Director provides and receives.

```typescript
// What the Behavior Director NEEDS from the event system:
interface BehaviorDirectorDependencies {
  /** Current agent state (from agent manager). */
  agentState: AgentState;

  /** Current agent mood (from mood engine). */
  mood: MoodState;

  /** Currently active cooldown keys and remaining durations. */
  activeCooldowns: Map<CooldownKey, number>; // key → remainingMs

  /** Recent conversation history (last N turns). */
  conversationHistory: Array<{
    role: 'user' | 'agent';
    text: string;
    timestamp: string;
  }>;

  /** Current token budget snapshot. */
  tokenBudget: TokenBudgetSnapshot;

  /** User session preferences. */
  userPreferences: {
    soundEnabled: boolean;
    animationsEnabled: boolean;
    theme: string;
    proactiveEnabled: boolean;
    maxCards: number;
  };
}

// What the Behavior Director PRODUCES:
interface BehaviorDirectorOutput {
  /** The plan to execute (or null if Director decides to stay silent). */
  plan: BehaviorPlan | null;

  /** If the Director decides silence is appropriate. */
  silenceDecision?: {
    durationMs: number;
    reason: string;
  };

  /** Observations the Director made during decision. */
  observations: BehaviorObservePayload[];
}
```

### 8.2 Token Budget System

```typescript
interface TokenBudgetSystem {
  /** Check if a plan can execute within current budget. */
  canAfford(costEstimate: 'free' | 'cheap' | 'expensive'): boolean;

  /** Reserve budget for a plan about to execute. */
  reserve(planId: string, estimatedTokens: number): ReservationResult;

  /** Report actual token usage after plan completes. */
  reportUsage(planId: string, actualTokens: number): void;

  /** Get current budget snapshot. */
  snapshot(): TokenBudgetSnapshot;

  /** Subscribe to budget alert events. */
  onAlert(callback: (alert: BehaviorTokenBudgetPayload) => void): void;
}

interface ReservationResult {
  approved: boolean;
  /** Reserved token amount. */
  reservedTokens: number;
  /** Remaining after reservation. */
  remainingTokens: number;
  /** If not approved, when budget will reset. */
  resetsAt?: string;
}
```

**Integration flow:**
```
BehaviorPlan created
       │
       ▼
TokenBudget.canAfford(plan.tokenCostEstimate)
       │
       ├──▶ YES ──▶ Reserve budget ──▶ Execute plan ──▶ Report actual usage
       │
       └──▶ NO  ──▶ Emit behavior.token_budget (critical)
              ──▶ If plan.priority >= HIGH ──▶ Override, execute anyway
              ──▶ If plan.priority < HIGH  ──▶ Queue for later, emit fallback
```

### 8.3 Provider Layer (LLM Availability)

```typescript
interface ProviderLayer {
  /** Check if LLM is available and responsive. */
  isLLMAvailable(): boolean;

  /** Current provider status. */
  providerStatus(): ProviderStatus;

  /** Estimated latency for next LLM call. */
  estimatedLatencyMs(): number;

  /** Queue depth for LLM requests. */
  queueDepth(): number;
}

interface ProviderStatus {
  provider: string;       // e.g., 'openai', 'anthropic'
  status: 'up' | 'degraded' | 'down';
  lastCheckedAt: string;
  averageLatencyMs: number;
  errorRate: number;      // 0–1
}
```

**Integration flow:**
```
BehaviorPlan.requiresLLM === true
       │
       ▼
ProviderLayer.isLLMAvailable()
       │
       ├──▶ YES ──▶ Check queue depth
       │              ├──▶ Queue < threshold ──▶ Proceed with LLM call
       │              └──▶ Queue >= threshold ──▶ Emit agent.thinking ("give me a moment")
       │                                          ──▶ Queue plan for LLM slot
       │
       └──▶ NO  ──▶ Skip LLM-dependent events
              ──▶ Emit agent.error (provider unavailable)
              ──▶ Execute fallback plan (if any)
              ──▶ If priority >= HIGH ──▶ Retry with fallback provider
```

### 8.4 Frontend Integration

```typescript
interface FrontendIntegration {
  /** Signal emission API (HTTP POST wrapper). */
  emitSignal(signal: Omit<InputSignal, 'id' | 'timestamp'>): void;

  /** SSE event handler registration. */
  onEvent(eventType: PortalEventType, handler: (event: PortalEvent) => void): void;

  /** Theater animation engine. */
  theater: Theater;

  /** Sound engine. */
  soundEngine: {
    play(cue: string): void;
    enabled: boolean;
    volume: number;
  };

  /** Idle detection controller. */
  idleDetector: {
    start(): void;
    stop(): void;
    isIdle: boolean;
    idleDurationMs: number;
  };

  /** Activity capture controllers. */
  activityCapture: {
    mouse: { start(): void; stop(): void; };
    scroll: { start(): void; stop(): void; };
    hover: { start(): void; stop(): void; };
  };
}
```

---

## 9. Event Store Integration

### 9.1 Behavior Events in the Event Store

The existing 500-cap event store is extended to handle behavior events:

```typescript
interface ExtendedEventStore {
  /** Push a new event (existing behavior — auto-prune at 500 cap). */
  push(event: PortalEvent): void;

  /** Query events with filters. */
  query(filters: EventQuery): PortalEvent[];

  /** Get recent behavior events for a specific agent. */
  getBehaviorHistory(agentId: string, limit?: number): PortalEvent[];

  /** Get queue state (admin). */
  getQueueState(): BehaviorQueueStatePayload;
}

interface EventQuery {
  types?: PortalEventType[];
  agents?: string[];
  sources?: PortalEvent['source'][];
  since?: string;       // ISO 8601
  until?: string;       // ISO 8601
  importance?: PortalEvent['importance'][];
  visibility?: PortalEvent['visibility'][];
  limit?: number;
  offset?: number;
}
```

### 9.2 Pruning Behavior

```
Event Store (max 500):
┌─────────────────────────────────────────────────────────────────┐
│  [1] agent.message     user      2024-01-15T10:00:00Z          │
│  [2] agent.thinking    agent     2024-01-15T10:00:01Z          │
│  [3] behavior.decide   system    2024-01-15T10:00:01Z  ◄── admin
│  [4] agent.typing      agent     2024-01-15T10:00:02Z          │
│  [5] behavior.observe  agent     2024-01-15T10:00:02Z  ◄── admin
│  ...                                                            │
│  [498] portal.spawn_card agent   2024-01-15T10:05:00Z          │
│  [499] behavior.cooldown system  2024-01-15T10:05:01Z  ◄── admin
│  [500] agent.message     user    2024-01-15T10:05:02Z          │
└─────────────────────────────────────────────────────────────────┘

On push #501:
  1. Remove oldest 'normal'/'low' importance public events first
  2. Preserve last 50 events regardless of age
  3. Preserve ALL 'critical' importance events
  4. Preserve ALL 'behavior.*' events (they are admin/internal visibility)
  5. If still over cap, remove oldest remaining
```

---

## 10. Complete Type Summary

### Type Dependency Graph

```
InputSignal ──┬──▶ UserSignal ──────┬──▶ UserMessagePayload
              │                     ├──▶ UserCommandPayload
              │                     ├──▶ UserHoverPayload
              │                     ├──▶ UserScrollPayload
              │                     ├──▶ UserClickPayload
              │                     ├──▶ UserIdlePayload
              │                     ├──▶ UserSwitchAgentPayload
              │                     ├──▶ UserFeedbackPayload
              │                     ├──▶ UserDismissPayload
              │                     └──▶ UserExpandCardPayload
              │
              ├──▶ BackendSignal ───┬──▶ LLMCompletePayload
              │                     ├──▶ LLMErrorPayload
              │                     ├──▶ CardReadyPayload
              │                     ├──▶ ReportGeneratedPayload
              │                     ├──▶ ConfigChangePayload
              │                     ├──▶ AgentStateChangePayload
              │                     ├──▶ TokenBudgetAlertPayload
              │                     └──▶ SystemAlertPayload
              │
              ├──▶ ExternalSignal ──┬──▶ WebhookPayload
              │                     ├──▶ ApiCallPayload
              │                     ├──▶ StreamEventPayload
              │                     └──▶ ScheduledJobPayload
              │
              └──▶ AutonomousSignal ─┬──▶ TimerTickPayload
                                     ├──▶ MoodShiftPayload
                                     ├──▶ CuriosityPayload
                                     ├──▶ MemoryTriggerPayload
                                     └──▶ SocialCuePayload

BehaviorPlan ──▶ PlannedEvent ──▶ PortalEvent (at emit time)
     │
     ├──▶ uses CooldownKey
     ├──▶ uses PlanStatus
     ├──▶ uses InputSignalSummary
     └──▶ uses PRIORITY_BANDS

New Events:
  behavior.observe ──▶ BehaviorObservePayload
  behavior.decide ──▶ BehaviorDecidePayload
  behavior.silence ──▶ BehaviorSilencePayload
  behavior.cooldown ──▶ BehaviorCooldownPayload
  behavior.token_budget ──▶ BehaviorTokenBudgetPayload
  behavior.interrupt ──▶ BehaviorInterruptPayload
  behavior.plan_created ──▶ BehaviorPlanCreatedPayload
  behavior.plan_merged ──▶ BehaviorPlanMergedPayload
  behavior.plan_expired ──▶ BehaviorPlanExpiredPayload
  behavior.queue_state ──▶ BehaviorQueueStatePayload
```

---

## 11. Appendix: Quick Reference

### 11.1 Priority Assignment Guidelines

| Scenario | Priority | Rationale |
|----------|----------|-----------|
| User sends a message | 100 | Direct user interaction, must respond immediately |
| User sends a command | 95 | Explicit user intent, high urgency |
| User switches agent | 90 | Context change, old agent must yield |
| User feedback (negative) | 85 | User dissatisfaction, needs attention |
| User feedback (positive) | 70 | Acknowledge but not urgent |
| User click (interactive element) | 80 | User expects immediate response |
| User hover (> 2s on card) | 55 | Potential interest, proactive hint |
| User idle (start) | 45 | Opportunity for proactive engagement |
| User idle (continuing) | 25 | Gentle reminder, don't be annoying |
| User scroll (significant) | 40 | Content interest, possible context shift |
| LLM completion | 75 | Content ready, agent should respond |
| LLM error | 80 | Something went wrong, inform user |
| Card ready | 65 | New content available |
| Token budget warning | 70 | System health, may affect user experience |
| Token budget critical | 85 | Immediate action needed |
| Autonomous curiosity | 30 | Low-priority proactive behavior |
| Autonomous mood shift | 35 | May affect future responses |
| Timer tick (ambient) | 5 | Background maintenance |

### 11.2 Cooldown Key Assignment

| Behavior | CooldownKey | Default Duration |
|----------|-------------|-----------------|
| Respond to user message | `user-message` | 3s |
| Proactive chat message | `proactive-chat` | 30s |
| Spawn a card | `card-spawn` | 10s |
| Change theme | `theme-change` | 60s |
| Eye emotion update | `eye-emotion` | 5s |
| Play sound cue | `sound-cue` | 3s |
| Ambient tick | `ambient-tick` | 60s |
| System report | `system-report` | 300s |
| Token budget announcement | `token-budget` | 120s |

### 11.3 Signal Latency Budget

| Signal Type | Max Acceptable Latency | Mechanism |
|-------------|----------------------|-----------|
| Chat (user.message) | 50ms end-to-end | Immediate POST, no batching |
| Agent switch | 50ms end-to-end | Immediate POST, cancels pending |
| Hover | 500ms end-to-end | 300ms threshold + 200ms network |
| Click | 100ms end-to-end | Immediate POST |
| Scroll | 500ms end-to-end | 150ms debounce + 350ms network/buffer |
| Mouse batch | 1000ms end-to-end | 500ms batch + 500ms network |
| Idle | 5000ms tolerance | Client-side timer, no urgency |

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Document** | Event System Contracts & BehaviorPlan Architecture |
| **Phase** | Phase 2 — Behavior Director Integration |
| **Status** | Architecture / Design Document |
| **Last Updated** | 2025-01-15 |
| **Author** | Systems Architecture Team |
| **Reviewers** | Behavior Director, Frontend, Token Budget |
| **Dependencies** | Phase 1.6 Event System, SSE Infrastructure |
| **Consumers** | Behavior Director, Execution Engine, Frontend Theater |
