import { describe, it, expect, beforeEach } from 'bun:test';
import {
  MockProvider,
  registerProvider,
  getProvider,
  getDefaultProvider,
  listProviders,
  ProviderAdapter
} from './providerAdapter';

describe('providerAdapter', () => {
  describe('MockProvider', () => {
    let provider: MockProvider;

    beforeEach(() => {
      provider = new MockProvider();
    });

    it('has correct id and name', () => {
      expect(provider.providerId).toBe('mock');
      expect(provider.providerName).toBe('Mock Provider');
    });

    it('isAvailable returns true', async () => {
      expect(await provider.isAvailable()).toBe(true);
    });

    it('getCapabilities returns correct values', () => {
      expect(provider.getCapabilities()).toEqual({
        stream: false,
        vision: false,
        tools: false,
      });
    });

    it('chat returns responses based on agentId', async () => {
      const jinxResponse = await provider.chat({ agentId: 'jinx', message: 'hello', history: [] });
      expect(jinxResponse.content).toContain('Jinx answers');

      const novaResponse = await provider.chat({ agentId: 'nova', message: 'hello', history: [] });
      expect(novaResponse.content).toContain('Professor Nova here');

      const atlasResponse = await provider.chat({ agentId: 'atlas', message: 'hello', history: [] });
      expect(atlasResponse.content).toContain('analysis: concise');

      const defaultResponse = await provider.chat({ agentId: 'unknown', message: 'hello', history: [] });
      expect(defaultResponse.content).toContain('[Mock] Agent unknown says');
      expect(defaultResponse.model).toBe('mock/demo');
    });
  });

  describe('Provider Registry', () => {
    it('should have mock provider registered by default', () => {
      const p = getProvider('mock');
      expect(p).toBeDefined();
      expect(p?.providerId).toBe('mock');
    });

    it('getProvider returns undefined for unknown id', () => {
      expect(getProvider('unknown-id')).toBeUndefined();
    });

    it('registerProvider adds a new provider', () => {
      const dummyProvider: ProviderAdapter = {
        providerId: 'dummy',
        providerName: 'Dummy Provider',
        isAvailable: async () => true,
        chat: async () => ({ content: 'test', model: 'test' }),
        getCapabilities: () => ({ stream: false, vision: false, tools: false })
      };

      registerProvider(dummyProvider);

      const p = getProvider('dummy');
      expect(p).toBeDefined();
      expect(p?.providerId).toBe('dummy');
    });

    it('getDefaultProvider returns the first registered provider', () => {
      const defaultP = getDefaultProvider();
      expect(defaultP).toBeDefined();
      // 'mock' should be the first one as it's registered on module load
      expect(defaultP.providerId).toBe('mock');
    });

    it('listProviders returns all registered providers', () => {
      const list = listProviders();
      expect(list.length).toBeGreaterThan(0);

      const mockInfo = list.find(l => l.id === 'mock');
      expect(mockInfo).toBeDefined();
      expect(mockInfo?.name).toBe('Mock Provider');

      const dummyInfo = list.find(l => l.id === 'dummy');
      expect(dummyInfo).toBeDefined();
      expect(dummyInfo?.name).toBe('Dummy Provider');
    });
  });
});
