import { NextResponse } from 'next/server';
import { getOpenRouterKey, getOpenRouterModel } from '@/app/lib/config/serverConfig';
import { MockProvider, registerProvider } from '@/app/lib/providers/providerAdapter';
import { OpenRouterProvider } from '@/app/lib/providers/openRouterProvider';
import { info, error } from '@/app/lib/logger';

const mockProvider = new MockProvider();
registerProvider(mockProvider);

async function ensureOpenRouterProvider(): Promise<void> {
  const key = await getOpenRouterKey();
  if (key && key.startsWith('sk-or-')) {
    registerProvider(new OpenRouterProvider(
      {
        providerId: 'openrouter', providerName: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1', model: await getOpenRouterModel(),
        keyRef: 'OPENROUTER_API_KEY', enabled: true,
      }, key
    ));
  }
}

function createMockResponse(message: string, agentId: string): { response: string; mock: true } {
  const responses: Record<string, string> = {
    nova: `Professor Nova here! You asked about "${message.slice(0, 60)}..." Let me analyze that. *beep boop* Fascinating!`,
    jinx: `POOF! Jinx answers "${message.slice(0, 60)}..." with MAGIC! *confetti* Was that helpful?`,
    atlas: `I've processed "${message.slice(0, 60)}..." Here is my concise analysis: excellent question.`,
  };
  return {
    response: responses[agentId] || `[Demo Mode] Agent ${agentId} received: "${message}". OpenRouter not configured.`,
    mock: true,
  };
}

export async function POST(request: Request) {
  let body: { message?: string; agentId?: string; history?: Array<{ role: string; content: string }> };

  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body', mock: false }, { status: 400 });
  }

  const { message, agentId = 'nova' } = body;
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required and must be a string', mock: false }, { status: 400 });
  }

  await ensureOpenRouterProvider();

  const key = await getOpenRouterKey();
  if (key && key.startsWith('sk-or-')) {
    try {
      const { getProvider } = await import('@/app/lib/providers/providerAdapter');
      const orProvider = getProvider('openrouter');
      if (orProvider) {
        const result = await orProvider.chat({ message, agentId, history: body.history });
        return NextResponse.json({ response: result.content, model: result.model, usage: result.usage, mock: false });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      await error('chat-route', `OpenRouter failed, falling back to mock: ${errMsg}`, { route: '/api/agent/chat', details: { agentId } });
    }
  }

  await info('chat-route', 'Serving mock response', { route: '/api/agent/chat', details: { agentId, hasKey: !!key } });
  return NextResponse.json(createMockResponse(message, agentId));
}
