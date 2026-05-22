import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from 'bun:test';
import { OpenRouterProvider } from './openRouterProvider';
import { ProviderConfig } from './providerAdapter';

// Mock logger module
mock.module('../logger', () => ({
  info: mock(() => Promise.resolve()),
  error: mock(() => Promise.resolve()),
}));

describe('OpenRouterProvider', () => {
  const mockConfig: ProviderConfig = {
    model: 'test-model',
    baseUrl: 'https://openrouter.ai/api/v1',
    enabled: true,
  };

  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mock.restore();
  });

  // Constructor & isAvailable tests
  describe('isAvailable', () => {
    it('should be available with a valid API key starting with sk-or- and enabled config', async () => {
      const provider = new OpenRouterProvider(mockConfig, 'sk-or-testkey123');
      expect(await provider.isAvailable()).toBe(true);
    });

    it('should not be available with an invalid API key', async () => {
      const provider = new OpenRouterProvider(mockConfig, 'invalid-key');
      expect(await provider.isAvailable()).toBe(false);
    });

    it('should not be available if API key is missing', async () => {
      const provider = new OpenRouterProvider(mockConfig);
      expect(await provider.isAvailable()).toBe(false);
    });

    it('should not be available if config is disabled', async () => {
      const provider = new OpenRouterProvider({ ...mockConfig, enabled: false }, 'sk-or-testkey123');
      expect(await provider.isAvailable()).toBe(false);
    });
  });

  // chat tests
  describe('chat', () => {
    it('should throw an error when chat is called without an API key', async () => {
      const provider = new OpenRouterProvider(mockConfig);
      expect(provider.chat({ message: 'Hello', agentId: 'test-agent' })).rejects.toThrow('OpenRouter API key not configured');
    });

    it('should return a successful response when fetch succeeds', async () => {
      const provider = new OpenRouterProvider(mockConfig, 'sk-or-testkey123');

      const mockResponse = {
        choices: [{ message: { content: 'Hello World' } }],
        model: 'test-model',
        usage: { prompt_tokens: 10, completion_tokens: 20 },
      };

      global.fetch = mock().mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const result = await provider.chat({ message: 'Hi', agentId: 'test-agent' });

      expect(result.content).toBe('Hello World');
      expect(result.model).toBe('test-model');
      expect(result.usage?.prompt).toBe(10);
      expect(result.usage?.completion).toBe(20);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle HTTP errors gracefully', async () => {
      const provider = new OpenRouterProvider(mockConfig, 'sk-or-testkey123');

      global.fetch = mock().mockResolvedValue(new Response('Forbidden', { status: 403 }));

      expect(provider.chat({ message: 'Hi', agentId: 'test-agent' })).rejects.toThrow('OpenRouter returned HTTP 403');
    });

    it('should handle empty response from OpenRouter', async () => {
      const provider = new OpenRouterProvider(mockConfig, 'sk-or-testkey123');

      const mockResponse = {
        choices: [],
        model: 'test-model',
      };

      global.fetch = mock().mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

      expect(provider.chat({ message: 'Hi', agentId: 'test-agent' })).rejects.toThrow('Empty response from OpenRouter');
    });

    it('should handle fetch AbortError as timeout', async () => {
      const provider = new OpenRouterProvider(mockConfig, 'sk-or-testkey123');

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = mock().mockRejectedValue(abortError);

      expect(provider.chat({ message: 'Hi', agentId: 'test-agent' })).rejects.toThrow('Request to OpenRouter timed out');
    });

    it('should propagate other fetch errors', async () => {
      const provider = new OpenRouterProvider(mockConfig, 'sk-or-testkey123');

      const networkError = new TypeError('Network error');
      global.fetch = mock().mockRejectedValue(networkError);

      expect(provider.chat({ message: 'Hi', agentId: 'test-agent' })).rejects.toThrow('Network error');
    });
  });
});
