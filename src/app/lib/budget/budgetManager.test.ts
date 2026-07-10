import { describe, it, expect } from 'bun:test';
import { computeBudgetStatus } from './budgetManager';
import { TokenBudget, BudgetConfig, BudgetStatus } from './types';

function createMockBudget(tokensUsed: number, totalBudget: number, status: BudgetStatus): TokenBudget {
  return {
    tokensUsed,
    totalBudget,
    status,
  } as TokenBudget;
}

function createMockConfig(warning: number, critical: number, exhausted: number): BudgetConfig {
  return {
    warningThreshold: warning,
    criticalThreshold: critical,
    exhaustedThreshold: exhausted,
  } as BudgetConfig;
}

describe('computeBudgetStatus', () => {
  const config = createMockConfig(0.5, 0.8, 1.0);

  describe('UPWARD transitions', () => {
    it('returns healthy when below warning threshold', () => {
      const budget = createMockBudget(40, 100, 'healthy');
      expect(computeBudgetStatus(budget, config)).toBe('healthy');
    });

    it('returns warning when crossing warning threshold', () => {
      const budget = createMockBudget(50, 100, 'healthy');
      expect(computeBudgetStatus(budget, config)).toBe('warning');
    });

    it('returns critical when crossing critical threshold', () => {
      const budget = createMockBudget(80, 100, 'healthy');
      expect(computeBudgetStatus(budget, config)).toBe('critical');
    });

    it('returns exhausted when crossing exhausted threshold', () => {
      const budget = createMockBudget(100, 100, 'healthy');
      expect(computeBudgetStatus(budget, config)).toBe('exhausted');
    });
  });

  describe('DOWNWARD transitions with hysteresis buffer', () => {
    it('drops to critical if usage drops below exhausted threshold minus buffer', () => {
      // 0.94 < (1.0 - 0.05) => 0.94 < 0.95 (true)
      const budget = createMockBudget(94, 100, 'exhausted');
      expect(computeBudgetStatus(budget, config)).toBe('critical');
    });

    it('stays exhausted if usage is between exhaustedThreshold and exhaustedThreshold - buffer', () => {
      const budget = createMockBudget(96, 100, 'exhausted');
      expect(computeBudgetStatus(budget, config)).toBe('exhausted');
    });

    it('drops to warning if usage is below critical threshold minus buffer', () => {
      // 0.74 < (0.8 - 0.05) => 0.74 < 0.75 (true)
      const budget = createMockBudget(74, 100, 'critical');
      expect(computeBudgetStatus(budget, config)).toBe('warning');
    });

    it('stays critical if usage is between criticalThreshold and criticalThreshold - buffer', () => {
      const budget = createMockBudget(76, 100, 'critical');
      expect(computeBudgetStatus(budget, config)).toBe('critical');
    });

    it('drops to healthy if usage drops below warning threshold minus buffer', () => {
      const budget = createMockBudget(39, 100, 'warning');
      expect(computeBudgetStatus(budget, config)).toBe('healthy');
    });

    it('stays warning if usage is between warningThreshold and warningThreshold - buffer', () => {
      const budget = createMockBudget(45, 100, 'warning');
      expect(computeBudgetStatus(budget, config)).toBe('warning');
    });
  });

  describe('edge cases', () => {
    it('returns exhausted when totalBudget is 0 (Infinity usage)', () => {
      const budget = createMockBudget(10, 0, 'healthy');
      expect(computeBudgetStatus(budget, config)).toBe('exhausted');
    });

    it('returns current status when both totalBudget and tokensUsed are 0 (NaN usage)', () => {
      const budget = createMockBudget(0, 0, 'healthy');
      expect(computeBudgetStatus(budget, config)).toBe('healthy');
    });

    it('handles negative tokens used by defaulting to current status / healthy logic', () => {
      const budget = createMockBudget(-10, 100, 'healthy');
      expect(computeBudgetStatus(budget, config)).toBe('healthy');
    });
  });
});
