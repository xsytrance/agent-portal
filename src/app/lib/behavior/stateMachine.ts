import { AgentState } from './behaviorTypes';

export class StateMachine {
  private currentState: AgentState = 'idle';
  private lastTransition: number = Date.now();
  private subscribers: Array<(state: AgentState) => void> = [];

  constructor(private readonly agentId: string) {}

  public getState(): AgentState {
    return this.currentState;
  }

  public transition(newState: AgentState): boolean {
    if (this.currentState === newState) return false;

    // Define valid transitions (simple validation for Phase 2a)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validTransitions: Record<string, string[]> = {
      idle: ['observing', 'sleeping', 'processing'],
      observing: ['processing', 'idle', 'alert'],
      processing: ['responding', 'overloaded', 'idle'],
      responding: ['idle', 'observing'],
      sleeping: ['idle', 'alert'],
      overloaded: ['idle', 'sleeping'],
      alert: ['processing', 'idle', 'observing']
    };

    // const allowed = validTransitions[this.currentState] || [];

    // For Phase 2a, we allow all transitions if not strictly defined
    this.currentState = newState;
    this.lastTransition = Date.now();
    this.notifySubscribers();
    return true;
  }

  public subscribe(fn: (state: AgentState) => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== fn);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(fn => fn(this.currentState));
  }
}
