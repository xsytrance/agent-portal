import { ProviderAdapter, getProvider, registerProvider } from './providerAdapter';
import { OpenRouterProvider } from './openRouterProvider';
import { OllamaProvider } from './ollamaProvider';
import {
  getLlmProviderChoice, getOpenRouterKey, getOpenRouterModel,
  getOllamaHost, getOllamaModel,
} from '../config/serverConfig';

// Cache the auto-detection result briefly so every chat request doesn't
// re-probe Ollama. 60s is short enough that starting/stopping Ollama is
// picked up quickly.
let cachedId: string | null = null;
let cachedAt = 0;
const CACHE_MS = 60 * 1000;

async function ensureOpenRouter(): Promise<ProviderAdapter | null> {
  const key = await getOpenRouterKey();
  if (!key || !key.startsWith('sk-or-')) return null;
  let p = getProvider('openrouter');
  if (!p) {
    p = new OpenRouterProvider(
      {
        providerId: 'openrouter', providerName: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1', model: await getOpenRouterModel(),
        keyRef: 'OPENROUTER_API_KEY', enabled: true,
      }, key
    );
    registerProvider(p);
  }
  return p;
}

async function ensureOllama(): Promise<ProviderAdapter | null> {
  let p = getProvider('ollama');
  if (!p) {
    p = new OllamaProvider(await getOllamaHost(), await getOllamaModel());
    registerProvider(p);
  }
  return (await p.isAvailable()) ? p : null;
}

/**
 * Resolve the real LLM provider for this request, or null for mock mode.
 * Explicit LLM_PROVIDER wins; 'auto' prefers the cloud key if present,
 * then a reachable local Ollama.
 */
export async function selectRealProvider(): Promise<ProviderAdapter | null> {
  const choice = await getLlmProviderChoice();

  if (choice === 'mock') return null;
  if (choice === 'openrouter') return ensureOpenRouter();
  if (choice === 'ollama') return ensureOllama();

  // auto
  const now = Date.now();
  if (cachedId !== null && now - cachedAt < CACHE_MS) {
    return cachedId === 'mock' ? null : getProvider(cachedId) ?? null;
  }
  const provider = (await ensureOpenRouter()) ?? (await ensureOllama());
  cachedId = provider?.providerId ?? 'mock';
  cachedAt = now;
  return provider;
}

/** Human-readable provider name for health/status endpoints. */
export async function describeProvider(): Promise<string> {
  const p = await selectRealProvider();
  return p ? p.providerId : 'mock';
}
