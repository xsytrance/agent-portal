import { describe, it, expect, beforeEach } from 'bun:test';
import { BehaviorEventQueue, BehaviorPlan } from './eventQueue';

// Helper to create mock BehaviorPlan objects
const createMockPlan = (id: string, priority: number): BehaviorPlan => ({
  id,
  reason: 'Test reason',
  priority,
  delayMs: 0,
  deadlineMs: 0,
  requiresLLM: false,
  tokenCostEstimate: 'free',
  cooldownKey: 'test_cooldown',
  sourceSignal: { id: 'signal1', type: 'test' },
  targetAgentId: 'agent1',
  status: 'pending',
  events: [],
});

describe('BehaviorEventQueue', () => {
  let queue: BehaviorEventQueue;

  beforeEach(() => {
    queue = new BehaviorEventQueue();
  });

  describe('enqueue', () => {
    it('should add a plan to the queue and set its status to pending', () => {
      const plan = createMockPlan('p1', 1);
      // Change status to simulate it being something else initially
      plan.status = 'executing';

      queue.enqueue(plan);

      expect(queue.getPendingCount()).toBe(1);
      expect(plan.status).toBe('pending');
    });

    it('should sort the queue so the highest priority plan is at the end', () => {
      const planLow = createMockPlan('p-low', 10);
      const planHigh = createMockPlan('p-high', 100);
      const planMedium = createMockPlan('p-med', 50);

      // Enqueue in arbitrary order
      queue.enqueue(planMedium);
      queue.enqueue(planHigh);
      queue.enqueue(planLow);

      expect(queue.getPendingCount()).toBe(3);

      // Since higher priority is at the end, popping should give high, med, low.
      // Let's verify via peek/dequeue.
      expect(queue.peek()?.id).toBe('p-high');
    });
  });

  describe('dequeue', () => {
    it('should return null if the queue is empty', () => {
      expect(queue.dequeue()).toBeNull();
    });

    it('should pop the highest priority plan and set its status to executing', () => {
      const plan1 = createMockPlan('p1', 10);
      const plan2 = createMockPlan('p2', 20);

      queue.enqueue(plan1);
      queue.enqueue(plan2);

      const dequeued = queue.dequeue();

      expect(dequeued).not.toBeNull();
      expect(dequeued?.id).toBe('p2'); // Highest priority
      expect(dequeued?.status).toBe('executing');
      expect(queue.getPendingCount()).toBe(1);
    });
  });

  describe('peek', () => {
    it('should return null if the queue is empty', () => {
      expect(queue.peek()).toBeNull();
    });

    it('should return the highest priority plan without removing it', () => {
      const plan1 = createMockPlan('p1', 5);
      const plan2 = createMockPlan('p2', 15);

      queue.enqueue(plan1);
      queue.enqueue(plan2);

      const peeked = queue.peek();

      expect(peeked).not.toBeNull();
      expect(peeked?.id).toBe('p2'); // Highest priority
      expect(queue.getPendingCount()).toBe(2); // Still in queue
    });
  });

  describe('getPendingCount', () => {
    it('should accurately report the number of elements in the queue', () => {
      expect(queue.getPendingCount()).toBe(0);

      queue.enqueue(createMockPlan('p1', 1));
      expect(queue.getPendingCount()).toBe(1);

      queue.enqueue(createMockPlan('p2', 2));
      expect(queue.getPendingCount()).toBe(2);

      queue.dequeue();
      expect(queue.getPendingCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all elements from the queue', () => {
      queue.enqueue(createMockPlan('p1', 1));
      queue.enqueue(createMockPlan('p2', 2));

      expect(queue.getPendingCount()).toBe(2);

      queue.clear();

      expect(queue.getPendingCount()).toBe(0);
      expect(queue.peek()).toBeNull();
    });
  });
});
