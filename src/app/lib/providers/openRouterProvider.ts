import { ProviderAdapter, ProviderConfig } from './providerAdapter';
import { ChatRequest, ChatResponse } from './providerTypes';
import { info, error } from '../logger';

export class OpenRouterProvider implements ProviderAdapter {
  readonly providerId = 'openrouter';
  readonly providerName = 'OpenRouter';
  private config: ProviderConfig;
  private apiKey: string | undefined;

  constructor(config: ProviderConfig, apiKey?: string) {
    this.config = config;
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey.startsWith('sk-or-') && this.config.enabled;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiKey) throw new Error('OpenRouter API key not configured');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      await info('openrouter', 'Sending chat request', {
        route: '/api/agent/chat',
        details: { agentId: request.agentId, model: this.config.model },
      });

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [...(request.history || []), { role: 'user', content: request.message }],
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const status = response.status;
        const text = await response.text().catch(() => 'unknown');
        await error('openrouter', `HTTP ${status}`, { route: '/api/agent/chat', details: { status, body: text.slice(0, 500) } });
        throw new Error(`OpenRouter returned HTTP ${status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenRouter');

      await info('openrouter', 'Response received', { route: '/api/agent/chat', details: { model: data.model } });

      return {
        content,
        model: data.model,
        usage: data.usage ? { prompt: data.usage.prompt_tokens, completion: data.usage.completion_tokens } : undefined,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        await error('openrouter', 'Timeout after 30s', { route: '/api/agent/chat' });
        throw new Error('Request to OpenRouter timed out');
      }
      throw err;
    }
  }
}
