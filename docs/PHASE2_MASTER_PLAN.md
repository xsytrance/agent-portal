# Agent Portal — Phase 2 Master Plan
## Behavior Director / Presence Layer Architecture

**Version**: 1.1
**Date**: 2026-05-13
**Status**: APPROVED FOR ITERATIVE PLANNING — implementation should proceed in reviewable slices
**Total**: 14,000+ lines across 7 sub-documents

---

## 1. Executive Summary

Phase 2 transforms Agent Portal from a "pretty chat interface" into a **living presence system**. The core innovation is the **Behavior Director** — a decision engine that controls when the agent speaks, stays silent, reacts, creates, or surprises the user.

The architecture separates **Thought** from **Speech** from **Action** from **Display**. The Behavior Director receives signals (user actions, backend events, external inputs), analyzes context and mood, makes decisions about what to do, produces a **BehaviorPlan**, and emits **PortalEvents** that the frontend "theater" interprets into living, breathing visual behavior.

**Key design principle**: Presence is not constant talking. Presence is behavior. The agent should feel alive even when silent — through subtle eye movements, particle shifts, and mood-driven ambient effects. Silence is a first-class feature.

**Token protection is mandatory**: Every action has a cost tier (free/cheap/expensive). The system always chooses the cheapest acceptable action. Free visual events keep the page alive without burning tokens.

**Recommended scope**: Option B (Moderate Presence Layer) — backend Behavior Director with SSE event planner, token budgets, per-agent behavior profiles, and admin controls.

**2026-05-13 update**: xsy has approved modifying this roadmap. The plan below now prioritizes a conservative vertical-slice rollout: preserve the working portal, introduce typed contracts first, prove budgets before autonomy, and keep each slice independently shippable.

---

## 2. Recommended Phase 2 Scope

### Option B: Moderate Presence Layer

| Layer | What | Status |
|-------|------|--------|
| **Current Portal Stabilization** | Align duplicated agent data, verify current chat/events/admin paths, document known gaps | BUILD FIRST |
| **Behavior Contracts** | BehaviorPlan, InputSignal, behavior event types, and validation with no runtime autonomy yet | BUILD FIRST |
| **Behavior Director** | Server-side decision engine with mood system, cooldowns, priority matrix | BUILD |
| **Event Planner** | Priority queue for BehaviorPlans with merge/cancel/expire | BUILD |
| **Token Budget** | Per-session budgets with graceful degradation | BUILD BEFORE COSTLY AUTONOMY |
| **Input Signals** | Frontend signal capture (mouse, scroll, idle, hover, chat) | BUILD |
| **Per-Agent Profiles** | Behavior tuning for Nova/Jinx/Atlas | BUILD |
| **Attention Density** | Fatigue-aware pacing, rarity, and silence recovery from `attention-economy.md` | BUILD |
| **Silence System** | 6 silence modes with per-agent visual expression | BUILD |
| **SSE Enhancement** | BehaviorPlans → Events → SSE → Frontend Theater | BUILD |
| **Admin Presence Controls** | Talkativeness, chaos, budget, event type filters | BUILD |
| **Safety Guardrails** | Hard stops, mock indicators, audit trail | BUILD |
| **Webhook Foundation** | `/api/webhook/generic` endpoint + normalizer pattern | BUILD AFTER CORE LOOP |

### NOT in Phase 2

| Feature | Reason | When |
|---------|--------|------|
| External agent integration (OpenClaw, Hermes) | xsy/Juan backends not ready | Phase 3 |
| Persistent memory (Redis, DB) | In-memory sufficient for Phase 2 | Phase 3 |
| Sound system | Requires audio design, lower priority | Phase 2.5 |
| Streaming LLM responses | Complexity, limited visual benefit | Phase 3 |
| Multi-modal (images, audio) | Not needed for core presence | Phase 3 |
| NextAuth/Clerk auth | Basic auth sufficient for now | Phase 3 |

### Current Repo Baseline

The repository already contains a useful Phase 1.6-style foundation:

- Next.js app shell with the user-facing portal, floating eye, particles, chat panel, and admin page.
- Three starter agents (Nova, Jinx, Atlas) with personality copy and theme colors.
- Mock/OpenRouter chat route with fallback to mock responses.
- In-memory `PortalEvent` store, event validation, event CRUD, and SSE mock-event stream.
- Client-side autonomous loop that emits idle speech bubbles while respecting reduced motion.
- Admin panels for API keys, agent config, autonomous loop settings, feature flags, prompts, and logs.

Before adding Phase 2 behavior infrastructure, stabilize these seams:

1. **Unify agent definitions.** Agent data currently exists in both context and library locations; Phase 2 profiles should extend one canonical registry.
2. **Keep autonomy server-authoritative.** The existing client idle loop is a demo behavior. Phase 2 should route signals to the server and let the Behavior Director decide.
3. **Preserve mock-first operation.** OpenRouter chat exists today, but autonomous expensive calls must remain gated until token budgets and audit logs are active.
4. **Convert docs into contracts gradually.** Start with shared TypeScript types and validators, then wire runtime behavior after tests prove the contracts.

---

## 3. Architecture Overview

### High-Level Flow

```
User / System / External Input
         ↓
    Input Signal (typed)
         ↓
    Intent + Context Analysis
         ↓
┌──────────────────┐
│  Behavior        │ ← Mood State, Cooldowns, Budget, Session Context
│  Director        │ ← Per-Agent Profile (Nova/Jinx/Atlas)
│  (decides what   │ ← Priority Matrix
│   to do)         │ ← Silence Logic
└────────┬─────────┘
         ↓
    BehaviorPlan
         ↓
    Token Budget Check
         ↓
    Event Queue (priority)
         ↓
    Portal Events (typed)
         ↓
    SSE Stream
         ↓
    Frontend Theater
         ↓
    User Experience
```

### Key Architectural Principles

1. **Separation of concerns**: THOUGHT (decision) → SPEECH (LLM) → ACTION (events) → DISPLAY (frontend)
2. **Provider is optional**: The LLM is one input source, not the controller. The Behavior Director decides whether to call the LLM at all.
3. **Cost-first**: Free visual events are always available. LLM calls require budget approval.
4. **Agent personality drives behavior**: Same input → different decisions per agent.
5. **Silence is designed**: Intentional silence modes with visible ambient behavior.

### State Machine

```
                    ┌──────────┐
          signal →  │  SILENT  │ ←──────┐
                    └────┬─────┘        │
                         │ attention     │ quiet period
                         ▼               │
                    ┌──────────┐         │
                    │ ATTENTIVE│ ────────┘
                    └────┬─────┘
                         │ user message / high priority
                         ▼
                    ┌──────────┐
         LLM call → │RESPONDING│
                    └────┬─────┘
                         │ response ready
                         ▼
                    ┌──────────┐
                    │ CREATING │ ←── spawn card / report / demo
                    └────┬─────┘
                         │ spectacle trigger
                         ▼
                    ┌──────────┐
         timeout →  │SPECTACLE │ → page repaint / theme change
                    └────┬─────┘
                         │ cooldown / quiet period
                         ▼
                    ┌──────────┐
                    │  SLEEP   │ → minimal ambient
                    └──────────┘
```

### Decision Priority Formula

```
Priority = Base × Mood_Multiplier × Personality_Weight × Cooldown_Penalty × Budget_Penalty
```

| Factor | Range | Source |
|--------|-------|--------|
| Base | 1-100 | Signal type (user message = 100, ambient tick = 5) |
| Mood Multiplier | 0.5-2.0x | Current mood boosts/penalizes certain actions |
| Personality Weight | 0.5-2.0x | Per-agent preference for action types |
| Cooldown Penalty | 0.0-1.0x | Recently done = lower priority |
| Budget Penalty | 0.0-1.0x | Low budget = suppress expensive actions |

---

## 4. Sub-Document Index

| Document | Lines | Scope | Key Sections |
|----------|-------|-------|--------------|
| [behavior-director.md](phase2/behavior-director.md) | 2,377 | Decision engine, mood, cooldowns, state machine | 6-state machine, 8 moods, 7 silence modes, priority formula, 17 TypeScript interfaces |
| [event-systems.md](phase2/event-systems.md) | 2,044 | Event contracts, BehaviorPlan model, queues | BehaviorPlan interface, 10 new event types, input signals, priority queue design |
| [ux-presence.md](phase2/ux-presence.md) | 802 | Presence UX, silence, per-agent profiles | 5 presence laws, 6 silence modes x 3 agents, conversation flow, anti-patterns |
| [attention-economy.md](phase2/attention-economy.md) | 4,000+ | Attention budget, presence density, fatigue, rarity | Presence density engine, attention costs, silence recovery, rarity tuning |
| [token-budget.md](phase2/token-budget.md) | 1,699 | Cost control, budgets, degradation | 3-tier costs, session budgets, emergency cutoffs, 4-tier degradation cascade |
| [integration.md](phase2/integration.md) | 1,922 | External system plugins, webhooks | Extended provider interface, 4 external source types, normalizer pattern, circuit breaker |
| [admin-safety.md](phase2/admin-safety.md) | 1,554 | Admin controls, safety, trust | 40+ admin controls, 15 safety rules, 7 hard stops, mock indicator design |

**Total: 14,000+ lines of architecture documentation**

---

## 5. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Decision cycle** | 500ms server tick + 50ms urgent override | Responsive but not wasteful |
| **Mood system** | Continuous (0.0-1.0) per dimension, not discrete | Smooth transitions, gradual shifts |
| **Mood decay** | Time-based with personality anchor | Returns to agent's natural state |
| **Cooldown layers** | 3 layers: per-event → global rate → session pacing | Defense in depth |
| **Token tiers** | Free / Cheap / Expensive | Always choose cheapest acceptable |
| **Budget status** | Healthy → Warning (60%) → Critical (85%) → Exhausted (100%) | Hysteresis prevents flapping |
| **Degradation** | 4-tier cascade: Full → Reduced → Minimal → Survival | Graceful, user doesn't feel it |
| **Silence modes** | 6 modes with per-agent visual expression | Silence is visible, not empty |
| **Surprise system** | Seeded by user behavior, not pure random | Feels personal, not arbitrary |
| **Queue management** | Priority heap with merge/cancel/expire | Efficient, prevents buildup |
| **Event store** | Keep in-memory (500 cap), design for Redis swap later | Fast, sufficient for Phase 2 |
| **Auth** | Keep Basic auth, design for NextAuth later | No dependency block |
| **Provider extensibility** | Capability discovery pattern | New providers auto-negotiate features |

---

## 6. Starter Agent Behavior Profiles

### Professor Nova
```
Default mood:     Curious (0.7)
Talkativeness:    Medium (60%)
Chaos level:      Low-Medium (25%)
Visual energy:    Medium-High
Token budget:     2,500/session, 12 expensive actions
Interruption:     1 per 5 min max
Silence:          Scribbles equations, adjusts goggles, tiny sparks
Speaking style:   "Let me show you", "Fascinating!", "Beep boop"
Preferred:        Demonstrate, explain, generate charts
Cooldown:         Card spawn 45s, Repaint 120s, Chat 30s
Surprises:        1/session max
```

### Jinx
```
Default mood:     Mischievous (0.8)
Talkativeness:    High (85%)
Chaos level:      Very High (75%)
Visual energy:    Very High
Token budget:     1,500/session, 8 expensive actions
Interruption:     1 per 3 min max
Silence:          Hides behind UI, peeks, colorful smoke puffs, giggles
Speaking style:   "POOF!", breaks fourth wall, surprises
Preferred:        Repaint page, spawn weird cards, rearrange UI
Cooldown:         Card spawn 30s, Repaint 60s, Chat 20s
Surprises:        2-3/session max
```

### Atlas
```
Default mood:     Calm (0.8)
Talkativeness:    Low (35%)
Chaos level:      Very Low (5%)
Visual energy:    Low, elegant
Token budget:     2,000/session, 10 expensive actions
Interruption:     1 per 10 min max
Silence:          Calm pulse, slow orbiting particles, ambient glow
Speaking style:   Concise, helpful, reassuring
Preferred:        Summarize, organize, guide calmly
Cooldown:         Card spawn 90s, Repaint 180s, Chat 45s
Surprises:        0-1/session max
```

---

## 7. Token Budget Strategy

### Default Budgets (Production)

| Metric | Value |
|--------|-------|
| Session budget | 4,000 tokens |
| Per-minute limit | 1,500 tokens |
| Per-5-minute limit | 3,000 tokens |
| Max API calls/min | 5 |
| Max API calls/session | 50 |
| Max cost/session | $2 USD |
| Warning threshold | 60% |
| Critical threshold | 85% |

### Cost Tier Classification

| Tier | Cost | Examples |
|------|------|----------|
| **Free** | 0 tokens | Eye blink, emotion, particles, hover, card shuffle, silence |
| **Cheap** | 0 tokens (cache) | Template messages, cached quips, status updates, summaries from context |
| **Expensive** | Variable | OpenRouter chat, research, report generation, external agent calls |

### Degradation Cascade

```
Full Mode     → All features available
              → 100% budget
              ↓
Reduced Mode  → Templates preferred over LLM, fewer proactive events
              → 60% budget (warning threshold)
              ↓
Minimal Mode  → Only cached/template responses, visual events only
              → 85% budget (critical threshold)
              ↓
Survival Mode → Only free visual events, mock responses
              → 100% budget (exhausted)
              ↓
Auto-recover  → Budget resets on new session
```

---

## 8. Integration Points for Future Systems

| Future System | Integration Point | How |
|---------------|-------------------|-----|
| **OpenClaw** | `/api/webhook/openclaw` | Shared secret auth, normalizes to PortalEvents |
| **Hermes** | `/api/webhook/hermes` | HMAC-SHA256 auth, task completion events |
| **Scrapers** | `/api/webhook/scraper` | API key auth, deal/news feed items |
| **Custom webhook** | `/api/webhook/generic` | Schema-driven validation, configurable |
| **New LLM provider** | `ProviderAdapter` interface | Implement interface, register |
| **Redis event store** | `EventStore` interface | Swap in-memory for Redis |
| **NextAuth** | `middleware.ts` | Replace Basic auth |

### Backend Handoff Contract

Agent Portal provides:
- `/api/webhook/*` endpoints for external systems
- SSE stream for real-time event delivery
- REST API for config, logs, admin
- User context (active agent, session state)

Backend provides:
- Agent responses (as PortalEvents via webhooks)
- Scraped data (normalized to PortalEvents)
- Orchestrated actions (via webhook or SSE)

---

## 9. Admin Controls Plan

### New Admin Panels for Phase 2

| Panel | Controls |
|-------|----------|
| **Presence** | Master on/off, runtime mode, global action rate limit, silence mode toggle |
| **Per-Agent** | Talkativeness, chaos, interruption sliders; allowed/blocked event types; token budget |
| **Token Budget** | Session budget, per-minute limit, warning/critical thresholds, auto-degradation toggle |
| **Safety** | All hard stop settings, mock indicator toggle, session timeout, max duration |
| **Alerts** | Alert thresholds, delivery webhooks, deduplication windows |
| **Sessions** | Active sessions, force-end, cost summaries, export |
| **Audit** | LLM call log, autonomous event log, config change log, safety event log |

---

## 10. Safety / Trust Rules

### Core Principles
1. **No false claims** — agent never claims capabilities it doesn't have
2. **Mock indicator** — always show when using mock/template responses
3. **No hidden API calls** — every LLM call logged and auditable
4. **Budget exhaustion = mock mode** — automatic, no exceptions
5. **User can pause** — mute button always available
6. **No infinite loops** — hard stop on autonomous event count
7. **24h data expiry** — session data auto-deleted
8. **Admin override** — operator can always disable autonomy

### Hard Stop Rules
1. Budget exhausted → stop expensive operations
2. Rate limit hit → return 429, log incident
3. Provider errors (5x in a row) → switch to mock for 5 min
4. Event queue full → drop lowest priority
5. Session timeout (30 min idle) → auto-reset
6. Max concurrent sessions → reject new ones
7. Payload oversize → reject with 413

---

## 11. Implementation Slices

Build Phase 2 as vertical slices that can each be reviewed, tested, and shipped independently. Avoid landing a large framework before at least one real portal behavior uses it.

### Slice 0: Stabilize Current Portal Baseline
- [ ] Run current lint/build and record existing failures before Phase 2 work.
- [ ] Consolidate agent data into one registry consumed by context, admin defaults, chat, and behavior profiles.
- [ ] Add a short `docs/current-architecture.md` or README section that lists current routes, providers, and event flows.
- [ ] Add smoke tests or minimal route tests for `/api/health`, `/api/agent/chat`, and `/api/agent/events`.

**Acceptance criteria:** existing portal behavior still works, agent definitions have one source of truth, and the current demo autonomous loop remains unchanged from a user's perspective.

### Slice 1: Contracts-Only Behavior Foundation
- [ ] Add `lib/behavior/behaviorTypes.ts` for BehaviorState, MoodVector, BehaviorPlan, PlannedEvent, and DirectorDecision.
- [ ] Add `lib/signals/signalTypes.ts` for user, system, admin, and external signals.
- [ ] Extend event validation to recognize behavior events without changing runtime emission.
- [ ] Add unit tests for type guards/validators and invalid payload rejection.

**Acceptance criteria:** no new autonomous behavior yet; contracts compile, validators reject malformed input, and existing event APIs remain backward-compatible.

### Slice 2: Server-Side Decision Core in Mock Mode
- [ ] Implement a pure Behavior Director function: `decide(signal, session, profile, budget) -> BehaviorPlan`.
- [ ] Implement mood anchors, cooldown checks, silence modes, and attention-density gating with deterministic seeded tests.
- [ ] Keep all expensive actions disabled; generated plans should use free visual/template events only.
- [ ] Add debug/audit events for why the director chose silence, visual action, template speech, or no-op.

**Acceptance criteria:** tests prove each agent makes different choices for the same signal, cooldowns suppress repeats, and silence is an explicit decision rather than absence of code.

### Slice 3: Budget and Safety Gate
- [ ] Add session token budget tracking, cost tier classification, and degradation states.
- [ ] Wrap `/api/agent/chat` with budget checks and audit logging before OpenRouter calls.
- [ ] Add emergency cutoff and provider-error fallback behavior.
- [ ] Expose read-only budget status through an admin API before adding write controls.

**Acceptance criteria:** OpenRouter calls are blocked when budget is exhausted, mock/template responses continue to work, and every expensive call has an audit record.

### Slice 4: Signal Ingestion and Event Queue
- [ ] Add `/api/agent/signals` for frontend signal ingestion.
- [ ] Implement priority queue with merge/cancel/expire semantics.
- [ ] Replace direct client autonomous decisions with signal submission while preserving reduced-motion behavior.
- [ ] Wire BehaviorPlans into the existing event store/SSE path.

**Acceptance criteria:** idle/hover/activity signals produce server-approved plans, duplicate noisy signals are throttled, and SSE clients receive ordered behavior events.

### Slice 5: Frontend Theater and Presence UX
- [ ] Map PlannedEvent display metadata to existing eye, particle, chat, card, and theme components.
- [ ] Add silence-mode visuals for Nova/Jinx/Atlas.
- [ ] Add fatigue-aware animation intensity and respect reduced motion at the rendering layer.
- [ ] Add manual walkthrough coverage for quiet, attentive, responding, creating, and sleep states.

**Acceptance criteria:** the agent feels alive without constant speech, all visual behavior can be traced to an event, and reduced-motion users do not receive high-intensity effects.

### Slice 6: Admin Controls and Operational Visibility
- [ ] Add presence, budget, safety, sessions, and audit panels incrementally.
- [ ] Make high-risk controls server-backed rather than only localStorage-backed.
- [ ] Add mock-mode and degraded-mode indicators to user/admin surfaces.
- [ ] Provide exportable logs for LLM calls, autonomous events, config changes, and safety cutoffs.

**Acceptance criteria:** an operator can pause autonomy, inspect why an event fired, see budget state, and confirm whether the portal is in mock/degraded/production mode.

### Slice 7: Integration Foundation
- [ ] Add `/api/webhook/generic` with authentication, payload limits, and normalizer selection.
- [ ] Keep OpenClaw/Hermes source-specific routes as adapters over the generic foundation when those systems are ready.
- [ ] Add provider capability discovery and a priority-based provider registry.
- [ ] Add end-to-end tests covering webhook -> normalized event -> BehaviorPlan -> SSE.

**Acceptance criteria:** external systems can submit safe normalized events without coupling the portal to a specific backend agent implementation.

---

## 12. Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Over-engineering** | High | Start with Option B, resist Option C temptations |
| **Too many moving parts** | Medium | Slice-by-slice implementation, test each slice before adding the next |
| **Token cost surprises** | High | Hard budgets, automatic cutoffs, start in mock mode |
| **Frontend performance** | Medium | Batch free events, throttle signals, use RAF |
| **User finds agent annoying** | High | Anti-pattern enforcement, mute button, respect checks |
| **Complex state management** | Medium | Server-side state, client only renders |
| **SSE scalability** | Low | One stream per client, max 20 events per stream |
| **Integration complexity** | Medium | Clean contracts, normalizer pattern, no tight coupling |
| **Plan/code drift** | Medium | Keep the master plan linked to real file paths, update acceptance criteria as slices land |
| **Duplicated agent config** | Medium | Consolidate starter agents before adding behavior profiles |

---

## 13. File/Folder Plan

```
app/
├── lib/
│   ├── behavior/
│   │   ├── director.ts          # Behavior Director core
│   │   ├── stateMachine.ts      # State machine (6 states)
│   │   ├── moodEngine.ts        # Mood system (8 moods, decay)
│   │   ├── cooldownManager.ts   # 3-layer cooldown system
│   │   ├── priorityMatrix.ts    # Priority calculation
│   │   ├── silenceEngine.ts     # 6 silence modes
│   │   ├── decisionFlow.ts      # Decision pipeline
│   │   └── profiles.ts          # Per-agent defaults (Nova/Jinx/Atlas)
│   ├── events/
│   │   ├── eventStore.ts        # (existing) + budget-aware pruning
│   │   ├── eventValidator.ts    # (existing) + behavior events
│   │   ├── eventQueue.ts        # Priority queue for BehaviorPlans
│   │   ├── eventEmitter.ts      # Plan → PortalEvents → SSE
│   │   └── mockEvents.ts        # (existing)
│   ├── budget/
│   │   ├── budgetManager.ts     # Session budget tracking
│   │   ├── costTiers.ts         # Free/Cheap/Expensive classification
│   │   ├── degradation.ts       # 4-tier degradation cascade
│   │   └── costTracker.ts       # Per-action cost logging
│   ├── signals/
│   │   ├── signalRouter.ts      # Route signals to Director
│   │   ├── signalTypes.ts       # InputSignal type definitions
│   │   └── signalValidator.ts   # Validate incoming signals
│   ├── providers/
│   │   ├── providerAdapter.ts   # (existing) + capability discovery
│   │   ├── mockProvider.ts      # (existing)
│   │   ├── openRouterProvider.ts # (existing)
│   │   └── providerRegistry.ts  # Priority-based fallback
│   ├── webhook/
│   │   ├── normalizer.ts        # External → PortalEvent
│   │   ├── sourceRouter.ts      # Route to correct normalizer
│   │   └── authenticator.ts     # Auth per source
│   ├── agents/
│   │   ├── agentTypes.ts        # (existing)
│   │   ├── starterAgents.ts     # (existing) + behavior config
│   │   └── agentRegistry.ts     # Capability-based discovery
│   ├── logger.ts                # (existing)
│   └── config/
│       └── serverConfig.ts      # (existing) + budget config
├── api/
│   ├── agent/
│   │   ├── chat/route.ts        # (existing) + budget check
│   │   ├── config/route.ts      # (existing)
│   │   ├── events/route.ts      # (existing)
│   │   ├── stream/route.ts      # (existing) + behavior events
│   │   └── signals/route.ts     # NEW: frontend signal ingestion
│   ├── admin/
│   │   ├── keys/route.ts        # (existing)
│   │   ├── config/route.ts      # (existing) + presence config
│   │   ├── prompts/route.ts     # (existing)
│   │   ├── features/route.ts    # (existing)
│   │   ├── logs/route.ts        # (existing)
│   │   ├── budget/route.ts      # NEW: budget status + config
│   │   ├── sessions/route.ts    # NEW: session management
│   │   └── alerts/route.ts      # NEW: alert configuration
│   └── webhook/
│       └── [source]/route.ts    # NEW: generic webhook endpoint
├── middleware.ts                # (existing)
└── ... (frontend components)
```

**~25 new files, ~15 modified files**

---

## 14. API Route Plan

### Existing (Phase 1.6, keep as-is)
- `/api/health` — Health check
- `/api/agent/chat` — Chat (add budget check)
- `/api/agent/config` — Agent definitions
- `/api/agent/events` — Event CRUD
- `/api/agent/stream` — SSE (add behavior events)
- `/api/admin/keys` — API key management
- `/api/admin/config` — Config (add presence config)
- `/api/admin/prompts` — Prompt management
- `/api/admin/features` — Feature flags
- `/api/admin/logs` — System logs

### New (Phase 2)
- `/api/agent/signals` — Frontend signal ingestion (POST)
- `/api/admin/budget` — Budget status + config (GET/POST)
- `/api/admin/sessions` — Session management (GET/DELETE)
- `/api/admin/alerts` — Alert config (GET/POST)
- `/api/webhook/generic` — Generic webhook (POST)
- `/api/webhook/openclaw` — OpenClaw webhook (POST) [future]
- `/api/webhook/hermes` — Hermes webhook (POST) [future]

---

## 15. What to Build First

1. **Stabilize the current portal baseline** — Verify build/lint, consolidate duplicated agent data, and document current routes.
2. **BehaviorPlan + InputSignal contracts** — Establish typed boundaries before runtime complexity.
3. **Behavior Director pure decision core** — Make decisions testable without UI or network calls.
4. **Token Budget + Safety Gate** — Cost protection must precede any autonomous OpenRouter use.
5. **Event Queue + SSE wiring** — Connect plans to the existing event stream after contracts and safety are proven.
6. **Per-agent profiles + silence system** — Make Nova/Jinx/Atlas feel distinct through behavior, not just copy.
7. **Frontend theater** — Render planned events consistently across eye, particles, cards, and chat.
8. **Admin controls + audit trail** — Give operators visibility and emergency controls before integrations.

---

## 16. What NOT to Build Yet

1. **External agent integration** — OpenClaw, Hermes not ready from xsy/Juan
2. **Persistent memory** — Redis/DB for Phase 3
3. **Sound system** — Lower priority, needs audio design
4. **Streaming LLM** — Complexity exceeds benefit for Phase 2
5. **Multi-modal** — Images/audio not needed for core presence
6. **Advanced auth** — Basic auth sufficient
7. **Unbudgeted OpenRouter autonomy** — Chat can use OpenRouter today, but autonomous expensive calls wait for budgets/audit

---

## 17. Final Recommendation

**Proceed with Phase 2 Option B (Moderate Presence Layer), delivered through the implementation slices above.**

The architecture is thorough and practical, but it should be landed in smaller increments than the original plan implied. Start by stabilizing today's portal and converting the design docs into executable contracts. Then add the Behavior Director as a pure, testable decision engine before routing live frontend signals through it.

**Estimated new code**: ~4,000-6,000 lines if the full Phase 2 surface is built
**Risk level**: Medium (complex state machine, but well-documented)
**Recommended first PR**: Slice 0 + Slice 1 only — current baseline stabilization and contracts without runtime autonomy

**Implementation rule**: no expensive autonomous behavior ships until budgets, audit logging, mock/degraded indicators, and emergency cutoff are active.

---

## Document Index

| Document | Path | Lines | Key Content |
|----------|------|-------|-------------|
| **This document** | `PHASE2_MASTER_PLAN.md` | ~500 | Executive summary, scope, recommendations |
| Behavior Director | `phase2/behavior-director.md` | 2,377 | Decision engine, state machine, mood, cooldowns, silence |
| Event Systems | `phase2/event-systems.md` | 2,044 | BehaviorPlan model, event queue, input signals, new event types |
| UX Presence | `phase2/ux-presence.md` | 802 | Presence philosophy, per-agent profiles, anti-patterns |
| Attention Economy | `phase2/attention-economy.md` | 4,000+ | Presence density, attention budget, fatigue, rarity, silence recovery |
| Token Budget | `phase2/token-budget.md` | 1,699 | Cost tiers, budgets, degradation, emergency cutoffs |
| Integration | `phase2/integration.md` | 1,922 | Webhooks, normalizers, provider extensibility, handoff contract |
| Admin & Safety | `phase2/admin-safety.md` | 1,554 | Admin controls, safety rules, hard stops, audit trail |

**Next action:** start with Slice 0 + Slice 1 so the codebase has a stable baseline and typed Phase 2 contracts before behavior runtime work begins.
