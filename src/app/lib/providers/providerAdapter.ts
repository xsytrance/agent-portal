import { ChatRequest, ChatResponse, ProviderCapabilities } from './providerTypes';
import { agents } from '../agents/starterAgents';

export interface ProviderAdapter {
  readonly providerId: string;
  readonly providerName: string;
  isAvailable(): Promise<boolean>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  getCapabilities(): ProviderCapabilities;
}

export interface ProviderConfig {
  providerId: string;
  providerName: string;
  baseUrl: string;
  model: string;
  keyRef: string;
  enabled: boolean;
}

// Plausible demo-mode emotions per agent, so the presence layer still
// reacts to replies when no LLM is configured.
const MOCK_EMOTIONS: Record<string, string[]> = {
  nova: ['curious', 'excited', 'thinking', 'happy'],
  jinx: ['mischievous', 'excited', 'surprised', 'dizzy'],
  atlas: ['neutral', 'thinking', 'happy', 'curious'],
  chatty: ['mischievous', 'excited', 'grumpy', 'love', 'surprised'],
};

export class MockProvider implements ProviderAdapter {
  readonly providerId = 'mock';
  readonly providerName = 'Mock Provider';

  async isAvailable(): Promise<boolean> { return true; }

  getCapabilities(): ProviderCapabilities {
    return { stream: false, vision: false, tools: false };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const agentId = request.agentId || 'nova';
    const agent = agents.find(a => a.id === agentId);
    const lines = agent?.chatResponses?.length
      ? agent.chatResponses
      : [`Agent ${agentId} finds "${request.message}" interesting!`];
    const line = lines[Math.floor(Math.random() * lines.length)];
    const emotions = MOCK_EMOTIONS[agentId] || ['neutral'];
    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
    return {
      content: `[${emotion}] ${line}`,
      model: 'mock/demo',
    };
  }
}

const providers = new Map<string, ProviderAdapter>();

export function registerProvider(adapter: ProviderAdapter): void {
  providers.set(adapter.providerId, adapter);
}

export function getProvider(id: string): ProviderAdapter | undefined {
  return providers.get(id);
}

export function getDefaultProvider(): ProviderAdapter {
  for (const [, p] of providers) return p;
  return new MockProvider();
}

export function listProviders(): Array<{ id: string; name: string }> {
  return Array.from(providers.values()).map(p => ({ id: p.providerId, name: p.providerName }));
}

registerProvider(new MockProvider());
