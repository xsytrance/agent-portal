import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';
import { createLedgerEntry } from '@/app/lib/wallet/walletService';
import { enforcePromptAndRateGuards, recordDailySpend } from '@/app/lib/security/requestGuards';
import { estimateTextTokens } from '@/app/lib/budget/costTiers';
import {
  calculateModelCostMicrocredits,
  isProviderEmergencyDisabled,
  resolveModel,
  type ModelPricing,
} from './commercialPricing';

export interface ProviderAuthorization {
  allowed: boolean;
  reason?: string;
  providerRequestId?: string;
  pricing?: ModelPricing;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  estimatedMicrocredits: bigint;
}

export interface ProviderAuthorizationInput {
  userId: string;
  agentId: string;
  model?: string;
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function estimatePromptTokens(message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>): number {
  return estimateTextTokens(message) + (history ?? []).reduce((total, entry) => total + estimateTextTokens(entry.content), 0);
}

async function logBlocked(input: ProviderAuthorizationInput, reason: string, pricing: ModelPricing | null, estimatedMicrocredits: bigint) {
  if (!isDatabaseConfigured()) return;

  await prisma.providerRequestLog.create({
    data: {
      userId: input.userId,
      agentId: input.agentId,
      providerFamily: pricing?.family ?? 'other',
      model: pricing?.model ?? input.model ?? 'unknown',
      status: 'blocked',
      estimatedPromptTokens: estimatePromptTokens(input.message, input.history),
      estimatedCompletionTokens: 300,
      estimatedCostMicrocredits: estimatedMicrocredits,
      markupMultiplierBps: pricing?.markupMultiplierBps ?? 0,
      blockedReason: reason,
    },
  });
  await recordDailySpend(input.userId, estimatedMicrocredits, true);
}

export async function authorizeProviderCall(input: ProviderAuthorizationInput): Promise<ProviderAuthorization> {
  const estimatedPromptTokens = estimatePromptTokens(input.message, input.history);
  const estimatedCompletionTokens = 300;

  if (isProviderEmergencyDisabled()) {
    await logBlocked(input, 'Provider access is disabled by emergency kill switch.', null, 0n);
    return {
      allowed: false,
      reason: 'Provider access is disabled by emergency kill switch.',
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedMicrocredits: 0n,
    };
  }

  const pricing = resolveModel(input.model);
  if (!pricing) {
    await logBlocked(input, 'Requested model is not allowlisted.', null, 0n);
    return {
      allowed: false,
      reason: 'Requested model is not allowlisted.',
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedMicrocredits: 0n,
    };
  }

  const estimatedMicrocredits = calculateModelCostMicrocredits(pricing, estimatedPromptTokens, estimatedCompletionTokens);

  if (!isDatabaseConfigured()) {
    return {
      allowed: false,
      reason: 'Persistent database is required before provider calls can be authorized.',
      pricing,
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedMicrocredits,
    };
  }

  const guard = await enforcePromptAndRateGuards(input.userId, input.message, estimatedMicrocredits);
  if (!guard.allowed) {
    await logBlocked(input, guard.reason ?? 'Request guard blocked provider call.', pricing, estimatedMicrocredits);
    return {
      allowed: false,
      reason: guard.reason,
      pricing,
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedMicrocredits,
    };
  }

  const log = await prisma.providerRequestLog.create({
    data: {
      userId: input.userId,
      agentId: input.agentId,
      providerFamily: pricing.family,
      model: pricing.model,
      status: 'authorized',
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedCostMicrocredits: estimatedMicrocredits,
      markupMultiplierBps: pricing.markupMultiplierBps,
    },
  });

  try {
    await createLedgerEntry({
      userId: input.userId,
      type: 'usage_deduction',
      amountMicrocredits: estimatedMicrocredits * -1n,
      idempotencyKey: `provider:${log.id}:reserve`,
      providerRequestId: log.id,
      description: `Reserved estimated ${pricing.model} usage`,
      metadata: {
        model: pricing.model,
        estimatedPromptTokens,
        estimatedCompletionTokens,
      },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Insufficient prepaid wallet balance.';
    await prisma.providerRequestLog.update({
      where: { id: log.id },
      data: {
        status: 'blocked',
        blockedReason: reason,
        completedAt: new Date(),
      },
    });
    await recordDailySpend(input.userId, estimatedMicrocredits, true);
    return {
      allowed: false,
      reason,
      pricing,
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedMicrocredits,
    };
  }

  return {
    allowed: true,
    providerRequestId: log.id,
    pricing,
    estimatedPromptTokens,
    estimatedCompletionTokens,
    estimatedMicrocredits,
  };
}

export async function reconcileProviderCall(input: {
  providerRequestId: string;
  userId: string;
  agentId: string;
  pricing: ModelPricing;
  estimatedMicrocredits: bigint;
  promptTokens: number;
  completionTokens: number;
  model?: string;
}) {
  if (!isDatabaseConfigured()) return;

  const actualMicrocredits = calculateModelCostMicrocredits(input.pricing, input.promptTokens, input.completionTokens);
  const delta = input.estimatedMicrocredits - actualMicrocredits;

  if (delta > 0n) {
    await createLedgerEntry({
      userId: input.userId,
      type: 'refund',
      amountMicrocredits: delta,
      idempotencyKey: `provider:${input.providerRequestId}:refund`,
      providerRequestId: input.providerRequestId,
      description: 'Refund unused provider cost reservation',
    });
  } else if (delta < 0n) {
    await createLedgerEntry({
      userId: input.userId,
      type: 'usage_deduction',
      amountMicrocredits: delta,
      idempotencyKey: `provider:${input.providerRequestId}:overage`,
      providerRequestId: input.providerRequestId,
      description: 'Deduct provider usage over reserved estimate',
    });
  }

  await prisma.providerRequestLog.update({
    where: { id: input.providerRequestId },
    data: {
      status: 'completed',
      actualPromptTokens: input.promptTokens,
      actualCompletionTokens: input.completionTokens,
      actualCostMicrocredits: actualMicrocredits,
      completedAt: new Date(),
    },
  });

  await prisma.usageEvent.create({
    data: {
      userId: input.userId,
      providerRequestId: input.providerRequestId,
      agentId: input.agentId,
      model: input.model ?? input.pricing.model,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      estimatedMicrocredits: input.estimatedMicrocredits,
      actualMicrocredits,
    },
  });

  await recordDailySpend(input.userId, actualMicrocredits);
}

export async function markProviderCallFailed(providerRequestId: string, errorMessage: string) {
  if (!isDatabaseConfigured()) return;

  const log = await prisma.providerRequestLog.findUnique({ where: { id: providerRequestId } });
  if (!log) return;

  await createLedgerEntry({
    userId: log.userId,
    type: 'refund',
    amountMicrocredits: log.estimatedCostMicrocredits,
    idempotencyKey: `provider:${providerRequestId}:failure-refund`,
    providerRequestId,
    description: 'Refund failed provider request reservation',
  });

  await prisma.providerRequestLog.update({
    where: { id: providerRequestId },
    data: {
      status: 'failed',
      errorMessage,
      completedAt: new Date(),
    },
  });
}
