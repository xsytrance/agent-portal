import type { ProviderFamily } from '@prisma/client';
import { parseIntegerEnv } from '@/app/lib/config/env';

export interface ModelPricing {
  model: string;
  family: ProviderFamily;
  inputMicrocreditsPer1k: bigint;
  outputMicrocreditsPer1k: bigint;
  markupMultiplierBps: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'openai/gpt-4o-mini': {
    model: 'openai/gpt-4o-mini',
    family: 'openai',
    inputMicrocreditsPer1k: 150n,
    outputMicrocreditsPer1k: 600n,
    markupMultiplierBps: 20000,
  },
  'openai/gpt-4o': {
    model: 'openai/gpt-4o',
    family: 'openai',
    inputMicrocreditsPer1k: 2500n,
    outputMicrocreditsPer1k: 10000n,
    markupMultiplierBps: 17500,
  },
  'anthropic/claude-3.5-sonnet': {
    model: 'anthropic/claude-3.5-sonnet',
    family: 'anthropic',
    inputMicrocreditsPer1k: 3000n,
    outputMicrocreditsPer1k: 15000n,
    markupMultiplierBps: 17500,
  },
  'google/gemini-1.5-flash': {
    model: 'google/gemini-1.5-flash',
    family: 'google',
    inputMicrocreditsPer1k: 75n,
    outputMicrocreditsPer1k: 300n,
    markupMultiplierBps: 20000,
  },
};

export function getAllowedModels(): string[] {
  const configured = process.env.OPENROUTER_ALLOWED_MODELS;
  if (!configured) return Object.keys(MODEL_PRICING);
  return configured.split(',').map((model) => model.trim()).filter(Boolean);
}

export function isProviderEmergencyDisabled(): boolean {
  return process.env.OPENROUTER_EMERGENCY_DISABLED === 'true';
}

export function resolveModel(requestedModel?: string): ModelPricing | null {
  const fallback = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  const model = requestedModel || fallback;
  if (!getAllowedModels().includes(model)) return null;
  return MODEL_PRICING[model] ?? null;
}

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator;
}

export function calculateModelCostMicrocredits(
  pricing: ModelPricing,
  promptTokens: number,
  completionTokens: number,
): bigint {
  const input = ceilDiv(BigInt(Math.max(0, promptTokens)) * pricing.inputMicrocreditsPer1k, 1000n);
  const output = ceilDiv(BigInt(Math.max(0, completionTokens)) * pricing.outputMicrocreditsPer1k, 1000n);
  return ceilDiv((input + output) * BigInt(pricing.markupMultiplierBps), 10000n);
}

export function getCommercialCaps() {
  return {
    dailySpendCapMicrocredits: BigInt(parseIntegerEnv('DAILY_SPEND_CAP_MICROCREDITS', 10_000_000)),
    globalDailySpendCapMicrocredits: BigInt(parseIntegerEnv('GLOBAL_DAILY_SPEND_CAP_MICROCREDITS', 100_000_000)),
    maxPromptChars: parseIntegerEnv('MAX_PROMPT_CHARS', 12000),
  };
}
