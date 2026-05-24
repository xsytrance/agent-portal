import { NextResponse } from 'next/server';

export async function GET() {
  // Logic to fetch budget status from memory or persistent store
  return NextResponse.json({
    status: 'healthy',
    sessionBudget: 4000,
    remainingTokens: 3500,
    spentByTier: {
      free: 15,
      low: 5,
      medium: 1,
      high: 0,
    },
  });
}

export async function POST(req: Request) {
  try {
    const config = await req.json();
    // Logic to update budget config
    return NextResponse.json({ success: true, config });
  } catch {
    return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 });
  }
}
