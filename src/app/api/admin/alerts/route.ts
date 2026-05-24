import { NextResponse } from 'next/server';

export async function GET() {
  // Logic to fetch alert configurations
  return NextResponse.json({
    emailAlertsEnabled: true,
    webhookAlertsEnabled: false,
    budgetCriticalThreshold: 85,
    budgetWarningThreshold: 60,
  });
}

export async function POST(req: Request) {
  try {
      const config = await req.json();
      // Logic to save alert configurations
      return NextResponse.json({ success: true, config });
  } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
