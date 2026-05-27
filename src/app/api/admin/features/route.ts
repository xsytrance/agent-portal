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

  // Validate and sanitize input: only allow valid boolean features
  if (updates && typeof updates === 'object') {
    for (const key of Object.keys(updates)) {
      if (key in features && typeof updates[key] === 'boolean') {
        features[key as keyof typeof features] = updates[key];
      }
    }
  }

  return NextResponse.json({ features });
}
