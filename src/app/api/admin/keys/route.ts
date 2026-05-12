import { NextResponse } from 'next/server';
import { getOpenRouterKey, getOpenRouterModel } from '@/app/lib/config/serverConfig';

export async function GET() {
  const key = await getOpenRouterKey();
  return NextResponse.json({
    configured: !!key,
    masked: key ? `${key.slice(0, 8)}...${key.slice(-4)}` : null,
    model: await getOpenRouterModel(),
  });
}

export async function POST(request: Request) {
  const { action } = await request.json();
  return NextResponse.json({ success: false, message: 'Key updates require server restart in Phase 1.6. Set OPENROUTER_API_KEY in .env.local and restart.' });
}
