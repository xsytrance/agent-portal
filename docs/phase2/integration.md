# Agent Portal Phase 2 — Integration Architecture

> **Status:** Design Document (Architecture-Only)  
> **Scope:** Extension points, contracts, and integration patterns for external systems  
> **Audience:** xsy, Juan — implementation partners  

---

## Table of Contents

1. [Provider Plugin Architecture](#1-provider-plugin-architecture)
2. [External Agent Event Sources](#2-external-agent-event-sources)
3. [Webhook Endpoint Design](#3-webhook-endpoint-design)
4. [Agent-to-Agent Communication](#4-agent-to-agent-communication)
5. [Normalization Layer](#5-normalization-layer)
6. [Backend Agent Handoff Contract](#6-backend-agent-handoff-contract)
7. [Extension Points Reference](#7-extension-points-reference)

---

## 1. Provider Plugin Architecture

### 1.1 Design Principles

- **Interface over implementation:** All providers implement the same contract. Agent Portal never knows which LLM is behind the adapter.
- **Capability discovery:** The portal queries what a provider *can* do before asking it to do it.
- **Graceful degradation:** If a provider is unavailable, the portal falls back through a priority chain (OpenRouter → MockProvider).
- **Registry pattern:** Providers self-register at boot; adding a new provider requires zero changes to existing code.

### 1.2 Extended Provider Interface

```typescript
// ============================================================
// providerTypes.ts — extended for Phase 2
// ============================================================

/** Message role for multi-turn conversations */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/** Individual message in a conversation */
export interface ChatMessage {
  role: MessageRole;
  content: string | MultiModalContent[];
  /** Present when role === 'tool' — links back to the tool call */
  toolCallId?: string;
  /** Present when role === 'assistant' and the model made tool calls */
  toolCalls?: ToolCall[];
}

/** Text or image/audio content block */
export interface MultiModalContent {
  type: 'text' | 'image_url' | 'audio_url';
  text?: string;
  imageUrl?: { url: string; detail?: 'low' | 'high' | 'auto' };
  audioUrl?: { url: string; format?: 'mp3' | 'wav' };
}

/** A tool/function the model may invoke */
export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object; // JSON Schema
  };
}

/** A tool call issued by the model */
export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

/** Base chat request — extended for streaming, tools, multi-modal */
export interface ChatRequest {
  agentId: string;
  messages: ChatMessage[];
  /** If omitted, non-streaming response is returned */
  stream?: boolean;
  /** Tools the model may call. Empty array = tool mode disabled */
  tools?: ToolDefinition[];
  /** Provider-specific parameters (temperature, top_p, etc.) */
  modelParams?: Record<string, unknown>;
}

/** Non-streaming chat response */
export interface ChatResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  /** Present if the model invoked tools instead of producing text */
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls' | 'error';
}

/** SSE chunk for streaming responses */
export interface ChatStreamChunk {
  /** Incremental content delta. May be empty string for metadata-only chunks */
  delta: string;
  /** Present on the final chunk */
  finishReason?: ChatResponse['finishReason'];
  /** Present if a tool call is being streamed */
  toolCallDelta?: Partial<ToolCall>;
}

/** Capability bitmap — what this provider supports */
export interface ProviderCapabilities {
  streaming: boolean;
  multiModal: boolean;       // images + audio input
  toolCalling: boolean;      // function/tool calling
  batchRequests: boolean;    // multiple completions in one HTTP call
  /** Max context window in tokens */
  maxContextWindow: number;
  /** Models this provider can serve */
  availableModels: string[];
}

/** Health check result */
export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'unavailable';
  latencyMs: number;
  checkedAt: string; // ISO timestamp
  error?: string;
}

/** Batch request for high-throughput scenarios */
export interface BatchChatRequest {
  requests: Array<{
    id: string;       // caller-supplied correlation ID
    messages: ChatMessage[];
    tools?: ToolDefinition[];
  }>;
  modelParams?: Record<string, unknown>;
}

/** Batch response — results may be sparse if individual items fail */
export interface BatchChatResponse {
  results: Array<{
    id: string;
    response?: ChatResponse;
    error?: string;
  }>;
}

// ============================================================
// ProviderAdapter — the contract every provider must satisfy
// ============================================================

export interface ProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  readonly capabilities: ProviderCapabilities;

  /** True if the provider is configured and reachable */
  isAvailable(): Promise<boolean>;

  /** Synchronous (blocking) chat */
  chat(request: ChatRequest): Promise<ChatResponse>;

  /** Streaming chat — returns an async iterable of SSE chunks */
  chatStream(request: ChatRequest): AsyncIterable<ChatStreamChunk>;

  /** Tool chat — may return text OR tool calls (or both) */
  chatWithTools(request: ChatRequest & { tools: ToolDefinition[] }): Promise<ChatResponse>;

  /** Batch completion for high-throughput workloads */
  batchChat?(request: BatchChatRequest): Promise<BatchChatResponse>;

  /** Lightweight health check */
  healthCheck(): Promise<ProviderHealth>;
}
```

### 1.3 Provider Registry

```typescript
// providerRegistry.ts
// ============================================================

import { ProviderAdapter } from './providerTypes';

export interface ProviderRegistration {
  adapter: ProviderAdapter;
  /** Lower number = higher priority in fallback chain */
  priority: number;
  /** Tags for filtering (e.g., 'llm', 'image', 'premium') */
  tags: string[];
}

class ProviderRegistry {
  private providers = new Map<string, ProviderRegistration>();

  register(reg: ProviderRegistration): void {
    this.providers.set(reg.adapter.providerId, reg);
  }

  /** Get a provider by ID. Returns undefined if not registered. */
  get(providerId: string): ProviderRegistration | undefined {
    return this.providers.get(providerId);
  }

  /** All providers sorted by priority (highest first) */
  all(): ProviderRegistration[] {
    return [...this.providers.values()].sort((a, b) => a.priority - b.priority);
  }

  /** All providers with the given tag */
  byTag(tag: string): ProviderRegistration[] {
    return this.all().filter(p => p.tags.includes(tag));
  }

  /** First available provider matching a predicate, respecting priority */
  async firstAvailable(
    predicate: (reg: ProviderRegistration) => boolean = () => true
  ): Promise<ProviderAdapter | undefined> {
    const candidates = this.all().filter(predicate);
    for (const reg of candidates) {
      if (await reg.adapter.isAvailable()) return reg.adapter;
    }
    return undefined;
  }

  /** Health check all providers */
  async healthCheckAll(): Promise<Record<string, ProviderHealth>> {
    const results: Record<string, ProviderHealth> = {};
    await Promise.all(
      [...this.providers.values()].map(async (reg) => {
        results[reg.adapter.providerId] = await reg.adapter.healthCheck();
      })
    );
    return results;
  }
}

export const providerRegistry = new ProviderRegistry();
```

### 1.4 Chat Router — Unified Entry Point

```typescript
// api/agent/chat/route.ts — Phase 2 revision
// ============================================================

import { providerRegistry } from '@/app/lib/providers/providerRegistry';

export async function POST(request: Request) {
  const body = await request.json();
  const { agentId, messages, stream, tools, modelParams, preferredProvider } = body;

  // 1. Resolve provider: explicit request → fallback chain → MockProvider
  const provider = preferredProvider
    ? providerRegistry.get(preferredProvider)?.adapter
    : await providerRegistry.firstAvailable();

  if (!provider) {
    return Response.json({ error: 'No provider available' }, { status: 503 });
  }

  // 2. Check capabilities before calling
  if (tools?.length > 0 && !provider.capabilities.toolCalling) {
    return Response.json(
      { error: `Provider ${provider.providerId} does not support tool calling` },
      { status: 400 }
    );
  }

  // 3. Route to streaming or blocking path
  if (stream && provider.capabilities.streaming) {
    const stream = provider.chatStream({ agentId, messages, tools, modelParams, stream: true });
    return new Response(streamToSSE(stream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // 4. Blocking path
  const chatRequest = { agentId, messages, tools, modelParams, stream: false };
  const response = tools?.length > 0
    ? await provider.chatWithTools(chatRequest)
    : await provider.chat(chatRequest);

  return Response.json(response);
}
```

### 1.5 Implementing a New Provider (Contract Checklist)

To add a new provider (e.g., Google Gemini):

1. Create `GeminiProvider` class implementing `ProviderAdapter`
2. Implement `providerId` (`'google/gemini'`), `providerName`, `capabilities`
3. Implement `isAvailable()` — check for `GEMINI_API_KEY` env var + ping
4. Implement `chat()` — map Portal types → Gemini API → Portal types
5. Implement `chatStream()` — wrap Gemini streaming in `AsyncIterable<ChatStreamChunk>`
6. Implement `chatWithTools()` — if Gemini supports function calling
7. Implement `healthCheck()` — lightweight `/models` list call
8. Register in `lib/providers/bootProviders.ts`:

```typescript
import { GeminiProvider } from './geminiProvider';
providerRegistry.register({
  adapter: new GeminiProvider(),
  priority: 20,    // between OpenRouter (10) and Mock (999)
  tags: ['llm', 'multimodal'],
});
```

---

## 2. External Agent Event Sources

### 2.1 Overview

Four external systems will push events into Agent Portal. Each has different authentication, payload shape, and rate profile. This section defines the contract for each.

### 2.2 Source Registry

```typescript
// webhookSources.ts — canonical source definitions
// ============================================================

export type WebhookSourceId = 'openclaw' | 'hermes' | 'scrapers' | 'generic';

export interface WebhookSourceConfig {
  sourceId: WebhookSourceId;
  displayName: string;
  /** Auth method for this source */
  auth: AuthConfig;
  /** Normalizer function: external payload → PortalEvent */
  normalizer: EventNormalizer;
  /** Rate limit: requests per windowMs */
  rateLimit: { requests: number; windowMs: number };
  /** Which PortalEventTypes this source is allowed to emit */
  allowedEventTypes: PortalEventType[];
  /** Is this source active? */
  enabled: boolean;
}

export interface AuthConfig {
  type: 'shared_secret' | 'hmac_sha256' | 'api_key_header';
  /** Env var name containing the secret */
  secretEnvVar: string;
  /** Header name to read (for api_key_header type) */
  headerName?: string;
}
```

### 2.3 Per-Source Design

#### OpenClaw (Agent System)

| Property | Value |
|----------|-------|
| **Purpose** | Posts agent-generated content: deals, news, feed items |
| **Endpoint** | `POST /api/webhook/openclaw` |
| **Auth** | Shared secret via `X-OpenClaw-Secret` header |
| **Env var** | `WEBHOOK_SECRET_OPENCLAW` |
| **Allowed events** | `portal.feed_item`, `portal.deal_card`, `portal.news_card` |
| **Rate limit** | 60 req/min |
| **Payload shape** | `{ "eventType": "deal_card", "data": { ... }, "timestamp": "..." }` |
| **Normalizer** | `OpenClawNormalizer` |

```typescript
// OpenClaw normalizer contract
interface OpenClawPayload {
  eventType: 'feed_item' | 'deal_card' | 'news_card';
  data: FeedItemData | DealCardData | NewsCardData;
  timestamp: string;          // ISO 8601
  agentId?: string;           // which agent produced this
  correlationId?: string;     // for tracing
  priority?: 'low' | 'normal' | 'high';
}
```

**Validation rules:**
- `eventType` must be in allowed set → reject 400 if not
- `timestamp` must be valid ISO 8601 within ±5 minutes of now → reject 400 if stale
- `data` must pass schema validation per event type → reject 422 if invalid
- `agentId` if present must reference a registered agent → log warning if unknown

---

#### Hermes (Orchestrator)

| Property | Value |
|----------|-------|
| **Purpose** | Task completion events, orchestrated actions |
| **Endpoint** | `POST /api/webhook/hermes` |
| **Auth** | HMAC-SHA256 via `X-Hermes-Signature` header |
| **Env var** | `WEBHOOK_SECRET_HERMES` |
| **Allowed events** | `portal.report_ready`, `portal.create_page`, `system.log` |
| **Rate limit** | 30 req/min |
| **Payload shape** | `{ "taskId": "...", "status": "completed", "result": { ... }, "timestamp": "..." }` |
| **Normalizer** | `HermesNormalizer` |

```typescript
// Hermes normalizer contract
interface HermesPayload {
  taskId: string;
  status: 'completed' | 'failed' | 'cancelled' | 'progress';
  result?: {
    eventType: 'report_ready' | 'create_page';
    data: ReportData | PageData;
  };
  progress?: { percent: number; message: string };
  timestamp: string;
  initiatedBy?: string;       // agent ID that started the task
}
```

**Validation rules:**
- `taskId` must be non-empty string ≤ 128 chars
- `status` must be valid enum value
- HMAC signature must match `HMAC_SHA256(secret, rawBody)` → reject 401 if mismatch
- Timestamp within ±5 minutes → reject 400 if stale
- `result.eventType` must be in Hermes's allowed set

---

#### Scrapers

| Property | Value |
|----------|-------|
| **Purpose** | Raw scraped data: deals, news, prices |
| **Endpoint** | `POST /api/webhook/scrapers` |
| **Auth** | API key via `X-Scraper-Key` header |
| **Env var** | `WEBHOOK_SECRET_SCRAPERS` |
| **Allowed events** | `portal.feed_item`, `portal.deal_card` |
| **Rate limit** | 120 req/min |
| **Payload shape** | `{ "sourceUrl": "...", " scrapedAt": "...", "content": { ... }, "metadata": { ... } }` |
| **Normalizer** | `ScraperNormalizer` |

```typescript
// Scraper normalizer contract
interface ScraperPayload {
  sourceUrl: string;           // where this data came from
  scrapedAt: string;           // ISO 8601
  scraperName: string;         // e.g., "amazon_deals", "techcrunch"
  contentType: 'deal' | 'news' | 'generic';
  content: {
    title: string;
    description?: string;
    url: string;
    imageUrl?: string;
    price?: { currency: string; amount: number; originalAmount?: number };
    tags?: string[];
    publishedAt?: string;
  };
  metadata: {
    confidence: number;        // 0.0 - 1.0
    freshness: 'live' | 'cached' | 'stale';
    language?: string;
  };
}
```

**Validation rules:**
- `sourceUrl` must be valid URL
- `scrapedAt` must be ISO 8601, not in the future
- `confidence` must be 0.0 - 1.0 → clamp, don't reject
- Content schema validated per `contentType` → reject 422 if invalid
- Deduplication: check `sourceUrl` + `content.url` against recent events (dedupe window: 1 hour)

---

#### Generic Webhooks

| Property | Value |
|----------|-------|
| **Purpose** | Third-party integrations (Zapier, Make, custom) |
| **Endpoint** | `POST /api/webhook/generic` |
| **Auth** | Shared secret via `X-Webhook-Secret` header |
| **Env var** | `WEBHOOK_SECRET_GENERIC` |
| **Allowed events** | Configurable per integration |
| **Rate limit** | 30 req/min |
| **Payload shape** | Flexible — validated against JSON Schema |
| **Normalizer** | `GenericNormalizer` (schema-driven) |

```typescript
// Generic normalizer — uses per-integration schema
interface GenericWebhookPayload {
  /** Declares the event type for routing */
  portalEventType: PortalEventType;
  /** Event payload — validated against type-specific schema */
  payload: Record<string, unknown>;
  /** Optional: which agent should handle this */
  targetAgent?: string;
  /** Optional: visibility override */
  visibility?: PortalEventVisibility;
}
```

**Validation rules:**
- `portalEventType` must be in the generic source's configured allowed set
- `payload` is validated against the schema for that event type
- `targetAgent` if present must exist in agent registry

### 2.4 Rate Limiting Middleware

```typescript
// rateLimiter.ts — per-source sliding window
// ============================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class SlidingWindowRateLimiter {
  private windows = new Map<string, RateLimitEntry>();

  constructor(private config: Record<string, { requests: number; windowMs: number }>) {}

  /** Returns true if request is allowed */
  allow(sourceId: string): boolean {
    const now = Date.now();
    const cfg = this.config[sourceId];
    if (!cfg) return false; // unknown source = deny

    const entry = this.windows.get(sourceId);
    if (!entry || now - entry.windowStart > cfg.windowMs) {
      // New window
      this.windows.set(sourceId, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= cfg.requests) return false;
    entry.count++;
    return true;
  }

  getRetryAfter(sourceId: string): number {
    const cfg = this.config[sourceId];
    const entry = this.windows.get(sourceId);
    if (!cfg || !entry) return 0;
    return Math.ceil((entry.windowStart + cfg.windowMs - Date.now()) / 1000);
  }
}

// Configured per-source
export const webhookRateLimiter = new SlidingWindowRateLimiter({
  openclaw:  { requests: 60,  windowMs: 60000 },
  hermes:    { requests: 30,  windowMs: 60000 },
  scrapers:  { requests: 120, windowMs: 60000 },
  generic:   { requests: 30,  windowMs: 60000 },
});
```

### 2.5 Source Authentication Middleware

```typescript
// webhookAuth.ts — pluggable auth per source
// ============================================================

import { createHmac, timingSafeEqual } from 'crypto';

export interface WebhookAuthResult {
  authenticated: boolean;
  sourceId?: string;
  error?: string;
}

export async function authenticateWebhook(
  sourceId: WebhookSourceId,
  request: Request
): Promise<WebhookAuthResult> {
  const config = sourceRegistry.get(sourceId);
  if (!config) return { authenticated: false, error: 'Unknown source' };
  if (!config.enabled) return { authenticated: false, error: 'Source disabled' };

  const secret = process.env[config.auth.secretEnvVar];
  if (!secret) return { authenticated: false, error: 'Webhook secret not configured' };

  switch (config.auth.type) {
    case 'shared_secret': {
      const headerValue = request.headers.get(config.auth.headerName || 'x-webhook-secret');
      if (!headerValue) return { authenticated: false, error: 'Missing secret header' };
      if (!timingSafeEqual(Buffer.from(headerValue), Buffer.from(secret))) {
        return { authenticated: false, error: 'Invalid secret' };
      }
      return { authenticated: true, sourceId };
    }

    case 'hmac_sha256': {
      const signature = request.headers.get('x-hermes-signature');
      if (!signature) return { authenticated: false, error: 'Missing HMAC signature' };
      const body = await request.clone().text();
      const expected = createHmac('sha256', secret).update(body).digest('hex');
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return { authenticated: false, error: 'Invalid HMAC signature' };
      }
      return { authenticated: true, sourceId };
    }

    case 'api_key_header': {
      const apiKey = request.headers.get(config.auth.headerName || 'x-api-key');
      if (!apiKey) return { authenticated: false, error: 'Missing API key' };
      if (!timingSafeEqual(Buffer.from(apiKey), Buffer.from(secret))) {
        return { authenticated: false, error: 'Invalid API key' };
      }
      return { authenticated: true, sourceId };
    }

    default:
      return { authenticated: false, error: 'Unknown auth type' };
  }
}
```

---

## 3. Webhook Endpoint Design

### 3.1 Route Structure

```
POST /api/webhook/[source]
  → Dynamic route handler
  → Source extracted from path parameter
  → Authentication (per-source)
  → Rate limiting (per-source)
  → Payload validation (per-source schema)
  → Normalization (external format → PortalEvent)
  → Event store append
  → SSE broadcast
  → Response
```

### 3.2 Route Handler

```typescript
// api/webhook/[source]/route.ts
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authenticateWebhook } from '@/app/lib/webhooks/webhookAuth';
import { webhookRateLimiter } from '@/app/lib/webhooks/rateLimiter';
import { sourceRegistry } from '@/app/lib/webhooks/webhookSources';
import { normalizeEvent } from '@/app/lib/webhooks/normalizeEvent';
import { addEvent } from '@/app/lib/events/eventStore';
import { validatePortalEvent } from '@/app/lib/events/eventValidator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  // 1. Source exists?
  const sourceConfig = sourceRegistry.get(source as WebhookSourceId);
  if (!sourceConfig) {
    return NextResponse.json({ error: 'Unknown webhook source' }, { status: 404 });
  }

  // 2. Authenticate
  const authResult = await authenticateWebhook(source as WebhookSourceId, request);
  if (!authResult.authenticated) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication failed' },
      { status: 401 }
    );
  }

  // 3. Rate limit
  if (!webhookRateLimiter.allow(source)) {
    const retryAfter = webhookRateLimiter.getRetryAfter(source);
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  // 4. Parse body
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 5. Normalize to PortalEvent
  let portalEvent: PortalEvent;
  try {
    portalEvent = await normalizeEvent({
      sourceId: source,
      sourceConfig,
      payload,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Normalization failed', details: (error as Error).message },
      { status: 422 }
    );
  }

  // 6. Validate normalized event
  const validation = validatePortalEvent(portalEvent);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Event validation failed', details: validation.errors },
      { status: 422 }
    );
  }

  // 7. Store and broadcast
  const sequence = await addEvent(portalEvent);

  // 8. Response
  return NextResponse.json({
    success: true,
    eventId: portalEvent.id,
    sequence,
    timestamp: portalEvent.timestamp,
  }, { status: 201 });
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, X-Webhook-Secret, X-Hermes-Signature, X-Scraper-Key',
    },
  });
}
```

### 3.3 Response Format

**Success (201 Created):**
```json
{
  "success": true,
  "eventId": "evt_abc123",
  "sequence": 42,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Response (all 4xx/5xx):**
```json
{
  "error": "Human-readable message",
  "details": "Optional additional context",
  "retryAfter": 45  // Only on 429
}
```

| Status | When |
|--------|------|
| 201 | Event accepted, normalized, stored |
| 400 | Invalid JSON, stale timestamp, malformed payload |
| 401 | Auth failed (wrong secret, missing signature) |
| 404 | Unknown `[source]` path segment |
| 422 | Normalization failed, schema validation failed |
| 429 | Rate limit exceeded (includes `Retry-After`) |
| 503 | Webhook secret not configured in env |

### 3.4 Event Validator

```typescript
// eventValidator.ts — strict validation on stored events
// ============================================================

import { PortalEvent, PortalEventType, PortalEventSource, PortalEventVisibility, PortalEventImportance } from './eventTypes';

const VALID_TYPES: PortalEventType[] = [
  'agent.message', 'agent.thinking', 'agent.typing', 'agent.error', 'agent.eye_emotion',
  'portal.repaint', 'portal.spawn_card', 'portal.create_page', 'portal.report_ready',
  'portal.feed_item', 'portal.deal_card', 'portal.news_card', 'portal.demo_action',
  'portal.theme_change', 'portal.sound_cue',
  'system.log', 'admin.config_changed',
];

const VALID_SOURCES: PortalEventSource[] = ['user', 'agent', 'system', 'admin', 'external'];
const VALID_VISIBILITIES: PortalEventVisibility[] = ['public', 'admin', 'internal'];
const VALID_IMPORTANCE: PortalEventImportance[] = ['low', 'normal', 'high', 'critical'];

const ISO8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePortalEvent(event: PortalEvent): ValidationResult {
  const errors: string[] = [];

  if (!event.id || typeof event.id !== 'string' || event.id.length > 128) {
    errors.push('Invalid event id: must be non-empty string ≤ 128 chars');
  }

  if (!VALID_TYPES.includes(event.type)) {
    errors.push(`Invalid event type: "${event.type}"`);
  }

  if (!ISO8601_REGEX.test(event.timestamp)) {
    errors.push('Invalid timestamp: must be ISO 8601 UTC');
  }

  if (!VALID_SOURCES.includes(event.source)) {
    errors.push(`Invalid source: "${event.source}"`);
  }

  if (event.source === 'agent' && !event.agentId) {
    errors.push('agentId is required when source is "agent"');
  }

  if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) {
    errors.push('Invalid payload: must be a non-null object');
  }

  if (!VALID_VISIBILITIES.includes(event.visibility)) {
    errors.push(`Invalid visibility: "${event.visibility}"`);
  }

  if (!VALID_IMPORTANCE.includes(event.importance)) {
    errors.push(`Invalid importance: "${event.importance}"`);
  }

  if (event.expiresAt && !ISO8601_REGEX.test(event.expiresAt)) {
    errors.push('Invalid expiresAt: must be ISO 8601 UTC');
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 4. Agent-to-Agent Communication

### 4.1 Design Principles

- **Event bus, not direct calls:** Agents never call each other directly. They publish events to the shared bus.
- **Async by default:** All agent communication is asynchronous, allowing agents to be offline, busy, or different services entirely.
- **Capability-based:** Agents advertise what they can do; requesters target capabilities, not agent IDs.
- **Interruptible:** Any agent can send an `agent.interrupt` event to halt another agent's current action.

### 4.2 Agent Registry

```typescript
// agentRegistry.ts — who's available and what can they do
// ============================================================

export interface AgentCapability {
  /** Unique capability ID (e.g., "summarize", "generate_chart") */
  id: string;
  /** Human-readable description */
  description: string;
  /** Input schema (JSON Schema) */
  inputSchema: object;
  /** Expected response type */
  responseType: string;
  /** Max execution time in ms */
  timeoutMs: number;
}

export interface RegisteredAgent {
  id: string;
  name: string;
  role: string;
  /** Capabilities this agent advertises */
  capabilities: AgentCapability[];
  /** Current status */
  status: 'idle' | 'busy' | 'offline' | 'error';
  /** Which agent is currently executing a task */
  currentTask?: string;
  /** Last seen timestamp (ISO 8601) */
  lastSeenAt: string;
  /** Source system that hosts this agent */
  hostSystem: 'portal' | 'openclaw' | 'hermes' | 'external';
}

class AgentRegistry {
  private agents = new Map<string, RegisteredAgent>();

  register(agent: RegisteredAgent): void {
    this.agents.set(agent.id, agent);
  }

  /** Update agent status (heartbeat) */
  heartbeat(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastSeenAt = new Date().toISOString();
      if (agent.status === 'offline') agent.status = 'idle';
    }
  }

  /** Find agents by capability */
  findByCapability(capabilityId: string): RegisteredAgent[] {
    return [...this.agents.values()].filter(
      a => a.capabilities.some(c => c.id === capabilityId) && a.status !== 'offline'
    );
  }

  /** Find best agent for a capability (simple: first idle, then busy) */
  findBestForCapability(capabilityId: string): RegisteredAgent | undefined {
    const candidates = this.findByCapability(capabilityId);
    return candidates.find(a => a.status === 'idle') ?? candidates[0];
  }

  /** Mark agent status */
  setStatus(agentId: string, status: RegisteredAgent['status'], currentTask?: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      agent.currentTask = currentTask;
    }
  }

  /** All registered agents */
  all(): RegisteredAgent[] {
    return [...this.agents.values()];
  }

  /** Mark stale agents as offline (call periodically) */
  reapStale(thresholdMs: number = 60000): void {
    const now = Date.now();
    for (const agent of this.agents.values()) {
      const lastSeen = new Date(agent.lastSeenAt).getTime();
      if (now - lastSeen > thresholdMs && agent.status !== 'offline') {
        agent.status = 'offline';
        agent.currentTask = undefined;
      }
    }
  }
}

export const agentRegistry = new AgentRegistry();
```

### 4.3 Agent Message Events

New event types for agent-to-agent communication:

```typescript
// Extended PortalEventType for Phase 2
export type PortalEventType =
  // ... existing 18 types ...
  // Agent-to-agent communication
  | 'agent.request'      // Agent A requests Agent B to do something
  | 'agent.response'     // Agent B responds to Agent A's request
  | 'agent.interrupt'    // Agent A interrupts Agent B's current action
  | 'agent.broadcast'    // Agent sends a message to all agents
  | 'agent.heartbeat'    // Agent pings registry to stay alive
  | 'agent.status_change'; // Agent's status changed (idle → busy, etc.)
```

### 4.4 Event Payload Schemas

```typescript
// agent.request payload
interface AgentRequestPayload {
  /** ID for correlating response */
  requestId: string;
  /** Which agent is making the request */
  fromAgentId: string;
  /** Which agent should handle it (optional — targets by capability) */
  toAgentId?: string;
  /** If toAgentId is omitted, target by capability */
  targetCapability?: string;
  /** The action to perform */
  action: {
    type: string;
    params: Record<string, unknown>;
  };
  /** How long to wait for a response */
  timeoutMs: number;
  /** Priority: lower number = higher priority */
  priority: number;
}

// agent.response payload
interface AgentResponsePayload {
  requestId: string;          // matches the original request
  fromAgentId: string;
  toAgentId: string;
  status: 'success' | 'error' | 'partial';
  result?: Record<string, unknown>;
  error?: string;
  /** How long the action took */
  durationMs: number;
}

// agent.interrupt payload
interface AgentInterruptPayload {
  /** Agent sending the interrupt */
  fromAgentId: string;
  /** Agent being interrupted */
  toAgentId: string;
  /** Why */
  reason: string;
  /** Force level: 'gentle' = finish current step, 'immediate' = drop everything */
  forceLevel: 'gentle' | 'immediate';
}

// agent.broadcast payload
interface AgentBroadcastPayload {
  fromAgentId: string;
  message: string;
  /** Optional: relevant data */
  data?: Record<string, unknown>;
  /** Urgency */
  urgency: 'low' | 'normal' | 'high';
}

// agent.heartbeat payload
interface AgentHeartbeatPayload {
  agentId: string;
  status: 'idle' | 'busy' | 'error';
  currentTask?: string;
  /** Advertised capabilities (optional — only send on change) */
  capabilities?: AgentCapability[];
}
```

### 4.5 Use Case: Nova asks Atlas to summarize

```
1. Nova emits: PortalEvent {
     type: 'agent.request',
     source: 'agent',
     agentId: 'nova',
     payload: {
       requestId: 'req_001',
       fromAgentId: 'nova',
       targetCapability: 'summarize',
       action: { type: 'summarize_text', params: { text: '...', maxLength: 200 } },
       timeoutMs: 30000,
       priority: 5,
     },
     visibility: 'internal',
     importance: 'normal',
   }

2. Event Store receives the event → broadcasts via SSE

3. Atlas (listening on SSE) sees agent.request with targetCapability='summarize'
   → Atlas accepts the request (emits agent.status_change to 'busy')
   → Atlas performs summarization
   → Atlas emits: PortalEvent {
        type: 'agent.response',
        source: 'agent',
        agentId: 'atlas',
        payload: {
          requestId: 'req_001',
          fromAgentId: 'atlas',
          toAgentId: 'nova',
          status: 'success',
          result: { summary: '...' },
          durationMs: 1450,
        },
        visibility: 'internal',
        importance: 'normal',
      }

4. Nova receives the response via SSE, correlates by requestId
```

### 4.6 Use Case: Jinx interrupts Nova

```
1. Jinx emits: PortalEvent {
     type: 'agent.interrupt',
     source: 'agent',
     agentId: 'jinx',
     payload: {
       fromAgentId: 'jinx',
       toAgentId: 'nova',
       reason: 'User wants to chat with me instead',
       forceLevel: 'gentle',
     },
     visibility: 'internal',
     importance: 'high',
   }

2. Nova receives the interrupt via SSE
   → If forceLevel='gentle': finish current processing step, then yield
   → If forceLevel='immediate': abort immediately, emit agent.status_change to 'idle'
```

### 4.7 Shared Context / Memory

```typescript
// agentContextStore.ts — shared working memory between agents
// ============================================================

interface ContextEntry {
  key: string;
  value: unknown;
  /** Which agent wrote this */
  writtenBy: string;
  /** ISO timestamp */
  writtenAt: string;
  /** How long this entry is valid */
  ttlSeconds?: number;
  /** Visibility: can other agents see this? */
  scope: 'private' | 'shared' | 'broadcast';
}

class AgentContextStore {
  private entries = new Map<string, ContextEntry>();

  set(entry: ContextEntry): void {
    this.entries.set(entry.key, entry);
  }

  get(key: string): ContextEntry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.ttlSeconds) {
      const age = (Date.now() - new Date(entry.writtenAt).getTime()) / 1000;
      if (age > entry.ttlSeconds) {
        this.entries.delete(key);
        return undefined;
      }
    }
    return entry;
  }

  /** Get all entries visible to a given agent */
  getForAgent(agentId: string): ContextEntry[] {
    return [...this.entries.values()].filter(e =>
      e.scope === 'broadcast' ||
      e.scope === 'shared' ||
      e.writtenBy === agentId
    );
  }

  /** Get entries by prefix (e.g., "conversation.") */
  getByPrefix(prefix: string): ContextEntry[] {
    return [...this.entries.values()].filter(e => e.key.startsWith(prefix));
  }

  /** Clean expired entries */
  reap(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.ttlSeconds) {
        const age = (now - new Date(entry.writtenAt).getTime()) / 1000;
        if (age > entry.ttlSeconds) this.entries.delete(key);
      }
    }
  }
}

export const agentContextStore = new AgentContextStore();
```

---

## 5. Normalization Layer

### 5.1 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌───────────────┐
│  OpenClaw POST  │───▶│                  │───▶│                 │───▶│               │
│  Hermes POST    │───▶│   Source Router  │───▶│   Normalizer    │───▶│  Event Store  │
│  Scraper POST   │───▶│   (per-source)   │───▶│   (per-format)  │───▶│  (broadcast)  │
│  Generic POST   │───▶│                  │───▶│                 │───▶│               │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └───────────────┘
```

### 5.2 Normalizer Interface

```typescript
// normalizerTypes.ts
// ============================================================

export interface NormalizerInput {
  /** Source system identifier */
  sourceId: string;
  /** Parsed JSON body from the webhook */
  payload: unknown;
  /** When the webhook was received */
  receivedAt: string;
  /** Source configuration */
  sourceConfig: WebhookSourceConfig;
}

export interface NormalizerOutput {
  /** The normalized PortalEvent (may be multiple) */
  events: PortalEvent[];
  /** Metadata about the normalization */
  meta: {
    /** Time spent normalizing (ms) */
    durationMs: number;
    /** Any non-fatal warnings */
    warnings: string[];
    /** If the payload was a duplicate of a recent event */
    isDuplicate: boolean;
  };
}

/** Every normalizer implements this interface */
export interface EventNormalizer {
  readonly sourceId: string;
  /** Transform external payload → PortalEvent(s) */
  normalize(input: NormalizerInput): Promise<NormalizerOutput>;
  /** Validate the raw payload before normalization */
  validatePayload(payload: unknown): { valid: boolean; errors: string[] };
}

/** Factory: get the right normalizer for a source */
export function getNormalizer(sourceId: string): EventNormalizer {
  switch (sourceId) {
    case 'openclaw': return openClawNormalizer;
    case 'hermes': return hermesNormalizer;
    case 'scrapers': return scraperNormalizer;
    case 'generic': return genericNormalizer;
    default:
      throw new Error(`No normalizer registered for source: ${sourceId}`);
  }
}
```

### 5.3 Normalizer Chain (Composed)

Normalizers can be chained for cross-cutting concerns:

```typescript
// normalizationChain.ts
// ============================================================

type NormalizerMiddleware = (
  input: NormalizerInput,
  next: () => Promise<NormalizerOutput>
) => Promise<NormalizerOutput>;

function createChain(
  baseNormalizer: EventNormalizer,
  middlewares: NormalizerMiddleware[]
): EventNormalizer {
  return {
    sourceId: baseNormalizer.sourceId,
    validatePayload: baseNormalizer.validatePayload.bind(baseNormalizer),
    async normalize(input: NormalizerInput): Promise<NormalizerOutput> {
      let index = 0;
      const next = async (): Promise<NormalizerOutput> => {
        if (index < middlewares.length) {
          const mw = middlewares[index++];
          return mw(input, next);
        }
        return baseNormalizer.normalize(input);
      };
      return next();
    },
  };
}

// Cross-cutting middlewares:

/** Deduplication middleware — checks for recent duplicates */
const dedupeMiddleware: NormalizerMiddleware = async (input, next) => {
  const result = await next();
  // Check deduplication logic against event store
  const recent = await getRecentEvents(100);
  const fingerprint = JSON.stringify(input.payload).slice(0, 200);
  const isDup = recent.some(e => JSON.stringify(e.payload).startsWith(fingerprint));
  return { ...result, meta: { ...result.meta, isDuplicate: isDup } };
};

/** Enrichment middleware — adds derived fields */
const enrichmentMiddleware: NormalizerMiddleware = async (input, next) => {
  const result = await next();
  const enrichedEvents = result.events.map(event => ({
    ...event,
    payload: {
      ...event.payload,
      _normalized: true,
      _sourceSystem: input.sourceId,
      _receivedAt: input.receivedAt,
    },
  }));
  return { ...result, events: enrichedEvents };
};

/** Compose the chain for a source */
export function composeNormalizer(base: EventNormalizer): EventNormalizer {
  return createChain(base, [dedupeMiddleware, enrichmentMiddleware]);
}
```

### 5.4 Example: OpenClaw Normalizer

```typescript
// openClawNormalizer.ts
// ============================================================

export const openClawNormalizer: EventNormalizer = {
  sourceId: 'openclaw',

  validatePayload(payload: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload || typeof payload !== 'object') {
      errors.push('Payload must be an object');
      return { valid: false, errors };
    }
    const p = payload as Record<string, unknown>;
    if (!p.eventType || typeof p.eventType !== 'string') {
      errors.push('Missing or invalid eventType');
    }
    if (!p.data || typeof p.data !== 'object') {
      errors.push('Missing or invalid data');
    }
    if (!p.timestamp || typeof p.timestamp !== 'string') {
      errors.push('Missing or invalid timestamp');
    }
    return { valid: errors.length === 0, errors };
  },

  async normalize(input: NormalizerInput): Promise<NormalizerOutput> {
    const p = input.payload as OpenClawPayload;
    const start = Date.now();
    const warnings: string[] = [];

    // Map eventType to PortalEventType
    const typeMap: Record<string, PortalEventType> = {
      feed_item: 'portal.feed_item',
      deal_card: 'portal.deal_card',
      news_card: 'portal.news_card',
    };

    const portalType = typeMap[p.eventType];
    if (!portalType) {
      throw new Error(`Unknown OpenClaw eventType: ${p.eventType}`);
    }

    const event: PortalEvent = {
      id: `evt_oc_${genId()}`,
      type: portalType,
      timestamp: p.timestamp,
      source: 'external',
      agentId: p.agentId,
      payload: p.data as Record<string, unknown>,
      visibility: 'public',
      importance: p.priority === 'high' ? 'high' : 'normal',
    };

    if (p.agentId && !agentRegistry.all().find(a => a.id === p.agentId)) {
      warnings.push(`Unknown agentId: ${p.agentId}`);
    }

    return {
      events: [event],
      meta: {
        durationMs: Date.now() - start,
        warnings,
        isDuplicate: false,
      },
    };
  },
};
```

### 5.5 Normalization Pipeline Summary

```
Webhook POST
  │
  ▼
┌─────────────────────┐
│ 1. Source Routing   │ ──► Extract [source] from path
│    (sourceRouter)   │ ──► Load source config from registry
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Authentication   │ ──► Run per-source auth (shared_secret / HMAC / API key)
│    (webhookAuth)    │ ──► 401 if failed
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Rate Limiting    │ ──► Sliding window check
│    (rateLimiter)    │ ──► 429 if exceeded
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Payload Parse    │ ──► JSON.parse body
│                     │ ──► 400 if invalid JSON
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Schema Validate  │ ──► normalizer.validatePayload()
│    (per-source)     │ ──► 422 if schema mismatch
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 6. Normalize        │ ──► normalizer.normalize() → PortalEvent[]
│    (per-source)     │ ──► 422 if normalization fails
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 7. Chain Middleware │ ──► dedupe check
│    (composed)       │ ──► enrichment (add _sourceSystem, _receivedAt)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 8. Event Validate   │ ──► validatePortalEvent() (strict type/schema check)
│    (universal)      │ ──► 422 if invalid
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 9. Store + Broadcast│ ──► addEvent() → in-memory store
│                     │ ──► SSE broadcast to all connected clients
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 10. Respond         │ ──► 201 { success, eventId, sequence }
│                     │
└─────────────────────┘
```

---

## 6. Backend Agent Handoff Contract

### 6.1 Overview

Agent Portal and xsy/Juan's backend are separate systems. This section defines the contract between them: what each side provides, how they communicate, and what happens when things go wrong.

### 6.2 What Agent Portal Provides

| Resource | Format | Access |
|----------|--------|--------|
| **Event Stream** | SSE at `/api/agent/stream` | Backend opens persistent SSE connection |
| **Event History** | REST `GET /api/agent/events?since=&limit=` | Poll for recent events |
| **Agent Registry** | REST `GET /api/agent/registry` | Lists agents + capabilities |
| **User Context** | REST `GET /api/context/:sessionId` | Current user's session state |
| **Frontend State** | REST `GET /api/portal/state` | Feature flags, active agents, theme |
| **Send Event** | REST `POST /api/agent/events` | Backend pushes events into the portal |
| **Webhook Endpoints** | Dynamic `/api/webhook/[source]` | Backend posts as OpenClaw, Hermes, etc. |

### 6.3 What Backend Provides

| Resource | Format | Delivery |
|----------|--------|----------|
| **Agent Responses** | PortalEvent via `POST /api/agent/events` or webhook | Async push |
| **Scraped Data** | Normalized payload via `POST /api/webhook/scrapers` | Async push |
| **Orchestrated Actions** | PortalEvent via `POST /api/webhook/hermes` | Async push |
| **Agent Registrations** | Agent metadata via `POST /api/agent/registry` | Registration at boot |
| **Health Status** | JSON via `GET /health` (on backend) | Portal polls periodically |

### 6.4 Communication Patterns

#### Pattern A: Backend Push (Primary)

```
┌──────────────┐        POST /api/webhook/openclaw          ┌──────────────┐
│   Backend    │ ──────────────────────────────────────────▶ │ Agent Portal │
│  (xsy/Juan)  │        { normalized event payload }         │              │
│              │                                             │ ──▶ Event    │
│              │        ◀────── 201 { eventId } ──────       │    Store     │
└──────────────┘                                             │ ──▶ SSE      │
                                                             │    Broadcast │
                                                             └──────────────┘
```

- **When to use:** Real-time events (agent messages, deals, news)
- **Auth:** Per-source webhook secret (shared_secret or HMAC)
- **Retry:** Backend retries with exponential backoff on 5xx or network errors
- **Idempotency:** Backend includes `correlationId`; portal deduplicates

#### Pattern B: Portal Pull (Polling)

```
┌──────────────┐        GET /api/agent/events?since=42       ┌──────────────┐
│   Backend    │ ◀────────────────────────────────────────── │ Agent Portal │
│  (xsy/Juan)  │        [{ events... }]                      │              │
│              │                                             │              │
│              │        ──▶ processes events ────▶          │              │
└──────────────┘                                             └──────────────┘
```

- **When to use:** Backend cannot expose webhooks (firewalled); legacy integrations
- **Frequency:** Configurable (default: 5 seconds)
- **Backpressure:** Backend returns `Retry-After` header if overloaded

#### Pattern C: Bidirectional SSE (Full Duplex)

```
┌──────────────┐        SSE /api/agent/stream                ┌──────────────┐
│   Backend    │ ◀────────────────────────────────────────── │ Agent Portal │
│  (xsy/Juan)  │        [events from all sources]            │              │
│              │                                             │              │
│              │        POST /api/agent/events               │              │
│              │ ──────────────────────────────────────────▶ │              │
└──────────────┘        [backend's responses]                └──────────────┘
```

- **When to use:** Backend needs real-time visibility into ALL portal events (not just webhooks)
- **Connection:** Backend opens SSE as a "listener client"
- **Push:** Backend POSTs responses to `/api/agent/events`

### 6.5 Error Handling

#### When Backend Is Down

```
Scenario: Backend is unreachable

1. Portal's outbound POST to backend webhook fails with ECONNREFUSED
2. Circuit breaker opens after 5 consecutive failures
3. Portal:
   - Logs the failure (system.log event)
   - Shows user-facing toast: "Some features are temporarily unavailable"
   - Continues operating with local agents (MockProvider, Nova, Jinx, Atlas)
   - Queues events for backend replay (up to 1000 events, 1 hour TTL)
4. Circuit breaker half-opens after 30 seconds
5. On success: breaker closes, queued events replayed
6. On failure: breaker reopens, wait another 30 seconds
```

```typescript
// circuitBreaker.ts
// ============================================================

interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half_open';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;      // resets on failure
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    status: 'closed',
    failureCount: 0,
    lastFailureTime: 0,
    successCount: 0,
  };

  constructor(
    private failureThreshold = 5,
    private recoveryTimeoutMs = 30000,
    private halfOpenMaxAttempts = 3,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.status === 'open') {
      if (Date.now() - this.state.lastFailureTime > this.recoveryTimeoutMs) {
        this.state.status = 'half_open';
        this.state.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state.status === 'half_open') {
      this.state.successCount++;
      if (this.state.successCount >= this.halfOpenMaxAttempts) {
        this.state.status = 'closed';
        this.state.failureCount = 0;
      }
    } else {
      this.state.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();
    if (this.state.status === 'half_open' || this.state.failureCount >= this.failureThreshold) {
      this.state.status = 'open';
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }
}
```

#### When Backend Sends Invalid Data

```
1. Webhook payload fails normalization → 422 returned to backend
2. Normalized event fails validation → 422 returned to backend
3. Event is logged as rejected with full payload (for debugging)
4. SSE clients are NOT notified (invalid events never reach the frontend)
5. Backend SHOULD monitor webhook responses and alert on 4xx patterns
```

#### Event Replay Queue

```typescript
// eventReplayQueue.ts
// ============================================================

interface QueuedEvent {
  id: string;
  targetUrl: string;
  payload: PortalEvent;
  attempts: number;
  maxAttempts: number;
  queuedAt: string;
  nextAttemptAt: string;
}

class EventReplayQueue {
  private queue: QueuedEvent[] = [];
  private maxSize = 1000;
  private ttlMs = 3600000; // 1 hour

  enqueue(event: PortalEvent, targetUrl: string): void {
    if (this.queue.length >= this.maxSize) {
      this.queue.shift(); // Evict oldest
    }
    this.queue.push({
      id: `replay_${genId()}`,
      targetUrl,
      payload: event,
      attempts: 0,
      maxAttempts: 5,
      queuedAt: new Date().toISOString(),
      nextAttemptAt: new Date().toISOString(),
    });
  }

  /** Call when circuit breaker re-closes to replay queued events */
  async drain(): Promise<void> {
    const now = Date.now();
    const ready = this.queue.filter(
      q => new Date(q.nextAttemptAt).getTime() <= now && q.attempts < q.maxAttempts
    );

    await Promise.all(
      ready.map(async (item) => {
        try {
          await fetch(item.targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
          this.queue = this.queue.filter(q => q.id !== item.id);
        } catch {
          item.attempts++;
          item.nextAttemptAt = new Date(
            Date.now() + Math.pow(2, item.attempts) * 1000
          ).toISOString();
        }
      })
    );

    // Remove expired items
    const cutoff = now - this.ttlMs;
    this.queue = this.queue.filter(q => new Date(q.queuedAt).getTime() > cutoff);
  }
}

export const replayQueue = new EventReplayQueue();
```

### 6.6 Authentication

| Direction | Method | Header | Configuration |
|-----------|--------|--------|---------------|
| Backend → Portal | Shared Secret | `X-Webhook-Secret` | Per-source env var |
| Backend → Portal | HMAC-SHA256 | `X-Hermes-Signature` | Shared secret + body hash |
| Portal → Backend | API Key | `Authorization: Bearer <key>` | `BACKEND_API_KEY` env var |
| Portal → Backend | Request Signing | `X-Portal-Signature` | HMAC of request body |

```typescript
// portalAuth.ts — how Agent Portal signs outbound requests
// ============================================================

import { createHmac } from 'crypto';

export function signPortalRequest(body: string): { signature: string; timestamp: string } {
  const secret = process.env.PORTAL_SIGNING_SECRET;
  if (!secret) throw new Error('PORTAL_SIGNING_SECRET not configured');

  const timestamp = Date.now().toString();
  const payload = `${timestamp}.${body}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');

  return { signature, timestamp };
}

export async function makeAuthenticatedRequest(
  url: string,
  payload: object
): Promise<Response> {
  const body = JSON.stringify(payload);
  const { signature, timestamp } = signPortalRequest(body);

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Portal-Signature': signature,
      'X-Portal-Timestamp': timestamp,
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY || ''}`,
    },
    body,
  });
}
```

### 6.7 Contract Summary

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        BOUNDARY: Agent Portal                            │
│                                                                          │
│  Provides:                    Consumes:                                  │
│  ─ Event Stream (SSE)         ─ Agent Responses (webhook/POST)          │
│  ─ Event History (REST)       ─ Scraped Data (webhook)                  │
│  ─ Agent Registry (REST)      ─ Orchestrated Actions (webhook)          │
│  ─ User Context (REST)        ─ Agent Heartbeats (POST)                 │
│  ─ Frontend State (REST)                                                 │
│  ─ Webhook Endpoints (POST)                                              │
│                                                                          │
│  Guarantees:                                                             │
│  ─ All valid events reach SSE within 100ms of ingestion                  │
│  ─ Events stored with monotonic sequence numbers                         │
│  ─ Schema validation rejects invalid events (never reaches frontend)     │
│  ─ Circuit breaker protects backend from cascade failures                │
│  ─ Replay queue preserves events during backend downtime (1hr TTL)       │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                     TRANSPORT: HTTP/REST + SSE                           │
│  Auth: Shared secrets, HMAC signatures, API keys                         │
│  Retry: Exponential backoff with jitter                                  │
│  Timeout: 30s per request                                                │
├──────────────────────────────────────────────────────────────────────────┤
│                        BOUNDARY: Backend (xsy/Juan)                      │
│                                                                          │
│  Provides:                    Consumes:                                  │
│  ─ Agent Responses            ─ Event Stream (SSE listener)              │
│  ─ Scraped Data               ─ Event History (polling)                  │
│  ─ Orchestrated Actions       ─ User Context (REST)                      │
│  ─ Agent Capabilities         ─ Frontend State (REST)                    │
│                               ─ Webhook endpoints (POST)                 │
│                                                                          │
│  Guarantees:                                                             │
│  ─ All responses are valid PortalEvents                                  │
│  ─ Heartbeat sent every 30s while active                                 │
│  ─ Respects rate limits (backs off on 429)                               │
│  ─ Handles 5xx gracefully (retries with backoff)                         │
│  ─ Validates webhook responses and alerts on persistent errors           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Extension Points Reference

| Extension Point | Current | Future Use | How to Extend |
|-----------------|---------|------------|---------------|
| **Provider adapter** | `providerTypes.ts` — `ChatRequest`, `ChatResponse` | Add Claude, Gemini, Ollama, local models | Implement `ProviderAdapter` interface → register in `providerRegistry` with priority + tags |
| **Event types** | 18 types in `PortalEventType` | Add `agent.request`, `agent.response`, `agent.interrupt`, custom domain events | Extend `PortalEventType` enum → add payload schema → update `validatePortalEvent` → update frontend handlers |
| **Event store** | In-memory array (`eventStore.ts`) | Redis, PostgreSQL, Upstash | Replace `addEvent`/`getRecentEvents` implementations; keep same interface |
| **Event broadcast** | In-memory SSE (`stream/route.ts`) | Redis Pub/Sub, Ably, Pusher | Replace SSE source; keep same event envelope format |
| **Webhook sources** | None | OpenClaw, Hermes, Scrapers, Zapier | Add source config to `webhookSources.ts` → implement `EventNormalizer` → create `[source]/route.ts` (or use dynamic route) |
| **Event normalizer** | Inline validation in webhook route | Per-source normalizers with middleware chains | Implement `EventNormalizer` interface → compose with `dedupeMiddleware` + `enrichmentMiddleware` |
| **Agent registry** | Static array in `starterAgents.ts` | Dynamic agent discovery from backend | Use `agentRegistry` class → backend registers agents via POST → heartbeat monitoring |
| **Agent capabilities** | Hardcoded per agent | Dynamic capability advertisement | Add `capabilities[]` to `RegisteredAgent` → backend provides capability schemas |
| **Agent communication** | None (agents are independent) | Agent-to-agent requests, interrupts, broadcasts | Use `agent.request`/`agent.response`/`agent.interrupt` event types → `AgentContextStore` for shared memory |
| **Auth middleware** | Basic auth on `/admin` | NextAuth, Clerk, API keys, HMAC | Replace `middleware.ts` auth logic → keep route handlers unchanged |
| **Rate limiting** | None | Per-source, per-IP, per-user | Add `SlidingWindowRateLimiter` middleware → configure per route |
| **Config store** | Static objects in route files | Database-backed, admin-editable | Replace in-memory objects with DB calls → add cache layer |
| **Circuit breaker** | None | Backend communication protection | Add `CircuitBreaker` class → wrap all outbound backend calls |
| **Event replay** | None | Queue events when backend is down | Add `EventReplayQueue` → integrate with circuit breaker state changes |
| **Context store** | None (React context only) | Cross-agent shared memory | Use `AgentContextStore` → TTL eviction → scope-based access control |
| **Admin API** | `keys`, `config`, `prompts`, `features`, `logs` | Webhook source management, agent registry CRUD, circuit breaker status | Add routes to `/api/admin/*` → reuse existing auth pattern |
| **Health checks** | Static `status: ok` | Per-provider health, per-source health, backend connectivity | Implement `ProviderAdapter.healthCheck()` → source health endpoint |
| **Observability** | Console logs, admin logs panel | Structured logging, metrics, tracing | Replace `console.log` with logger interface → add OpenTelemetry middleware |

---

## Appendix A: File Structure (Proposed)

```
src/app/
├── lib/
│   ├── providers/
│   │   ├── providerTypes.ts          # Extended ProviderAdapter interface
│   │   ├── providerRegistry.ts       # Registry + resolution
│   │   ├── openRouterProvider.ts     # OpenRouter adapter
│   │   ├── mockProvider.ts           # Mock adapter (always available)
│   │   └── bootProviders.ts          # Registration at app startup
│   ├── events/
│   │   ├── eventTypes.ts             # PortalEvent + extended types
│   │   ├── eventStore.ts             # Pluggable store (in-memory now)
│   │   ├── eventValidator.ts         # Strict validation
│   │   ├── eventBroadcaster.ts       # SSE broadcast logic
│   │   └── mockEvents.ts             # Mock event generator
│   ├── webhooks/
│   │   ├── webhookSources.ts         # Source registry + config
│   │   ├── webhookAuth.ts            # Auth middleware (secret, HMAC, API key)
│   │   ├── rateLimiter.ts            # Sliding window rate limiter
│   │   ├── normalizeEvent.ts         # Normalizer dispatcher
│   │   ├── normalizerTypes.ts        # Normalizer interface
│   │   ├── normalizers/
│   │   │   ├── openClawNormalizer.ts
│   │   │   ├── hermesNormalizer.ts
│   │   │   ├── scraperNormalizer.ts
│   │   │   └── genericNormalizer.ts
│   │   └── normalizationChain.ts     # Composable middleware
│   ├── agents/
│   │   ├── agentTypes.ts             # Agent + ProviderConfig types
│   │   ├── starterAgents.ts          # Nova, Jinx, Atlas definitions
│   │   ├── agentRegistry.ts          # Runtime agent registry
│   │   └── agentContextStore.ts      # Shared cross-agent memory
│   ├── config/
│   │   └── serverConfig.ts           # Env var accessors
│   └── circuits/
│       ├── circuitBreaker.ts         # Fault tolerance
│       └── eventReplayQueue.ts       # Downtime event queue
├── api/
│   ├── agent/
│   │   ├── chat/route.ts             # Unified chat (all providers)
│   │   ├── stream/route.ts           # SSE event stream
│   │   ├── events/route.ts           # Event CRUD
│   │   └── registry/route.ts         # Agent registry API
│   ├── webhook/
│   │   └── [source]/route.ts         # Dynamic webhook handler
│   ├── admin/
│   │   ├── keys/route.ts
│   │   ├── config/route.ts
│   │   ├── prompts/route.ts
│   │   ├── features/route.ts
│   │   ├── logs/route.ts
│   │   ├── sources/route.ts          # NEW: webhook source management
│   │   └── circuit-status/route.ts   # NEW: circuit breaker status
│   └── health/route.ts               # Health check (+ provider status)
```

## Appendix B: Environment Variables

| Variable | Purpose | Phase |
|----------|---------|-------|
| `OPENROUTER_API_KEY` | OpenRouter API key | 1.5 |
| `OPENROUTER_MODEL` | Default model (default: `openai/gpt-4o-mini`) | 1.5 |
| `ADMIN_PASSWORD` | Basic auth for admin panel | 1.5 |
| `WEBHOOK_SECRET_OPENCLAW` | Shared secret for OpenClaw webhooks | 2 |
| `WEBHOOK_SECRET_HERMES` | HMAC secret for Hermes webhooks | 2 |
| `WEBHOOK_SECRET_SCRAPERS` | API key for scraper webhooks | 2 |
| `WEBHOOK_SECRET_GENERIC` | Shared secret for generic webhooks | 2 |
| `BACKEND_API_KEY` | API key for portal → backend calls | 2 |
| `PORTAL_SIGNING_SECRET` | HMAC secret for portal request signing | 2 |
| `RATE_LIMIT_ENABLED` | Enable/disable rate limiting | 2 |
| `CIRCUIT_BREAKER_THRESHOLD` | Failures before opening (default: 5) | 2 |
| `CIRCUIT_BREAKER_RECOVERY_MS` | Recovery timeout (default: 30000) | 2 |
| `EVENT_STORE_BACKEND` | `memory` \| `redis` \| `database` | 2+ |
| `REDIS_URL` | Redis connection (if using Redis event store) | 2+ |
| `MAX_REPLAY_QUEUE_SIZE` | Max queued events for replay (default: 1000) | 2 |
| `REPLAY_QUEUE_TTL_MS` | Event replay TTL (default: 3600000) | 2 |

---

## Appendix C: Sequence Diagram — Full Webhook Flow

```
External System          Agent Portal                    Internal
     │                         │                              │
     │ POST /api/webhook/openclaw                           │
     │ X-OpenClaw-Secret: ***                               │
     │ { eventType, data, timestamp }                         │
     │ ───────────────────────▶                               │
     │                         │                              │
     │                    [1] Extract source=openclaw         │
     │                    [2] Authenticate (shared_secret)    │
     │                    [3] Rate limit check                │
     │                    [4] Parse JSON                      │
     │                    [5] Validate payload schema         │
     │                         │                              │
     │                    [6] Normalize (OpenClawNormalizer)  │
     │                         │ ─────────▶                   │
     │                         │                              │
     │                    [7] Run middleware chain:           │
     │                       - dedupe check                   │
     │                       - enrichment (_sourceSystem)     │
     │                         │                              │
     │                    [8] validatePortalEvent()           │
     │                         │                              │
     │                    [9] addEvent()                      │
     │                         │ ─────────▶ Event Store       │
     │                         │                              │
     │                   [10] broadcastEvent()                │
     │                         │ ─────────▶ SSE Clients       │
     │                         │                              │
     │ ◀───────────────────────│                              │
     │ 201 { success, eventId, sequence }                     │
     │                         │                              │
```

---

*Document version: Phase 2 Design — generated for xsy + Juan implementation.*
