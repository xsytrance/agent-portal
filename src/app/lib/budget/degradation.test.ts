import { describe, it, expect, spyOn, afterEach } from 'bun:test';
import { isEventAllowed, resolveFallback } from './degradation';
import { TokenBudget, BudgetConfig, BudgetTier, BudgetStatus } from './types';

function createMockBudget(status: BudgetStatus = 'healthy', alertsTriggered: string[] = []): TokenBudget {
  return {
    status,
    metadata: {
      alertsTriggered,
    }
  } as unknown as TokenBudget;
}

function createMockConfig(overrides: any = {}): BudgetConfig {
  return {
    degradationSettings: {
      warningTemplateRate: 0.5,
      warningSkipNonEssential: true,
      criticalAllowEmergency: false,
      ...overrides
    }
  } as unknown as BudgetConfig;
}

describe('degradation', () => {
  afterEach(() => {
    if (typeof (Math.random as any).mockRestore === 'function') {
      (Math.random as any).mockRestore();
    }
  });

  describe('isEventAllowed', () => {
    it('returns true for all tiers when status is healthy', () => {
      const budget = createMockBudget('healthy');
      const config = createMockConfig();

      expect(isEventAllowed('any_event', 'free', budget, config)).toBe(true);
      expect(isEventAllowed('any_event', 'cheap', budget, config)).toBe(true);
      expect(isEventAllowed('any_event', 'expensive', budget, config)).toBe(true);
    });

    it('handles warning status for expensive tier based on template rate', () => {
      const budget = createMockBudget('warning');
      const config = createMockConfig({ warningTemplateRate: 0.5 });

      const randomSpy = spyOn(Math, 'random');

      randomSpy.mockReturnValue(0.6);
      expect(isEventAllowed('llm:chat_completion', 'expensive', budget, config)).toBe(true);

      randomSpy.mockReturnValue(0.4);
      expect(isEventAllowed('llm:chat_completion', 'expensive', budget, config)).toBe(false);

      randomSpy.mockRestore();
    });

    it('handles warning status for free/cheap tier', () => {
      const budget = createMockBudget('warning');
      const config = createMockConfig({ warningSkipNonEssential: true });

      expect(isEventAllowed('eye:blink', 'free', budget, config)).toBe(true);
      expect(isEventAllowed('summary:simple', 'cheap', budget, config)).toBe(true);
    });

    it('handles critical status for expensive tier based on emergency and alerts', () => {
      const budgetNoAlerts = createMockBudget('critical', []);
      const configEmergencyAllowed = createMockConfig({ criticalAllowEmergency: true });
      expect(isEventAllowed('llm:chat_completion', 'expensive', budgetNoAlerts, configEmergencyAllowed)).toBe(true);

      const budgetAlerts = createMockBudget('critical', ['alert-1']);
      expect(isEventAllowed('llm:chat_completion', 'expensive', budgetAlerts, configEmergencyAllowed)).toBe(false);

      const configNoEmergency = createMockConfig({ criticalAllowEmergency: false });
      expect(isEventAllowed('llm:chat_completion', 'expensive', budgetNoAlerts, configNoEmergency)).toBe(false);
    });

    it('handles critical status for free/cheap tier', () => {
      const budget = createMockBudget('critical');
      const config = createMockConfig();
      expect(isEventAllowed('eye:blink', 'free', budget, config)).toBe(true);
      expect(isEventAllowed('summary:simple', 'cheap', budget, config)).toBe(true);
    });

    it('handles exhausted status - only allows free tier', () => {
      const budget = createMockBudget('exhausted');
      const config = createMockConfig();
      expect(isEventAllowed('eye:blink', 'free', budget, config)).toBe(true);
      expect(isEventAllowed('summary:simple', 'cheap', budget, config)).toBe(false);
      expect(isEventAllowed('llm:chat_completion', 'expensive', budget, config)).toBe(false);
    });

    it('returns false for default/unknown status', () => {
      const budget = createMockBudget('unknown_status' as BudgetStatus);
      const config = createMockConfig();
      expect(isEventAllowed('eye:blink', 'free', budget, config)).toBe(false);
    });
  });

  describe('resolveFallback', () => {
    it('returns the first allowed fallback in the chain', () => {
      const budget = createMockBudget('exhausted');
      const config = createMockConfig();

      const fallback = resolveFallback('llm:chat_completion', budget, config);
      expect(fallback).toBe('template:phrase');
    });

    it('returns default template:phrase if event not in chain and fallback allowed', () => {
      const budget = createMockBudget('exhausted');
      const config = createMockConfig();

      const fallback = resolveFallback('unknown_event', budget, config);
      expect(fallback).toBe('template:phrase');
    });

    it('returns visual:effect if everything else fails', () => {
      const budget = createMockBudget('unknown_status' as BudgetStatus);
      const config = createMockConfig();

      const fallback = resolveFallback('llm:chat_completion', budget, config);
      expect(fallback).toBe('visual:effect');
    });

    it('returns the first allowed event which could be expensive if budget is healthy', () => {
      const budget = createMockBudget('healthy');
      const config = createMockConfig();

      const fallback = resolveFallback('llm:chat_completion', budget, config);
      expect(fallback).toBe('message:cached');
    });
  });
});
