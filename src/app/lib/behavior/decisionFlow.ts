import { BehaviorDirectorState, Signal, BehaviorDecision, CostTier, DirectorAction, PlannedEvent, PriorityScore } from './types';
import { checkCooldowns, RateLimitState } from './cooldownManager';
import { applyMoodDecay, DEFAULT_DECAY_CONFIG } from './moodEngine';
import { computePriority, BASE_PRIORITY_TABLE, MOOD_PRIORITY_MULTIPLIERS } from './priorityMatrix';
import { PERSONALITY_PRIORITY_WEIGHTS } from './profiles';
import { selectSilenceMode } from './silenceEngine';

export function executeDecisionFlow(
  state: BehaviorDirectorState,
  signal: Signal | null,
  rateLimitState: RateLimitState,
  agentSilenceProfile: import("./types").AgentSilenceProfile
): { newState: BehaviorDirectorState; decision: BehaviorDecision | null } {
  let newState = { ...state };
  let currentDecision: BehaviorDecision | null = null;
  const now = Date.now();

  // STEP 1: SIGNAL VALIDATION
  if (!signal) {
      // Create a tick signal if none exists
      signal = { id: `tick-\${now}`, source: 'system', type: 'timer.cycle', payload: {}, timestamp: now, urgency: 0.1 };
  }

  // STEP 2: CLASSIFICATION (Urgency and relevance done via base priorities)
  const basePriority = BASE_PRIORITY_TABLE[signal.type] || 0.1;

  // STEP 3: PRESENCE STATE CHECK
  if (newState.presence === 'sleeping') {
      // Check wake triggers (simplified for now)
      if (signal.source === 'user' && signal.urgency > 0.5) {
          newState.presence = 'attentive';
      } else {
          return { newState, decision: null }; // Stay sleeping
      }
  }

  // STEP 4: MOOD EVALUATION
  newState.mood = applyMoodDecay(newState.mood, DEFAULT_DECAY_CONFIG, 500);

  // STEP 5: BUDGET CHECK
  if (newState.budget.remaining <= 0) {
      newState.budget.isEmergencyMode = true;
      const silenceSelect = selectSilenceMode(newState, agentSilenceProfile);
      newState.quietPeriod = {
          mode: silenceSelect.mode,
          startedAt: now,
          minDuration: 60000,
          maxDuration: Infinity,
          wakeTriggers: [],
          visualExpression: silenceSelect.mode
      };
      return { newState, decision: null };
  }

  // STEP 6: COOLDOWN CHECK
  // (We check overall pacing here, event-specific inside action selection)
  // Simplified for architecture outline

  // STEP 7: PRIORITY MATRIX
  const moodMul = MOOD_PRIORITY_MULTIPLIERS[newState.mood.current]?.[signal.source] || 1.0;
  const persWeight = PERSONALITY_PRIORITY_WEIGHTS[newState.agentId]?.[signal.type] || 1.0;
  const cooldownPen = 1.0; // Assume no penalty initially
  const budgetPen = newState.budget.remaining < 20 ? 0.5 : 1.0;

  const finalScore = computePriority(basePriority, moodMul, persWeight, cooldownPen, budgetPen);

  const priorityScore: PriorityScore = {
      final: finalScore,
      base: basePriority,
      moodMultiplier: moodMul,
      personalityWeight: persWeight,
      cooldownPenalty: cooldownPen,
      budgetPenalty: budgetPen,
      recencyBoost: 0
  };

  // STEP 8: ACTION SELECTION
  let action: DirectorAction = 'do_nothing';
  let tier: CostTier = 'free';

  if (finalScore >= 0.6) {
      action = 'respond';
      tier = 'medium';
  } else if (finalScore >= 0.3) {
      action = 'eye_react';
      tier = 'low';
  }

  if (action === 'do_nothing' || finalScore < 0.15) {
       return { newState, decision: null }; // Go silent
  }

  // STEP 9: EVENT PLANNING
  const plannedEvents: PlannedEvent[] = [];
  if (action === 'respond') {
      plannedEvents.push({ type: 'agent.thinking', payload: {}, delay: 0, costTier: 'free' });
      plannedEvents.push({ type: 'agent.message', payload: { content: 'Ack' }, delay: 1000, costTier: tier });
  }

  // STEP 10: EXECUTION
  currentDecision = {
      id: `dec-\${now}`,
      timestamp: now,
      cycleNumber: newState.cycleCount,
      signal: signal,
      priority: priorityScore,
      action: action,
      costTier: tier,
      rationale: {
          summary: `Selected \${action} for signal \${signal.type}`,
          moodContext: `Mood is \${newState.mood.current}`,
          personalityContext: `Agent is \${newState.agentId}`,
          budgetContext: `Budget remaining: \${newState.budget.remaining}`,
          alternativeConsidered: null
      },
      events: plannedEvents,
      executionDelay: 0
  };

  newState.recentActions.push(currentDecision);
  if (newState.recentActions.length > 100) {
      newState.recentActions.shift();
  }

  return { newState, decision: currentDecision };
}
