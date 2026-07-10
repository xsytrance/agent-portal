'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { agents as starterAgents } from '@/app/lib/agents/starterAgents';
import type { Agent } from '@/app/lib/agents/agentTypes';

export type { Agent };

export const agentsData: Agent[] = starterAgents;

interface AgentContextType {
  activeAgent: Agent;
  agents: Agent[];
  selectAgent: (agent: Agent) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  agentMessage: string | null;
  setAgentMessage: (msg: string | null) => void;
  isThinking: boolean;
  setIsThinking: (thinking: boolean) => void;
  autonomousEnabled: boolean;
  setAutonomousEnabled: (enabled: boolean) => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [activeAgent, setActiveAgent] = useState<Agent>(agentsData[0]);
  const [chatOpen, setChatOpen] = useState(false);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [autonomousEnabled, setAutonomousEnabled] = useState(true);

  const selectAgent = useCallback((agent: Agent) => {
    setActiveAgent(agent);
  }, []);

  return (
    <AgentContext.Provider value={{
      activeAgent,
      agents: agentsData,
      selectAgent,
      chatOpen,
      setChatOpen,
      agentMessage,
      setAgentMessage,
      isThinking,
      setIsThinking,
      autonomousEnabled,
      setAutonomousEnabled,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    // SSR-safe: return default during prerender
    return {
      activeAgent: agentsData[0],
      agents: agentsData,
      selectAgent: () => {},
      chatOpen: false,
      setChatOpen: () => {},
      agentMessage: null,
      setAgentMessage: () => {},
      isThinking: false,
      setIsThinking: () => {},
      autonomousEnabled: false,
      setAutonomousEnabled: () => {},
    } as AgentContextType;
  }
  return ctx;
}
