import { NextResponse } from 'next/server';
import { getRecentEvents, addEvent } from '@/app/lib/events/eventStore';
import { validateEvent } from '@/app/lib/events/eventValidator';

export async function GET() {
  const events = await getRecentEvents(50);
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, errors: ['Invalid JSON body'] }, { status: 400 });
  }

  const result = validateEvent(body);
  if (!result.valid || !result.sanitized) {
    return NextResponse.json({ success: false, errors: result.errors }, { status: 400 });
  }

  const seq = await addEvent(result.sanitized);
  return NextResponse.json({ success: true, sequence: seq });
}
