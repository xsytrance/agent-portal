# Phase 2: Admin Controls & Safety Framework — Architecture Document

**Author:** Product Architect (Controls & Safety)
**Scope:** Admin panel extensions, safety guardrails, trust framework, audit trail, session management
**Target:** `/admin` panel — 6 existing panels + 4 new sections
**Status:** Architecture — design ready for implementation

---

## Table of Contents

1. [Admin Controls Catalog](#1-admin-controls-catalog)
   - 1.1 Global Presence Controls
   - 1.2 Per-Agent Controls
   - 1.3 Event Controls
   - 1.4 Token Budget Controls
   - 1.5 Admin Config Data Model
   - 1.6 Admin Panel UI Layout
2. [Safety & Trust Framework](#2-safety--trust-framework)
   - 2.1 Transparency Rules
   - 2.2 Abuse Prevention
   - 2.3 User Control
   - 2.4 Data Ethics
3. [Automatic Safety Mechanisms](#3-automatic-safety-mechanisms)
   - 3.1 SafetyGuardrails Interface
   - 3.2 Hard Stop Rules
   - 3.3 Degradation Cascade
   - 3.4 Event Queue Safety
4. [Admin Alert System](#4-admin-alert-system)
   - 4.1 Alert Tiers
   - 4.2 Alert Triggers
   - 4.3 Delivery Methods
   - 4.4 Activity Spike Detection
5. [Session Management](#5-session-management)
   - 5.1 Session Lifecycle
   - 5.2 Session Controls
   - 5.3 Session Cost Summary
   - 5.4 Session History
6. [Audit Trail](#6-audit-trail)
   - 6.1 Event Types
   - 6.2 Log Schema
   - 6.3 Retention Policy
   - 6.4 Admin Log Viewer
7. [UX: Mock Indicator & User Controls](#7-ux-mock-indicator--user-controls)
   - 7.1 Mock Indicator Design
   - 7.2 User Mute/Pause Controls
   - 7.3 Card Dismissal
   - 7.4 Agent Selection UI

---

## 1. Admin Controls Catalog

### 1.1 Global Presence Controls

These controls live in the **Admin Panel → Presence Settings** section and affect the entire system.

| Control | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `presenceEnabled` | Toggle | `true` | boolean | Master switch — when OFF, all agents are silent and autonomous events are disabled |
| `runtimeModeOverride` | Select | `"auto"` | `"auto"` \| `"mock"` \| `"development"` \| `"production"` | Override the auto-detected runtime mode. `"auto"` preserves current detection logic |
| `globalTokenBudget` | Number | `1000000` | 0 – 10,000,000 | Maximum tokens across all sessions in current billing window |
| `globalActionRateLimit` | Number | `120` | 1 – 600 | Maximum agent actions (LLM calls + autonomous events) per minute across the entire system |
| `globalEventRateLimit` | Number | `30` | 1 – 300 | Maximum autonomous events per minute system-wide |
| `requireAuthForAdmin` | Toggle | `true` | boolean | When true, admin panel requires HTTP Basic Auth |
| `adminSessionTimeoutMinutes` | Number | `30` | 5 – 120 | Admin panel auto-logout after inactivity |
| `logLevel` | Select | `"info"` | `"debug"` \| `"info"` \| `"warn"` \| `"error"` | System log verbosity |
| `showMockIndicator` | Toggle | `true` | boolean | Whether to show mock-mode indicator in the user-facing UI |
| `enableAuditTrail` | Toggle | `true` | boolean | Master switch for audit logging |
| `emergencyCutoffEnabled` | Toggle | `true` | boolean | Enable automatic emergency stop when budget exhausted |

### 1.2 Per-Agent Controls

These controls live in the **Admin Panel → Agent Configuration** section, scoped per agent ID.

| Control | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `agentEnabled` | Toggle | `true` | boolean | Whether this agent is active and can respond |
| `talkativeness` | Slider | `50` | 0 – 100 | Probability weight for this agent to respond to events (0 = never, 100 = always eligible) |
| `chaosLevel` | Slider | `10` | 0 – 100 | Probability of agent deviating from standard behavior — higher values produce more creative/unpredictable responses |
| `interruptionLevel` | Slider | `20` | 0 – 100 | Likelihood this agent will interrupt ongoing conversations with autonomous contributions |
| `tokenBudget` | Number | `100000` | 0 – 1,000,000 | Per-agent token budget per session |
| `allowedEventTypes` | Checkboxes | `[]` (all) | Array of event type strings | Whitelist: only respond to these event types. Empty = all allowed |
| `blockedEventTypes` | Checkboxes | `[]` | Array of event type strings | Blacklist: never respond to these event types. Takes priority over allowed |
| `silenceModePreference` | Select | `"default"` | `"default"` \| `"silent"` \| `"whisper"` \| `"verbose"` | How agent behaves in silence mode: default (system setting), silent (no autonomous events), whisper (rare quiet events), verbose (normal) |
| `preferredLLMModel` | Select | `"default"` | `"default"` \| model IDs | Preferred model override for this agent. `"default"` uses global setting |
| `customSystemPrompt` | Textarea | `""` | Max 4000 chars | Override the default system prompt for this agent. Empty = use default |
| `useMemory` | Toggle | `true` | boolean | Whether agent can reference cached/template responses |
| `maxAutonomousEventsPerSession` | Number | `20` | 0 – 200 | Hard cap on how many autonomous events this agent can trigger per session |
| `responseTimeoutSeconds` | Number | `30` | 5 – 120 | How long to wait for this agent's LLM response before falling back to mock |

### 1.3 Event Controls

These controls live in the **Admin Panel → Autonomous Loop** section.

| Control | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `autonomousEventMinIntervalSeconds` | Number | `30` | 10 – 600 | Minimum seconds between autonomous events (system-wide) |
| `autonomousEventMaxIntervalSeconds` | Number | `300` | 60 – 3600 | Maximum seconds between autonomous events (system-wide) |
| `perEventTypeCooldownSeconds` | Object | `{}` | `{ [eventType]: seconds }` | Custom cooldown per event type. Overrides the global min interval |
| `maxEventsPerMinute` | Number | `10` | 1 – 60 | System-wide cap on total events (user + autonomous) per minute |
| `maxEventsPerSession` | Number | `100` | 10 – 1000 | Maximum total events in a single session |
| `eventQueueSizeLimit` | Number | `50` | 10 – 200 | Maximum pending events in the queue. Excess events are dropped |
| `eventQueuePriorityEnabled` | Toggle | `true` | boolean | When true, high-priority events (user-triggered) skip ahead of autonomous events |
| `autonomousEventsEnabled` | Toggle | `true` | boolean | Master switch for autonomous loop |
| `eventDeduplicationWindowSeconds` | Number | `60` | 0 – 300 | Within this window, identical events from the same agent are deduplicated |
| `maxSimultaneousAgentResponses` | Number | `3` | 1 – 10 | Maximum number of agents that can respond to a single event |

### 1.4 Token Budget Controls

These controls live in the **Admin Panel → Budget Settings** section.

| Control | Type | Default | Range | Description |
|---------|------|---------|-------|-------------|
| `sessionTokenBudget` | Number | `100000` | 0 – 1,000,000 | Maximum tokens a single session can consume |
| `perMinuteTokenLimit` | Number | `10000` | 0 – 100,000 | Maximum tokens consumed per minute across all sessions |
| `perAgentTokenBudget` | Number | `50000` | 0 – 500,000 | Default token budget per agent per session (can be overridden per-agent) |
| `emergencyCutoffThreshold` | Number | `95` | 50 – 100 | Percentage of budget at which ALL expensive operations stop |
| `warningThreshold` | Number | `75` | 50 – 100 | Percentage of budget at which warnings are emitted |
| `autoDegradation.enabled` | Toggle | `true` | boolean | Enable automatic degradation when budgets are constrained |
| `autoDegradation.degradationSteps` | Number[] | `[90, 80, 70, 60]` | Array of percentages | At each threshold, reduce LLM usage: 90% → cache-first, 80% → shorter prompts, 70% → mock mode, 60% → emergency stop |
| `autoDegradation.recoveryEnabled` | Toggle | `true` | boolean | Auto-recover when budget usage drops below recovery threshold |
| `autoDegradation.recoveryThreshold` | Number | `50` | 0 – 100 | Budget usage percentage below which recovery to normal mode occurs |
| `costEstimationMode` | Select | `"estimated"` | `"estimated"` \| `"actual"` \| `"off"` | How token costs are calculated: estimated (heuristic), actual (provider billing), off (no cost tracking) |

### 1.5 Admin Config Data Model

The complete configuration is stored as a single JSON object, persisted to disk as `config/admin-config.json`. The file is watched for changes and hot-reloaded.

```typescript
// ============================================================
// Admin Config Data Model
// ============================================================

interface AdminConfig {
  version: string;                    // Config schema version (e.g., "2.0.0")
  lastModified: ISO8601Timestamp;
  modifiedBy: string;                 // Username from Basic Auth

  // --- 1.1 Global Presence Controls ---
  global: GlobalPresenceConfig;

  // --- 1.2 Per-Agent Controls ---
  agents: Record<AgentId, AgentConfig>;

  // --- 1.3 Event Controls ---
  events: EventConfig;

  // --- 1.4 Token Budget Controls ---
  budget: BudgetConfig;

  // --- 3. Safety Guardrails ---
  safety: SafetyGuardrails;

  // --- 4. Admin Alert System ---
  alerts: AlertConfig;

  // --- 5. Session Management ---
  sessions: SessionConfig;

  // --- 6. Audit Trail ---
  audit: AuditConfig;
}

// ============================================================
// 1.1 Global Presence Config
// ============================================================

interface GlobalPresenceConfig {
  presenceEnabled: boolean;           // Master ON/OFF switch
  runtimeModeOverride: RuntimeMode;   // "auto" | "mock" | "development" | "production"
  globalTokenBudget: number;          // Max tokens across all sessions
  globalActionRateLimit: number;      // Actions per minute (LLM calls + events)
  globalEventRateLimit: number;       // Autonomous events per minute
  requireAuthForAdmin: boolean;       // HTTP Basic Auth required
  adminSessionTimeoutMinutes: number; // Admin panel auto-logout
  logLevel: LogLevel;                 // "debug" | "info" | "warn" | "error"
  showMockIndicator: boolean;         // Show mock indicator in user UI
  enableAuditTrail: boolean;          // Master audit logging switch
  emergencyCutoffEnabled: boolean;    // Auto-stop on budget exhaustion
}

type RuntimeMode = "auto" | "mock" | "development" | "production";
type LogLevel = "debug" | "info" | "warn" | "error";

// ============================================================
// 1.2 Per-Agent Config
// ============================================================

interface AgentConfig {
  // Identity & Status
  agentEnabled: boolean;
  agentName: string;
  agentDescription: string;

  // Behavior Sliders
  talkativeness: number;              // 0-100: probability of responding
  chaosLevel: number;                 // 0-100: creative deviation
  interruptionLevel: number;          // 0-100: autonomous interruption rate

  // Budget
  tokenBudget: number;                // Per-agent session token budget
  maxAutonomousEventsPerSession: number;
  responseTimeoutSeconds: number;     // LLM timeout before mock fallback

  // Event Filtering
  allowedEventTypes: string[];        // Whitelist (empty = all)
  blockedEventTypes: string[];        // Blacklist (takes priority)

  // Behavior Modifiers
  silenceModePreference: SilenceMode; // "default" | "silent" | "whisper" | "verbose"
  preferredLLMModel: string;          // "default" or model ID
  customSystemPrompt: string;         // Override (empty = default)
  useMemory: boolean;                 // Allow cached/template responses
}

type SilenceMode = "default" | "silent" | "whisper" | "verbose";

// ============================================================
// 1.3 Event Config
// ============================================================

interface EventConfig {
  autonomousEventsEnabled: boolean;
  autonomousEventMinIntervalSeconds: number;
  autonomousEventMaxIntervalSeconds: number;
  perEventTypeCooldownSeconds: Record<string, number>; // { "news": 120, "reminder": 60 }
  maxEventsPerMinute: number;
  maxEventsPerSession: number;
  eventQueueSizeLimit: number;
  eventQueuePriorityEnabled: boolean;
  eventDeduplicationWindowSeconds: number;
  maxSimultaneousAgentResponses: number;
}

// ============================================================
// 1.4 Budget Config
// ============================================================

interface BudgetConfig {
  sessionTokenBudget: number;
  perMinuteTokenLimit: number;
  perAgentTokenBudget: number;        // Default per-agent budget
  emergencyCutoffThreshold: number;   // Percentage (0-100)
  warningThreshold: number;           // Percentage (0-100)
  autoDegradation: AutoDegradationConfig;
  costEstimationMode: CostMode;       // "estimated" | "actual" | "off"
}

interface AutoDegradationConfig {
  enabled: boolean;
  degradationSteps: number[];         // e.g., [90, 80, 70, 60]
  recoveryEnabled: boolean;
  recoveryThreshold: number;          // Percentage
}

type CostMode = "estimated" | "actual" | "off";

// ============================================================
// 3. Safety Guardrails
// ============================================================

interface SafetyGuardrails {
  // --- Hard Limits ---
  maxAutonomousEventsPerMinute: number;   // Default: 10
  maxLLMCallsPerSession: number;          // Default: 50
  maxLLMCallsPerMinute: number;           // Default: 20
  maxTokensPerSession: number;            // Default: 100000
  maxPayloadSizeBytes: number;            // Default: 65536 (64KB)
  maxEventsPerSession: number;            // Default: 100
  maxSilenceModeDurationMinutes: number;  // Default: 60

  // --- Auth & Logging ---
  requireAuthForAdmin: boolean;           // Default: true
  logAllLLMCalls: boolean;                // Default: true
  showMockIndicator: boolean;             // Default: true

  // --- Provider Resilience ---
  maxProviderErrorsBeforeMock: number;    // Default: 3 (consecutive)
  mockFallbackDurationMinutes: number;    // Default: 10 (mock mode after errors)
  providerHealthCheckIntervalSeconds: number; // Default: 60

  // --- Rate Limiting ---
  rateLimitWindowSeconds: number;         // Default: 60
  maxRequestsPerWindow: number;           // Default: 100

  // --- Abuse Prevention ---
  maxSessionDurationMinutes: number;      // Default: 120
  maxConcurrentSessions: number;          // Default: 10
  blockRepeatedPayloads: boolean;         // Default: true
  repeatedPayloadWindowSeconds: number;   // Default: 30
}

// ============================================================
// 4. Alert Config
// ============================================================

interface AlertConfig {
  enabled: boolean;
  budgetWarningPercentages: number[];     // Default: [50, 75, 90]
  rateLimitWarningEnabled: boolean;       // Default: true
  providerErrorAlertThreshold: number;    // Default: 3 (errors before alert)
  unusualActivityEnabled: boolean;        // Default: true
  unusualActivityThresholdSigma: number;  // Default: 3.0 (standard deviations)
  alertDeliveryMethods: AlertDelivery[];  // Default: ["admin-log"]
  webhookUrl?: string;                    // Optional webhook for external alerts
  emailRecipients?: string[];             // Future: email notifications
  alertCooldownSeconds: number;           // Default: 300 (deduplication window)
  activityBaselineWindowMinutes: number;  // Default: 60 (for spike detection)
}

type AlertDelivery = "admin-log" | "webhook" | "email" | "sms";

// ============================================================
// 5. Session Config
// ============================================================

interface SessionConfig {
  sessionTimeoutMinutes: number;          // Auto-reset after inactivity
  maxSessionDurationMinutes: number;      // Hard session cap
  enableCostSummary: boolean;             // Show session cost in admin
  allowForceEnd: boolean;                 // Admin can kill sessions
  maxSessionHistoryCount: number;         // How many recent sessions to keep
  persistSessionHistory: boolean;         // Store history beyond runtime
  sessionCostDisplayPrecision: number;    // Decimal places for cost display
}

// ============================================================
// 6. Audit Config
// ============================================================

interface AuditConfig {
  enabled: boolean;
  logLLMCalls: boolean;
  logAutonomousEvents: boolean;
  logConfigChanges: boolean;
  logProviderErrors: boolean;
  detailedRetentionDays: number;          // Default: 7
  summaryRetentionDays: number;           // Default: 30
  logRotationEnabled: boolean;            // Auto-rotate log files
  maxLogFileSizeMB: number;               // Default: 100
  auditLogPath: string;                   // Default: "logs/audit/"
}
```

### 1.6 Admin Panel UI Layout

The existing 6 admin panels are extended with 4 new sections. The nav sidebar becomes:

```
┌─────────────────────────────────────┐
│  Agent Portal  v2.0          🔴 LIVE │
├─────────────────────────────────────┤
│  📊 Dashboard              (NEW)    │
│  🔑 API Keys                        │
│  🤖 Agent Config         ← expanded │
│     · Agent List                    │
│     · Per-Agent Settings            │
│  ⚡ Autonomous Loop      ← expanded │
│     · Timing & Intervals            │
│     · Event Type Cooldowns          │
│  🚦 Presence Settings    (NEW)      │
│     · Master Switch                 │
│     · Runtime Override              │
│     · Global Budget                 │
│  💰 Budget Controls      (NEW)      │
│     · Session Budget                │
│     · Degradation Steps             │
│     · Cost Estimation               │
│  🛡️ Safety Guardrails    (NEW)      │
│     · Hard Limits                   │
│     · Provider Resilience           │
│     · Rate Limiting                 │
│  🚩 Feature Flags                   │
│  ✏️ Prompt Editor                   │
│  📋 System Logs                     │
│  🔔 Alerts               (NEW)      │
│  📁 Audit Trail          (NEW)      │
│  🎮 Session Mgmt         (NEW)      │
├─────────────────────────────────────┤
│  Runtime: PRODUCTION      🟢        │
│  Budget: 23% used                   │
│  Sessions: 3 active                 │
└─────────────────────────────────────┘
```

---

## 2. Safety & Trust Framework

### 2.1 Transparency Rules

**Rule T1 — No False Capability Claims:**
Agents must not claim capabilities they do not possess. If an agent is in mock mode, it must not claim to be "browsing the web," "accessing real-time data," or performing any action it cannot actually do. The system prompt must include a capability manifest, and the agent's response generator must cross-check claims against this manifest.

**Rule T2 — Mock Response Distinguishability:**
When the system is in mock mode (or an individual agent is using mock/cached responses), the user-facing UI must display a **subtle but persistent indicator**. This is never hidden and never dismissible. The indicator communicates: "This response was generated locally without an external AI service."

**Rule T3 — Memory Attribution Cue:**
When an agent uses a cached or template response, a small visual cue (e.g., "from memory" tag) is appended to the message. This cue is:
- Visible on hover or as a persistent micro-label
- Non-intrusive (small font, muted color)
- Never deceptive about the response origin

**Rule T4 — Action Traceability:**
Every agent action (LLM call, autonomous event, config change) must be traceable in the admin logs. Actions are logged with:
- Timestamp (UTC)
- Agent ID
- Action type
- Trigger (what caused it)
- Outcome (what happened)
- Resource cost (tokens, time)

**Rule T5 — Mode Disclosure:**
The admin panel must always display the current runtime mode prominently. If the system has auto-degraded to mock mode, a banner appears explaining why and how to recover.

### 2.2 Abuse Prevention

**Rule A1 — No Infinite Autonomous Loops:**
The autonomous event system has hard stop rules (see Section 3.2). An agent cannot trigger more than `maxAutonomousEventsPerSession` events per session, and the system cannot exceed `maxEventsPerMinute` globally. These limits are enforced at the event queue level, not just configurable — they are hard-coded minimums that cannot be overridden above dangerous thresholds.

**Rule A2 — No Invisible API Calls:**
Every LLM API call is logged. There are no "silent" API calls. The `logAllLLMCalls` guardrail (default: true) ensures all calls appear in the audit trail with model name, input/output tokens, latency, and cost estimate.

**Rule A3 — Budget Exhaustion = Automatic Mock Mode:**
When any budget threshold (session, per-agent, global) is exhausted, the system automatically:
1. Stops all LLM API calls for the affected scope
2. Falls back to mock responses
3. Logs the transition reason
4. Displays a mock indicator to the user
5. Alerts the admin (if alert system is enabled)

**Rule A4 — Rate Limiting on All API Routes:**
All API routes (including admin routes) enforce rate limiting:
- Standard routes: `maxRequestsPerWindow` per `rateLimitWindowSeconds`
- Admin routes: 30 requests per minute (separate, stricter limit)
- LLM proxy routes: `maxLLMCallsPerMinute` per session
- Exceeded limits return HTTP 429 with `Retry-After` header

**Rule A5 — Max Payload Sizes Enforced:**
All request bodies are validated against `maxPayloadSizeBytes` (default: 64KB). Oversized payloads are rejected with HTTP 413 before processing.

**Rule A6 — Session Duration Caps:**
No session can exceed `maxSessionDurationMinutes`. Sessions are force-terminated at this limit with a graceful shutdown message.

**Rule A7 — Concurrent Session Limits:**
The system enforces `maxConcurrentSessions`. New sessions beyond this limit are rejected with HTTP 503 and a "system at capacity" message.

### 2.3 User Control

**Rule U1 — User Mute/Pause:**
Every agent interaction UI includes a **mute/pause button**:
- **Mute:** Agent stops responding but remains visible. Autonomous events from this agent are suppressed.
- **Pause:** All agents stop. Autonomous loop is paused for the session.
- **Resume:** Restores normal operation.
- Visual state: Muted agents show a muted icon overlay. Paused sessions show a banner.

**Rule U2 — Card Dismissal:**
All cards/spawned UI elements from agents can be dismissed by the user. Dismissal:
- Removes the card from the user's view
- Logs the dismissal event (agentId, cardType, timestamp)
- Does not affect the agent's state or future behavior

**Rule U3 — Agent Selection:**
Users can select which agents are active in their session. Inactive agents:
- Do not respond to events
- Do not trigger autonomous events
- Remain visible in the agent roster but marked as "inactive"

**Rule U4 — Do Not Disturb:**
A global "Do Not Disturb" mode is available to the user. When active:
- No autonomous events are triggered
- Agent responses are queued, not displayed
- A badge shows the number of queued messages
- DND can be scheduled (e.g., "DND until 9am")

### 2.4 Data Ethics

**Rule D1 — No Fake Memory Claims:**
Agents must not claim to "remember" things from previous sessions unless explicitly in demo mode with a visible indicator. In production mode, each session starts with no prior context. If an agent references "memory," it must be from the current session only.

**Rule D2 — No False Browsing/Scraping Claims:**
Agents must not claim to have "browsed the web," "searched the internet," or "scraped data" unless they have actually done so through an integrated tool. Mock mode responses must never include such claims.

**Rule D3 — No Hidden Data Collection:**
All data collection is transparent:
- Session data is used only for the current session
- Audit logs contain operational data only (no user PII)
- No telemetry or analytics beyond operational logging
- The privacy policy is accessible from the UI footer

**Rule D4 — Session Data Ephemerality:**
Session data is not persisted beyond 24 hours (already enforced by event store). This includes:
- Chat history
- Agent state
- Session-level configuration
- Cost summaries (retained in audit log, not session store)

**Rule D5 — Explicit Demo Mode:**
When the system is in mock or demo mode, this is never disguised. Demo mode features (fake memory, simulated browsing) are only available when:
- `runtimeMode` is explicitly set to `"mock"` or `"development"`
- The mock indicator is visible
- The admin panel shows a "DEMO MODE" banner

---

## 3. Automatic Safety Mechanisms

### 3.1 SafetyGuardrails Interface

```typescript
interface SafetyGuardrails {
  // --- Hard Limits (enforced, not just configurable) ---
  maxAutonomousEventsPerMinute: number;   // Default: 10
  maxLLMCallsPerSession: number;          // Default: 50
  maxLLMCallsPerMinute: number;           // Default: 20
  maxTokensPerSession: number;            // Default: 100000
  maxPayloadSizeBytes: number;            // Default: 65536
  maxEventsPerSession: number;            // Default: 100
  maxSilenceModeDurationMinutes: number;  // Default: 60

  // --- Auth & Logging ---
  requireAuthForAdmin: boolean;           // Default: true
  logAllLLMCalls: boolean;                // Default: true
  showMockIndicator: boolean;             // Default: true

  // --- Provider Resilience ---
  maxProviderErrorsBeforeMock: number;    // Default: 3
  mockFallbackDurationMinutes: number;    // Default: 10
  providerHealthCheckIntervalSeconds: number; // Default: 60

  // --- Rate Limiting ---
  rateLimitWindowSeconds: number;         // Default: 60
  maxRequestsPerWindow: number;           // Default: 100

  // --- Abuse Prevention ---
  maxSessionDurationMinutes: number;      // Default: 120
  maxConcurrentSessions: number;          // Default: 10
  blockRepeatedPayloads: boolean;         // Default: true
  repeatedPayloadWindowSeconds: number;   // Default: 30
}
```

### 3.2 Hard Stop Rules

These rules are **non-overrideable** — they are enforced at the code level with no admin bypass.

**HS1 — Budget Exhaustion → Stop Expensive Operations:**
```
IF (sessionTokensUsed >= sessionTokenBudget * emergencyCutoffThreshold / 100)
   OR (agentTokensUsed >= agentTokenBudget * emergencyCutoffThreshold / 100)
   OR (globalTokensUsed >= globalTokenBudget * emergencyCutoffThreshold / 100)
THEN
   → Block all new LLM API calls
   → Return mock responses for all agents in affected scope
   → Log emergency cutoff event
   → Emit admin alert (budget_exhausted)
   → Show mock indicator to user with "Budget limit reached" message
```

**HS2 — Rate Limit Hit → Return 429 + Log:**
```
IF (requestsInWindow >= maxRequestsPerWindow)
   OR (llmCallsInMinute >= maxLLMCallsPerMinute)
   OR (eventsInMinute >= maxEventsPerMinute)
THEN
   → Return HTTP 429 Too Many Requests
   → Set Retry-After header (seconds until window resets)
   → Log rate limit incident with client IP and route
   → Increment rate limit counter (for admin dashboard)
   → Emit admin alert (rate_limit) if threshold exceeded 3x in 10 min
```

**HS3 — Provider Error Cascade → Mock Fallback:**
```
IF (consecutiveProviderErrors >= maxProviderErrorsBeforeMock)
THEN
   → Switch to mock mode for all agents
   → Set mock mode timer for mockFallbackDurationMinutes
   → Log each provider error with error details
   → Emit admin alert (provider_cascade_failure)
   → Show banner: "AI service temporarily unavailable. Using local responses."
   → Schedule provider health check every providerHealthCheckIntervalSeconds
   → Auto-recover when health check passes (if recoveryEnabled)
```

**HS4 — Event Queue Full → Drop Lowest Priority:**
```
IF (eventQueue.length >= eventQueueSizeLimit)
THEN
   → Sort queued events by priority (user > system > autonomous)
   → Remove lowest-priority event(s) to make room
   → Log dropped events with reason "queue_overflow"
   → Emit admin alert (queue_overflow) if this occurs >3 times in 10 minutes
   → Never drop user-triggered events (hard rule)
```

**HS5 — Session Duration Exceeded → Force Termination:**
```
IF (sessionDuration >= maxSessionDurationMinutes)
THEN
   → Stop accepting new events for this session
   → Drain event queue (process remaining with mock responses)
   → Send termination message to user
   → Archive session summary to audit log
   → Free session resources
```

**HS6 — Payload Size Exceeded → Reject:**
```
IF (requestBodySize > maxPayloadSizeBytes)
THEN
   → Return HTTP 413 Payload Too Large
   → Log rejection with size and route
   → Do not process any part of the request
```

**HS7 — Concurrent Session Limit → Reject:**
```
IF (activeSessionCount >= maxConcurrentSessions)
THEN
   → Return HTTP 503 Service Unavailable
   → Include Retry-After: 60 header
   → Log rejection attempt
   → Show admin alert if sustained for >5 minutes
```

### 3.3 Degradation Cascade

The auto-degradation system provides graceful degradation as budgets are consumed:

```
Budget Usage    State              Behavior
─────────────────────────────────────────────────────────────────────────
  0% – 50%      NORMAL             Full LLM usage, all features enabled
 50% – 75%      HEALTHY            Normal operation, budget logged
 75% – 90%      WARNING            Cache-first policy: check cache before LLM
                                 Admin alert emitted (75% warning)
                                 Warning banner in admin panel
 90% – 95%      CONSTRAINED        Shortened prompts: reduce context window 50%
                                 Shorter max response length
                                 Admin alert emitted (90% warning)
 95% – 100%     EMERGENCY          Mock mode only: no LLM calls
                                 Emergency banner in admin + user UI
                                 All responses from templates/cache
100%+           CUTOFF             Complete stop: no responses from this scope
                                 Session force-ended if global budget
```

Recovery: When budget usage drops below `recoveryThreshold` (default 50%), the system returns to NORMAL state. Recovery is automatic if `recoveryEnabled` is true.

### 3.4 Event Queue Safety

The event queue implements several safety mechanisms:

```typescript
interface EventQueueSafety {
  // Priority levels (lower number = higher priority)
  priorityLevels: {
    USER_MESSAGE: 1;       // Always processed first
    SYSTEM_COMMAND: 2;     // Admin overrides
    AGENT_RESPONSE: 3;     // Normal agent replies
    AUTONOMOUS_EVENT: 4;   // Background events (lowest)
  };

  // Queue behaviors
  maxSize: number;                    // Hard limit on queue length
  deduplicationWindowMs: number;      // Within this window, identical events are merged
  maxAgeMs: number;                   // Events older than this are dropped
  drainOnShutdown: boolean;           // Process remaining events on graceful shutdown
  maxDrainTimeMs: number;             // Maximum time to wait for drain

  // Agent response limiting
  maxResponsesPerEvent: number;       // Max agents that can respond to one event
  minIntervalBetweenResponsesMs: number; // Throttle for the same agent
}
```

---

## 4. Admin Alert System

### 4.1 Alert Tiers

Alerts are organized into severity tiers:

| Tier | Color | Example | Action Required |
|------|-------|---------|-----------------|
| **INFO** | Blue | Budget at 50% | None — informational |
| **WARNING** | Yellow | Budget at 75%; rate limit hit 2x | Monitor — review soon |
| **CRITICAL** | Orange | Budget at 90%; provider errors 3x | Act — degradation imminent |
| **EMERGENCY** | Red | Budget exhausted; cascade failure | Immediate — system degraded |

### 4.2 Alert Triggers

**Budget Alerts:**
```
Trigger: budgetUsed / budgetTotal >= thresholdPercentage
  - 50%  → INFO     "Session budget at 50% (50,000 / 100,000 tokens)"
  - 75%  → WARNING  "Session budget at 75% — auto-degradation active"
  - 90%  → CRITICAL "Session budget at 90% — mock mode imminent"
  - 95%  → EMERGENCY "Session budget exhausted — emergency cutoff activated"
```

**Rate Limit Alerts:**
```
Trigger: rateLimitHits >= 3 within 10 minutes
  → WARNING "Rate limit exceeded 3 times on /api/chat — possible abuse"

Trigger: rateLimitHits >= 10 within 10 minutes
  → EMERGENCY "Sustained rate limiting — potential DDoS or runaway client"
```

**Provider Error Alerts:**
```
Trigger: consecutiveProviderErrors >= maxProviderErrorsBeforeMock
  → CRITICAL "Provider error cascade — switched to mock mode for 10 minutes"

Trigger: providerErrorRate > 50% over 5 minutes
  → WARNING "Elevated provider error rate — monitoring"
```

**Activity Spike Detection:**
```
Trigger: currentEventsPerMinute > baselineMean + (thresholdSigma * baselineStdDev)
  Baseline calculated over activityBaselineWindowMinutes (default: 60 min)
  
  → INFO     "Activity elevated: 25 events/min (baseline: 8, σ: 3.2)"
  → WARNING  "Unusual activity: 45 events/min (baseline: 8, σ: 3.2) — possible loop"
  → CRITICAL "Activity spike: 80 events/min (baseline: 8, σ: 3.2) — auto-throttling"
```

### 4.3 Delivery Methods

**Primary: Admin Log Entry (always)**
All alerts are written to the admin event feed with:
- Timestamp, tier, category, message, contextual data
- Actionable recommendations (e.g., "Review agent X settings" or "Check provider status")
- Acknowledge button (admin can mark as seen)
- Auto-expire: INFO alerts expire after 24h, others persist until acknowledged

**Secondary: Webhook (optional)**
```typescript
interface AlertWebhookPayload {
  timestamp: ISO8601Timestamp;
  tier: "info" | "warning" | "critical" | "emergency";
  category: "budget" | "rate_limit" | "provider" | "activity" | "system";
  message: string;
  context: Record<string, unknown>;
  recommendation: string;
  portalUrl: string;  // Deep link to relevant admin panel
}
```

**Future: Email/SMS**
- Email: SMTP configuration in alert config
- SMS: Twilio integration (future Phase)
- Only WARNING tier and above
- Rate-limited: max 1 email per alert category per hour

**Alert Deduplication:**
```
Same alert category + same scope (session/agent/global) within alertCooldownSeconds
  → Increment counter on existing alert
  → Do not create duplicate alert entry
  → Update "last occurred" timestamp
```

### 4.4 Activity Spike Detection Algorithm

```typescript
function detectActivitySpike(
  recentEvents: EventLog[],           // Last N minutes of events
  baselineWindowMinutes: number,       // Historical baseline window
  thresholdSigma: number               // Standard deviation multiplier
): SpikeAlert | null {
  
  // Calculate baseline from historical data
  const baselineEvents = getEventsFromWindow(
    recentEvents, 
    now - baselineWindowMinutes * 60 * 1000, 
    now
  );
  const eventsPerMinute = aggregateByMinute(baselineEvents);
  const mean = calculateMean(eventsPerMinute);
  const stdDev = calculateStdDev(eventsPerMinute);
  
  // Calculate current rate
  const currentWindow = getEventsFromWindow(recentEvents, now - 60 * 1000, now);
  const currentRate = currentWindow.length;
  
  // Detect spike
  if (currentRate > mean + thresholdSigma * stdDev) {
    const severity = currentRate > mean + 5 * stdDev ? "critical" 
                   : currentRate > mean + 3 * stdDev ? "warning" 
                   : "info";
    return {
      tier: severity,
      currentRate,
      baselineMean: mean,
      baselineStdDev: stdDev,
      sigma: (currentRate - mean) / stdDev,
      recommendation: severity === "critical" 
        ? "Auto-throttling engaged. Review event triggers."
        : "Monitor activity levels."
    };
  }
  return null;
}
```

---

## 5. Session Management

### 5.1 Session Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  INIT    │───→│ ACTIVE   │───→│ PAUSED   │───→│ ACTIVE   │───→│  ENDED   │
│          │    │          │    │ (user)   │    │ (resume) │    │          │
└──────────┘    └────┬─────┘    └──────────┘    └──────────┘    └──────────┘
                     │                                                ↑
                     │         ┌──────────┐    ┌──────────┐          │
                     └────────→│ DND MODE │───→│ ACTIVE   │──────────┘
                               │ (user)   │    │ (disable)│
                               └──────────┘    └──────────┘
                                                     ↑
                     ┌────────────────────────────────┘
                     │    ┌──────────┐
                     └───→│ TIMEOUT  │───────────────────────────────┐
                          │ (auto)   │                               │
                          └──────────┘                               │
                                                                     │
                     ┌───────────────────────────────────────────────┘
                     │    ┌──────────┐
                     └───→│ MAX DUR  │───────────────────────────────┘
                          │ (forced) │
                          └──────────┘
```

**State Definitions:**

| State | Trigger | Behavior |
|-------|---------|----------|
| `INIT` | Session created | Budget allocated, agent configs loaded, event queue initialized |
| `ACTIVE` | Normal operation | Full event processing, LLM calls allowed, autonomous loop running |
| `PAUSED` | User clicks pause | Event processing suspended, queue holds, no LLM calls, agents show "paused" state |
| `DND` | User enables DND | Autonomous events suppressed, user messages queued, badge shows count |
| `TIMEOUT` | Inactivity timeout | Auto-transition after `sessionTimeoutMinutes` of no user activity |
| `MAX_DUR` | Duration limit hit | Hard stop after `maxSessionDurationMinutes`, graceful termination |
| `ENDED` | Session closed | Resources freed, cost summary archived, audit log finalized |

### 5.2 Session Controls

**Available to Admin:**
- **View Active Sessions:** List of all active sessions with metadata
- **Force End Session:** Kill button with confirmation dialog. Reason is logged.
- **View Session Details:** Expand session to see agents, events, budget usage
- **Adjust Session Budget:** Modify token budget for an active session (emergency use)
- **Pause Session (Admin):** Admin-level pause that user cannot override

**Available to User:**
- **Pause/Resume:** Toggle session activity
- **DND Toggle:** Enable/disable do-not-disturb
- **Mute Agent:** Per-agent mute (survives session? No — session-scoped)
- **Switch Agent:** Change which agents are active

### 5.3 Session Cost Summary

Each session tracks and displays a cost summary:

```typescript
interface SessionCostSummary {
  sessionId: string;
  sessionStartTime: ISO8601Timestamp;
  sessionEndTime?: ISO8601Timestamp;
  sessionDurationSeconds: number;

  // Token usage breakdown
  tokensUsed: {
    total: number;
    byAgent: Record<AgentId, number>;
    byModel: Record<ModelId, number>;
  };

  // Budget tracking
  budgetAllocated: number;
  budgetUsed: number;
  budgetRemaining: number;
  budgetPercentage: number;        // 0-100

  // LLM call breakdown
  llmCalls: {
    total: number;
    successful: number;
    failed: number;
    mockFallback: number;
    averageLatencyMs: number;
  };

  // Events
  eventsTriggered: {
    total: number;
    userTriggered: number;
    autonomous: number;
    byEventType: Record<string, number>;
  };

  // Degradation history
  degradationEvents: Array<{
    timestamp: ISO8601Timestamp;
    fromState: DegradationState;
    toState: DegradationState;
    reason: string;
  }>;

  // Cost estimation
  estimatedCostUsd?: number;       // Only if costEstimationMode is "estimated"
}
```

**Display Format (Admin Panel):**
```
┌─────────────────────────────────────────────────────────────┐
│  Session: sess_abc123                    Status: ACTIVE 🟢  │
│  Started: 2024-01-15 14:23:07          Duration: 47m 12s   │
├─────────────────────────────────────────────────────────────┤
│  BUDGET                                                     │
│  ████████████░░░░░░░░  23% used (23,142 / 100,000 tokens)   │
│                                                             │
│  TOKENS BY AGENT                                            │
│  Alice    ████████████  12,400 tokens (12 LLM calls)        │
│  Bob      ██████░░░░░░   6,200 tokens ( 8 LLM calls)        │
│  Carol    ████░░░░░░░░   4,542 tokens ( 5 LLM calls)        │
│                                                             │
│  EVENTS              Total: 34  (User: 12, Auto: 22)        │
│  LLM CALLS           Total: 25  (OK: 23, Fail: 1, Mock: 1)  │
│  AVG LATENCY         1,240ms                                │
│  EST. COST           $0.04                                  │
├─────────────────────────────────────────────────────────────┤
│  [Force End]  [Adjust Budget]  [View Logs]  [Pause]         │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Session History

The admin panel maintains a session history view:

```typescript
interface SessionHistoryEntry {
  sessionId: string;
  startTime: ISO8601Timestamp;
  endTime: ISO8601Timestamp;
  durationMinutes: number;
  endReason: "user_close" | "timeout" | "max_duration" | "budget_exhausted" | "admin_force" | "error";
  budgetUsed: number;
  budgetAllocated: number;
  llmCallCount: number;
  eventCount: number;
  agentsActive: AgentId[];
  degradationMaxLevel: DegradationState;
}
```

**History Display:**
- Shows last N sessions (configurable via `maxSessionHistoryCount`, default 50)
- Sortable by start time, duration, budget used
- Filterable by end reason, agent involved
- Each entry expandable to full SessionCostSummary
- "Export" button for CSV download

---

## 6. Audit Trail

### 6.1 Event Types

The audit trail records four categories of events:

**Category 1: LLM Calls**
Every LLM API invocation, regardless of success/failure.

**Category 2: Autonomous Events**
Every event in the autonomous loop: trigger, decision, emission.

**Category 3: Config Changes**
Every modification to admin configuration.

**Category 4: Provider Errors**
Every LLM provider error and recovery action.

### 6.2 Log Schema

```typescript
// ============================================================
// Base Audit Log Entry
// ============================================================

interface AuditLogEntry {
  id: string;                         // ULID
  timestamp: ISO8601Timestamp;
  category: "llm_call" | "autonomous_event" | "config_change" | "provider_error" | "session" | "safety";
  severity: "info" | "warning" | "error" | "critical";
  actor: string;                      // "user:xxx" | "agent:xxx" | "system" | "admin:xxx"
  sessionId?: string;
  agentId?: string;
  message: string;
  details: Record<string, unknown>;
}

// ============================================================
// Category 1: LLM Call Log
// ============================================================

interface LLMCallLog extends AuditLogEntry {
  category: "llm_call";
  details: {
    model: string;                    // e.g., "gpt-4", "claude-3-sonnet"
    provider: string;                 // e.g., "openai", "anthropic"
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latencyMs: number;
    costEstimateUsd?: number;
    promptPreview: string;            // First 200 chars of prompt
    responsePreview: string;          // First 200 chars of response
    cacheHit: boolean;                // Was this served from cache?
    mockMode: boolean;                // Was this a mock response?
    success: boolean;
    errorMessage?: string;
  };
}

// ============================================================
// Category 2: Autonomous Event Log
// ============================================================

interface AutonomousEventLog extends AuditLogEntry {
  category: "autonomous_event";
  details: {
    trigger: string;                  // What triggered this event
    triggerTimestamp: ISO8601Timestamp;
    decision: "proceed" | "skip" | "throttle" | "degraded";
    decisionReason: string;           // Why this decision was made
    eventsEmitted: Array<{
      eventType: string;
      targetAgent: string;
      priority: number;
    }>;
    agentTalkativeness: number;       // Slider value at time of event
    agentChaosLevel: number;          // Slider value at time of event
    cooldownApplied: boolean;
    cooldownDurationMs?: number;
  };
}

// ============================================================
// Category 3: Config Change Log
// ============================================================

interface ConfigChangeLog extends AuditLogEntry {
  category: "config_change";
  details: {
    changedBy: string;                // Username from Basic Auth
    changeType: "create" | "update" | "delete";
    scope: "global" | "agent" | "event" | "budget" | "safety" | "alert" | "session" | "audit";
    targetId?: string;                // Agent ID if agent-scoped
    fieldPath: string;                // Dot-notation path: "global.presenceEnabled"
    oldValue: unknown;
    newValue: unknown;
    configVersion: string;            // Config version after change
  };
}

// ============================================================
// Category 4: Provider Error Log
// ============================================================

interface ProviderErrorLog extends AuditLogEntry {
  category: "provider_error";
  details: {
    provider: string;
    model: string;
    errorType: "timeout" | "rate_limit" | "auth" | "server_error" | "network" | "unknown";
    errorMessage: string;
    errorCode?: string;               // HTTP status or API error code
    consecutiveErrors: number;        // How many consecutive errors
    recoveryAction: "retry" | "mock_fallback" | "circuit_breaker" | "none";
    retryAttempt?: number;
    mockFallbackDurationMinutes?: number;
    nextHealthCheckAt?: ISO8601Timestamp;
  };
}

// ============================================================
// Category 5: Session Lifecycle Log
// ============================================================

interface SessionLog extends AuditLogEntry {
  category: "session";
  details: {
    event: "created" | "paused" | "resumed" | "dnd_enabled" | "dnd_disabled" | "timeout" | "max_duration" | "force_ended" | "closed";
    budgetAllocated: number;
    activeAgents: string[];
    endReason?: string;
    durationSeconds?: number;
    forceEndedBy?: string;            // Admin username if force-ended
  };
}

// ============================================================
// Category 6: Safety Event Log
// ============================================================

interface SafetyLog extends AuditLogEntry {
  category: "safety";
  details: {
    rule: string;                     // Which safety rule triggered
    triggerType: "budget_exhausted" | "rate_limit" | "queue_overflow" | "payload_oversized" | "session_timeout" | "provider_cascade" | "degradation";
    action: string;                   // What action was taken
    scope: "global" | "session" | "agent";
    scopeId: string;
    thresholds?: Record<string, number>;
  };
}
```

### 6.3 Retention Policy

```
┌────────────────────────────────────────────────────────────────┐
│                     RETENTION POLICY                           │
├──────────────────┬───────────────────┬─────────────────────────┤
│  Log Category    │  Detailed Logs    │  Summaries              │
├──────────────────┼───────────────────┼─────────────────────────┤
│  LLM Calls       │  7 days           │  30 days (aggregated)   │
│  Autonomous      │  7 days           │  30 days (aggregated)   │
│  Config Changes  │  30 days          │  90 days (full)         │
│  Provider Errors │  7 days           │  30 days (aggregated)   │
│  Session Events  │  7 days           │  30 days (aggregated)   │
│  Safety Events   │  30 days          │  90 days (full)         │
└──────────────────┴───────────────────┴─────────────────────────┘

Aggregation means:
  - Hourly: event count, token sum, error count
  - Daily: session count, total cost, peak usage
  - No individual call details retained beyond detailed period
```

### 6.4 Admin Log Viewer

The audit trail is accessible via **Admin Panel → Audit Trail**:

**Filters:**
- Date range picker
- Category checkboxes (LLM Calls, Events, Config, Errors, Session, Safety)
- Severity dropdown
- Agent selector
- Session ID search
- Free-text search in message field

**Display Columns:**
- Timestamp (with millisecond precision)
- Category (color-coded icon)
- Severity (color badge)
- Actor
- Agent (if applicable)
- Message (truncated, expandable)
- Actions: [View Details] [Jump to Session]

**Export:**
- CSV export of filtered results
- JSON export for programmatic access
- Max export: 10,000 rows (paginated)

---

## 7. UX: Mock Indicator & User Controls

### 7.1 Mock Indicator Design

**Requirements:**
- Always visible when mock mode is active (never dismissible, never hidden)
- Subtle — does not obstruct content
- Informative — explains what "mock mode" means
- Accessible — meets WCAG AA contrast standards

**Visual Design:**

```
Position: Fixed, bottom-right corner (above user controls)
Size: Compact — ~180px × 32px (collapsed), expandable
```

**Collapsed State:**
```
┌──────────────────────────┐
│  🟡  Local Mode    [?]   │
└──────────────────────────┘
  ↑ muted yellow dot     ↑ hover for tooltip
```

**Expanded State (on click/hover):**
```
┌──────────────────────────────────┐
│  🟡  Local Response Mode         │
│                                  │
│  Responses are generated         │
│  locally without an external     │
│  AI service.                     │
│                                  │
│  Reason: Budget threshold met    │
│  Recovery: Auto (ETA 14 min)     │
│                                  │
│  [Learn more]  [Admin Panel]     │
└──────────────────────────────────┘
```

**Color Coding:**

| Mode | Dot | Banner BG | Text |
|------|-----|-----------|------|
| Mock (budget) | Yellow #F59E0B | Yellow-50 | Yellow-900 |
| Mock (provider error) | Orange #F97316 | Orange-50 | Orange-900 |
| Mock (admin override) | Blue #3B82F6 | Blue-50 | Blue-900 |
| Development | Purple #8B5CF6 | Purple-50 | Purple-900 |
| Production (LLM active) | Green #22C55E | — (no banner) | — |

**States:**
- **Production:** No indicator (green dot only in admin panel)
- **Development:** Purple indicator "Dev Mode"
- **Mock (any reason):** Yellow/orange/blue indicator "Local Mode" with reason

### 7.2 User Mute/Pause Controls

**Agent-Level Mute Button:**
```
On each agent avatar/card in the UI:

┌──────────────┐
│  [Avatar]    │
│   Alice      │
│  🤖          │
│              │
│  [🔊] [⏸️]  │  ← speaker = mute toggle, pause = pause agent
└──────────────┘

Muted state:
┌──────────────┐
│  [Avatar]    │
│   Alice      │
│  🤖 🔇       │  ← muted overlay icon
│   MUTED      │  ← label
│              │
│  [🔇] [▶️]  │  ← unmute / resume
└──────────────┘
```

**Session-Level Pause Button:**
```
Top-right of the session UI:

Paused state banner:
┌─────────────────────────────────────────────────┐
│  ⏸️  Session Paused                             │
│      All agents are paused. Autonomous events   │
│      are disabled. [Resume Session]             │
└─────────────────────────────────────────────────┘
```

**DND Toggle:**
```
Settings menu or quick-access toolbar:

[🔕] Do Not Disturb  → Toggle on/off

When DND is active:
┌─────────────────────────────────────────────────┐
│  🔕 Do Not Disturb — 3 messages queued          │
│      [Disable DND]  [Snooze 30 min]             │
└─────────────────────────────────────────────────┘
```

### 7.3 Card Dismissal

Every card spawned by an agent includes a dismiss action:

```
Agent Card:
┌─────────────────────────────────────────────────┐
│  🤖 Alice                              [✕]      │  ← dismiss button
│  ─────────────────────────────────────────────  │
│  Here's what I found about your request...      │
│                                                 │
│  [Action 1]  [Action 2]                         │
└─────────────────────────────────────────────────┘
```

- **Dismiss (✕):** Card animates out (slide up + fade). Logged: `{ type: "card_dismissed", agentId, cardType, timestamp }`
- **Keyboard:** ESC key dismisses the most recent card
- **Bulk dismiss:** "Dismiss All" button clears all visible cards
- **Auto-dismiss:** Cards can auto-dismiss after N minutes of inactivity (configurable, default: never)

### 7.4 Agent Selection UI

Users can control which agents are active:

```
Agent Roster (sidebar or panel):

┌─────────────────────────────────┐
│  Active Agents                  │
│  ─────────────────────────────  │
│  ☑️ Alice  [●] online           │
│  ☑️ Bob    [●] online           │
│  ☐ Carol  [○] offline          │  ← unchecked = inactive
│  ☑️ Dave   [●] online           │
│                                 │
│  [Select All]  [Deselect All]   │
│                                 │
│  Add Agent: [______] [+]        │
└─────────────────────────────────┘
```

- **Checkbox:** Toggle agent active/inactive
- **Online indicator:** Shows agent connection status
- **Mute per agent:** Individual mute without deactivating
- **Reorder:** Drag to change agent priority (response order)

---

## Appendix A: Configuration File Example

```json
{
  "version": "2.0.0",
  "lastModified": "2024-01-15T14:23:07Z",
  "modifiedBy": "admin",
  "global": {
    "presenceEnabled": true,
    "runtimeModeOverride": "auto",
    "globalTokenBudget": 1000000,
    "globalActionRateLimit": 120,
    "globalEventRateLimit": 30,
    "requireAuthForAdmin": true,
    "adminSessionTimeoutMinutes": 30,
    "logLevel": "info",
    "showMockIndicator": true,
    "enableAuditTrail": true,
    "emergencyCutoffEnabled": true
  },
  "agents": {
    "alice": {
      "agentEnabled": true,
      "agentName": "Alice",
      "agentDescription": "General assistant",
      "talkativeness": 50,
      "chaosLevel": 10,
      "interruptionLevel": 20,
      "tokenBudget": 100000,
      "maxAutonomousEventsPerSession": 20,
      "responseTimeoutSeconds": 30,
      "allowedEventTypes": [],
      "blockedEventTypes": ["sensitive_topic"],
      "silenceModePreference": "default",
      "preferredLLMModel": "default",
      "customSystemPrompt": "",
      "useMemory": true
    }
  },
  "events": {
    "autonomousEventsEnabled": true,
    "autonomousEventMinIntervalSeconds": 30,
    "autonomousEventMaxIntervalSeconds": 300,
    "perEventTypeCooldownSeconds": {
      "news": 120,
      "reminder": 60,
      "greeting": 30
    },
    "maxEventsPerMinute": 10,
    "maxEventsPerSession": 100,
    "eventQueueSizeLimit": 50,
    "eventQueuePriorityEnabled": true,
    "eventDeduplicationWindowSeconds": 60,
    "maxSimultaneousAgentResponses": 3
  },
  "budget": {
    "sessionTokenBudget": 100000,
    "perMinuteTokenLimit": 10000,
    "perAgentTokenBudget": 50000,
    "emergencyCutoffThreshold": 95,
    "warningThreshold": 75,
    "autoDegradation": {
      "enabled": true,
      "degradationSteps": [90, 80, 70, 60],
      "recoveryEnabled": true,
      "recoveryThreshold": 50
    },
    "costEstimationMode": "estimated"
  },
  "safety": {
    "maxAutonomousEventsPerMinute": 10,
    "maxLLMCallsPerSession": 50,
    "maxLLMCallsPerMinute": 20,
    "maxTokensPerSession": 100000,
    "maxPayloadSizeBytes": 65536,
    "maxEventsPerSession": 100,
    "maxSilenceModeDurationMinutes": 60,
    "requireAuthForAdmin": true,
    "logAllLLMCalls": true,
    "showMockIndicator": true,
    "maxProviderErrorsBeforeMock": 3,
    "mockFallbackDurationMinutes": 10,
    "providerHealthCheckIntervalSeconds": 60,
    "rateLimitWindowSeconds": 60,
    "maxRequestsPerWindow": 100,
    "maxSessionDurationMinutes": 120,
    "maxConcurrentSessions": 10,
    "blockRepeatedPayloads": true,
    "repeatedPayloadWindowSeconds": 30
  },
  "alerts": {
    "enabled": true,
    "budgetWarningPercentages": [50, 75, 90],
    "rateLimitWarningEnabled": true,
    "providerErrorAlertThreshold": 3,
    "unusualActivityEnabled": true,
    "unusualActivityThresholdSigma": 3.0,
    "alertDeliveryMethods": ["admin-log"],
    "alertCooldownSeconds": 300,
    "activityBaselineWindowMinutes": 60
  },
  "sessions": {
    "sessionTimeoutMinutes": 30,
    "maxSessionDurationMinutes": 120,
    "enableCostSummary": true,
    "allowForceEnd": true,
    "maxSessionHistoryCount": 50,
    "persistSessionHistory": true,
    "sessionCostDisplayPrecision": 4
  },
  "audit": {
    "enabled": true,
    "logLLMCalls": true,
    "logAutonomousEvents": true,
    "logConfigChanges": true,
    "logProviderErrors": true,
    "detailedRetentionDays": 7,
    "summaryRetentionDays": 30,
    "logRotationEnabled": true,
    "maxLogFileSizeMB": 100,
    "auditLogPath": "logs/audit/"
  }
}
```

---

## Appendix B: Implementation Checklist

### Admin Controls
- [ ] Global presence master switch
- [ ] Runtime mode override dropdown
- [ ] Global token budget input
- [ ] Global rate limit inputs
- [ ] Per-agent configuration panel
- [ ] Talkativeness/chaos/interruption sliders
- [ ] Per-agent token budget input
- [ ] Event type allow/block checkboxes
- [ ] Silence mode preference dropdown
- [ ] LLM model selector
- [ ] Custom system prompt textarea
- [ ] Autonomous event interval inputs
- [ ] Per-event-type cooldown table
- [ ] Event queue size limit input
- [ ] Budget thresholds (warning, emergency)
- [ ] Auto-degradation step configuration
- [ ] Config JSON file persistence
- [ ] Config hot-reload watcher
- [ ] Config validation on save
- [ ] Config change audit logging

### Safety Guardrails
- [ ] SafetyGuardrails interface implementation
- [ ] Hard stop rule: budget exhaustion
- [ ] Hard stop rule: rate limiting (429 responses)
- [ ] Hard stop rule: provider error cascade
- [ ] Hard stop rule: event queue overflow
- [ ] Hard stop rule: session duration cap
- [ ] Hard stop rule: payload size enforcement
- [ ] Hard stop rule: concurrent session limit
- [ ] Auto-degradation cascade implementation
- [ ] Recovery mechanism from degraded states
- [ ] Provider health check scheduler
- [ ] Repeated payload detection & blocking

### Transparency
- [ ] Mock indicator UI component
- [ ] Mock indicator color coding by reason
- [ ] "From memory" cue on cached responses
- [ ] Capability manifest in system prompts
- [ ] Mode disclosure banner in admin panel
- [ ] Demo mode explicit labeling

### User Controls
- [ ] Agent mute/unmute button
- [ ] Session pause/resume button
- [ ] DND toggle with queue badge
- [ ] Card dismissal (click + keyboard)
- [ ] Bulk card dismiss
- [ ] Agent selection checkboxes
- [ ] Agent reordering

### Alert System
- [ ] Alert tier classification
- [ ] Budget alert triggers (50%, 75%, 90%)
- [ ] Rate limit alert triggers
- [ ] Provider error alert triggers
- [ ] Activity spike detection algorithm
- [ ] Alert deduplication logic
- [ ] Admin log alert delivery
- [ ] Webhook alert delivery
- [ ] Alert acknowledgment UI

### Session Management
- [ ] Session state machine
- [ ] Inactivity timeout detection
- [ ] Max session duration enforcement
- [ ] Session cost tracking
- [ ] Session cost summary UI
- [ ] Active sessions list in admin
- [ ] Force-end session button
- [ ] Session history with pagination
- [ ] Session history filters
- [ ] CSV/JSON export

### Audit Trail
- [ ] LLM call log schema + writing
- [ ] Autonomous event log schema + writing
- [ ] Config change log schema + writing
- [ ] Provider error log schema + writing
- [ ] Session lifecycle log schema + writing
- [ ] Safety event log schema + writing
- [ ] Log retention implementation
- [ ] Log rotation implementation
- [ ] Admin log viewer UI with filters
- [ ] Log export functionality

---

*Document version: 1.0.0*
*Scope: Architecture — implementation-ready*
*Estimated implementation effort: 3-4 sprints*
