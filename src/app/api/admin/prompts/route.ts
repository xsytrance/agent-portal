import { NextResponse } from 'next/server';
import { agents } from '@/app/lib/agents/starterAgents';

export async function GET() {
  const prompts = agents.map(a => ({
    agentId: a.id,
    systemPrompt: `You are ${a.name}, ${a.role.toLowerCase()}. ${a.description}`,
  }));
  return NextResponse.json({ prompts });
}
