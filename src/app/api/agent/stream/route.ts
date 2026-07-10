import { NextResponse } from 'next/server';
import { generateMockEvents } from '@/app/lib/events/mockEvents';
import { info, debug } from '@/app/lib/logger';

const HEARTBEAT_MS = 15000;
const EVENT_MS = 5000;
const MAX_EVENTS = 20;
const MAX_DURATION_MS = 5 * 60 * 1000;

function secureCompare(a: string, b: string): boolean {
  let expectedStr = b;
  let result = 0;

  if (a.length !== b.length) {
    expectedStr = a;
    result = 1;
  }

  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ expectedStr.charCodeAt(i);
  }
  return result === 0;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization') || (url.searchParams.get('token') ? `Basic ${url.searchParams.get('token')}` : '');
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Agent Portal Stream"' },
    });
  }

  const expectedAuth = 'Basic ' + Buffer.from(`admin:${expectedPassword}`).toString('base64');

  if (!authHeader || !secureCompare(authHeader, expectedAuth)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Agent Portal Stream"' },
    });
  }

  await info('sse', 'New client connected', { route: '/api/agent/stream' });
  const encoder = new TextEncoder();
  const clientId = Math.random().toString(36).substring(2, 10);
  let eventCount = 0;
  let lastActivity = Date.now();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`:heartbeat\n\n`));

      const eventTimer = setInterval(() => {
        if (closed) return;
        if (Date.now() - lastActivity > HEARTBEAT_MS * 2) {
          closed = true; clearInterval(eventTimer); clearInterval(hbTimer); clearTimeout(maxTimer);
          try { controller.close(); } catch { } return;
        }
        if (eventCount >= MAX_EVENTS) {
          closed = true; clearInterval(eventTimer); clearInterval(hbTimer); clearTimeout(maxTimer);
          controller.enqueue(encoder.encode(`event:close\ndata: {"reason":"max_events"}\n\n`));
          try { controller.close(); } catch { } return;
        }
        const event = generateMockEvents(1)[0];
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); eventCount++; lastActivity = Date.now(); }
        catch { closed = true; clearInterval(eventTimer); clearInterval(hbTimer); clearTimeout(maxTimer); }
      }, EVENT_MS);

      const hbTimer = setInterval(() => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`:hb\n\n`)); }
        catch { closed = true; clearInterval(eventTimer); clearInterval(hbTimer); clearTimeout(maxTimer); }
      }, HEARTBEAT_MS);

      const maxTimer = setTimeout(() => {
        if (closed) return;
        debug('sse', `Client ${clientId} max duration`, { route: '/api/agent/stream' });
        closed = true; clearInterval(eventTimer); clearInterval(hbTimer);
        try { controller.enqueue(encoder.encode(`event:close\ndata: {"reason":"timeout"}\n\n`)); controller.close(); } catch { }
      }, MAX_DURATION_MS);

      return () => { if (!closed) { closed = true; clearInterval(eventTimer); clearInterval(hbTimer); clearTimeout(maxTimer); debug('sse', `Client ${clientId} disconnected`, { route: '/api/agent/stream' }); } };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
