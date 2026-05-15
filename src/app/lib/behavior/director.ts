import { StateMachine } from './stateMachine';
import { MoodEngine } from './moodEngine';
import { CooldownManager } from './cooldownManager';
import { EventQueue } from '../events/eventQueue';
import { BehaviorPlan } from './behaviorTypes';
import { PriorityMatrix } from './priorityMatrix';
import { InputSignal } from '../signals/signalTypes';

export class BehaviorDirector {
  public stateMachine: StateMachine;
  public moodEngine: MoodEngine;
  public cooldownManager: CooldownManager;
  public eventQueue: EventQueue;
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.stateMachine = new StateMachine(agentId);
    this.moodEngine = new MoodEngine();
    this.cooldownManager = new CooldownManager();
    this.eventQueue = new EventQueue();
  }

  // Phase 2a: Core decision cycle triggered by signals
  public processSignal(signal: InputSignal): void {
    const currentState = this.stateMachine.getState();
    const priority = PriorityMatrix.calculatePriority(signal.type, currentState);

    if (priority <= 0) {
        // Ignored due to low priority in current state
        return;
    }

    if (this.cooldownManager.isOnCooldown(signal.type)) {
       // Ignored due to cooldown
       return;
    }

    // Evaluate mood impact
    this.moodEngine.evaluateMood([signal]);

    // Generate a behavior plan
    const plan: BehaviorPlan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceEventId: signal.id,
      action: this.determineAction(signal.type),
      priority,
      createdAt: Date.now()
    };

    this.eventQueue.enqueue(plan);

    // Set basic cooldown to prevent spam
    this.cooldownManager.setCooldown(signal.type, 2000); // 2 second cooldown
  }

  // Phase 2a: Simple action mapping
  private determineAction(signalType: string): 'speak' | 'animate' | 'emit_sound' | 'change_state' | 'silence' {
      if (signalType === 'chat_message' || signalType === 'user_command') return 'speak';
      if (signalType === 'mouse_movement' || signalType === 'hover') return 'animate';
      if (signalType === 'alert') return 'emit_sound';
      return 'change_state';
  }

  // Execute the highest priority plan in the queue
  public tick(): void {
    const plan = this.eventQueue.dequeue();
    if (!plan) {
        // Idling behavior if needed
        if (this.stateMachine.getState() !== 'idle' && this.stateMachine.getState() !== 'sleeping') {
             // Return to idle after processing
             this.stateMachine.transition('idle');
        }
        return;
    }

    // Execute plan (Phase 2a: Just change state to reflect action)
    if (plan.action === 'speak') {
        this.stateMachine.transition('responding');
    } else if (plan.action === 'animate' || plan.action === 'change_state') {
        this.stateMachine.transition('observing');
    }
  }
}
