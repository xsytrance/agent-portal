import { BehaviorDirector } from '../director';
import { BehaviorDirectorState } from '../types';
import { addEvent } from '../../events/eventStore';
import { BehaviorEventQueue } from '../../events/queue/eventQueue';
import { EventEmitter } from '../../events/queue/eventEmitter';

let globalDirector: BehaviorDirector | null = null;
let globalEventEmitter: EventEmitter | null = null;

/**
 * Initializes or retrieves the singleton BehaviorDirector instance.
 * Note: In a production Phase 3 environment, this would be per-session instead of global.
 */
export function getBehaviorDirector(agentId: string = 'nova'): BehaviorDirector {
  if (!globalDirector) {
    const initialState: BehaviorDirectorState = {
      sessionId: 'global-session',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agentId: agentId as any,
      cycleCount: 0,
      sessionStartTime: Date.now(),
      lastDecisionTime: Date.now(),
      presence: 'silent',
      presenceSince: Date.now(),
      presenceHistory: [],
      mood: {
        primary: 'calm',
        secondary: null,
        intensity: 0.8,
        transitionTarget: null,
        transitionProgress: 0,
        modifiers: [],
        lastShiftTime: Date.now(),
      },
      moodHistory: [],
      recentActions: [],
      actionCountThisMinute: 0,
      actionCountThisSession: 0,
    };

    const queue = new BehaviorEventQueue();
    globalEventEmitter = new EventEmitter(queue, (portalEvent) => {
        // Enqueue directly into the in-memory event store which the SSE stream reads from
        addEvent(portalEvent).catch(console.error);
    });

    globalDirector = new BehaviorDirector(initialState, (decision) => {
      queue.enqueue(decision);
    });

    globalDirector.start();
    globalEventEmitter.start();
  }

  return globalDirector;
}
