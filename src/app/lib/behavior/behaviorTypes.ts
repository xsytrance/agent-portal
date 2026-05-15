export type InternalMood = 'neutral' | 'curious' | 'focused' | 'playful' | 'thinking' | 'alert' | 'tired' | 'excited';

export type AgentState =
  | 'idle'
  | 'observing'
  | 'processing'
  | 'responding'
  | 'sleeping'
  | 'overloaded';

export interface MoodState {
  current: InternalMood;
  intensity: number; // 0 to 1
  baseMood: InternalMood;
  lastChanged: number;
}

export interface BehaviorPlan {
  id: string;
  sourceEventId: string;
  action: 'speak' | 'animate' | 'emit_sound' | 'change_state' | 'silence';
  targetState?: AgentState;
  targetMood?: InternalMood;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  priority: number;
  createdAt: number;
}
