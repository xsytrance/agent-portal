# Commercialization Slice A

## Product Direction

Agent Portal is now a managed multi-model AI workspace with prepaid credits and personality-driven agents. The Behavior Director remains a differentiator, but commercial reliability now has equal priority: billing safety, account isolation, wallet integrity, and provider cost control.

Autonomy remains disabled by default. No autonomous provider calls should execute until wallet authorization, request logging, and spend controls are active for that path.

## Architecture Changes

- Added Auth.js foundation with Prisma-backed sessions when `DATABASE_URL` is configured.
- Added guest compatibility for existing demo behavior via `guest_demo` or `x-agent-portal-guest-id`.
- Added Prisma/PostgreSQL schema for users, wallets, immutable wallet transactions, usage events, provider request logs, Stripe webhook idempotency, and daily spend caps.
- Added prepaid wallet APIs:
  - `GET /api/wallet`
  - `GET /api/wallet/history`
- Added Stripe sandbox endpoints:
  - `POST /api/stripe/checkout`
  - `POST /api/stripe/webhook`
- Refactored chat provider calls through a commercial OpenRouter authorization layer:
  - model allowlist
  - markup pricing
  - emergency kill switch
  - request logging
  - wallet balance check
  - estimated reservation before provider call
  - actual usage reconciliation afterward
- Added operational admin API and panel:
  - `GET /api/admin/ops`
  - revenue, provider spend, active users, wallet balances, recent transactions, top spenders, blocked requests, provider health
- Added Docker/Postgres support and environment validation.

## DB Schema Overview

Key tables:

- `User`, `Account`, `Session`, `VerificationToken` - Auth.js account/session foundation.
- `user_wallets` - one wallet per user, integer `balanceMicrocredits`.
- `wallet_transactions` - immutable ledger entries. Supported types:
  - `credit_purchase`
  - `usage_deduction`
  - `admin_adjustment`
  - `refund`
  - `promotional_credit`
- `ChatSession` - user-owned chat sessions.
- `UsageEvent` - user-owned model usage records.
- `ProviderRequestLog` - OpenRouter authorization, block, completion, and failure logs.
- `StripeWebhookEvent` - processed Stripe event IDs for duplicate webhook protection.
- `UserDailySpend` - daily per-user spend/request counters.

Money is never stored as floating point. Wallet balances and costs use integer microcredits.

## Required Environment Variables

See `.env.local.example`.

Minimum production set:

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain
NEXT_PUBLIC_APP_URL=https://your-domain
ADMIN_PASSWORD=...
ADMIN_EMAILS=admin@example.com
ADMIN_BASIC_AUTH_ENABLED=false
STRIPE_SECRET_KEY=sk_live_or_test...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_ALLOWED_MODELS=openai/gpt-4o-mini,openai/gpt-4o,anthropic/claude-3.5-sonnet,google/gemini-1.5-flash
OPENROUTER_EMERGENCY_DISABLED=false
DAILY_SPEND_CAP_MICROCREDITS=10000000
GLOBAL_DAILY_SPEND_CAP_MICROCREDITS=100000000
MAX_PROMPT_CHARS=12000
```

## Migration Instructions

```bash
npm install
cp .env.local.example .env.local
# edit .env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Production:

```bash
npm run db:generate
npm run db:deploy
npm run build
npm run start
```

## Local Dev with Docker

```bash
docker compose up db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_portal npm run db:migrate
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_portal npm run db:seed
npm run dev
```

Or build both services:

```bash
docker compose up --build
```

## Stripe Sandbox Setup

1. Create Stripe test mode products/prices for `$5`, `$10`, `$20`, and `$50`, or leave price IDs blank to use inline `price_data`.
2. Set:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - optional `STRIPE_PRICE_5`, `STRIPE_PRICE_10`, `STRIPE_PRICE_20`, `STRIPE_PRICE_50`
3. Start the app.
4. Create a checkout session:

```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H 'content-type: application/json' \
  -d '{"dollars":10}'
```

5. Forward webhooks with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Webhook handling validates signatures, stores processed event IDs, and credits wallets with idempotency key `stripe:checkout:<sessionId>`.

## Remaining Risks

- Auth UI is foundation-only; production sign-in UX still needs product design.
- Wallet reservations are implemented as immutable `usage_deduction` entries followed by refund/overage reconciliation; deeper double-entry accounting review is recommended before launch.
- No organizations/multi-tenant teams yet by design.
- Admin controls are read-only/env-driven for emergency switches; production operators may need audited write controls later.
- Rate limiting is in-process for now. This is acceptable for a single instance but should move to shared storage before horizontal scaling.
- Dependency audit currently reports moderate issues from installed ecosystem packages; review before public deployment.

## Recommended Slice B Roadmap

1. Production auth UX: email magic link or OAuth, account page, sign-out.
2. Shared rate-limit storage for multi-instance deploys.
3. Provider health checks and model pricing sync process.
4. CI pipeline: lint, build, Prisma validate, migration deploy dry-run.
5. Production observability: structured JSON logs, provider error dashboards, wallet ledger alerts.

## Slice B Progress

Implemented after Slice A:

- Navbar wallet widget with guest/account state, balance display, refresh, and `$5/$10/$20/$50` purchase buttons.
- Stripe Checkout UI path with graceful sandbox/configuration errors.
- Chat panel now sends user messages through `/api/agent/chat`, so wallet/provider guardrails are on the product path rather than only server-side smoke tests.
- `ChatMessage` persistence model and light chat exchange persistence when PostgreSQL is configured.
- Admin wallet adjustment endpoint: `POST /api/admin/wallet/adjust`.
- Commercial Ops admin form for `promotional_credit`, `refund`, and `admin_adjustment`, disabled clearly in no-database mode.

## Stabilization Slice B.1 Progress

Implemented after DB-connected verification:

- Auth.js Credentials now uses JWT sessions, which fixes local credentials sign-in.
- Admin access prefers Auth.js admin JWTs. Basic Auth is now a temporary fallback controlled by `ADMIN_BASIC_AUTH_ENABLED`; keep it disabled in production unless explicitly needed.
- `ADMIN_EMAILS` controls which credential-authenticated users can become admins.
- Header-provided guest IDs are ignored when `DATABASE_URL` is configured. Guests remain demo-only and do not receive persistent paid wallets.
- Wallet ledger writes now lock the wallet row with `FOR UPDATE` inside a transaction before changing balances.
- Provider reservations now rely on the atomic ledger write instead of a separate balance check.
- Stripe webhook processing now records status (`processing`, `processed`, `failed`) and marks events processed only after wallet credit succeeds.
- Stripe checkout returns structured JSON errors when Stripe rejects session creation.

Production note: paid wallet behavior should require a signed-in user until a signed server-issued guest token is implemented.

## Slice C Progress

Implemented customer onboarding/account UX:

- Customer sign-up page: `/signup`.
- Customer sign-in page: `/signin`.
- Passwords are hashed with Node `scrypt`; raw passwords are not stored.
- Account dropdown shows signed-in email/account state, wallet balance, wallet link, sign out, and admin link only for admin sessions.
- Wallet page: `/wallet`.
  - Shows balance.
  - Shows transaction history.
  - Shows `$5/$10/$20/$50` checkout buttons for signed-in paid-wallet users.
  - Shows checkout success/cancel states.
  - Explains that credits are prepaid usage credits, not unlimited subscription access.
- Chat panel now shows a simple customer model selector using centralized OpenRouter allowlist labels:
  - OpenAI / ChatGPT
  - Claude
  - Gemini
- Chat panel surfaces whether the response is demo/template or paid wallet-backed, and shows friendly block reasons.
- Signed-in chat sessions can appear on the wallet page as recent sessions.
- Admin Ops now includes recent provider logs.

Local auth setup:

1. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL`.
2. Run migrations and seed.
3. Visit `/signup` to create a customer account.
4. Visit `/signin` to sign in.
5. Admin access requires either an Auth.js session whose email is in `ADMIN_EMAILS`, or temporary Basic Auth when `ADMIN_BASIC_AUTH_ENABLED=true`.
