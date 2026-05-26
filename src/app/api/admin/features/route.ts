import { NextResponse } from 'next/server';

let features = {
  floatingEye: true, cursorTrail: true, particleBackground: true,
  chatPanel: true, autonomousActions: true, soundEffects: false,
};

async function isAuthenticated(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) return false;

  const expectedAuth = 'Basic ' + Buffer.from(`admin:${expectedPassword}`).toString('base64');
  return authHeader === expectedAuth;
}

export async function GET(request: Request) {
  if (!(await isAuthenticated(request))) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Agent Portal Admin"' },
    });
  }
  return NextResponse.json({ features });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated(request))) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Agent Portal Admin"' },
    });
  }
  const updates = await request.json();
  features = { ...features, ...updates };
  return NextResponse.json({ features });
}
