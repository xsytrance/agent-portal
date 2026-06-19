import { BudgetTier, EventTierRegistry } from './types';

export const EVENT_TIER_REGISTRY: EventTierRegistry = {
  // --- Free events (Tier 0) ---
  'eye:blink':            { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'eye:emotion':          { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'agent:micro_expression' },
  'agent:idle_float':     { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'particle:behavior':    { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'card:shuffle':         { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'card:hover_react':     { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'ui:repaint':           { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'ui:theme_change':      { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'ui:repaint' },
  'sound:cue':            { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'silence:enter':        { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'silence:exit':         { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'template:phrase':      { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: true,  fallbackEvent: 'visual:effect' },
  'visual:effect':        { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'agent:idle_float' },
  'agent:micro_expression': { tier: 'free',   estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'state:transition':     { tier: 'free',     estimatedTokens: 0,   requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },

  // --- Cheap events (Tier 1) ---
  'message:template':     { tier: 'cheap',    estimatedTokens: 50,  requiresAuth: false, cacheable: true,  fallbackEvent: 'template:phrase' },
  'message:cached':       { tier: 'cheap',    estimatedTokens: 50,  requiresAuth: false, cacheable: true,  fallbackEvent: 'message:template' },
  'summary:simple':       { tier: 'cheap',    estimatedTokens: 100, requiresAuth: false, cacheable: true,  fallbackEvent: 'message:template' },
  'status:update':        { tier: 'cheap',    estimatedTokens: 30,  requiresAuth: false, cacheable: true,  fallbackEvent: 'visual:effect' },
  'feed:cached':          { tier: 'cheap',    estimatedTokens: 50,  requiresAuth: false, cacheable: true,  fallbackEvent: 'status:update' },
  'quip:templated':       { tier: 'cheap',    estimatedTokens: 40,  requiresAuth: false, cacheable: true,  fallbackEvent: 'message:template' },
  'weather:cached':       { tier: 'cheap',    estimatedTokens: 30,  requiresAuth: false, cacheable: true,  fallbackEvent: 'template:phrase' },
  'news:headline':        { tier: 'cheap',    estimatedTokens: 50,  requiresAuth: false, cacheable: true,  fallbackEvent: 'template:phrase' },
  'agent:persona_shift':  { tier: 'cheap',    estimatedTokens: 20,  requiresAuth: false, cacheable: false, fallbackEvent: 'visual:effect' },
  'reminder:list':        { tier: 'cheap',    estimatedTokens: 30,  requiresAuth: false, cacheable: true,  fallbackEvent: 'template:phrase' },

  // --- Expensive events (Tier 2) ---
  'llm:chat_completion':     { tier: 'expensive', estimatedTokens: 1500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:cached' },
  'llm:research_query':      { tier: 'expensive', estimatedTokens: 4000, requiresAuth: true, cacheable: true,  fallbackEvent: 'summary:simple' },
  'llm:report_generation':   { tier: 'expensive', estimatedTokens: 5000, requiresAuth: true, cacheable: true,  fallbackEvent: 'summary:simple' },
  'llm:long_explanation':    { tier: 'expensive', estimatedTokens: 3500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:cached' },
  'agent:openclaw_call':     { tier: 'expensive', estimatedTokens: 2500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:template' },
  'agent:hermes_call':       { tier: 'expensive', estimatedTokens: 2500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:template' },
  'llm:code_generation':     { tier: 'expensive', estimatedTokens: 2000, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:template' },
  'llm:analysis':            { tier: 'expensive', estimatedTokens: 3500, requiresAuth: true, cacheable: true,  fallbackEvent: 'summary:simple' },
  'web:live_search':         { tier: 'expensive', estimatedTokens: 4500, requiresAuth: true, cacheable: true,  fallbackEvent: 'news:headline' },
  'llm:translation':         { tier: 'expensive', estimatedTokens: 1500, requiresAuth: true, cacheable: true,  fallbackEvent: 'message:template' },
};

export function classifyEvent(eventType: string): BudgetTier {
  const entry = EVENT_TIER_REGISTRY[eventType];
  if (!entry) {
    console.warn(`Unknown event type "${eventType}" -- defaulting to expensive tier`);
    return 'expensive';
  }
  return entry.tier;
}
