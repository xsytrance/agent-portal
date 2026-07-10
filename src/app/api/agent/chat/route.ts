import { NextResponse } from 'next/server';
import { getOpenRouterKey, getOpenRouterModel } from '@/app/lib/config/serverConfig';
import { MockProvider, getProvider, registerProvider } from '@/app/lib/providers/providerAdapter';
import { OpenRouterProvider } from '@/app/lib/providers/openRouterProvider';
import { agents } from '@/app/lib/agents/starterAgents';
import { emotionProtocol, parseEmotionReply } from '@/app/lib/agents/emotions';
import { checkBudget, recordUsage } from '@/app/lib/budget/sessionBudget';
import { info, error } from '@/app/lib/logger';

const mockProvider = new MockProvider();
registerProvider(mockProvider);

async function ensureOpenRouterProvider(): Promise<void> {
  const key = await getOpenRouterKey();
  if (key && key.startsWith('sk-or-') && !getProvider('openrouter')) {
    registerProvider(new OpenRouterProvider(
      {
        providerId: 'openrouter', providerName: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1', model: await getOpenRouterModel(),
        keyRef: 'OPENROUTER_API_KEY', enabled: true,
      }, key
    ));
  }
}

function buildSystemPrompt(agentId: string): { prompt: string; temperature: number } {
  const agent = agents.find(a => a.id === agentId);
  const persona = agent?.systemPrompt
    ?? `You are ${agent?.name ?? agentId}, ${agent?.role ?? 'an agent'} living on a webpage. Stay in character. Keep replies short.`;
  return {
    prompt: persona + '\n' + emotionProtocol(),
    temperature: agent?.temperature ?? 0.8,
  };
}

interface ChatBody {
  message?: string;
  agentId?: string;
  sessionId?: string;
  history?: Array<{ role: string; content: string }>;
}

const MAX_HISTORY_TURNS = 12;
const MAX_MESSAGE_CHARS = 2000;

async function mockReply(message: string, agentId: string, budget: ReturnType<typeof checkBudget>, reason: string) {
  await info('chat-route', `Serving mock response (${reason})`, { route: '/api/agent/chat', details: { agentId } });
  const result = await mockProvider.chat({ message, agentId });
  const { emotion, text } = parseEmotionReply(result.content);
  return NextResponse.json({
    response: text,
    emotion,
    model: result.model,
    mock: true,
    budget: { status: budget.status, tokensUsed: budget.tokensUsed, totalBudget: budget.totalBudget },
  });
}

export async function POST(request: Request) {
  let body: ChatBody;

  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body', mock: false }, { status: 400 });
  }

  const { message, agentId = 'nova', sessionId = 'anonymous' } = body;
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required and must be a string', mock: false }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: `message too long (max ${MAX_MESSAGE_CHARS} chars)`, mock: false }, { status: 400 });
  }

  await ensureOpenRouterProvider();

  const budget = checkBudget(sessionId);
  const key = await getOpenRouterKey();
  const hasRealProvider = !!key && key.startsWith('sk-or-');

  // Graceful degradation: critical/exhausted sessions never reach the LLM.
  if (!hasRealProvider || !budget.allowLlm) {
    return mockReply(message, agentId, budget, hasRealProvider ? `budget ${budget.status}` : 'no API key');
  }

  try {
    const orProvider = getProvider('openrouter');
    if (orProvider) {
      const history = (body.history || [])
        .filter((m): m is { role: string; content: string } => typeof m?.content === 'string')
        .slice(-MAX_HISTORY_TURNS * 2)
        .map(m => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content.slice(0, MAX_MESSAGE_CHARS),
        }));

      const { prompt, temperature } = buildSystemPrompt(agentId);
      const result = await orProvider.chat({
        message, agentId, history,
        systemPrompt: prompt,
        maxTokens: budget.maxTokens,
        temperature,
      });

      const spent = (result.usage?.prompt ?? 0) + (result.usage?.completion ?? 0);
      const entry = recordUsage(sessionId, spent || budget.maxTokens); // no usage data → assume worst case
      const { emotion, text } = parseEmotionReply(result.content);

      return NextResponse.json({
        response: text,
        emotion,
        model: result.model,
        usage: result.usage,
        mock: false,
        budget: { status: entry.status, tokensUsed: entry.tokensUsed, totalBudget: entry.totalBudget },
      });
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    await error('chat-route', `OpenRouter failed, falling back to mock: ${errMsg}`, { route: '/api/agent/chat', details: { agentId } });
  }

  return mockReply(message, agentId, budget, 'provider fallback');
}
