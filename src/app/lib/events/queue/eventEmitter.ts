import { PlannedEvent } from '../../behavior/types';
import { PortalEvent } from '../eventTypes';
import { BehaviorEventQueue, QueueEntry } from './eventQueue';

export type PortalEventDispatcher = (event: PortalEvent) => void;

export class EventEmitter {
  private queue: BehaviorEventQueue;
  private dispatcher: PortalEventDispatcher;
  private executionTimer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;

  constructor(queue: BehaviorEventQueue, dispatcher: PortalEventDispatcher) {
    this.queue = queue;
    this.dispatcher = dispatcher;
  }

  public start() {
    this.poll();
  }

  public stop() {
    if (this.executionTimer) {
      clearTimeout(this.executionTimer);
      this.executionTimer = null;
    }
  }

  private poll() {
    if (this.isProcessing) {
      return;
    }

    const nextEntry = this.queue.peekNext();

    if (nextEntry) {
      const entry = this.queue.dequeue();
      if (entry) {
        this.processEntry(entry);
      }
    } else {
      // Nothing ready to execute, poll again shortly
      this.executionTimer = setTimeout(() => this.poll(), 50);
    }
  }

  private async processEntry(entry: QueueEntry) {
    this.isProcessing = true;

    try {
      for (const plannedEvent of entry.plan.events) {
        if (plannedEvent.delay > 0) {
          await this.delay(plannedEvent.delay);
        }

        // Double check state hasn't been cancelled
        if (entry.state === 'cancelled') {
           break;
        }

        this.emitPlannedEvent(plannedEvent);
      }

      if (entry.state !== 'cancelled') {
        this.queue.completeExecution(entry.id, true);
      }

    } catch (e) {
      console.error(`Error executing behavior plan ${entry.id}:`, e);
      this.queue.completeExecution(entry.id, false);
    } finally {
      this.isProcessing = false;
      // Immediately try to process next if anything is waiting
      this.poll();
    }
  }

  private emitPlannedEvent(plannedEvent: PlannedEvent) {
    // Map internal DirectorEventType to the public PortalEventType string format
    const eventType = plannedEvent.type;

    const portalEvent: PortalEvent = {
      id: crypto.randomUUID(),
      type: eventType as PortalEvent['type'], // assuming type compat or fallback
      timestamp: new Date().toISOString(),
      source: 'agent',
      agentId: 'system', // Director context doesn't strictly track targetAgentId at the root Signal object yet
      payload: plannedEvent.payload,
      visibility: 'public',
      importance: 'normal',
    };

    this.dispatcher(portalEvent);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
