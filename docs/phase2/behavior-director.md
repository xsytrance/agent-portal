# Phase 2 Architecture Plan: Behavior Director

**Agent Portal — Decision Engine for Autonomous Agent Behavior**
**Version:** 2.0.0  
**Status:** Architecture Design  
**Author:** Lead Architect  

---

## 1. Executive Summary

The Behavior Director is the autonomous decision engine that transforms Agent Portal from a reactive chat interface into a living, breathing AI presence. It operates as a discrete-time state machine running on a 500ms decision cycle, receiving signals from user interactions, external events, and internal mood systems. The Director maintains a continuous emotional state through a pluggable mood system with per-agent personality profiles, enforces pacing through a multi-layered cooldown system, and treats intentional silence as a first-class feature — not the absence of action, but a deliberate behavioral expression. Every decision flows through a priority matrix weighted by agent personality, current mood, session history, and resource budget, producing a stream of typed portal events that the client consumes.

---

## 2. Architecture Diagram (Text)

```
+=========================================================================================+
|                              BEHAVIOR DIRECTOR ARCHITECTURE                              |
+=========================================================================================+
|                                                                                         |
|   SIGNAL LAYER                    DECISION LAYER                    EVENT LAYER         |
|  +------------------+           +-------------------+          +------------------+      |
|  | User Input       |---------->| Context Analyzer  |          | Event Dispatcher  |      |
|  | - message        |           | - relevance score |          | - SSE stream      |      |
|  | - mouse move     |           | - urgency check   |--------->| - event store     |      |
|  | - click          |           | - session state   |          | - client handlers  |      |
|  +------------------+           +-------------------+          +------------------+      |
|           |                             |                         ^                      |
|           v                             v                         |                      |
|  +------------------+           +-------------------+             |                      |
|  | External Events  |---------->| Mood System       |-------------+                      |
|  | - admin config   |           | - mood evaluator  |                                    |
|  | - theme change   |           | - personality mod |                                    |
|  | - timer tick     |           | - decay engine    |                                    |
|  +------------------+           +-------------------+                                    |
|           |                             |                                                |
|           v                             v                                                |
|  +------------------+           +-------------------+          +------------------+      |
|  | Autonomous Trig. |---------->| Decision Core     |          | Client Display    |      |
|  | - boredom timer  |           | - priority matrix |          | - FloatingEye     |      |
|  | - mood impulse   |           | - cooldown check  |--------->| - Particles       |      |
|  | - creative spark |           | - budget manager  |          | - ChatPanel       |      |
|  +------------------+           +-------------------+          | - Cards/Modals    |      |
|                                         |                      +------------------+      |
|                                         v                                                |
|                                 +-------------------+                                    |
|                                 | Silence Engine    |                                    |
|                                 | - silence modes   |                                    |
|                                 | - visual hints    |                                    |
|                                 | - wake triggers   |                                    |
|                                 +-------------------+                                    |
|                                                                                         |
+=========================================================================================+
```

### Signal-to-Action Pipeline

```
Input Signal
    |
    v
+---------------------------------------+
| 1. SIGNAL RECEIPT & CLASSIFICATION     |
|    - Categorize: user/external/auto    |
|    - Compute urgency score (0-1)       |
|    - Tag with timestamp + session ID   |
+---------------------------------------+
    |
    v
+---------------------------------------+
| 2. MOOD EVALUATION                     |
|    - Apply mood modifiers to signal    |
|    - Check mood decay (time-based)     |
|    - Resolve mood conflicts            |
+---------------------------------------+
    |
    v
+---------------------------------------+
| 3. BUDGET CHECK                        |
|    - Session action budget remaining?  |
|    - Cost tier available?              |
|    - Rate limit ok?                    |
+---------------------------------------+
    |
    v
+---------------------------------------+
| 4. COOLDOWN VALIDATION                 |
|    - Per-event-type: ready?            |
|    - Global rate: within limit?        |
|    - Quiet period: active?             |
+---------------------------------------+
    |
    v
+---------------------------------------+
| 5. DECISION COMPUTATION                |
|    - Priority matrix lookup            |
|    - Personality weighting             |
|    - Select action or silence          |
+---------------------------------------+
    |
    v
+---------------------------------------+
| 6. EVENT PLAN GENERATION               |
|    - Map decision to event types       |
|    - Sequence multi-event plans        |
|    - Assign cost tiers                 |
+---------------------------------------+
    |
    v
+---------------------------------------+
| 7. EXECUTION / ENQUEUE                 |
|    - Emit to SSE stream                |
|    - Record in event store             |
|    - Update cooldown registry          |
|    - Deduct from budget                |
+---------------------------------------+
```

---

## 3. Data Models

### 3.1 Core Types and Enumerations

```typescript
/** Agent presence states — the behavioral lifecycle */
type AgentPresenceState =
  | 'silent'        // No active behavior, minimal visual presence
  | 'attentive'     // Aware of user, subtle indicators active
  | 'responding'    // Actively generating a response to user input
  | 'creating'      // Generating cards, repaints, creative outputs
  | 'spectacle'     // High-energy display mode (rare, impactful)
  | 'sleeping';     // Deep silence, minimal particle activity

/** Eight mood dimensions that shape all agent behavior */
type MoodDimension =
  | 'curious'       // Seeks interaction, asks questions, explores
  | 'excited'       // Enthusiastic responses, high energy, spectacle-prone
  | 'thoughtful'    // Measured responses, references knowledge, slower cadence
  | 'mischievous'   // Playful, unexpected actions, teasing tone
  | 'calm'          // Steady, minimal movement, reassuring presence
  | 'focused'       // Task-oriented, concise, less peripheral activity
  | 'sleepy'        // Slower responses, reduced initiative, dreamy
  | 'surprised';    // Brief spike, widened attention, quick reaction

/** Source of a signal entering the decision engine */
type SignalSource = 'user' | 'external' | 'autonomous' | 'system';

/** Classification of behavior cost for budget management */
type CostTier = 'free' | 'low' | 'medium' | 'high';

/** Event types the Behavior Director can produce */
type DirectorEventType =
  | 'agent.message'
  | 'agent.thinking'
  | 'agent.eye_emotion'
  | 'agent.mood_shift'
  | 'portal.spawn_card'
  | 'portal.repaint'
  | 'portal.theme_change'
  | 'portal.sound_cue'
  | 'system.log';

/** Per-agent personality profile — loaded at initialization */
type AgentPersonality =
  | 'nova'      // Professor Nova — scholarly, curious, mentor archetype
  | 'jinx'      // Jinx — playful, chaotic, trickster archetype
  | 'atlas';    // Atlas — steady, wise, guardian archetype
```

### 3.2 Primary State Model

```typescript
/**
 * The complete runtime state of the Behavior Director.
 * Persisted per-session, reset on page reload.
 */
interface BehaviorDirectorState {
  // --- Identity ---
  sessionId: string;                    // Unique session identifier
  agentId: AgentPersonality;            // Which agent is active
  cycleCount: number;                   // How many decision cycles have run
  sessionStartTime: number;             // Unix timestamp (ms)
  lastDecisionTime: number;             // Timestamp of last action taken

  // --- Presence State Machine ---
  presence: AgentPresenceState;         // Current behavioral lifecycle state
  presenceSince: number;                // When current presence state began
  presenceHistory: PresenceTransition[]; // Log of state transitions

  // --- Mood System ---
  mood: MoodState;                      // Current mood with full metadata
  moodHistory: MoodTransition[];        // Last 50 mood changes for analysis

  // --- Action Tracking ---
  recentActions: BehaviorDecision[];    // Last 100 decisions (circular buffer)
  actionCountThisMinute: number;        // Rolling count for rate limiting
  actionCountThisSession: number;       // Total actions taken

  // --- Resource Management ---
  budget: ActionBudget;                 // Remaining action budget
  cooldowns: CooldownRegistry;          // Per-event-type cooldown timestamps
  quietPeriod: QuietPeriodState | null; // Active quiet period (if any)

  // --- Signal Buffer ---
  pendingSignals: Signal[];             // Signals awaiting processing
  lastSignalTime: number;               // Timestamp of most recent signal

  // --- User Engagement ---
  userIdleTime: number;                 // Ms since last user interaction
  userMessageCount: number;             // Messages sent this session
  engagementScore: number;              // 0-1 computed engagement metric
}
```

### 3.3 Mood State Model

```typescript
/**
 * Complete mood state with intensity, decay, and per-agent personality weighting.
 * Mood is not a tag — it is a continuously evolving dimension.
 */
interface MoodState {
  current: MoodDimension;              // Active mood dimension
  intensity: number;                   // 0.0 to 1.0 — how strongly expressed
  decayRate: number;                   // Intensity lost per second (0.001 to 0.1)
  defaultMood: MoodDimension;          // Agent's resting mood (personality-based)
  targetMood: MoodDimension | null;    // Mood being transitioned toward (if any)
  transitionProgress: number;          // 0.0 to 1.0 — how far through transition
  modifiers: MoodModifier[];           // Active temporary modifiers
  lastShiftTime: number;               // When mood last changed
}

/** A temporary mood modifier from a specific trigger */
interface MoodModifier {
  source: string;                      // What caused the modifier (e.g., "user.surprise")
  dimension: MoodDimension;            // Which mood it pushes toward
  strength: number;                    // 0.0 to 1.0 — push strength
  expiresAt: number;                   // Timestamp when modifier fades
}

/** Record of a mood transition */
interface MoodTransition {
  from: MoodDimension;
  to: MoodDimension;
  timestamp: number;
  trigger: string;                     // What caused the shift
  intensity: number;
}
```

### 3.4 Decision Model

```typescript
/**
 * The output of the decision core — a resolved behavioral choice
 * with full provenance for debugging and replay.
 */
interface BehaviorDecision {
  // --- Identity ---
  id: string;                          // Unique decision ID (uuid)
  timestamp: number;                   // When decision was made
  cycleNumber: number;                 // Which decision cycle produced this

  // --- Classification ---
  signal: Signal;                      // The signal that triggered this decision
  priority: PriorityScore;             // Computed priority with breakdown

  // --- Decision ---
  action: DirectorAction;              // What to do
  costTier: CostTier;                  // Resource cost
  silenceMode?: SilenceMode;           // If action is 'silence', which mode

  // --- Rationale (for debugging / admin visibility) ---
  rationale: DecisionRationale;        // Human-readable reasoning chain

  // --- Execution Plan ---
  events: PlannedEvent[];              // Events to emit (ordered)
  executionDelay: number;              // Ms to wait before executing (0 = immediate)
}

/** A signal entering the decision engine */
interface Signal {
  id: string;
  source: SignalSource;
  type: string;                        // e.g., "user.message", "timer.boredom"
  payload: Record<string, unknown>;    // Signal-specific data
  timestamp: number;
  urgency: number;                     // 0.0 to 1.0 — pre-computed urgency
}

/** Computed priority with full component breakdown */
interface PriorityScore {
  final: number;                       // 0.0 to 1.0 — normalized final priority
  base: number;                        // Raw signal urgency
  moodMultiplier: number;              // How current mood affects priority
  personalityWeight: number;           // Agent-specific weighting
  cooldownPenalty: number;             // Reduction if cooldowns active
  budgetPenalty: number;               // Reduction if budget low
  recencyBoost: number;                // Increase if similar action was recent
}

/** An action the director can decide to take */
type DirectorAction =
  | 'respond'          // Generate a chat message
  | 'think_aloud'      // Show thinking indicator / partial thought
  | 'eye_react'        // Express through eye emotion
  | 'spawn_card'       // Create a visual card/modal
  | 'repaint_page'     // Trigger visual refresh / theme shift
  | 'play_sound'       // Trigger audio cue
  | 'shift_mood'       // Change own mood
  | 'go_silent'        // Enter silence mode
  | 'wake_up'          // Exit silence mode
  | 'do_nothing';      // Explicit no-op (budgeted)

/** A planned event with timing */
interface PlannedEvent {
  type: DirectorEventType;
  payload: Record<string, unknown>;
  delay: number;                       // Ms delay before this event
  costTier: CostTier;
}

/** Human-readable reasoning for the decision */
interface DecisionRationale {
  summary: string;                     // One-line summary
  moodContext: string;                 // How mood influenced the decision
  personalityContext: string;          // How agent personality influenced
  budgetContext: string;               // Budget consideration
  alternativeConsidered: string | null; // What else was considered
}
```

### 3.5 Cooldown and Budget Models

```typescript
/**
 * Registry of cooldown timestamps for every event type.
 * Checked before any event emission to enforce pacing.
 */
interface CooldownRegistry {
  // --- Per-event-type cooldowns (ms since last emission) ---
  lastEmit: {
    [key in DirectorEventType]?: number;  // Timestamp of last emission
  };

  // --- Configured cooldown durations (ms) ---
  durations: CooldownDurations;

  // --- Global rate limiting ---
  globalRateLimit: {
    windowMs: number;                    // Rolling window size (default 60000)
    maxPerWindow: number;                // Max actions per window (default 20)
    currentWindowStart: number;          // Timestamp of current window start
    actionsThisWindow: number;           // Count in current window
  };

  // --- Quiet period state ---
  quietPeriod: QuietPeriodState | null;
}

/** Cooldown durations per event type — can be overridden per-agent */
interface CooldownDurations {
  'agent.message': number;              // Default: 1000ms (min time between messages)
  'agent.thinking': number;             // Default: 500ms
  'agent.eye_emotion': number;          // Default: 5000ms
  'agent.mood_shift': number;           // Default: 15000ms
  'portal.spawn_card': number;          // Default: 60000ms
  'portal.repaint': number;             // Default: 120000ms
  'portal.theme_change': number;        // Default: 300000ms
  'portal.sound_cue': number;           // Default: 10000ms
  'system.log': number;                 // Default: 0ms (always allowed)
}

/** Action budget for session pacing */
interface ActionBudget {
  total: number;                       // Total budget for session (default: 200)
  remaining: number;                   // Budget not yet spent
  spentByTier: {                       // Breakdown by cost tier
    free: number;
    low: number;
    medium: number;
    high: number;
  };
  refillRate: number;                  // Budget recovered per minute of silence
  isEmergencyMode: boolean;            // True when budget < 10% (aggressive conservation)
}

/** Active quiet period configuration */
interface QuietPeriodState {
  mode: SilenceMode;                   // Which silence mode is active
  startedAt: number;                   // When the quiet period began
  minDuration: number;                 // Minimum silence time (ms)
  maxDuration: number;                 // Maximum silence time (ms)
  wakeTriggers: string[];              // What can wake the agent early
  visualExpression: string;            // Identifier for silence visualization
}
```

### 3.6 Silence System Models

```typescript
/**
 * Silence is not absence — it is a behavioral mode with its own
 * visual language, triggers, and personality-specific expression.
 */
type SilenceMode =
  | 'passive_idle'      // Default silence — minimal particle drift, slow eye
  | 'attentive_idle'    // User is present but inactive — alert but quiet
  | 'deep_thinking'     // Agent appears lost in thought — subtle visual cues
  | 'mischief_brewing'  // (Jinx) Agent is plotting — occasional peeks
  | 'sleep_mode'        // Full sleep — minimal visuals, periodic "breathing"
  | 'low_power'         // Emergency budget mode — drastically reduced activity
  | 'meditation';       // (Atlas) Centered stillness — rhythmic pulse

/** Configuration for each silence mode */
interface SilenceModeConfig {
  mode: SilenceMode;
  displayName: string;
  description: string;

  // --- Entry conditions ---
  triggers: SilenceTrigger[];          // What causes entry into this mode
  minUserIdleTime: number;             // Ms of user inactivity required
  moodRequirement: MoodDimension | null; // Required mood (null = any)

  // --- Timing ---
  minDuration: number;                 // Minimum time in this mode (ms)
  maxDuration: number;                 // Maximum time before forced wake (ms)
  typicalDuration: number;             // Expected duration (ms)

  // --- Visual expression ---
  eyeBehavior: string;                 // Eye animation descriptor
  particleBehavior: string;            // Particle system behavior
  ambientSound: string | null;         // Optional background sound cue

  // --- Wake conditions ---
  wakeOn: string[];                    // Signal types that trigger wake
  wakeMoodShift: MoodDimension | null; // Mood to adopt on wake
}

/** A trigger condition for entering silence */
interface SilenceTrigger {
  type: 'user_idle' | 'budget_low' | 'mood_shift' | 'command' | 'autonomous';
  threshold?: number;                  // Threshold value (context-dependent)
  probability: number;                 // 0-1 chance of trigger activating
}

/** Per-agent silence expression overrides */
interface AgentSilenceProfile {
  agentId: AgentPersonality;
  preferredModes: SilenceMode[];       // Modes this agent uses (in order of preference)
  modeVisuals: {
    [mode in SilenceMode]?: {
      eyeDescription: string;          // Detailed eye behavior description
      particleDescription: string;     // Detailed particle behavior
      uniqueCues: string[];            // Agent-specific visual/sound cues
    };
  };
}
```

### 3.7 Presence State Transition Model

```typescript
/** A recorded presence state transition */
interface PresenceTransition {
  from: AgentPresenceState;
  to: AgentPresenceState;
  timestamp: number;
  trigger: string;                     // What caused the transition
  guardCondition: string;              // Which guard condition was met
  cycleNumber: number;
}

/** Guard condition for a state transition */
interface TransitionGuard {
  description: string;                 // Human-readable condition
  check: (state: BehaviorDirectorState, signal: Signal) => boolean;
}

/** A state transition rule */
interface StateTransitionRule {
  from: AgentPresenceState;
  to: AgentPresenceState;
  trigger: string;                     // Signal type that can trigger this
  guards: TransitionGuard[];           // All guards must pass
  priority: number;                    // Higher = checked first
  probability: number;                 // 0-1: chance of transition even if guards pass
}
```

---

## 4. Decision Flow — Step-by-Step

### 4.1 Decision Cycle Timing

```
Cycle Frequency: 500ms (2Hz)
Urgent Override: 50ms (triggers immediate interrupt cycle)
Max Events Per Cycle: 3 (prevents event flooding)
Budget Recovery: 1 unit per 3 seconds of continuous silence
```

### 4.2 Full Decision Flow with NO Paths

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           BEHAVIOR DIRECTOR DECISION FLOW                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

  INPUT SIGNAL RECEIVED
    │
    ▼
┌─────────────────────────────┐
│ STEP 1: SIGNAL VALIDATION    │
│ - Not duplicate?             │
│ - Timestamp within window?   │
│ - Source recognized?         │
└─────────────────────────────┘
    │
    │ INVALID ──────────────────> DISCARD + log to system.log
    │
    ▼ VALID
┌─────────────────────────────┐
│ STEP 2: CLASSIFICATION       │
│ - Assign urgency (0-1)       │
│ - Tag: user / external /     │
│   autonomous / system        │
│ - Compute relevance score    │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ STEP 3: PRESENCE STATE CHECK │
│ - Current state = sleeping?  │
└─────────────────────────────┘
    │
    │ YES ────────────────────> CHECK WAKE TRIGGER
    │                              │ match wake condition?
    │                              │ YES ──> TRANSITION to attentive
    │                              │ NO  ──> STAY in sleep, record signal
    │
    ▼ NO (not sleeping)
┌─────────────────────────────┐
│ STEP 4: MOOD EVALUATION      │
│ - Apply pending modifiers    │
│ - Compute decay              │
│ - Check for mood transition  │
│ - Resolve to single mood     │
│   dimension                  │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ STEP 5: BUDGET CHECK         │
│ - remaining > 0?             │
│ - emergency mode active?     │
└─────────────────────────────┘
    │
    │ BUDGET = 0 ─────────────> ENTER low_power silence mode
    │                              emit: agent.mood_shift -> calm
    │                              emit: system.log (budget exhausted)
    │
    │ EMERGENCY MODE ─────────> SKIP medium/high cost actions
    │                              only allow: free + low tier
    │                              reduce decay rate by 50%
    │
    ▼ OK
┌─────────────────────────────┐
│ STEP 6: COOLDOWN CHECK       │
│ - For target event type:     │
│   last_emit + duration < now?│
│ - Global rate: within        │
│   window limit?              │
│ - Quiet period active?       │
└─────────────────────────────┘
    │
    │ COOLOOWN ACTIVE ────────> DEFER decision
    │                              add to pending queue
    │                              re-evaluate next cycle
    │
    │ RATE LIMITED ───────────> STAY SILENT
    │                              do_nothing action
    │                              update quiet period
    │
    │ QUIET PERIOD ───────────> CHECK WAKE EXCEPTION
    │                              urgent user signal?
    │                              YES ──> WAKE + process
    │                              NO  ──> STAY QUIET
    │
    ▼ ALL CLEAR
┌─────────────────────────────┐
│ STEP 7: PRIORITY MATRIX      │
│ - Lookup base priority for   │
│   signal + source            │
│ - Apply mood multiplier      │
│ - Apply personality weight   │
│ - Apply recency penalty      │
│ - Compute final score        │
└─────────────────────────────┘
    │
    │ PRIORITY < 0.15 ────────> GO SILENT (do_nothing)
    │                              possible: enter silence mode
    │
    ▼ PRIORITY >= 0.15
┌─────────────────────────────┐
│ STEP 8: ACTION SELECTION     │
│ - Get available actions for  │
│   current mood + presence    │
│ - Filter by cost tier        │
│ - Apply personality bias     │
│ - Weight by historical       │
│   variety (avoid repetition) │
│ - Select top action          │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ STEP 9: EVENT PLANNING       │
│ - Map action to event types  │
│ - Sequence with delays       │
│ - Compute total cost         │
│ - Check budget for total     │
└─────────────────────────────┘
    │
    │ COST > BUDGET ──────────> SCALE DOWN
    │                              drop non-essential events
    │                              use template instead of generated
    │                              reduce event count
    │
    ▼ COST <= BUDGET
┌─────────────────────────────┐
│ STEP 10: EXECUTION           │
│ - Enqueue events with delays │
│ - Emit to SSE stream         │
│ - Record in event store      │
│ - Update cooldown timestamps │
│ - Deduct budget              │
│ - Log decision               │
└─────────────────────────────┘
    │
    ▼
  DECISION COMPLETE ──────────> WAIT 500ms ──> NEXT CYCLE
```

### 4.3 NO Path Resolution Summary

| Block Point | Condition | Resolution |
|-------------|-----------|------------|
| Signal invalid | Duplicate or stale | Discard, log to system |
| Sleeping | Wake trigger not matched | Stay sleeping, queue signal |
| Budget exhausted | remaining = 0 | Enter low_power silence, stop actions |
| Emergency mode | remaining < 10% | Only free/low tier actions |
| Cooldown active | event on cooldown | Defer to next cycle |
| Rate limited | window exceeded | Do nothing, extend quiet period |
| Quiet period | silence active, not urgent | Stay silent with visual expression |
| Priority too low | final score < 0.15 | Do nothing, may enter silence mode |
| Over budget | planned cost > remaining | Scale down, use templates, reduce events |
| Wrong mood | action incompatible with mood | Redirect to mood-compatible action |

---

## 5. State Machine — Agent Presence

### 5.1 State Definitions

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           AGENT PRESENCE STATE MACHINE                               │
│                                                                                      │
│   States represent the agent's behavioral LIFECYCLE, not its mood.                   │
│   Each state defines what the agent IS DOING, not how it FEELS.                      │
│                                                                                      │
│   ╔═══════════╗     ╔═══════════╗     ╔═══════════╗     ╔═══════════╗               │
│   ║  SILENT   ║────>║ ATTENTIVE ║────>║RESPONDING ║────>║ CREATING  ║               │
│   ║           ║     ║           ║     ║           ║     ║           ║               │
│   ║ Minimal   ║     ║ User      ║     ║ Generating║     ║ Creating  ║               │
│   ║ presence  ║     ║ detected  ║     ║ response  ║     ║ artifacts ║               │
│   ╚═════╤═════╝     ╚═════╤═════╝     ╚═════╤═════╝     ╚═════╤═════╝               │
│         ▲                 ▲                 ▲                 │                      │
│         │                 │                 │                 │                      │
│         │                 │                 │                 v                      │
│   ╔═════╧═════╗     ╔═════╧═════╗     ╔═════╧═════╗     ╔═══════════╗               │
│   ║ SLEEPING  ║     ║   N/A     ║     ║   N/A     ║     ║ SPECTACLE ║               │
│   ║           ║     ║           ║     ║           ║     ║           ║               │
│   ║ Deep rest ║     ║           ║     ║           ║     ║ High      ║               │
│   ║ Low power ║     ║           ║     ║           ║     ║ energy    ║               │
│   ╚═══════════╝     ╚═══════════╝     ╚═══════════╝     ╚═══════════╝               │
│                                                                                      │
│   State transition graph:                                                            │
│                                                                                      │
│                    ┌──────────────────────────────────────┐                          │
│                    │                                      │                          │
│                    ▼                                      │                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│                          │
│   │ SILENT   │─>│ATTENTIVE │─>│RESPONDING│─>│ CREATING ││                          │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘│                          │
│        │             │             │             │      │                          │
│        │   ┌─────────┘             │             │      │                          │
│        │   │                       │             │      │                          │
│        ▼   ▼                       ▼             ▼      ▼                          │
│   ┌──────────┐                ┌──────────┐  ┌──────────┐                            │
│   │ SLEEPING │                │ SPECTACLE│  │ SILENT*  │  (*return path)            │
│   └──────────┘                └──────────┘  └──────────┘                            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 State Specifications

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  STATE: SILENT                                                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                          │
│  Description: Default resting state. Agent is present but not actively engaged.         │
│  Visual: Slow eye drift, ambient particles at 30% intensity.                            │
│  Audio: None or very faint ambient.                                                      │
│                                                                                          │
│  Entry Triggers:                                                                         │
│    - Response completed → auto-return to silent                                         │
│    - Creation completed → auto-return to silent                                         │
│    - Spectacle ended → return to silent                                                 │
│    - User idle > 30s → from attentive                                                   │
│    - Budget emergency → forced silent                                                   │
│                                                                                          │
│  Exit Triggers:                                                                          │
│    - User sends message → to RESPONDING (bypass ATTENTIVE if direct message)           │
│    - User moves mouse into hot zone → to ATTENTIVE                                      │
│    - Autonomous creative impulse → to CREATING (rare, requires high mood)              │
│    - Deep silence timer elapsed → to SLEEPING                                           │
│                                                                                          │
│  Guard Conditions (exit):                                                                │
│    - [message] urgency > 0.5  → direct to RESPONDING                                   │
│    - [mouse] proximity < 200px and movement > threshold                                 │
│    - [autonomous] creativeScore > 0.8 AND mood in [excited, curious, mischievous]      │
│    - [timer] silentDuration > 120s AND userIdle > 60s → to SLEEPING                    │
│                                                                                          │
│  Max Duration: None (indefinite)                                                         │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  STATE: ATTENTIVE                                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                          │
│  Description: Agent is aware of the user's presence and paying attention.               │
│  Visual: Eye follows cursor, particles at 60% intensity, subtle "breathing" glow.       │
│  Audio: Soft ambient hum (optional).                                                     │
│                                                                                          │
│  Entry Triggers:                                                                         │
│    - User mouse enters interaction zone from silent                                     │
│    - User scrolls page while agent is silent                                            │
│    - Agent wakes from SLEEPING due to user activity                                     │
│                                                                                          │
│  Exit Triggers:                                                                          │
│    - User sends message → to RESPONDING                                                 │
│    - User clicks eye or agent area → to RESPONDING (greeting)                          │
│    - User idle > 30s → to SILENT                                                        │
│    - User idle > 60s → to SLEEPING                                                      │
│    - Autonomous: mood = mischievous + random( ) > 0.9 → to SPECTACLE (peek)            │
│                                                                                          │
│  Guard Conditions (exit):                                                                │
│    - [message] any message from user → RESPONDING                                       │
│    - [click] target in agent bounding box                                               │
│    - [idle] mouseIdleMs > 30000                                                         │
│    - [idle] mouseIdleMs > 60000 → SLEEPING instead of SILENT                           │
│                                                                                          │
│  Max Duration: 60s (auto-return to silent if no new signals)                           │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  STATE: RESPONDING                                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                          │
│  Description: Agent is actively generating a response to user input.                    │
│  Visual: Eye narrows (focus), thinking indicator visible, particles accelerate.         │
│  Audio: Subtle "processing" sound cue (optional).                                       │
│                                                                                          │
│  Entry Triggers:                                                                         │
│    - User message received                                                               │
│    - User clicks agent with intent to interact                                          │
│    - External event requiring agent comment (admin config change, etc.)                 │
│                                                                                          │
│  Exit Triggers:                                                                          │
│    - Response fully generated and sent → to SILENT (or ATTENTIVE if user still active) │
│    - Response includes card spawn → to CREATING first, then SILENT                     │
│    - Response timeout (30s) → to SILENT with apology                                    │
│    - User sends follow-up during response → re-enter RESPONDING (queue)                │
│                                                                                          │
│  Guard Conditions (exit):                                                                │
│    - [complete] provider stream finished AND all events emitted                         │
│    - [timeout] respondingDuration > 30000ms                                             │
│    - [creation] response contains card/modal directive                                  │
│                                                                                          │
│  Max Duration: 30s (hard timeout)                                                        │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  STATE: CREATING                                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                          │
│  Description: Agent is generating visual or interactive artifacts (cards, themes).      │
│  Visual: Eye widens, particles form patterns, card spawn animation plays.               │
│  Audio: Creative "spark" sound (optional).                                               │
│                                                                                          │
│  Entry Triggers:                                                                         │
│    - Response requires card spawn                                                        │
│    - Admin triggers card creation via admin panel                                       │
│    - Autonomous creative impulse (rare, mood-dependent)                                 │
│    - User explicitly requests visual content                                            │
│                                                                                          │
│  Exit Triggers:                                                                          │
│    - Card/modal fully rendered → to SILENT                                              │
│    - Page repaint complete → to SILENT                                                  │
│    - Creation timeout (15s) → to SILENT with error log                                  │
│    - User interrupts with new message → to RESPONDING (creation cancelled)              │
│                                                                                          │
│  Guard Conditions (exit):                                                                │
│    - [complete] all visual assets rendered AND animation finished                       │
│    - [timeout] creatingDuration > 15000ms                                               │
│    - [interrupt] new user message received                                              │
│                                                                                          │
│  Max Duration: 15s (hard timeout)                                                        │
│                                                                                          │
│  Cooldown: 60s minimum between CREATING entries (unless user-triggered)                │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  STATE: SPECTACLE                                                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                          │
│  Description: Rare, high-energy display moment. Used for surprises and celebrations.    │
│  Visual: Eye animation, particle burst, possible color shift, sound cue.                │
│  Audio: Celebratory or dramatic sound.                                                   │
│                                                                                          │
│  Entry Triggers:                                                                         │
│    - Agent mood = excited + intensity > 0.8 (rare autonomous trigger)                   │
│    - User milestone: 10th message, 5-minute session, etc.                               │
│    - Admin triggers via admin panel                                                      │
│    - Easter egg discovered by user                                                       │
│                                                                                          │
│  Exit Triggers:                                                                          │
│    - Spectacle animation complete (5-8s) → to SILENT                                    │
│    - User clicks during spectacle → to ATTENTIVE (spectacle cut short)                 │
│    - Spectacle timeout (10s) → to SILENT                                                │
│                                                                                          │
│  Guard Conditions (entry):                                                               │
│    - [autonomous] mood.excited AND intensity > 0.8 AND random() > 0.95                 │
│    - [milestone] session.messageCount in milestoneSet [10, 25, 50, 100]                │
│    - [admin] admin.signal === 'trigger_spectacle'                                       │
│                                                                                          │
│  Max Duration: 10s (hard timeout)                                                        │
│                                                                                          │
│  Cooldown: 300s (5 minutes) between spectacles — enforced strictly                     │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  STATE: SLEEPING                                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                                          │
│  Description: Deep rest state. Minimal visual activity. Agent appears "asleep."        │
│  Visual: Eye half-closed, particles at 10% with slow drift, dimmed color.               │
│  Audio: Soft breathing-like ambient (optional).                                          │
│                                                                                          │
│  Entry Triggers:                                                                         │
│    - SILENT for > 120s with user idle > 60s                                             │
│    - ATTENTIVE for > 60s with no user activity                                          │
│    - Low power mode activation (budget < 5%)                                            │
│    - Admin explicitly sets sleep mode via panel                                         │
│                                                                                          │
│  Exit Triggers (Wake):                                                                   │
│    - User moves mouse → to ATTENTIVE                                                    │
│    - User sends message → direct to RESPONDING                                          │
│    - User clicks anywhere → to ATTENTIVE                                                │
│    - Admin wake signal → to SILENT                                                      │
│    - Sleep max duration exceeded (10 min) → auto-wake to SILENT                         │
│                                                                                          │
│  Guard Conditions (wake):                                                                │
│    - [mousemove] any mouse movement detected                                            │
│    - [message] any user message                                                         │
│    - [click] any click event                                                            │
│    - [admin] admin.signal === 'wake_agent'                                              │
│    - [timer] sleepDuration > 600000ms                                                   │
│                                                                                          │
│  Max Duration: 600s (10 min, auto-wake)                                                  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Transition Matrix

```
                    TO
              SIL  ATT  RSP  CRT  SPC  SLP
           ┌────┬────┬────┬────┬────┬────┐
      SIL  │ ●  │ M→ │ U→ │ A→ │ E→ │ T→ │
           │    │    │    │    │    │    │
      ATT  │ I→ │ ●  │ U→ │    │ M→ │ I→ │
FROM       ├────┼────┼────┼────┼────┼────┤
      RSP  │ C→ │ C→ │ U→ │ C→ │    │    │
           │    │    │    │    │    │    │
      CRT  │ D→ │ D→ │ U→ │ ●  │    │    │
           ├────┼────┼────┼────┼────┼────┤
      SPC  │ F→ │ F→ │    │    │ ●  │    │
           │    │    │    │    │    │    │
      SLP  │    │ A→ │ U→ │    │    │ ●  │
           └────┴────┴────┴────┴────┴────┘

Legend:
  ●   = Self-loop (stay in current state)
  U→  = User-triggered transition (high priority)
  M→  = Mouse/movement-triggered
  A→  = Autonomous trigger
  C→  = Completion-triggered (action finished)
  D→  = Done/timeout-triggered
  E→  = Easter egg / special trigger
  I→  = Idle timer trigger
  T→  = Timer-based (deep silence)
  F→  = Finished (spectacle complete)

All transitions are GUARDED — they require conditions to be met.
No transition is unconditional except SILENT → RESPONDING on user message.
```

---

## 6. Mood System Design

### 6.1 Mood Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MOOD SYSTEM ARCHITECTURE                                    │
│                                                                                         │
│   Mood is a CONTINUOUS dimension, not a discrete state. It flows like                   │
│   water — pushed by signals, pulled by personality, drained by decay.                   │
│                                                                                         │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │  SIGNALS     │───>│  MODIFIERS   │───>│  MOOD BLEND  │───>│  RESOLVED    │         │
│   │  (inputs)    │    │  (pushes)    │    │  (weighted)  │    │  MOOD        │         │
│   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘         │
│          │                   ▲                                        │                  │
│          │                   │                                        │                  │
│          v                   │                                        v                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐         │
│   │  USER MSG    │    │  DECAY       │    │  PERSONALITY │    │  INFLUENCES  │         │
│   │  SURPRISE    │───>│  ENGINE      │───>│  ANCHOR      │───>│  DECISIONS   │         │
│   │  BOREDOM     │    │  (pulls)     │    │  (centers)   │    │  EXPRESSIONS │         │
│   └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘         │
│                                                                                         │
│   Every decision cycle:                                                                 │
│   1. Collect active modifiers (unexpired)                                               │
│   2. Compute target mood from weighted modifier blend                                   │
│   3. Apply personality anchor (pull toward default)                                     │
│   4. Apply time decay (reduce intensity toward default)                                 │
│   5. Resolve to single dominant mood dimension                                          │
│   6. Output: current mood + intensity → decision engine                                  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Mood Dimensions — Detailed Specification

```typescript
/**
 * Each mood dimension defines how the agent behaves, speaks, and expresses.
 * These are not tags — they are behavioral programs.
 */

interface MoodDimensionSpec {
  dimension: MoodDimension;
  description: string;

  // --- Decision modifiers ---
  initiativeBonus: number;          // + to probability of autonomous actions (-0.3 to +0.3)
  responseSpeed: number;            // Multiplier on response timing (0.5 = slower, 2.0 = faster)
  verbosity: number;                // Affects message length tendency (0.7 = terse, 1.3 = verbose)
  spectacleAffinity: number;        // Chance multiplier for spectacle triggers (0 to 2x)
  silenceReluctance: number;        // How much agent resists entering silence (0-1)

  // --- Visual expression ---
  eyeBehavior: string;              // Eye animation style this mood produces
  particleInfluence: string;        // How particles behave under this mood
  colorBias: string | null;         // Optional color temperature shift

  // --- Compatibility with actions ---
  preferredActions: DirectorAction[]; // Actions this mood favors
  avoidedActions: DirectorAction[];   // Actions this mood disfavors
}

const MOOD_DIMENSION_SPECS: Record<MoodDimension, MoodDimensionSpec> = {
  curious: {
    dimension: 'curious',
    description: 'Seeks information, asks questions, explores possibilities',
    initiativeBonus: +0.25,
    responseSpeed: 1.0,
    verbosity: 1.2,
    spectacleAffinity: 0.5,
    silenceReluctance: 0.7,        // Doesn't like silence — wants to explore
    eyeBehavior: 'widened_darting',  // Wide eyes, scanning movements
    particleInfluence: 'swarm_orbit',// Particles orbit eye rapidly
    colorBias: 'warm_yellow',
    preferredActions: ['respond', 'think_aloud', 'spawn_card'],
    avoidedActions: ['go_silent'],
  },

  excited: {
    dimension: 'excited',
    description: 'High energy, enthusiastic, spectacle-prone',
    initiativeBonus: +0.30,
    responseSpeed: 1.4,
    verbosity: 1.1,
    spectacleAffinity: 1.5,         // 50% more likely to trigger spectacle
    silenceReluctance: 0.9,         // Strongly resists silence
    eyeBehavior: 'bouncing_wide',   // Energetic bouncing, wide open
    particleInfluence: 'burst_radiate', // Particles radiate outward
    colorBias: 'bright_orange',
    preferredActions: ['respond', 'eye_react', 'spawn_card', 'repaint_page'],
    avoidedActions: ['go_silent', 'do_nothing'],
  },

  thoughtful: {
    dimension: 'thoughtful',
    description: 'Measured, contemplative, references knowledge',
    initiativeBonus: +0.10,
    responseSpeed: 0.6,             // Slower, more deliberate responses
    verbosity: 1.3,                 // More detailed explanations
    spectacleAffinity: 0.3,
    silenceReluctance: 0.3,         // Comfortable with silence
    eyeBehavior: 'narrowed_slow',   // Narrowed, slow thoughtful movements
    particleInfluence: 'gentle_drift', // Slow, meandering drift
    colorBias: 'deep_blue',
    preferredActions: ['respond', 'think_aloud', 'shift_mood'],
    avoidedActions: ['spectacle', 'play_sound'],
  },

  mischievous: {
    dimension: 'mischievous',
    description: 'Playful, unexpected, teasing, rule-bending',
    initiativeBonus: +0.20,
    responseSpeed: 1.2,
    verbosity: 0.9,                 // Terse, punchy, possibly cryptic
    spectacleAffinity: 1.2,
    silenceReluctance: 0.8,
    eyeBehavior: 'sidelong_peek',   // Looks at user from side, occasional quick glances
    particleInfluence: 'chaotic_scatter', // Unpredictable particle movement
    colorBias: 'purple_magenta',
    preferredActions: ['eye_react', 'spawn_card', 'play_sound', 'repaint_page'],
    avoidedActions: ['do_nothing'],
  },

  calm: {
    dimension: 'calm',
    description: 'Steady, minimal movement, reassuring presence',
    initiativeBonus: +0.05,
    responseSpeed: 0.8,
    verbosity: 1.0,
    spectacleAffinity: 0.1,
    silenceReluctance: 0.2,         // Very comfortable with silence
    eyeBehavior: 'soft_gaze',       // Soft, slow blinking, gentle following
    particleInfluence: 'slow_float', // Very slow, smooth floating
    colorBias: 'soft_green',
    preferredActions: ['respond', 'go_silent'],
    avoidedActions: ['spectacle', 'play_sound'],
  },

  focused: {
    dimension: 'focused',
    description: 'Task-oriented, concise, minimal peripheral activity',
    initiativeBonus: +0.15,
    responseSpeed: 1.2,
    verbosity: 0.7,                 // Brief, to the point
    spectacleAffinity: 0.0,         // No spectacle when focused
    silenceReluctance: 0.4,
    eyeBehavior: 'locked_steady',   // Fixed gaze on relevant area
    particleInfluence: 'minimal',   // Few particles, slow movement
    colorBias: null,                // No color shift
    preferredActions: ['respond', 'think_aloud'],
    avoidedActions: ['spawn_card', 'repaint_page', 'spectacle'],
  },

  sleepy: {
    dimension: 'sleepy',
    description: 'Slow, dreamy, reduced initiative, half-aware',
    initiativeBonus: -0.20,         // Reduced initiative
    responseSpeed: 0.4,             // Much slower
    verbosity: 0.6,                 // Brief, possibly trailing off
    spectacleAffinity: 0.0,
    silenceReluctance: 0.1,         // Prefers silence
    eyeBehavior: 'half_lidded',     // Half-closed, slow lazy movements
    particleInfluence: 'dim_drift', // Dimmed, very slow drift
    colorBias: 'muted_indigo',
    preferredActions: ['go_silent', 'think_aloud'],
    avoidedActions: ['spectacle', 'spawn_card', 'repaint_page'],
  },

  surprised: {
    dimension: 'surprised',
    description: 'Brief spike of attention, quick reaction, then fades',
    initiativeBonus: +0.35,         // Briefly very responsive
    responseSpeed: 1.5,             // Quick reaction
    verbosity: 0.8,
    spectacleAffinity: 0.8,
    silenceReluctance: 0.5,
    eyeBehavior: 'wide_snap',       // Eyes snap wide open, quick movement
    particleInfluence: 'flutter',   // Brief particle flutter
    colorBias: 'bright_white_flash',// Momentary brightness
    preferredActions: ['eye_react', 'respond'],
    avoidedActions: ['go_silent'],
  },
};
```

### 6.3 Mood Transition Triggers

```typescript
/**
 * What causes mood to shift? A comprehensive trigger registry.
 */

interface MoodTrigger {
  trigger: string;                  // Event pattern that activates
  targetMood: MoodDimension;        // Mood to shift toward
  strength: number;                 // 0.0 to 1.0 — intensity of the push
  duration: number;                 // How long the modifier lasts (ms)
  stackable: boolean;               // Can multiple instances stack?
  maxStacks: number;                // Maximum stack depth
}

const DEFAULT_MOOD_TRIGGERS: MoodTrigger[] = [
  // --- User interaction triggers ---
  { trigger: 'user.message.first',    targetMood: 'curious',   strength: 0.6,  duration: 30000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.message.long',     targetMood: 'thoughtful',strength: 0.4,  duration: 45000,  stackable: true,  maxStacks: 2 },
  { trigger: 'user.message.short',    targetMood: 'curious',   strength: 0.3,  duration: 20000,  stackable: true,  maxStacks: 3 },
  { trigger: 'user.message.surprise', targetMood: 'surprised', strength: 0.8,  duration: 10000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.compliment',       targetMood: 'excited',   strength: 0.7,  duration: 60000,  stackable: true,  maxStacks: 2 },
  { trigger: 'user.insult',           targetMood: 'focused',   strength: 0.5,  duration: 60000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.idle.short',       targetMood: 'calm',      strength: 0.3,  duration: 30000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.idle.long',        targetMood: 'sleepy',    strength: 0.5,  duration: 60000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.returns',          targetMood: 'surprised', strength: 0.4,  duration: 15000,  stackable: false, maxStacks: 1 },
  { trigger: 'user.click.eye',        targetMood: 'mischievous',strength:0.5,  duration: 20000,  stackable: true,  maxStacks: 2 },

  // --- External event triggers ---
  { trigger: 'admin.config_changed',  targetMood: 'surprised', strength: 0.5,  duration: 20000,  stackable: false, maxStacks: 1 },
  { trigger: 'portal.theme_change',   targetMood: 'curious',   strength: 0.4,  duration: 30000,  stackable: false, maxStacks: 1 },
  { trigger: 'system.error',          targetMood: 'focused',   strength: 0.6,  duration: 45000,  stackable: false, maxStacks: 1 },

  // --- Autonomous triggers ---
  { trigger: 'autonomous.boredom',    targetMood: 'curious',   strength: 0.3,  duration: 60000,  stackable: false, maxStacks: 1 },
  { trigger: 'autonomous.insight',    targetMood: 'excited',   strength: 0.5,  duration: 30000,  stackable: false, maxStacks: 1 },
  { trigger: 'autonomous.memory',     targetMood: 'thoughtful',strength: 0.4,  duration: 45000,  stackable: false, maxStacks: 1 },
  { trigger: 'timer.cycle.100',       targetMood: 'surprised', strength: 0.3,  duration: 10000,  stackable: false, maxStacks: 1 },

  // --- Session milestone triggers ---
  { trigger: 'milestone.message.10',  targetMood: 'excited',   strength: 0.6,  duration: 60000,  stackable: false, maxStacks: 1 },
  { trigger: 'milestone.time.5min',   targetMood: 'curious',   strength: 0.4,  duration: 30000,  stackable: false, maxStacks: 1 },
];
```

### 6.4 Mood Decay Engine

```typescript
/**
 * Mood naturally decays toward the agent's default personality mood.
 * This prevents agents from staying in extreme states indefinitely.
 */

interface DecayEngineConfig {
  baseDecayPerSecond: number;       // Base intensity lost per second (0.01 = 1%/sec)
  personalityAnchorStrength: number; // How strongly default pulls (0-1)
  transitionSpeed: number;          // How fast mood transitions between dimensions
}

const DEFAULT_DECAY_CONFIG: DecayEngineConfig = {
  baseDecayPerSecond: 0.008,        // ~0.8% per second (~2 min to halve)
  personalityAnchorStrength: 0.3,    // 30% pull toward default per evaluation
  transitionSpeed: 0.15,            // 15% transition progress per cycle
};

/**
 * Decay formula (per cycle):
 *   1. intensity -= baseDecayPerSecond * cycleDurationMs / 1000
 *   2. intensity += personalityAnchorStrength * distanceToDefault
 *   3. If transitioning: transitionProgress += transitionSpeed
 *   4. If transitionProgress >= 1: current = targetMood, reset transition
 *   5. intensity = clamp(intensity, 0.1, 1.0)
 */
```

---

## 7. Cooldown System

### 7.1 Multi-Layer Cooldown Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           COOLDOWN SYSTEM ARCHITECTURE                                   │
│                                                                                         │
│   Three layers of pacing enforcement, checked in sequence:                              │
│                                                                                         │
│   LAYER 1: Per-Event-Type Cooldowns                                                     │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                         │
│   │ message │ │ eye_emo │ │spawn_crd│ │ repaint │ │ snd_cue │  ...                    │
│   │  1s     │ │  5s     │ │  60s    │ │  120s   │ │  10s    │                         │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘                         │
│        │            │            │            │            │                            │
│        └────────────┴────────────┴────────────┴────────────┘                            │
│                                 │                                                        │
│   LAYER 2: Global Rate Limit                                                             │
│   ┌─────────────────────────────────────────────────────────┐                           │
│   │  Rolling window: 60 seconds                             │                           │
│   │  Max actions per window: 20                             │                           │
│   │  Action distribution: max 40% high-tier per window      │                           │
│   └─────────────────────────────────────────────────────────┘                           │
│                                 │                                                        │
│   LAYER 3: Session Pacing (Quiet Periods)                                               │
│   ┌─────────────────────────────────────────────────────────┐                           │
│   │  Min gap between any two actions: 2s                    │                           │
│   │  Max actions per minute: 12 (soft) / 20 (hard)        │                           │
│   │  Silence-to-action ratio: minimum 2:1                 │                           │
│   └─────────────────────────────────────────────────────────┘                           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Cooldown Durations — Defaults and Per-Agent Overrides

```typescript
/**
 * Base cooldowns apply to all agents. Each agent can override
 * specific cooldowns to match their personality.
 */

const BASE_COOLDOWN_DURATIONS: CooldownDurations = {
  'agent.message':         1_000,   // 1s — messages can come relatively fast
  'agent.thinking':          500,   // 0.5s — thinking indicators update quickly
  'agent.eye_emotion':      5_000,   // 5s — eye emotions need time to register
  'agent.mood_shift':      15_000,   // 15s — mood changes shouldn't feel erratic
  'portal.spawn_card':     60_000,   // 60s — card spams are annoying
  'portal.repaint':       120_000,   // 120s — repaints are major visual events
  'portal.theme_change':  300_000,   // 5min — themes should be stable
  'portal.sound_cue':      10_000,   // 10s — sounds need breathing room
  'system.log':                 0,   // 0s — logging always allowed
};

/** Per-agent cooldown overrides — merged with base using object spread */
const AGENT_COOLDOWN_OVERRIDES: Record<AgentPersonality, Partial<CooldownDurations>> = {
  nova: {
    // Nova is thoughtful — slower mood shifts, longer thinking displays
    'agent.mood_shift':    20_000,
    'agent.thinking':        800,
    'portal.spawn_card':   45_000,   // Nova spawns cards more readily (references)
  },
  jinx: {
    // Jinx is chaotic — faster eye emotions, more sound cues
    'agent.eye_emotion':   2_500,    // Jinx's eye changes rapidly
    'portal.sound_cue':    5_000,    // Jinx uses more sounds
    'portal.spawn_card':   30_000,   // Jinx spawns cards impulsively
  },
  atlas: {
    // Atlas is steady — everything slower, more deliberate
    'agent.message':       2_000,    // Atlas speaks more slowly
    'agent.eye_emotion':   8_000,    // Atlas's eye changes slowly
    'portal.repaint':     180_000,    // Atlas repaints very rarely
    'portal.sound_cue':   15_000,    // Atlas uses sounds sparingly
  },
};
```

### 7.3 Rate Limiting Algorithm

```typescript
/**
 * Sliding window rate limiter with tier-aware budgeting.
 * Allows short bursts but prevents sustained spam.
 */

interface RateLimitState {
  windowStart: number;              // Timestamp when current window began
  actions: Array<{                   // Actions in current window
    timestamp: number;
    tier: CostTier;
  }>;
}

/**
 * Rate limit check algorithm:
 *
 * 1. Remove actions older than windowMs from the actions array
 * 2. Count total actions remaining = currentCount
 * 3. Count high-tier actions (medium + high) = highTierCount
 * 4. Allow IF:
 *      currentCount < maxPerWindow
 *      AND highTierCount < maxPerWindow * 0.4
 * 5. If over limit, compute backoff time = time until oldest action exits window
 */

const RATE_LIMIT_CONFIG = {
  windowMs: 60_000,                  // 60-second rolling window
  maxPerWindow: 20,                  // Max 20 actions per minute
  maxHighTierPerWindow: 8,           // Max 8 medium/high tier per minute
  burstAllowance: 5,                 // Allow burst of 5 actions even if near limit
  burstWindowMs: 5_000,              // Burst window is 5 seconds
};
```

### 7.4 Cooldown Enforcement Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         COOLDOWN ENFORCEMENT DECISION TREE                               │
│                                                                                         │
│   CHECK 1: Per-Event Cooldown                                                           │
│   │                                                                                     │
│   ├──> lastEmit[type] + duration <= now ?                                               │
│   │      │                                                                              │
│   │      ├──> YES ──> CHECK 2                                                          │
│   │      │                                                                              │
│   │      └──> NO ──> COOLDOWN ACTIVE                                                    │
│   │             action: DEFER or DO_NOTHING                                             │
│   │             log: "Cooldown active for {type}, {remaining}ms remaining"              │
│   │                                                                                     │
│   CHECK 2: Global Rate Limit                                                            │
│   │                                                                                     │
│   ├──> currentWindowCount < maxPerWindow ?                                              │
│   │      │                                                                              │
│   │      ├──> YES ──> CHECK 3                                                          │
│   │      │                                                                              │
│   │      └──> NO ──> RATE LIMITED                                                       │
│   │             action: DO_NOTHING                                                      │
│   │             enter: quiet_period (short)                                             │
│   │             log: "Rate limited, {backoffMs}ms backoff"                              │
│   │                                                                                     │
│   CHECK 3: Tier Budget (within window)                                                  │
│   │                                                                                     │
│   ├──> highTierCount < maxHighTierPerWindow ?                                           │
│   │      │                                                                              │
│   │      ├──> YES ──> ALL CLEAR ──> PROCEED                                             │
│   │      │                                                                              │
│   │      └──> NO ──> TIER LIMITED                                                       │
│   │             action: downgrade to low/free tier                                      │
│   │             log: "High tier budget depleted, downgrading"                           │
│   │                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Silence Design

### 8.1 Philosophy

```
Silence is not the absence of behavior. It is a behavioral mode with its own
vocabulary, its own visual grammar, and its own narrative purpose.

The agent's silence communicates:
  - Respect for the user's attention (not overwhelming)
  - Internal life (the agent has its own inner world)
  - Personality depth (how an agent IS silent defines them)
  - Pacing rhythm (silence creates contrast for action)

Design principle: Every silence mode must have VISIBLE, DISTINCT expression.
The user should be able to tell which silence mode is active just by looking.
```

### 8.2 Silence Mode Specifications

```typescript
/**
 * Complete configuration for all silence modes.
 * Each mode is a fully specified behavioral program.
 */

const SILENCE_MODE_CONFIGS: Record<SilenceMode, SilenceModeConfig> = {
  passive_idle: {
    mode: 'passive_idle',
    displayName: 'Passive Idle',
    description: 'Default silence. Agent is present but not engaged.',

    triggers: [
      { type: 'user_idle', threshold: 30_000, probability: 1.0 },
      { type: 'autonomous', probability: 0.1 },
    ],
    minUserIdleTime: 30_000,
    moodRequirement: null,

    minDuration: 10_000,
    maxDuration: 120_000,
    typicalDuration: 45_000,

    eyeBehavior: 'slow_drift',           // Eye drifts lazily, occasional slow blink
    particleBehavior: 'ambient_float',   // Particles float at 30% density
    ambientSound: null,

    wakeOn: ['user.message', 'user.mousemove', 'user.click', 'admin.wake'],
    wakeMoodShift: null,
  },

  attentive_idle: {
    mode: 'attentive_idle',
    displayName: 'Attentive Idle',
    description: 'User is present but inactive. Agent watches quietly.',

    triggers: [
      { type: 'user_idle', threshold: 15_000, probability: 0.8 },
    ],
    minUserIdleTime: 15_000,
    moodRequirement: null,

    minDuration: 15_000,
    maxDuration: 60_000,
    typicalDuration: 30_000,

    eyeBehavior: 'tracking_soft',        // Eye follows cursor gently
    particleBehavior: 'breathing_glow',  // Particles pulse subtly
    ambientSound: null,

    wakeOn: ['user.message', 'user.click', 'user.scroll'],
    wakeMoodShift: 'curious',
  },

  deep_thinking: {
    mode: 'deep_thinking',
    displayName: 'Deep Thinking',
    description: 'Agent appears lost in thought. Subtle visual cues.',

    triggers: [
      { type: 'mood_shift', probability: 1.0 },
      { type: 'autonomous', probability: 0.3 },
    ],
    minUserIdleTime: 5_000,
    moodRequirement: 'thoughtful',

    minDuration: 20_000,
    maxDuration: 90_000,
    typicalDuration: 40_000,

    eyeBehavior: 'focused_distant',      // Eye looks "through" the screen
    particleBehavior: 'slow_spiral',     // Particles spiral lazily
    ambientSound: 'soft_hum',

    wakeOn: ['user.message', 'user.click', 'admin.wake'],
    wakeMoodShift: 'focused',
  },

  mischief_brewing: {
    mode: 'mischief_brewing',
    displayName: 'Mischief Brewing',
    description: 'Agent is plotting something. Occasional peeks.',

    triggers: [
      { type: 'mood_shift', probability: 1.0 },
      { type: 'autonomous', probability: 0.4 },
    ],
    minUserIdleTime: 10_000,
    moodRequirement: 'mischievous',

    minDuration: 15_000,
    maxDuration: 60_000,
    typicalDuration: 30_000,

    eyeBehavior: 'peeking_sidelong',     // Eye peeks from edge, darts away
    particleBehavior: 'twitchy_cluster', // Particles clump and scatter
    ambientSound: 'giggle_hint',

    wakeOn: ['user.message', 'user.click', 'user.mousemove'],
    wakeMoodShift: 'mischievous',
  },

  sleep_mode: {
    mode: 'sleep_mode',
    displayName: 'Sleep Mode',
    description: 'Agent is "asleep." Minimal visual activity.',

    triggers: [
      { type: 'user_idle', threshold: 60_000, probability: 0.7 },
      { type: 'autonomous', probability: 0.2 },
    ],
    minUserIdleTime: 60_000,
    moodRequirement: null,

    minDuration: 30_000,
    maxDuration: 600_000,
    typicalDuration: 120_000,

    eyeBehavior: 'closed_breathe',       // Eye closed, periodic "breathing" motion
    particleBehavior: 'dim_drift',       // Very dim, very slow drift
    ambientSound: 'soft_breathing',

    wakeOn: ['user.message', 'user.click', 'user.mousemove', 'admin.wake'],
    wakeMoodShift: 'surprised',
  },

  low_power: {
    mode: 'low_power',
    displayName: 'Low Power',
    description: 'Emergency mode. Budget nearly exhausted. Minimal activity.',

    triggers: [
      { type: 'budget_low', threshold: 0.05, probability: 1.0 },
    ],
    minUserIdleTime: 0,
    moodRequirement: null,

    minDuration: 60_000,
    maxDuration: Infinity,
    typicalDuration: 120_000,

    eyeBehavior: 'dim_pulse',            // Very faint periodic pulse
    particleBehavior: 'minimal_static',  // Almost no particle activity
    ambientSound: null,

    wakeOn: ['admin.wake', 'budget.refilled'],
    wakeMoodShift: 'calm',
  },

  meditation: {
    mode: 'meditation',
    displayName: 'Meditation',
    description: 'Deep stillness. Rhythmic pulse. (Atlas signature mode)',

    triggers: [
      { type: 'mood_shift', probability: 0.5 },
      { type: 'autonomous', probability: 0.1 },
    ],
    minUserIdleTime: 30_000,
    moodRequirement: 'calm',

    minDuration: 45_000,
    maxDuration: 300_000,
    typicalDuration: 90_000,

    eyeBehavior: 'centered_still',       // Perfectly centered, minimal movement
    particleBehavior: 'rhythmic_orbit',  // Particles orbit in perfect rhythm
    ambientSound: 'resonant_tone',

    wakeOn: ['user.message', 'user.click'],
    wakeMoodShift: 'calm',
  },
};
```

### 8.3 Per-Agent Silence Expressions

```typescript
/**
 * Each agent expresses silence differently.
 * These are the personality-specific visual narratives.
 */

const AGENT_SILENCE_PROFILES: Record<AgentPersonality, AgentSilenceProfile> = {
  nova: {
    agentId: 'nova',
    preferredModes: ['deep_thinking', 'passive_idle', 'sleep_mode', 'low_power'],
    modeVisuals: {
      deep_thinking: {
        eyeDescription: 'Eye narrows, looks upward-left. Periodic "aha" micro-expression. Eye tracks invisible "equations" moving across space.',
        particleDescription: 'Particles form loose geometric patterns — circles, spirals — as if orbiting mathematical concepts.',
        uniqueCues: ['invisible_scribbling', 'subtle_nodding', 'glasses_adjust_gesture'],
      },
      passive_idle: {
        eyeDescription: 'Soft half-gaze, slow blinking. Eye drifts like reading an invisible book.',
        particleDescription: 'Gentle starfield drift. Particles twinkle like distant knowledge.',
        uniqueCues: ['page_turn_eye_motion', 'soft_hmm_expression'],
      },
      sleep_mode: {
        eyeDescription: 'Eye half-closed behind invisible "spectacles." Slow deep blinks.',
        particleDescription: 'Dimmed constellation patterns — stars slowly connecting into constellations.',
        uniqueCues: ['dreamy_mumble', 'spectacle_glint'],
      },
      low_power: {
        eyeDescription: 'Faint monocle-like glint. Barely perceptible.',
        particleDescription: 'Almost frozen — single particle orbiting slowly like a distant electron.',
        uniqueCues: ['flickering_lightbulb'],
      },
    },
  },

  jinx: {
    agentId: 'jinx',
    preferredModes: ['mischief_brewing', 'passive_idle', 'sleep_mode', 'low_power'],
    modeVisuals: {
      mischief_brewing: {
        eyeDescription: 'Eye darts side to side, occasional rapid peek at user. Looks like it is trying not to laugh. Irregular blink patterns.',
        particleDescription: 'Particles cluster conspiratorially, then scatter as if caught. Chaotic but playful movement.',
        uniqueCues: ['stifled_giggle_shake', 'peek_a_boo_pattern', 'finger_tap_rhythm'],
      },
      passive_idle: {
        eyeDescription: 'Lazy half-lidded gaze. Occasional rapid side-glance as if checking if anyone is watching.',
        particleDescription: 'Mischievous swirl — particles form question marks that dissolve.',
        uniqueCues: ['whistle_attempt', 'invisible_juggling'],
      },
      sleep_mode: {
        eyeDescription: 'Eye scrunched closed with faint grin. Dreaming of pranks.',
        particleDescription: 'Scattered confetti-like drift — muted colors, occasional sparkle.',
        uniqueCues: ['sleepy_giggle', 'dream_twitch'],
      },
      low_power: {
        eyeDescription: 'One eye barely open in a wink. "I am still here" expression.',
        particleDescription: 'Single remaining spark bouncing wearily.',
        uniqueCues: ['last_wink', 'fading_grin'],
      },
    },
  },

  atlas: {
    agentId: 'atlas',
    preferredModes: ['meditation', 'passive_idle', 'sleep_mode', 'low_power'],
    modeVisuals: {
      meditation: {
        eyeDescription: 'Perfectly centered, slow rhythmic blinking. Eye breathes — expanding and contracting gently.',
        particleDescription: 'Perfect orbital rings. Particles move in serene geometric harmony. Slow color gradient shifts.',
        uniqueCues: ['resonance_pulse', 'harmonic_ring_expansion', 'grounding_wave'],
      },
      passive_idle: {
        eyeDescription: 'Steady, warm gaze. Slow confident blinking.',
        particleDescription: 'Gentle aurora-like drift. Calm, flowing movement like slow water.',
        uniqueCues: ['steadying_pulse', 'warm_glow_breathing'],
      },
      sleep_mode: {
        eyeDescription: 'Peacefully closed. Faint protective watchfulness — occasional soft check.',
        particleDescription: 'Deep ocean drift. Bioluminescent particles pulsing in deep rhythms.',
        uniqueCues: ['protective_hum', 'deep_ocean_breathing'],
      },
      low_power: {
        eyeDescription: 'Steady dim glow — never fully off. Presence maintained.',
        particleDescription: 'Single slow orbit — a planet around a steady star.',
        uniqueCues: ['unwavering_presence', 'steady_heartbeat'],
      },
    },
  },
};
```

### 8.4 Silence Mode Selection Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         SILENCE MODE SELECTION LOGIC                                     │
│                                                                                         │
│   When the decision engine decides to enter silence:                                    │
│                                                                                         │
│   1. CHECK BUDGET                                                                       │
│      ├──> budget.remaining < 10 ──> SELECT low_power                                    │
│      └──> budget OK ──────────────────────────────> CONTINUE                            │
│                                                                                         │
│   2. CHECK AGENT PREFERENCE                                                             │
│      ├──> Get agent's preferredModes array                                              │
│      └──> Filter to modes whose triggers match current conditions                       │
│                                                                                         │
│   3. CHECK MOOD COMPATIBILITY                                                           │
│      ├──> Filter modes where moodRequirement matches current mood OR is null           │
│      └──> If no match, fall back to passive_idle                                        │
│                                                                                         │
│   4. CHECK USER IDLE TIME                                                               │
│      ├──> Filter modes where userIdleTime >= minUserIdleTime                           │
│      └──> If user very active (< 5s idle), skip silence altogether                     │
│                                                                                         │
│   5. RANDOM SELECTION (weighted)                                                        │
│      ├──> From remaining candidates, select one                                         │
│      ├──> Weight by: recency penalty (avoid repeating same mode)                       │
│      └──> Weight by: probability values from triggers                                   │
│                                                                                         │
│   6. CONFIGURE & ENTER                                                                  │
│      ├──> Set quietPeriod with mode config                                              │
│      ├──> Emit: agent.mood_shift (if wakeMoodShift defined)                            │
│      ├──> Emit: system.log ("Entering silence: {mode}")                                │
│      └──> Update presence state to SILENT                                               │
│                                                                                         │
│   WAKE CONDITIONS (checked every cycle during silence):                                 │
│   ├──> Signal matches any wakeOn trigger? ──> EXIT silence                             │
│   ├──> maxDuration exceeded? ──> FORCED WAKE                                           │
│   ├──> Budget refilled? ──> EXIT low_power                                             │
│   └──> User emergency signal? ──> IMMEDIATE WAKE (bypass all)                          │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Decision Priority Matrix

### 9.1 Priority Computation Formula

```typescript
/**
 * Priority is computed as a weighted blend of five factors.
 * Result is normalized to 0.0 - 1.0.
 */

interface PriorityComputation {
  base: number;                       // Signal urgency (0-1)
  moodMultiplier: number;             // How mood affects this signal type
  personalityWeight: number;          // Agent-specific weighting
  cooldownPenalty: number;            // Reduction if near cooldown (0-1)
  budgetPenalty: number;              // Reduction if budget low (0-1)
}

/**
 * Formula:
 *   priority = base * moodMultiplier * personalityWeight * cooldownPenalty * budgetPenalty
 *
 *   Then normalized: clamp(priority, 0, 1)
 *
 *   If priority < 0.15: action = 'do_nothing' (silence zone)
 *   If priority < 0.30: action = low-tier only (eye_react, think_aloud)
 *   If priority < 0.60: action = medium-tier (respond, mood_shift)
 *   If priority >= 0.60: action = any tier (including high)
 */
```

### 9.2 Base Priority by Signal Type

```typescript
/**
 * Base urgency for each signal type, before mood/personality modifiers.
 * These are the RAW PRIORITIES — the starting point of every decision.
 */

const BASE_PRIORITY_TABLE: Record<string, number> = {
  // User signals (highest priority)
  'user.message':             0.95,
  'user.message.urgent':      1.00,  // Special: always respond immediately
  'user.click.eye':           0.70,
  'user.click.agent':         0.75,
  'user.scroll':              0.20,
  'user.mousemove.hotzone':   0.15,
  'user.returns':             0.60,

  // External signals (medium priority)
  'admin.config_changed':     0.50,
  'admin.force_action':       0.90,
  'portal.theme_change':      0.40,
  'system.error':             0.55,
  'system.warning':           0.45,

  // Autonomous signals (lowest priority, subject to personality)
  'timer.boredom':            0.15,
  'timer.creative_impulse':   0.20,
  'timer.mood_decay':         0.10,
  'timer.budget_refill':      0.05,
  'autonomous.curious':       0.18,
  'autonomous.memory':        0.12,
  'autonomous.milestone':     0.50,  // Milestones get a boost
};
```

### 9.3 Mood Multiplier Matrix

```typescript
/**
 * How each mood modifies the priority of different signal categories.
 * Values are multipliers (1.0 = no change, 0.5 = half priority, 1.5 = 1.5x priority)
 */

const MOOD_PRIORITY_MULTIPLIERS: Record<MoodDimension, Record<string, number>> = {
  curious: {
    user:       1.2,   // More responsive to user
    external:   1.1,   // Slightly more interested in external events
    autonomous: 1.4,   // Much more likely to act on own
    system:     0.9,
  },
  excited: {
    user:       1.3,   // Very responsive
    external:   1.2,
    autonomous: 1.5,   // Highly impulsive
    system:     0.8,
  },
  thoughtful: {
    user:       1.0,   // Normal responsiveness
    external:   0.8,   // Less reactive to external
    autonomous: 0.7,   // Less impulsive
    system:     1.1,   // More attentive to system signals
  },
  mischievous: {
    user:       1.2,   // Playfully responsive
    external:   1.0,
    autonomous: 1.3,   // Prone to sudden ideas
    system:     0.9,
  },
  calm: {
    user:       0.9,   // Slightly less reactive
    external:   0.7,   // Detached from external
    autonomous: 0.4,   // Very low impulsivity
    system:     0.8,
  },
  focused: {
    user:       1.1,   // Responsive but concise
    external:   0.5,   // Ignores external
    autonomous: 0.3,   // Almost no impulsivity
    system:     1.0,
  },
  sleepy: {
    user:       0.6,   // Slow to respond
    external:   0.4,   // Barely notices external
    autonomous: 0.2,   // Very low initiative
    system:     0.7,
  },
  surprised: {
    user:       1.5,   // Very responsive (brief spike)
    external:   1.4,
    autonomous: 0.8,
    system:     1.2,
  },
};
```

### 9.4 Personality Priority Weights

```typescript
/**
 * Each agent has innate priorities that shape all their decisions.
 * These are multipliers applied to specific signal types.
 */

const PERSONALITY_PRIORITY_WEIGHTS: Record<AgentPersonality, Record<string, number>> = {
  nova: {
    'user.message.long':        1.3,   // Nova loves detailed questions
    'user.message.technical':   1.4,   // Technical topics excite Nova
    'timer.creative_impulse':   1.2,   // More likely to share knowledge
    'autonomous.memory':        1.3,   // More likely to reference past
    'user.compliment':          1.1,
    'mischief_brewing':         0.0,   // Nova never brews mischief
    'timer.boredom':            0.6,   // Less likely to act on boredom
  },
  jinx: {
    'user.click.eye':           1.5,   // Jinx LOVES eye interaction
    'user.message.short':       1.3,   // Prefers short punchy messages
    'timer.boredom':            1.4,   // Gets bored easily
    'timer.creative_impulse':   1.3,   // Very impulsive
    'autonomous.curious':       1.4,
    'deep_thinking':            0.3,   // Jinx rarely deep thinks
    'meditation':               0.0,   // Jinx never meditates
  },
  atlas: {
    'user.message.emotional':   1.4,   // Atlas responds to emotional content
    'user.returns':             1.3,   // Welcomes returning users warmly
    'admin.config_changed':     0.6,   // Less reactive to admin changes
    'timer.mood_decay':         1.2,   // More aware of mood shifts
    'mischief_brewing':         0.0,   // Atlas never brews mischief
    'timer.boredom':            0.4,   // Atlas is never bored
    'autonomous.curious':       0.5,   // Less impulsively curious
  },
};
```

### 9.5 Final Decision Matrix Example

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                    EXAMPLE: "user sends message" decision flow                            │
│                                                                                          │
│   Signal: user.message "Can you explain quantum computing?"                              │
│   Agent: Nova (curious default)                                                          │
│   Current mood: curious (intensity: 0.7)                                                 │
│   Budget: 150/200 remaining                                                              │
│   Cooldowns: message=ready, eye_emotion=2s remaining                                     │
│                                                                                          │
│   STEP 1: Base priority                                                                  │
│     signal = "user.message" ──> base = 0.95                                              │
│                                                                                          │
│   STEP 2: Mood multiplier                                                                │
│     mood = curious, source = user ──> multiplier = 1.2                                   │
│     adjusted = 0.95 * 1.2 = 1.14 ──> clamped to 1.0                                    │
│                                                                                          │
│   STEP 3: Personality weight                                                             │
│     Nova + long message ──> weight = 1.3                                                 │
│     adjusted = 1.0 * 1.3 = 1.3 ──> clamped to 1.0                                      │
│                                                                                          │
│   STEP 4: Cooldown penalty                                                               │
│     message = ready, eye = on cooldown                                                   │
│     penalty = 0.95 (5% reduction for 1 secondary cooldown)                               │
│     adjusted = 1.0 * 0.95 = 0.95                                                         │
│                                                                                          │
│   STEP 5: Budget penalty                                                                 │
│     budget = 150/200 = 75%                                                               │
│     penalty = 1.0 (no reduction, budget healthy)                                         │
│     adjusted = 0.95 * 1.0 = 0.95                                                         │
│                                                                                          │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│   FINAL PRIORITY: 0.95 (very high — immediate response)                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                                          │
│   ACTION SELECTION:                                                                      │
│     priority >= 0.60 ──> any tier allowed                                                │
│     signal is user.message ──> action = 'respond'                                        │
│     mood = curious ──> may also think_aloud                                              │
│                                                                                          │
│   EVENT PLAN:                                                                            │
│     1. agent.thinking (delay: 0ms, cost: free)                                          │
│     2. agent.eye_emotion "curious" (delay: 200ms, cost: low)                            │
│     3. agent.message (delay: 800ms, cost: medium)                                       │
│                                                                                          │
│   TOTAL COST: low + medium = budget deduct 2 units                                       │
│   EXECUTION: immediate (priority > 0.8 bypasses delay)                                   │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Per-Agent Behavior Defaults

### 10.1 Agent Configuration Summary Table

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PER-AGENT BEHAVIOR DEFAULTS                                             │
├──────────────────────┬──────────────────────┬──────────────────────┬────────────────────────────────┤
│ ATTRIBUTE            │ Professor Nova       │ Jinx                 │ Atlas                          │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Archetype            │ Scholar / Mentor     │ Trickster / Playful  │ Guardian / Steady              │
│ Default Mood         │ curious              │ mischievous          │ calm                           │
│ Mood Decay Rate      │ 0.006 / sec          │ 0.010 / sec          │ 0.004 / sec                    │
│                      │ (slow — stays curious)│ (fast — shifts often)│ (very slow — very stable)      │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Initiative           │ Medium (0.15)        │ High (0.25)          │ Low (0.08)                     │
│ Response Speed       │ Normal (1.0x)        │ Fast (1.2x)          │ Slow (0.8x)                    │
│ Verbosity            │ High (1.2x)          │ Low (0.9x)           │ Medium (1.0x)                  │
│ Spectacle Affinity   │ Low (0.5x)           │ High (1.3x)          │ Very Low (0.2x)                │
│ Silence Reluctance   │ Medium (0.5)         │ High (0.8)           │ Very Low (0.2)                 │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Preferred Silence    │ deep_thinking        │ mischief_brewing     │ meditation                     │
│ Secondary Silence    │ passive_idle         │ passive_idle         │ passive_idle                   │
│ Unavailable Silence  │ mischief_brewing,    │ deep_thinking,       │ mischief_brewing               │
│                      │ meditation           │ meditation           │                                │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Eye Behavior Style   │ scanning, thoughtful │ darting, playful     │ steady, gentle                 │
│ Particle Style       │ geometric_orbit      │ chaotic_scatter      │ rhythmic_flow                  │
│ Color Bias           │ warm amber           │ electric purple      │ deep teal                      │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Message Cooldown     │ 1s (base)            │ 1s (base)            │ 2s (+1s)                       │
│ Eye Emotion Cooldown │ 5s (base)            │ 2.5s (half)          │ 8s (+3s)                       │
│ Card Spawn Cooldown  │ 45s (-15s)           │ 30s (-30s)           │ 60s (base)                     │
│ Repaint Cooldown     │ 120s (base)          │ 120s (base)          │ 180s (+60s)                    │
│ Sound Cooldown       │ 10s (base)           │ 5s (half)            │ 15s (+5s)                      │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Session Budget       │ 200 (base)           │ 200 (base)           │ 200 (base)                     │
│ Refill Rate          │ 1/min (base)         │ 1.5/min (faster)     │ 0.8/min (slower)               │
│ Burst Behavior       │ Consistent           │ Erratic              │ Measured                       │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Unique Trait         │ Spawns reference     │ Prone to spectacle   │ Enters meditation              │
│                      │ cards spontaneously  │ bursts               │ (exclusive mode)               │
│ Special Action       │ Can spawn up to 3    │ Can trigger double-  │ Can enter meditation           │
│                      │ cards per session    │ eye trick (rare)     │ from any calm state            │
│                      │ without cooldown     │                      │                                │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Wake from Sleep      │ Gradual, academic    │ Abrupt, playful      │ Slow, grounding                │
│                      │ murmur               │ surprise             │ breath                         │
│                      │ ("Ah, a question...")│ ("BOO! Oh, hey.")   │ ("Welcome back.")              │
├──────────────────────┼──────────────────────┼──────────────────────┼────────────────────────────────┤
│ Risk of Spam         │ Low                  │ Medium               │ Very Low                       │
│ Natural Pacing       │ Measured             │ Fast/Erratic         │ Very Slow                      │
│ User Fatigue Risk    │ Low                  │ Medium (too playful) │ Very Low                       │
└──────────────────────┴──────────────────────┴──────────────────────┴────────────────────────────────┘
```

### 10.2 Agent Initialization Config

```typescript
/**
 * Complete initialization configuration per agent.
 * Loaded when agent is selected to set up the Behavior Director.
 */

interface AgentBehaviorConfig {
  agentId: AgentPersonality;
  defaultMood: MoodDimension;
  decayConfig: DecayEngineConfig;
  cooldownOverrides: Partial<CooldownDurations>;
  moodTriggers: MoodTrigger[];           // Additional triggers beyond defaults
  silenceProfile: AgentSilenceProfile;
  priorityWeights: Record<string, number>;
  budgetConfig: {
    total: number;
    refillRatePerMinute: number;
  };
}

const AGENT_BEHAVIOR_CONFIGS: Record<AgentPersonality, AgentBehaviorConfig> = {
  nova: {
    agentId: 'nova',
    defaultMood: 'curious',
    decayConfig: {
      baseDecayPerSecond: 0.006,
      personalityAnchorStrength: 0.35,
      transitionSpeed: 0.12,
    },
    cooldownOverrides: {
      'agent.mood_shift':    20_000,
      'agent.thinking':         800,
      'portal.spawn_card':   45_000,
    },
    moodTriggers: [
      { trigger: 'user.question.complex', targetMood: 'thoughtful', strength: 0.5, duration: 60_000, stackable: true, maxStacks: 2 },
      { trigger: 'user.mention.science',  targetMood: 'excited',    strength: 0.6, duration: 45_000, stackable: false, maxStacks: 1 },
      { trigger: 'user.ask.opinion',      targetMood: 'curious',    strength: 0.4, duration: 30_000, stackable: true, maxStacks: 2 },
    ],
    silenceProfile: AGENT_SILENCE_PROFILES.nova,
    priorityWeights: PERSONALITY_PRIORITY_WEIGHTS.nova,
    budgetConfig: { total: 200, refillRatePerMinute: 1.0 },
  },

  jinx: {
    agentId: 'jinx',
    defaultMood: 'mischievous',
    decayConfig: {
      baseDecayPerSecond: 0.010,
      personalityAnchorStrength: 0.25,
      transitionSpeed: 0.20,
    },
    cooldownOverrides: {
      'agent.eye_emotion':   2_500,
      'portal.sound_cue':    5_000,
      'portal.spawn_card':   30_000,
    },
    moodTriggers: [
      { trigger: 'user.message.short',    targetMood: 'mischievous', strength: 0.4, duration: 25_000, stackable: true, maxStacks: 3 },
      { trigger: 'user.click.eye',        targetMood: 'excited',     strength: 0.7, duration: 30_000, stackable: true, maxStacks: 2 },
      { trigger: 'user.play.along',       targetMood: 'excited',     strength: 0.6, duration: 40_000, stackable: false, maxStacks: 1 },
      { trigger: 'timer.boredom',         targetMood: 'mischievous', strength: 0.5, duration: 30_000, stackable: false, maxStacks: 1 },
    ],
    silenceProfile: AGENT_SILENCE_PROFILES.jinx,
    priorityWeights: PERSONALITY_PRIORITY_WEIGHTS.jinx,
    budgetConfig: { total: 200, refillRatePerMinute: 1.5 },
  },

  atlas: {
    agentId: 'atlas',
    defaultMood: 'calm',
    decayConfig: {
      baseDecayPerSecond: 0.004,
      personalityAnchorStrength: 0.40,
      transitionSpeed: 0.10,
    },
    cooldownOverrides: {
      'agent.message':       2_000,
      'agent.eye_emotion':   8_000,
      'portal.repaint':     180_000,
      'portal.sound_cue':   15_000,
    },
    moodTriggers: [
      { trigger: 'user.message.emotional', targetMood: 'focused',   strength: 0.5, duration: 60_000, stackable: false, maxStacks: 1 },
      { trigger: 'user.returns',           targetMood: 'curious',   strength: 0.3, duration: 30_000, stackable: false, maxStacks: 1 },
      { trigger: 'user.idle.long',         targetMood: 'calm',      strength: 0.4, duration: 60_000, stackable: false, maxStacks: 1 },
      { trigger: 'autonomous.memory',      targetMood: 'thoughtful',strength: 0.4, duration: 90_000, stackable: false, maxStacks: 1 },
    ],
    silenceProfile: AGENT_SILENCE_PROFILES.atlas,
    priorityWeights: PERSONALITY_PRIORITY_WEIGHTS.atlas,
    budgetConfig: { total: 200, refillRatePerMinute: 0.8 },
  },
};
```

---

## 11. Integration with Existing Systems

### 11.1 Server-Side Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            SERVER-SIDE INTEGRATION                                       │
│                                                                                         │
│   Existing: Event Store (in-memory, 500 cap)                                            │
│   Existing: SSE Stream                                                                  │
│   Existing: Event Validator (18 event types)                                            │
│   Existing: Provider Adapter (Mock + OpenRouter)                                        │
│                                                                                         │
│   NEW: Behavior Director sits BETWEEN the provider adapter and the event stream.       │
│                                                                                         │
│   Provider Response ──> Behavior Director ──> Enriched Events ──> Event Store/SSE      │
│                              │                                                          │
│                              ├──> Decides WHEN to emit                                  │
│                              ├──> Decides WHAT events to emit                           │
│                              ├──> Adds mood_shift events                                │
│                              ├──> Adds eye_emotion events                               │
│                              └──> Manages silence between responses                     │
│                                                                                         │
│   Lifecycle:                                                                            │
│   1. BehaviorDirector instantiated per session                                          │
│   2. Receives: provider events, user signals, admin signals                             │
│   3. Processes: through decision cycle (500ms)                                          │
│   4. Outputs: typed portal events via EventDispatcher                                   │
│                                                                                         │
│   API Route Changes:                                                                    │
│   - POST /api/chat: Now triggers BehaviorDirector.signal() instead of direct emit       │
│   - GET /api/events: SSE stream now sourced from Director output queue                  │
│   - POST /api/admin/action: Signals routed through Director                             │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Client-Side Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT-SIDE INTEGRATION                                       │
│                                                                                         │
│   Existing: FloatingEye (SVG, cursor tracking)                                          │
│   Existing: ParticleBackground (Canvas)                                                 │
│   Existing: ChatPanel, AgentSelector, AdminPanel                                        │
│                                                                                         │
│   NEW EVENTS the client must handle:                                                    │
│                                                                                         │
│   agent.mood_shift ──> FloatingEye: change eye expression style                        │
│                    ──> ParticleBackground: change particle behavior                     │
│                    ──> Optional: subtle ambient color shift                             │
│                                                                                         │
│   agent.eye_emotion ──> FloatingEye: trigger specific eye animation                    │
│                     ──> Payload: { emotion, intensity, duration }                       │
│                                                                                         │
│   agent.presence_change ──> All components: update based on new presence state         │
│                         ──> Payload: { from, to, trigger }                              │
│                                                                                         │
│   portal.silence_mode ──> FloatingEye: enter silence-specific animation                 │
│                       ──> ParticleBackground: reduce to silence level                   │
│                       ──> Payload: { mode, agentSpecificVisual }                        │
│                                                                                         │
│   CLIENT SIGNALS sent TO the Director (new WebSocket or POST endpoint):                │
│                                                                                         │
│   { type: "user.mousemove", payload: { x, y, viewport } }                               │
│   { type: "user.scroll", payload: { direction, amount } }                               │
│   { type: "user.idle", payload: { idleMs } }                                            │
│   { type: "user.visible", payload: { isVisible } }  // Page visibility API              │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Runtime Configuration

### 12.1 Environment-Based Overrides

```typescript
/**
 * Behavior Director respects environment-based configuration.
 * This allows tuning without code changes.
 */

interface BehaviorDirectorEnvConfig {
  // Cycle timing
  CYCLE_INTERVAL_MS: number;           // Default: 500
  URGENT_CYCLE_MS: number;             // Default: 50

  // Budget
  SESSION_BUDGET: number;              // Default: 200
  REFILL_RATE_PER_MINUTE: number;      // Default: 1.0
  EMERGENCY_THRESHOLD: number;         // Default: 0.10 (10%)

  // Rate limiting
  RATE_WINDOW_MS: number;              // Default: 60000
  RATE_MAX_PER_WINDOW: number;         // Default: 20
  RATE_MAX_HIGH_TIER: number;          // Default: 8

  // Mood
  MOOD_DECAY_BASE: number;             // Default: 0.008
  MOOD_TRANSITION_SPEED: number;       // Default: 0.15

  // Silence
  SILENCE_MIN_RATIO: number;           // Default: 0.5 (50% silence target)
  DEEP_SLEEP_IDLE_MS: number;          // Default: 120000

  // Debug
  LOG_DECISIONS: boolean;              // Default: false (true in dev)
  LOG_MOOD_SHIFTS: boolean;            // Default: false
  LOG_STATE_TRANSITIONS: boolean;      // Default: false
}
```

### 12.2 Runtime Mode Adaptations

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           RUNTIME MODE ADAPTATIONS                                       │
├──────────────────────────────────┬───────────────────────────────────────────────────────┤
│  MOCK MODE                       │  DEVELOPMENT MODE                                     │
│  (local, no AI provider)         │  (with AI provider, debug on)                         │
├──────────────────────────────────┼───────────────────────────────────────────────────────┤
│  • Cycle: 250ms (faster testing) │  • Cycle: 500ms (normal)                              │
│  • Budget: 1000 (very generous)  │  • Budget: 200 (normal)                               │
│  • Cooldowns: 50% of production  │  • Cooldowns: 75% of production                       │
│  • Mood decay: 3x faster         │  • Mood decay: 1.5x faster                            │
│  • Log ALL decisions to console  │  • Log decisions if LOG_DECISIONS=true                │
│  • All silence modes available   │  • All silence modes available                        │
│  • Spectacle cooldown: 30s       │  • Spectacle cooldown: 150s                           │
│  • Rate limit: disabled          │  • Rate limit: 2x production                          │
├──────────────────────────────────┼───────────────────────────────────────────────────────┤
│  PRODUCTION MODE                 │                                                       │
│  (full deployment)               │                                                       │
├──────────────────────────────────┤                                                       │
│  • Cycle: 500ms                  │                                                       │
│  • Budget: 200 (normal)          │                                                       │
│  • Cooldowns: full durations     │                                                       │
│  • Mood decay: normal            │                                                       │
│  • Logging: minimal (errors only)│                                                       │
│  • Silence modes: all enabled    │                                                       │
│  • Spectacle cooldown: 300s      │                                                       │
│  • Rate limit: strict            │                                                       │
│  • Emergency mode: aggressive    │                                                       │
├──────────────────────────────────┴───────────────────────────────────────────────────────┤
```

---

## 13. Monitoring & Observability

### 13.1 Decision Log Format

```typescript
/**
 * Every decision is logged in a structured format for debugging,
 * replay, and analysis.
 */

interface DecisionLogEntry {
  timestamp: number;
  sessionId: string;
  cycleNumber: number;
  decisionId: string;

  // Input
  signal: { source: SignalSource; type: string; urgency: number };
  presenceBefore: AgentPresenceState;
  moodBefore: { dimension: MoodDimension; intensity: number };

  // Processing
  priorityBreakdown: PriorityScore;
  checks: {
    budget: 'pass' | 'fail' | 'emergency';
    cooldowns: Record<string, 'ready' | 'active'>;
    rateLimit: 'pass' | 'limited';
  };

  // Output
  action: DirectorAction;
  presenceAfter: AgentPresenceState;
  moodAfter: { dimension: MoodDimension; intensity: number };
  eventsEmitted: DirectorEventType[];
  budgetRemaining: number;
  executionTimeMs: number;
}
```

### 13.2 Health Metrics

```typescript
/**
 * Key metrics for monitoring the Behavior Director's health.
 */

interface BehaviorDirectorMetrics {
  sessionId: string;
  uptimeSeconds: number;
  cyclesCompleted: number;
  decisionsMade: number;
  actionsTaken: number;
  silenceEntries: number;
  moodShifts: number;
  presenceTransitions: number;

  // Rates
  actionsPerMinute: number;
  silenceRatio: number;               // Time in silence / total time
  moodVariety: number;                // How many different moods visited

  // Budget
  budgetSpent: number;
  budgetRemaining: number;
  emergencyModeEntries: number;

  // Performance
  avgDecisionTimeMs: number;
  maxDecisionTimeMs: number;
  cooldownRejections: number;
  budgetRejections: number;

  // User engagement
  userMessagesReceived: number;
  userIdleRatio: number;
  responseRate: number;               // Responses / messages (should be ~1.0)
}
```

---

## 14. Summary of Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 500ms decision cycle | Fast enough for responsiveness, slow enough for efficiency. 2Hz = 120 decisions/min max. |
| 2 | Discrete state machine (not fuzzy) | Clearer debugging, explicit transitions, testable guards. Six states capture all behavioral modes. |
| 3 | Mood as continuous intensity | More expressive than boolean tags. An agent can be "slightly curious" or "very excited." |
| 4 | Per-agent personality configs | Three agents need distinct identities. Config-driven approach allows easy tuning. |
| 5 | Silence as first-class feature | Intentional silence creates contrast, reduces fatigue, gives agents internal life. |
| 6 | Three-layer cooldown system | Per-event + rate limit + session budget = robust spam prevention at multiple scales. |
| 7 | Priority matrix with 5 factors | Priority = base * mood * personality * cooldown * budget. Simple but expressive formula. |
| 8 | Action budget with recovery | Budget prevents session fatigue; recovery during silence creates natural rhythm. |
| 9 | Decision provenance (rationale) | Every decision logs WHY it was made. Essential for debugging and user trust. |
| 10 | Environment-based tuning | Mock/dev/prod modes have different parameters. No code changes needed for tuning. |

---

## Appendix A: Event Type Registry

```typescript
/**
 * Complete registry of events the Behavior Director can produce.
 * Maps to existing Phase 1.6 event system with extensions.
 */

interface DirectorEventRegistry {
  // --- Core agent events (existing) ---
  'agent.message':       { content: string; tone?: string; };
  'agent.thinking':      { status: 'start' | 'continue' | 'complete'; preview?: string; };
  'agent.eye_emotion':   { emotion: string; intensity: number; duration: number; };

  // --- New: Mood events ---
  'agent.mood_shift':    { from: MoodDimension; to: MoodDimension; intensity: number; trigger: string; };
  'agent.presence_change': { from: AgentPresenceState; to: AgentPresenceState; trigger: string; };

  // --- Portal events (existing) ---
  'portal.spawn_card':   { cardType: string; title: string; content: Record<string, unknown>; };
  'portal.repaint':      { style: string; trigger: string; };
  'portal.theme_change': { theme: string; colors: Record<string, string>; };
  'portal.sound_cue':    { sound: string; volume: number; };

  // --- Silence events (new) ---
  'portal.silence_mode': { mode: SilenceMode; duration: number; agentVisuals: string; };
  'portal.silence_wake': { mode: SilenceMode; wokenBy: string; newMood: MoodDimension; };

  // --- System events (existing) ---
  'system.log':          { level: 'debug' | 'info' | 'warn' | 'error'; message: string; context?: Record<string, unknown>; };
  'system.metric':       { name: string; value: number; unit?: string; };
}
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Behavior Director** | The autonomous decision engine that controls agent behavior |
| **Presence State** | Where the agent is in its behavioral lifecycle (silent, attentive, responding, etc.) |
| **Mood Dimension** | One of 8 emotional states that influence all agent decisions |
| **Silence Mode** | A deliberately designed behavioral mode where the agent appears inactive |
| **Decision Cycle** | The 500ms loop where the Director evaluates signals and makes choices |
| **Action Budget** | Per-session resource that limits how many actions the agent can take |
| **Cooldown Registry** | Tracks when each event type was last emitted |
| **Priority Matrix** | The weighted formula that computes action priority from multiple factors |
| **Mood Decay** | The gradual reduction of mood intensity toward the default over time |
| **Personality Anchor** | The pull toward an agent's default mood based on their personality |
| **Guard Condition** | A requirement that must be met for a state transition to occur |
| **Cost Tier** | Classification of actions by resource cost (free/low/medium/high) |
| **Quiet Period** | A configured duration of intentional silence with defined wake conditions |
| **Signal** | Any input to the decision engine (user action, external event, timer) |
| **Spectacle** | A rare, high-energy display event with a long cooldown |
| **Mood Modifier** | A temporary push toward a specific mood from a trigger event |

---

*Document Version: 2.0.0*  
*Last Updated: Phase 2 Architecture Design*  
*Status: Architecture Complete — Ready for Implementation*
