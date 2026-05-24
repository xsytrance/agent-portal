import { NextResponse } from 'next/server';

export async function GET() {
  // Logic to fetch active sessions
  return NextResponse.json({
    activeSessions: [
      {
        sessionId: 'session-1',
        agentId: 'nova',
        startTime: Date.now() - 300000,
        status: 'active',
        cost: 0.15,
      }
    ],
    totalActive: 1,
  });
}

export async function DELETE(req: Request) {
  try {
      const { searchParams } = new URL(req.url);
      const sessionId = searchParams.get('sessionId');

      if (!sessionId) {
          return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
      }

      // Logic to terminate the session
      return NextResponse.json({ success: true, terminated: sessionId });
  } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
