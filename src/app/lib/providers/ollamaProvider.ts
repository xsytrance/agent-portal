import { ProviderAdapter } from './providerAdapter';
import { ChatRequest, ChatResponse, ProviderCapabilities } from './providerTypes';
import { info, error } from '../logger';

/**
 * Local-first brain: Ollama running on this machine (or anywhere on the
 * tailnet). Same philosophy as sayhai — cloud is an optional treat,
 * never a dependency. Uses Ollama's native /api/chat for real token
 * counts (prompt_eval_count / eval_count).
 */
export class OllamaProvider implements ProviderAdapter {
  readonly providerId = 'ollama';
  readonly providerName = 'Ollama (local)';
  private host: string;
  private model: string;

  constructor(host: string, model: string) {
    this.host = host.replace(/\/$/, '');
    this.model = model;
  }

  getCapabilities(): ProviderCapabilities {
    return { stream: true, vision: false, tools: false };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.host}/api/tags`, { signal: controller.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const controller = new AbortController();
    // Local models can be slow on a cold load — give them more room
    // than a cloud API would get.
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      await info('ollama', 'Sending chat request', {
        route: '/api/agent/chat',
        details: { agentId: request.agentId, model: this.model },
      });

      const response = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          think: false, // skip hidden reasoning on thinking-class models; ignored by others
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            ...(request.history || []),
            { role: 'user', content: request.message },
            // Prefill: local models tend to ignore the "[emotion] reply"
            // format instruction; a trailing assistant "[" forces the
            // completion to start with the emotion tag.
            { role: 'assistant', content: '[' },
          ],
          options: {
            ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
            ...(request.maxTokens ? { num_predict: request.maxTokens } : {}),
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => 'unknown');
        await error('ollama', `HTTP ${response.status}`, { route: '/api/agent/chat', details: { status: response.status, body: text.slice(0, 500) } });
        throw new Error(`Ollama returned HTTP ${response.status}`);
      }

      const data = await response.json();
      let content: string | undefined = data.message?.content;
      if (!content) throw new Error('Empty response from Ollama');

      // Backstop (from sayhai): strip a leaked <think> block in case a
      // build ignores the think flag.
      content = content.replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, '').trim();
      if (!content) throw new Error('Response was all hidden reasoning');

      // Re-attach the prefilled "[" so parseEmotionReply sees the full tag.
      content = '[' + content.replace(/^\[/, '');

      return {
        content,
        model: `ollama/${data.model ?? this.model}`,
        usage: {
          prompt: typeof data.prompt_eval_count === 'number' ? data.prompt_eval_count : 0,
          completion: typeof data.eval_count === 'number' ? data.eval_count : 0,
        },
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        await error('ollama', 'Timeout after 60s', { route: '/api/agent/chat' });
        throw new Error('Request to Ollama timed out');
      }
      throw err;
    }
  }
}
