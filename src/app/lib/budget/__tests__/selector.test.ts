import { describe, it, expect, spyOn, afterEach } from 'bun:test';
import { selectProvider } from '../selector';
import { TokenBudget, BudgetConfig, RuntimeMode } from '../types';

describe('selectProvider', () => {
  const createMockBudget = (overrides?: Partial<TokenBudget>): TokenBudget => ({
    sessionId: 'test-session',
    totalBudget: 10000,
    tokensUsed: 0,
    tokensReserved: 0,
    freeActionsUsed: 0,
    cheapActionsUsed: 0,
    expensiveActionsUsed: 0,
    startTime: new Date().toISOString(),
    lastActionTime: new Date().toISOString(),
    status: 'healthy',
    minuteWindow: { windowStart: new Date().toISOString(), tokensUsed: 0, actionsCount: 0, apiCallsCount: 0, events: [] },
    fiveMinuteWindow: { windowStart: new Date().toISOString(), tokensUsed: 0, actionsCount: 0, apiCallsCount: 0, events: [] },
    agentSpending: [],
    mode: 'production',
    apiKeyPresent: true,
    metadata: {
      userAgent: 'test-agent',
      ipHash: 'test-ip',
      referrer: 'test-ref',
      totalEstimatedCost: 0,
      alertsTriggered: [],
      adminOverride: false,
    },
    ...overrides,
  });

  const createMockConfig = (overrides?: Partial<BudgetConfig>): BudgetConfig => ({
    defaultSessionBudget: 10000,
    mockModeBudget: 1000,
    developmentModeBudget: 5000,
    productionModeBudget: 20000,
    maxFreeActionsPerSession: 1000,
    maxCheapActionsPerSession: 500,
    maxExpensiveActionsPerSession: 100,
    maxTokensPerMinute: 2000,
    maxTokensPerFiveMinutes: 8000,
    maxApiCallsPerMinute: 10,
    maxApiCallsPerSession: 200,
    warningThreshold: 0.7,
    criticalThreshold: 0.9,
    exhaustedThreshold: 1.0,
    agentBudgets: [],
    degradationSettings: {
      warningCacheHitTarget: 0.5,
      warningTemplateRate: 0.5,
      warningSkipNonEssential: true,
      criticalUseOnlyTemplates: true,
      criticalUseOnlyFree: false,
      criticalAllowEmergency: true,
      exhaustedUseMock: true,
      exhaustedVisualOnly: false,
      exhaustedAllowAdminOverride: true,
    },
    alertSettings: {
      enabled: false,
      alertOnWarning: true,
      alertOnCritical: true,
      alertOnExhausted: true,
      alertOnEmergencyCutoff: true,
      cooldownMinutes: 5,
    },
    features: {
      enableRateLimiting: false,
      enableBudgetTracking: true,
      enableGracefulDegradation: true,
      enableAdminOverride: true,
      enablePerAgentBudgets: true,
      enableCostLogging: false,
      enableAlerts: false,
      enableRecoveryMode: false,
    },
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
    ...overrides,
  });

  const defaultContext = { apiKeyPresent: true, runtimeMode: 'production' as RuntimeMode };

  afterEach(() => {
    // Reset any math.random spies if added
  });

  it('should return mock provider for Rule 1 (mock mode)', () => {
    const decision = selectProvider(
      'llm:chat_completion',
      createMockBudget(),
      createMockConfig(),
      { ...defaultContext, runtimeMode: 'mock' }
    );
    expect(decision.provider).toBe('mock');
    expect(decision.reason).toContain('mock');
  });

  it('should return mock provider for Rule 2 (no API key)', () => {
    const decision = selectProvider(
      'llm:chat_completion',
      createMockBudget(),
      createMockConfig(),
      { ...defaultContext, apiKeyPresent: false }
    );
    expect(decision.provider).toBe('mock');
    expect(decision.reason).toContain('No API key configured');
  });

  it('should return mock provider for Rule 3 (budget exhausted)', () => {
    const decision = selectProvider(
      'llm:chat_completion',
      createMockBudget({ status: 'exhausted' }),
      createMockConfig(),
      defaultContext
    );
    expect(decision.provider).toBe('mock');
    expect(decision.reason).toContain('Budget exhausted');
  });

  it('should return mock provider for Rule 4 (global emergency)', () => {
    const budget = createMockBudget();
    budget.metadata.alertsTriggered = ['emergency_cutoff'];
    const decision = selectProvider(
      'llm:chat_completion',
      budget,
      createMockConfig(),
      defaultContext
    );
    expect(decision.provider).toBe('mock');
    expect(decision.reason).toContain('Global emergency cutoff');
  });

  it('should return none provider for Rule 5 (free events)', () => {
    const decision = selectProvider(
      'eye:blink', // known free event
      createMockBudget(),
      createMockConfig(),
      defaultContext
    );
    expect(decision.provider).toBe('none');
    expect(decision.tier).toBe('free');
  });

  it('should return template provider for Rule 6 (cheap events)', () => {
    const decision = selectProvider(
      'message:template', // known cheap event
      createMockBudget(),
      createMockConfig(),
      defaultContext
    );
    expect(decision.provider).toBe('template');
    expect(decision.tier).toBe('cheap');
  });

  it('should resolve fallback for Rule 8 (critical status)', () => {
    const config = createMockConfig();
    config.degradationSettings.criticalAllowEmergency = false;
    const decision = selectProvider(
      'llm:chat_completion', // expensive event
      createMockBudget({ status: 'critical' }),
      config,
      defaultContext
    );
    // falls back to message:cached -> message:template -> template:phrase -> visual:effect
    // critical mode disables expensive (unless emergency), cheap/free are allowed.
    // template fallback provider is expected.
    expect(['mock', 'template']).toContain(decision.provider);
    expect(decision.reason).toContain('Budget critical');
  });

  it('should return template provider for Rule 9 (warning status) based on probability', () => {
    // Math.random < warningTemplateRate (0.5) triggers template fallback
    const spy = spyOn(Math, 'random').mockReturnValue(0.1); // < 0.5 triggers template
    const decision = selectProvider(
      'llm:chat_completion', // expensive
      createMockBudget({ status: 'warning' }),
      createMockConfig(),
      defaultContext
    );
    expect(decision.provider).toBe('template');
    expect(decision.reason).toContain('Budget warning');
    spy.mockRestore();
  });

  it('should return default provider for Rule 9 (warning status) when random does not trigger template', () => {
    const spy = spyOn(Math, 'random').mockReturnValue(0.9); // > 0.5 triggers default
    const decision = selectProvider(
      'llm:chat_completion',
      createMockBudget({ status: 'warning' }),
      createMockConfig(),
      defaultContext
    );
    expect(decision.provider).toBe('openrouter'); // falls through to rule 12
    spy.mockRestore();
  });

  it('should return template provider for Rule 11 (per-agent budget exceeded)', () => {
    const budget = createMockBudget({
      agentSpending: [
        {
          agentId: 'agent1',
          agentName: 'Agent 1',
          tokensUsed: 1000,
          expensiveEventsCount: 0,
          cheapEventsCount: 0,
          freeEventsCount: 0,
          budgetAllocation: 1000,
          lastUsed: new Date().toISOString()
        }
      ]
    });
    const config = createMockConfig({
      features: { ...createMockConfig().features, enablePerAgentBudgets: true },
      agentBudgets: [
        {
          agentId: 'agent1',
          maxTokensPerSession: 500, // spent 1000 >= 500
          maxExpensiveEvents: 10,
          priority: 1,
          enabled: true
        }
      ]
    });

    const decision = selectProvider(
      'llm:chat_completion',
      budget,
      config,
      defaultContext
    );
    expect(decision.provider).toBe('template');
    expect(decision.reason).toContain('budget exceeded');
  });

  it('should return openrouter provider for Rule 12 (default)', () => {
    const decision = selectProvider(
      'llm:chat_completion',
      createMockBudget(),
      createMockConfig(),
      defaultContext
    );
    expect(decision.provider).toBe('openrouter');
  });
});
