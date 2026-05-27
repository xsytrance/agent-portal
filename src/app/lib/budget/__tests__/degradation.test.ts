import { describe, it, expect, spyOn, afterEach } from 'bun:test';
import { isEventAllowed, resolveFallback, FALLBACK_CHAIN } from '../degradation';
import { TokenBudget, BudgetConfig } from '../types';

describe('Budget Degradation', () => {
  const mockConfig = {
    degradationSettings: {
      warningTemplateRate: 0.5,
      warningSkipNonEssential: true,
      criticalAllowEmergency: true,
    }
  } as BudgetConfig;

  const createMockBudget = (status: TokenBudget['status'], alertsTriggered: string[] = []): TokenBudget => ({
    status,
    metadata: { alertsTriggered }
  } as TokenBudget);

  afterEach(() => {
    // Reset any spies after each test
  });

  describe('isEventAllowed', () => {
    describe('healthy status', () => {
      it('allows all tiers when healthy', () => {
        const budget = createMockBudget('healthy');
        expect(isEventAllowed('event', 'expensive', budget, mockConfig)).toBe(true);
        expect(isEventAllowed('event', 'cheap', budget, mockConfig)).toBe(true);
        expect(isEventAllowed('event', 'free', budget, mockConfig)).toBe(true);
      });
    });

    describe('warning status', () => {
      it('allows expensive tier based on Math.random and warningTemplateRate', () => {
        const budget = createMockBudget('warning');

        // Mock Math.random to return > 0.5 (allow)
        const randomSpy = spyOn(Math, 'random').mockReturnValue(0.6);
        expect(isEventAllowed('event', 'expensive', budget, mockConfig)).toBe(true);

        // Mock Math.random to return <= 0.5 (deny)
        randomSpy.mockReturnValue(0.4);
        expect(isEventAllowed('event', 'expensive', budget, mockConfig)).toBe(false);

        randomSpy.mockRestore();
      });

      it('allows cheap and free tiers', () => {
        const budget = createMockBudget('warning');
        expect(isEventAllowed('event', 'cheap', budget, mockConfig)).toBe(true);
        expect(isEventAllowed('event', 'free', budget, mockConfig)).toBe(true);
      });

      it('denies unknown tiers if warningSkipNonEssential is true', () => {
        const budget = createMockBudget('warning');
        // 'unknown' isn't a valid tier type, but we can simulate the boolean logic
        // The implementation does: tier === 'free' || tier === 'cheap' || !config.degradationSettings.warningSkipNonEssential
        const configStrict = { ...mockConfig, degradationSettings: { ...mockConfig.degradationSettings, warningSkipNonEssential: true } } as BudgetConfig;
        const configLoose = { ...mockConfig, degradationSettings: { ...mockConfig.degradationSettings, warningSkipNonEssential: false } } as BudgetConfig;

        // Use an invalid tier string typed as any to test the fallback logic
        expect(isEventAllowed('event', 'invalid' as any, budget, configStrict)).toBe(false);
        expect(isEventAllowed('event', 'invalid' as any, budget, configLoose)).toBe(true);
      });
    });

    describe('critical status', () => {
      it('allows expensive tier only if emergency allowed and no alerts triggered', () => {
        const configEmergencyAllowed = { ...mockConfig, degradationSettings: { ...mockConfig.degradationSettings, criticalAllowEmergency: true } } as BudgetConfig;
        const configEmergencyDenied = { ...mockConfig, degradationSettings: { ...mockConfig.degradationSettings, criticalAllowEmergency: false } } as BudgetConfig;

        // Emergency allowed, no alerts -> allow
        expect(isEventAllowed('event', 'expensive', createMockBudget('critical', []), configEmergencyAllowed)).toBe(true);

        // Emergency allowed, has alerts -> deny
        expect(isEventAllowed('event', 'expensive', createMockBudget('critical', ['alert1']), configEmergencyAllowed)).toBe(false);

        // Emergency denied, no alerts -> deny
        expect(isEventAllowed('event', 'expensive', createMockBudget('critical', []), configEmergencyDenied)).toBe(false);
      });

      it('always allows cheap and free tiers', () => {
        const budget = createMockBudget('critical');
        expect(isEventAllowed('event', 'cheap', budget, mockConfig)).toBe(true);
        expect(isEventAllowed('event', 'free', budget, mockConfig)).toBe(true);
      });
    });

    describe('exhausted status', () => {
      it('only allows free tier', () => {
        const budget = createMockBudget('exhausted');
        expect(isEventAllowed('event', 'free', budget, mockConfig)).toBe(true);
        expect(isEventAllowed('event', 'cheap', budget, mockConfig)).toBe(false);
        expect(isEventAllowed('event', 'expensive', budget, mockConfig)).toBe(false);
      });
    });

    describe('unknown status', () => {
      it('returns false for unknown status', () => {
        const budget = createMockBudget('unknown' as any);
        expect(isEventAllowed('event', 'free', budget, mockConfig)).toBe(false);
      });
    });
  });

  describe('resolveFallback', () => {
    it('resolves normal chain based on budget state (llm:chat_completion)', () => {
      // chain for llm:chat_completion: ['message:cached', 'message:template', 'template:phrase', 'visual:effect']
      // 'message:cached' is cheap
      // 'message:template' is cheap
      // 'template:phrase' is free
      // 'visual:effect' is free

      const config = {
        degradationSettings: {
          warningTemplateRate: 0.5,
          warningSkipNonEssential: true,
          criticalAllowEmergency: false, // critical state denies expensive
        }
      } as BudgetConfig;

      // Exhausted state: cheap ('message:cached') is denied, should fallback to free ('template:phrase')
      const exhaustedBudget = createMockBudget('exhausted');
      expect(resolveFallback('llm:chat_completion', exhaustedBudget, config)).toBe('template:phrase');

      // Healthy state: cheap is allowed, should return the first option ('message:cached')
      const healthyBudget = createMockBudget('healthy');
      expect(resolveFallback('llm:chat_completion', healthyBudget, config)).toBe('message:cached');
    });

    it('uses default chain for unknown events', () => {
      // default chain: ['template:phrase', 'visual:effect']
      const exhaustedBudget = createMockBudget('exhausted');
      // 'template:phrase' is free, which is allowed in exhausted
      expect(resolveFallback('unknown:event', exhaustedBudget, mockConfig)).toBe('template:phrase');
    });

    it('returns ultimate fallback visual:effect in worst-case scenario', () => {
      // If we pass an unknown budget status, isEventAllowed always returns false
      const invalidBudget = createMockBudget('invalid_status' as any);
      expect(resolveFallback('llm:chat_completion', invalidBudget, mockConfig)).toBe('visual:effect');
    });
  });
});
