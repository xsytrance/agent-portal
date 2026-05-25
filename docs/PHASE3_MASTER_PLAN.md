# Agent Portal — Phase 3 Master Plan

## 1. Executive Summary

Phase 3 builds upon the living presence system of Phase 2 by finalizing the necessary systems for robust external agent interactions and rich user experiences. This phase introduces persistent memory, advanced authentication, streaming, multi-modal features, and complete external webhook architectures (such as Hermes and OpenClaw).

## 2. Recommended Phase 3 Scope

| Layer | What | Status |
|-------|------|--------|
| **External Agent Integration** | Endpoints for OpenClaw and Hermes, complete with rate limiting, auth, and parsing. | BUILD |
| **Persistent Memory** | Redis/DB integration for tracking session context and tokens beyond in-memory storage. | BUILD |
| **Streaming LLM Responses** | Support for incremental UI updates and SSE streams for continuous generation. | BUILD |
| **Multi-modal Features** | Support for images and audio in agent messages. | BUILD |
| **Advanced Authentication** | NextAuth/Clerk implementations for robust and scalable session auth. | BUILD |

## 3. Architecture Overview

### 3.1 Webhook Integrations
A crucial part of Phase 3 is making the integration points defined in Phase 2 functional. This includes:
- Pluggable Webhook Authentication using shared secrets, HMAC-SHA256, or API keys.
- Webhook Rate Limiting using sliding window limits per webhook source.
- Dynamic route endpoints `src/app/api/webhook/[source]/route.ts`.

### 3.2 Next Steps
We will begin Phase 3 by implementing the Webhook Integration points, ensuring `rateLimiter.ts` and `webhookAuth.ts` are set up and usable.
