import type { InputSignal } from '@/app/lib/signals/signalTypes';
import {
  type BehaviorBudgetSnapshot,
  type BehaviorDirectorInput,
  type BehaviorPlan,
  type BehaviorProfile,
  type BehaviorSessionContext,
  type BehaviorState,
  type BudgetStatus,
  type CostTier,
  type DirectorDecision,
  type PlannedEvent,
} from './behaviorTypes';
import { getBehaviorProfile } from './profiles';

const DEFAULT_BUDGET: BehaviorBudgetSnapshot = {
  status: 'healthy',
  tokensUsed: 0,
  tokenLimit: 4000,
  expensiveActionsUsed: 0,
  expensiveActionLimit: 0,
};

export interface BehaviorDirectorRequest {
  signal: InputSignal;
  session?: Partial<BehaviorSessionContext>;
  budget?: Partial<BehaviorBudgetSnapshot>;
  now?: string;
}

function stableId(prefix: string, signalId: string, suffix: string): string {
  return `${prefix}_${signalId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)}_${suffix}`;
}

function getPriority(signalType: string, profile: BehaviorProfile, budgetStatus: BudgetStatus): number {
  const base = signalType === 'user.message'
    ? 100
    : signalType.startsWith('user.idle')
      ? 20
      : signalType === 'external.event'
        ? 75
        : signalType === 'system.tick'
          ? 5
          : 45;

  const budgetPenalty = budgetStatus === 'exhausted' ? 0.2 : budgetStatus === 'critical' ? 0.5 : 1;
  return Math.min(100, Math.round(base * (0.75 + profile.talkativeness * 0.5) * budgetPenalty));
}

function getCooldownMs(signalType: string, state: BehaviorState, profile: BehaviorProfile): number {
  if (signalType === 'user.message') return profile.cooldowns.chatMs;
  if (state === 'spectacle') return profile.cooldowns.spectacleMs;
  return profile.cooldowns.visualMs;
}

function msSince(timestamp: string, now: string): number {
  return new Date(now).getTime() - new Date(timestamp).getTime();
}

function findCooldown(
  input: BehaviorDirectorInput,
  state: BehaviorState,
): { active: boolean; remainingMs: number; key: string } {
  const key = `${input.profile.agentId}:${input.signalType}:${state}`;
  const cooldownMs = getCooldownMs(input.signalType, state, input.profile);
  const recent = input.session.recentDecisions ?? [];
  const previous = recent
    .filter((decision) => decision.agentId === input.profile.agentId)
    .filter((decision) => decision.signalType === input.signalType || decision.state === state)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())[0];

  if (!previous) return { active: false, remainingMs: 0, key };

  const elapsed = msSince(previous.at, input.now);
  const remainingMs = Math.max(0, cooldownMs - elapsed);
  return { active: remainingMs > 0, remainingMs, key };
}

function classifySignal(signalType: string, profile: BehaviorProfile): { state: BehaviorState; costTier: CostTier; reason: string } {
  if (signalType === 'user.message') {
    return {
      state: 'responding',
      costTier: 'cheap',
      reason: `${profile.displayName} can answer with a template in mock mode without calling a provider.`,
    };
  }

  if (signalType === 'user.idle.start' || signalType === 'user.idle.continue' || signalType === 'system.tick') {
    if (profile.agentId === 'jinx' && signalType === 'user.idle.start') {
      return {
        state: 'spectacle',
        costTier: 'free',
        reason: 'Jinx converts idle time into a small free visual flourish.',
      };
    }

    return {
      state: profile.agentId === 'nova' ? 'attentive' : 'silent',
      costTier: 'free',
      reason: `${profile.displayName} chooses designed silence: ${profile.silenceStyle}`,
    };
  }

  if (signalType === 'external.event') {
    return {
      state: 'attentive',
      costTier: 'free',
      reason: `${profile.displayName} acknowledges the external event but keeps execution mock-only.`,
    };
  }

  if (signalType === 'agent.selected') {
    return {
      state: 'attentive',
      costTier: 'free',
      reason: `${profile.displayName} updates presence after agent selection.`,
    };
  }

  return {
    state: 'attentive',
    costTier: 'free',
    reason: `${profile.displayName} reacts with a lightweight visual presence cue.`,
  };
}

function createPlannedEvents(input: BehaviorDirectorInput, state: BehaviorState, costTier: CostTier, reason: string): PlannedEvent[] {
  const profile = input.profile;

  if (input.budget.status === 'exhausted' && costTier !== 'free') {
    return [{
      eventType: 'behavior.budget_blocked',
      agentId: profile.agentId,
      source: 'system',
      payload: {
        budgetStatus: input.budget.status,
        reason: profile.templates.budgetBlocked,
      },
      delayMs: 0,
      durationMs: 6000,
      blocking: false,
      animation: 'fade-in',
      viewportHint: 'toast',
      importance: 'high',
      visibility: 'admin',
    }];
  }

  if (state === 'responding') {
    return [{
      eventType: 'agent.message',
      agentId: profile.agentId,
      source: 'agent',
      payload: {
        message: profile.templates.acknowledgement,
        mock: true,
        costTier,
      },
      delayMs: 0,
      durationMs: 8000,
      blocking: false,
      animation: 'typewriter',
      viewportHint: 'chat',
      importance: 'normal',
      visibility: 'public',
    }];
  }

  if (state === 'spectacle') {
    return [{
      eventType: 'portal.demo_action',
      agentId: profile.agentId,
      source: 'agent',
      payload: {
        action: 'mock_visual_flourish',
        intensity: profile.visualEnergy,
        reason,
      },
      delayMs: 0,
      durationMs: 4000,
      blocking: false,
      animation: profile.chaosLevel > 0.5 ? 'bounce' : 'pulse',
      viewportHint: 'none',
      importance: 'normal',
      visibility: 'public',
    }];
  }

  if (state === 'silent' || state === 'sleep') {
    return [{
      eventType: 'behavior.silence',
      agentId: profile.agentId,
      source: 'agent',
      payload: {
        reason,
        silenceStyle: profile.silenceStyle,
      },
      delayMs: 0,
      durationMs: 5000,
      blocking: false,
      animation: 'none',
      viewportHint: 'none',
      importance: 'low',
      visibility: 'internal',
    }];
  }

  return [{
    eventType: 'agent.eye_emotion',
    agentId: profile.agentId,
    source: 'agent',
    payload: {
      emotion: profile.agentId === 'jinx' ? 'mischievous' : profile.agentId === 'atlas' ? 'calm' : 'curious',
      reason,
    },
    delayMs: 0,
    durationMs: 3000,
    blocking: false,
    animation: 'pulse',
    viewportHint: 'none',
    importance: 'low',
    visibility: 'public',
  }];
}

function createPlan(input: BehaviorDirectorInput, state: BehaviorState, costTier: CostTier, reason: string): BehaviorPlan {
  const priority = getPriority(input.signalType, input.profile, input.budget.status);
  const events = createPlannedEvents(input, state, costTier, reason);

  return {
    id: stableId('plan', input.signalId, input.profile.agentId),
    createdAt: input.now,
    source: input.signalSource,
    triggerSignalId: input.signalId,
    targetAgentId: input.profile.agentId,
    state,
    mood: input.profile.defaultMood,
    priority,
    costTier,
    budgetStatus: input.budget.status,
    reason,
    events,
    visibility: events.some((event) => event.visibility === 'public') ? 'public' : 'internal',
    importance: priority >= 85 ? 'high' : priority >= 40 ? 'normal' : 'low',
    cancellable: state !== 'responding',
  };
}

function buildInput(request: BehaviorDirectorRequest): BehaviorDirectorInput {
  const profile = getBehaviorProfile(request.signal.agentId);
  const now = request.now ?? new Date().toISOString();

  return {
    signalId: request.signal.id,
    signalType: request.signal.type,
    signalSource: request.signal.source,
    signalPayload: request.signal.payload,
    profile,
    session: {
      sessionId: request.signal.sessionId,
      activeAgentId: profile.agentId,
      startedAt: request.signal.timestamp,
      ...request.session,
    },
    budget: {
      ...DEFAULT_BUDGET,
      ...request.budget,
    },
    now,
  };
}

export function decideBehavior(request: BehaviorDirectorRequest): DirectorDecision {
  const input = buildInput(request);
  const classified = classifySignal(input.signalType, input.profile);

  if (input.budget.status === 'exhausted' && classified.costTier !== 'free') {
    const reason = `${input.profile.displayName} blocked a ${classified.costTier} action because budget is exhausted.`;
    const plan = createPlan(input, 'silent', 'free', reason);
    plan.events = [{
      eventType: 'behavior.budget_blocked',
      agentId: input.profile.agentId,
      source: 'system',
      payload: {
        budgetStatus: input.budget.status,
        reason,
      },
      delayMs: 0,
      durationMs: 6000,
      blocking: false,
      animation: 'fade-in',
      viewportHint: 'toast',
      importance: 'high',
      visibility: 'admin',
    }];

    return {
      state: 'silent',
      reason,
      shouldCallProvider: false,
      costTier: 'free',
      budgetStatus: input.budget.status,
      plan,
      audit: {
        signalId: input.signalId,
        agentId: input.profile.agentId,
        decidedAt: input.now,
        suppressedBy: 'budget',
      },
    };
  }

  const cooldown = findCooldown(input, classified.state);
  if (cooldown.active) {
    const reason = `${input.profile.displayName} suppressed ${input.signalType} for ${cooldown.remainingMs}ms due to cooldown.`;
    const plan = createPlan(input, 'silent', 'free', reason);
    plan.events = [{
      eventType: 'behavior.cooldown',
      agentId: input.profile.agentId,
      source: 'system',
      payload: {
        cooldownKey: cooldown.key,
        remainingMs: cooldown.remainingMs,
        reason,
      },
      delayMs: 0,
      durationMs: 3000,
      blocking: false,
      animation: 'fade-in',
      viewportHint: 'none',
      importance: 'low',
      visibility: 'internal',
    }];

    return {
      state: 'silent',
      reason,
      shouldCallProvider: false,
      costTier: 'free',
      budgetStatus: input.budget.status,
      plan,
      audit: {
        signalId: input.signalId,
        agentId: input.profile.agentId,
        decidedAt: input.now,
        suppressedBy: 'cooldown',
      },
    };
  }

  return {
    state: classified.state,
    reason: classified.reason,
    shouldCallProvider: false,
    costTier: classified.costTier,
    budgetStatus: input.budget.status,
    plan: createPlan(input, classified.state, classified.costTier, classified.reason),
    audit: {
      signalId: input.signalId,
      agentId: input.profile.agentId,
      decidedAt: input.now,
      suppressedBy: 'none',
    },
  };
}
