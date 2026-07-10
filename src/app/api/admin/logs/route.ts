import { NextResponse } from 'next/server';
import { getRecentEvents, getStats } from '@/app/lib/events/eventStore';

export async function GET() {
  const events = await getRecentEvents(100);
  const stats = await getStats();
  const logs = events.map(e => ({
    id: e.id, timestamp: e.timestamp,
    level: e.importance === 'critical' ? 'error' : e.importance === 'high' ? 'warn' : 'info',
    source: e.source, type: e.type, agentId: e.agentId,
    message: `[${e.type}] ${JSON.stringify(e.payload, (key, value) => typeof value === 'string' && value.length > 100 ? value.slice(0, 100) + '...' : value)}`,
  }));
  return NextResponse.json({ logs, stats });
}
