import { useEffect } from 'react';
import { useAgent } from '@/context/AgentContext';
import { useAutonomousLoop } from '@/hooks/useAutonomousLoop';
import { useLenis } from '@/hooks/useLenis';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingEye from './FloatingEye';
import ChatPanel from './ChatPanel';
import ParticleBackground from './ParticleBackground';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { activeAgent } = useAgent();
  useAutonomousLoop();
  useLenis();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--agent-primary', activeAgent.primaryColor);
    root.style.setProperty('--agent-secondary', activeAgent.secondaryColor);
    root.style.setProperty('--agent-glow', activeAgent.glowColor);

    // Set RGB version for box-shadow usage
    const hex = activeAgent.glowColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    root.style.setProperty('--agent-glow-rgb', `${r},${g},${b}`);
  }, [activeAgent]);

  return (
    <div className="relative min-h-[100dvh]">
      <ParticleBackground />
      <div className="relative z-10">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
      <FloatingEye />
      <ChatPanel />
    </div>
  );
}
