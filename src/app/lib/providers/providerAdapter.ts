import { ChatRequest, ChatResponse, ProviderCapabilities } from './providerTypes';

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

export class MockProvider implements ProviderAdapter {
  readonly providerId = 'mock';
  readonly providerName = 'Mock Provider';

  async isAvailable(): Promise<boolean> { return true; }

  getCapabilities(): ProviderCapabilities {
    return { stream: false, vision: false, tools: false };
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const responses: Record<string, string> = {
      nova: `Professor Nova here! You asked: "${request.message}". *beep boop* Fascinating results!`,
      jinx: `POOF! Jinx answers: "${request.message}"! *confetti* Was that helpful? Who knows!`,
      atlas: `I've processed "${request.message}". Here is my analysis: concise, accurate, and helpful.`,
    };
    const agentId = request.agentId || 'nova';
    return {
      content: responses[agentId] || `[Mock] Agent ${agentId} says: "${request.message}" is interesting!`,
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
