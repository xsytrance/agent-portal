import type { BudgetStatus, CostTier } from '@/app/lib/behavior/behaviorTypes';

export interface BudgetConfig {
  sessionTokenBudget: number;
  perMinuteTokenLimit: number;
  warningThreshold: number;
  criticalThreshold: number;
  emergencyCutoffThreshold: number;
}

export interface BudgetUsage {
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  expensiveActionsUsed: number;
  windowStartedAt: string;
  windowTokensUsed: number;
  lastUpdatedAt: string;
}

export interface BudgetSnapshot {
  sessionId: string;
  status: BudgetStatus;
  config: BudgetConfig;
  usage: BudgetUsage;
  remainingTokens: number;
  utilizationPct: number;
}

export interface BudgetDecision {
  allowed: boolean;
  status: BudgetStatus;
  reason: string;
  costTier: CostTier;
  estimatedTokens: number;
  snapshot: BudgetSnapshot;
}

export interface UsageRecord {
  sessionId: string;
  agentId: string;
  action: string;
  costTier: CostTier;
  promptTokens: number;
  completionTokens: number;
  model?: string;
}
