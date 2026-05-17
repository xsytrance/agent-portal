import { BudgetConfig } from './types';

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  // Session budgets
  defaultSessionBudget: 4000,
  mockModeBudget: Number.MAX_SAFE_INTEGER,
  developmentModeBudget: 8000,
  productionModeBudget: 4000,

  // Per-tier limits
  maxFreeActionsPerSession: 500,
  maxCheapActionsPerSession: 100,
  maxExpensiveActionsPerSession: 20,

  // Rate limits
  maxTokensPerMinute: 1500,
  maxTokensPerFiveMinutes: 3000,
  maxApiCallsPerMinute: 5,
  maxApiCallsPerSession: 20,

  // Status thresholds (percentages)
  warningThreshold: 0.60,
  criticalThreshold: 0.85,
  exhaustedThreshold: 1.00,

  // Per-agent budgets
  agentBudgets: [
    { agentId: 'nova',   maxTokensPerSession: 2500, maxExpensiveEvents: 12, priority: 1, enabled: true },
    { agentId: 'jinx',   maxTokensPerSession: 1500, maxExpensiveEvents: 8,  priority: 2, enabled: true },
    { agentId: 'default', maxTokensPerSession: 0,   maxExpensiveEvents: 0,  priority: 3, enabled: false },
  ],

  // Degradation settings
  degradationSettings: {
    warningCacheHitTarget: 0.70,
    warningTemplateRate: 0.50,
    warningSkipNonEssential: true,
    criticalUseOnlyTemplates: true,
    criticalUseOnlyFree: false,
    criticalAllowEmergency: true,
    exhaustedUseMock: true,
    exhaustedVisualOnly: false,
    exhaustedAllowAdminOverride: true,
  },

  // Alert settings
  alertSettings: {
    enabled: true,
    alertOnWarning: true,
    alertOnCritical: true,
    alertOnExhausted: true,
    alertOnEmergencyCutoff: true,
    cooldownMinutes: 15,
  },

  // Feature flags
  features: {
    enableRateLimiting: true,
    enableBudgetTracking: true,
    enableGracefulDegradation: true,
    enableAdminOverride: true,
    enablePerAgentBudgets: true,
    enableCostLogging: true,
    enableAlerts: true,
    enableRecoveryMode: true,
  },

  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

export function getBudgetConfig(): BudgetConfig {
  // Eventually fetch from admin config or db if required. Returning defaults for now.
  return DEFAULT_BUDGET_CONFIG;
}
