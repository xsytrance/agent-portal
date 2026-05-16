'use server';

export type RuntimeMode = 'mock' | 'development' | 'production';

export async function getOpenRouterKey(): Promise<string | undefined> {
  return process.env.OPENROUTER_API_KEY;
}

export async function getOpenRouterModel(): Promise<string> {
  return process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
}

export async function getAdminPassword(): Promise<string | undefined> {
  return process.env.ADMIN_PASSWORD;
}

export async function getAppEnv(): Promise<'development' | 'production'> {
  return (process.env.NODE_ENV as 'development' | 'production') || 'development';
}

export async function getRuntimeMode(): Promise<RuntimeMode> {
  const envMode = process.env.RUNTIME_MODE as RuntimeMode | undefined;
  if (envMode && ['mock', 'development', 'production'].includes(envMode)) return envMode;
  const key = await getOpenRouterKey();
  const nodeEnv = await getAppEnv();
  if (!key || !key.startsWith('sk-or-')) return 'mock';
  return nodeEnv === 'production' ? 'production' : 'development';
}

export async function isMockMode(): Promise<boolean> {
  return (await getRuntimeMode()) === 'mock';
}

export async function isDebugEnabled(): Promise<boolean> {
  const mode = await getRuntimeMode();
  return mode === 'mock' || mode === 'development';
}
