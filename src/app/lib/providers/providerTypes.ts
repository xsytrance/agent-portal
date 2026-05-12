export interface ChatRequest {
  message: string;
  agentId: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  content: string;
  model?: string;
  usage?: { prompt: number; completion: number };
}
