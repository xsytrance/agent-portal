import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';
import { getEnvValidationReport } from '@/app/lib/config/env';

export async function GET() {
  let database: 'not_configured' | 'ok' | 'error' = 'not_configured';

  if (isDatabaseConfigured()) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'ok';
    } catch {
      database = 'error';
    }
  }

  return NextResponse.json({
    status: database === 'error' ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    database,
    environment: getEnvValidationReport(),
  });
}
