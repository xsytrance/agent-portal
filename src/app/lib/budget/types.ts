export type BudgetTier = 'free' | 'cheap' | 'expensive';

export type BudgetStatus = 'healthy' | 'warning' | 'critical' | 'exhausted';

export type RuntimeMode = 'mock' | 'development' | 'production';

export interface WindowEvent {
  timestamp: string;
  eventType: string;
  tier: BudgetTier;
  tokensConsumed: number;
  agentId?: string;
  userId?: string;
}

export interface TimeWindow {
  windowStart: string;
  tokensUsed: number;
  actionsCount: number;
  apiCallsCount: number;
  events: WindowEvent[];
}

export interface AgentSpending {
  agentId: string;
  agentName: string;
  tokensUsed: number;
  expensiveEventsCount: number;
  cheapEventsCount: number;
  freeEventsCount: number;
  budgetAllocation: number;
  lastUsed: string;
}

export interface BudgetMetadata {
  userAgent: string;
  ipHash: string;
  referrer: string;
  totalEstimatedCost: number;
  alertsTriggered: string[];
  adminOverride: boolean;
}

export interface TokenBudget {
  sessionId: string;
  totalBudget: number;
  tokensUsed: number;
  tokensReserved: number;
  freeActionsUsed: number;
  cheapActionsUsed: number;
  expensiveActionsUsed: number;
  startTime: string;
  lastActionTime: string;
  status: BudgetStatus;
  minuteWindow: TimeWindow;
  fiveMinuteWindow: TimeWindow;
  agentSpending: AgentSpending[];
  mode: RuntimeMode;
  apiKeyPresent: boolean;
  metadata: BudgetMetadata;
}

export interface AgentBudgetAllocation {
  agentId: string;
  maxTokensPerSession: number;
  maxExpensiveEvents: number;
  priority: number;
  enabled: boolean;
}

export interface DegradationSettings {
  warningCacheHitTarget: number;
  warningTemplateRate: number;
  warningSkipNonEssential: boolean;
  criticalUseOnlyTemplates: boolean;
  criticalUseOnlyFree: boolean;
  criticalAllowEmergency: boolean;
  exhaustedUseMock: boolean;
  exhaustedVisualOnly: boolean;
  exhaustedAllowAdminOverride: boolean;
}

export interface AlertSettings {
  enabled: boolean;
  webhookUrl?: string;
  emailRecipients?: string[];
  alertOnWarning: boolean;
  alertOnCritical: boolean;
  alertOnExhausted: boolean;
  alertOnEmergencyCutoff: boolean;
  cooldownMinutes: number;
}

export interface BudgetFeatureFlags {
  enableRateLimiting: boolean;
  enableBudgetTracking: boolean;
  enableGracefulDegradation: boolean;
  enableAdminOverride: boolean;
  enablePerAgentBudgets: boolean;
  enableCostLogging: boolean;
  enableAlerts: boolean;
  enableRecoveryMode: boolean;
}

export interface BudgetConfig {
  defaultSessionBudget: number;
  mockModeBudget: number;
  developmentModeBudget: number;
  productionModeBudget: number;
  maxFreeActionsPerSession: number;
  maxCheapActionsPerSession: number;
  maxExpensiveActionsPerSession: number;
  maxTokensPerMinute: number;
  maxTokensPerFiveMinutes: number;
  maxApiCallsPerMinute: number;
  maxApiCallsPerSession: number;
  warningThreshold: number;
  criticalThreshold: number;
  exhaustedThreshold: number;
  agentBudgets: AgentBudgetAllocation[];
  degradationSettings: DegradationSettings;
  alertSettings: AlertSettings;
  features: BudgetFeatureFlags;
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface EventTierRegistryEntry {
  tier: BudgetTier;
  estimatedTokens: number;
  requiresAuth: boolean;
  cacheable: boolean;
  fallbackEvent: string;
}

export interface EventTierRegistry {
  [eventType: string]: EventTierRegistryEntry;
}
