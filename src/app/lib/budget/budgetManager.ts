import { TokenBudget, BudgetConfig, BudgetStatus } from './types';

export function computeBudgetStatus(budget: TokenBudget, config: BudgetConfig): BudgetStatus {
  const usage = budget.tokensUsed / budget.totalBudget;
  const currentStatus = budget.status;

  // DOWNWARD transitions with hysteresis buffer (10%)
  if (currentStatus === 'exhausted') {
    if (usage < (config.exhaustedThreshold - 0.05)) {
      if (usage >= config.criticalThreshold) return 'critical';
      if (usage >= config.warningThreshold) return 'warning';
      return 'healthy';
    }
    return 'exhausted';
  }

  if (currentStatus === 'critical') {
    if (usage < (config.criticalThreshold - 0.05)) {
      if (usage >= config.warningThreshold) return 'warning';
      return 'healthy';
    }
    return usage >= config.exhaustedThreshold ? 'exhausted' : 'critical';
  }

  if (currentStatus === 'warning') {
    if (usage < (config.warningThreshold - 0.10)) {
      return 'healthy';
    }
    if (usage >= config.exhaustedThreshold) return 'exhausted';
    if (usage >= config.criticalThreshold) return 'critical';
    return 'warning';
  }

  // UPWARD transitions
  if (usage >= config.exhaustedThreshold) {
    return 'exhausted';
  }
  if (usage >= config.criticalThreshold) {
    return 'critical';
  }
  if (usage >= config.warningThreshold) {
    return 'warning';
  }

  return 'healthy';
}
