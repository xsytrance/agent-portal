export interface InputSignal {
  id: string;
  source: 'mouse' | 'scroll' | 'keyboard' | 'idle' | 'visibility' | 'custom';
  type: string;
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export type InputSignalHandler = (signal: InputSignal) => void;
