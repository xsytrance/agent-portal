export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini':       { input: 0.15,  output: 0.60 },
  'gpt-4o':            { input: 2.50,  output: 10.00 },
  'claude-3.5-sonnet': { input: 3.00,  output: 15.00 },
  'llama-3.1-70b':     { input: 0.30,  output: 0.60 },
  'default':           { input: 0.50,  output: 1.50 },
};

export function estimateCost(
  estimatedTokens: number,
  model: string = 'default',
  inputRatio: number = 0.4
): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
  const inputTokens = estimatedTokens * inputRatio;
  const outputTokens = estimatedTokens * (1 - inputRatio);

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}
