# Agent Portal Current Architecture

This document captures the current implementation baseline before Phase 2 behavior runtime work begins.

## App Shape

- Next.js App Router application under `src/app`.
- User-facing portal lives in `components/HomePage.tsx` and shared shell logic in `components/LayoutClient.tsx`.
- Portal presence UI is currently client-rendered through:
  - `components/portal/FloatingEye.tsx`
  - `components/portal/ParticleBackground.tsx`
  - `components/portal/ChatPanel.tsx`
  - `components/portal/AgentSelector.tsx`

## Agent Registry

- Canonical starter agents live in `src/app/lib/agents/starterAgents.ts`.
- `AgentContext` consumes that registry rather than declaring its own duplicate agent list.
- Admin defaults are derived from the same registry through `useAdminConfig`.

## Current API Routes

- `GET /api/health` - health check.
- `GET/POST /api/auth/[...nextauth]` - Auth.js session foundation.
- `GET /api/wallet` - current user/guest wallet balance.
- `GET /api/wallet/history` - current user/guest immutable wallet ledger history.
- `POST /api/stripe/checkout` - Stripe Checkout session creation for prepaid credit packs.
- `POST /api/stripe/webhook` - Stripe webhook processing with signature and duplicate-event validation.
- `POST /api/agent/chat` - chat response, using OpenRouter when configured and mock fallback otherwise.
- `GET /api/agent/config` - starter agent configuration.
- `POST /api/agent/behavior/decide` - safe mock-mode Behavior Director decision endpoint.
- `GET/POST /api/agent/events` - in-memory event store access with validation.
- `GET /api/agent/stream` - mock SSE event stream.
- `GET /api/admin/config` - runtime config summary.
- `GET /api/admin/budget` - read-only in-memory budget status and config.
- `GET /api/admin/ops` - commercial operations summary.
- `GET/POST /api/admin/features` - feature flag API.
- `GET/POST /api/admin/keys` - API key metadata flow.
- `GET /api/admin/logs` - in-memory logs.
- `GET/POST /api/admin/prompts` - prompt configuration flow.

## Current Presence Behavior

- The existing autonomous loop is client-side and intentionally lightweight.
- `useAutonomousLoop` tracks local interaction and occasionally displays an idle speech bubble.
- `useAtlasBrain` provides a local Atlas-style presence model for eye and particle behavior.
- Phase 2 should move server-authoritative behavior decisions behind typed `InputSignal` and `BehaviorPlan` contracts before adding new autonomy.

## Phase 2 Contract Baseline

- Behavior contract types live in `src/app/lib/behavior/behaviorTypes.ts`.
- Behavior plan validation lives in `src/app/lib/behavior/behaviorValidator.ts`.
- Input signal contracts live in `src/app/lib/signals/signalTypes.ts`.
- Input signal validation lives in `src/app/lib/signals/signalValidator.ts`.
- Event validation recognizes the `behavior.*` event namespace, but no new runtime behavior emits those events yet.
- `decideBehavior` produces server-side `DirectorDecision` and `BehaviorPlan` objects in mock mode. It never calls an LLM provider; it only returns free visual/template plans for callers to inspect.
- Chat provider calls are guarded by the in-memory budget manager. OpenRouter requests require budget approval and record token usage after a successful provider response; budget-blocked chats degrade to mock responses.
- Commercialized chat provider calls now require wallet authorization when `DATABASE_URL` and `OPENROUTER_API_KEY` are configured. The old in-memory budget API remains as a legacy/development status surface.
