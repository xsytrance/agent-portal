import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { OpenRouterProvider } from './openRouterProvider';
import * as logger from '../logger';

// Mock the logger to prevent actual logging during tests
mock.module('../logger', () => ({
  info: mock(() => Promise.resolve()),
  error: mock(() => Promise.resolve()),
}));

describe('OpenRouterProvider', () => {
  const mockConfig = {
    enabled: true,
    model: 'test-model',
    baseUrl: 'https://api.test.com',
  };

  const validApiKey = 'sk-or-valid-key';
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Reset mocks
    (logger.info as any).mockClear();
    (logger.error as any).mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('isAvailable', () => {
    it('returns true for valid api key and enabled config', async () => {
      const provider = new OpenRouterProvider(mockConfig, validApiKey);
      expect(await provider.isAvailable()).toBe(true);
    });

    it('returns false if api key is missing', async () => {
      const provider = new OpenRouterProvider(mockConfig);
      expect(await provider.isAvailable()).toBe(false);
    });

    it('returns false if api key does not start with sk-or-', async () => {
      const provider = new OpenRouterProvider(mockConfig, 'invalid-key');
      expect(await provider.isAvailable()).toBe(false);
    });

    it('returns false if config is disabled', async () => {
      const provider = new OpenRouterProvider({ ...mockConfig, enabled: false }, validApiKey);
      expect(await provider.isAvailable()).toBe(false);
    });
  });

  describe('chat error cases', () => {
    it('throws error when API key is not configured', async () => {
      const provider = new OpenRouterProvider(mockConfig);
      await expect(provider.chat({ agentId: 'agent1', message: 'hello' }))
        .rejects.toThrow('OpenRouter API key not configured');
    });

    it('throws error on HTTP failure', async () => {
      global.fetch = mock(() => Promise.resolve({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      } as Response));

      const provider = new OpenRouterProvider(mockConfig, validApiKey);
      await expect(provider.chat({ agentId: 'agent1', message: 'hello' }))
        .rejects.toThrow('OpenRouter returned HTTP 401');

      expect(logger.error).toHaveBeenCalled();
    });

    it('throws error on empty response content', async () => {
      global.fetch = mock(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          model: 'test-model',
          choices: [{ message: { content: '' } }]
        }),
      } as Response));

      const provider = new OpenRouterProvider(mockConfig, validApiKey);
      await expect(provider.chat({ agentId: 'agent1', message: 'hello' }))
        .rejects.toThrow('Empty response from OpenRouter');
    });

    it('throws error on missing choices in response', async () => {
      global.fetch = mock(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          model: 'test-model',
          choices: []
        }),
      } as Response));

      const provider = new OpenRouterProvider(mockConfig, validApiKey);
      await expect(provider.chat({ agentId: 'agent1', message: 'hello' }))
        .rejects.toThrow('Empty response from OpenRouter');
    });

    it('throws error on AbortError simulating timeout', async () => {
      global.fetch = mock(() => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const provider = new OpenRouterProvider(mockConfig, validApiKey);
      await expect(provider.chat({ agentId: 'agent1', message: 'hello' }))
        .rejects.toThrow('Request to OpenRouter timed out');

      expect(logger.error).toHaveBeenCalled();
    });

    it('bubbles up generic fetch errors', async () => {
      global.fetch = mock(() => Promise.reject(new Error('Network error')));

      const provider = new OpenRouterProvider(mockConfig, validApiKey);
      await expect(provider.chat({ agentId: 'agent1', message: 'hello' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('chat success case', () => {
    it('returns expected chat response on success', async () => {
      global.fetch = mock(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          model: 'test-model',
          choices: [{ message: { content: 'test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20 }
        }),
      } as Response));

      const provider = new OpenRouterProvider(mockConfig, validApiKey);
      const result = await provider.chat({ agentId: 'agent1', message: 'hello', history: [{ role: 'assistant', content: 'hi' }] });

      expect(result).toEqual({
        content: 'test response',
        model: 'test-model',
        usage: { prompt: 10, completion: 20 }
      });
      expect(logger.info).toHaveBeenCalled();
    });
  });
});