import { BehaviorDecision } from '../../behavior/types';

export interface ExpirationConfig {
  maxQueueAgeMs: number;
  maxPlanLifetimeMs: number;
  sweepIntervalMs: number;
  highPriorityThreshold: number;
  highPriorityAgeMultiplier: number;
}

export const DEFAULT_EXPIRATION_CONFIG: ExpirationConfig = {
  maxQueueAgeMs: 30000,
  maxPlanLifetimeMs: 120000,
  sweepIntervalMs: 5000,
  highPriorityThreshold: 0.71, // using float as priority is normalized 0-1
  highPriorityAgeMultiplier: 2.0,
};

export interface QueueEntry {
  id: string;
  plan: BehaviorDecision;
  enqueuedAt: number;
  executeAfter: number;
  hardDeadline: number;
  state: 'pending' | 'executing' | 'completed' | 'failed' | 'expired' | 'cancelled';
}

export interface CancellationResult {
  cancelled: boolean;
  cancelledPlanIds: string[];
  interruptedExecution: boolean;
  reason: 'superseded' | 'overridden' | 'expired' | 'agent_switch' | 'interrupt' | 'none';
}

export class BehaviorEventQueue {
  private queue: QueueEntry[] = [];
  private executing: QueueEntry | null = null;
  private config: ExpirationConfig;
  private sweeperInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<ExpirationConfig>) {
    this.config = { ...DEFAULT_EXPIRATION_CONFIG, ...config };
  }

  public start() {
    if (!this.sweeperInterval) {
      this.sweeperInterval = setInterval(() => this.sweep(), this.config.sweepIntervalMs);
    }
  }

  public stop() {
    if (this.sweeperInterval) {
      clearInterval(this.sweeperInterval);
      this.sweeperInterval = null;
    }
  }

  public enqueue(plan: BehaviorDecision) {
    const now = Date.now();
    const entry: QueueEntry = {
      id: plan.id,
      plan,
      enqueuedAt: now,
      executeAfter: now + plan.executionDelay,
      hardDeadline: now + this.config.maxQueueAgeMs, // simplified deadline logic
      state: 'pending',
    };

    // Cancellation check
    const cancelResult = this.evaluateCancellation(plan);
    if (cancelResult.interruptedExecution && this.executing) {
      this.executing.state = 'cancelled';
      this.executing = null;
    }

    if (cancelResult.cancelledPlanIds.length > 0) {
      this.queue = this.queue.filter(q => !cancelResult.cancelledPlanIds.includes(q.id));
    }

    this.queue.push(entry);
    this.queue.sort(this.queueComparator);
  }

  public peekNext(): QueueEntry | null {
    if (this.queue.length === 0) return null;

    const now = Date.now();
    const next = this.queue[0];

    if (now >= next.executeAfter) {
      return next;
    }
    return null;
  }

  public dequeue(): QueueEntry | null {
    const next = this.peekNext();
    if (next) {
      this.queue.shift();
      this.executing = next;
      this.executing.state = 'executing';
      return next;
    }
    return null;
  }

  public completeExecution(entryId: string, success: boolean) {
    if (this.executing && this.executing.id === entryId) {
      this.executing.state = success ? 'completed' : 'failed';
      this.executing = null;
    }
  }

  private queueComparator(a: QueueEntry, b: QueueEntry): number {
    // 1. Higher priority first
    if (a.plan.priority.final !== b.plan.priority.final) {
      return b.plan.priority.final - a.plan.priority.final;
    }
    // 2. Earlier execution time first
    if (a.executeAfter !== b.executeAfter) {
      return a.executeAfter - b.executeAfter;
    }
    // 3. FIFO tie-breaker
    return a.enqueuedAt - b.enqueuedAt;
  }

  private evaluateCancellation(newPlan: BehaviorDecision): CancellationResult {
    const cancelledIds: string[] = [];
    let interrupted = false;
    let reason: CancellationResult['reason'] = 'none';

    // Simplified cancellation logic since BehaviorPlan and signals structures differ slightly from the doc,
    // assuming agent_switch is a highly urgent manual override.
    if (newPlan.signal.type === 'user.switch_agent') {
       reason = 'agent_switch';
       cancelledIds.push(...this.queue.map(q => q.id));
       interrupted = !!this.executing;
    } else if (newPlan.action === 'go_silent' && newPlan.signal.type === 'user.command') {
       reason = 'interrupt';
       cancelledIds.push(...this.queue.map(q => q.id));
       interrupted = !!this.executing;
    } else {
        // Superseded check (same action, higher priority)
        for (const entry of this.queue) {
            if (entry.plan.action === newPlan.action && newPlan.priority.final > entry.plan.priority.final) {
                cancelledIds.push(entry.id);
                reason = 'superseded';
            }
        }
    }

    return {
      cancelled: cancelledIds.length > 0 || interrupted,
      cancelledPlanIds: cancelledIds,
      interruptedExecution: interrupted,
      reason,
    };
  }

  private sweep() {
    const now = Date.now();
    this.queue = this.queue.filter(entry => {
      const isHighPriority = entry.plan.priority.final >= this.config.highPriorityThreshold;
      const maxAge = isHighPriority
        ? this.config.maxQueueAgeMs * this.config.highPriorityAgeMultiplier
        : this.config.maxQueueAgeMs;

      const age = now - entry.enqueuedAt;

      if (age > maxAge || now > entry.hardDeadline) {
        return false; // Expired
      }
      return true;
    });
  }

  public getQueueLength(): number {
    return this.queue.length;
  }
}
