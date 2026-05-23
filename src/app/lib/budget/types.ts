// Phase 2b Intelligence Models

export type BudgetTier = 'free' | 'cheap' | 'expensive';
export type BudgetStatus = 'healthy' | 'warning' | 'critical' | 'exhausted';
export type RuntimeMode = 'mock' | 'development' | 'production';

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

export interface TimeWindow {
  windowStart: string;
  tokensUsed: number;
  actionsCount: number;
  apiCallsCount: number;
  events: WindowEvent[];
}

export interface WindowEvent {
  timestamp: string;
  eventType: string;
  tier: BudgetTier;
  tokensConsumed: number;
  agentId?: string;
  userId?: string;
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

export interface ProviderDecision {
  provider: 'openrouter' | 'cache' | 'template' | 'mock' | 'none';
  reason: string;
  tier: BudgetTier;
  estimatedTokens: number;
  estimatedCost: number;
  fallbackChain?: string[];
}

export interface CostLog {
  logId: string;
  sessionId: string;
  timestamp: string;
  eventType: string;
  tier: BudgetTier;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
  actualCostUsd: number;
  provider: string;
  model?: string;
  agentId: string;
  agentName: string;
  userId?: string;
  wasDegraded: boolean;
  originalEventType?: string;
  fallbackChain?: string[];
  latencyMs: number;
  cacheHit: boolean;
  budgetStatusBefore: BudgetStatus;
  budgetStatusAfter: BudgetStatus;
  tokensRemainingAfter: number;
}

export interface DailyCostRollup {
  date: string;
  totalSessions: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  totalEvents: number;
  freeEventsTotal: number;
  cheapEventsTotal: number;
  expensiveEventsTotal: number;
  agentDailyBreakdown: AgentDailyCost[];
  topEventTypes: EventTypeCost[];
  warningCount: number;
  criticalCount: number;
  exhaustedCount: number;
  emergencyCount: number;
}

export interface AgentDailyCost {
  agentId: string;
  agentName: string;
  tokensUsed: number;
  costUsd: number;
  sessionsCount: number;
  eventsCount: number;
}

export interface EventTypeCost {
  eventType: string;
  tier: BudgetTier;
  totalTokens: number;
  totalCostUsd: number;
  callCount: number;
  avgCostPerCall: number;
  avgTokensPerCall: number;
}

export interface StatusTransition {
  from: BudgetStatus;
  to: BudgetStatus;
  timestamp: string;
  trigger: string;
  usagePercentAtTransition: number;
}

export interface BudgetAlert {
  alertId: string;
  type: BudgetAlertType;
  severity: AlertSeverity;
  sessionId: string;
  budgetStatus: BudgetStatus;
  tokensUsed: number;
  totalBudget: number;
  usagePercent: number;
  estimatedCostUsd: number;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  channels: AlertChannel[];
  message: string;
  relatedAlertIds: string[];
  isDuplicate: boolean;
}

export type BudgetAlertType =
  | 'status_warning'
  | 'status_critical'
  | 'status_exhausted'
  | 'rate_limit_approaching'
  | 'rate_limit_exceeded'
  | 'emergency_cutoff'
  | 'agent_budget_exceeded'
  | 'daily_cost_threshold'
  | 'hourly_cost_threshold'
  | 'unusual_spike'
  | 'admin_override_used'
  | 'session_timeout';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export interface AlertChannel {
  type: 'webhook' | 'email' | 'in_app' | 'log';
  destination: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
  error?: string;
}

export interface CostLogFilters {
  // Add specific filter fields if needed in the future
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ActiveSessionView {
  sessionId: string;
  agentName: string;
  status: BudgetStatus;
  tokensUsed: number;
  totalBudget: number;
  usagePercent: number;
  durationMinutes: number;
  lastActionAgoSeconds: number;
  eventCounts: {
    free: number;
    cheap: number;
    expensive: number;
  };
  estimatedCostUsd: number;
  canInject: boolean;
}

export interface AdminBudgetAPI {
  getActiveSessions(): Promise<ActiveSessionView[]>;
  getSessionBudget(sessionId: string): Promise<TokenBudget>;
  getCostHistory(startDate: string, endDate: string): Promise<DailyCostRollup[]>;
  getAgentBreakdown(period: 'day' | 'week' | 'month'): Promise<AgentDailyCost[]>;
  getActiveAlerts(): Promise<BudgetAlert[]>;
  getConfig(): Promise<BudgetConfig>;
  updateConfig(updates: Partial<BudgetConfig>): Promise<BudgetConfig>;
  injectBudget(sessionId: string, tokens: number, reason: string): Promise<TokenBudget>;
  forceSessionClose(sessionId: string, reason: string): Promise<void>;
  toggleEmergencyMode(active: boolean, reason: string): Promise<void>;
  acknowledgeAlert(alertId: string): Promise<void>;
  resetDailyCounters(): Promise<void>;
  exportCostLogs(format: 'csv' | 'json', filters: CostLogFilters): Promise<Blob>;
}
export interface EventTierRegistry { [eventType: string]: { tier: BudgetTier; estimatedTokens: number; requiresAuth: boolean; cacheable: boolean; fallbackEvent: string; }; }
