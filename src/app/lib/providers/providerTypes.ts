export interface ChatRequest {
  message: string;
  agentId: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Persona/system prompt prepended to the conversation */
  systemPrompt?: string;
  /** Hard cap on completion tokens (budget degradation lowers this) */
  maxTokens?: number;
  /** Sampling temperature for the persona */
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  model?: string;
  usage?: { prompt: number; completion: number };
}

export interface ProviderCapabilities {
  stream: boolean;
  vision: boolean;
  tools: boolean;
}
