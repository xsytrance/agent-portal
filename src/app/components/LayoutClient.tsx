'use client';

import { AgentProvider } from '@/app/context/AgentContext';
import { useLenis } from '@/app/hooks/useLenis';
import { useAutonomousLoop } from '@/app/hooks/useAutonomousLoop';
import { useEffect } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import FloatingEye from './portal/FloatingEye';
import ChatPanel from './portal/ChatPanel';
import ParticleBackground from './portal/ParticleBackground';

function ThemeSync({ children }: { children: React.ReactNode }) {
  const { activeAgent } = useAgent();
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--agent-primary', activeAgent.primaryColor);
    root.style.setProperty('--agent-secondary', activeAgent.secondaryColor);
    root.style.setProperty('--agent-glow', activeAgent.glowColor);
    const hex = activeAgent.glowColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    root.style.setProperty('--agent-glow-rgb', `${r},${g},${b}`);
  }, [activeAgent]);
  return <>{children}</>;
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  useLenis();
  useAutonomousLoop();

  return (
    <AgentProvider>
      <ThemeSync>
        <ParticleBackground />
        <div className="relative z-10">
          <Navbar />
          <main>{children}</main>
          <Footer />
        </div>
        <FloatingEye />
        <ChatPanel />
      </ThemeSync>
    </AgentProvider>
  );
}
