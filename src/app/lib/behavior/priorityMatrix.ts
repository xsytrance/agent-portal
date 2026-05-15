import { BehaviorPlan } from './behaviorTypes';

export class PriorityMatrix {
  // Phase 2a Logic: Calculate priority based on event type and current state
  public static calculatePriority(eventType: string, agentState: string): number {
    const basePriority = 10;

    // Highest priority: system overrides and user direct commands
    if (eventType === 'system_override') return 100;
    if (eventType === 'user_command' || eventType === 'chat_message') return 90;

    // High priority: alerts and explicit signals
    if (eventType === 'alert') return 80;

    // Medium priority: environmental / implicit signals
    if (eventType === 'mouse_movement' || eventType === 'hover') return 40;

    // Low priority: idle tics or background noise
    if (eventType === 'idle_tick') return 10;

    // Adjust based on state
    if (agentState === 'overloaded') {
      // When overloaded, drop priority of non-essential things
      if (basePriority < 80) return 0;
    }

    if (agentState === 'sleeping') {
      // When sleeping, requires higher priority to wake up
      if (basePriority < 50) return 0;
    }

    return basePriority;
  }

  public static sortPlans(plans: BehaviorPlan[]): BehaviorPlan[] {
    return plans.sort((a, b) => b.priority - a.priority);
  }
}
