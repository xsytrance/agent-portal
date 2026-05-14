import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  ADMIN_BASIC_AUTH_ENABLED: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().optional(),
  OPENROUTER_EMERGENCY_DISABLED: z.string().optional(),
  OPENROUTER_ALLOWED_MODELS: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_5: z.string().optional(),
  STRIPE_PRICE_10: z.string().optional(),
  STRIPE_PRICE_20: z.string().optional(),
  STRIPE_PRICE_50: z.string().optional(),
  DAILY_SPEND_CAP_MICROCREDITS: z.string().optional(),
  GLOBAL_DAILY_SPEND_CAP_MICROCREDITS: z.string().optional(),
  MAX_PROMPT_CHARS: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse(process.env);
}

export function getEnvValidationReport(): {
  valid: boolean;
  missingForProduction: string[];
  warnings: string[];
} {
  const env = getEnv();
  const missingForProduction: string[] = [];
  const warnings: string[] = [];

  for (const key of ['DATABASE_URL', 'NEXTAUTH_SECRET', 'ADMIN_PASSWORD', 'ADMIN_EMAILS', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']) {
    if (!env[key as keyof AppEnv]) missingForProduction.push(key);
  }

  if (!env.OPENROUTER_API_KEY) warnings.push('OPENROUTER_API_KEY missing: provider calls will run in mock/degraded mode.');
  if (!env.DATABASE_URL) warnings.push('DATABASE_URL missing: persistent wallets/auth are disabled and guest demo fallback is used.');

  return {
    valid: missingForProduction.length === 0,
    missingForProduction,
    warnings,
  };
}

export function parseIntegerEnv(name: keyof AppEnv, fallback: number): number {
  const raw = getEnv()[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}
