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

export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsImages: boolean;
  supportsTools: boolean;
  supportsSystemPrompts: boolean;
}

export interface AIProvider {
  isAvailable(): boolean;
  chat(request: ChatRequest): Promise<ChatResponse>;
  getCapabilities(): ProviderCapabilities;
}
