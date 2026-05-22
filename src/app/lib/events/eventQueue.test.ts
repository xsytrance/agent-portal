import { describe, it, expect, beforeEach } from 'bun:test';
import { BehaviorEventQueue, BehaviorPlan } from './eventQueue';

describe('BehaviorEventQueue', () => {
  let queue: BehaviorEventQueue;

  const createMockPlan = (id: string, priority: number): BehaviorPlan => ({
    id,
    reason: 'test',
    priority,
    delayMs: 0,
    deadlineMs: 0,
    requiresLLM: false,
    tokenCostEstimate: 'free',
    cooldownKey: 'test',
    sourceSignal: { id: 'test-signal', type: 'test' },
    targetAgentId: 'agent-1',
    status: 'pending',
    events: [],
  });

  beforeEach(() => {
    queue = new BehaviorEventQueue();
  });

  describe('enqueue', () => {
    it("should set the plan's status to 'pending'", () => {
      const plan = createMockPlan('1', 1);
      plan.status = 'completed'; // Change status to ensure it gets reset
      queue.enqueue(plan);
      expect(plan.status).toBe('pending');
    });

    it('should sort plans such that the highest priority number is at the end of the queue', () => {
      queue.enqueue(createMockPlan('1', 10));
      queue.enqueue(createMockPlan('2', 50));
      queue.enqueue(createMockPlan('3', 5));

      const peeked = queue.peek();
      expect(peeked?.id).toBe('2');
      expect(peeked?.priority).toBe(50);
    });
  });

  describe('dequeue', () => {
    it('should return null when the queue is empty', () => {
      expect(queue.dequeue()).toBeNull();
    });

    it('should return the plan with the highest priority number', () => {
      queue.enqueue(createMockPlan('1', 10));
      queue.enqueue(createMockPlan('2', 50));
      queue.enqueue(createMockPlan('3', 5));

      const dequeued = queue.dequeue();
      expect(dequeued?.id).toBe('2');
      expect(dequeued?.priority).toBe(50);
    });

    it("should change the dequeued plan's status to 'executing'", () => {
      queue.enqueue(createMockPlan('1', 10));
      const dequeued = queue.dequeue();
      expect(dequeued?.status).toBe('executing');
    });

    it('should remove the dequeued plan from the queue', () => {
      queue.enqueue(createMockPlan('1', 10));
      queue.enqueue(createMockPlan('2', 20));

      queue.dequeue(); // removes priority 20
      expect(queue.getPendingCount()).toBe(1);

      const remaining = queue.dequeue();
      expect(remaining?.id).toBe('1');
    });
  });

  describe('peek', () => {
    it('should return null when the queue is empty', () => {
      expect(queue.peek()).toBeNull();
    });

    it('should return the plan with the highest priority number without removing it', () => {
      queue.enqueue(createMockPlan('1', 10));
      queue.enqueue(createMockPlan('2', 20));

      const peeked = queue.peek();
      expect(peeked?.id).toBe('2');
      expect(queue.getPendingCount()).toBe(2);
    });
  });

  describe('getPendingCount', () => {
    it('should return 0 for a newly instantiated queue', () => {
      expect(queue.getPendingCount()).toBe(0);
    });

    it('should accurately reflect the number of items after enqueuing and dequeuing', () => {
      queue.enqueue(createMockPlan('1', 10));
      queue.enqueue(createMockPlan('2', 20));
      expect(queue.getPendingCount()).toBe(2);

      queue.dequeue();
      expect(queue.getPendingCount()).toBe(1);

      queue.dequeue();
      expect(queue.getPendingCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all items from the queue', () => {
      queue.enqueue(createMockPlan('1', 10));
      queue.enqueue(createMockPlan('2', 20));

      queue.clear();
      expect(queue.getPendingCount()).toBe(0);
      expect(queue.peek()).toBeNull();
    });
  });
});
