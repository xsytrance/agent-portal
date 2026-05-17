import { TokenBudget, BudgetConfig, BudgetStatus } from './types';

export function computeBudgetStatus(budget: TokenBudget, config: BudgetConfig): BudgetStatus {
  const usage = budget.tokensUsed / budget.totalBudget;
  const currentStatus = budget.status;

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

  // DOWNWARD transitions with hysteresis buffer (10%)
  if (currentStatus === 'exhausted' && usage < (config.exhaustedThreshold - 0.05)) {
    return 'critical';
  }
  if (currentStatus === 'critical' && usage < (config.criticalThreshold - 0.05)) {
    return 'warning';
  }
  if (currentStatus === 'warning' && usage < (config.warningThreshold - 0.10)) {
    return 'healthy';
  }

  return currentStatus;
}
