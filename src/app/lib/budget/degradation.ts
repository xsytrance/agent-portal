import { BudgetTier, TokenBudget, BudgetConfig } from './types';
import { EVENT_TIER_REGISTRY, classifyEvent } from './costTiers';

export const FALLBACK_CHAIN: Record<string, string[]> = {
  'llm:chat_completion':     ['message:cached', 'message:template', 'template:phrase', 'visual:effect'],
  'llm:research_query':      ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  'llm:report_generation':   ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  'llm:long_explanation':    ['message:cached', 'message:template', 'template:phrase', 'visual:effect'],
  'agent:openclaw_call':     ['message:template', 'template:phrase', 'visual:effect'],
  'agent:hermes_call':       ['message:template', 'template:phrase', 'visual:effect'],
  'llm:code_generation':     ['message:template', 'template:phrase', 'visual:effect'],
  'llm:analysis':            ['summary:simple', 'message:template', 'template:phrase', 'visual:effect'],
  'web:live_search':         ['news:headline', 'template:phrase', 'visual:effect'],
  'llm:translation':         ['message:template', 'template:phrase', 'visual:effect'],
};

export function isEventAllowed(
  eventType: string,
  tier: BudgetTier,
  budget: TokenBudget,
  config: BudgetConfig
): boolean {
  switch (budget.status) {
    case 'healthy':
      return true;

    case 'warning':
      if (tier === 'expensive') {
        return Math.random() > config.degradationSettings.warningTemplateRate;
      }
      return tier === 'free' || tier === 'cheap' || !config.degradationSettings.warningSkipNonEssential;

    case 'critical':
      if (tier === 'expensive') {
        return budget.metadata.alertsTriggered.length === 0 &&
               config.degradationSettings.criticalAllowEmergency;
      }
      return tier === 'free' || tier === 'cheap';

    case 'exhausted':
      return tier === 'free';

    default:
      return false;
  }
}

export function resolveFallback(eventType: string, budget: TokenBudget, config: BudgetConfig): string {
  const chain = FALLBACK_CHAIN[eventType] || ['template:phrase', 'visual:effect'];

  for (const fallbackType of chain) {
    const tier = classifyEvent(fallbackType);

    if (isEventAllowed(fallbackType, tier, budget, config)) {
      return fallbackType;
    }
  }

  return 'visual:effect';
}
