import { TokenBudget, BudgetConfig, RuntimeMode, ProviderDecision, BudgetTier, AgentBudgetAllocation } from './types';
import { EVENT_TIER_REGISTRY, classifyEvent } from './costTiers';
import { resolveFallback, FALLBACK_CHAIN } from './degradation';
import { estimateCost } from './utils';

// Cache for O(1) lookups of agent budgets by config reference
const configAgentBudgetsCache = new WeakMap<BudgetConfig, Map<string, AgentBudgetAllocation>>();

// Helper mock to replace complex real cache checking for now
function hasValidCacheEntry(eventType: string): boolean {
    return false;
}

// Helper mock to replace complex rate limit checking logic for now
function wouldExceedRateLimit(budget: TokenBudget, config: BudgetConfig): boolean {
    return false;
}

export function selectProvider(
  eventType: string,
  budget: TokenBudget,
  config: BudgetConfig,
  context: { apiKeyPresent: boolean; runtimeMode: RuntimeMode }
): ProviderDecision {

  const registry = EVENT_TIER_REGISTRY[eventType];
  const tier = classifyEvent(eventType);

  // Rule 1: Mock mode
  if (context.runtimeMode === 'mock') {
    return {
      provider: 'mock',
      reason: 'Runtime mode is mock -- always mock',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
    };
  }

  // Rule 2: No API key
  if (!context.apiKeyPresent) {
    return {
      provider: 'mock',
      reason: 'No API key configured -- falling back to mock',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
    };
  }

  // Rule 3: Budget exhausted
  if (budget.status === 'exhausted') {
    return {
      provider: 'mock',
      reason: 'Budget exhausted -- using mock responses',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
      fallbackChain: FALLBACK_CHAIN[eventType],
    };
  }

  // Rule 4: Global emergency
  if (budget.metadata.alertsTriggered.some(a => a.startsWith('emergency'))) {
    return {
      provider: 'mock',
      reason: 'Global emergency cutoff active',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
    };
  }

  // Rule 5: Free events need no provider
  if (tier === 'free') {
    return {
      provider: 'none',
      reason: 'Free event -- client-side only, no provider needed',
      tier,
      estimatedTokens: 0,
      estimatedCost: 0,
    };
  }

  // Rule 6: Cheap events use cache/template
  if (tier === 'cheap') {
    return {
      provider: 'template',
      reason: 'Cheap event -- template/cache response',
      tier,
      estimatedTokens: registry?.estimatedTokens || 50,
      estimatedCost: 0,
    };
  }

  // Rules 7-12: Expensive events -- budget-aware selection
  if (tier === 'expensive') {
    // Check cache first (Rule 7)
    if (registry?.cacheable && hasValidCacheEntry(eventType)) {
      return {
        provider: 'cache',
        reason: 'Cache hit -- serving cached response',
        tier,
        estimatedTokens: 0,
        estimatedCost: 0,
      };
    }

    // Rule 8: Critical status
    if (budget.status === 'critical') {
      const fallback = resolveFallback(eventType, budget, config);
      return {
        provider: fallback === eventType ? 'mock' : 'template',
        reason: 'Budget critical -- using template fallback',
        tier,
        estimatedTokens: 0,
        estimatedCost: 0,
        fallbackChain: FALLBACK_CHAIN[eventType],
      };
    }

    // Rule 9: Warning status (probabilistic)
    if (budget.status === 'warning') {
      const useCache = Math.random() < config.degradationSettings.warningTemplateRate;
      if (useCache) {
        return {
          provider: 'template',
          reason: 'Budget warning -- probabilistic template fallback (50%)',
          tier,
          estimatedTokens: 0,
          estimatedCost: 0,
        };
      }
    }

    // Rule 10: Rate limit check
    if (wouldExceedRateLimit(budget, config)) {
      return {
        provider: 'template',
        reason: 'Rate limit protection -- template fallback',
        tier,
        estimatedTokens: registry?.estimatedTokens || 1500,
        estimatedCost: 0,
      };
    }

    // Rule 11: Per-agent budget check
    if (config.features.enablePerAgentBudgets) {
      let agentBudgetsMap = configAgentBudgetsCache.get(config);
      if (!agentBudgetsMap) {
        agentBudgetsMap = new Map();
        for (let i = 0; i < config.agentBudgets.length; i++) {
          agentBudgetsMap.set(config.agentBudgets[i].agentId, config.agentBudgets[i]);
        }
        configAgentBudgetsCache.set(config, agentBudgetsMap);
      }

      if (budget.agentSpending.length > 0) {
        const primaryAgentSpending = budget.agentSpending[0];
        const agentBudget = agentBudgetsMap.get(primaryAgentSpending.agentId);

        if (agentBudget && agentBudget.maxTokensPerSession > 0) {
          if (primaryAgentSpending.tokensUsed >= agentBudget.maxTokensPerSession) {
            return {
              provider: 'template',
              reason: `Agent "${agentBudget.agentId}" budget exceeded -- template fallback`,
              tier,
              estimatedTokens: 0,
              estimatedCost: 0,
            };
          }
        }
      }
    }

    // Rule 12: Default -- use OpenRouter
    return {
      provider: 'openrouter',
      reason: 'Full budget available -- using OpenRouter',
      tier,
      estimatedTokens: registry?.estimatedTokens || 1500,
      estimatedCost: estimateCost(registry?.estimatedTokens || 1500),
    };
  }

  // Should never reach here
  return {
    provider: 'mock',
    reason: 'Unknown event tier -- safe default to mock',
    tier: 'free',
    estimatedTokens: 0,
    estimatedCost: 0,
  };
}
