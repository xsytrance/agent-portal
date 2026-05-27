import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { isEventAllowed, resolveFallback, FALLBACK_CHAIN } from './degradation';
import { TokenBudget, BudgetConfig, BudgetTier, BudgetStatus } from './types';

describe('degradation', () => {
  const createMockBudget = (status: BudgetStatus, alertsTriggered: string[] = []): TokenBudget => ({
    sessionId: 'test-session',
    totalBudget: 1000,
    tokensUsed: 0,
    tokensReserved: 0,
    freeActionsUsed: 0,
    cheapActionsUsed: 0,
    expensiveActionsUsed: 0,
    startTime: new Date().toISOString(),
    lastActionTime: new Date().toISOString(),
    status,
    minuteWindow: { windowStart: '', tokensUsed: 0, actionsCount: 0, apiCallsCount: 0, events: [] },
    fiveMinuteWindow: { windowStart: '', tokensUsed: 0, actionsCount: 0, apiCallsCount: 0, events: [] },
    agentSpending: [],
    mode: 'development',
    apiKeyPresent: true,
    metadata: {
      userAgent: '',
      ipHash: '',
      referrer: '',
      totalEstimatedCost: 0,
      alertsTriggered,
      adminOverride: false
    }
  });

  const createMockConfig = (
    warningTemplateRate = 0.5,
    warningSkipNonEssential = true,
    criticalAllowEmergency = true
  ): BudgetConfig => ({
    defaultSessionBudget: 4000,
    mockModeBudget: 999999,
    developmentModeBudget: 8000,
    productionModeBudget: 4000,
    maxFreeActionsPerSession: 500,
    maxCheapActionsPerSession: 100,
    maxExpensiveActionsPerSession: 20,
    maxTokensPerMinute: 1500,
    maxTokensPerFiveMinutes: 3000,
    maxApiCallsPerMinute: 5,
    maxApiCallsPerSession: 20,
    warningThreshold: 0.60,
    criticalThreshold: 0.85,
    exhaustedThreshold: 1.00,
    agentBudgets: [],
    degradationSettings: {
      warningCacheHitTarget: 0.70,
      warningTemplateRate,
      warningSkipNonEssential,
      criticalUseOnlyTemplates: true,
      criticalUseOnlyFree: false,
      criticalAllowEmergency,
      exhaustedUseMock: true,
      exhaustedVisualOnly: false,
      exhaustedAllowAdminOverride: true,
    },
    alertSettings: {
      enabled: true,
      alertOnWarning: true,
      alertOnCritical: true,
      alertOnExhausted: true,
      alertOnEmergencyCutoff: true,
      cooldownMinutes: 15,
    },
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
  });

  describe('isEventAllowed', () => {
    let originalRandom: typeof Math.random;

    beforeEach(() => {
      originalRandom = Math.random;
    });

    afterEach(() => {
      Math.random = originalRandom;
    });

    describe('healthy status', () => {
      it('allows all tiers', () => {
        const budget = createMockBudget('healthy');
        const config = createMockConfig();
        expect(isEventAllowed('any', 'free', budget, config)).toBe(true);
        expect(isEventAllowed('any', 'cheap', budget, config)).toBe(true);
        expect(isEventAllowed('any', 'expensive', budget, config)).toBe(true);
      });
    });

    describe('warning status', () => {
      it('allows free and cheap tiers', () => {
        const budget = createMockBudget('warning');
        const config = createMockConfig();
        expect(isEventAllowed('any', 'free', budget, config)).toBe(true);
        expect(isEventAllowed('any', 'cheap', budget, config)).toBe(true);
      });

      it('probabilistically allows expensive tiers based on warningTemplateRate', () => {
        const budget = createMockBudget('warning');
        const config = createMockConfig(0.5); // 50% rate

        // Math.random() > 0.5 -> allowed
        Math.random = () => 0.6;
        expect(isEventAllowed('any', 'expensive', budget, config)).toBe(true);

        // Math.random() <= 0.5 -> not allowed
        Math.random = () => 0.4;
        expect(isEventAllowed('any', 'expensive', budget, config)).toBe(false);
      });

      it('handles warningSkipNonEssential correctly for unknown tiers if any are passed', () => {
         const budget = createMockBudget('warning');
         const configSkip = createMockConfig(0.5, true);
         const configNoSkip = createMockConfig(0.5, false);

         // We simulate an unknown tier that falls through to the return condition
         // Since tier is neither free nor cheap nor expensive, it evaluates:
         // tier === 'free' || tier === 'cheap' || !warningSkipNonEssential
         expect(isEventAllowed('any', 'unknown' as BudgetTier, budget, configSkip)).toBe(false);
         expect(isEventAllowed('any', 'unknown' as BudgetTier, budget, configNoSkip)).toBe(true);
      });
    });

    describe('critical status', () => {
      it('allows free and cheap tiers', () => {
        const budget = createMockBudget('critical');
        const config = createMockConfig();
        expect(isEventAllowed('any', 'free', budget, config)).toBe(true);
        expect(isEventAllowed('any', 'cheap', budget, config)).toBe(true);
      });

      it('allows expensive tier if no alerts triggered and emergency allowed', () => {
        const budget = createMockBudget('critical', []);
        const config = createMockConfig(0.5, true, true);
        expect(isEventAllowed('any', 'expensive', budget, config)).toBe(true);
      });

      it('blocks expensive tier if alerts are triggered', () => {
        const budget = createMockBudget('critical', ['alert-1']);
        const config = createMockConfig(0.5, true, true);
        expect(isEventAllowed('any', 'expensive', budget, config)).toBe(false);
      });

      it('blocks expensive tier if emergency is not allowed', () => {
        const budget = createMockBudget('critical', []);
        const config = createMockConfig(0.5, true, false);
        expect(isEventAllowed('any', 'expensive', budget, config)).toBe(false);
      });
    });

    describe('exhausted status', () => {
      it('allows only free tier', () => {
        const budget = createMockBudget('exhausted');
        const config = createMockConfig();
        expect(isEventAllowed('any', 'free', budget, config)).toBe(true);
        expect(isEventAllowed('any', 'cheap', budget, config)).toBe(false);
        expect(isEventAllowed('any', 'expensive', budget, config)).toBe(false);
      });
    });

    describe('invalid status', () => {
      it('returns false for unknown status', () => {
        const budget = createMockBudget('unknown' as BudgetStatus);
        const config = createMockConfig();
        expect(isEventAllowed('any', 'free', budget, config)).toBe(false);
      });
    });
  });

  describe('resolveFallback', () => {
    let originalRandom: typeof Math.random;

    beforeEach(() => {
      originalRandom = Math.random;
    });

    afterEach(() => {
      Math.random = originalRandom;
    });

    it('returns the first allowed fallback in the chain', () => {
      // Test the chain for llm:chat_completion: ['message:cached', 'message:template', 'template:phrase', 'visual:effect']
      // Both message:cached and message:template are 'cheap'. template:phrase and visual:effect are 'free'.
      // If exhausted, only free is allowed. So it should fallback to 'template:phrase'
      const budget = createMockBudget('exhausted');
      const config = createMockConfig();

      const fallback = resolveFallback('llm:chat_completion', budget, config);
      expect(fallback).toBe('template:phrase');
    });

    it('returns visual:effect if nothing else is allowed (though free is always allowed in exhausted)', () => {
      // Force a weird budget status that blocks everything
      const budget = createMockBudget('unknown' as BudgetStatus);
      const config = createMockConfig();

      const fallback = resolveFallback('llm:chat_completion', budget, config);
      expect(fallback).toBe('visual:effect');
    });

    it('uses default fallback chain if event is not in FALLBACK_CHAIN', () => {
      const budget = createMockBudget('exhausted');
      const config = createMockConfig();

      // default chain is ['template:phrase', 'visual:effect'].
      // exhausted allows free, 'template:phrase' is free
      const fallback = resolveFallback('unknown_event', budget, config);
      expect(fallback).toBe('template:phrase');
    });

    it('probabilistically chooses fallback during warning status for expensive events', () => {
      // Create a fake chain that includes an expensive event first.
      // We will temporarily overwrite FALLBACK_CHAIN just for this test
      const originalChain = FALLBACK_CHAIN['llm:test_warning'];
      FALLBACK_CHAIN['llm:test_warning'] = ['llm:chat_completion', 'template:phrase'];

      const budget = createMockBudget('warning');
      const config = createMockConfig(0.5); // 50% rate

      // Math.random() > 0.5 -> expensive allowed
      Math.random = () => 0.6;
      expect(resolveFallback('llm:test_warning', budget, config)).toBe('llm:chat_completion');

      // Math.random() <= 0.5 -> expensive blocked, falls back to free
      Math.random = () => 0.4;
      expect(resolveFallback('llm:test_warning', budget, config)).toBe('template:phrase');

      // Cleanup
      if (originalChain) {
         FALLBACK_CHAIN['llm:test_warning'] = originalChain;
      } else {
         delete FALLBACK_CHAIN['llm:test_warning'];
      }
    });
  });
});
