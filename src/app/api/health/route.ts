import { NextResponse } from 'next/server';
import { getStats } from '@/app/lib/events/eventStore';
import { listSessions } from '@/app/lib/budget/sessionBudget';
import { describeProvider } from '@/app/lib/providers/selectProvider';

const startedAt = Date.now();

export async function GET() {
  const eventStats = await getStats();
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    provider: await describeProvider(),
    adminConfigured: !!process.env.ADMIN_PASSWORD,
    webhookConfigured: !!process.env.WEBHOOK_SECRET_GENERIC,
    events: { stored: eventStats.totalStored, sequence: eventStats.sequence },
    activeSessions: listSessions().length,
  });
}
