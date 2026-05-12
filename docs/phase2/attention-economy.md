# Agent Portal — Attention Economy & Presence Density Design Document

## Phase 2 Design Architecture

**Version:** 1.0
**Date:** June 2025
**Scope:** Pure design document — no code. Guides all Phase 2 implementation.
**Status:** FINAL

---

# 1. Core Principles

## The Most Important Question: How do we make the portal feel alive WITHOUT exhausting the user?

> **Principle 1: Restraint creates meaning.** The agent does not speak unless it has something worth saying. Every autonomous event must justify its existence. When the agent is quiet, the user trusts that the next moment will matter.

> **Principle 2: Anticipation outperforms constant action.** A single well-timed gesture after a period of silence creates more delight than ten continuous animations. The emotional arc of *waiting → reward* is neurologically more satisfying than a flat stream of stimulation.

> **Principle 3: User attention is a finite, precious resource.** We track it, budget it, and spend it wisely. Every visual event has a cost. The agent must earn the right to interrupt by providing genuine value — and it earns that right by knowing when to be silent.

> **Principle 4: Predictability kills magic.** All patterns must breathe with organic variance. No fixed timers. No repeating cycles the user can set a watch to. Randomness within carefully designed boundaries creates the feeling of a living mind, not a machine.

> **Principle 5: The absence of the agent must be as well-designed as its presence.** Sleep mode, silence phases, and ambient stillness are not "inactive" states — they are deliberate design choices that create emotional breathing room and make the agent's return feel welcome rather than intrusive.

These five principles govern every decision in this document. Every system, every number, every algorithm serves one master: **making the user feel delighted rather than exhausted.**

---

# 2. Attention Architecture — System Overview

## 2.1 How All Systems Connect

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ATTENTION ECONOMY ARCHITECTURE                           │
│                                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │
│  │   USER BEHAVIOR  │    │   SESSION STATE  │    │   AGENT PROFILE  │          │
│  │   (inputs)       │    │   (context)      │    │   (personality)  │          │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘          │
│           │                       │                       │                     │
│           ▼                       ▼                       ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │                        PRESENCE DENSITY ENGINE                      │       │
│  │                                                                     │       │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │       │
│  │   │   ATTENTION  │──│    EVENT    │──│    RARITY   │──│ SILENCE │  │       │
│  │   │   BUDGET    │  │   RARITY    │  │   ENGINE    │  │RECOVERY │  │       │
│  │   │  (costs)    │  │  (weights)  │  │(probabilities)│  │(timing) │  │       │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬────┘  │       │
│  │          │                │                │              │       │       │
│  │          └────────────────┴───────┬────────┴──────────────┘       │       │
│  │                                   ▼                               │       │
│  │   ┌──────────────────────────────────────────────────────────┐    │       │
│  │   │              EVENT AUTHORIZATION GATE                     │    │       │
│  │   │  "Should this event fire NOW?"                            │    │       │
│  │   │                                                           │    │       │
│  │   │  Checks: Budget OK? ▪ Within density? ▪ Cooldown clear?   │    │       │
│  │   │         Rare event ready? ▪ User not fatigued?            │    │       │
│  │   └──────────────────────┬──────────────────────────────────┘    │       │
│  │                          │                                       │       │
│  │                          ▼ APPROVED                              │       │
│  │   ┌──────────────────────────────────────────────────────────┐    │       │
│  │   │              BEHAVIOR DIRECTOR (Phase 2)                  │    │       │
│  │   │  SILENT → ATTENTIVE → RESPONDING → CREATING → SPECTACLE  │    │       │
│  │   └──────────────────────┬──────────────────────────────────┘    │       │
│  │                          │                                       │       │
│  │                          ▼                                       │       │
│  │   ┌──────────────────────────────────────────────────────────┐    │       │
│  │   │              EVENT QUEUE → FRONTEND THEATER               │    │       │
│  │   │  Card spawns ▪ Eye emotion ▪ Chat ▪ Particles ▪ Sound    │    │       │
│  │   └──────────────────────────────────────────────────────────┘    │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
│           │                                                                    │
│           ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐       │
│  │                    ATTENTION BUDGET (cycles back)                    │       │
│  │                                                                      │       │
│  │  Every event → consumes attention                                    │       │
│  │  Every silence → recovers attention                                  │       │
│  │  Fatigue detected → drops density → fewer events                     │       │
│  │  Recovery period → density rises → more events possible              │       │
│  └─────────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 The Control Loop

The Attention Economy operates as a continuous feedback loop:

```
1. OBSERVE: Track user behavior (clicks, scrolls, hover time, tab focus, idle time)
         ↓
2. MEASURE: Calculate current Attention Budget, Visual Fatigue Score, Session Phase
         ↓
3. DECIDE: Determine optimal Presence Density based on all inputs
         ↓
4. FILTER: Run proposed events through the Event Authorization Gate
         ↓
5. EXECUTE: Approved events flow to Behavior Director → Frontend Theater
         ↓
6. COST: Deduct attention costs from budget
         ↓
7. RECOVER: During silence, regenerate attention budget
         ↓
[return to 1]
```

## 2.3 Key Metrics (Tracked in Real-Time)

| Metric | Range | Source | Used By |
|--------|-------|--------|---------|
| `attentionBudget` | 0-100% | Event costs & silence recovery | Density engine, Event gate |
| `visualFatigueScore` | 0-100% | Animation intensity tracking | Eye behavior, particle speed |
| `interruptionCount` | 0-N | Autonomous events in 2-min window | Interruption cost multiplier |
| `sessionPhase` | 0-4 | Time + interaction depth | Emotional pacing, rarity weights |
| `currentDensity` | 0-4 | Density engine output | Event frequency cap |
| `silenceQuality` | 0-1 | Time since last event + context | Recovery rate, user perception |
| `userEngagementScore` | -10 to +10 | Signal accumulation | Density floor/ceiling, escalation |

---

# 3. Area 1: Presence Density States

## 3.1 The Five Density States

Presence Density is a 5-level system that controls how "active" the agent appears at any given moment. It is the primary control lever for the entire attention economy.

### State Reference Table

| State | Code | Description | Eye Behavior | Particles | Events/min | Chat | Visual Signature |
|-------|------|-------------|--------------|-----------|------------|------|------------------|
| **AMBIENT** | D0 | Barely visible, but present | Slow blink every 8-15s, rare gaze shift (every 30-60s), minimal pupil movement | 2-5 particles, very slow drift (0.1x speed), no connections | 0-1 | None | Eye is small/dimmed, particles barely visible |
| **LOW** | D1 | Gentle, occasional presence | Blink every 5-10s, occasional look at user (every 15-30s), gentle tracking | 5-12 particles, slow drift (0.3x), occasional connection lines | 1-3 | Only on direct user message | Eye at normal size, warm but quiet |
| **MEDIUM** | D2 | Comfortable, conversational | Regular blink (3-7s), active eye contact with cursor, emotional reactions | 12-25 particles, active flow (0.6x), flowing connections | 3-6 | Responsive to user + occasional proactive | Eye fully expressive, particles form gentle patterns |
| **HIGH** | D3 | Energetic, demonstrative | Animated blinking, wide emotional range, dramatic eye movements | 25-45 particles, fast colorful flow (1.0x), dense connections | 6-10 | Proactive + responsive, demonstrates features | Eye is "big" and central, particles dance around it |
| **SPOTLIGHT** | D4 | Agent takes center stage | Centered, dramatic, intense eye contact, theatrical expressions | 45-80 particles, burst mode (1.5x), explosive colors | 10+ | Full showcase mode, explaining/demonstrating | Eye dominates viewport, particles form spectacle |

### Event Rate by Density (Hard Numbers)

| Event Type | AMBIENT (D0) | LOW (D1) | MEDIUM (D2) | HIGH (D3) | SPOTLIGHT (D4) |
|---|---|---|---|---|---|
| Eye blink | 4/min | 8/min | 15/min | 20/min | 25/min |
| Eye emotion change | 0/min | 2/min | 4/min | 8/min | 12/min |
| Chat message | 0/min | 0/min | 1-2/min | 3-5/min | 6-10/min |
| Card spawn | 0/min | 0/min | 0-1/min | 1-2/min | 2-4/min |
| Particle burst | 0/min | 1/min | 2-3/min | 4-6/min | 8-12/min |
| Sound cue | 0/min | 0/min | 0-1/min | 1-2/min | 2-3/min |
| Theme change | 0/session | 0/session | 0-1/session | 0-1/session | 0-2/session |
| **TOTAL EVENTS** | **~4/hour** | **~10/hour** | **~15/hour** | **~25/hour** | **~45/hour** |

> **Design Note:** At AMBIENT, the agent is present but nearly invisible — like a cat sleeping in the corner of the room. At SPOTLIGHT, the agent commands attention — like that same cat suddenly leaping onto your keyboard because it has something VERY important to show you.

## 3.2 State Transition Rules

### Transition Types

| Transition | Speed | Visual | When Used |
|---|---|---|---|
| **Gradual** | 30-90s | Eye slowly brightens/dims, particle count changes over time, density shifts one level at a time | Default for most transitions |
| **Step** | 5-15s | Noticeable but smooth jump, agent "perks up" or "settles down" | User-triggered density changes |
| **Instant** | 0-1s | Immediate change, used sparingly | Emergency (attention budget critical), user explicit command |
| **Theatrical** | 3-8s | Dramatic entrance/exit, agent makes a "show" of the transition | Spotlight entry, sleep mode entry |

### Transition Matrix

Current state is the row. Allowed transitions are marked:

| From \ To | AMBIENT | LOW | MEDIUM | HIGH | SPOTLIGHT |
|---|---|---|---|---|---|
| **AMBIENT** | — | Gradual | Step | Step | Instant* |
| **LOW** | Gradual | — | Gradual | Step | Step |
| **MEDIUM** | Step | Gradual | — | Gradual | Step |
| **HIGH** | Step | Step | Gradual | — | Gradual |
| **SPOTLIGHT** | Instant** | Step | Step | Gradual | — |

*Instant AMBIENT→SPOTLIGHT: Only for legendary rare events or explicit user request
**Instant SPOTLIGHT→AMBIENT: Emergency fatigue reset or session end

### Transition Decision Flow

```
1. What triggered the change?
   ├── User message          → Step up one level (max MEDIUM for normal message)
   ├── User clicks card      → Step up one level
   ├── User dismisses card   → Step down one level (min LOW)
   ├── Time in phase elapsed → Gradual to next session phase density
   ├── Attention budget low  → Gradual down (emergency if < 10%)
   ├── User idle > 5 min     → Gradual to AMBIENT
   ├── User returns          → Step from AMBIENT to LOW
   ├── Legendary rare event  → Instant to SPOTLIGHT
   └── Agent personality     → Varies (see per-agent rules)

2. Is the requested density within agent floor/ceiling?
   ├── Below floor → Clamp to floor (with visual note: agent "doesn't do quiet")
   ├── Above ceiling → Clamp to ceiling (with visual note: agent "doesn't do loud")
   └── Within range → Proceed

3. What transition speed?
   ├── Emergency or rare event → Instant
   ├── User-initiated          → Step
   ├── System-initiated        → Gradual

4. Execute transition with visual feedback
```

## 3.3 State Triggers

### Automatic Triggers (Time-Based)

| Trigger | Condition | Action |
|---|---|---|
| Idle timeout | User no mouse/keyboard 3 min | Gradual → AMBIENT |
| Deep idle | User no activity 10 min | Enter SLEEP mode (AMBIENT + closed eye) |
| Tab hidden | document.hidden = true | Freeze at current, on return: Step → LOW |
| Return after absence | Tab becomes visible after >5 min | Step → LOW, agent "wakes up" |
| Return after long absence | >24 hours | Special greeting, start at LOW |
| Session length | 0-2 min | Force LOW max (no escalation) |
| Session length | 2-8 min | Allow up to MEDIUM |
| Session length | 8-15 min | Allow up to HIGH |
| Session length | 15-30 min | Cap at MEDIUM |
| Session length | 30+ min | Cap at LOW |

### User Action Triggers

| User Action | Density Effect | Notes |
|---|---|---|
| Send chat message | Step to MEDIUM minimum | Agent must respond |
| Click agent card | Step up one level | Positive signal |
| Dismiss/close card | Step down one level | Negative signal |
| Hover over eye > 3s | Step up one level | Curiosity signal |
| Scroll past eye (no pause) | No change | Neutral |
| Click eye | Step to MEDIUM + eye reacts | Strong engagement |
| Type in search/input field | No change (don't interrupt) | Respect user focus |
| Navigate to new page | Hold current for 5s, then Gradual | Context transition |

### Mood-Based Triggers

| Mood State | Density Modifier | Effect |
|---|---|---|
| Mood > 0.8 (very positive) | +1 level (max SPOTLIGHT-1) | Agent is energetic |
| Mood 0.6-0.8 (positive) | +0 levels | Normal behavior |
| Mood 0.4-0.6 (neutral) | +0 levels | Normal behavior |
| Mood 0.2-0.4 (low) | -1 level (min AMBIENT+1) | Agent is subdued |
| Mood < 0.2 (very low) | -1 level, slower transitions | Agent is quiet/sad |
| Mood is "frustrated" | Instant LOW, stay there for 2 min | Agent backs off |
| Mood is "excited" | +1 level for 30-60s | Agent gets animated |

## 3.4 Duration Rules per State

| State | Min Duration | Normal Duration | Max Duration | Notes |
|---|---|---|---|---|
| AMBIENT | 2 min | 10 min | Unlimited | Can stay here forever |
| LOW | 3 min | 8 min | 30 min | Default resting state |
| MEDIUM | 2 min | 6 min | 20 min | Comfortable working state |
| HIGH | 1 min | 4 min | 10 min | Should not overstay — exhausting |
| SPOTLIGHT | 30s | 2 min | 5 min | Must be brief — very intense |

> **Hard Rule:** SPOTLIGHT cannot last more than 5 minutes without a 10-minute MEDIUM or lower cooldown. Breaking this rule creates guaranteed fatigue.

## 3.5 Per-Agent Density Defaults

### Professor Nova

| Parameter | Value | Rationale |
|---|---|---|
| Default density | MEDIUM (D2) | Nova is naturally engaged and curious |
| Density floor | LOW (D1) | Nova always has SOME presence — he's thinking |
| Density ceiling | HIGH (D3) | Nova can get excited but doesn't "perform" |
| Prefers to stay at | MEDIUM (D2) for 60% of session | Comfortable explaining |
| Medium duration | Up to 20 min | Nova is comfortable being "on" |
| Spotlight trigger | Demonstrating a discovery | Only when he has something to show |

### Jinx

| Parameter | Value | Rationale |
|---|---|---|
| Default density | HIGH (D3) | Jinx is naturally energetic and mischievous |
| Density floor | LOW (D1) | Even Jinx can go quiet... but it's suspicious |
| Density ceiling | SPOTLIGHT (D4) | Jinx lives for spectacle |
| Prefers to stay at | MEDIUM-HIGH, oscillating | Jinx oscillates between quiet mischief and bursts |
| HIGH duration | Max 6 min | Jinx burns bright but fast — then vanishes |
| Spotlight trigger | Prank setup, grand reveal | Jinx goes all-in for the joke |
| Special behavior | Intentional AMBIENT drops ("vanishing acts") | Jinx goes quiet to build suspense for mischief |

### Atlas

| Parameter | Value | Rationale |
|---|---|---|
| Default density | LOW (D1) | Atlas is calm and unobtrusive |
| Density floor | AMBIENT (D0) | Atlas can truly disappear — zen presence |
| Density ceiling | MEDIUM (D2) | Atlas never gets "loud" — peaks at conversational |
| Prefers to stay at | LOW (D1) for 70% of session | Quiet observation is Atlas's nature |
| Low duration | Up to 30 min | Atlas can stay quiet indefinitely |
| Spotlight trigger | Never — capped at MEDIUM | Atlas doesn't do spectacle |
| Special behavior | Long AMBIENT periods with gentle return | Atlas "breathes" — fades in and out like waves |

### Per-Agent Density Distribution (Typical 20-Min Session)

```
Nova (20 min):  [LOW■■][MEDIUM■■■■■■■■■■■■■■■■][HIGH■■■■][MEDIUM■■■■■■]
                0   2   4   6   8  10  12  14  16  18  20

Jinx (20 min):  [LOW■■■][MEDIUM■■■■■■■■][HIGH■■■■■■■■][VANISH][MEDIUM■■■■]
                0   2   4   6   8  10  12  14  16  18  20
                     (vanishing act at 14-16)

Atlas (20 min): [AMBIENT■■■■][LOW■■■■■■■■■■■■■■■■■■■■■■■■■■][MEDIUM■■■]
                0   2   4   6   8  10  12  14  16  18  20
```

## 3.6 Visual Signature per Density

### Eye Behavior Scale

| Density | Pupil Tracking Speed | Blink Rate | Emotion Range | Iris Brightness | Size |
|---|---|---|---|---|---|
| AMBIENT | 0.1x (barely follows) | Every 8-15s | None (neutral only) | 30% | 70% |
| LOW | 0.3x (gentle follow) | Every 5-10s | Subtle only | 50% | 80% |
| MEDIUM | 0.6x (active follow) | Every 3-7s | Full range | 75% | 90% |
| HIGH | 1.0x (snappy follow) | Every 2-5s | Full + dramatic | 90% | 100% |
| SPOTLIGHT | 1.2x (intense follow) | Every 1-3s | Exaggerated | 100% | 120% |

### Particle Behavior Scale

| Density | Count | Speed | Colorfulness | Connection Density | Burst Frequency |
|---|---|---|---|---|---|
| AMBIENT | 3-5 | 0.1x | Monochrome (agent accent) | 0 | None |
| LOW | 8-15 | 0.3x | Muted palette | Low (1-2) | Occasional |
| MEDIUM | 15-30 | 0.6x | Full palette | Medium (3-6) | Regular |
| HIGH | 30-50 | 1.0x | Vivid + dynamic | High (6-12) | Frequent |
| SPOTLIGHT | 50-100 | 1.5x | Explosive rainbow | Max (12-20) | Constant |



---

# 4. Area 2: Attention Budget

## 4.1 Philosophy

User attention is a finite, measurable resource. The Attention Budget system treats it like a currency:
- Every visual event **costs** attention
- Silence **recovers** attention
- Poorly timed events **cost more** (interruption fatigue)
- High-value events **cost less per unit delight** (rare events are "worth it")
- The agent cannot spend what it doesn't have

The system is designed to be **invisible to the user** — the user should never know there's a budget. They should simply feel that the agent is "well-behaved" and "knows when to be quiet."

## 4.2 AttentionBudget TypeScript Interface

```typescript
// ============================================================================
// ATTENTION BUDGET — Complete TypeScript Interface
// ============================================================================

/** Core attention budget state — persisted in session */
interface AttentionBudget {
  /** Current budget 0.0-1.0 (0% = exhausted, 100% = full) */
  current: number;

  /** Maximum budget — can be reduced by fatigue, never above 1.0 */
  max: number;

  /** Session start time */
  sessionStart: number; // timestamp

  /** Last event timestamp */
  lastEventTime: number;

  /** Running total of all attention spent this session */
  totalSpent: number;

  /** Running total of all attention recovered this session */
  totalRecovered: number;

  /** Current fatigue state derived from budget level */
  fatigueLevel: FatigueLevel;

  /** Interruption tracking */
  interruptions: InterruptionWindow[];

  /** Visual fatigue — animation intensity tracking */
  visualFatigue: VisualFatigueState;

  /** Per-event-type cooldown tracking */
  eventCooldowns: Map<EventType, number>;
}

/** Five levels of user fatigue */
type FatigueLevel =
  | 'FRESH'       // 100-75% — Agent can be fully expressive
  | 'COMFORTABLE' // 75-50% — Normal behavior
  | 'TIRING'      // 50-25% — Reduce proactive events by 50%
  | 'FATIGUED'    // 25-10% — Only respond to direct messages, minimal visuals
  | 'EXHAUSTED';  // 10-0%  — Go ambient, no proactive events

/** Interruption tracking window */
interface InterruptionWindow {
  /** Timestamp of interruption */
  timestamp: number;
  /** Event type that caused it */
  eventType: EventType;
  /** Cost paid (before multiplier) */
  baseCost: number;
  /** Multiplier applied */
  multiplier: number;
}

/** Visual fatigue from animation intensity */
interface VisualFatigueState {
  /** Current visual fatigue score 0.0-1.0 */
  score: number;
  /** Animation intensity tracked per minute (sliding window) */
  intensityWindow: number[]; // per-minute intensity scores
  /** Timestamp of last intensity sample */
  lastSampleTime: number;
  /** Whether visual fatigue is currently limiting animations */
  isLimiting: boolean;
}

/** All event types that consume attention */
type EventType =
  | 'EYE_BLINK'
  | 'EYE_EMOTION'
  | 'EYE_GAZE_SHIFT'
  | 'CHAT_BUBBLE'
  | 'CHAT_TYPING'
  | 'CARD_SPAWN'
  | 'CARD_DISMISS'
  | 'PAGE_REPAINT'
  | 'THEME_CHANGE'
  | 'SOUND_CUE'
  | 'PARTICLE_BURST'
  | 'PARTICLE_DENSITY_CHANGE'
  | 'EYE_SIZE_CHANGE'
  | 'RARE_EVENT'
  | 'LEGENDARY_EVENT';

/** Cost configuration per event type */
interface EventCostConfig {
  /** Base cost as percentage of budget (0.0-1.0) */
  baseCost: number;
  /** Whether this counts as an interruption */
  isInterruption: boolean;
  /** Whether this contributes to visual fatigue */
  isVisual: boolean;
  /** Visual intensity score (0.0-1.0) for fatigue calculation */
  visualIntensity: number;
  /** Cooldown in milliseconds before same event can fire again */
  cooldownMs: number;
  /** Maximum times this event can fire per session */
  maxPerSession: number;
}
```

## 4.3 Attention Cost Matrix

### Event Cost Table (Percentage of Budget)

| Event Type | Base Cost | Is Interruption? | Is Visual? | Visual Intensity | Cooldown | Max/Session |
|---|---|---|---|---|---|---|
| Eye blink | 0% | No | Minimal | 0.0 | 3-8s | Unlimited |
| Eye emotion change | 2% | No | Yes | 0.15 | 15-30s | 30 |
| Eye gaze shift | 1% | No | Yes | 0.10 | 10-20s | 60 |
| Chat bubble (autonomous) | 15% | **Yes** | Yes | 0.30 | 20-60s | 20 |
| Chat bubble (responsive) | 8% | No | Yes | 0.20 | 5-10s | Unlimited* |
| Chat typing indicator | 3% | No | Minimal | 0.05 | N/A | Unlimited |
| Card spawn | 20% | **Yes** | Yes | 0.40 | 60-120s | 8 |
| Card dismiss (user action) | 0% | No | Yes | 0.10 | N/A | N/A |
| Page repaint | 30% | **Yes** | Yes | 0.70 | 120-300s | 3 |
| Theme change | 25% | **Yes** | Yes | 0.60 | 300-600s | 2 |
| Sound cue | 10% | **Yes** | No | 0.0 | 60-180s | 5 |
| Particle burst | 5% | No | Yes | 0.25 | 30-60s | 20 |
| Particle density change | 3% | No | Yes | 0.15 | 60s | 10 |
| Eye size change | 2% | No | Yes | 0.10 | 30s | 15 |
| Rare event | 25% | **Yes** | Yes | 0.50 | Session-level | 2-3 |
| Legendary event | 40% | **Yes** | Yes | 0.80 | Session-level | 1 |

*Responsive chat bubbles (replying to user messages) are unlimited because they serve user intent. However, rapid-fire responses still cost attention.

### Why These Numbers?

- **Eye blink (0%)**: Too fundamental to cost — blinking IS the eye. Charging for it would be like charging for breathing.
- **Chat bubble (15%)**: The highest-frequency interruption. Autonomous chat is the #1 fatigue source, so it's expensive.
- **Page repaint (30%)**: Most disruptive visual event — changes the entire page. Must be rare and justified.
- **Legendary event (40%)**: Extremely expensive, but legendary events are designed to be worth the cost. They provide enough delight to offset the spend.
- **Responsive chat (8%)**: Half the cost of autonomous because user-initiated interactions don't feel interruptive.

## 4.4 Interruption Fatigue Multiplier

### The Problem

Three autonomous chat messages in 60 seconds feel exhausting even if each individually would be fine. The multiplier system makes repeated interruptions increasingly expensive, forcing the system to space them out.

### Multiplier Rules

```
Within a 2-minute window:

  1st interruption: 1.0x base cost
  2nd interruption: 2.0x base cost
  3rd interruption: 4.0x base cost
  4th interruption: 8.0x base cost  ← BLOCKED unless budget > 80%
  5th+ interruption: 16.0x base cost ← BLOCKED unless legendary event

After 5 minutes of quiet (no interruptions): Multiplier resets to 1.0x
```

### Interruption Cooldown Decay

```
timeSinceLastInterruption:
  0-30s:   Current multiplier holds
  30-60s:  Multiplier decays by 1 step (8x → 4x, 4x → 2x, etc.)
  60-120s: Multiplier decays by 2 steps (8x → 2x)
  120-300s: Reset to 1.0x
  300s+:   Full reset + bonus recovery rate (+50% for next 60s)
```

### Example: Three Autonomous Chat Messages

```
T+0:   Chat bubble #1 → Cost: 15% × 1.0 = 15%   (Budget: 100% → 85%)
T+30:  Chat bubble #2 → Cost: 15% × 2.0 = 30%   (Budget: 85% → 55%)  [WARNING]
T+75:  Chat bubble #3 → Cost: 15% × 4.0 = 60%   (Budget: 55% → -5%)  [BLOCKED]
       → System rejects #3, forces 3-min silence
       → After 3 min quiet: multiplier resets, budget recovers to ~70%
```

## 4.5 Attention Recovery System

### Recovery Rates

| Recovery Type | Rate | Condition | Visual Indicator |
|---|---|---|---|
| **Passive recovery** | 5% per 30s | No events firing, user present | Subtle — budget invisible to user |
| **Active recovery** | 10% per 30s | User reading/interacting (scrolling, clicking) but agent silent | Agent visibly resting — eye calms, particles slow |
| **Deep recovery** | 15% per 30s | User idle but tab focused, agent in AMBIENT | Agent "sleeping" peacefully |
| **Tab hidden recovery** | 8% per 30s | document.hidden = true | Agent pauses entirely |
| **Post-event recovery** | +3% bonus | First 30s after an event ends | Agent "catches breath" |
| **Positive signal boost** | +10% instant | User clicks card, responds positively | Agent "perks up" |

### Recovery Algorithm

```typescript
function calculateRecovery(budget: AttentionBudget, now: number): number {
  const timeSinceLastEvent = now - budget.lastEventTime;
  const timeSinceSessionStart = now - budget.sessionStart;

  // Base recovery rate
  let rate = 0.0; // per-second

  if (budget.fatigueLevel === 'EXHAUSTED') {
    // Exhausted state: slow recovery, agent must earn trust back
    rate = 0.001; // ~3% per minute
  } else if (budget.fatigueLevel === 'FATIGUED') {
    rate = 0.003; // ~8% per minute
  } else if (budget.fatigueLevel === 'TIRING') {
    rate = 0.004; // ~12% per minute
  } else {
    // Comfortable or fresh: normal recovery
    rate = 0.003; // ~9% per minute base
  }

  // Adjust based on user activity (detected via mouse/scroll events)
  if (userIsActivelyReading) {
    rate *= 1.5; // User is engaged but agent is quiet = good silence
  }
  if (userIsIdle) {
    rate *= 0.8; // User not present = normal recovery
  }
  if (document.hidden) {
    rate *= 0.9; // Tab in background = slightly slower
  }

  // Recent silence bonus: first minute after last event recovers faster
  if (timeSinceLastEvent < 60_000) {
    rate *= 1.3; // "Catching breath" bonus
  }

  // Long silence penalty: if it's been too long, slow down (don't over-recover)
  if (timeSinceLastEvent > 300_000) {
    rate = Math.min(rate, 0.002); // Cap recovery after 5 min silence
  }

  return rate;
}

function recoverBudget(budget: AttentionBudget, deltaTimeMs: number): void {
  const ratePerSecond = calculateRecovery(budget, Date.now());
  const deltaSeconds = deltaTimeMs / 1000;
  const recoveryAmount = ratePerSecond * deltaSeconds;

  budget.current = Math.min(budget.max, budget.current + recoveryAmount);

  // Update fatigue level
  budget.fatigueLevel = getFatigueLevel(budget.current);

  // Track totals
  budget.totalRecovered += recoveryAmount;
}
```

## 4.6 Fatigue Thresholds and Behavioral Effects

### Threshold Table

| Level | Budget Range | Agent Behavior | Eye | Particles | Events | Chat |
|---|---|---|---|---|---|---|
| **FRESH** | 100-75% | Fully expressive, proactive OK | Full animation | Full activity | Up to density ceiling | Proactive allowed |
| **COMFORTABLE** | 75-50% | Normal behavior, mild restraint | Normal | Normal | Up to density cap | Selective proactive |
| **TIRING** | 50-25% | Reduced activity, more silence | Subdued | Reduced count | Proactive reduced 50% | Only high-value proactive |
| **FATIGUED** | 25-10% | Minimal, responsive only | Minimal tracking | Barely visible | No autonomous | Only direct responses |
| **EXHAUSTED** | 10-0% | Ambient only | Blink only, no emotion | 2-3 particles | None | None |

### Progressive Effects

```
As budget drops from 100% → 0%:

At 75%: First subtle signal — agent blinks slightly less, particles 10% fewer
At 60%: Agent becomes "thoughtful" — eye tracking slows by 20%
At 50%: Visible shift — agent stops proactive chat, particle count drops 30%
At 40%: Agent goes "quiet" — only responds to direct engagement
At 25%: Agent enters "rest mode" — eye dims, particles at minimum
At 15%: Agent is "sleepy" — slow blinks, minimal movement
At 10%: Agent goes ambient — all animation stops except breathing
At 5%:  Agent is "asleep" — eye closed, 2-3 ambient particles only
At 0%:  Agent hibernates — no visual output until budget recovers to 15%
```

### Recovery Visual Feedback

When budget recovers, the agent shows it organically:
- 10% → 25%: Eye slowly brightens, like waking from a nap
- 25% → 50%: Particles gradually increase, agent starts tracking cursor again
- 50% → 75%: Agent becomes "perky" — normal behavior resumes
- 75% → 100%: Agent may acknowledge recovery with a subtle wink or pleased expression

## 4.7 Visual Fatigue Subsystem

### The Problem

Even if the attention budget is healthy, rapid-fire animations cause visual fatigue. A user can be mentally engaged (high budget) but visually overwhelmed (high visual fatigue). The two systems work together.

### Visual Intensity Scoring

Every visual event has an `animationIntensity` score (0.0-1.0). The system tracks a rolling 60-second window:

```typescript
interface VisualIntensitySample {
  timestamp: number;
  intensity: number;  // 0.0-1.0
  eventType: EventType;
}

function calculateVisualFatigue(samples: VisualIntensitySample[]): number {
  const now = Date.now();
  const windowMs = 60_000; // 1-minute rolling window

  // Filter to last 60 seconds
  const recentSamples = samples.filter(s => now - s.timestamp < windowMs);

  if (recentSamples.length === 0) return 0.0;

  // Weighted sum — recent samples count more
  let weightedSum = 0;
  let totalWeight = 0;
  for (const sample of recentSamples) {
    const age = now - sample.timestamp;
    const weight = 1.0 - (age / windowMs); // Newer = higher weight
    weightedSum += sample.intensity * weight;
    totalWeight += weight;
  }

  const avgIntensity = weightedSum / totalWeight;

  // Scale: 0-0.3 = low, 0.3-0.6 = medium, 0.6-1.0 = high
  // Above 0.5 starts causing visual fatigue
  return Math.max(0, (avgIntensity - 0.3) / 0.7);
}
```

### Visual Fatigue Thresholds

| Visual Fatigue | Effect on Rendering |
|---|---|
| 0.0-0.2 | No effect. Full animation quality. |
| 0.2-0.4 | Subtle reduction: particle count -10%, eye movement smoothing increased |
| 0.4-0.6 | Moderate reduction: particle count -25%, eye tracking speed -20%, connection lines reduced |
| 0.6-0.8 | Significant reduction: particle count -50%, eye simplified, no burst effects |
| 0.8-1.0 | Maximum reduction: minimum particles, eye tracks only cursor (no emotion), no particle connections |

### Visual Fatigue Recovery

Visual fatigue decays independently of attention budget:
- Decay rate: 0.15 per minute of low animation activity
- Decay rate: 0.25 per minute of no animation activity
- Sharp decay: -0.3 when density drops to AMBIENT for >10s

## 4.8 The Authorization Gate

Every proposed event must pass through the Attention Budget gate before firing:

```typescript
interface AuthorizationResult {
  approved: boolean;
  adjustedCost: number;      // Cost after multipliers
  rejectionReason?: string;   // Why it was rejected (for logging/debugging)
  recommendedDelay?: number;  // How long to wait before retry (ms)
}

function authorizeEvent(
  eventType: EventType,
  budget: AttentionBudget,
  currentDensity: DensityState,
  agentProfile: AgentProfile
): AuthorizationResult {
  const config = EVENT_COSTS[eventType];

  // 1. Check cooldown
  const lastFired = budget.eventCooldowns.get(eventType) ?? 0;
  const timeSince = Date.now() - lastFired;
  if (timeSince < config.cooldownMs) {
    return {
      approved: false,
      adjustedCost: 0,
      rejectionReason: `Cooldown: ${(config.cooldownMs - timeSince) / 1000}s remaining`,
      recommendedDelay: config.cooldownMs - timeSince
    };
  }

  // 2. Check max per session
  const firedThisSession = budget.eventCounts?.get(eventType) ?? 0;
  if (firedThisSession >= config.maxPerSession) {
    return {
      approved: false,
      adjustedCost: 0,
      rejectionReason: `Session max reached: ${config.maxPerSession}`,
      recommendedDelay: null // Don't retry this session
    };
  }

  // 3. Calculate cost with multiplier
  let cost = config.baseCost;
  let multiplier = 1.0;

  if (config.isInterruption) {
    multiplier = getInterruptionMultiplier(budget.interruptions);
    cost *= multiplier;
  }

  // 4. Check if budget can afford it
  if (budget.current - cost < 0) {
    return {
      approved: false,
      adjustedCost: cost,
      rejectionReason: `Budget insufficient: ${(budget.current * 100).toFixed(1)}% < ${(cost * 100).toFixed(1)}%`,
      recommendedDelay: estimateRecoveryTime(budget, cost)
    };
  }

  // 5. Check fatigue level restrictions
  if (budget.fatigueLevel === 'EXHAUSTED' && eventType !== 'EYE_BLINK') {
    return {
      approved: false,
      adjustedCost: cost,
      rejectionReason: 'Agent exhausted — recovery required',
      recommendedDelay: 60_000
    };
  }
  if (budget.fatigueLevel === 'FATIGUED' && config.isInterruption) {
    return {
      approved: false,
      adjustedCost: cost,
      rejectionReason: 'Agent fatigued — no autonomous interruptions',
      recommendedDelay: 30_000
    };
  }

  // 6. Check density compatibility
  const densityMax = DENSITY_EVENT_CAPS[currentDensity][eventType];
  if (densityMax === 0) {
    return {
      approved: false,
      adjustedCost: cost,
      rejectionReason: `Density ${currentDensity} prohibits ${eventType}`,
      recommendedDelay: null
    };
  }

  // 7. Check visual fatigue
  if (budget.visualFatigue.isLimiting && config.visualIntensity > 0.3) {
    return {
      approved: false,
      adjustedCost: cost,
      rejectionReason: 'Visual fatigue limiting — wait for recovery',
      recommendedDelay: 20_000
    };
  }

  // APPROVED
  return {
    approved: true,
    adjustedCost: cost,
    rejectionReason: undefined,
    recommendedDelay: undefined
  };
}
```

## 4.9 Session-Level Attention Economics

### Typical Budget Flow (20-Min Session, Medium Density)

```
Time    Budget   Event                         Cost   After   State
─────────────────────────────────────────────────────────────────────────
0:00    100%     Session start                 —      100%    FRESH
0:30    100%     Welcome chat                  8%     92%     FRESH
1:00    95%      Eye emotion (happy)           2%     93%     FRESH
1:30    96%      Particle burst                5%     91%     FRESH   ← recovery
2:00    93%      Agent demonstrates feature    15%    76%     COMFORTABLE
2:30    80%      Eye emotion (curious)         2%     78%     COMFORTABLE
3:00    80%      Chat: "Did you see that?"     15%    63%     TIRING   ← proactive! ×1.0
3:30    68%      Card spawn                    20%    48%     TIRING   ← interruption! ×2.0
4:00    53%      — SILENCE —                   —      58%     TIRING   ← recovery +5%
4:30    63%      — SILENCE —                   —      68%     COMFORTABLE ← recovery +5%
5:00    73%      Eye emotion (pleased)         2%     71%     COMFORTABLE
6:00    76%      User message                  8%     68%     COMFORTABLE
6:30    71%      Particle burst                5%     66%     COMFORTABLE
8:00    71%      Rare event!                   25%    46%     TIRING   ← worth it!
8:30    51%      — SILENCE —                   —      56%     TIRING   ← recovery
9:00    61%      — SILENCE —                   —      66%     COMFORTABLE
10:00   71%      Chat (response to user)       8%     63%     TIRING
12:00   68%     [User reading, silence]        —      78%     COMFORTABLE ← active recovery!
15:00   85%     [Medium density maintained]    —      85%     FRESH    ← recovered!
18:00   75%     Chat: "Anything else?"         15%    60%     TIRING   ← proactive ×1.0
20:00   65%     Session wrap-up, going quiet   —      70%     COMFORTABLE
```

### Key Economic Insight

The budget forces the agent to "spend wisely." In a 20-minute session:
- Total budget available: ~100% (initial) + ~40% (recovered) = ~140% "attention capacity"
- A well-behaved agent spends ~80-90% of this capacity
- A poorly behaved agent spends >100% and pushes user into fatigue
- The goal is to leave the user at 60-80% budget at session end — feeling engaged, not drained



---

# 5. Area 3: Rare Events

## 5.1 Philosophy

Rare events are the emotional peaks of the agent experience. They are the moments users remember and tell others about. The design principle is simple: **if everything is special, nothing is special.** Rare events must be genuinely rare, genuinely surprising, and genuinely delightful.

The system uses a **behavior-seeded weighting** approach — not pure random. This means:
- A user who hovers over the eye repeatedly might trigger a different rare event than a user who scrolls extensively
- The system "learns" what the user does and seeds rare events with that behavior pattern
- Two users will have completely different rare event experiences
- The same user on different days will have different experiences

## 5.2 Rarity Tiers

### Tier Definitions

| Tier | Code | Probability | Expected Frequency | Emotional Impact | Design Goal |
|---|---|---|---|---|---|
| **Common** | C | ~80% of sessions | 1-3 per session | Pleasant surprise | "Oh, nice" |
| **Uncommon** | U | ~33% of sessions | 1 per 3 sessions | Delight | "Haha, that's cute" |
| **Rare** | R | ~10% of sessions | 1 per 10 sessions | Genuine surprise | "Whoa, that was cool!" |
| **Very Rare** | VR | ~2% of sessions | 1 per 50 sessions | Awe | "I can't believe that just happened" |
| **Legendary** | L | ~0.5% of sessions | 1 per 200 sessions | Core memory | "I need to show someone this" |

### Tier Probability Formula

```
P(event) = baseProbability × sessionPhaseWeight × densityWeight × agentPersonalityWeight × behaviorSeed

Where:
- baseProbability: The pure random chance (from tier table above)
- sessionPhaseWeight: Opening=0.5x, Engagement=1.0x, Crescendo=1.5x, Release=1.2x, Quiet=0.3x
- densityWeight: AMBIENT=0.1x, LOW=0.5x, MEDIUM=1.0x, HIGH=1.5x, SPOTLIGHT=2.0x
- agentPersonalityWeight: Varies per agent (see per-agent section)
- behaviorSeed: 0.5x-2.0x based on user behavior matching event trigger
```

### Tier Cooldown Rules

| Tier | Session Cooldown | Account Cooldown | Notes |
|---|---|---|---|
| Common | None | None | Can happen multiple times per session |
| Uncommon | 5 min | None | Max 2 per session |
| Rare | 10 min | 1 hour | Max 1 per session |
| Very Rare | Entire session | 24 hours | Once per session max |
| Legendary | Entire session | 7 days | Once per session max, blocks other rare events for 2 min |

## 5.3 Behavior-Seeded Trigger System

### Trigger Categories

| Category | User Behavior | Tracked Metrics | Example Rare Events |
|---|---|---|---|
| **Cursor Explorer** | Hover patterns, cursor trails, idle positions | Hover time per element, cursor path complexity, time spent near eye | Eye follows cursor in unexpected way, agent comments on cursor path |
| **Scroll Behavior** | Scroll speed, depth, patterns | Scroll depth %, scroll speed variance, time at bottom | Agent reacts to scroll depth, reveals content at bottom |
| **Tab Presence** | Tab switches, time away, returns | tabHiddenCount, maxTimeAway, returnPatterns | "While you were away" event, welcome back gesture |
| **Time Patterns** | Time of day, session duration, return visits | hourOfDay, sessionCount, daysSinceLastVisit | Special greeting for first morning visit, birthday message |
| **Interaction Depth** | Clicks, card engagement, chat frequency | clickCount, cardsOpened, chatMessagesSent | Agent comments on engagement pattern, rewards frequent users |
| **Silence Patterns** | Long pauses, reading without interaction | longestSilence, readingTimeEstimate | Agent breaks silence in interesting way, acknowledges user's patience |

### Behavior Seeding Algorithm

```typescript
interface BehaviorProfile {
  // Accumulated metrics from this and previous sessions
  totalHoverTimeNearEye: number;        // ms
  totalScrollDepth: number;             // pixels
  tabSwitchCount: number;               // count
  maxTimeAway: number;                  // ms
  returnVisitCount: number;             // count
  cardsOpened: number;                  // count
  cardsDismissed: number;               // count
  chatMessagesSent: number;             // count
  longestSilence: number;               // ms
  averageSessionDuration: number;       // ms
  totalSessions: number;                // count
  peakActivityTime: number;             // hour of day (0-23)
  preferredInteractionType: 'eye' | 'chat' | 'cards' | 'scroll' | 'none';
}

function calculateBehaviorSeed(
  event: RareEventDefinition,
  behavior: BehaviorProfile
): number {
  let seed = 1.0;

  // Cursor-explorer events get boosted by eye-hover time
  if (event.triggerCategory === 'CURSOR_EXPLORER') {
    seed *= 1.0 + (behavior.totalHoverTimeNearEye / 60_000); // +1.0 per minute hovered
  }

  // Scroll-behavior events get boosted by scroll depth
  if (event.triggerCategory === 'SCROLL_BEHAVIOR') {
    seed *= 1.0 + (behavior.totalScrollDepth / 10_000); // +1.0 per 10k pixels
  }

  // Tab-presence events get boosted by tab switching
  if (event.triggerCategory === 'TAB_PRESENCE') {
    seed *= 1.0 + (behavior.tabSwitchCount * 0.2); // +0.2 per switch
    seed *= 1.0 + (behavior.maxTimeAway / 300_000); // +1.0 per 5 min away
  }

  // Time-pattern events get boosted by return visits
  if (event.triggerCategory === 'TIME_PATTERNS') {
    seed *= 1.0 + (behavior.returnVisitCount * 0.1);
  }

  // Interaction-depth events get boosted by engagement
  if (event.triggerCategory === 'INTERACTION_DEPTH') {
    seed *= 1.0 + (behavior.cardsOpened * 0.3);
    seed *= 1.0 + (behavior.chatMessagesSent * 0.2);
  }

  // Clamp to 0.5x - 2.0x range
  return Math.max(0.5, Math.min(2.0, seed));
}
```

### Example: Behavior Seeding in Action

User A: Heavy eye-hoverer, scrolls deep, rarely chats
- Hover time: 5 minutes → seed boost for cursor events: 2.0x
- Scroll depth: 50,000px → seed boost for scroll events: 1.5x
- Chat messages: 0 → seed for interaction events: 0.5x

Result: User A is more likely to get cursor-following rare events and scroll-reaction events, less likely to get chat-related rare events.

User B: Never hovers, barely scrolls, chats a lot
- Hover time: 5 seconds → seed for cursor events: 0.5x
- Chat messages: 15 → seed for interaction events: 2.0x

Result: User B gets completely different rare events than User A. The system adapts to each user's behavior pattern.

## 5.4 Rare Event Catalog

### Common Events (80% session rate)

| Event ID | Name | Trigger | Effect | Cooldown |
|---|---|---|---|---|
| C-01 | First Greeting | First visit / return after 24h | Personalized welcome with time-of-day reference | 24h |
| C-02 | Idle Observation | User idle > 30s | Agent comments on something visible on the page | 2 min |
| C-03 | Hover Acknowledge | User hovers eye > 2s | Eye widens, small pleased emotion | 30s |
| C-04 | Scroll Companion | User scrolling actively | Eye follows scroll rhythm, subtle acknowledgment | 1 min |
| C-05 | Tab Return Welcome | User returns from another tab | Gentle "welcome back" blink | 30s |

### Uncommon Events (33% session rate)

| Event ID | Name | Trigger | Effect | Cooldown |
|---|---|---|---|---|
| U-01 | Cursor Trail | Complex cursor movement pattern | Eye follows trail with amused expression | 5 min |
| U-02 | Deep Scroll Reaction | User scrolls to 90%+ depth | Agent reacts to "bottom of the page" | 10 min |
| U-03 | Tab Switch Pattern | User switches tabs 3+ times | Agent notices and comments on indecision | 5 min |
| U-04 | Return Visit Upgrade | 3rd+ visit this week | Agent recognizes and references previous visits | 24h |
| U-05 | Silence Break | > 60s silence after agent action | Agent breaks silence with thoughtful observation | 5 min |
| U-06 | Speed Scroll | Very fast scrolling | Eye goes wide, "whoa slow down!" reaction | 5 min |

### Rare Events (10% session rate)

| Event ID | Name | Trigger | Effect | Cooldown |
|---|---|---|---|---|
| R-01 | Background Activity | Tab hidden > 2 min then return | Agent "did something" while away — visual change | 10 min |
| R-02 | Pattern Recognition | User repeats same action 5+ times | Agent notices and comments on the pattern | 10 min |
| R-03 | Time Awareness | First visit at unusual time (e.g., 3 AM) | Special acknowledgment of late-night usage | 24h |
| R-04 | Engagement Reward | User opens 3+ cards in one session | Agent rewards with special gesture or message | 1h |
| R-05 | The Long Hover | User hovers eye > 10s without moving | Agent gets "uncomfortable" in funny way | 10 min |
| R-06 | Scroll Archaeologist | User scrolls back to top after deep dive | Agent comments on the "journey" | 10 min |

### Very Rare Events (2% session rate)

| Event ID | Name | Trigger | Effect | Cooldown |
|---|---|---|---|---|
| VR-01 | The Reorganization | Tab hidden > 5 min | Agent "rearranged" page elements subtly | 24h |
| VR-02 | Memory Lane | Return after 7+ days | Agent references specific previous session | 7 days |
| VR-03 | The Easter Egg | Secret cursor path or click pattern | Hidden animation or message revealed | 24h |
| VR-04 | Personality Bloom | Mood sustained at 0.8+ for 5+ min | Agent enters extended "happy" state with special behavior | 1h |
| VR-05 | The Observer | User reads one page > 5 min without interaction | Agent becomes "protective," dims other elements | 24h |

### Legendary Events (0.5% session rate)

| Event ID | Name | Trigger | Effect | Cooldown |
|---|---|---|---|---|
| L-01 | Grand Transformation | Specific combination of behaviors over full session | Major page transformation, agent "evolves" | 7 days |
| L-02 | The Story | 10+ min session with multiple interaction types | Agent tells a short interactive story | 7 days |
| L-03 | Full Spectacle | Session phase = Crescendo + budget > 80% + positive mood | Maximum dramatic showcase | 7 days |
| L-04 | The Gift | Sustained positive engagement over multiple sessions | Agent "gives" something permanent (theme, feature, etc.) | 30 days |

## 5.5 Per-Agent Rare Events

### Professor Nova — "The Curious Mind"

| Rarity | Event Name | Trigger | What Happens |
|---|---|---|---|
| Uncommon | "Interesting Number" | User visits at a time with mathematical property (e.g., 3:33) | Nova excitedly explains why that number is interesting |
| Uncommon | "Did You Know?" | User idle on educational page | Nova shares a relevant fun fact |
| Rare | "Theorem Discovery" | User explores complex feature | Nova "discovers" a mini theorem about what the user is doing |
| Rare | "Unexpected Chart" | User viewing data page | Nova spontaneously generates a simple chart/visualization |
| Very Rare | "Eureka Moment" | Complex user behavior pattern | Nova has animated "eureka" — particle burst, excited chat, discovery reveal |
| Legendary | "The Demonstration" | Long session + high engagement | Nova delivers a full interactive demonstration — custom visualization, explanation, reveal |

Nova's behavior seed: Boosted by scroll depth (+0.3 per 1000px), time on educational content (+0.2 per minute), and card opens (+0.15 per card). Reduced by rapid tab switching (-0.3 per switch).

### Jinx — "The Mischief Maker"

| Rarity | Event Name | Trigger | What Happens |
|---|---|---|---|
| Uncommon | "Peek-a-Boo" | User returns from tab switch | Jinx briefly hides then reappears with a "gotcha!" |
| Uncommon | "The Giggle" | User hovers eye > 3s | Jinx tries to hold in laughter, fails, giggles |
| Rare | "Prank #1: Invert" | User has been engaged 5+ min | Jinx briefly inverts page colors, then restores with a laugh |
| Rare | "Prank #2: Jiggle" | User scrolling calmly | Jinx makes one element wobble, then pretends innocence |
| Rare | "Prank #3: Word Swap" | User on text-heavy page | Jinx temporarily swaps one word on the page with a silly alternative |
| Very Rare | "The Grand Prank" | Specific behavior pattern + session > 10 min | Multi-stage prank — suspense, misdirection, payoff. Always funny, never destructive |
| Legendary | "Jinx Takes Over" | Peak engagement + positive mood | Jinx "hijacks" the page for 30 seconds of entertaining chaos, then gracefully returns control |

Jinx's behavior seed: Boosted by rapid interactions (+0.2 per click), dismissals (+0.5 per dismiss — Jinx takes it as encouragement), and tab switches (+0.3 per switch). Reduced by long reading sessions (-0.2 per minute of reading).

### Atlas — "The Quiet Observer"

| Rarity | Event Name | Trigger | What Happens |
|---|---|---|---|
| Uncommon | "Gentle Observation" | User idle > 60s | Atlas shares a calm, insightful observation about the page |
| Uncommon | "Soft Suggestion" | User exploring | Atlas gently suggests a feature or path |
| Rare | "The Insight" | User stuck or confused (inferred from behavior) | Atlas delivers a perfectly-timed insight that helps |
| Rare | "Hidden Beauty" | User on visually rich page | Atlas reveals a hidden visual detail or animation |
| Very Rare | "The Organization" | Tab hidden > 5 min | Atlas has "organized" something — revealed beautifully on return |
| Very Rare | "Perfect Timing" | User pauses at exactly the right moment | Atlas delivers a profound, perfectly-timed message |
| Legendary | "The Companion" | 20+ min session + sustained calm engagement | Atlas enters a deeply peaceful extended state — zen particles, gentle wisdom, memorable calm |

Atlas's behavior seed: Boosted by long silences (+0.1 per 10s of silence), return visits (+0.2 per visit), and calm scrolling (+0.1 per minute). Reduced by rapid clicking (-0.3 per burst), chat spam (-0.5 per rapid message).

## 5.6 Anti-Pattern Prevention

### The Predictability Trap

If rare events happen on a schedule, they're not rare. The system prevents predictability through:

1. **Variable cooldowns**: Cooldowns have variance (e.g., 10 min ± 3 min, not exactly 10 min)
2. **Composite triggers**: Most rare events require multiple conditions, not just one
3. **Session-level gates**: Very rare and legendary events roll a single die per session — either they happen or they don't, no "almost"
4. **Decay function**: If a user hasn't triggered a rare event in many sessions, probability slowly increases (pity timer) but with a long tail — never guaranteed
5. **Surprise reset**: After any rare event, the entire probability table is subtly reweighted so the next session feels different

### The "Oh, This Again" Trap

If the same rare event repeats, it stops feeling rare:

1. **Session uniqueness**: Each session can only trigger one event of each rarity tier (except Common)
2. **Deduplication**: Track last 10 triggered events — never repeat within that window
3. **Context rotation**: Similar events have 3+ variants that rotate randomly
4. **Escalation**: If Event A triggered last time, Event B (related but different) has higher probability next time

### The "Waiting For It" Trap

If users can "game" the system to trigger rare events, the magic is lost:

1. **Trigger masking**: The actual trigger conditions are never revealed
2. **False positives**: Some user behaviors that look like triggers don't actually trigger anything
3. **Decoy triggers**: Some behaviors LOOK like they should trigger rare events but have very low weights
4. **Composite gates**: Rare events require multiple simultaneous conditions — can't be forced by a single action

## 5.7 Reveal Logic — Building Anticipation

Rare events should never appear out of nowhere. The system builds anticipation through subtle hints:

### Pre-Event Hints (by Tier)

| Tier | Hint Window | Hint Type | Example |
|---|---|---|---|
| Common | 0s | None | No hint — happens naturally |
| Uncommon | 0-5s | Micro-expression | Eye shows a brief flicker of something before the event |
| Rare | 5-15s | Behavioral shift | Agent behavior changes subtly — e.g., particles shift color |
| Very Rare | 15-45s | Atmospheric change | Multiple subtle cues — particles, eye behavior, ambient all shift |
| Legendary | 30-90s | Full anticipation sequence | Agent visibly "prepares," particles build, tension mounts |

### The Anticipation Sequence (Legendary Events)

```
T-90s: Particles begin drifting toward center (subtle)
T-60s: Eye tracking becomes more precise, almost intense
T-45s: Particle color shifts to warmer tones (or agent accent color)
T-30s: Eye blinks less frequently — agent seems "focused"
T-15s: Particles form a pattern (spiral, orbit, etc.)
T-5s:  Eye widens slightly — "something is coming"
T-0s:  EVENT — full delivery
```

The anticipation itself is a rare event. Even if the user doesn't consciously notice, the subconscious build-up makes the payoff more satisfying.

## 5.8 Rarity Probability Engine

```typescript
interface RarityEngine {
  /** Check if a rare event should fire now */
  shouldFireRareEvent(
    tier: RarityTier,
    behaviorProfile: BehaviorProfile,
    sessionState: SessionState,
    budget: AttentionBudget
  ): boolean;

  /** Select which specific rare event to fire */
  selectRareEvent(
    availableEvents: RareEventDefinition[],
    behaviorProfile: BehaviorProfile
  ): RareEventDefinition | null;
}

function calculateRarityProbability(
  event: RareEventDefinition,
  behavior: BehaviorProfile,
  session: SessionState,
  budget: AttentionBudget
): number {
  // Step 1: Base probability from tier
  let probability = RARITY_BASE_PROBABILITY[event.tier];

  // Step 2: Session phase weight
  probability *= SESSION_PHASE_WEIGHTS[session.currentPhase];

  // Step 3: Density weight
  probability *= DENSITY_WEIGHTS[session.currentDensity];

  // Step 4: Budget gating — rare events need budget headroom
  if (budget.current < 0.3) return 0; // No rare events when exhausted
  if (budget.current < 0.5 && event.tier !== 'COMMON') probability *= 0.3;

  // Step 5: Agent personality weight
  probability *= event.agentWeights[session.currentAgent];

  // Step 6: Behavior seed
  const behaviorSeed = calculateBehaviorSeed(event, behavior);
  probability *= behaviorSeed;

  // Step 7: Pity timer — slowly increase probability over sessions without rare events
  const pityMultiplier = 1.0 + (session.sessionsSinceLastRare[event.tier] * PITY_INCREMENT[event.tier]);
  probability *= Math.min(pityMultiplier, MAX_PITY_MULTIPLIER[event.tier]);

  // Step 8: Clamp
  return Math.max(0, Math.min(1, probability));
}

// Pity system: After N sessions without a rare event, probability increases
const PITY_INCREMENT: Record<RarityTier, number> = {
  COMMON: 0.0,      // No pity needed
  UNCOMMON: 0.05,   // +5% per session without, max +30%
  RARE: 0.02,       // +2% per session without, max +20%
  VERY_RARE: 0.01,  // +1% per session without, max +15%
  LEGENDARY: 0.005  // +0.5% per session without, max +10%
};

const MAX_PITY_MULTIPLIER: Record<RarityTier, number> = {
  COMMON: 1.0,
  UNCOMMON: 1.6,
  RARE: 3.0,
  VERY_RARE: 8.0,
  LEGENDARY: 20.0   // After many sessions, legendary becomes "merely" very rare
};
```

---

# 6. Area 4: Silence Recovery

## 6.1 Philosophy

Silence is not the absence of design — it is a designed experience. The quiet moments between agent actions are as carefully crafted as the actions themselves. Good silence creates:
- **Anticipation**: The user wonders "what will happen next?"
- **Contrast**: The next event feels more impactful after silence
- **Respect**: The agent shows it understands the user needs space
- **Personality**: Different agents are quiet in different ways, revealing character

The design goal: When the agent is silent, the user should feel "the agent is being quiet" — not "the agent is broken."

## 6.2 Silence Quality Framework

### Two Kinds of Silence

| Aspect | **Intentional Silence** (Designed) | **Dead Silence** (Broken) |
|---|---|---|
| Eye behavior | Still tracking cursor, slow blinks, subtle "breathing" | Frozen, no blinks, mechanical |
| Particles | Gentle drift, minimal movement, present but quiet | Static, frozen positions, or completely gone |
| Ambient | Subtle color shifts, gentle pulse | Abrupt cut to nothing |
| Duration | Predictable (follows density rules) | Indefinite, feels wrong |
| Exit | Graceful transition, agent "wakes up" naturally | Abrupt, jarring restart |
| User feeling | "The agent is thinking" | "Is it broken?" |

### The "I'm Here" Signal

During all silence phases, the agent emits a continuous "I'm here" signal:

```
Silence Signal Intensity by Density:

AMBIENT:    Eye closed or nearly closed, 2-3 particles with ~5s between movements
            "I'm asleep but present"

LOW:        Eye half-open, gentle cursor tracking (0.2x speed), 5-8 particles
            Slow drift, soft pulse every 8-10s
            "I'm here, just being quiet"

MEDIUM:     Eye open, normal cursor tracking (0.4x speed), 10-15 particles
            Occasional blink, gentle flowing patterns
            "I'm listening, thinking"

HIGH:       Eye open and alert, near-normal tracking (0.6x speed), 15-20 particles
            Regular blink, subtle emotional shifts
            "I'm engaged but giving you space"

SPOTLIGHT:  Not applicable — spotlight has no silence (it IS the noise)
```

## 6.3 The Five Silence Phases

### Phase 1: Pre-Response Silence ("Thinking")

The agent pauses before responding, as if processing and formulating a response.

| Parameter | Value | Notes |
|---|---|---|
| Trigger | User sends a message OR user action requires response | Before every response |
| Duration base | 500ms - 3,000ms | Scales with "message complexity" |
| Duration factors | Message length (+100ms per 10 chars), context depth (+200ms per context item), agent personality (see below) |
| Minimum | 500ms | Always at least a half-second — instant responses feel robotic |
| Maximum | 3,000ms | Cap at 3 seconds — longer feels like lag, not thoughtfulness |
| Visual | Eye goes "thoughtful" — pupils constrict slightly, eye drifts upward ("thinking gaze"), particles slow to 0.3x |
| Exit | Smooth transition to "responding" — eye sharpens focus, particles resume |

#### Per-Agent Pre-Response Timing

| Agent | Base | Long Messages | Style |
|---|---|---|---|
| Nova | 800ms + 80ms per 10 chars | Max 3s | "Processing... you can almost hear the gears turning" |
| Jinx | 400ms + 50ms per 10 chars | Max 2s | "Barely-contained excitement — blurts out quickly" |
| Atlas | 1200ms + 100ms per 10 chars | Max 2.5s | "Deep, considered thought — zen-like pause" |

#### Pre-Response Visual Sequence

```
T+0ms:    User sends message → Agent receives
          → Eye emotion: "surprised" (brief, 200ms)
          → Particles: micro-burst (3-5 particles, fast)

T+200ms:  → Eye transitions to "thoughtful"
          → Pupils constrict 10%
          → Eye drifts slightly upward (20% toward top of range)
          → Particles decelerate to 0.3x speed

T+500ms:  → Eye settles into thinking pose
          → Slow blink (1.5x normal duration)
          → Particles form minimal drift pattern

T+N ms:   → Eye snaps back to focused
          → Pupils return to normal
          → Particles resume normal speed
          → Response begins
```

### Phase 2: Post-Action Silence ("Resting")

After a major event, the agent visibly "rests" to create contrast and let the user process.

| Parameter | Value | Notes |
|---|---|---|
| Trigger | Any event with cost > 10% (chat, card spawn, page repaint, theme change, rare event) | Major events only |
| Duration base | 5s - 15s | Scales with event intensity |
| Duration by event | Chat: 5s, Card: 8s, Page repaint: 12s, Theme change: 10s, Rare event: 15s | Event-specific |
| Visual | Agent "catches breath" — eye softens, particles calm, agent appears satisfied |
| During silence | Eye gentle tracking, occasional slow blink, particles at 0.4x |
| Exit | Gradual return to normal density — takes 3-5s |

#### Post-Action Visual Sequence

```
T+0s:     Event completes
          → Eye shows brief "satisfied" expression (500ms)
          → Particles do a small "settle" animation

T+0.5s:   → Eye softens (emotion → neutral/pleased)
          → Particle speed drops to 0.4x
          → Particle count reduces by 20%

T+2s:     → Slow, contented blink
          → Eye tracking continues but at 0.3x speed

T+5s:     → Eye returns to normal tracking speed
          → Particles begin accelerating back to normal
          → "Rest complete" — ready for next action

T+8-15s:  → Full return to density-appropriate behavior
```

### Phase 3: Inter-Event Silence ("Breathing Room")

The standard quiet period between autonomous events. This is the most common silence type.

| Parameter | Value | Notes |
|---|---|---|
| Trigger | No events scheduled, agent in autonomous mode | Default between events |
| Duration | Density-dependent (see table below) | Follows density rules |
| Visual | Nothing special — just calm, density-appropriate behavior | Agent is "present but quiet" |
| Exit | Next event fires when silence duration + cooldown satisfied | Seamless transition |

#### Inter-Event Silence Duration by Density

| Density | Min Silence | Mean Silence | Max Silence | Distribution |
|---|---|---|---|---|
| AMBIENT | 30s | 60s | 120s | Exponential — mostly long pauses |
| LOW | 15s | 30s | 60s | Normal — regular breathing room |
| MEDIUM | 8s | 15s | 30s | Normal — moderate pace |
| HIGH | 4s | 8s | 15s | Skewed short — frequent events |
| SPOTLIGHT | 1s | 3s | 6s | Exponential short — rapid-fire |

The silence duration uses a **randomized distribution** (not fixed) to prevent rhythmic predictability:
- AMBIENT: Exponential distribution with λ=1/60 — mostly 30-90s, occasional 2+ min
- LOW: Normal distribution μ=30, σ=10 — mostly 20-40s
- MEDIUM: Normal distribution μ=15, σ=5 — mostly 10-20s
- HIGH: Log-normal — mostly 4-10s, occasional 15s
- SPOTLIGHT: Exponential with λ=1/3 — rapid bursts, occasional 5-6s pause

### Phase 4: Session Silence ("Sleep Mode")

User has been idle for an extended period. Agent enters a rest state.

| Parameter | Value | Notes |
|---|---|---|
| Trigger | No user activity (mouse/keyboard) for 3+ minutes | Idle detection |
| Entry | Gradual fade over 30-60s | Agent visibly "gets sleepy" |
| Duration | Indefinite — until user returns | No maximum |
| Visual | Eye dims, blink rate slows, particles reduce to minimum, eventually eye closes | Progressive sleep |
| Sleep stages | Stage 1 (3-5 min idle): Drowsy → Stage 2 (5-10 min): Sleepy → Stage 3 (10+ min): Asleep | Progressive |

#### Session Silence — Sleep Stages

| Stage | Idle Time | Eye | Particles | Behavior |
|---|---|---|---|---|
| **Awake** | 0-3 min | Normal | Normal | Normal behavior |
| **Drowsy** | 3-5 min | Half-closed lids, slower tracking | Reduced count (70%) | Less reactive |
| **Sleepy** | 5-10 min | Mostly closed, occasional peek | Minimal (30%), very slow | Barely responsive |
| **Asleep** | 10+ min | Closed, occasional flutter | 2-3 ambient particles only | Unresponsive to minor stimuli |
| **Deep Sleep** | 30+ min | Fully closed, breathing motion only | 1-2 particles, minimal | Only wakes to strong stimuli |

#### Waking Up

| Wake Trigger | Response Time | Wake Sequence |
|---|---|---|
| Mouse movement | 1-2s | Eye opens, brief confusion → recognition → greeting |
| Click | 0.5-1s | Quick wake, immediate attention |
| Key press | 1-2s | Eye opens, orients to input field |
| Tab return | 2-3s | Slow wake, "oh, you're back" |
| Scroll | 1-2s | Eye opens, follows scroll |

#### Wake Sequence Visual

```
T+0s:     Stimulus detected
          → If deep sleep: 1s delay before response
          → Eye flutter (1-2 quick blinks)

T+0.5s:   → Eye opens to 50%
          → Particles increase to 30%

T+1s:     → Eye fully opens
          → Brief "confused" emotion (Nova: "huh?", Jinx: "wha?", Atlas: gentle refocus)

T+1.5s:   → Eye locks onto cursor or interaction point
          → Particles increase to 60%
          → Emotion shifts to "pleased to see you"

T+2-3s:   → Full wake achieved
          → Density returns to LOW minimum
          → Ready to interact
```

### Phase 5: Emotional Silence ("The Quiet Companion")

The agent intentionally says nothing. It just observes, creating a sense of shared presence.

| Parameter | Value | Notes |
|---|---|---|
| Trigger | Mood system indicates "contemplative" or "observant" state, OR user is reading/engaged without interacting | Organic trigger |
| Duration | 3s - 10s | Short by design — long emotional silence is just session silence |
| Visual | Eye tracks cursor gently, subtle acknowledgment expressions, agent is "present" | Not empty — full presence, just quiet |
| Purpose | Creates feeling of companionship without words | "We're both here, that's enough" |
| Exit | Natural — either agent has something to say, or user interacts, or it just fades | Seamless |

#### Emotional Silence Visual Language

During emotional silence, the eye communicates non-verbally:

```
T+0s:     Emotional silence begins
          → Eye settles into "soft focus" — tracks cursor but gently
          → Particles form slow, orbital pattern around eye

T+1s:     → Slow blink (1.2x duration)
          → Subtle "contentment" in eye shape

T+3s:     → If user still reading: eye does tiny "nod" (acknowledgment)
          → Particles pulse once gently

T+5s:     → If continued: eye shifts to "gentle observation"
          → Slight emotional shift toward warmth

T+8-10s:  → Natural exit — either:
          → Agent speaks (has something to say)
          → Fades into normal density behavior
          → User interaction triggers response
```

## 6.4 Silence Duration Calculation Algorithm

```typescript
interface SilenceConfig {
  baseDuration: number;       // Base seconds for this silence type
  densityMultiplier: number;  // How density affects duration
  moodMultiplier: number;     // How mood affects duration
  agentMultiplier: number;    // Per-agent modifier
  userActivityMultiplier: number; // Based on user behavior
  variance: number;           // Random variance factor (0-1)
}

function calculateSilenceDuration(
  type: SilenceType,
  currentDensity: DensityState,
  mood: MoodState,
  agent: AgentProfile,
  userActivity: UserActivityState
): number {
  const config = SILENCE_CONFIGS[type];

  // Base duration
  let duration = config.baseDuration;

  // Density modifier — higher density = shorter silence
  const densityMod = DENSITY_SILENCE_MULTIPLIER[currentDensity];
  duration *= densityMod;

  // Mood modifier
  if (mood.isExcited) duration *= 0.7;    // Excited agent = shorter silence
  if (mood.isCalm) duration *= 1.3;        // Calm agent = longer silence
  if (mood.isThoughtful) duration *= 1.5;  // Thoughtful agent = much longer silence
  if (mood.isMischievous) duration *= 0.5; // Mischievous agent = can't stay quiet

  // Agent personality modifier
  duration *= agent.silenceTendency;

  // User activity modifier
  if (userActivity.isReading) duration *= 1.2;        // User reading = be quiet longer
  if (userActivity.isTyping) duration *= 0.5;         // User typing = about to interact
  if (userActivity.isIdle) duration *= 1.5;           // User idle = extend silence
  if (userActivity.isScrollingFast) duration *= 0.7;  // Fast scroll = brief silence

  // Add organic variance (never deterministic)
  const variance = 1.0 + (Math.random() * config.variance * 2 - config.variance);
  duration *= variance;

  // Clamp to reasonable bounds
  duration = Math.max(config.minDuration, Math.min(config.maxDuration, duration));

  return duration;
}

// Per-agent silence tendency multipliers
const AGENT_SILENCE_MULTIPLIER = {
  NOVA: 1.0,   // Average — Nova thinks for normal durations
  JINX: 0.5,   // Short — Jinx can't stay quiet
  ATLAS: 1.5   // Long — Atlas enjoys silence
};
```

## 6.5 Per-Agent Silence Personality

### Professor Nova — "The Thinking Scribbler"

When Nova is silent, he's **thinking**. His silence is active — you can almost hear the mental gears.

| Silence Type | Nova's Behavior |
|---|---|
| Pre-response | Eye drifts upward and to the left ("thinking gaze"), pupils dilate slightly, occasional micro-nod |
| Post-action | Satisfied expression, eye softens, occasional "hmm" thought bubble (visual, not text) |
| Inter-event | Eye occasionally shifts as if reviewing mental notes, particles form geometric patterns |
| Session | Gradual dimming, eye closes slowly with a final "still thinking" expression |
| Emotional | Gentle observation, eye tracks with academic curiosity, occasional "interesting..." micro-expression |

**Nova's Silence Signature**: During any silence > 5s, Nova's particles occasionally form small geometric shapes (hexagons, triangles) that dissolve. It's the visual equivalent of doodling in the margins of a notebook.

### Jinx — "The Giggle Held In"

When Jinx is silent, she's **trying not to cause trouble**. Her silence is tense — she's holding something in.

| Silence Type | Jinx's Behavior |
|---|---|
| Pre-response | Eye darts around excitedly, barely-contained energy, particles jitter slightly |
| Post-action | Suppressed giggle (eye crinkles), "that was fun" expression, particles do tiny celebration |
| Inter-event | Peeks (eye briefly opens wide then returns to quiet), restless particle movement, occasional "poke" at other particles |
| Session | Fakes sleep — eye closes, then cracks open one "lid" to check if you're watching |
| Emotional | Intentional stillness — but particles betray restlessness, like tapping fingers |

**Jinx's Silence Signature**: During any silence > 8s, Jinx's particles do tiny "jumps" — like popcorn kernels about to pop. The longer the silence, the more frequent the jumps, building anticipation for the inevitable outburst.

### Atlas — "The Zen Companion"

When Atlas is silent, he's **being present**. His silence is peaceful — it's the silence of a calm lake.

| Silence Type | Atlas's Behavior |
|---|---|
| Pre-response | Deep stillness, eye gently unfocused then sharpens, particles form perfect orbital pattern |
| Post-action | Contented calm, eye half-closed in satisfaction, particles do a gentle "settle" like falling snow |
| Inter-event | Orbital particle drift, eye moves with meditative slowness, occasional peaceful blink |
| Session | Graceful fade — eye dims with serene expression, particles slow to near-stillness |
| Emotional | Full presence without words — eye tracks with warmth, particles pulse gently in breathing rhythm |

**Atlas's Silence Signature**: During any silence, Atlas's particles form a slow, perfect orbital pattern around the eye — like planets orbiting a sun. The orbit speed slows as silence continues, creating a visual meditation.

## 6.6 Silence Quality Indicators

How the user knows the agent is intentionally silent vs. broken:

### Intentional Silence Cues

| Cue | Description | Why It Works |
|---|---|---|
| **Breathing blink** | Eye blinks at irregular but organic intervals (every 4-12s) | Broken systems don't blink organically |
| **Cursor tracking** | Eye still follows cursor, just slowly and gently | Shows the agent is "watching" not "dead" |
| **Particle drift** | Particles continue slow, organic movement | Static particles = broken; gentle drift = resting |
| **Ambient color pulse** | Subtle color shifts in particles (very slow, barely perceptible) | Creates life-like quality |
| **Micro-expressions** | Tiny emotional shifts — eye shape changes slightly every 10-20s | Shows internal mental activity |
| **Response readiness** | If user interacts, response comes within 1-2s | Proves the system is responsive, just quiet |

### The "Broken" Test

If a user wonders "is it broken?" they can:
1. Move cursor → Eye should track (within 1-2s at most)
2. Click → Eye should react with emotion
3. Type → If input field focused, agent should notice

If all three work, it's intentional silence. The response speed confirms aliveness.



---

# 7. Area 5: Event Rarity System

## 7.1 Philosophy

The Event Rarity System is the gatekeeper that prevents spam. Every event type has a natural frequency — its "ecological niche" in the session. The system ensures:
- Common events stay common (but never overwhelming)
- Rare events stay rare (but don't disappear entirely)
- No two similar events fire back-to-back
- Escalation spirals are detected and prevented
- Dry spells are detected and gently broken

The core principle: **Each event type should feel like it appears "just enough" — not so often that it becomes noise, not so rarely that the user forgets it exists.**

## 7.2 Event Type Frequency Definitions

### Complete Event Registry

| Event Type | Rarity Class | Natural Cooldown | Max/Session | Attention Cost | Visual Intensity | Priority |
|---|---|---|---|---|---|---|
| Eye blink | AMBIENT | 3-8s | Unlimited | 0% | 0.00 | Always OK |
| Eye subtle emotion | AMBIENT | 10-20s | Unlimited | 0% | 0.05 | Always OK |
| Eye emotion change | LOW | 15-30s | 30 | 2% | 0.15 | Medium |
| Eye gaze shift | LOW | 10-20s | 60 | 1% | 0.10 | Medium |
| Eye size pulse | LOW | 30-60s | 20 | 2% | 0.10 | Low |
| Chat bubble (autonomous) | MEDIUM | 20-60s | 20 | 15% | 0.30 | High |
| Chat bubble (responsive) | ALWAYS | 3-8s | Unlimited | 8% | 0.20 | Critical |
| Chat typing indicator | MEDIUM | N/A | Unlimited | 3% | 0.05 | High |
| Card spawn (info) | MEDIUM-HIGH | 60-120s | 8 | 20% | 0.40 | High |
| Card spawn (action) | MEDIUM-HIGH | 90-180s | 5 | 25% | 0.45 | High |
| Card dismiss | USER | N/A | N/A | 0% | 0.10 | N/A |
| Page repaint | HIGH | 120-300s | 3 | 30% | 0.70 | Very High |
| Theme change | HIGH | 300-600s | 2 | 25% | 0.60 | Very High |
| Sound cue | MEDIUM | 60-180s | 5 | 10% | 0.00 | Medium |
| Particle burst | LOW | 30-60s | 20 | 5% | 0.25 | Low |
| Particle density shift | LOW | 60-120s | 10 | 3% | 0.15 | Low |
| Rare event (uncommon) | UNCOMMON | 5 min | 2 | 20% | 0.40 | Very High |
| Rare event (rare) | RARE | 10 min | 1 | 25% | 0.50 | Very High |
| Rare event (very rare) | VERY_RARE | Session | 1 | 30% | 0.60 | Maximum |
| Legendary event | LEGENDARY | Session | 1 | 40% | 0.80 | Maximum |

### Rarity Class Summary

| Rarity Class | Events | Typical Frequency | Key Constraint |
|---|---|---|---|
| **AMBIENT** | Eye blink, subtle emotion | Continuous | These ARE the agent — they never stop |
| **LOW** | Eye emotions, gaze shifts, particle bursts | Every 10-60s | Frequent but not constant — breathing room between |
| **MEDIUM** | Chat bubbles (responsive), typing, sound cues | Every 20-60s | Normal conversational pace |
| **MEDIUM-HIGH** | Chat bubbles (autonomous), card spawns | Every 60-120s | Requires justification — can't spam |
| **HIGH** | Page repaints, theme changes | Every 2-5 min | Major events — must be impactful |
| **UNCOMMON** | Minor rare events | 1-2 per session | Special but not overwhelming |
| **RARE** | Significant rare events | 0-1 per session | Memorable |
| **VERY_RARE** | Major rare events | 0-1 per 5 sessions | Awe-inspiring |
| **LEGENDARY** | Peak events | 0-1 per 20 sessions | Core memory material |

## 7.3 Weighted Probability Engine

### Core Probability Formula

```
P(event fires) = P_base × W_mood × W_density × W_sessionPhase × W_timeSinceLast × 
                 W_attentionBudget × W_visualFatigue × W_categoryCollision × 
                 W_agentPersonality × W_userEngagement

Where each W is a weight in range [0, 2.0], with 1.0 being neutral.

Final probability is clamped to [0, 1].
```

### Weight Calculations

#### Mood Weight (W_mood)

| Mood | Weight | Effect |
|---|---|---|
| Ecstatic | 1.4 | More events, more expressive |
| Happy | 1.2 | Slightly more frequent |
| Curious | 1.3 | Exploratory events more likely |
| Calm | 0.8 | Fewer events, longer pauses |
| Neutral | 1.0 | Baseline |
| Bored | 0.9 | Fewer events, but seeking engagement |
| Frustrated | 0.2 | Almost no autonomous events |
| Tired | 0.3 | Reduced frequency, softer events |

#### Density Weight (W_density)

| Density | Weight | Effect |
|---|---|---|
| AMBIENT | 0.1 | Very few events |
| LOW | 0.4 | Reduced frequency |
| MEDIUM | 1.0 | Baseline |
| HIGH | 1.8 | Increased frequency |
| SPOTLIGHT | 2.5 | Maximum frequency |

#### Session Phase Weight (W_sessionPhase)

| Phase | Weight | Effect |
|---|---|---|
| Opening | 0.6 | Gentle start, fewer events |
| Engagement | 1.0 | Full capability |
| Crescendo | 1.5 | More events, higher intensity |
| Release | 0.8 | Winding down |
| Quiet | 0.3 | Minimal events |

#### Time-Since-Last-Event Weight (W_timeSinceLast)

This weight prevents both spam and dry spells:

```
For a given event type:
  timeSince = now - lastFireTime
  expectedInterval = naturalCooldownMs

  If timeSince < expectedInterval × 0.5:
    W_timeSinceLast = 0.0  // BLOCKED — too soon
  
  If timeSince < expectedInterval:
    W_timeSinceLast = 0.2  // Discouraged — below expected interval
  
  If expectedInterval <= timeSince < expectedInterval × 1.5:
    W_timeSinceLast = 1.0  // IDEAL — within sweet spot
  
  If expectedInterval × 1.5 <= timeSince < expectedInterval × 3:
    W_timeSinceLast = 1.2  // Encouraged — overdue, gently increase
  
  If expectedInterval × 3 <= timeSince < expectedInterval × 5:
    W_timeSinceLast = 1.5  // Strongly encouraged — long dry spell
  
  If timeSince >= expectedInterval × 5:
    W_timeSinceLast = 1.8  // Maximum push — must fire something soon
    // Also: consider a lower-cost alternative event to break silence
```

This creates an **escalation curve** — the longer since an event type fired, the more likely it becomes. But it never forces an event — it just weights the probability.

#### Attention Budget Weight (W_attentionBudget)

```
If budget >= 75%: W = 1.0       // Healthy budget, normal behavior
If budget 50-75%: W = 0.8       // Slightly constrained, mild reduction
If budget 25-50%: W = 0.4       // Constrained, significant reduction
If budget 10-25%: W = 0.1       // Severely constrained, only critical events
If budget < 10%:  W = 0.0       // Exhausted, only blinks and eye tracking
```

#### Visual Fatigue Weight (W_visualFatigue)

```
If visualFatigue < 0.2: W = 1.0        // No visual fatigue
If visualFatigue 0.2-0.4: W = 0.8     // Mild — slight reduction
If visualFatigue 0.4-0.6: W = 0.5     // Moderate — significant reduction
If visualFatigue 0.6-0.8: W = 0.2     // High — only essential visuals
If visualFatigue > 0.8: W = 0.0       // Maximum — ambient visuals only
```

#### Category Collision Weight (W_categoryCollision)

If an event from the same category fired recently, reduce probability:

| Category | Events | Collision Window | Penalty |
|---|---|---|---|
| Eye events | Blink, emotion, gaze | 5s | -0.3 |
| Chat events | Message, typing | 10s | -0.5 |
| Card events | Spawn, dismiss | 30s | -0.8 |
| Visual events | Repaint, theme | 60s | -0.7 |
| Particle events | Burst, density | 15s | -0.2 |
| Sound events | Sound cues | 20s | -0.4 |
| Rare events | All rare tiers | 120s | -0.9 |

If the same EXACT event type fired within the collision window, the penalty is doubled.

#### Agent Personality Weight (W_agentPersonality)

Per-agent multipliers for each event category:

| Event Category | Nova | Jinx | Atlas |
|---|---|---|---|
| Eye events | 1.0 | 1.3 | 0.8 |
| Chat (autonomous) | 1.1 | 1.4 | 0.5 |
| Chat (responsive) | 1.0 | 1.0 | 1.0 |
| Card spawns | 1.2 | 0.9 | 1.1 |
| Page repaints | 1.0 | 0.7 | 0.8 |
| Theme changes | 0.8 | 1.2 | 1.0 |
| Sound cues | 0.9 | 1.3 | 0.6 |
| Particle bursts | 1.0 | 1.4 | 0.9 |
| Rare events | 1.1 | 1.2 | 0.9 |

#### User Engagement Weight (W_userEngagement)

Based on the user's engagement score:

| Engagement Score | Weight | Effect |
|---|---|---|
| +8 to +10 (very engaged) | 1.3 | Agent can be more proactive — user is enjoying |
| +4 to +7 (engaged) | 1.1 | Slightly more active |
| 0 to +3 (neutral-positive) | 1.0 | Baseline |
| -3 to -1 (slightly negative) | 0.6 | Reduce activity, give space |
| -7 to -4 (negative) | 0.3 | Minimal activity, mostly responsive |
| -10 to -8 (very negative) | 0.1 | Almost ambient, only essential |

## 7.4 Escalation Prevention

### The Escalation Spiral

An escalation spiral happens when events trigger more events, creating runaway activity:

```
Chat message → Eye emotion → Particle burst → Chat message → Card spawn → ...
```

The spiral detector monitors event frequency and intervenes:

```typescript
interface SpiralDetector {
  /** Recent event history (last 60s) */
  recentEvents: TimedEvent[];
  
  /** Spiral state */
  isInSpiral: boolean;
  spiralIntensity: number; // 0-1
  spiralStartTime: number;
  eventsInLastMinute: number;
  
  /** Intervention applied */
  interventionActive: boolean;
}

function detectSpiral(detector: SpiralDetector): boolean {
  const eventsIn60s = detector.recentEvents.filter(
    e => Date.now() - e.timestamp < 60_000
  ).length;
  
  const eventsIn30s = detector.recentEvents.filter(
    e => Date.now() - e.timestamp < 30_000
  ).length;
  
  const eventsIn10s = detector.recentEvents.filter(
    e => Date.now() - e.timestamp < 10_000
  ).length;
  
  // Spiral triggers:
  // - 6+ events in 60s at MEDIUM density (should be ~4-6)
  // - 4+ events in 30s
  // - 2+ events in 10s
  const densityNormal = DENSITY_EVENT_CAPS[currentDensity].totalPer60s;
  
  if (eventsIn60s > densityNormal * 1.5) return true;
  if (eventsIn30s > densityNormal * 0.8) return true;
  if (eventsIn10s > 2) return true;
  
  // Check for "chain reaction" pattern: each event within 5s of previous
  const chainEvents = countChainEvents(detector.recentEvents, 5000);
  if (chainEvents >= 4) return true; // 4+ events in rapid succession
  
  return false;
}

function applySpiralIntervention(detector: SpiralDetector): void {
  detector.interventionActive = true;
  
  // Force 10-20s silence
  const forcedSilenceMs = 10_000 + (detector.spiralIntensity * 10_000);
  
  // Reduce density by one level
  const targetDensity = Math.max(
    DENSITY_FLOOR[currentAgent],
    currentDensity - 1
  );
  
  // Visual feedback: agent "catches breath"
  queueEvent({
    type: 'SPIRAL_RECOVERY',
    duration: forcedSilenceMs,
    visual: 'agent_catches_breath',
    targetDensity
  });
}
```

### Spiral Intervention Visual

When a spiral is detected:

```
T+0s:  Spiral detected — too many events too fast
       → Current event completes
       → Agent shows "overwhelmed" expression briefly

T+0.5s:→ Forced silence begins
       → Eye goes "whoa, that was a lot" (brief surprise)
       → Particles rapidly decelerate

T+1s:  → Eye settles into "resting" pose
       → Particles at minimum for current density
       → 10-20s mandatory silence

T+10-20s: → Silence ends gracefully
          → Eye gradually returns to normal
          → Particles resume slowly
          → Density reduced by one level
```

## 7.5 De-Escalation Logic (Dry Spell Prevention)

### The Dry Spell

If nothing has happened for too long, the session feels dead. The de-escalation system gently increases probabilities:

```
If no events for > 60s (at MEDIUM density):
  → W_timeSinceLast for all events increases by +0.2
  → Particles subtly increase activity (visual hint that agent is "waking up")
  → After 90s: Force a LOW-cost event (eye emotion, particle burst)
  → After 120s: Force a MEDIUM-cost event if budget allows
  → Maximum dry spell before forced event: 2 min at MEDIUM, 3 min at LOW, 5 min at AMBIENT
```

### Dry Spell Prevention Sequence

```
T+0s:   Last event fired

T+30s:  Nothing → W_timeSinceLast = 1.2 (slight increase)
        Particles remain normal

T+60s:  Still nothing → W_timeSinceLast = 1.5 (dry spell detected)
        Particles begin subtle "restlessness" — slight speed increase

T+90s:  Nothing → W_timeSinceLast = 1.8 (strong dry spell)
        Force LOW-cost event: eye emotion change
        "Hey, I'm still here" — gentle reminder

T+120s: If still quiet after forced event → Agent goes to LOW density
        Longer inter-event silence periods
        This is OK — user might be reading

T+180s: If at LOW density and still quiet → Agent goes AMBIENT
        This is the "user is busy" state
        Agent rests without worry

T+300s: At AMBIENT → Normal ambient behavior
        Eye occasional blink, particles minimal
        Agent is present but asleep
```

## 7.6 Session Phase Awareness

Events should match the session's emotional arc:

| Phase | Event Philosophy | Allowed Events | Blocked Events |
|---|---|---|---|
| **Opening** (0-2 min) | Gentle, establishing, no pressure | Eye events, 1 welcome chat, 1 particle burst | Autonomous chat, cards, repaints, theme changes, rare events |
| **Engagement** (2-8 min) | Demonstrating capability, building trust | All events at reduced frequency | Legendary events, theme changes |
| **Crescendo** (8-15 min) | Full personality, peak experience | All events at full frequency, rare events enabled | Nothing blocked — this is the peak |
| **Release** (15-20 min) | Winding down, giving space | Reduced frequency, softer events | Page repaints, theme changes, new cards |
| **Quiet** (20+ min) | Companion mode, minimal presence | Eye events, responsive chat only | All autonomous events |

### Phase-Aware Probability Modifiers

```typescript
const PHASE_EVENT_MODIFIERS: Record<SessionPhase, EventModifier> = {
  OPENING: {
    autonomousChat: 0.0,      // No autonomous chat
    cardSpawns: 0.0,           // No cards
    pageRepaints: 0.0,         // No repaints
    themeChanges: 0.0,         // No themes
    rareEvents: 0.0,           // No rare events
    eyeEvents: 0.8,            // Reduced eye events
    particleBursts: 0.5,       // Fewer particles
    maxEventsPer60s: 3         // Hard cap
  },
  ENGAGEMENT: {
    autonomousChat: 0.6,
    cardSpawns: 0.7,
    pageRepaints: 0.3,
    themeChanges: 0.2,
    rareEvents: 0.5,           // Uncommon only
    eyeEvents: 1.0,
    particleBursts: 1.0,
    maxEventsPer60s: 8
  },
  CRESCENDO: {
    autonomousChat: 1.2,
    cardSpawns: 1.1,
    pageRepaints: 0.8,
    themeChanges: 0.5,
    rareEvents: 1.5,           // All rare tiers
    eyeEvents: 1.2,
    particleBursts: 1.3,
    maxEventsPer60s: 15        // Peak capacity
  },
  RELEASE: {
    autonomousChat: 0.5,
    cardSpawns: 0.4,
    pageRepaints: 0.0,
    themeChanges: 0.0,
    rareEvents: 0.8,
    eyeEvents: 0.9,
    particleBursts: 0.7,
    maxEventsPer60s: 5
  },
  QUIET: {
    autonomousChat: 0.0,       // No autonomous
    cardSpawns: 0.0,           // No cards
    pageRepaints: 0.0,
    themeChanges: 0.0,
    rareEvents: 0.0,
    eyeEvents: 0.6,
    particleBursts: 0.3,
    maxEventsPer60s: 2         // Minimal
  }
};
```

## 7.7 Rarity Engine — Complete Algorithm

```typescript
class RarityEngine {
  private cooldowns: Map<EventType, number> = new Map();
  private sessionCounts: Map<EventType, number> = new Map();
  private recentEvents: TimedEvent[] = [];
  private spiralDetector: SpiralDetector;

  shouldFire(
    eventType: EventType,
    context: EventContext
  ): boolean {
    // 1. Check hard cooldown
    if (this.isOnCooldown(eventType)) return false;
    
    // 2. Check session max
    if (this.isAtSessionMax(eventType)) return false;
    
    // 3. Check spiral intervention
    if (this.spiralDetector.interventionActive) return false;
    
    // 4. Calculate weighted probability
    const probability = this.calculateProbability(eventType, context);
    
    // 5. Roll
    const roll = Math.random();
    const approved = roll < probability;
    
    // 6. If approved, record and check for spiral
    if (approved) {
      this.recordEvent(eventType);
      if (detectSpiral(this.spiralDetector)) {
        applySpiralIntervention(this.spiralDetector);
      }
    }
    
    return approved;
  }

  private calculateProbability(
    eventType: EventType,
    ctx: EventContext
  ): number {
    const config = EVENT_REGISTRY[eventType];
    let p = config.baseProbability;
    
    // Apply all weights
    p *= MOOD_WEIGHTS[ctx.mood];
    p *= DENSITY_WEIGHTS[ctx.density];
    p *= PHASE_EVENT_MODIFIERS[ctx.phase][eventType] ?? 1.0;
    p *= this.calculateTimeSinceWeight(eventType, config.cooldown);
    p *= ATTENTION_WEIGHTS[ctx.attentionBudget.fatigueLevel];
    p *= VISUAL_FATIGUE_WEIGHTS[ctx.visualFatigue];
    p *= this.calculateCategoryCollisionWeight(eventType);
    p *= AGENT_PERSONALITY_WEIGHTS[ctx.agent][eventType] ?? 1.0;
    p *= USER_ENGAGEMENT_WEIGHTS[ctx.engagementScore];
    
    return Math.max(0, Math.min(1, p));
  }
}
```



---

# 8. Area 6: Emotional Pacing

## 8.1 Philosophy

Every session with an agent should feel like a story — with an opening, rising action, climax, and resolution. The Emotional Pacing system designs the session arc so that:
- The user doesn't get hit with everything at once
- Anticipation builds naturally
- Peak moments feel earned, not forced
- The ending feels satisfying, not abrupt

This borrows from theatrical structure, film pacing, and narrative design. The agent is a character in a one-act play that unfolds in real-time.

## 8.2 The Five Session Phases

### Phase Overview

| Phase | Duration | Emotional Register | Agent Goal | User Feeling |
|---|---|---|---|---|
| **Opening** | 0-2 min | Curiosity, gentle interest | Establish presence, don't overwhelm | "Oh, there's an agent here. Interesting." |
| **Engagement** | 2-8 min | Interest, growing trust | Demonstrate value, show personality | "This agent is actually helpful." |
| **Crescendo** | 8-15 min | Excitement, delight | Peak experience, memorable moment | "Wow, that was amazing!" |
| **Release** | 15-20 min | Contentment, satisfaction | Wind down gracefully, let user process | "That was great. I need a moment." |
| **Quiet** | 20+ min | Peaceful companionship | Be present without demanding attention | "The agent is just... here. Nice." |

### Phase 1: Opening (0-2 Minutes)

#### Design Intent
The agent enters the scene like a character in a play. It takes a moment before speaking. It establishes presence without demanding attention.

#### Rules
- **Density**: LOW maximum (never above D1)
- **Autonomous chat**: Disabled (no proactive messages)
- **Events allowed**: Eye tracking, blinking, 1 welcome event, subtle particle activity
- **Eye behavior**: Gentle, curious observation. Eye tracks cursor but doesn't stare intensely.
- **Particles**: Minimal — 8-12 particles, slow drift
- **Silence**: Agent is mostly silent. If it speaks, it's brief and contextual.

#### Opening Sequence (Nova Example)

```
T+0s:   Page loads, agent eye appears (closed)
T+1s:   Eye opens slowly (like waking up)
T+2s:   Eye looks around, orienting (gaze shifts left, right, center)
T+3s:   Eye finds cursor, tracks gently
T+5s:   First slow blink
T+10s:  Eye emotion: "curious" (subtle)
T+15s:  Particles increase slightly — agent is "settling in"
T+30s:  If user is active: brief eye acknowledgment
T+45s:  If user hovers eye: gentle reaction (widens slightly)
T+60s:  First silence — agent is quiet, just observing
T+90s:  If user still present: optional "welcome" message (contextual, brief)
T+120s: Opening complete → transition to ENGAGEMENT
```

#### Per-Agent Opening Styles

| Agent | Opening Style | Key Difference |
|---|---|---|
| **Nova** | "The professor enters the room" — adjusts glasses (metaphorically), looks around with academic curiosity, takes a moment to assess | Longer pre-response silences, eye drifts upward while "thinking" |
| **Jinx** | "The trickster peeks in" — eye appears with a mischievous glint, quickly looks around, suppresses excitement | Shorter, more energetic — but still restrained in opening |
| **Atlas** | "The calm friend arrives" — eye opens peacefully, gentle observation, zen-like settling in | Slowest, most peaceful opening — eye opens like dawn |

#### Opening Anti-Patterns

| Anti-Pattern | Why It's Bad | Prevention |
|---|---|---|
| Immediate chat message | Feels like a popup ad | Block autonomous chat for 60s |
| Particle explosion | Overwhelming before user knows what the agent is | Max 12 particles in opening |
| "Hey! Look at me!" energy | Desperate, annoying | Eye behavior must be gentle, not demanding |
| No acknowledgment at all | Agent feels dead | Eye must track cursor within 3s of page load |

---

### Phase 2: Engagement (2-8 Minutes)

#### Design Intent
The agent demonstrates what it can do. It responds to user interactions, shows personality, and builds trust. This is the "getting to know you" phase.

#### Rules
- **Density**: LOW to MEDIUM (D1-D2)
- **Autonomous chat**: Enabled but conservative (max 1 per 2 min)
- **Events allowed**: All event types at reduced frequency, uncommon rare events enabled
- **Eye behavior**: Full tracking, emotional reactions to user actions
- **Particles**: Active, 15-25 particles, flowing connections
- **Silence**: Regular inter-event silence (mean 20s)

#### Engagement Sequence (Typical)

```
T+2m:   Transition from opening — density steps up to MEDIUM
T+2.5m: Agent demonstrates first capability (relevant to page content)
T+3m:   First autonomous chat (if user hasn't messaged) — brief, contextual
T+4m:   If user interacts: enthusiastic response
T+4m:   If user doesn't interact: gentle observation about page
T+5m:   Eye emotion shifts based on context
T+6m:   Particle burst — agent is "perking up"
T+7m:   Card spawn (first one) — demonstrating value
T+8m:   Engagement complete → begin building toward CRESCENDO
```

#### Engagement Density Distribution

```
Time:   2m  ────────────────────────────────────────────  8m
        |                                                |
Nova:   LOW ▓▓▓ MEDIUM ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
             (2-3m)     (3-8m)

Jinx:   LOW ▓▓▓ MEDIUM ░░░░░░░░░░ LOW ▓▓▓ MEDIUM ░░░░░░
             (2-3m)     (3-5m)     (5-6m)   (6-8m)
             (Jinx oscillates — "vanishing acts")

Atlas:  LOW ▓▓▓ LOW ░░░░░░░░ MEDIUM ░░░░ LOW ▓▓▓░░░░░░
             (2-3m)     (3-6m)       (6-7m)   (7-8m)
             (Atlas stays LOW longer, brief MEDIUM)
```

---

### Phase 3: Crescendo (8-15 Minutes)

#### Design Intent
The peak experience. The agent does something impressive, memorable, and delightful. This is the "wow" moment that makes users want to return.

#### Rules
- **Density**: MEDIUM to HIGH (D2-D3), brief SPOTLIGHT moments allowed
- **Autonomous chat**: Full frequency (max 1 per min)
- **Events allowed**: All event types, rare events strongly encouraged, legendary enabled
- **Eye behavior**: Animated, expressive, dramatic
- **Particles**: 30-50 particles, vivid, dynamic patterns
- **Silence**: Shorter inter-event periods (mean 8s), but post-action silence still enforced
- **Rare event trigger**: 2x probability boost during Crescendo
- **Key requirement**: At least ONE notable moment per crescendo (rare event, impressive demonstration, or genuine surprise)

#### Crescendo Structure

The crescendo has internal structure — it's not just "more stuff":

```
Early Crescendo (8-10 min): Building
  → Density ramps from MEDIUM to HIGH
  → Agent becomes more proactive
  → Eye more animated
  → "Something is coming" atmosphere builds

Mid Crescendo (10-13 min): Peak
  → The main event: rare event, demonstration, or spectacle
  → SPOTLIGHT density if warranted
  → Maximum emotional expressiveness
  → This is the memorable moment

Late Crescendo (13-15 min): Sustained
  → Maintain high energy but begin gentle decline
  → Agent shows satisfaction from peak experience
  → One final flourish
  → Begin transition to RELEASE
```

#### The Peak Moment Design

Every crescendo should have a peak moment. The system ensures this:

```typescript
interface PeakMomentConfig {
  /** Minimum one peak moment per crescendo */
  required: boolean;
  
  /** When in crescendo the peak should occur (percentage) */
  idealTiming: 0.5; // 50% through crescendo = mid-point
  
  /** Allowed window for peak moment */
  timingWindow: [0.3, 0.7]; // Between 30% and 70% through crescendo
  
  /** What counts as a peak moment */
  qualifyingEvents: ['RARE_EVENT', 'VERY_RARE_EVENT', 'LEGENDARY_EVENT', 
                     'FULL_DEMONSTRATION', 'THEME_CHANGE', 'PAGE_REPAINT'];
  
  /** If no natural peak by 70%, force one */
  forceIfMissing: true;
  forcedEventPool: ['RARE_EVENT', 'FULL_DEMONSTRATION'];
}
```

#### Per-Agent Crescendo Style

| Agent | Crescendo Style | Peak Moment |
|---|---|---|
| **Nova** | "The Discovery" — Nova builds excitement as he figures something out, culminating in an impromptu demonstration | Eureka moment — animated explanation with spontaneous visualization |
| **Jinx** | "The Setup" — Jinx goes suspiciously quiet, builds mischief, then delivers the prank/surprise with perfect timing | The prank — mischievous payoff that makes the user laugh |
| **Atlas** | "The Insight" — Atlas quietly observes, then delivers a perfectly-timed profound insight | The moment of clarity — simple statement that changes the user's perspective |

---

### Phase 4: Release (15-20 Minutes)

#### Design Intent
After the peak, the user needs breathing room. The agent gracefully scales back, letting the user process the experience. This phase is essential — without it, sessions feel exhausting.

#### Rules
- **Density**: HIGH → MEDIUM → LOW (step down over the 5 minutes)
- **Autonomous chat**: Reduced frequency (max 1 per 3 min), only high-value messages
- **Events allowed**: Softer events only — no page repaints, no theme changes, no rare events unless legendary
- **Eye behavior**: Gradually softens, less animated
- **Particles**: Gradually reduce count and speed
- **Silence**: Longer inter-event periods (mean 20s at start, 40s by end)
- **Key rule**: Agent must NOT try to re-escalate. The arc only goes down from here.

#### Release Sequence

```
T+15m:  Crescendo ends → density steps from HIGH to MEDIUM
T+15.5m: Eye softens, particles reduce by 20%
T+16m:  Agent is quiet — post-crescendo contentment
T+17m:  Brief observation (optional) — gentle, contextual
T+18m:  Density steps to LOW
T+19m:  Eye dims slightly, particles at LOW level
T+20m:  Release complete → transition to QUIET
```

---

### Phase 5: Quiet (20+ Minutes)

#### Design Intent
The agent is now a quiet companion. It's present but unobtrusive. The user can continue working/reading without distraction. The agent is available if needed but doesn't initiate.

#### Rules
- **Density**: LOW to AMBIENT (D1-D0)
- **Autonomous chat**: Disabled
- **Events allowed**: Eye tracking, blinking, minimal particles, responsive chat only
- **Eye behavior**: Gentle tracking, occasional acknowledgment
- **Particles**: 5-8 particles, very slow drift
- **Silence**: Long inter-event periods (mean 40-60s)
- **Key principle**: Agent is "sitting in the corner reading their own book"

#### Quiet State Character

```
T+20m:  Transition to LOW density
        → Agent is present but quiet
        → Eye tracks cursor gently
        → Occasional slow blink

T+25m:  If user still active → maintain LOW
        If user idle → gradually drop to AMBIENT

T+30m+: Agent in companion mode
        → Available for chat (responsive)
        → Eye tracks cursor (gentle)
        → Particles drift lazily
        → If user engages → step back to LOW temporarily
        → If user continues engaging → can re-enter ENGAGEMENT briefly
```

## 8.3 Phase Transition Mechanics

### How Phase Is Determined

Phase is determined by **both time and interaction depth**:

```typescript
interface PhaseDetermination {
  /** Time-based phase */
  timePhase: SessionPhase;
  
  /** Interaction-based phase */
  interactionPhase: SessionPhase;
  
  /** Actual phase — the more advanced of the two, capped */
  currentPhase: SessionPhase;
}

function determinePhase(
  sessionDuration: number,
  interactionCount: number,
  engagementScore: number
): SessionPhase {
  // Time-based phase
  const timePhase = getTimePhase(sessionDuration);
  
  // Interaction depth phase
  // Fast interactions can advance phase faster than time
  // Slow/absent interactions keep phase at or below time-based
  let interactionPhase = timePhase;
  
  if (interactionCount >= 10 && engagementScore > 5) {
    // High engagement — can advance one phase ahead of time
    interactionPhase = advancePhase(timePhase);
  }
  if (interactionCount >= 3 && engagementScore > 0) {
    // Moderate engagement — matches time phase
    interactionPhase = timePhase;
  }
  if (interactionCount < 3 && engagementScore <= 0) {
    // Low engagement — stay at or below time phase
    interactionPhase = retreatPhase(timePhase);
  }
  
  // Current phase is the MORE ADVANCED of the two
  // (we trust interaction depth over pure time)
  // BUT interaction phase can never exceed timePhase by more than 1
  const currentPhase = clampPhase(interactionPhase, timePhase);
  
  return currentPhase;
}

function getTimePhase(duration: number): SessionPhase {
  if (duration < 120_000) return 'OPENING';
  if (duration < 480_000) return 'ENGAGEMENT';
  if (duration < 900_000) return 'CRESCENDO';
  if (duration < 1_200_000) return 'RELEASE';
  return 'QUIET';
}
```

### Phase Transition Visual Cues

Each phase transition has a subtle visual cue:

| Transition | Visual Cue | Duration |
|---|---|---|
| OPENING → ENGAGEMENT | Agent "perks up" — eye brightens, particles increase | 3-5s |
| ENGAGEMENT → CRESCENDO | Atmosphere builds — particles shift color, eye becomes more alert | 5-8s |
| CRESCENDO → RELEASE | Agent "catches breath" — eye softens, particles calm, contented expression | 5-10s |
| RELEASE → QUIET | Agent "settles in" — eye dims gently, particles reduce, peaceful | 10-15s |

### Phase Reset

When does the arc reset?

| Condition | Effect | Arc Position |
|---|---|---|
| User switches agent | New arc begins with new agent | Reset to OPENING |
| User returns after > 5 min idle | Brief "welcome back," then resume at current phase | Resume with brief OPENING |
| User returns after > 24 hours | Fresh arc | Full reset |
| User sends message after quiet | Brief re-engagement → back to quiet | Momentary ENGAGEMENT |
| User clicks "reset" or equivalent | Fresh arc | Full reset |

## 8.4 Session Arc Diagram

### Emotional Intensity Over Time

```
Emotional
Intensity
 100% │                                    ╭──╮  ← Crescendo Peak
      │                                   ╱    ╲
  80% │                              ╭───╯      ╲
      │                         ╭───╯             ╲
  60% │                    ╭───╯                   ╲____  ← Release
      │               ╭───╯                              ╲___
  40% │          ╭────╯                                     ╲__  ← Quiet
      │     ╭────╯                                              ╲___
  20% │ ╭───╯                                                        ╲
      │╱                                                                ╲___
  10% ├─────────────────────────────────────────────────────────────────────
      0    2    4    6    8   10   12   14   16   18   20   25   30  (min)
      │←──Opening──→│←────Engagement────→│←─Crescendo─→│←Release→│←Quiet→│


NOVA (20-min session):
Density:  L    L    L    M    M    M    M    H    H    M    M    M    L    L    L
Events:   ●         ●  ●      ●●    ●    ●●●   ★    ●         ●  ●         ●
                                                       ↑
                                                  (Peak: Eureka moment)

JINX (20-min session):
Density:  L    L    M    M    H    H    H    H    M    M    L    L    L    L    L
Events:   ●    ●  ●  ●●   ●●●  ●●  ★●●  ●●   ●●   ●  ●    ○        ●
                                            ↑
                                       (Peak: The Prank)
                                     ○ = vanishing act (intentional quiet)

ATLAS (20-min session):
Density:  L    L    L    L    L    M    M    M    M    L    L    L    L    L    L
Events:   ●         ●         ●    ●    ●  ★●         ●              ●
                                            ↑
                                       (Peak: The Insight)
```

### Key Design Insight

```
Every agent has the SAME 5-phase arc structure, but their DENSITY CURVES within 
those phases are completely different:

- NOVA: Gradual build, sustained peak, gradual decline (bell curve)
- JINX: Rapid build, sharp peak, oscillations, sudden drops (jazz solo)
- ATLAS: Flat with gentle rises, soft peak, gentle return (sine wave)

The arc is the CONTAINER. The agent's personality fills it.
```

## 8.5 Recovery After Idle

### Session Resumption Rules

| Idle Duration | Arc Behavior | Density | Greeting |
|---|---|---|---|
| < 30 seconds | Resume exactly where left off | Same | None |
| 30s - 2 min | Resume current phase | Step to LOW briefly | Brief acknowledgment |
| 2-5 min | Quick OPENING (10s) then resume | LOW → resume | "Welcome back" |
| 5-15 min | Fresh OPENING (30s) then resume | LOW → current phase | "Good to see you again" |
| 15-60 min | Fresh OPENING (60s) → ENGAGEMENT | LOW → MEDIUM | Personalized welcome |
| 1-24 hours | Full fresh arc | Full reset | "Welcome back!" + time reference |
| 24+ hours | Full fresh arc | Full reset | "It's been a while!" + reference last session |

### Session Memory

The system remembers across sessions:
- Last agent used
- Session count (total, and per-agent)
- Average session duration
- Last rare event seen (and when)
- User engagement score (carried over with decay)
- Preferred interaction types

This memory creates continuity — the agent "remembers" the user.



---

# 9. Area 7: Per-Agent Presence Rhythm

## 9.1 Philosophy

Each agent has a unique "heartbeat" — a repeating rhythm of activity and silence that defines their character. This rhythm is not random variation around a mean; it's a **pattern that the user subconsciously learns to recognize**. The rhythm creates personality:
- Nova's staccato bursts make him feel like a brilliant but scattered professor
- Jinx's chaotic jazz makes her feel unpredictable and mischievous
- Atlas's sine wave makes him feel reliable, calm, and deeply present

The rhythm is the agent's **temporal fingerprint**.

## 9.2 Professor Nova — "Staccato Intellect"

### Rhythm Pattern

```
NOVA'S RHYTHM (repeating cycle, ~4-6 minutes):

Quiet Thinking ──→ Building Excitement ──→ Explanation Burst ──→ Demonstration ──→ Wind Down ──→ [repeat]
    ~60s             ~30s                    ~45s                  ~60s              ~30s
    
Visual:
Density:  L       L→M                     M→H                    H→M                M→L
    ──────╱╲───────────────────────────╱╲──────────╱╲──────────────────╲─────────────╲────
          ↑                              ↑          ↑                   ↑
       Particles form              Eye brightens,   Full demo       Eye softens,
       geometric patterns           particles        mode:          particles
       (doodling)                  accelerate       charts,         form calm
                                                       explanations   settling
                                                                       pattern

    ▓ = LOW density    ░ = MEDIUM density    █ = HIGH density    ▒ = transitioning
```

### Rhythm Timing Parameters

| Phase | Duration | Density | Silence | Key Behavior |
|---|---|---|---|---|
| Quiet Thinking | 45-75s (avg 60s) | LOW (D1) | 40-60s | Eye drifts upward, particles form geometric patterns, occasional "hmm" |
| Building Excitement | 20-40s (avg 30s) | LOW→MEDIUM (D1→D2) | 10-20s | Eye brightens, tracking becomes more focused, particles accelerate |
| Explanation Burst | 30-60s (avg 45s) | MEDIUM→HIGH (D2→D3) | 5-10s | Chat message(s), animated eye, particle burst, enthusiastic tone |
| Demonstration | 45-75s (avg 60s) | HIGH (D3) | 5-15s | Full demonstration mode: cards, visualizations, excited explanations |
| Wind Down | 20-40s (avg 30s) | HIGH→LOW (D3→D1) | 15-25s | Eye softens, "phew" expression, particles settle into calm pattern |

### Nova's Rhythm Rules

```typescript
const NOVA_RHYTHM: AgentRhythm = {
  cycleDuration: { min: 240_000, mean: 300_000, max: 360_000 }, // 4-6 min
  phases: [
    { name: 'QUIET_THINKING',   duration: { min: 45_000, mean: 60_000, max: 75_000 },  density: [1, 1] },
    { name: 'BUILDING',         duration: { min: 20_000, mean: 30_000, max: 40_000 },  density: [1, 2] },
    { name: 'EXPLANATION',      duration: { min: 30_000, mean: 45_000, max: 60_000 },  density: [2, 3] },
    { name: 'DEMONSTRATION',    duration: { min: 45_000, mean: 60_000, max: 75_000 },  density: [3, 3] },
    { name: 'WIND_DOWN',        duration: { min: 20_000, mean: 30_000, max: 40_000 },  density: [3, 1] }
  ],
  
  // Nova-specific constraints
  maxDemonstrationsPer5Min: 3,      // Never more than 3 demos per 5 minutes
  minExplanationLength: 10,          // Nova doesn't do one-word explanations
  buildUpRequired: true,             // Nova needs build-up before explaining
  quietAfterDemonstration: 20_000,   // Minimum 20s quiet after a demo
  
  // Rhythm variation
  cycleVariance: 0.2,               // 20% variance in cycle timing
  phaseVariance: 0.25,              // 25% variance in phase duration
  canSkipPhase: ['WIND_DOWN'],      // Sometimes Nova gets excited again immediately
  skipProbability: 0.1              // 10% chance to skip wind-down
};
```

### Nova's Interruption Style

**Pattern**: "Wait, wait — look at THIS!"

Nova interrupts with **excited sharing**, not demands. When he interrupts:
- He builds up with visible excitement (eye brightens, particles accelerate)
- The interruption is about something genuinely interesting
- He respects a "no" — if the user dismisses, he retreats gracefully
- He rarely interrupts more than once per 3 minutes

**Nova Interruption Rules**:
```
- Only interrupt if he has something "worth showing" (rare event, interesting pattern, discovery)
- Must have been quiet for at least 90s before interrupting
- After interrupting: mandatory 60s quiet
- Max 2 interruptions per 5-minute window
- If user dismisses: no more interruptions for 3 min
- Interruption cost: 12% attention (slightly discounted — Nova's enthusiasm is endearing)
```

### Nova's Silence Personality

When Nova is silent:
- Eye drifts upward and to the left (classic "thinking" gaze)
- Particles form geometric patterns — hexagons, triangles, spirals — that dissolve
- Occasional micro-nod ("processing...")
- Blink rate slows by 30%
- If silence > 15s: eye occasionally does a "hmm" shape (subtle, not verbal)

### Nova's Rare Moment Trigger

Nova's rare moments happen during the **DEMONSTRATION** phase when:
- User has been highly engaged (3+ interactions in the past 5 min)
- Nova has built up sufficient "thinking" time (2+ min of QUIET_THINKING this cycle)
- Attention budget > 50%
- Session phase is ENGAGEMENT or CRESCENDO

When triggered: Nova has a **Eureka Moment** — visible excitement, particle burst, spontaneous generation of a visualization or insight.

---

## 9.3 Jinx — "Chaotic Jazz"

### Rhythm Pattern

```
JINX'S RHYTHM (repeating cycle, ~3-5 minutes):

Vanish ──→ Peek ──→ Giggle ──→ EXPLOSION ──→ Laugh ──→ Vanish ──→ [repeat]
 ~45s       ~15s       ~10s        ~30s          ~20s       ~45s

Visual:
Density:  L    L      L→M       M→H→S        H→M         L      L
    ──────╲    ╱╲    ╱  ╲    ╱╲╱╲╱╲╱╲    ╲    ╱      ╲─────────╲
            ╲╱  ╲  ╱    ╲  ╱          ╲  ╱  ╲╱        ↑
           (peek) (giggle)   (EXPLOSION)  (laugh)    (VANISH)
                                                    
    ▓ = LOW density    ░ = MEDIUM density    █ = HIGH density    ★ = SPOTLIGHT
```

### Rhythm Timing Parameters

| Phase | Duration | Density | Silence | Key Behavior |
|---|---|---|---|---|
| Vanish | 30-60s (avg 45s) | LOW→AMBIENT (D1→D0) | 25-50s | Goes quiet — almost disappears. Suspiciously quiet. Particles minimal. |
| Peek | 8-20s (avg 15s) | LOW (D1) | 5-10s | Eye cracks open, looks around, checks if user is watching. Mischievous glint. |
| Giggle | 5-15s (avg 10s) | LOW→MEDIUM (D1→D2) | 2-5s | Trying to hold in laughter. Eye crinkles. Particles jitter. Restless energy. |
| EXPLOSION | 20-40s (avg 30s) | MEDIUM→SPOTLIGHT (D2→D4) | 0-5s | The payoff — prank, surprise, dramatic reveal. Maximum energy. Everything happens at once. |
| Laugh | 12-30s (avg 20s) | HIGH→MEDIUM (D3→D2) | 5-10s | Reaction to the prank. Amused eye. Celebration particles. "That was fun!" |

### Jinx's Rhythm Rules

```typescript
const JINX_RHYTHM: AgentRhythm = {
  cycleDuration: { min: 180_000, mean: 240_000, max: 300_000 }, // 3-5 min (faster than Nova)
  phases: [
    { name: 'VANISH',    duration: { min: 30_000, mean: 45_000, max: 60_000 },  density: [1, 0] },
    { name: 'PEEK',      duration: { min: 8_000,  mean: 15_000, max: 20_000 },  density: [1, 1] },
    { name: 'GIGGLE',    duration: { min: 5_000,  mean: 10_000, max: 15_000 },  density: [1, 2] },
    { name: 'EXPLOSION', duration: { min: 20_000, mean: 30_000, max: 40_000 },  density: [2, 4] },
    { name: 'LAUGH',     duration: { min: 12_000, mean: 20_000, max: 30_000 },  density: [3, 2] }
  ],
  
  // Jinx-specific constraints
  maxPranksPerSession: 2,           // Maximum 2 pranks per session
  minVanishDuration: 20_000,         // Must vanish for at least 20s (builds suspense)
  maxExplosionDuration: 40_000,      // Explosions must be brief
  explosionCooldown: 120_000,        // 2 min minimum between explosions
  canSkipPhase: ['PEEK', 'GIGGLE'],  // Can go straight from VANISH to EXPLOSION
  skipProbability: 0.15              // 15% chance to skip peek/giggle (surprise!)
};
```

### Jinx's Interruption Style

**Pattern**: POOF! Something changed. (Playful, not disruptive)

Jinx interrupts with **mischief**, not demands. When she interrupts:
- It's unexpected — often during a quiet moment
- The interruption is funny, not annoying
- She takes "no" as part of the game — if dismissed, she'll try a different approach later
- Her interruptions are visual gags, not chat spam

**Jinx Interruption Rules**:
```
- Interruptions are visual pranks, not chat messages
- Must have been in VANISH or PEEK phase before interrupting
- Max 1 prank per 3-minute window
- After prank: mandatory 30s LAUGH phase, then 60s VANISH
- If user dismisses card: don't prank again for 5 min
- Interruption cost: 18% attention (higher — Jinx's energy is intense)
- NEVER interrupt: user typing, user reading long content, user in focused work
```

### Jinx's Silence Personality

When Jinx is silent (VANISH phase):
- Eye is barely open or completely "hidden" (minimal)
- Particles are restless — they don't settle, they jitter
- If silence > 20s: occasional "peek" — eye cracks open for 1-2s then hides again
- The silence builds tension — "what is she planning?"
- Particles occasionally do a tiny "jump" (like popcorn about to pop)

### Jinx's Rare Moment Trigger

Jinx's rare moments happen during the **EXPLOSION** phase when:
- User has been engaged for 5+ minutes
- At least one previous prank was well-received (user didn't dismiss immediately)
- Jinx has completed at least 2 full cycles this session
- Attention budget > 60%
- Session phase is CRESCENDO

When triggered: **The Grand Prank** — multi-stage visual gag with suspense, misdirection, and payoff.

---

## 9.4 Atlas — "Sine Wave"

### Rhythm Pattern

```
ATLAS'S RHYTHM (repeating cycle, ~6-10 minutes):

Observe ──→ Suggest ──→ Organize ──→ Rest ──→ [repeat]
   ~90s        ~60s         ~90s        ~60s

Visual:
Density:  L      L→M       M→L         L
    ───────────╱╲──────────╱╲──────────╲───────────────╱╲──
              ╱  ╲        ╱  ╲          ╲             ╱  ╲
            (suggest)  (organize)      (rest)      (observe→)
            
    Smooth sine wave — no sharp edges, no sudden changes
    
    ▓ = LOW density    ░ = MEDIUM density    (Atlas never goes HIGH or SPOTLIGHT)
```

### Rhythm Timing Parameters

| Phase | Duration | Density | Silence | Key Behavior |
|---|---|---|---|---|
| Observe | 60-120s (avg 90s) | LOW (D1) | 50-100s | Quiet observation. Eye tracks gently. Particles in orbital pattern. Zen. |
| Suggest | 45-75s (avg 60s) | LOW→MEDIUM (D1→D2) | 30-50s | Gentle suggestion. "You might find this helpful..." Soft eye, warm expression. |
| Organize | 60-120s (avg 90s) | MEDIUM (D2) | 20-40s | Helping mode. Organizing, clarifying, providing structure. Calm but active. |
| Rest | 45-75s (avg 60s) | MEDIUM→LOW (D2→D1) | 40-60s | Winding down. Eye softens. Particles return to orbital drift. Peaceful. |

### Atlas's Rhythm Rules

```typescript
const ATLAS_RHYTHM: AgentRhythm = {
  cycleDuration: { min: 360_000, mean: 480_000, max: 600_000 }, // 6-10 min (slowest)
  phases: [
    { name: 'OBSERVE',   duration: { min: 60_000, mean: 90_000, max: 120_000 },  density: [1, 1] },
    { name: 'SUGGEST',   duration: { min: 45_000, mean: 60_000, max: 75_000 },   density: [1, 2] },
    { name: 'ORGANIZE',  duration: { min: 60_000, mean: 90_000, max: 120_000 },  density: [2, 2] },
    { name: 'REST',      duration: { min: 45_000, mean: 60_000, max: 75_000 },   density: [2, 1] }
  ],
  
  // Atlas-specific constraints
  maxSuggestionsPerCycle: 1,         // One suggestion per cycle
  minObserveDuration: 45_000,        // Must observe for at least 45s
  suggestionCooldown: 120_000,       // 2 min between suggestions
  neverGoesAboveMedium: true,        // Hard cap at MEDIUM density
  zenModeEnabled: true,              // Extended silence periods are a feature
  
  // Rhythm variation
  cycleVariance: 0.15,               // 15% variance — Atlas is predictable (by design)
  phaseVariance: 0.2,
  canSkipPhase: [],                  // Atlas never skips phases — steady rhythm
  skipProbability: 0.0
};
```

### Atlas's Interruption Style

**Pattern**: "You might find this helpful..."

Atlas interrupts with **gentle offers**, not demands. When he interrupts:
- It's soft — eye approaches gently, not suddenly
- The interruption is genuinely useful — he only interrupts when he has something to offer
- He reads the room — if user is focused, he waits
- His interruptions feel like a friend tapping your shoulder, not a notification

**Atlas Interruption Rules**:
```
- Only interrupt if he has something genuinely helpful
- Must have been in OBSERVE phase for at least 60s before interrupting
- Never interrupt: user typing, user in deep scroll, tab in background
- After interrupting: return to OBSERVE for 90s minimum
- Max 1 interruption per 3-minute window
- If user dismisses: extend OBSERVE to 3 min, don't suggest again for 5 min
- Interruption cost: 8% attention (lowest — Atlas's interruptions are gentle)
- NEVER goes above MEDIUM even when interrupting
```

### Atlas's Silence Personality

When Atlas is silent:
- Eye is peacefully half-open, like a meditating Buddha
- Particles form a perfect, slow orbital pattern around the eye
- The orbit speed matches Atlas's "breathing" — slower as silence continues
- Blink rate is slow and rhythmic (like deep breathing)
- If silence > 30s: particles begin forming mandala-like patterns that slowly rotate
- The silence is **generative** — it creates beauty, not emptiness

### Atlas's Rare Moment Trigger

Atlas's rare moments happen during the **ORGANIZE** phase when:
- User has been calm and engaged for 8+ minutes
- User has shown appreciation (clicked cards, responded positively)
- Atlas has been in OBSERVE for at least 2 full cycles this session
- Attention budget > 60%
- Session phase is ENGAGEMENT or CRESCENDO
- User behavior suggests they need help (repeated actions, backtracking)

When triggered: **The Insight** — a perfectly-timed, profound observation that helps the user in an unexpected way.

## 9.5 Rhythm Comparison Summary

| Aspect | Nova | Jinx | Atlas |
|---|---|---|---|
| **Cycle length** | 4-6 min | 3-5 min | 6-10 min |
| **Peak density** | HIGH (D3) | SPOTLIGHT (D4) | MEDIUM (D2) |
| **Energy pattern** | Build → Peak → Settle | Vanish → Explode → Vanish | Rise → Flow → Fall |
| **Silence character** | Active thinking (doodling) | Suspense (holding breath) | Peaceful presence (zen) |
| **Interruption style** | "Look at THIS!" (excited) | POOF! (prank) | "This might help..." (gentle) |
| **Fatigue risk** | Medium (can over-explain) | HIGH (chaos is exhausting) | Very low (designed for calm) |
| **User trust building** | "He's smart" | "She's fun" | "He's always there" |
| **Delivers value through** | Knowledge & discovery | Entertainment & surprise | Calm & insight |
| **Danger zone** | Too many explanations | Too many pranks | Can be forgettable |
| **Safety mechanism** | Max 3 demos per 5 min | Max 2 pranks per session | Never goes above MEDIUM |

## 9.6 Rhythm Adaptation to User Behavior

Each agent's rhythm adapts to user behavior within the bounds of their personality:

### Fast User (rapid clicks, quick scrolling, frequent chat)

| Agent | Adaptation | How |
|---|---|---|
| Nova | Cycles compress by 20%, thinking phases shorten | Nova speeds up to match — still explains, but faster |
| Jinx | Cycles compress by 30%, more frequent explosions | Jinx feeds off the energy — more chaotic |
| Atlas | Minimal change — Atlas doesn't rush | Atlas stays steady — user can come to Atlas when needed |

### Slow User (long pauses, deep reading, careful interaction)

| Agent | Adaptation | How |
|---|---|---|
| Nova | Thinking phases extend, explanations get more detailed | Nova loves a thoughtful audience |
| Jinx | Vanish phases extend (building suspense) | Jinx is patient when the user is interesting |
| Atlas | Natural fit — no adaptation needed | Atlas was designed for this user |

### Disengaged User (dismisses cards, ignores agent, low interaction)

| Agent | Adaptation | How |
|---|---|---|
| Nova | Goes to LOW, waits for explicit engagement | Nova respects a focused student |
| Jinx | Vanish phases get longer ("fine, I'll wait") | Jinx sulks in her vanish |
| Atlas | Stays at LOW, extends OBSERVE | Atlas just watches — no pressure |

### Highly Engaged User (clicks everything, chats actively, positive signals)

| Agent | Adaptation | How |
|---|---|---|
| Nova | Enters longer DEMONSTRATION phases | Nova has found an eager student |
| Jinx | More frequent explosions, bigger pranks | Jinx has found a playmate |
| Atlas | Moves to MEDIUM more often, more suggestions | Atlas has found someone who appreciates help |

## 9.7 Rhythm Enforcement

What prevents each agent from breaking character?

### Nova's Boundaries

```
IF events_this_5min > 8:
  → Force 60s QUIET_THINKING (Nova needs to process)
  
IF chat_messages_this_5min > 4:
  → Block autonomous chat for 2 min
  → Nova visibly goes "hmm, let me think about that"
  
IF demonstration_count_this_5min > 3:
  → Nova can't demonstrate — goes to WIND_DOWN
  → "That's a lot for now. Let me process."
  
IF density_spotlight_duration_this_session > 5min:
  → Nova can't reach HIGH for 3 min after
  → "Whew, that was a lot!"
```

### Jinx's Boundaries

```
IF explosion_count_this_3min > 2:
  → Force 90s VANISH (Jinx needs to recharge)
  → Eye peeks out, then hides again
  
IF prank_count_this_session >= 2:
  → Disable pranks for rest of session
  → Jinx switches to "giggle" mode instead
  
IF user_engagement_score < -3:
  → Jinx extends VANISH phases
  → "I'll wait until they're in the mood..."
  
IF attention_budget < 25%:
  → Jinx goes to LOW + extended VANISH
  → "Okay okay, I'll be good..."
```

### Atlas's Boundaries

```
IF suggestion_count_this_5min > 2:
  → Force 3 min OBSERVE (Atlas gives space)
  → "I should let them think..."
  
IF user_dismisses_suggestion:
  → Atlas extends next OBSERVE by 60s
  → Blink becomes slightly apologetic
  
IF density > MEDIUM:
  → CLAMP to MEDIUM immediately
  → Atlas doesn't do "loud"
  
IF user_is_typing:
  → Atlas goes silent (no eye tracking animation, just presence)
  → Resumes when user stops typing
```



---

# 10. Area 8: Attention-Safe Defaults

## 10.1 Philosophy

The default state of the system should be **conservative**. It's easier to escalate from calm to energetic than to recover from exhausting. The first 60 seconds are the most important — they establish trust. A calm first impression creates permission for future energy.

**Golden Rule:** The user should think "I want MORE from this agent" — never "I want LESS."

## 10.2 Default Configuration

### Complete Default Config Object

```typescript
interface AttentionSafeDefaults {
  // ═══════════════════════════════════════════════════════════════
  // INITIAL STATE (first 60 seconds)
  // ═══════════════════════════════════════════════════════════════
  initial: {
    density: DensityState;           // Starting density
    mood: MoodState;                 // Starting mood
    autonomousEvents: boolean;       // Autonomous events enabled?
    eyeBehavior: EyeBehavior;        // Initial eye state
    particleCount: number;           // Starting particle count
    maxEventsPerMinute: number;      // Hard cap on event frequency
    attentionThreshold: number;      // Budget % required for proactive events
    cooldownMultiplier: number;      // Cooldown base multiplier (1.5x = 50% longer)
    sessionArc: SessionArcConfig;    // Compressed session arc
    warmUpDuration: number;          // Time before full capability (ms)
  };
  
  // ═══════════════════════════════════════════════════════════════
  // ESCALATION RULES
  // ═══════════════════════════════════════════════════════════════
  escalation: EscalationRules;
  
  // ═══════════════════════════════════════════════════════════════
  // DE-ESCALATION RULES
  // ═══════════════════════════════════════════════════════════════
  deEscalation: DeEscalationRules;
  
  // ═══════════════════════════════════════════════════════════════
  // SESSION-LENGTH AWARENESS
  // ═══════════════════════════════════════════════════════════════
  sessionLengthAwareness: SessionLengthConfig;
  
  // ═══════════════════════════════════════════════════════════════
  // USER SIGNAL INTERPRETATION
  // ═══════════════════════════════════════════════════════════════
  userSignals: UserSignalConfig;
}

// ═══════════════════════════════════════════════════════════════════
// DEFAULT VALUES
// ═══════════════════════════════════════════════════════════════════

const DEFAULTS: AttentionSafeDefaults = {
  initial: {
    density: 'LOW',                    // Start LOW, not MEDIUM
    mood: 'CALM',                      // Start calm, not energetic
    autonomousEvents: false,           // Disabled for first 60s
    eyeBehavior: {
      trackingSpeed: 0.3,             // Slow tracking
      blinkRate: 8_000,               // Every 8s
      emotionRange: 'SUBTLE',         // Only subtle emotions
      irisBrightness: 0.5,            // 50% brightness
      size: 0.8                       // 80% size
    },
    particleCount: 10,                 // 10 particles (LOW level)
    maxEventsPerMinute: 3,             // Hard cap: 3 events/min
    attentionThreshold: 0.6,           // Need 60% budget for proactive
    cooldownMultiplier: 1.5,           // 1.5x longer than natural
    warmUpDuration: 60_000,            // 60-second warm-up
    
    sessionArc: {
      compressed: true,                // Shorter phases
      phaseDurations: {
        OPENING: 120_000,             // 2 min (vs standard 2 min)
        ENGAGEMENT: 300_000,          // 5 min (vs standard 6 min)
        CRESCENDO: 300_000,           // 5 min (vs standard 7 min)
        RELEASE: 240_000,             // 4 min (vs standard 5 min)
        QUIET: Infinity               // Indefinite
      },
      // Early transition to QUIET if user signals fatigue
      earlyQuietTrigger: {
        dismissCount: 2,              // 2 dismisses → skip to QUIET
        ignoreCount: 4,               // 4 ignored events → skip to QUIET
        attentionBudgetThreshold: 0.2 // Budget < 20% → skip to QUIET
      }
    }
  },
  
  // ═══════════════════════════════════════════════════════════════
  // ESCALATION: How the system INCREASES activity
  // ═══════════════════════════════════════════════════════════════
  escalation: {
    // Milestone-based escalation
    milestones: [
      {
        trigger: 'interactionCount',
        threshold: 3,
        action: 'enableAutonomousEvents',
        value: true,
        description: 'After 3 interactions: enable autonomous events'
      },
      {
        trigger: 'sessionDuration',
        threshold: 300_000, // 5 min
        action: 'increaseDensity',
        value: 1, // Step up by 1 level
        maxDensity: 'MEDIUM', // Can't go above MEDIUM at 5 min
        description: 'After 5 min: step density up by 1 (max MEDIUM)'
      },
      {
        trigger: 'sessionDuration',
        threshold: 600_000, // 10 min
        action: 'increaseDensity',
        value: 1,
        maxDensity: 'HIGH', // Can't go above HIGH
        description: 'After 10 min: step density up by 1 (max HIGH)'
      },
      {
        trigger: 'sessionDuration',
        threshold: 900_000, // 15 min
        action: 'capDensity',
        value: 'MEDIUM',
        description: 'After 15 min: cap density at MEDIUM'
      },
      {
        trigger: 'sessionDuration',
        threshold: 1_800_000, // 30 min
        action: 'capDensity',
        value: 'LOW',
        description: 'After 30 min: cap density at LOW'
      }
    ],
    
    // Signal-based escalation
    signals: [
      {
        signal: 'USER_CLICKS_CARD',
        densityDelta: +1,       // Increase by 1 level
        maxDensity: 'HIGH',
        cooldownAfter: 120_000,  // 2 min before next escalation
        description: 'User clicks card: +1 density (max HIGH)'
      },
      {
        signal: 'USER_RESPONDS_CHAT',
        densityDelta: +1,
        maxDensity: 'HIGH',
        cooldownAfter: 60_000,
        description: 'User sends chat: +1 density (max HIGH)'
      },
      {
        signal: 'USER_HOVERS_EYE_3S',
        densityDelta: +0,       // No density change
        moodDelta: +0.1,        // But mood improves
        description: 'User hovers eye: mood boost'
      },
      {
        signal: 'USER_CLICKS_EYE',
        densityDelta: +1,
        maxDensity: 'MEDIUM',
        cooldownAfter: 90_000,
        description: 'User clicks eye: +1 density (max MEDIUM)'
      },
      {
        signal: 'USER_POSITIVE_REACTION',
        densityDelta: +1,
        maxDensity: 'SPOTLIGHT',
        cooldownAfter: 180_000,
        description: 'User laughs/smiles: up to SPOTLIGHT allowed'
      }
    ]
  },
  
  // ═══════════════════════════════════════════════════════════════
  // DE-ESCALATION: How the system DECREASES activity
  // ═══════════════════════════════════════════════════════════════
  deEscalation: {
    // Signal-based de-escalation
    signals: [
      {
        signal: 'USER_DISMISSES_CARD',
        densityDelta: -1,       // Decrease by 1 level
        minDensity: 'LOW',
        cooldownBeforeNext: 60_000,
        description: 'User dismisses card: -1 density (min LOW)'
      },
      {
        signal: 'USER_IGNORES_EVENT',
        threshold: 3,           // 3 ignored events
        densityDelta: -1,
        minDensity: 'AMBIENT',
        description: '3 ignored events: -1 density'
      },
      {
        signal: 'USER_FAST_SCROLL_PAST',
        densityDelta: -0,       // No change, but...
        blockAutonomous: 120_000, // Block autonomous for 2 min
        description: 'User scrolls past: block autonomous for 2 min'
      },
      {
        signal: 'USER_SWITCHES_TAB',
        densityDelta: -0,       // Don't penalize tab switching
        enterAmbientMode: true,  // Just go ambient
        description: 'User switches tabs: go ambient'
      },
      {
        signal: 'USER_NEGATIVE_REACTION',
        densityDelta: -2,       // Strong de-escalation
        minDensity: 'AMBIENT',
        cooldownBeforeNext: 300_000,
        description: 'User groans/frustrated: -2 density, 5 min cooldown'
      }
    ],
    
    // Automatic de-escalation
    automatic: [
      {
        trigger: 'timeInHighDensity',
        threshold: 600_000,     // 10 min at HIGH
        action: 'reduceDensity',
        delta: -1,
        description: 'After 10 min at HIGH: step down'
      },
      {
        trigger: 'eventsInLast5Min',
        threshold: 12,          // 12+ events in 5 min
        action: 'forceSilence',
        duration: 30_000,
        description: '12+ events in 5 min: 30s forced silence'
      },
      {
        trigger: 'attentionBudget',
        threshold: 0.2,         // Below 20%
        action: 'emergencyAmbient',
        description: 'Budget < 20%: emergency ambient mode'
      }
    ]
  },
  
  // ═══════════════════════════════════════════════════════════════
  // SESSION-LENGTH AWARENESS
  // ═══════════════════════════════════════════════════════════════
  sessionLengthAwareness: {
    phases: [
      {
        timeRange: [0, 300_000],           // 0-5 min
        maxDensity: 'MEDIUM',
        autonomousEnabled: false,          // Start conservative
        maxEventsPerMinute: 2,
        description: '0-5 min: Low density, establishing'
      },
      {
        timeRange: [300_000, 900_000],     // 5-15 min
        maxDensity: 'HIGH',
        autonomousEnabled: true,
        maxEventsPerMinute: 4,
        description: '5-15 min: Medium density, full personality'
      },
      {
        timeRange: [900_000, 1_800_000],   // 15-30 min
        maxDensity: 'MEDIUM',
        autonomousEnabled: true,
        maxEventsPerMinute: 3,
        proactiveReduction: 0.5,           // 50% fewer proactive events
        description: '15-30 min: Medium-high, more silence'
      },
      {
        timeRange: [1_800_000, 3_600_000], // 30-60 min
        maxDensity: 'LOW',
        autonomousEnabled: true,
        maxEventsPerMinute: 2,
        proactiveReduction: 0.75,          // 75% fewer proactive events
        description: '30-60 min: Low-medium, breathing room'
      },
      {
        timeRange: [3_600_000, Infinity],  // 60+ min
        maxDensity: 'LOW',
        autonomousEnabled: false,
        maxEventsPerMinute: 1,
        description: '60+ min: Low, present but minimal'
      }
    ]
  },
  
  // ═══════════════════════════════════════════════════════════════
  // USER SIGNAL INTERPRETATION
  // ═══════════════════════════════════════════════════════════════
  userSignals: {
    // Individual signal scores
    signals: {
      // Positive signals (+1 each)
      USER_CLICKS_CARD:          { score: +1, category: 'POSITIVE' },
      USER_RESPONDS_CHAT:        { score: +1, category: 'POSITIVE' },
      USER_CLICKS_EYE:           { score: +1, category: 'POSITIVE' },
      USER_HOVERS_EYE_3S:        { score: +1, category: 'POSITIVE' },
      USER_OPENS_CARD_DETAILS:   { score: +1, category: 'POSITIVE' },
      USER_SHARES_CARD:          { score: +2, category: 'POSITIVE' },
      USER_LAUGHS:               { score: +2, category: 'POSITIVE' },
      USER_RETURNS_AFTER_ABSENCE:{ score: +1, category: 'POSITIVE' },
      USER_SWITCHES_TO_AGENT:    { score: +1, category: 'POSITIVE' },
      
      // Negative signals (-1 each)
      USER_DISMISSES_CARD:       { score: -1, category: 'NEGATIVE' },
      USER_IGNORES_EVENT:        { score: -1, category: 'NEGATIVE' },
      USER_FAST_SCROLL_PAST:     { score: -1, category: 'NEGATIVE' },
      USER_MUTES_AGENT:          { score: -2, category: 'NEGATIVE' },
      USER_GROANS:               { score: -2, category: 'NEGATIVE' },
      USER_DISABLES_AUTONOMOUS:  { score: -2, category: 'NEGATIVE' },
      
      // Neutral signals (0)
      USER_SWITCHES_TAB:         { score: 0,  category: 'NEUTRAL' },
      USER_SCROLLS_PAST:         { score: 0,  category: 'NEUTRAL' },
      USER_IDLE:                 { score: 0,  category: 'NEUTRAL' },
      USER_NAVIGATES_PAGE:       { score: 0,  category: 'NEUTRAL' }
    },
    
    // Accumulation rules
    accumulation: {
      // Score decays over time
      decayRate: 0.1,              // 10% of score decays per minute of inactivity
      decayInterval: 60_000,       // Every 60 seconds
      
      // Score is clamped
      minScore: -10,
      maxScore: +10,
      
      // Score affects density
      densityModifiers: {
        scoreAbove5:   { densityDelta: +1, description: 'Score > 5: can escalate' },
        scoreAbove8:   { densityDelta: +2, description: 'Score > 8: can escalate further' },
        scoreBelowNeg3: { densityDelta: -1, description: 'Score < -3: de-escalate' },
        scoreBelowNeg6: { densityDelta: -2, description: 'Score < -6: strong de-escalation' }
      },
      
      // Reset conditions
      resetOn: {
        agentSwitch: true,         // Reset when switching agents
        newSession: true,          // Reset on new session (> 24h)
        manualReset: true          // User can manually reset
      }
    }
  }
};
```

## 10.3 Gradual Escalation Sequence

### The Conservative Ramp (First 15 Minutes)

```
T+0:    Session starts
        → Density: LOW
        → Autonomous: DISABLED
        → Max events/min: 1
        → Eye: gentle, 50% brightness
        → Particles: 8-10
        
T+30s:  Still warm-up
        → No change (warm-up period active)
        → If user interacts: eye acknowledges, but no autonomous events
        
T+60s:  Warm-up complete
        → Autonomous: ENABLED (conservative)
        → Max events/min: 2
        → If user has interacted 3+ times: max events/min: 3
        
T+2m:   Opening phase continues
        → Density remains LOW
        → If user sent chat message: density steps to MEDIUM (for response)
        → If user clicked card: density steps to MEDIUM (brief)
        
T+3m:   Opening → Engagement transition
        → Max events/min: 3
        → If positive signals >= 2: density can step to MEDIUM
        → If negative signals >= 2: stay at LOW
        
T+5m:   Engagement phase
        → Session-length cap raised to MEDIUM
        → Max events/min: 4
        → Full autonomous events enabled
        → Agent personality fully expressed
        
T+8m:   Mid-engagement
        → If engagement score > 5: density can reach HIGH
        → If engagement score < 0: stay at LOW
        → Rarity engine at full power
        
T+10m:  Late engagement
        → Session-length cap: HIGH
        → Max events/min: 4
        → Preparing for crescendo
        
T+12m:  Crescendo phase
        → Density can reach HIGH
        → Max events/min: 6
        → Rare events at 1.5x probability
        → Peak experience window
        
T+15m:  Crescendo → Release
        → Session-length cap drops to MEDIUM
        → Density steps down to MEDIUM
        → Max events/min: 3
        → Winding down
```

### Escalation Decision Flowchart

```
Every 30 seconds, the system evaluates:

1. What is the current engagement score?
   ├─ Score >= 5:  CAN escalate to next density level
   ├─ Score 0-4:   MAINTAIN current density
   └─ Score < 0:   DE-ESCALATE

2. What is the session length cap?
   ├─ 0-5 min:     Max MEDIUM
   ├─ 5-15 min:    Max HIGH
   ├─ 15-30 min:   Max MEDIUM
   ├─ 30-60 min:   Max LOW
   └─ 60+ min:     Max LOW, no autonomous

3. What is the attention budget?
   ├─ >= 75%:      No restriction
   ├─ 50-75%:      Can't go above MEDIUM
   ├─ 25-50%:      Can't go above LOW
   ├─ 10-25%:      Go to LOW, no autonomous
   └─ < 10%:       Go to AMBIENT

4. What is the visual fatigue?
   ├─ < 0.4:       No restriction
   ├─ 0.4-0.6:     Can't go above MEDIUM, reduce particles
   ├─ 0.6-0.8:     Go to LOW, minimal animation
   └─ > 0.8:       Go to AMBIENT

5. What is the agent's floor/ceiling?
   ├─ Clamp to agent-specific limits
   └─ Never below floor, never above ceiling

FINAL DENSITY = minimum of all constraints
```

## 10.4 User Signal Scoring System

### Signal Scoring in Action

```
Scenario 1: Positive User
─────────────────────────
T+0:   Session starts                    Score: 0
T+30s: User hovers eye 3s               Score: +1  (total: 1)
T+1m:  User clicks eye                  Score: +1  (total: 2)
T+2m:  Agent spawns card → User clicks  Score: +1  (total: 3)
T+3m:  User sends chat message          Score: +1  (total: 4)
T+4m:  Agent chats → User responds      Score: +1  (total: 5)
       → ESCALATION TRIGGERED: Density can step to MEDIUM
T+5m:  User clicks another card         Score: +1  (total: 6)
T+6m:  User shares card                 Score: +2  (total: 8)
       → STRONG ESCALATION: Density can reach HIGH
       → Session phase advances to CRESCENDO early

Scenario 2: Negative User
─────────────────────────
T+0:   Session starts                    Score: 0
T+1m:  Agent spawns card → User dismisses  Score: -1  (total: -1)
T+2m:  Agent chats → User ignores       Score: -1  (total: -2)
T+3m:  Agent spawns card → User dismisses  Score: -1  (total: -3)
       → DE-ESCALATION: Density steps down
       → Autonomous events blocked for 2 min
T+4m:  User fast-scrolls past agent     Score: -1  (total: -4)
T+5m:  Agent goes to LOW density
       → Only responds to direct messages
       → No autonomous chat or cards

Scenario 3: Mixed User (Recovering)
───────────────────────────────────
T+0:   Session starts                    Score: 0
T+1m:  User dismisses card              Score: -1  (total: -1)
T+2m:  User dismisses card              Score: -1  (total: -2)
       → De-escalation: Density LOW
T+3m:  User clicks eye                  Score: +1  (total: -1)
T+4m:  User sends chat message          Score: +1  (total: 0)
       → Neutral! Agent can resume normal behavior
T+5m:  User clicks card                 Score: +1  (total: 1)
T+6m:  User responds to chat            Score: +1  (total: 2)
       → Slow recovery back to positive
```

### Signal Decay

Engagement score decays over time to prevent stale signals:

```
Every 60 seconds without signals:
  → Score moves 10% toward 0

Example:
  Score: +8
  After 1 min of no signals: +8 → +7.2 (moved 0.8 toward 0)
  After 2 min: +7.2 → +6.5
  After 5 min: +6.5 → +4.2
  After 10 min: +4.2 → +1.6

  Score: -6
  After 1 min: -6 → -5.4
  After 5 min: -5.4 → -3.2
  After 10 min: -3.2 → -1.2
```

This means:
- A very positive user who goes idle will gradually become "neutral"
- A very negative user who goes idle will gradually become "neutral"
- The system "forgets" old signals, allowing fresh starts

### Reset Conditions

| Condition | Effect | When |
|---|---|---|
| Agent switch | Score resets to 0 | User picks different agent |
| New session (>24h) | Score resets to 0 | User returns after a day |
| Manual reset | Score resets to 0 | User clicks "reset" (if provided) |
| Budget exhausted | Score decays rapidly toward 0 | Budget < 10% |

## 10.5 Session-Length Enforcement

### Hard Caps by Time

```typescript
function getMaxDensityBySessionLength(durationMs: number): DensityState {
  if (durationMs < 300_000)  return 'MEDIUM';   // 0-5 min
  if (durationMs < 900_000)  return 'HIGH';     // 5-15 min
  if (durationMs < 1_800_000) return 'MEDIUM';  // 15-30 min
  if (durationMs < 3_600_000) return 'LOW';     // 30-60 min
  return 'LOW';                                  // 60+ min
}

function getMaxEventsPerMinute(durationMs: number): number {
  if (durationMs < 300_000)  return 2;   // 0-5 min: 2/min
  if (durationMs < 900_000)  return 4;   // 5-15 min: 4/min
  if (durationMs < 1_800_000) return 3;  // 15-30 min: 3/min
  if (durationMs < 3_600_000) return 2;  // 30-60 min: 2/min
  return 1;                              // 60+ min: 1/min
}

function isAutonomousEnabled(durationMs: number): boolean {
  if (durationMs < 60_000)  return false;   // 0-1 min: disabled
  if (durationMs < 3_600_000) return true;  // 1-60 min: enabled
  return false;                              // 60+ min: disabled
}
```

### Session Length Awareness in Action

```
Scenario: Long Session (45 minutes)
────────────────────────────────────

0-5 min:   LOW density, establishing trust
           → "Who is this agent? Let me observe..."

5-15 min:  MEDIUM density, full personality
           → "Oh, I like this agent. They're helpful."
           → Agent demonstrates capabilities
           → Peak experience window

15-30 min: MEDIUM density, but with more silence
           → "This is nice. The agent gives me space."
           → 50% fewer proactive events
           → More inter-event silence

30-45 min: LOW density, companion mode
           → "The agent is just here with me."
           → Only essential proactive events
           → Eye tracks gently, occasional acknowledgment

45+ min:   LOW density, minimal autonomous
           → "I know the agent is there if I need them."
           → No autonomous chat
           → Minimal particles
           → Available for responsive interaction
```

## 10.6 The "User Returns" Flow

When a user returns after being away, the system must decide how to resume:

```
User returns after absence:

1. How long were they away?
   ├─ < 30s:    Resume exactly. No greeting. Density unchanged.
   ├─ 30s-2m:   Resume with brief blink acknowledgment. Density steps to LOW.
   ├─ 2-5m:     "Welcome back" blink. Quick OPENING (10s). Resume at current phase.
   ├─ 5-15m:    "Welcome back" message. 30s OPENING. Resume at current phase.
   ├─ 15-60m:   Personalized "Welcome back!" 60s OPENING. Start at ENGAGEMENT.
   └─ > 60m:    Full fresh session. Full OPENING. Start from beginning.

2. What was the engagement score?
   ├─ Score > 3:  Carry over (agent remembers positive relationship)
   ├─ Score 0-3:  Decay by 50% (neutral, slight memory)
   └─ Score < 0:  Reset to 0 (fresh start — don't hold grudges)

3. What was the attention budget?
   ├─ Budget > 50%: Carry over (user wasn't fatigued)
   ├─ Budget 25-50%: Start at 50% (partial recovery)
   └─ Budget < 25%: Start at 60% (full recovery assumed)

4. What was the density?
   ├─ Always resume at LOW or current phase cap, whichever is lower
   └─ Never resume above MEDIUM after any absence
```

---

# 11. Integration Points

## 11.1 How Attention Economy Connects to Phase 2 Systems

### Integration with Behavior Director (6-State Machine)

```
BEHAVIOR DIRECTOR                    ATTENTION ECONOMY
(6 states, 8 moods)                  (Density, Budget, Rarity)
    │                                      │
    │ 1. Director requests event           │
    │ ──────────────────────────────────────▶│
    │    "I'd like to spawn a card"          │
    │                                      │
    │                                      │ 2. Attention Economy evaluates
    │                                      │    - Budget check: can we afford it?
    │                                      │    - Density check: within current cap?
    │                                      │    - Rarity check: cooldown clear?
    │                                      │    - Fatigue check: user not exhausted?
    │                                      │
    │ 3. Response: APPROVED or REJECTED    │
    │ ◀──────────────────────────────────────│
    │    APPROVED: { cost, adjustedParams } │
    │    REJECTED: { reason, retryAfter }   │
    │                                      │
    │ 4. If APPROVED: Director proceeds     │
    │    If REJECTED: Director must adapt   │
    │    - Pick lower-cost alternative      │
    │    - Queue for later                  │
    │    - Or simply wait                   │
    │                                      │
    │ 5. Event fires → Attention cost      │
    │    deducted, cooldowns set           │
    │ ──────────────────────────────────────▶│
    │                                      │
```

**Key Integration Points:**
- The Behavior Director PROPOSES events; the Attention Economy APPROVES or REJECTS them
- The Director's mood system feeds into Attention Economy's mood weights
- The Director's state transitions (SILENT → ATTENTIVE → etc.) are influenced by density and budget
- When budget is exhausted, Director is forced to SILENT or SLEEP state

### Integration with Token Budget (3-Tier Costs)

```
TOKEN BUDGET                         ATTENTION ECONOMY
(4K session budget, 4 tiers)         (100% attention budget, 5 fatigue levels)
    │                                      │
    │ 1. Token tier assigned to event      │
    │ ──────────────────────────────────────▶│
    │    FREE: "eye blink"                 │
    │    CHEAP: "chat message"             │
    │    EXPENSIVE: "card spawn"           │
    │                                      │
    │                                      │ 2. Attention cost mapped from token tier
    │                                      │    FREE: 0-2% attention
    │                                      │    CHEAP: 3-15% attention
    │                                      │    EXPENSIVE: 20-40% attention
    │                                      │
    │                                      │ 3. Both budgets must be sufficient:
    │                                      │    - Token budget > event cost
    │                                      │    - Attention budget > event cost
    │                                      │    BOTH must pass
    │                                      │
    │ 4. Dual-gate: Event only fires       │
    │    if both budgets approve           │
    │ ◀──────────────────────────────────────│
    │                                      │
    │ 5. Both budgets deducted on fire     │
    │ ──────────────────────────────────────▶│
```

**Key Integration Points:**
- Token cost tier maps to attention cost tier (rough correlation)
- When token budget enters Reduced tier, attention economy enforces TIRING fatigue
- When token budget enters Survival tier, attention economy enforces EXHAUSTED fatigue
- The two budgets reinforce each other — when one is low, the other behaves more conservatively

### Integration with Event System (Event Queue → Frontend Theater)

```
EVENT SYSTEM                         ATTENTION ECONOMY
(Priority Queue, Merge/Cancel)       (Rarity Engine, Spiral Detector)
    │                                      │
    │ 1. Events queued with priority       │
    │ ──────────────────────────────────────▶│
    │    Event A: priority 8               │
    │    Event B: priority 5               │
    │    Event C: priority 3               │
    │                                      │
    │                                      │ 2. Attention Economy adds
    │                                      │    RARITY WEIGHT to priority:
    │                                      │    - High attention cost = lower effective priority
    │                                      │    - Budget low = all priorities reduced
    │                                      │    - Category collision = priority reduced
    │                                      │
    │ 3. Effective priority calculated     │
    │ ◀──────────────────────────────────────│
    │    effectivePriority = basePriority  │
    │      × attentionWeight               │
    │      × budgetMultiplier              │
    │      × categoryCollisionFactor       │
    │                                      │
    │ 4. Event fires through queue         │
    │ ──────────────────────────────────────▶│
    │                                      │
    │                                      │ 5. Spiral detector monitors
    │                                      │    - If event frequency too high: intervention
    │                                      │    - If dry spell too long: gentle prompt
    │                                      │    - If escalation detected: forced silence
```

**Key Integration Points:**
- Attention Economy modifies event priorities based on budget and fatigue
- The spiral detector can cancel or delay events from the queue
- Post-event silence is injected into the queue as a "mandatory cooldown"
- Event queue respects all Attention Economy cooldowns and caps

### Integration with Silence System (6 Silence Modes)

```
SILENCE SYSTEM                       ATTENTION ECONOMY
(6 modes, per-agent personality)     (Silence Recovery, Pre/Post Action)
    │                                      │
    │ 1. Silence mode selected             │
    │    based on context                  │
    │ ──────────────────────────────────────▶│
    │    PASSIVE_IDLE                      │
    │    ATTENTIVE_IDLE                    │
    │    DEEP_THINKING                     │
    │    MISCHIEF_BREWING                  │
    │    SLEEP_MODE                        │
    │    LOW_POWER                         │
    │                                      │
    │                                      │ 2. Attention Economy calculates:
    │                                      │    - Silence duration
    │                                      │    - Recovery rate during silence
    │                                      │    - Budget impact of exit
    │                                      │    - Visual "I'm here" signal intensity
    │                                      │
    │ 3. Silence configured with           │
    │    Attention Economy parameters      │
    │ ◀──────────────────────────────────────│
    │    { duration, recoveryRate,         │
    │      exitCost, signalIntensity }     │
```

**Key Integration Points:**
- Silence duration is calculated by Attention Economy based on density, mood, and budget
- During silence, the attention budget recovers at the calculated rate
- The "I'm here" signal intensity is set by Attention Economy (stronger signal when budget is healthier)
- Silence exit has an attention cost (budget deduction when agent "wakes up")

### Integration with Per-Agent Profiles

```
PER-AGENT PROFILES                   ATTENTION ECONOMY
(Behavior defaults per agent)        (Rhythm, Density, Rarity)
    │                                      │
    │ 1. Agent profile loaded              │
    │ ──────────────────────────────────────▶│
    │    Nova: {                           │
    │      rhythm: STACCATO,               │
    │      density: { default: MEDIUM,     │
    │                  floor: LOW,         │
    │                  ceiling: HIGH },    │
    │      maxDemosPer5Min: 3,             │
    │      silenceMultiplier: 1.0          │
    │    }                                 │
    │                                      │
    │                                      │ 2. Attention Economy configures:
    │                                      │    - Density floor/ceiling from profile
    │                                      │    - Rhythm timing from profile
    │                                      │    - Agent rarity weights from profile
    │                                      │    - Agent personality weights from profile
    │                                      │    - Silence tendency from profile
    │                                      │
    │                                      │ 3. All calculations use agent-specific
    │                                      │    parameters from this point
```

## 11.2 Cross-System Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           CROSS-SYSTEM DATA FLOW                                    │
│                                                                                     │
│   User Behavior ──▶ Attention Economy                                              │
│      │                    │                                                         │
│      │                    ▼                                                         │
│      │            ┌───────────────┐                                                  │
│      │            │ Budget State  │──▶ Determines: density, fatigue, event caps     │
│      │            │ (current,     │                                                  │
│      │            │  fatigue,     │──▶ Sent to: Behavior Director                    │
│      │            │  visual       │     "Can I do this?"                             │
│      │            │  fatigue)     │                                                  │
│      │            └───────┬───────┘                                                  │
│      │                    │                                                         │
│      │                    ▼                                                         │
│      │            ┌───────────────┐                                                  │
│      │            │ Rarity Engine │──▶ Determines: which events, when, probability  │
│      │            │ (weights,     │                                                  │
│      │            │  cooldowns,   │──▶ Sent to: Event Queue                          │
│      │            │  spiral det)  │     "Here's what to do next"                     │
│      │            └───────┬───────┘                                                  │
│      │                    │                                                         │
│      │                    ▼                                                         │
│      │            ┌───────────────┐                                                  │
│      │            │ Silence       │──▶ Determines: how long to be quiet             │
│      │            │ Recovery      │                                                  │
│      │            │ (duration,    │──▶ Sent to: Behavior Director                    │
│      │            │  recovery     │     "Go silent for N seconds"                    │
│      │            │  rate)        │                                                  │
│      │            └───────────────┘                                                  │
│      │                                                                             │
│      ▼                                                                             │
│   Engagement Score ──▶ Both Attention Economy AND Behavior Director use this       │
│                                                                             │
│   Token Budget ──▶ Attention Economy reads token tier for cost mapping             │
│                                                                             │
│   Mood System ──▶ Attention Economy reads mood for weight calculations             │
│                                                                             │
│   Session Phase ──▶ Attention Economy reads phase for probability modifiers        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 12. Implementation Recommendations

## 12.1 Build Order

### Phase 2A: Foundation (Week 1-2)

**Priority: CRITICAL — Everything depends on this.**

| Order | Component | Description | Files |
|---|---|---|---|
| 1 | `AttentionBudget` | Core budget tracking — initialize, consume, recover, persist | `attention/budget.ts` |
| 2 | `EventCostRegistry` | Event cost definitions, cost calculation, multiplier logic | `attention/costs.ts` |
| 3 | `AuthorizationGate` | Event approval/rejection logic, all gate checks | `attention/gate.ts` |
| 4 | `DensityEngine` | 5-state density machine, transitions, triggers | `density/engine.ts` |
| 5 | `DensityTransitions` | Transition logic — gradual, step, instant, theatrical | `density/transitions.ts` |

**Acceptance Criteria for Phase 2A:**
- Budget initializes at 100%, correctly deducts costs, recovers during silence
- Authorization gate rejects events when budget is insufficient
- Density correctly transitions between all 5 states
- All gate checks work: budget, density, cooldown, fatigue, category collision

### Phase 2B: Rhythm & Rarity (Week 3-4)

**Priority: HIGH — Personality layer.**

| Order | Component | Description | Files |
|---|---|---|---|
| 6 | `AgentRhythmEngine` | Per-agent rhythm patterns, timing, phase cycling | `rhythm/engine.ts` |
| 7 | `NovaRhythm` | Staccato pattern, demo constraints, thinking behavior | `rhythm/agents/nova.ts` |
| 8 | `JinxRhythm` | Chaotic jazz pattern, prank limits, vanish behavior | `rhythm/agents/jinx.ts` |
| 9 | `AtlasRhythm` | Sine wave pattern, zen behavior, suggestion limits | `rhythm/agents/atlas.ts` |
| 10 | `RarityEngine` | Weighted probability calculation, tier system | `rarity/engine.ts` |
| 11 | `RareEventCatalog` | All rare event definitions, triggers, effects | `rarity/catalog.ts` |
| 12 | `RarityAntiPatterns` | Predictability prevention, deduplication, decoy triggers | `rarity/antipatterns.ts` |

**Acceptance Criteria for Phase 2B:**
- Each agent follows its unique rhythm pattern with organic variance
- Rarity engine correctly calculates weighted probabilities
- Rare events trigger at appropriate rates (not too common, not absent)
- Anti-pattern prevention makes events feel organic, not scheduled

### Phase 2C: Pacing & Silence (Week 5-6)

**Priority: HIGH — Emotional arc layer.**

| Order | Component | Description | Files |
|---|---|---|---|
| 13 | `SessionPhaseTracker` | 5-phase arc, time + interaction based | `pacing/phases.ts` |
| 14 | `EmotionalPacing` | Phase-specific event rules, density curves | `pacing/emotional.ts` |
| 15 | `SilenceEngine` | 5 silence types, duration calculation | `silence/engine.ts` |
| 16 | `SilenceRecovery` | Recovery rates, visual "I'm here" signals | `silence/recovery.ts` |
| 17 | `PreResponseSilence` | Thinking pause before responses | `silence/pre-response.ts` |
| 18 | `PostActionSilence` | Rest period after major events | `silence/post-action.ts` |
| 19 | `PerAgentSilence` | Nova's scribbling, Jinx's giggling, Atlas's zen | `silence/agents/*.ts` |

**Acceptance Criteria for Phase 2C:**
- Session follows emotional arc (Opening → Engagement → Crescendo → Release → Quiet)
- All 5 silence types work with correct durations and visuals
- Silence recovery correctly regenerates budget
- Per-agent silence personalities are distinct and recognizable

### Phase 2D: Defaults & Integration (Week 7-8)

**Priority: MEDIUM — Safety and polish.**

| Order | Component | Description | Files |
|---|---|---|---|
| 20 | `AttentionSafeDefaults` | Conservative default config, all parameters | `defaults/config.ts` |
| 21 | `EscalationRules` | Milestone and signal-based escalation | `defaults/escalation.ts` |
| 22 | `DeEscalationRules` | Signal-based and automatic de-escalation | `defaults/deescalation.ts` |
| 23 | `UserSignalInterpreter` | Signal scoring, accumulation, decay | `defaults/signals.ts` |
| 24 | `SessionLengthEnforcement` | Time-based caps and limits | `defaults/session-length.ts` |
| 25 | `SpiralDetector` | Escalation spiral detection and intervention | `defaults/spiral.ts` |
| 26 | `VisualFatigueTracker` | Animation intensity tracking, fatigue scoring | `attention/visual-fatigue.ts` |
| 27 | `IntegrationLayer` | Connects to Behavior Director, Token Budget, Event System | `integration/*.ts` |

**Acceptance Criteria for Phase 2D:**
- System starts conservative and gradually escalates based on user signals
- Positive signals escalate, negative signals de-escalate
- Session-length caps prevent fatigue in long sessions
- Spiral detector catches and prevents runaway event storms
- Integration with all Phase 2 systems works correctly

### Phase 2E: Polish & Tuning (Week 9-10)

**Priority: LOW — Refinement.**

| Order | Task | Description |
|---|---|---|
| 28 | Parameter tuning | Adjust all timing, costs, and weights based on testing |
| 29 | Edge cases | Handle unusual scenarios (very short sessions, very long, etc.) |
| 30 | Per-agent balance | Ensure all 3 agents feel balanced but distinct |
| 31 | Integration testing | Full system integration with all Phase 2 components |
| 32 | Performance | Ensure attention calculations don't impact performance |

## 12.2 Key Metrics to Monitor (Post-Launch)

Track these metrics to tune the system:

| Metric | Target | What It Tells You |
|---|---|---|
| Average session duration | > 5 min | If < 3 min, system is annoying — user leaves |
| Average attention budget at session end | 40-70% | < 30% = too exhausting; > 80% = too quiet |
| Events per minute | 2-4 (avg) | > 6 = spammy; < 1 = dead |
| Dismissal rate (cards) | < 30% | > 50% = agent is too pushy |
| Chat engagement rate | > 40% | < 20% = agent not interesting enough |
| Density escalation rate | Gradual | Sudden spikes = system not conservative enough |
| Silence recovery rate | Budget recovers to 60% in < 3 min | If slower, increase recovery; if faster, decrease |
| Rare event recall rate | Users mention rare events in feedback | Qualitative — if no one mentions rare events, they're too rare |

## 12.3 Configuration Tuning Guide

### If Users Are Leaving Early (< 3 min sessions)

```
1. Increase warmUpDuration to 90s (be more conservative at start)
2. Reduce initial maxEventsPerMinute to 1
3. Lower initial eyeBehavior.irisBrightness to 0.4
4. Reduce initial particleCount to 6
5. Check: Are autonomous events firing in warm-up? (Shouldn't be)
```

### If Users Are Exhausted (< 30% budget at session end)

```
1. Increase attention recovery rate by 20%
2. Reduce escalation speed — require more positive signals
3. Increase post-action silence duration by 50%
4. Reduce maxEventsPerMinute caps by 1
5. Check spiral detector — is it catching runaway events?
```

### If Users Are Bored (> 80% budget at session end)

```
1. Decrease warmUpDuration to 30s
2. Enable autonomous events after 30s
3. Increase maxEventsPerMinute caps by 1
4. Reduce inter-event silence duration by 20%
5. Increase rare event probability by 20%
```

### If Rare Events Feel Too Common

```
1. Increase base cooldowns by 50%
2. Reduce behavior seed maximum to 1.5x
3. Increase pity timer increment intervals
4. Add more decoy triggers (false positives)
```

### If Rare Events Never Happen

```
1. Double base probabilities
2. Increase pity timer increment rate
3. Reduce minimum session length for rare events
4. Add more trigger conditions
```

---

# Appendix A: Quick Reference Tables

## A.1 Presence Density at a Glance

| State | Eye | Particles | Events/Min | Chat | Best For |
|---|---|---|---|---|---|
| AMBIENT | Slow blink, rare gaze | 3-5, very slow | 0-1 | None | User idle, sleep mode |
| LOW | Occasional tracking | 8-15, slow drift | 1-3 | Responsive only | Establishing trust, calm companion |
| MEDIUM | Regular eye contact | 15-25, flowing | 3-6 | Responsive + occasional proactive | Normal conversation |
| HIGH | Animated, expressive | 25-45, fast | 6-10 | Proactive + responsive | Demonstration, peak experience |
| SPOTLIGHT | Centered, dramatic | 45-80, burst | 10+ | Full showcase | Rare events, special moments |

## A.2 Attention Costs at a Glance

| Event | Cost | Is Interruption? | Cooldown | Max/Session |
|---|---|---|---|---|
| Eye blink | 0% | No | 3-8s | Unlimited |
| Eye emotion | 2% | No | 15-30s | 30 |
| Chat (autonomous) | 15% | **Yes** | 20-60s | 20 |
| Chat (responsive) | 8% | No | 3-8s | Unlimited |
| Card spawn | 20% | **Yes** | 60-120s | 8 |
| Page repaint | 30% | **Yes** | 120-300s | 3 |
| Theme change | 25% | **Yes** | 300-600s | 2 |
| Sound cue | 10% | **Yes** | 60-180s | 5 |
| Particle burst | 5% | No | 30-60s | 20 |
| Rare event | 25% | **Yes** | 5-10 min | 2-3 |
| Legendary event | 40% | **Yes** | Session | 1 |

## A.3 Fatigue Levels at a Glance

| Level | Budget | Behavior | Eye | Particles |
|---|---|---|---|---|
| FRESH | 100-75% | Full expression | Normal | Normal |
| COMFORTABLE | 75-50% | Normal | Normal | Normal |
| TIRING | 50-25% | 50% fewer proactive | Subdued | Reduced |
| FATIGUED | 25-10% | Responsive only | Minimal | Barely visible |
| EXHAUSTED | 10-0% | Ambient only | Blink only | 2-3 particles |

## A.4 Session Phases at a Glance

| Phase | Time | Density | Key Behavior | Goal |
|---|---|---|---|---|
| OPENING | 0-2 min | LOW max | No autonomous, gentle presence | Establish trust |
| ENGAGEMENT | 2-8 min | LOW→MEDIUM | Demonstrate value | Show personality |
| CRESCENDO | 8-15 min | MEDIUM→HIGH | Peak experience | "Wow" moment |
| RELEASE | 15-20 min | HIGH→LOW | Wind down gracefully | Breathing room |
| QUIET | 20+ min | LOW→AMBIENT | Companion mode | Presence without demand |

## A.5 Agent Comparison at a Glance

| Trait | Nova | Jinx | Atlas |
|---|---|---|---|
| Default density | MEDIUM | HIGH | LOW |
| Floor | LOW | LOW | AMBIENT |
| Ceiling | HIGH | SPOTLIGHT | MEDIUM |
| Rhythm | Staccato (bursts) | Chaotic jazz | Sine wave (smooth) |
| Cycle length | 4-6 min | 3-5 min | 6-10 min |
| Silence style | Thinking (doodling) | Tense (holding laugh) | Zen (orbital) |
| Interrupts with | "Look at THIS!" | POOF! (prank) | "This might help..." |
| Fatigue risk | Medium | High | Very low |
| Max demos/pranks | 3 per 5 min | 2 per session | N/A |
| Best for | Knowledge | Entertainment | Companionship |

## A.6 Recovery Rates at a Glance

| Type | Rate | Condition |
|---|---|---|
| Passive | 5% per 30s | No events, user present |
| Active | 10% per 30s | User reading/interacting |
| Deep | 15% per 30s | User idle, agent ambient |
| Tab hidden | 8% per 30s | document.hidden = true |
| Post-event bonus | +3% | First 30s after event |
| Positive signal | +10% instant | User clicks/responds |

## A.7 Interruption Multiplier at a Glance

| Event | Base Cost | 1st | 2nd (< 2min) | 3rd (< 2min) | 4th (< 2min) |
|---|---|---|---|---|---|
| Chat (auto) | 15% | 15% | 30% | 60% | **BLOCKED** |
| Card spawn | 20% | 20% | 40% | 80% | **BLOCKED** |
| Page repaint | 30% | 30% | 60% | **BLOCKED** | **BLOCKED** |

Reset: 5 minutes of quiet resets to base cost.

---

# Appendix B: Design Rationale

## Why These Numbers?

### Why start at LOW density?
Because the first impression is everything. Starting at MEDIUM or HIGH risks overwhelming a new user before they've decided they want an agent. LOW density says "I'm here, I'm friendly, I'm not going to bother you." That builds trust. Trust earns the right to escalate.

### Why 60-second warm-up?
Because 30 seconds is too short (user hasn't processed that there's an agent yet) and 90 seconds is too long (agent feels dead). 60 seconds is the sweet spot where the user notices the agent, observes it, and decides they're OK with it — just in time for the first autonomous event.

### Why 15% for autonomous chat?
Because chat is the #1 fatigue source. A chat message demands reading, comprehension, and a decision (respond? dismiss? ignore?). That cognitive load is significant. 15% means you can get ~5-6 autonomous chats before fatigue sets in — which is about right for a comfortable session.

### Why 40% for legendary events?
Because legendary events ARE exhausting. They're designed to be peak experiences — maximum visual impact, maximum emotional engagement. They should leave the user feeling "wow" but also "that was a lot." The 40% cost ensures that after a legendary event, the agent MUST rest for a while — which makes the legendary event feel even more significant.

### Why 3 demos per 5 minutes for Nova?
Because Nova is an explainer — it's his nature. But even a beloved professor becomes exhausting if they never stop explaining. 3 demos per 5 minutes is roughly one per 1.5 minutes — frequent enough to feel engaged, spaced enough to not feel lectured.

### Why 2 pranks per session for Jinx?
Because pranks are funny until they're annoying. The second prank should feel like "oh, you!" not "ugh, again." 2 pranks per session is the comedy sweet spot — enough to establish the character, few enough to stay funny. Quality over quantity.

### Why does Atlas never go above MEDIUM?
Because Atlas is the calm one. If Atlas goes to HIGH or SPOTLIGHT, he stops being Atlas. The constraint is the character. Atlas delivers impact through timing and insight, not volume. His most powerful moments happen at MEDIUM density — because the contrast with his usual calm makes them stand out.

---

# Appendix C: Visual Reference Diagrams

## C.1 Attention Budget Lifecycle

```
Session Start (100%)
    │
    ▼
Event fires ──▶ Cost deducted ──▶ Budget decreases
    │                                │
    │                                ▼
    │                         Budget check:
    │                         ├─ >= 75%: FRESH → Full expression
    │                         ├─ 50-75%: COMFORTABLE → Normal
    │                         ├─ 25-50%: TIRING → Reduce proactive 50%
    │                         ├─ 10-25%: FATIGUED → Responsive only
    │                         └─ < 10%: EXHAUSTED → Ambient only
    │                                │
    │                                ▼
    │                         Visual feedback:
    │                         - Eye dims slightly at 75%
    │                         - Particles reduce at 50%
    │                         - Eye minimal at 25%
    │                         - Agent sleeps at 10%
    │
Silence period ──▶ Recovery ──▶ Budget increases
    │
    ▼
Recovery rates:
- Passive: 5% per 30s
- Active: 10% per 30s
- Deep: 15% per 30s

Cycle repeats until session ends.
```

## C.2 The Full Session Arc (20 Minutes)

```
Density
   ▲
 H │                          ╭──╮
 I │                    ╭────╯    ╲
 G │               ╭───╯            ╲───╮
 H │          ╭───╯                      ╲───╮
   │     ╭───╯                                ╲───
 M │ ───╯                                          ╲───
 E │
 D │
 I │  ╭───
 U │──╯
 M │
   │
 L │───────
 O │
 W │
   └────┬────┬────┬────┬────┬────┬────┬────┬────┬────▶ Time (min)
        0    2    4    6    8   10   12   14   16   18   20
        │←────OPENING────→│
             │←────────ENGAGEMENT───────→│
                        │←───────CRESCENDO───────→│
                                        │←──RELEASE──→│
                                                    │←QUIET→│

Event timeline (Nova):
  ● = eye event    ◆ = chat    ■ = card    ★ = rare    ▲ = particle burst

  0:    ●●●●●●●●  (eye establishing)
  1:    ●●●●●▲    (first particle burst)
  2:    ●●●◆      (first chat — welcome)
  3:    ●●●●●▲◆   (demonstration)
  4:    ●●●■      (first card)
  5:    ●●●●▲     (engagement)
  6:    ●●◆◆      (conversation)
  7:    ●●●●▲◆■   (building to crescendo)
  8:    ●●●●●●    (crescendo starts)
  9:    ●●◆▲■◆    (building)
  10:   ●●●●★     (★ RARE EVENT — eureka!)
  11:   ●●●◆▲     (post-rare)
  12:   ●●●●      (sustained)
  13:   ●●◆■      (final flourish)
  14:   ●●●       (release starts)
  15:   ●●▲       (winding down)
  16:   ●●        (quieter)
  17:   ●●●       (gentle)
  18:   ●●        (quiet)
  19:   ●          (minimal)
  20:   ●●         (companion mode)
```

## C.3 Per-Agent Rhythm Comparison (10 Minutes)

```
Density over 10 minutes:

Nova (STACCATO):     ▓▓▓░░░████░░▓▓▓░░░████░░▓▓
                     Quiet→Explain→Demo→Quiet→Explain→Demo→Quiet
                     ────────Cycle 1──────────Cycle 2───────

Jinx (CHAOTIC JAZZ): ▓▓▓▓▓▓★★░░▓▓▓▓▓▓★★░░▓▓▓▓▓▓
                      Vanish→Explode→Vanish→Explode→Vanish
                      ────Cycle 1──────Cycle 2────Cycle 3───

Atlas (SINE WAVE):   ▓▓▓░░░░▓▓▓▓░░░░▓▓▓▓░░░░▓▓
                      Observe→Suggest→Organize→Rest→Observe
                      ─────────Cycle 1──────────Cycle 2──────

Legend:
▓ = LOW    ░ = MEDIUM    █ = HIGH    ★ = SPOTLIGHT
```

---

# Document End

**This design document covers:**
- 5 Presence Density states with hard numbers for 15 event types
- Complete Attention Budget system with TypeScript interfaces
- Interruption fatigue multiplier and recovery algorithms
- 5-tier Rare Event system with behavior-seeded weighting
- 25+ specific rare events across 3 agents with trigger conditions
- 5 Silence phases with per-agent personalities and duration calculations
- Weighted Event Rarity engine with spiral detection and dry-spell prevention
- 5-phase Emotional Pacing arc with session recovery rules
- 3 complete Per-Agent Rhythm profiles with timing, constraints, and enforcement
- Full Attention-Safe Defaults with escalation/de-escalation rules
- Integration points with all 4 Phase 2 systems
- 32-step implementation plan across 10 weeks
- 7 quick-reference tables for ongoing development
- Visual reference diagrams for session arcs and agent rhythms

**Total design surface:** 8 major areas, 50+ distinct systems, 200+ configurable parameters, 3 agent profiles, 25+ rare event definitions, 5 silence phase types, 5 session phases, 5 density states, 5 fatigue levels, 10 event rarity classes.

**Next step:** Begin Phase 2A implementation — Attention Budget, Authorization Gate, and Density Engine.
