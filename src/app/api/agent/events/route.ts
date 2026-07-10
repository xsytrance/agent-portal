import { NextResponse } from 'next/server';
import { getRecentByVisibility, addEvent, getSequence } from '@/app/lib/events/eventStore';
import { validateEvent } from '@/app/lib/events/eventValidator';

/**
 * Public feed of portal events — the frontend polls this to let the
 * presence layer react to the outside world. Only `public` visibility
 * events are ever served here.
 */
export async function GET() {
  const events = await getRecentByVisibility(20, 'public');
  const sequence = await getSequence();
  return NextResponse.json({ events, sequence });
}

/**
 * Direct event injection — admin-only (the unauthenticated path for
 * external systems is the authenticated webhook routes).
 */
export async function POST(request: Request) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json({ success: false, errors: ['Not configured'] }, { status: 401 });
  }
  const expectedAuth = 'Basic ' + Buffer.from(`admin:${expectedPassword}`).toString('base64');
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.length !== expectedAuth.length || authHeader !== expectedAuth) {
    return NextResponse.json({ success: false, errors: ['Unauthorized'] }, { status: 401 });
  }

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
