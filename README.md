# Agent Portal

**An AI agent that lives on your webpage.** Not a chatbot widget in the corner — a *presence*: a floating eye that tracks your cursor, blinks, breathes, and thinks; a particle field that shifts with its mood; and a cast of agents who speak only when speaking is worth it.

> Presence is not constant talking. Presence is behavior. Silence is a first-class feature.

## The cast

| Agent | Vibe |
|-------|------|
| **Professor Nova** 🟠 | Energetic inventor-scientist. Treats the page like a lab. |
| **Jinx** 🩷 | Chaotic trickster. The fourth wall is a polite suggestion. |
| **Atlas** 🔵 | Serene companion. Never wastes a word. |
| **Chatty** 🦜 | Chaotic-goofy parrot, immigrated from the sayhai desktop companion. Squawks. Secretly affectionate. |

## How it works

```
you type → /api/agent/chat → OpenRouter (persona prompt + emotion protocol)
                ↓ reply: "[excited] ohhh bold question."
        emotion parsed server-side
                ↓
     EMOTION signal → AtlasBrain (client state machine, 500ms tick)
                ↓
   the eye dilates, the particles stir — the page reacts to WHAT was said
```

- **AtlasBrain** — client-side behavior engine: OBSERVING / RESTING / THINKING / REACTING modes, attention economy with inertia, idle detection, breathing rhythm, partial attention, rare events, and a slowly drifting **temperament** (chipper, mellow, chaotic, broody, lovey, dramatic, sleepy, sassy — ported from sayhai's mood drift) that tints everything.
- **Emotion protocol** (from sayhai) — every LLM reply leads with `[emotion]`, so the presence layer knows the mood the instant the reply lands. Works in demo mode too.
- **Token budget** — per-session ledger with graceful degradation: healthy → full replies, warning → shorter replies, critical/exhausted → free canned quips. The page never dies, it just gets quieter.
- **Webhooks → presence** — authenticated external events (`POST /api/webhook/generic` with `x-webhook-secret`) land in the event store; the page polls the public feed, the eye glances up, and the message surfaces as a speech bubble. Your CI can literally make the page look up from what it's doing.

## Run it

```bash
npm install
cp .env.local.example .env.local   # optional — runs fine with zero config
npm run dev                        # http://localhost:3000
```

With no env vars you get **demo mode**: full presence, canned in-character replies. To give the agents a real brain, pick a provider (`LLM_PROVIDER=auto` tries them in this order):

- **Ollama (local-first, free, private):** run [Ollama](https://ollama.com) and set `OLLAMA_MODEL` to a pulled model (e.g. `qwen2.5:14b`). Replies use an assistant-prefill trick so even small local models emit the `[emotion]` tag reliably.
- **OpenRouter (cloud):** set `OPENROUTER_API_KEY` (+ optional `OPENROUTER_MODEL`).

To reach the portal from other machines (LAN or Tailscale), bind wide and pick an uncommon port: `npm run dev -- --hostname 0.0.0.0 --port 41777`.

Try it:
- **Click the eye** — it startles (then opens the chat).
- **Press `/`** — chat opens. **Esc** closes.
- **Go idle ~5s** — the eye rests, half-lidded; particles slow down.
- Make the outside world knock:
  ```bash
  curl -X POST localhost:3000/api/webhook/generic \
    -H 'content-type: application/json' -H 'x-webhook-secret: <your secret>' \
    -d '{"eventType":"deploy","source":"ci","urgency":0.9,"data":{"message":"Deploy finished!"}}'
  ```

## Admin

Set `ADMIN_PASSWORD` and open `/admin` (basic auth, timing-safe) — panels for API keys, presence tuning, budget controls, feature flags, prompts, and logs.

## Development

```bash
npx eslint src      # lint
npx tsc --noEmit    # typecheck
npm run build       # production build
bun test            # unit tests (bun)
```

CI runs all four on every push/PR.

## Architecture docs

The full design lives in [`docs/`](docs/) — a Phase 2 master plan and six sub-documents (behavior director, attention economy, token budget, event systems, admin safety, UX presence) totalling ~15k lines. The code implements the Moderate Presence Layer (Option B) plus the Phase 3 webhook integration.
