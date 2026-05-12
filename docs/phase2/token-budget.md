# Agent Portal Phase 2 -- Token Budget & Cost Control Architecture

## Overview

This document defines the **Cost Control System** -- the budget enforcement, rate limiting, and graceful degradation layer that keeps Agent Portal affordable while preserving the "magical" user experience. Every API call costs real money (via OpenRouter). The system ensures the agent feels alive even when budget is exhausted.

**Core Principle**: *Free events must feel delightful. Cheap events must feel personal. Expensive events must earn their cost.*

---

## 1. Cost Tier System

Every event in the system is classified into one of three tiers at registration time. Classification is immutable once defined -- an event's tier is part of its contract.

### 1.1 Tier Classification Matrix

| Tier | Description | Approx. Cost | Cumulative Limit |
|------|-------------|-------------|------------------|
| **Free** | Zero external API calls, pure visual/audio feedback | $0.00000 | Unlimited (rate-limited only) |
| **Cheap** | Cache/template-based responses, no LLM inference | $0.00001 - $0.00100 | 100/session |
| **Expensive** | Full LLM inference via OpenRouter, external agent calls | $0.00100 - $0.05000 | 20/session |

### 1.2 Free Events (Tier 0)

Zero API cost. These are visual, audio, and state transitions driven entirely by the client-side animation engine and local state.

**Free events list:**

| Event Type | Description | Fallback |
|-----------|-------------|----------|
| `eye:blink` | Agent eye blink animation | Always works |
| `eye:emotion` | Emotion change (happy, curious, sleepy, surprised) | Always works |
| `agent:idle_float` | Floating/breathing idle animation | Always works |
| `particle:behavior` | Particle system behavior change | Always works |
| `card:shuffle` | Card deck shuffle/rearrange animation | Always works |
| `card:hover_react` | Card hover highlight + micro-reaction | Always works |
| `ui:repaint` | Theme change, color transition, layout shift | Always works |
| `ui:theme_change` | Full theme switch (dark/light/seasonal) | Always works |
| `sound:cue` | UI sound effect (if audio enabled) | Silent fallback |
| `silence:enter` | Enter silence/ambient mode | Always works |
| `silence:exit` | Exit silence mode back to active | Always works |
| `template:phrase` | Pre-written phrase from local cache (no generation) | Next template in list |
| `visual:effect` | Repaint, glow, transition, particle burst | Always works |
| `agent:micro_expression` | Brief facial expression change | Always works |
| `state:transition` | Internal state machine transitions | Always works |

**Free event rules:**
- **No rate-limiting penalty for the first 500 free events per session.** After 500, apply a soft throttle: max 10 free events per second to prevent abuse.
- Free events never touch the token budget counter.
- Free events always execute immediately -- no budget check required.

### 1.3 Cheap Events (Tier 1)

Minimal cost -- these use pre-built responses, cached data, or simple fill-in-the-blank templates. No LLM inference.

**Cheap events list:**

| Event Type | Description | Typical Tokens | Fallback |
|-----------|-------------|---------------|----------|
| `message:template` | Short greeting/farewell from template pool | 0 (cached) | Next template |
| `message:cached` | Response from recent cache (< 5 min TTL) | 0 (cached) | Generate fresh |
| `summary:simple` | Summary from stored context (no API call) | 0 (local compute) | Skip summary |
| `status:update` | Agent status from cached state | 0 (cached) | Static fallback |
| `feed:cached` | Feed item from pre-fetched data | 0 (cached) | Empty feed |
| `quip:templated` | Fill-in-the-blank quip ("Nice weather, {name}!") | 0 (template) | Generic quip |
| `weather:cached` | Weather from recent fetch (5-min cache) | 0 (cached) | "Weather unavailable" |
| `news:headline` | Cached headline (no live fetch) | 0 (cached) | Skip |
| `agent:persona_shift` | Switch agent persona from local definition | 0 (local) | Default persona |
| `reminder:list` | List cached reminders | 0 (cached) | "No reminders" |

**Cheap event rules:**
- Each cheap event costs **0 tokens from the budget** (but increments the cheapActionsUsed counter).
- Max **100 cheap events per session** (configurable via BudgetConfig).
- When cheap event limit exceeded, fall back to: free visual events + template responses.
- Template cache miss: attempt to serve next available template before falling back.

### 1.4 Expensive Events (Tier 2)

Full API calls to external providers. These are the budget killers and must be strictly controlled.

**Expensive events list:**

| Event Type | Description | Typical Tokens (input+output) | Avg Cost | Fallback |
|-----------|-------------|------------------------------|----------|----------|
| `llm:chat_completion` | OpenRouter chat completion (general chat) | 500-2000 | $0.002-0.010 | Cached response |
| `llm:research_query` | Research-oriented completion (longer) | 2000-8000 | $0.010-0.040 | Template answer |
| `llm:report_generation` | Full report (multi-paragraph) | 3000-10000 | $0.015-0.050 | "Report unavailable" |
| `llm:long_explanation` | Detailed explanation response | 2000-6000 | $0.010-0.030 | Short summary |
| `agent:openclaw_call` | External tool call via OpenClaw | 1000-5000 | $0.005-0.025 | Template result |
| `agent:hermes_call` | External agent call via Hermes | 1000-5000 | $0.005-0.025 | Template result |
| `llm:code_generation` | Code snippet generation | 1000-4000 | $0.005-0.020 | Static example |
| `llm:analysis` | Data analysis / reasoning | 2000-6000 | $0.010-0.030 | Cached analysis |
| `web:live_search` | Live web search + summarization | 3000-8000 | $0.015-0.040 | Cached results |
| `llm:translation` | Translation task | 1000-3000 | $0.005-0.015 | "Translation unavailable" |

**Expensive event rules:**
- Each expensive event deducts its **actual token consumption** from the session budget.
- Pre-flight budget check: reject if `tokensUsed + estimatedTokens > totalBudget`.
- Max **20 expensive events per session** (configurable via BudgetConfig).
- Max **5 expensive events per minute** (hard rate limit).
- On budget warning: expensive events require **admin approval** or switch to templates.
- On budget exhausted: all expensive events are **rejected with a friendly fallback**.

### 1.5 Tier Classification Registry

```typescript
// Classification is part of the event definition -- immutable at runtime
interface EventTierRegistry {
  [eventType: string]: {
    tier: BudgetTier;
    estimatedTokens: number;      // Upper bound for pre-flight checks
    requiresAuth: boolean;        // Does this event require API key?
    cacheable: boolean;           // Can this response be cached?
    fallbackEvent: string;        // Which event type to fall back to
  };
}

const EVENT_TIER_REGISTRY: EventTierRegistry = {
  // --- Free events (Tier 0) ---
  'eye:blink':            { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'eye:emotion':          { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'agent:micro_expression' },
  'agent:idle_float':     { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'particle:behavior':    { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'card:shuffle':         { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'card:hover_react':     { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'ui:repaint':           { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'ui:theme_change':      { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'ui:repaint' },
  'sound:cue':            { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'silence:enter':        { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'silence:exit':         { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'template:phrase':      { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: true,  fallbackEvent: 'visual:effect' },
  'visual:effect':        { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'agent:idle_float' },
  'agent:micro_expression': { tier: 'free',   estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'state:transition':     { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },

  // --- Cheap events (Tier 1) ---
  'message:template':     { tier: 'cheap',    estimatedTokens: 50,  requiresAuth: false, cacheable: true,  fallbackEvent: 'template:phrase' },
  'message:cached':       { tier: 'cheap',    estimatedTokens: 50,  requiresAuth: false, cacheable: true,  fallbackEvent: 'message:template' },
  'summary:simple':       { tier: 'cheap',    estimatedTokens: 100, requiresAuth: false, cacheable: true,  fallbackEvent: 'message:template' },
  'status:update':        { tier: 'cheap',    estimatedTokens: 30,  requiresAuth: false, cacheable: true,  fallbackEvent: 'visual:effect' },
  'feed:cached':          { tier: 'cheap',    estimatedTokens: 50,  requiresAuth: false, cacheable: true,  fallbackEvent: 'status:update' },
  'quip:templated':       { tier: 'cheap',    estimatedTokens: 40,  requiresAuth: false, cacheable: true,  fallbackEvent: 'message:template' },
  'weather:cached':       { tier: 'cheap',    estimatedTokens: 30,  requiresAuth: false, cacheable: true,  fallbackEvent: 'template:phrase' },
  'news:headline':        { tier: 'cheap',    estimatedTokens: 50,  requiresAuth: false, cacheable: true,  fallbackEvent: 'template:phrase' },
  'agent:persona_shift':  { tier: 'cheap',    estimatedTokens: 20,  requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'reminder:list':        { tier: 'cheap',    estimatedTokens: 30,  requiresAuth: false, cacheable: true,  fallbackEvent: 'template:phrase' },

  // --- Expensive events (Tier 2) ---
  'llm:chat_completion':     { tier: 'expensive', estimatedTokens: 1500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:cached' },
  'llm:research_query':      { tier: 'expensive', estimatedTokens: 4000, requiresAuth: true, cacheable: true,  fallbackEvent: 'summary:simple' },
  'llm:report_generation':   { tier: 'expensive', estimatedTokens: 5000, requiresAuth: true, cacheable: true,  fallbackEvent: 'summary:simple' },
  'llm:long_explanation':    { tier: 'expensive', estimatedTokens: 3500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:cached' },
  'agent:openclaw_call':     { tier: 'expensive', estimatedTokens: 2500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:template' },
  'agent:hermes_call':       { tier: 'expensive', estimatedTokens: 2500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:template' },
  'llm:code_generation':     { tier: 'expensive', estimatedTokens: 2000, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:template' },
  'llm:analysis':            { tier: 'expensive', estimatedTokens: 3500, requiresAuth: true, cacheable: true,  fallbackEvent: 'summary:simple' },
  'web:live_search':         { tier: 'expensive', estimatedTokens: 4500, requiresAuth: true, cacheable: true,  fallbackEvent: 'news:headline' },
  'llm:translation':         { tier: 'expensive', estimatedTokens: 1500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:template' },
};
```

### 1.6 Cost Tier Assignment Algorithm

```
function classifyEvent(eventType: string): BudgetTier {
  const entry = EVENT_TIER_REGISTRY[eventType];
  if (!entry) {
    // Unknown events default to expensive (safe default)
    log.warn(`Unknown event type "${eventType}" -- defaulting to expensive tier`);
    return 'expensive';
  }
  return entry.tier;
}
```

---

## 2. Token Budget Architecture

### 2.1 Core Data Models

```typescript
// ============================================================
// BUDGET TIER ENUM
// ============================================================
type BudgetTier = 'free' | 'cheap' | 'expensive';

// ============================================================
// BUDGET STATUS -- finite state machine
// ============================================================
type BudgetStatus = 'healthy' | 'warning' | 'critical' | 'exhausted';

// ============================================================
// TOKEN BUDGET -- per-session budget envelope
// ============================================================
interface TokenBudget {
  sessionId: string;                    // Unique per browser session (uuid v4)
  
  // -- Budget totals --
  totalBudget: number;                  // Max tokens allowed for this session (default: 4000)
  tokensUsed: number;                   // Cumulative tokens consumed (expensive events only)
  tokensReserved: number;               // Tokens reserved for in-flight/pending operations
  
  // -- Action counters (for rate limiting & analytics) --
  freeActionsUsed: number;              // Free events consumed this session
  cheapActionsUsed: number;             // Cheap events consumed this session
  expensiveActionsUsed: number;         // Expensive events consumed this session
  
  // -- Time tracking --
  startTime: string;                    // ISO 8601 session start timestamp
  lastActionTime: string;               // ISO 8601 last action timestamp
  
  // -- Budget state --
  status: BudgetStatus;                 // Current budget health
  
  // -- Per-window tracking (for rate limiting) --
  minuteWindow: TimeWindow;             // Rolling 60-second window stats
  fiveMinuteWindow: TimeWindow;         // Rolling 5-minute window stats
  
  // -- Per-agent breakdown --
  agentSpending: AgentSpending[];       // Token usage per agent
  
  // -- Metadata --
  mode: RuntimeMode;                    // 'mock' | 'development' | 'production'
  apiKeyPresent: boolean;               // Whether OpenRouter key is available
  metadata: BudgetMetadata;             // Additional tracking info
}

// ============================================================
// TIME WINDOW -- rolling window for rate limiting
// ============================================================
interface TimeWindow {
  windowStart: string;                  // ISO 8601 when this window began
  tokensUsed: number;                   // Tokens consumed in this window
  actionsCount: number;                 // Number of actions in this window
  apiCallsCount: number;                // Number of actual API calls in window
  events: WindowEvent[];                // Individual events for audit trail
}

interface WindowEvent {
  timestamp: string;
  eventType: string;
  tier: BudgetTier;
  tokensConsumed: number;
  agentId?: string;
  userId?: string;
}

// ============================================================
// AGENT SPENDING -- per-agent budget sub-allocation
// ============================================================
interface AgentSpending {
  agentId: string;                      // e.g., 'nova', 'jinx', 'default'
  agentName: string;                    // Display name
  tokensUsed: number;                   // Total tokens this agent has consumed
  expensiveEventsCount: number;         // Number of expensive events
  cheapEventsCount: number;             // Number of cheap events
  freeEventsCount: number;              // Number of free events
  budgetAllocation: number;             // Allocated share of total budget (0 = no cap)
  lastUsed: string;                     // ISO 8601 last activity
}

// ============================================================
// BUDGET METADATA -- additional tracking
// ============================================================
interface BudgetMetadata {
  userAgent: string;                    // Browser user agent
  ipHash: string;                       // Hashed IP (privacy-safe)
  referrer: string;                     // Referrer URL
  totalEstimatedCost: number;           // Estimated cost in USD
  alertsTriggered: string[];            // List of alert IDs triggered
  adminOverride: boolean;               // Was budget overridden by admin?
}

type RuntimeMode = 'mock' | 'development' | 'production';
```

### 2.2 Global Budget Configuration

```typescript
// ============================================================
// BUDGET CONFIG -- global defaults, admin-configurable
// ============================================================
interface BudgetConfig {
  // -- Session budgets --
  defaultSessionBudget: number;         // Default token budget per session (4000)
  mockModeBudget: number;               // Budget in mock mode (Infinity -- no limit)
  developmentModeBudget: number;        // Budget in dev mode (8000 -- generous for testing)
  productionModeBudget: number;         // Budget in production (4000 -- strict)
  
  // -- Per-tier limits --
  maxFreeActionsPerSession: number;     // Max free events (500, 0 = unlimited)
  maxCheapActionsPerSession: number;    // Max cheap events (100)
  maxExpensiveActionsPerSession: number;// Max expensive events (20)
  
  // -- Rate limits --
  maxTokensPerMinute: number;           // Max tokens in rolling 60s window (1500)
  maxTokensPerFiveMinutes: number;      // Max tokens in rolling 5min window (3000)
  maxApiCallsPerMinute: number;         // Max API calls in 60s window (5)
  maxApiCallsPerSession: number;        // Max API calls per session (20)
  
  // -- Budget status thresholds (percentages of total budget) --
  warningThreshold: number;             // Enter warning at 60% usage (0.60)
  criticalThreshold: number;            // Enter critical at 85% usage (0.85)
  exhaustedThreshold: number;           // Enter exhausted at 100% usage (1.00)
  
  // -- Per-agent budget allocations (optional) --
  agentBudgets: AgentBudgetAllocation[];
  
  // -- Graceful degradation settings --
  degradationSettings: DegradationSettings;
  
  // -- Alert settings --
  alertSettings: AlertSettings;
  
  // -- Feature flags --
  features: BudgetFeatureFlags;
  
  // -- Metadata --
  version: number;                      // Config version (for cache invalidation)
  updatedAt: string;                    // Last config update
  updatedBy: string;                    // Admin who last updated
}

// ============================================================
// AGENT BUDGET ALLOCATION -- per-agent caps
// ============================================================
interface AgentBudgetAllocation {
  agentId: string;                      // Agent identifier
  maxTokensPerSession: number;          // Token cap for this agent (0 = use global default)
  maxExpensiveEvents: number;           // Max expensive events for this agent
  priority: number;                     // Priority (1 = highest, reserve budget first)
  enabled: boolean;                     // Is this agent budget-enabled?
}

// ============================================================
// DEGRADATION SETTINGS -- graceful fallback configuration
// ============================================================
interface DegradationSettings {
  // When in WARNING status:
  warningCacheHitTarget: number;        // Target cache hit rate (0.70 = 70%)
  warningTemplateRate: number;          // Use templates for X% of expensive events (0.50)
  warningSkipNonEssential: boolean;     // Skip non-essential expensive events
  
  // When in CRITICAL status:
  criticalUseOnlyTemplates: boolean;    // Only use template responses
  criticalUseOnlyFree: boolean;         // Only free events (except emergency)
  criticalAllowEmergency: boolean;      // Allow one emergency expensive event
  
  // When in EXHAUSTED status:
  exhaustedUseMock: boolean;            // Fall back to mock provider
  exhaustedVisualOnly: boolean;         // Only visual feedback, no text
  exhaustedAllowAdminOverride: boolean; // Admin can inject extra budget
}

// ============================================================
// ALERT SETTINGS -- notification configuration
// ============================================================
interface AlertSettings {
  enabled: boolean;                     // Master alert switch
  webhookUrl?: string;                  // Slack/Discord webhook for alerts
  emailRecipients?: string[];           // Email addresses for alerts
  alertOnWarning: boolean;              // Alert when entering warning
  alertOnCritical: boolean;             // Alert when entering critical
  alertOnExhausted: boolean;            // Alert when budget exhausted
  alertOnEmergencyCutoff: boolean;      // Alert on emergency cutoff trigger
  cooldownMinutes: number;              // Min minutes between duplicate alerts (15)
}

// ============================================================
// BUDGET FEATURE FLAGS -- runtime toggles
// ============================================================
interface BudgetFeatureFlags {
  enableRateLimiting: boolean;          // Master rate limit switch
  enableBudgetTracking: boolean;        // Master budget tracking switch
  enableGracefulDegradation: boolean;   // Enable fallback chain
  enableAdminOverride: boolean;         // Allow admin to inject budget
  enablePerAgentBudgets: boolean;       // Enable per-agent budget caps
  enableCostLogging: boolean;           // Enable detailed cost logging
  enableAlerts: boolean;                // Enable alert notifications
  enableRecoveryMode: boolean;          // Enable automatic recovery attempts
}
```

### 2.3 Default Configuration Values

```typescript
const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  // Session budgets
  defaultSessionBudget: 4000,
  mockModeBudget: Number.MAX_SAFE_INTEGER,   // Unlimited in mock
  developmentModeBudget: 8000,                // Generous for dev testing
  productionModeBudget: 4000,                 // Strict in production
  
  // Per-tier limits
  maxFreeActionsPerSession: 500,
  maxCheapActionsPerSession: 100,
  maxExpensiveActionsPerSession: 20,
  
  // Rate limits
  maxTokensPerMinute: 1500,
  maxTokensPerFiveMinutes: 3000,
  maxApiCallsPerMinute: 5,
  maxApiCallsPerSession: 20,
  
  // Status thresholds (percentages)
  warningThreshold: 0.60,     // 60% used
  criticalThreshold: 0.85,    // 85% used
  exhaustedThreshold: 1.00,   // 100% used
  
  // Per-agent budgets
  agentBudgets: [
    { agentId: 'nova',   maxTokensPerSession: 2500, maxExpensiveEvents: 12, priority: 1, enabled: true },
    { agentId: 'jinx',   maxTokensPerSession: 1500, maxExpensiveEvents: 8,  priority: 2, enabled: true },
    { agentId: 'default', maxTokensPerSession: 0,   maxExpensiveEvents: 0,  priority: 3, enabled: false }, // Uses global default
  ],
  
  // Degradation settings
  degradationSettings: {
    warningCacheHitTarget: 0.70,
    warningTemplateRate: 0.50,
    warningSkipNonEssential: true,
    criticalUseOnlyTemplates: true,
    criticalUseOnlyFree: false,
    criticalAllowEmergency: true,
    exhaustedUseMock: true,
    exhaustedVisualOnly: false,
    exhaustedAllowAdminOverride: true,
  },
  
  // Alert settings
  alertSettings: {
    enabled: true,
    alertOnWarning: true,
    alertOnCritical: true,
    alertOnExhausted: true,
    alertOnEmergencyCutoff: true,
    cooldownMinutes: 15,
  },
  
  // Feature flags
  features: {
    enableRateLimiting: true,
    enableBudgetTracking: true,
    enableGracefulDegradation: true,
    enableAdminOverride: true,
    enablePerAgentBudgets: true,
    enableCostLogging: true,
    enableAlerts: true,
    enableRecoveryMode: true,
  },
  
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};
```

### 2.4 Budget Status State Machine

```
                     ┌─────────────────────────────┐
                     │         HEALTHY             │
                     │  (usage < 60% of budget)    │
                     │  All events allowed         │
                     └──────────────┬──────────────┘
                                    │
                        usage >= 60%│
                                    ▼
                     ┌─────────────────────────────┐
                     │         WARNING             │
                     │  (60% <= usage < 85%)       │
                     │  Cache more, use templates  │
                     │  50% of expensive events    │
                     │  served from cache/template │
                     └──────────────┬──────────────┘
                                    │
                        usage >= 85%│
                                    ▼
                     ┌─────────────────────────────┐
                     │         CRITICAL            │
                     │  (85% <= usage < 100%)      │
                     │  Templates only for text    │
                     │  Free events still work     │
                     │  1 emergency API call       │
                     │  reserved for "help" cmds   │
                     └──────────────┬──────────────┘
                                    │
                       usage >= 100%│
                                    ▼
                     ┌─────────────────────────────┐
                     │        EXHAUSTED            │
                     │  (usage >= 100%)            │
                     │  Only free events + mock    │
                     │  Visual feedback only       │
                     │  Admin override possible    │
                     └──────────────┬──────────────┘
                                    │
                        admin resets│OR new session
                                    ▼
                     ┌─────────────────────────────┐
                     │         HEALTHY             │
                     │  (cycle restarts)           │
                     └─────────────────────────────┘
```

**Status Transition Rules:**

| From | To | Condition | Action |
|------|-----|-----------|--------|
| `healthy` | `warning` | `usage >= 60%` | Increase cache priority; 50% template fallback |
| `warning` | `critical` | `usage >= 85%` | Templates only; allow 1 emergency call |
| `critical` | `exhausted` | `usage >= 100%` | Full cutoff; mock only; alert admin |
| `warning` | `healthy` | `usage < 50%` (hysteresis) | Resume normal operation |
| `critical` | `warning` | `usage < 80%` (hysteresis) | Resume template + some LLM |
| `exhausted` | `critical` | `admin injects budget` | Resume with new budget |
| `exhausted` | `healthy` | `new session` | Fresh budget, fresh start |

**Hysteresis Note**: Downward transitions use a 10% buffer to prevent rapid status oscillation. Example: `warning -> healthy` requires usage to drop below 50% (not just below 60%).

### 2.5 Status Check Algorithm

```typescript
function computeBudgetStatus(budget: TokenBudget, config: BudgetConfig): BudgetStatus {
  const usage = budget.tokensUsed / budget.totalBudget;
  
  // Current status for hysteresis comparison
  const currentStatus = budget.status;
  
  // UPWARD transitions (strict thresholds)
  if (usage >= config.exhaustedThreshold) {
    return 'exhausted';
  }
  if (usage >= config.criticalThreshold) {
    return 'critical';
  }
  if (usage >= config.warningThreshold) {
    return 'warning';
  }
  
  // DOWNWARD transitions (with hysteresis buffer)
  if (currentStatus === 'exhausted' && usage < 0.95) {
    return 'critical'; // Must drop below 95% to leave exhausted
  }
  if (currentStatus === 'critical' && usage < config.criticalThreshold - 0.05) {
    return 'warning'; // Must drop below 80% to leave critical
  }
  if (currentStatus === 'warning' && usage < config.warningThreshold - 0.10) {
    return 'healthy'; // Must drop below 50% to leave warning
  }
  
  // No transition
  return currentStatus;
}
```

---

## 3. Emergency Cutoff Rules

### 3.1 Hard Safety Limits

These limits are **non-configurable at runtime** (require restart/code change) to prevent accidental misconfiguration.

```typescript
const EMERGENCY_LIMITS = {
  // Absolute maximums -- these cannot be exceeded regardless of config
  MAX_TOKENS_PER_SESSION: 20000,        // Absolute ceiling per session
  MAX_API_CALLS_PER_SESSION: 50,        // Absolute ceiling API calls
  MAX_API_CALLS_PER_MINUTE: 10,         // Absolute ceiling per minute
  MAX_TOKENS_PER_MINUTE: 5000,          // Absolute ceiling tokens/minute
  MAX_TOKENS_PER_FIVE_MINUTES: 10000,   // Absolute ceiling tokens/5min
  MAX_SESSION_DURATION_MINUTES: 120,    // Max session lifetime
  MAX_CONCURRENT_EXPENSIVE_OPS: 3,      // Max parallel expensive operations
  
  // Cost-based emergency triggers
  MAX_COST_PER_SESSION_USD: 2.00,       // $2.00 absolute max per session
  MAX_COST_PER_DAY_USD: 50.00,          // $50.00 absolute max per day
  MAX_COST_PER_HOUR_USD: 10.00,         // $10.00 absolute max per hour
} as const;
```

### 3.2 Emergency Cutoff Triggers

An **emergency cutoff** is a hard stop that overrides all configuration. When triggered:

1. **All expensive events are immediately rejected.**
2. **Status forced to `exhausted`.**
3. **Admin alert sent immediately** (bypasses cooldown).
4. **Session continues with free events only** (agent remains responsive).
5. **Requires admin intervention** or new session to lift.

**Emergency trigger conditions:**

| Trigger | Condition | Response |
|---------|-----------|----------|
| E1: Session token ceiling | `tokensUsed >= 20,000` | Emergency cutoff + alert |
| E2: Session API call ceiling | `apiCalls >= 50` | Emergency cutoff + alert |
| E3: Minute burst | `tokens in 60s >= 5,000` | Emergency cutoff + alert |
| E4: 5-minute burst | `tokens in 5min >= 10,000` | Emergency cutoff + alert |
| E5: Cost per session | `cost >= $2.00` | Emergency cutoff + alert |
| E6: Cost per hour | `hourly cost >= $10.00` | Global emergency cutoff (all sessions) |
| E7: Cost per day | `daily cost >= $50.00` | Global emergency cutoff (all sessions) |
| E8: Concurrent ops | `concurrent expensive >= 3` | Queue + throttle, alert |
| E9: Session timeout | `session age > 120 minutes` | Auto-close, free events only |

### 3.3 Emergency Recovery

```
Emergency Cutoff Triggered
        │
        ▼
┌─────────────────┐
│ 1. Halt all     │
│    expensive ops│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Force status │
│    to EXHAUSTED │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ 3. Send urgent  │────▶│ Admin webhook   │
│    alert        │     │ + email         │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ 4. Log emergency│
│    event        │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 5. Enter "safe mode":                   │
│    - Free events: FULLY OPERATIONAL      │
│    - Agent still alive, still blinking   │
│    - Templates: available (cheap tier)   │
│    - Expensive events: BLOCKED           │
│    - User sees: "Agent is resting..."    │
└────────┬─────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌──────────┐
│Admin   │ │New       │
│resets  │ │session   │
│budget  │ │starts    │
└───┬───┘ └────┬─────┘
    │          │
    └────┬─────┘
         ▼
┌─────────────────┐
│ 6. Resume with  │
│    new budget   │
└─────────────────┘
```

### 3.4 Emergency Cutoff Notification

```typescript
interface EmergencyAlert {
  alertId: string;                      // Unique alert ID
  type: 'emergency_cutoff';             // Alert type
  severity: 'critical' | 'fatal';       // Severity level
  sessionId: string;                    // Affected session
  trigger: keyof typeof EMERGENCY_LIMITS; // Which limit was breached
  triggeredAt: string;                  // ISO 8601 timestamp
  budgetSnapshot: TokenBudget;          // Full budget state at trigger
  currentCost: number;                  // Estimated cost in USD at trigger
  recoveryRequired: boolean;            // Requires admin action?
  resolvedAt?: string;                  // ISO 8601 when resolved
  resolvedBy?: string;                  // Admin who resolved
}
```

---

## 4. Graceful Degradation Chain

### 4.1 Degradation Cascade

The degradation system operates like a waterfall -- at each budget status level, certain capabilities are reduced, but the agent **never becomes unresponsive**.

```
FULL CAPABILITY (HEALTHY)
├─ OpenRouter LLM calls: 100% available
├─ Cache lookup: always attempted first
├─ Template responses: available when cache miss
├─ Cheap events: unlimited (within session limit)
├─ Free events: unlimited (within rate limit)
└─ Agent feels: fully responsive, intelligent

    ▼  usage >= 60%

REDUCED CAPABILITY (WARNING)
├─ OpenRouter LLM calls: 50% template fallback
├─ Cache lookup: aggressive (70% hit target)
├─ Template responses: preferred over generation
├─ Cheap events: unlimited (within session limit)
├─ Free events: unlimited (within rate limit)
└─ Agent feels: mostly responsive, occasionally uses canned lines

    ▼  usage >= 85%

MINIMAL CAPABILITY (CRITICAL)
├─ OpenRouter LLM calls: BLOCKED (except 1 emergency)
├─ Cache lookup: only (no new generation)
├─ Template responses: 100% fallback
├─ Cheap events: still available
├─ Free events: fully operational
└─ Agent feels: uses pre-written responses, still alive and expressive

    ▼  usage >= 100%

SURVIVAL MODE (EXHAUSTED)
├─ OpenRouter LLM calls: BLOCKED
├─ Cache lookup: BLOCKED
├─ Template responses: BLOCKED
├─ MockProvider: ACTIVE (deterministic but responsive)
├─ Free events: FULLY OPERATIONAL
├─ Visual effects: FULLY OPERATIONAL
└─ Agent feels: alive, expressive, uses mock responses
```

### 4.2 Degradation Action Matrix

| Capability | Healthy | Warning | Critical | Exhausted |
|-----------|---------|---------|----------|-----------|
| OpenRouter LLM | Yes | 50% cached | Emergency only | No |
| Cache lookup | Yes | Aggressive | Yes | No |
| Template responses | Yes | Preferred | Yes | No |
| Mock responses | No | No | No | **Yes** |
| Cheap events | Yes | Yes | Yes | No |
| Free events | Yes | Yes | Yes | **Yes** |
| Visual effects | Yes | Yes | Yes | **Yes** |
| Admin override | Yes | Yes | Yes | **Yes** |

### 4.3 Fallback Chain per Event Type

Every expensive event defines a fallback chain:

```typescript
const FALLBACK_CHAIN: Record<string, string[]> = {
  // LLM chat -> cached chat -> template message -> free visual
  'llm:chat_completion':     ['message:cached', 'message:template', 'template:phrase', 'visual:effect'],
  
  // Research -> simple summary -> template -> visual
  'llm:research_query':      ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  
  // Report -> summary -> template -> visual
  'llm:report_generation':   ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  
  // Long explanation -> cached message -> template -> visual
  'llm:long_explanation':    ['message:cached', 'message:template', 'template:phrase', 'visual:effect'],
  
  // OpenClaw -> template -> free phrase -> visual
  'agent:openclaw_call':     ['message:template', 'template:phrase', 'visual:effect'],
  
  // Hermes -> template -> free phrase -> visual
  'agent:hermes_call':       ['message:template', 'template:phrase', 'visual:effect'],
  
  // Code gen -> template -> visual
  'llm:code_generation':     ['message:template', 'template:phrase', 'visual:effect'],
  
  // Analysis -> summary -> template -> visual
  'llm:analysis':            ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  
  // Live search -> cached news -> template -> visual
  'web:live_search':         ['news:headline', 'template:phrase', 'visual:effect'],
  
  // Translation -> template -> visual
  'llm:translation':         ['message:template', 'template:phrase', 'visual:effect'],
};
```

### 4.4 Fallback Resolution Algorithm

```
function resolveFallback(eventType: string, budget: TokenBudget, config: BudgetConfig): string {
  const chain = FALLBACK_CHAIN[eventType] || ['template:phrase', 'visual:effect'];
  
  for (const fallbackType of chain) {
    const tier = classifyEvent(fallbackType);
    
    // Check if this fallback is allowed at current budget status
    if (isEventAllowed(fallbackType, tier, budget, config)) {
      return fallbackType;
    }
  }
  
  // Ultimate fallback: always works
  return 'visual:effect';
}

function isEventAllowed(
  eventType: string, 
  tier: BudgetTier, 
  budget: TokenBudget, 
  config: BudgetConfig
): boolean {
  switch (budget.status) {
    case 'healthy':
      return true;  // Everything allowed
      
    case 'warning':
      if (tier === 'expensive') {
        // In warning, 50% of expensive events use fallback
        return Math.random() > config.degradationSettings.warningTemplateRate;
      }
      return tier !== 'expensive' || !config.degradationSettings.warningSkipNonEssential;
      
    case 'critical':
      // Only templates and free events
      if (tier === 'expensive') {
        // One emergency call allowed
        return budget.metadata.alertsTriggered.length === 0 && 
               config.degradationSettings.criticalAllowEmergency;
      }
      return tier !== 'expensive';
      
    case 'exhausted':
      // Only free events + mock
      return tier === 'free';
      
    default:
      return false;
  }
}
```

### 4.5 User-Facing Degradation Messaging

When the agent falls back, it should feel natural, not broken:

| Budget Status | User Experience |
|--------------|----------------|
| **Healthy** | Agent responds naturally with full intelligence |
| **Warning** | Agent occasionally says "Let me check my notes..." before a cached response. Slight delay added to cache hits to feel natural. |
| **Critical** | Agent says "I'm running a bit low on energy, but I've still got plenty to share!" then uses templates. Free events (blinking, expressions) are extra animated to compensate. |
| **Exhausted** | Agent says "I'm taking a quick breather..." then continues with mock responses. Visual effects are heightened: more particle activity, more expressive animations. The agent feels *different* but not *broken*. |

---

## 5. Cost Tracking Architecture

### 5.1 Cost Log Data Model

```typescript
// ============================================================
// COST LOG -- per-action cost record (immutable audit trail)
// ============================================================
interface CostLog {
  logId: string;                        // Unique log entry ID (uuid)
  sessionId: string;                    // Parent session
  timestamp: string;                    // ISO 8601 when action occurred
  
  // -- Event details --
  eventType: string;                    // e.g., 'llm:chat_completion'
  tier: BudgetTier;                     // 'free' | 'cheap' | 'expensive'
  
  // -- Token accounting --
  inputTokens: number;                  // Tokens sent to API
  outputTokens: number;                 // Tokens received from API
  totalTokens: number;                  // Sum of input + output
  estimatedTokens: number;              // Pre-flight estimate
  
  // -- Cost accounting --
  estimatedCostUsd: number;             // Pre-flight cost estimate
  actualCostUsd: number;                // Actual cost (from provider response)
  
  // -- Provider info --
  provider: string;                     // 'openrouter' | 'mock' | 'cache'
  model?: string;                       // Model used (e.g., 'gpt-4o-mini')
  
  // -- Agent context --
  agentId: string;                      // Which agent handled this
  agentName: string;                    // Display name
  
  // -- User context --
  userId?: string;                      // User ID (if authenticated)
  
  // -- Degradation context --
  wasDegraded: boolean;                 // Was this a fallback event?
  originalEventType?: string;           // If degraded, what was the original?
  fallbackChain?: string[];             // Fallback chain used
  
  // -- Performance --
  latencyMs: number;                    // Total latency (ms)
  cacheHit: boolean;                    // Was this served from cache?
  
  // -- Budget impact --
  budgetStatusBefore: BudgetStatus;     // Status before this action
  budgetStatusAfter: BudgetStatus;      // Status after this action
  tokensRemainingAfter: number;         // Remaining budget after
}
```

### 5.2 Cost Aggregation Views

For the admin dashboard and analytics, the following pre-aggregated views are maintained:

```typescript
// ============================================================
// SESSION COST SUMMARY -- per-session rollup
// ============================================================
interface SessionCostSummary {
  sessionId: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  
  // -- Totals --
  totalTokensUsed: number;
  totalCostUsd: number;
  totalEvents: number;
  
  // -- By tier --
  freeEventsCount: number;
  cheapEventsCount: number;
  expensiveEventsCount: number;
  
  // -- By status transitions --
  statusTransitions: StatusTransition[];
  finalStatus: BudgetStatus;
  
  // -- By agent --
  agentBreakdown: AgentCostBreakdown[];
  
  // -- Degradation --
  degradedEventsCount: number;
  fallbackEventsCount: number;
  
  // -- Performance --
  avgLatencyMs: number;
  cacheHitRate: number;
}

// ============================================================
// AGENT COST BREAKDOWN -- per-agent per-session
// ============================================================
interface AgentCostBreakdown {
  agentId: string;
  agentName: string;
  tokensUsed: number;
  costUsd: number;
  eventsCount: number;
  expensiveEventsCount: number;
  avgLatencyMs: number;
}

// ============================================================
// DAILY COST ROLLUP -- for admin dashboard
// ============================================================
interface DailyCostRollup {
  date: string;                         // YYYY-MM-DD
  totalSessions: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  totalEvents: number;
  
  // -- By tier --
  freeEventsTotal: number;
  cheapEventsTotal: number;
  expensiveEventsTotal: number;
  
  // -- By agent --
  agentDailyBreakdown: AgentDailyCost[];
  
  // -- By event type (top 10) --
  topEventTypes: EventTypeCost[];
  
  // -- Budget alerts --
  warningCount: number;
  criticalCount: number;
  exhaustedCount: number;
  emergencyCount: number;
}

// ============================================================
// AGENT DAILY COST -- per-agent per-day
// ============================================================
interface AgentDailyCost {
  agentId: string;
  agentName: string;
  tokensUsed: number;
  costUsd: number;
  sessionsCount: number;
  eventsCount: number;
}

// ============================================================
// EVENT TYPE COST -- per-event-type costs
// ============================================================
interface EventTypeCost {
  eventType: string;
  tier: BudgetTier;
  totalTokens: number;
  totalCostUsd: number;
  callCount: number;
  avgCostPerCall: number;
  avgTokensPerCall: number;
}

// ============================================================
// STATUS TRANSITION -- record of budget status changes
// ============================================================
interface StatusTransition {
  from: BudgetStatus;
  to: BudgetStatus;
  timestamp: string;
  trigger: string;                      // What caused the transition
  usagePercentAtTransition: number;     // Budget usage % at transition
}
```

### 5.3 Cost Tracking Flow

```
User Action
    │
    ▼
EventDispatcher
    │
    ├──▶ BudgetChecker.check(eventType)
    │       │
    │       ├──▶ Classify tier (free/cheap/expensive)
    │       ├──▶ Check rate limits
    │       ├──▶ Check budget status
    │       ├──▶ Decide: allow / degrade / reject
    │       └──▶ Return: { allowed, tier, fallback?, reason? }
    │
    ▼
[If allowed] ──▶ Provider.execute(event)
                    │
                    ├──▶ OpenRouterProvider (expensive)
                    ├──▶ CacheProvider (cheap/cached)
                    ├──▶ TemplateProvider (cheap/template)
                    └──▶ MockProvider (free/exhausted)
    │
    ▼
CostLogger.record(result)
    │
    ├──▶ Write CostLog entry (immutable)
    ├──▶ Update TokenBudget (counters)
    ├──▶ Recompute BudgetStatus
    ├──▶ Check emergency triggers
    ├──▶ Emit BudgetAlert (if threshold crossed)
    └──▶ Update admin dashboard (aggregated views)
```

### 5.4 Admin Dashboard Display

The admin dashboard shows a **live cost counter** with the following panels:

| Panel | Data | Refresh |
|-------|------|---------|
| **Live Cost** | Current day's total cost in USD | Real-time (WebSocket) |
| **Sessions Active** | Currently active sessions + their status | 5s polling |
| **Token Burn Rate** | Tokens/minute across all sessions | 10s rolling average |
| **Agent Breakdown** | Cost per agent (pie chart) | 30s |
| **Top Expensive Events** | Which event types cost the most | 60s |
| **Budget Alerts** | Active alerts + historical | Real-time |
| **Emergency Status** | Global emergency mode on/off | Real-time |
| **Cost Projection** | Projected daily cost based on current burn rate | 60s |

---

## 6. Mock vs Real Decision Logic

### 6.1 Decision Matrix

The `ProviderSelector` decides which provider to use for each event based on a priority-ordered set of rules:

```
DECISION MATRIX (evaluated in order -- first match wins):

Priority │ Condition                          │ Provider        │ Reason
─────────┼────────────────────────────────────┼─────────────────┼─────────────────────
1 (top)  │ Runtime mode = 'mock'              │ MockProvider    │ Explicit mock mode
2        │ No API key configured              │ MockProvider    │ Cannot call real API
3        │ Budget status = 'exhausted'        │ MockProvider    │ Budget fully spent
4        │ Global emergency cutoff active     │ MockProvider    │ Safety override
5        │ Event tier = 'free'                │ (no provider)   │ Client-side only
6        │ Event tier = 'cheap'               │ Cache/Template  │ No API needed
7        │ Cache has valid entry              │ CacheProvider   │ Avoid redundant cost
8        │ Budget status = 'critical'         │ TemplateProvider│ Templates only in critical
9        │ Budget status = 'warning'          │ 50/50 Cache/LLM │ Degraded in warning
10       │ Rate limit would be exceeded       │ TemplateProvider│ Prevent rate limit hit
11       │ Per-agent budget exceeded          │ TemplateProvider│ Agent budget protection
12       │ (default)                          │ OpenRouter      │ Full capability
```

### 6.2 Provider Selection Algorithm

```typescript
interface ProviderDecision {
  provider: 'openrouter' | 'cache' | 'template' | 'mock' | 'none';
  reason: string;                       // Human-readable decision reason
  tier: BudgetTier;                     // Resolved tier
  estimatedTokens: number;              // Pre-flight token estimate
  estimatedCost: number;                // Pre-flight cost estimate
  fallbackChain?: string[];             // Fallbacks if this fails
}

function selectProvider(
  eventType: string,
  budget: TokenBudget,
  config: BudgetConfig,
  context: { apiKeyPresent: boolean; runtimeMode: RuntimeMode }
): ProviderDecision {
  
  const registry = EVENT_TIER_REGISTRY[eventType];
  const tier = classifyEvent(eventType);
  
  // Rule 1: Mock mode
  if (context.runtimeMode === 'mock') {
    return {
      provider: 'mock',
      reason: 'Runtime mode is mock -- always mock',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
    };
  }
  
  // Rule 2: No API key
  if (!context.apiKeyPresent) {
    return {
      provider: 'mock',
      reason: 'No API key configured -- falling back to mock',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
    };
  }
  
  // Rule 3: Budget exhausted
  if (budget.status === 'exhausted') {
    return {
      provider: 'mock',
      reason: 'Budget exhausted -- using mock responses',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
      fallbackChain: FALLBACK_CHAIN[eventType],
    };
  }
  
  // Rule 4: Global emergency
  if (budget.metadata.alertsTriggered.some(a => a.startsWith('emergency'))) {
    return {
      provider: 'mock',
      reason: 'Global emergency cutoff active',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
    };
  }
  
  // Rule 5: Free events need no provider
  if (tier === 'free') {
    return {
      provider: 'none',
      reason: 'Free event -- client-side only, no provider needed',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
    };
  }
  
  // Rule 6: Cheap events use cache/template
  if (tier === 'cheap') {
    return {
      provider: 'template',
      reason: 'Cheap event -- template/cache response',
      tier,
      estimatedTokens: registry?.estimatedTokens || 50,
      estimatedCost: 0,
    };
  }
  
  // Rules 7-12: Expensive events -- budget-aware selection
  if (tier === 'expensive') {
    // Check cache first (Rule 7)
    if (registry?.cacheable && hasValidCacheEntry(eventType)) {
      return {
        provider: 'cache',
        reason: 'Cache hit -- serving cached response',
        tier,
        estimatedTokens: 0,
        estimatedCost: 0,
      };
    }
    
    // Rule 8: Critical status
    if (budget.status === 'critical') {
      const fallback = resolveFallback(eventType, budget, config);
      return {
        provider: fallback === eventType ? 'mock' : 'template',
        reason: 'Budget critical -- using template fallback',
        tier,
        estimatedTokens: 0,
        estimatedCost: 0,
        fallbackChain: FALLBACK_CHAIN[eventType],
      };
    }
    
    // Rule 9: Warning status (probabilistic)
    if (budget.status === 'warning') {
      const useCache = Math.random() < config.degradationSettings.warningTemplateRate;
      if (useCache) {
        return {
          provider: 'template',
          reason: 'Budget warning -- probabilistic template fallback (50%)',
          tier,
          estimatedTokens: 0,
          estimatedCost: 0,
        };
      }
    }
    
    // Rule 10: Rate limit check
    if (wouldExceedRateLimit(budget, config)) {
      return {
        provider: 'template',
        reason: 'Rate limit protection -- template fallback',
        tier,
        estimatedTokens: registry?.estimatedTokens || 1500,
        estimatedCost: 0,
      };
    }
    
    // Rule 11: Per-agent budget check
    if (config.features.enablePerAgentBudgets) {
      const agentBudget = config.agentBudgets.find(a => a.agentId === budget.agentSpending[0]?.agentId);
      if (agentBudget && agentBudget.maxTokensPerSession > 0) {
        const agentSpent = budget.agentSpending.find(a => a.agentId === agentBudget.agentId)?.tokensUsed || 0;
        if (agentSpent >= agentBudget.maxTokensPerSession) {
          return {
            provider: 'template',
            reason: `Agent "${agentBudget.agentId}" budget exceeded -- template fallback`,
            tier,
            estimatedTokens: 0,
            estimatedCost: 0,
          };
        }
      }
    }
    
    // Rule 12: Default -- use OpenRouter
    return {
      provider: 'openrouter',
      reason: 'Full budget available -- using OpenRouter',
      tier,
      estimatedTokens: registry?.estimatedTokens || 1500,
      estimatedCost: estimateCost(registry?.estimatedTokens || 1500),
    };
  }
  
  // Should never reach here
  return {
    provider: 'mock',
    reason: 'Unknown event tier -- safe default to mock',
    tier: 'free',
    estimatedTokens: 0,
    estimatedCost: 0,
  };
}
```

### 6.3 Cost Estimation

```typescript
// Simple cost estimator for pre-flight budget checks
// Uses per-model pricing (these are example rates -- actual rates come from OpenRouter)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini':       { input: 0.15,  output: 0.60 },   // per 1M tokens
  'gpt-4o':            { input: 2.50,  output: 10.00 },
  'claude-3.5-sonnet': { input: 3.00,  output: 15.00 },
  'llama-3.1-70b':     { input: 0.30,  output: 0.60 },
  'default':           { input: 0.50,  output: 1.50 },   // Conservative default
};

function estimateCost(
  estimatedTokens: number, 
  model: string = 'default',
  inputRatio: number = 0.4  // Assume 40% input, 60% output
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
  const inputTokens = estimatedTokens * inputRatio;
  const outputTokens = estimatedTokens * (1 - inputRatio);
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}
```

---

## 7. Budget Alert System

### 7.1 Alert Data Model

```typescript
// ============================================================
// BUDGET ALERT -- triggered when thresholds are crossed
// ============================================================
interface BudgetAlert {
  alertId: string;                      // Unique alert ID
  type: BudgetAlertType;                // Type of alert
  severity: AlertSeverity;              // Severity level
  
  // -- Context --
  sessionId: string;                    // Affected session
  budgetStatus: BudgetStatus;           // Status that triggered alert
  
  // -- Metrics at trigger --
  tokensUsed: number;
  totalBudget: number;
  usagePercent: number;                 // 0.0 - 1.0
  estimatedCostUsd: number;
  
  // -- Timestamp --
  triggeredAt: string;                  // ISO 8601
  acknowledgedAt?: string;              // When admin acknowledged
  acknowledgedBy?: string;              // Admin user ID
  
  // -- Notification --
  channels: AlertChannel[];             // Where alert was sent
  message: string;                      // Human-readable alert message
  
  // -- Related alerts --
  relatedAlertIds: string[];            // Previous alerts in same session
  isDuplicate: boolean;                 // Suppressed as duplicate?
}

// ============================================================
// BUDGET ALERT TYPE -- what triggered the alert
// ============================================================
type BudgetAlertType =
  | 'status_warning'         // Entered warning status
  | 'status_critical'        // Entered critical status
  | 'status_exhausted'       // Budget fully exhausted
  | 'rate_limit_approaching' // Within 80% of rate limit
  | 'rate_limit_exceeded'    // Rate limit hit
  | 'emergency_cutoff'       // Emergency limit triggered
  | 'agent_budget_exceeded'  // Per-agent budget exceeded
  | 'daily_cost_threshold'   // Daily cost threshold crossed
  | 'hourly_cost_threshold'  // Hourly cost threshold crossed
  | 'unusual_spike'          // Unusual spending spike detected
  | 'admin_override_used'    // Admin injected budget
  | 'session_timeout';       // Session auto-closed

// ============================================================
// ALERT SEVERITY
// ============================================================
type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

// ============================================================
// ALERT CHANNEL
// ============================================================
interface AlertChannel {
  type: 'webhook' | 'email' | 'in_app' | 'log';
  destination: string;                  // URL, email, or "dashboard"
  sentAt: string;                       // ISO 8601
  status: 'sent' | 'delivered' | 'failed';
  error?: string;                       // If failed
}
```

### 7.2 Alert Severity Mapping

| Alert Type | Severity | Cooldown | Admin Action Required |
|-----------|----------|----------|----------------------|
| `status_warning` | `warning` | 15 min | Monitor |
| `status_critical` | `critical` | 15 min | Review |
| `status_exhausted` | `emergency` | None | Investigate |
| `rate_limit_approaching` | `warning` | 5 min | None (auto-throttle) |
| `rate_limit_exceeded` | `critical` | 10 min | Review |
| `emergency_cutoff` | `emergency` | None | Immediate |
| `agent_budget_exceeded` | `warning` | 15 min | Adjust allocation |
| `daily_cost_threshold` | `critical` | 1 hour | Review spending |
| `hourly_cost_threshold` | `warning` | 30 min | Monitor |
| `unusual_spike` | `warning` | 10 min | Investigate |
| `admin_override_used` | `info` | None | Logged for audit |
| `session_timeout` | `info` | None | None (auto) |

### 7.3 Deduplication

Alerts are deduplicated to prevent spam:

```typescript
function shouldSuppressAlert(
  newAlert: BudgetAlert, 
  recentAlerts: BudgetAlert[],
  config: BudgetConfig
): boolean {
  const cooldownMs = config.alertSettings.cooldownMinutes * 60 * 1000;
  const now = Date.now();
  
  for (const existing of recentAlerts) {
    // Same session + same type within cooldown = suppress
    if (
      existing.sessionId === newAlert.sessionId &&
      existing.type === newAlert.type &&
      (now - new Date(existing.triggeredAt).getTime()) < cooldownMs
    ) {
      return true;
    }
  }
  
  return false;
}
```

---

## 8. Admin Budget Controls

### 8.1 Admin Operations

The admin panel provides the following budget controls:

| Operation | Description | Permission |
|-----------|-------------|------------|
| **View Live Budget** | See all active sessions + their budgets | Admin |
| **View Cost History** | Daily/hourly cost rollups | Admin |
| **Adjust Global Budget** | Change default session budget | Super Admin |
| **Adjust Rate Limits** | Change tokens/min, API calls/min | Super Admin |
| **Adjust Thresholds** | Change warning/critical % | Super Admin |
| **Inject Session Budget** | Add tokens to a specific session | Admin |
| **Force Session Close** | End a session (budget preserved) | Admin |
| **Toggle Emergency Mode** | Global emergency on/off | Super Admin |
| **View Agent Breakdown** | Per-agent cost analysis | Admin |
| **Adjust Agent Budgets** | Change per-agent caps | Super Admin |
| **Export Cost Logs** | Download cost logs (CSV/JSON) | Admin |
| **Acknowledge Alerts** | Mark alerts as reviewed | Admin |

### 8.2 Admin Budget API Interface

```typescript
// ============================================================
// ADMIN BUDGET API -- operations exposed in admin panel
// ============================================================
interface AdminBudgetAPI {
  // -- Read operations --
  getActiveSessions(): Promise<ActiveSessionView[]>;
  getSessionBudget(sessionId: string): Promise<TokenBudget>;
  getCostHistory(startDate: string, endDate: string): Promise<DailyCostRollup[]>;
  getAgentBreakdown(period: 'day' | 'week' | 'month'): Promise<AgentDailyCost[]>;
  getActiveAlerts(): Promise<BudgetAlert[]>;
  getConfig(): Promise<BudgetConfig>;
  
  // -- Write operations --
  updateConfig(updates: Partial<BudgetConfig>): Promise<BudgetConfig>;
  injectBudget(sessionId: string, tokens: number, reason: string): Promise<TokenBudget>;
  forceSessionClose(sessionId: string, reason: string): Promise<void>;
  toggleEmergencyMode(active: boolean, reason: string): Promise<void>;
  acknowledgeAlert(alertId: string): Promise<void>;
  resetDailyCounters(): Promise<void>;
  
  // -- Export --
  exportCostLogs(format: 'csv' | 'json', filters: CostLogFilters): Promise<Blob>;
}

// ============================================================
// ACTIVE SESSION VIEW -- admin dashboard display
// ============================================================
interface ActiveSessionView {
  sessionId: string;
  agentName: string;
  status: BudgetStatus;
  tokensUsed: number;
  totalBudget: number;
  usagePercent: number;                 // 0-100
  durationMinutes: number;
  lastActionAgoSeconds: number;
  eventCounts: {
    free: number;
    cheap: number;
    expensive: number;
  };
  estimatedCostUsd: number;
  canInject: boolean;                   // Can admin add budget?
}
```

### 8.3 Budget Configuration Persistence

```typescript
// BudgetConfig is stored in a JSON file (server-side)
// Path: /data/budget-config.json
// 
// In mock mode: uses default values, writes to memory only
// In dev/production: persists to disk, hot-reloadable
//
// Change propagation:
//   1. Admin updates config via panel
//   2. Server validates new config
//   3. Server writes to disk
//   4. Server broadcasts to all active sessions via WebSocket/EventBus
//   5. Sessions apply new config on next budget check
//   6. In-flight operations use old config; new operations use new config
```

---

## 9. Session Lifecycle Integration

### 9.1 Budget Lifecycle

```
SESSION START
    │
    ▼
┌─────────────────────┐
│ 1. Create TokenBudget│
│    - Generate session│
│      ID (uuid v4)    │
│    - Set totalBudget │
│      from config     │
│    - Status: HEALTHY │
│    - Init windows    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Attach to session│
│    - Store in       │
│      session store  │
│    - Budget follows │
│      session        │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼              ▼
┌────────┐   ┌──────────────┐
│ Events  │   │ Admin        │
│ flow    │   │ operations   │
│ through │   │ (inject,     │
│ budget  │   │ close, etc)  │
│ checks  │   │              │
└───┬────┘   └──────┬───────┘
    │                │
    └───────┬────────┘
            │
            ▼
┌─────────────────────┐
│ 3. Session end      │
│    - Archive budget │
│    - Write final    │
│      cost summary   │
│    - Clean up       │
│      (after TTL)    │
└─────────────────────┘
```

### 9.2 Session Budget Factory

```typescript
function createSessionBudget(
  sessionId: string,
  config: BudgetConfig,
  context: { mode: RuntimeMode; apiKeyPresent: boolean; userAgent: string }
): TokenBudget {
  
  const now = new Date().toISOString();
  
  // Determine budget based on runtime mode
  let totalBudget: number;
  switch (context.mode) {
    case 'mock':
      totalBudget = config.mockModeBudget;  // Infinity
      break;
    case 'development':
      totalBudget = config.developmentModeBudget;  // 8000
      break;
    case 'production':
      totalBudget = config.productionModeBudget;   // 4000
      break;
    default:
      totalBudget = config.defaultSessionBudget;
  }
  
  return {
    sessionId,
    totalBudget,
    tokensUsed: 0,
    tokensReserved: 0,
    freeActionsUsed: 0,
    cheapActionsUsed: 0,
    expensiveActionsUsed: 0,
    startTime: now,
    lastActionTime: now,
    status: 'healthy',
    minuteWindow: createTimeWindow(now),
    fiveMinuteWindow: createTimeWindow(now),
    agentSpending: initializeAgentSpending(config),
    mode: context.mode,
    apiKeyPresent: context.apiKeyPresent,
    metadata: {
      userAgent: context.userAgent,
      ipHash: hashIp(context.ipAddress),
      referrer: context.referrer || '',
      totalEstimatedCost: 0,
      alertsTriggered: [],
      adminOverride: false,
    },
  };
}
```

---

## 10. Implementation Notes

### 10.1 File Structure (planned)

```
src/
  cost-control/
    types.ts              # All TypeScript interfaces
    registry.ts           # EVENT_TIER_REGISTRY
    config.ts             # DEFAULT_BUDGET_CONFIG + BudgetConfig
    budget.ts             # TokenBudget creation + management
    checker.ts            # BudgetChecker (allow/degrade/reject)
    selector.ts           # ProviderSelector (mock vs real)
    logger.ts             # CostLogger (audit trail)
    alerts.ts             # BudgetAlert system
    emergency.ts          # Emergency cutoff handler
    degradation.ts        # Fallback chain resolution
    aggregator.ts         # Cost aggregation (dashboard views)
    admin-api.ts          # AdminBudgetAPI implementation
    constants.ts          # EMERGENCY_LIMITS + hard constants
    utils.ts              # Helper functions (estimateCost, etc.)
```

### 10.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Free events unlimited** | User must never feel the agent is "broken" -- visual feedback is sacred |
| **Hard limits non-configurable** | Prevents admin accidentally setting $1000/minute budgets via UI |
| **Hysteresis on status transitions** | Prevents rapid oscillation between warning/healthy when hovering at 60% |
| **Mock provider in exhausted mode** | Agent still feels alive with deterministic responses -- never goes silent |
| **Per-agent budgets** | Nova (research-heavy) and Jinx (chat-heavy) have different spending patterns |
| **Immutable cost logs** | Audit trail cannot be altered -- important for cost accountability |
| **Session-scoped budgets** | Budget resets per visit -- no cross-session tracking (privacy-friendly) |
| **Graceful degradation messaging** | User experience degrades *gradually* -- agent always feels responsive |

### 10.3 Performance Considerations

- **Budget checks must complete in < 1ms** -- they are in the hot path of every event.
- **Cache lookups for budget status** -- status computed once per action, not per check.
- **Cost logging is async** -- write to log after responding to user, never block.
- **Aggregation is batched** -- dashboard views updated every 30s, not real-time per event.
- **Time window pruning** -- events older than the window are dropped automatically.

### 10.4 Future Enhancements (out of scope for Phase 2)

1. **Per-user budgets** -- when user authentication is added
2. **Budget pools** -- shared budget across multiple sessions (e.g., team budget)
3. **Predictive budgeting** -- ML-based cost prediction before API calls
4. **Smart caching** -- cache warming based on predicted user behavior
5. **Cost optimization** -- automatic model selection (cheaper model for simpler queries)
6. **Multi-provider routing** -- route to cheapest available provider
7. **Budget subscriptions** -- monthly/quarterly budget plans
8. **Cost attribution** -- attribute costs to specific features/use cases

---

## 11. Quick Reference: Numbers at a Glance

| Parameter | Default | Emergency Max |
|-----------|---------|---------------|
| Session budget (production) | 4,000 tokens | 20,000 tokens |
| Session budget (development) | 8,000 tokens | 20,000 tokens |
| Max free events / session | 500 | -- |
| Max cheap events / session | 100 | -- |
| Max expensive events / session | 20 | 50 |
| Max tokens / minute | 1,500 | 5,000 |
| Max tokens / 5 minutes | 3,000 | 10,000 |
| Max API calls / minute | 5 | 10 |
| Max API calls / session | 20 | 50 |
| Warning threshold | 60% | -- |
| Critical threshold | 85% | -- |
| Max cost / session | -- | $2.00 |
| Max cost / hour | -- | $10.00 |
| Max cost / day | -- | $50.00 |
| Session max lifetime | -- | 120 minutes |
| Alert cooldown | 15 minutes | None (emergency) |
| Hysteresis buffer | 10% (downward) | -- |
| Concurrent expensive ops | 3 | 3 |
