import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';

// Mock the logger before importing the provider
mock.module('../logger', () => ({
  info: mock(),
  error: mock()
}));

import { OpenRouterProvider } from './openRouterProvider';
import { ProviderConfig } from './providerAdapter';
import { ChatRequest } from './providerTypes';

describe('OpenRouterProvider', () => {
  const mockConfig: ProviderConfig = {
    providerId: 'openrouter',
    providerName: 'OpenRouter',
    enabled: true,
    model: 'anthropic/claude-3-haiku',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyRef: 'mock-key-ref'
  };
  const mockApiKey = 'sk-or-test12345';

  let provider: OpenRouterProvider;

  beforeEach(() => {
    provider = new OpenRouterProvider(mockConfig, mockApiKey);
  });

  afterEach(() => {
    mock.restore(); // restore fetch spy if used, clear mock calls
  });

  describe('isAvailable()', () => {
    it('returns true when apiKey starts with sk-or- and config is enabled', async () => {
      expect(await provider.isAvailable()).toBe(true);
    });

    it('returns false when apiKey does not start with sk-or-', async () => {
      const invalidProvider = new OpenRouterProvider(mockConfig, 'invalid-key');
      expect(await invalidProvider.isAvailable()).toBe(false);
    });

    it('returns false when apiKey is not provided', async () => {
      const missingKeyProvider = new OpenRouterProvider(mockConfig);
      expect(await missingKeyProvider.isAvailable()).toBe(false);
    });

    it('returns false when config is disabled', async () => {
      const disabledProvider = new OpenRouterProvider({ ...mockConfig, enabled: false }, mockApiKey);
      expect(await disabledProvider.isAvailable()).toBe(false);
    });
  });

  describe('chat()', () => {
    const mockRequest: ChatRequest = {
      agentId: 'agent1',
      message: 'Hello!',
      history: [{ role: 'user', content: 'Previous message' }]
    };

    it('throws error if apiKey is not configured', async () => {
      const missingKeyProvider = new OpenRouterProvider(mockConfig);
      await expect(missingKeyProvider.chat(mockRequest)).rejects.toThrow('OpenRouter API key not configured');
    });

    it('successfully parses valid response', async () => {
      const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(new Response(
        JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          choices: [{ message: { content: 'Hi there!' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 }
        }),
        { status: 200 }
      ));

      const response = await provider.chat(mockRequest);

      expect(response).toEqual({
        content: 'Hi there!',
        model: 'anthropic/claude-3-haiku',
        usage: { prompt: 10, completion: 20 }
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('handles HTTP errors', async () => {
      spyOn(global, 'fetch').mockResolvedValue(new Response('Forbidden', { status: 403 }));

      await expect(provider.chat(mockRequest)).rejects.toThrow('OpenRouter returned HTTP 403');
    });

    it('handles empty responses', async () => {
      spyOn(global, 'fetch').mockResolvedValue(new Response(
        JSON.stringify({ choices: [] }),
        { status: 200 }
      ));

      await expect(provider.chat(mockRequest)).rejects.toThrow('Empty response from OpenRouter');
    });

    it('handles request timeouts', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      spyOn(global, 'fetch').mockRejectedValue(abortError);

      await expect(provider.chat(mockRequest)).rejects.toThrow('Request to OpenRouter timed out');
    });
  });
});
