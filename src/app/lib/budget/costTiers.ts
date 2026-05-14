import type { CostTier } from '@/app/lib/behavior/behaviorTypes';

export function classifyChatCost(hasProviderKey: boolean): CostTier {
  return hasProviderKey ? 'expensive' : 'cheap';
}

export function estimateTextTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateChatTokens(
  message: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>,
): number {
  const historyTokens = (history ?? []).reduce((total, entry) => total + estimateTextTokens(entry.content), 0);
  // Reserve completion room so budget checks fail before the provider call, not after.
  return estimateTextTokens(message) + historyTokens + 300;
}
