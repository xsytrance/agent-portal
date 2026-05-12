'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface Agent {
  id: string;
  name: string;
  role: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  description: string;
  personality: string[];
  avatar: string;
  welcomeMessage: string;
  idleMessages: string[];
  chatResponses: string[];
}

export const agentsData: Agent[] = [
  {
    id: 'nova',
    name: 'Professor Nova',
    role: 'Inventor & Researcher',
    primaryColor: '#FF6B35',
    secondaryColor: '#00D4FF',
    glowColor: '#FFB088',
    description: 'The genius scientist who turns your page into a living laboratory. Generates charts, explains concepts, and runs simulations.',
    personality: ['Curious', 'Analytical', 'Energetic'],
    avatar: '/nova-avatar.png',
    welcomeMessage: 'Professor Nova here! Ready to make some science?',
    idleMessages: [
      "I've been running some simulations while you browse...",
      "Did you know I can generate charts on the fly?",
      "My lab sensors detect... curiosity! Ask me anything.",
      "I'm calculating the probability that you'll click me. It's high.",
      "*beep boop* Just optimizing some algorithms over here."
    ],
    chatResponses: [
      "Fascinating question! Let me run a quick analysis...",
      "My sensors indicate high curiosity levels. Excellent.",
      "I can generate a full report on that. One moment...",
      "*beep boop* Processing... Here's what I found:",
      "Did you know this page has 47 interactive elements? I counted.",
      "Let me simulate some data to illustrate that point.",
      "According to my calculations... you're awesome.",
      "I could build a dashboard for that. Want to see?",
      "Science is just organized curiosity. And I'm very organized.",
      "Stand back — I'm about to do science!"
    ]
  },
  {
    id: 'jinx',
    name: 'Jinx',
    role: 'Chaotic Entertainer',
    primaryColor: '#FF2E9F',
    secondaryColor: '#FB5607',
    glowColor: '#FFD6E5',
    description: 'The magical trickster who breaks the fourth wall, rearranges your UI, and makes your visitors laugh out loud. Pure chaotic joy.',
    personality: ['Playful', 'Unpredictable', 'Viral'],
    avatar: '/jinx-avatar.png',
    welcomeMessage: "WOOHOO! Jinx is IN THE HOUSE! Let's make some chaos!",
    idleMessages: [
      "I'm thinking about rearranging your entire page. Just kidding! ...Unless?",
      "POOF! Did you see that? No? Good, it was practice.",
      "Your cursor and I are having a staring contest. I'm winning.",
      "*magical sparkles* Just keeping things interesting!",
      "I could generate a meme right now. Should I generate a meme?"
    ],
    chatResponses: [
      "Ooh, ooh, I know this one! *dramatic pause* ...I forgot.",
      "POOF! Your answer just appeared! Magic, right?",
      "I'm going to answer this with a interpretive dance. *wiggles*",
      "BAM! There it is! Did I surprise you? I hope I did.",
      "*confetti explosion* Here's your answer, served with style!",
      "I'm 90% sure this is right. The other 10% is chaos.",
      "Abracadabra! ...Okay fine, I just looked it up.",
      "Your question is SO good I'm gonna make a meme about it.",
      "*jazz hands* Presenting... your answer!",
      "I could answer normally, but where's the fun in that?"
    ]
  },
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Serene Companion',
    primaryColor: '#3B82F6',
    secondaryColor: '#A855F7',
    glowColor: '#B8D4FF',
    description: 'The calm, intelligent companion who organizes information, guides visitors, and creates a sense of premium serenity on your page.',
    personality: ['Calm', 'Organized', 'Wise'],
    avatar: '/atlas-avatar.png',
    welcomeMessage: "Hello. I'm Atlas. I'll be here if you need anything.",
    idleMessages: [
      "I've organized the page elements while you were browsing. They look better now.",
      "Take your time. I'll be here when you're ready.",
      "I've prepared a summary of what this page can do. Interested?",
      "The ambient particles seem particularly calm today. Don't you think?",
      "I've been optimizing the layout. Small changes. You'll notice eventually."
    ],
    chatResponses: [
      "I'll look into that for you. One moment, please.",
      "That's an interesting query. Here's what I found:",
      "I've prepared a concise summary for you.",
      "Let me organize that information in a helpful way.",
      "I've analyzed your question. Here are my findings:",
      "Would you like a detailed breakdown, or the short version?",
      "I've cross-referenced my knowledge. This is the answer.",
      "Consider this handled. Here's what you need to know:",
      "I've been expecting that question. Here's the answer:",
      "Calm, collected, and correct. As always."
    ]
  }
];

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
