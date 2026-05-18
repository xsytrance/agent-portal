import { PlannedEvent } from '../behavior/types';

export type PlanStatus = 'pending' | 'executing' | 'completed' | 'cancelled' | 'expired';
export type CooldownKey = string;

export interface InputSignalSummary {
  id: string;
  type: string;
}

export interface BehaviorPlan {
  id: string;
  reason: string;
  priority: number;
  delayMs: number;
  deadlineMs: number;
  requiresLLM: boolean;
  tokenCostEstimate: 'free' | 'cheap' | 'expensive';
  cooldownKey: CooldownKey;
  sourceSignal: InputSignalSummary;
  targetAgentId: string;
  status: PlanStatus;
  events: PlannedEvent[];
}

export class BehaviorEventQueue {
  private queue: BehaviorPlan[] = [];

  public enqueue(plan: BehaviorPlan) {
    plan.status = 'pending';
    this.queue.push(plan);
    // Sort descending by priority so that highest priority is at the end (for pop())
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  public dequeue(): BehaviorPlan | null {
    if (this.queue.length === 0) return null;

    // Pop the highest priority plan
    const plan = this.queue.pop()!;
    plan.status = 'executing';
    return plan;
  }

  public peek(): BehaviorPlan | null {
      if (this.queue.length === 0) return null;
      return this.queue[this.queue.length - 1];
  }

  public getPendingCount(): number {
      return this.queue.length;
  }

  public clear() {
      this.queue = [];
  }
}
