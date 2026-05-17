import { BudgetTier, TokenBudget, BudgetConfig } from './types';
import { classifyEvent } from './costTiers';

export const FALLBACK_CHAIN: Record<string, string[]> = {
  'llm:chat_completion':     ['message:cached', 'message:template', 'template:phrase', 'visual:effect'],
  'llm:research_query':      ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  'llm:report_generation':   ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  'llm:long_explanation':    ['message:cached', 'message:template', 'template:phrase', 'visual:effect'],
  'agent:openclaw_call':     ['message:template', 'template:phrase', 'visual:effect'],
  'agent:hermes_call':       ['message:template', 'template:phrase', 'visual:effect'],
  'llm:code_generation':     ['message:template', 'template:phrase', 'visual:effect'],
  'llm:analysis':            ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  'web:live_search':         ['news:headline', 'message:template', 'template:phrase', 'visual:effect'],
  'llm:translation':         ['message:template', 'template:phrase', 'visual:effect'],
};

export function isEventAllowed(
  eventType: string,
  tier: BudgetTier,
  budget: TokenBudget,
  config: BudgetConfig,
  isEmergencyCall: boolean = false
): boolean {
  switch (budget.status) {
    case 'healthy':
      return true;

    case 'warning':
      if (tier === 'expensive') {
        if (Math.random() <= config.degradationSettings.warningTemplateRate) {
            return false;
        }
        return !config.degradationSettings.warningSkipNonEssential;
      }
      return true;

    case 'critical':
      if (tier === 'expensive') {
        if (isEmergencyCall && config.degradationSettings.criticalAllowEmergency && !budget.metadata.alertsTriggered.includes('emergency_used')) {
           return true;
        }
        return false;
      }
      if (tier === 'cheap' && config.degradationSettings.criticalUseOnlyFree && !config.degradationSettings.criticalUseOnlyTemplates) {
          return false;
      }
      return true;

    case 'exhausted':
      if (tier === 'free') {
          return true;
      }
      if (config.degradationSettings.exhaustedUseMock && eventType === 'message:template') {
          return true; // We allow template messages if mocked
      }
      return false;

    default:
      return true;
  }
}

export function resolveFallback(
  eventType: string,
  budget: TokenBudget,
  config: BudgetConfig,
  isEmergencyCall: boolean = false
): string {
  // Try original first
  const baseTier = classifyEvent(eventType);
  if (isEventAllowed(eventType, baseTier, budget, config, isEmergencyCall)) {
      return eventType;
  }

  const chain = FALLBACK_CHAIN[eventType] || ['template:phrase', 'visual:effect'];

  for (const fallbackType of chain) {
    const tier = classifyEvent(fallbackType);

    if (isEventAllowed(fallbackType, tier, budget, config, false)) {
      return fallbackType;
    }
  }

  return 'visual:effect';
}
