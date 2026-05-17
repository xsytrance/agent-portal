import { BudgetStatus, TokenBudget, BudgetConfig, RuntimeMode, TimeWindow, BudgetTier } from './types';

export const EMERGENCY_LIMITS = {
  MAX_TOKENS_PER_SESSION: 20000,
  MAX_API_CALLS_PER_SESSION: 50,
  MAX_API_CALLS_PER_MINUTE: 10,
  MAX_TOKENS_PER_MINUTE: 5000,
  MAX_TOKENS_PER_FIVE_MINUTES: 10000,
  MAX_SESSION_DURATION_MINUTES: 120,
  MAX_CONCURRENT_EXPENSIVE_OPS: 3,
  MAX_COST_PER_SESSION_USD: 2.00,
  MAX_COST_PER_DAY_USD: 50.00,
  MAX_COST_PER_HOUR_USD: 10.00,
} as const;

export class BudgetManager {
  private budget: TokenBudget;
  private config: BudgetConfig;

  constructor(budget: TokenBudget, config: BudgetConfig) {
    this.budget = budget;
    this.config = config;
  }

  public getBudget(): Readonly<TokenBudget> {
    return this.budget;
  }

  public updateStatus(): BudgetStatus {
    const usage = this.budget.tokensUsed / this.budget.totalBudget;
    const currentStatus = this.budget.status;

    // Emergency Overrides
    if (this.isEmergencyCutoffReached()) {
      if (!this.budget.metadata.alertsTriggered.includes('emergency_used')) {
          this.budget.metadata.alertsTriggered.push('emergency_used');
      }
      this.budget.status = 'exhausted';
      return 'exhausted';
    }

    // UPWARD transitions
    if (usage >= this.config.exhaustedThreshold) {
      this.budget.status = 'exhausted';
      return 'exhausted';
    }
    if (usage >= this.config.criticalThreshold) {
      this.budget.status = 'critical';
      return 'critical';
    }
    if (usage >= this.config.warningThreshold) {
      this.budget.status = 'warning';
      return 'warning';
    }

    // DOWNWARD transitions (hysteresis buffer)
    if (currentStatus === 'exhausted' && usage < 0.95) {
      this.budget.status = 'critical';
      return 'critical';
    }
    if (currentStatus === 'critical' && usage < this.config.criticalThreshold - 0.05) {
      this.budget.status = 'warning';
      return 'warning';
    }
    if (currentStatus === 'warning' && usage < this.config.warningThreshold - 0.10) {
      this.budget.status = 'healthy';
      return 'healthy';
    }

    return currentStatus;
  }

  private isEmergencyCutoffReached(): boolean {
    if (this.budget.tokensUsed >= EMERGENCY_LIMITS.MAX_TOKENS_PER_SESSION) return true;

    const allEvents = this.budget.minuteWindow.events.length;
    if (allEvents >= EMERGENCY_LIMITS.MAX_API_CALLS_PER_SESSION) return true;

    if (this.budget.minuteWindow.tokensUsed >= EMERGENCY_LIMITS.MAX_TOKENS_PER_MINUTE) return true;
    if (this.budget.fiveMinuteWindow.tokensUsed >= EMERGENCY_LIMITS.MAX_TOKENS_PER_FIVE_MINUTES) return true;
    if (this.budget.metadata.totalEstimatedCost >= EMERGENCY_LIMITS.MAX_COST_PER_SESSION_USD) return true;

    return false;
  }

  public canExecute(tier: BudgetTier): boolean {
    this.updateStatus();

    if (this.budget.status === 'exhausted') {
        return tier === 'free';
    }

    if (tier === 'expensive') {
       if (this.budget.expensiveActionsUsed >= this.config.maxExpensiveActionsPerSession) return false;
    } else if (tier === 'cheap') {
       if (this.budget.cheapActionsUsed >= this.config.maxCheapActionsPerSession) return false;
    } else if (tier === 'free') {
       if (this.config.maxFreeActionsPerSession > 0 && this.budget.freeActionsUsed >= this.config.maxFreeActionsPerSession) return false;
    }

    return true;
  }

  public recordEvent(eventType: string, tier: BudgetTier, tokensUsed: number = 0) {
    const now = new Date().toISOString();

    this.budget.lastActionTime = now;

    if (tier === 'expensive') this.budget.expensiveActionsUsed++;
    if (tier === 'cheap') this.budget.cheapActionsUsed++;
    if (tier === 'free') this.budget.freeActionsUsed++;

    if (tokensUsed > 0) {
       this.budget.tokensUsed += tokensUsed;
       this.updateWindow(this.budget.minuteWindow, 60000, tokensUsed, eventType, tier);
       this.updateWindow(this.budget.fiveMinuteWindow, 300000, tokensUsed, eventType, tier);

       // simplistic cost estimation for safety threshold ($0.01 per 1000 tokens)
       this.budget.metadata.totalEstimatedCost += (tokensUsed / 1000) * 0.01;
    }

    this.updateStatus();
  }

  private updateWindow(window: TimeWindow, durationMs: number, tokens: number, eventType: string, tier: BudgetTier) {
     const now = Date.now();
     const windowStart = new Date(window.windowStart).getTime();

     if (now - windowStart > durationMs) {
         window.windowStart = new Date().toISOString();
         window.tokensUsed = tokens;
         window.actionsCount = 1;
         window.apiCallsCount = tier === 'expensive' ? 1 : 0;
         window.events = [{ timestamp: new Date().toISOString(), eventType, tier, tokensConsumed: tokens }];
     } else {
         window.tokensUsed += tokens;
         window.actionsCount++;
         if (tier === 'expensive') window.apiCallsCount++;
         window.events.push({ timestamp: new Date().toISOString(), eventType, tier, tokensConsumed: tokens });
     }
  }
}

export function createInitialBudget(sessionId: string, context: { mode: RuntimeMode, apiKeyPresent: boolean, userAgent: string, ipAddress: string, referrer?: string }, config: BudgetConfig): TokenBudget {
    const now = new Date().toISOString();

    let totalBudget = config.defaultSessionBudget;
    if (context.mode === 'mock') totalBudget = config.mockModeBudget;
    else if (context.mode === 'development') totalBudget = config.developmentModeBudget;
    else if (context.mode === 'production') totalBudget = config.productionModeBudget;

    const initialWindow: TimeWindow = {
        windowStart: now,
        tokensUsed: 0,
        actionsCount: 0,
        apiCallsCount: 0,
        events: []
    };

    return {
        sessionId,
        totalBudget,
        tokensUsed: 0,
        tokensReserved: 0,
        freeActionsUsed: 0,
        cheapActionsUsed: 0,
        expensiveActionsUsed: 0,
        startTime: now,
        lastActionTime: now,
        status: 'healthy',
        minuteWindow: { ...initialWindow },
        fiveMinuteWindow: { ...initialWindow },
        agentSpending: [],
        mode: context.mode,
        apiKeyPresent: context.apiKeyPresent,
        metadata: {
            userAgent: context.userAgent,
            ipHash: context.ipAddress, // Simplified hash for now
            referrer: context.referrer || '',
            totalEstimatedCost: 0,
            alertsTriggered: [],
            adminOverride: false,
        }
    };
}
