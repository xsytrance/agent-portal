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

  // Prevent mass assignment / prototype pollution by only allowing known keys
  const safeUpdates: Partial<typeof features> = {};
  for (const key of Object.keys(updates)) {
    if (key in features) {
      safeUpdates[key as keyof typeof features] = updates[key];
    }
  }

  features = { ...features, ...safeUpdates };
  return NextResponse.json({ features });
}
