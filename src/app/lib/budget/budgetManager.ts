import type { BudgetStatus } from '@/app/lib/behavior/behaviorTypes';
import { warn, info } from '@/app/lib/logger';
import type { BudgetConfig, BudgetDecision, BudgetSnapshot, BudgetUsage, UsageRecord } from './budgetTypes';

const DEFAULT_CONFIG: BudgetConfig = {
  sessionTokenBudget: 4000,
  perMinuteTokenLimit: 1500,
  warningThreshold: 60,
  criticalThreshold: 85,
  emergencyCutoffThreshold: 95,
};

const usageBySession = new Map<string, BudgetUsage>();

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getBudgetConfig(): BudgetConfig {
  return {
    sessionTokenBudget: readNumberEnv('SESSION_TOKEN_BUDGET', DEFAULT_CONFIG.sessionTokenBudget),
    perMinuteTokenLimit: readNumberEnv('PER_MINUTE_TOKEN_LIMIT', DEFAULT_CONFIG.perMinuteTokenLimit),
    warningThreshold: readNumberEnv('BUDGET_WARNING_THRESHOLD', DEFAULT_CONFIG.warningThreshold),
    criticalThreshold: readNumberEnv('BUDGET_CRITICAL_THRESHOLD', DEFAULT_CONFIG.criticalThreshold),
    emergencyCutoffThreshold: readNumberEnv('BUDGET_EMERGENCY_CUTOFF_THRESHOLD', DEFAULT_CONFIG.emergencyCutoffThreshold),
  };
}

function createEmptyUsage(now: string): BudgetUsage {
  return {
    tokensUsed: 0,
    promptTokens: 0,
    completionTokens: 0,
    expensiveActionsUsed: 0,
    windowStartedAt: now,
    windowTokensUsed: 0,
    lastUpdatedAt: now,
  };
}

function getUsage(sessionId: string, now = new Date().toISOString()): BudgetUsage {
  const existing = usageBySession.get(sessionId);
  if (!existing) {
    const created = createEmptyUsage(now);
    usageBySession.set(sessionId, created);
    return created;
  }

  if (Date.now() - new Date(existing.windowStartedAt).getTime() > 60_000) {
    existing.windowStartedAt = now;
    existing.windowTokensUsed = 0;
  }

  return existing;
}

function determineStatus(usage: BudgetUsage, config: BudgetConfig): BudgetStatus {
  if (config.sessionTokenBudget <= 0) return 'exhausted';
  const utilization = (usage.tokensUsed / config.sessionTokenBudget) * 100;
  if (utilization >= config.emergencyCutoffThreshold) return 'exhausted';
  if (utilization >= config.criticalThreshold) return 'critical';
  if (utilization >= config.warningThreshold) return 'warning';
  return 'healthy';
}

export function getBudgetSnapshot(sessionId = 'default'): BudgetSnapshot {
  const config = getBudgetConfig();
  const usage = getUsage(sessionId);
  const status = determineStatus(usage, config);
  const remainingTokens = Math.max(0, config.sessionTokenBudget - usage.tokensUsed);
  const utilizationPct = config.sessionTokenBudget > 0
    ? Math.round((usage.tokensUsed / config.sessionTokenBudget) * 100)
    : 100;

  return {
    sessionId,
    status,
    config,
    usage: { ...usage },
    remainingTokens,
    utilizationPct,
  };
}

export async function assessBudgetForAction(
  sessionId: string,
  estimatedTokens: number,
  costTier: 'free' | 'cheap' | 'expensive',
): Promise<BudgetDecision> {
  const snapshot = getBudgetSnapshot(sessionId);

  if (costTier !== 'expensive') {
    return {
      allowed: true,
      status: snapshot.status,
      reason: `${costTier} action does not require token budget approval.`,
      costTier,
      estimatedTokens,
      snapshot,
    };
  }

  if (snapshot.status === 'exhausted') {
    await warn('budget', 'Blocked expensive action: budget exhausted', {
      details: { sessionId, estimatedTokens, remainingTokens: snapshot.remainingTokens },
    });
    return {
      allowed: false,
      status: snapshot.status,
      reason: 'Session budget is exhausted; expensive provider calls are disabled.',
      costTier,
      estimatedTokens,
      snapshot,
    };
  }

  if (estimatedTokens > snapshot.remainingTokens) {
    await warn('budget', 'Blocked expensive action: estimate exceeds remaining budget', {
      details: { sessionId, estimatedTokens, remainingTokens: snapshot.remainingTokens },
    });
    return {
      allowed: false,
      status: 'exhausted',
      reason: 'Estimated chat cost exceeds the remaining session budget.',
      costTier,
      estimatedTokens,
      snapshot,
    };
  }

  if (snapshot.usage.windowTokensUsed + estimatedTokens > snapshot.config.perMinuteTokenLimit) {
    await warn('budget', 'Blocked expensive action: per-minute limit exceeded', {
      details: { sessionId, estimatedTokens, windowTokensUsed: snapshot.usage.windowTokensUsed },
    });
    return {
      allowed: false,
      status: snapshot.status,
      reason: 'Per-minute token budget would be exceeded.',
      costTier,
      estimatedTokens,
      snapshot,
    };
  }

  return {
    allowed: true,
    status: snapshot.status,
    reason: 'Budget approved.',
    costTier,
    estimatedTokens,
    snapshot,
  };
}

export async function recordUsage(record: UsageRecord): Promise<BudgetSnapshot> {
  const now = new Date().toISOString();
  const usage = getUsage(record.sessionId, now);
  const tokens = Math.max(0, record.promptTokens) + Math.max(0, record.completionTokens);

  usage.tokensUsed += tokens;
  usage.promptTokens += Math.max(0, record.promptTokens);
  usage.completionTokens += Math.max(0, record.completionTokens);
  usage.windowTokensUsed += tokens;
  usage.lastUpdatedAt = now;
  if (record.costTier === 'expensive') usage.expensiveActionsUsed += 1;

  const snapshot = getBudgetSnapshot(record.sessionId);
  await info('budget', 'Recorded token usage', {
    details: {
      sessionId: record.sessionId,
      agentId: record.agentId,
      action: record.action,
      model: record.model,
      tokens,
      status: snapshot.status,
      utilizationPct: snapshot.utilizationPct,
    },
  });

  return snapshot;
}

export function listBudgetSnapshots(): BudgetSnapshot[] {
  if (usageBySession.size === 0) return [getBudgetSnapshot('default')];
  return Array.from(usageBySession.keys()).map((sessionId) => getBudgetSnapshot(sessionId));
}
