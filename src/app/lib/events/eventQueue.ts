import { BehaviorPlan } from '../behavior/behaviorTypes';

export class EventQueue {
  private queue: BehaviorPlan[] = [];

  public enqueue(plan: BehaviorPlan): void {
    this.queue.push(plan);
    // Maintain sorted order (highest priority first)
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  public dequeue(): BehaviorPlan | undefined {
    return this.queue.shift();
  }

  public peek(): BehaviorPlan | undefined {
    return this.queue[0];
  }

  public removeBySource(sourceEventId: string): void {
    this.queue = this.queue.filter(plan => plan.sourceEventId !== sourceEventId);
  }

  public clear(): void {
    this.queue = [];
  }

  public get length(): number {
    return this.queue.length;
  }
}
