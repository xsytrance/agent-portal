import { BudgetAlert, BudgetConfig } from './types';

export function shouldSuppressAlert(
  newAlert: BudgetAlert,
  recentAlerts: BudgetAlert[],
  config: BudgetConfig
): boolean {
  const cooldownMs = config.alertSettings.cooldownMinutes * 60 * 1000;
  const now = Date.now();

  for (const existing of recentAlerts) {
    if (
      existing.sessionId === newAlert.sessionId &&
      existing.type === newAlert.type &&
      (now - new Date(existing.triggeredAt).getTime()) < cooldownMs
    ) {
      return true;
    }
  }

  return false;
}
