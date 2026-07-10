// ============================================
// Session budget ledger — the enforcement layer.
//
// Phase 2 designed the budget math (computeBudgetStatus, degradation
// settings) but nothing ever tracked usage or gated a call. This module
// is the missing middle: an in-memory per-session ledger the chat route
// consults BEFORE spending tokens and settles AFTER the provider replies.
//
// Degradation ladder (per the Phase 2 token-budget doc):
//   healthy  → full replies
//   warning  → completion capped harder (shorter replies)
//   critical → canned/template replies only (no LLM call)
//   exhausted→ visual-only: chat answers with a mock nudge
//
// In-memory by design — Phase 3's persistent memory can swap the Map
// for Redis without touching callers.
// ============================================

import { computeBudgetStatus } from './budgetManager';
import { DEFAULT_BUDGET_CONFIG } from './config';
import type { BudgetStatus, TokenBudget } from './types';

export interface SessionLedgerEntry {
  sessionId: string;
  tokensUsed: number;
  totalBudget: number;
  status: BudgetStatus;
  apiCalls: number;
  startedAt: number;
  lastSeenAt: number;
}

export interface BudgetDecision {
  /** Whether a real LLM call is allowed right now */
  allowLlm: boolean;
  /** Completion-token cap to pass to the provider (when allowed) */
  maxTokens: number;
  status: BudgetStatus;
  tokensUsed: number;
  totalBudget: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // forget sessions idle > 30 min
const HEALTHY_MAX_TOKENS = 256;
const WARNING_MAX_TOKENS = 96;

const ledger = new Map<string, SessionLedgerEntry>();

function sweep(now: number): void {
  for (const [id, entry] of ledger) {
    if (now - entry.lastSeenAt > SESSION_TTL_MS) ledger.delete(id);
  }
}

function getEntry(sessionId: string): SessionLedgerEntry {
  const now = Date.now();
  if (ledger.size > 500) sweep(now);
  let entry = ledger.get(sessionId);
  if (!entry) {
    entry = {
      sessionId,
      tokensUsed: 0,
      totalBudget: DEFAULT_BUDGET_CONFIG.defaultSessionBudget,
      status: 'healthy',
      apiCalls: 0,
      startedAt: now,
      lastSeenAt: now,
    };
    ledger.set(sessionId, entry);
  }
  entry.lastSeenAt = now;
  return entry;
}

/** Recompute status through the hysteresis state machine. */
function refreshStatus(entry: SessionLedgerEntry): void {
  const budgetView = {
    tokensUsed: entry.tokensUsed,
    totalBudget: entry.totalBudget,
    status: entry.status,
  } as TokenBudget;
  entry.status = computeBudgetStatus(budgetView, DEFAULT_BUDGET_CONFIG);
}

/** Consult the ledger before spending tokens. */
export function checkBudget(sessionId: string): BudgetDecision {
  const entry = getEntry(sessionId);
  refreshStatus(entry);

  const overCallLimit = entry.apiCalls >= DEFAULT_BUDGET_CONFIG.maxApiCallsPerSession;
  const allowLlm = !overCallLimit && (entry.status === 'healthy' || entry.status === 'warning');

  return {
    allowLlm,
    maxTokens: entry.status === 'warning' ? WARNING_MAX_TOKENS : HEALTHY_MAX_TOKENS,
    status: overCallLimit && entry.status === 'healthy' ? 'critical' : entry.status,
    tokensUsed: entry.tokensUsed,
    totalBudget: entry.totalBudget,
  };
}

/** Settle actual usage after a provider call. */
export function recordUsage(sessionId: string, tokens: number): SessionLedgerEntry {
  const entry = getEntry(sessionId);
  entry.tokensUsed += Math.max(0, tokens);
  entry.apiCalls += 1;
  refreshStatus(entry);
  return entry;
}

/** Read-only snapshot for admin/observability endpoints. */
export function listSessions(): SessionLedgerEntry[] {
  return Array.from(ledger.values());
}

/** Test hook — clear all ledger state. */
export function resetLedger(): void {
  ledger.clear();
}
