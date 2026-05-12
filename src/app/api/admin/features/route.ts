import { NextResponse } from 'next/server';

let features = {
  floatingEye: true, cursorTrail: true, particleBackground: true,
  chatPanel: true, autonomousActions: true, soundEffects: false,
};

export async function GET() {
  return NextResponse.json({ features });
}

export async function POST(request: Request) {
  const updates = await request.json();
  features = { ...features, ...updates };
  return NextResponse.json({ features });
}
