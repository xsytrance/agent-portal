import { NextResponse } from 'next/server';
import { agents } from '@/app/lib/agents/starterAgents';

export async function GET() {
  return NextResponse.json({ agents });
}
