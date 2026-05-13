import { NextResponse } from 'next/server';
import { getOpenRouterKey, getOpenRouterModel } from '@/app/lib/config/serverConfig';
import { MockProvider, registerProvider } from '@/app/lib/providers/providerAdapter';
import { OpenRouterProvider } from '@/app/lib/providers/openRouterProvider';
import { estimateChatTokens, classifyChatCost } from '@/app/lib/budget/costTiers';
import { assessBudgetForAction, recordUsage } from '@/app/lib/budget/budgetManager';
import { info, error, warn } from '@/app/lib/logger';

const mockProvider = new MockProvider();
registerProvider(mockProvider);

type ChatHistoryEntry = { role: 'user' | 'assistant'; content: string };

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

function createBudgetBlockedResponse(message: string, agentId: string, reason: string): {
  response: string;
  mock: true;
  budgetBlocked: true;
  reason: string;
} {
  const fallback = createMockResponse(message, agentId);
  return {
    ...fallback,
    response: `${fallback.response} Budget guardrail active: ${reason}`,
    budgetBlocked: true,
    reason,
  };
}

function isChatHistoryEntry(entry: unknown): entry is ChatHistoryEntry {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
  const raw = entry as Record<string, unknown>;
  return (raw.role === 'user' || raw.role === 'assistant') && typeof raw.content === 'string';
}

function sanitizeHistory(history: unknown): ChatHistoryEntry[] | undefined {
  if (history === undefined) return undefined;
  if (!Array.isArray(history)) return undefined;
  return history.filter(isChatHistoryEntry);
}

export async function POST(request: Request) {
  let body: { message?: string; agentId?: string; history?: unknown; sessionId?: string };

  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body', mock: false }, { status: 400 });
  }

  const { message, agentId = 'nova' } = body;
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required and must be a string', mock: false }, { status: 400 });
  }
  const history = sanitizeHistory(body.history);
  const sessionId = typeof body.sessionId === 'string' && body.sessionId.trim()
    ? body.sessionId.trim()
    : 'default';

  await ensureOpenRouterProvider();

  const key = await getOpenRouterKey();
  const hasProviderKey = !!key && key.startsWith('sk-or-');
  const costTier = classifyChatCost(hasProviderKey);
  const estimatedTokens = estimateChatTokens(message, history);

  if (hasProviderKey) {
    const budgetDecision = await assessBudgetForAction(sessionId, estimatedTokens, costTier);
    if (!budgetDecision.allowed) {
      await warn('chat-route', 'Serving mock response because budget blocked provider call', {
        route: '/api/agent/chat',
        details: {
          agentId,
          sessionId,
          reason: budgetDecision.reason,
          status: budgetDecision.status,
          estimatedTokens,
        },
      });
      return NextResponse.json({
        ...createBudgetBlockedResponse(message, agentId, budgetDecision.reason),
        budget: {
          status: budgetDecision.status,
          estimatedTokens,
          remainingTokens: budgetDecision.snapshot.remainingTokens,
        },
      });
    }

    try {
      const { getProvider } = await import('@/app/lib/providers/providerAdapter');
      const orProvider = getProvider('openrouter');
      if (orProvider) {
        const result = await orProvider.chat({ message, agentId, history });
        await recordUsage({
          sessionId,
          agentId,
          action: 'chat',
          costTier,
          promptTokens: result.usage?.prompt ?? estimatedTokens,
          completionTokens: result.usage?.completion ?? 0,
          model: result.model,
        });
        return NextResponse.json({ response: result.content, model: result.model, usage: result.usage, mock: false });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      await error('chat-route', `OpenRouter failed, falling back to mock: ${errMsg}`, { route: '/api/agent/chat', details: { agentId } });
    }
  }

  await info('chat-route', 'Serving mock response', { route: '/api/agent/chat', details: { agentId, hasKey: !!key, sessionId } });
  return NextResponse.json({
    ...createMockResponse(message, agentId),
    budget: {
      costTier,
      estimatedTokens,
    },
  });
}
