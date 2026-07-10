'use client';

import { AgentProvider, useAgent } from '@/app/context/AgentContext';
import { useLenis } from '@/app/hooks/useLenis';
import { useAutonomousLoop } from '@/app/hooks/useAutonomousLoop';
import { useAtlasBrain } from '@/app/hooks/useAtlasBrain';
import { useIdleDetection } from '@/app/hooks/useIdleDetection';
import { usePortalEvents } from '@/app/hooks/usePortalEvents';
import { useCallback, useEffect, useRef } from 'react';
import type { PortalEvent } from '@/app/lib/events/eventTypes';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';
import FloatingEye from './portal/FloatingEye';
import ChatPanel from './portal/ChatPanel';
import ParticleBackground from './portal/ParticleBackground';

/** Syncs CSS custom properties when the active agent changes */
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

/**
 * Wire the outside world into the presence layer: external events from
 * webhooks surface here — the eye glances up (EXTERNAL_EVENT) and, when
 * the event carries a public message, it appears as a speech bubble.
 */
function PortalEventsBridge({ brain }: { brain: ReturnType<typeof useAtlasBrain> }) {
  const { setAgentMessage } = useAgent();
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEvent = useCallback((event: PortalEvent) => {
    brain.sendSignal('EXTERNAL_EVENT', { eventType: event.type });
    const message = event.payload?.message;
    if (typeof message === 'string' && message.trim()) {
      setAgentMessage(message);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => setAgentMessage(null), 6000);
    }
  }, [brain, setAgentMessage]);

  usePortalEvents(handleEvent);

  useEffect(() => () => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
  }, []);

  return null;
}

/** Press `/` anywhere (outside an input) to open the chat. */
function KeyboardShortcuts() {
  const { chatOpen, setChatOpen } = useAgent();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || chatOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      e.preventDefault();
      setChatOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen, setChatOpen]);

  return null;
}

/** Wire agent switching into AtlasBrain */
function AgentBrainSync({ brain }: { brain: ReturnType<typeof useAtlasBrain> }) {
  const { activeAgent } = useAgent();
  const { signalAgentSwitch } = brain;

  useEffect(() => {
    // Notify brain whenever the active agent changes
    signalAgentSwitch(activeAgent.id);
  }, [activeAgent.id, signalAgentSwitch]);

  return null;
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  useLenis();
  useAutonomousLoop();

  // ── Atlas 2A: Brain integration ──────────────────────────────
  const brain = useAtlasBrain();

  // ── Idle detection ────────────────────────────────────────────
  useIdleDetection({
    timeoutMs: 5000,
    onIdle: brain.signalIdle,
    onActive: () => {
      // Brain naturally transitions back via subsequent hover / scroll signals
    },
  });

  // ── Scroll detection (debounced) ─────────────────────────────
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      // Debounce: only signal after 150 ms of scroll inactivity
      scrollTimeout = setTimeout(() => brain.signalScroll(), 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [brain.signalScroll]);

  return (
    <AgentProvider>
      <ThemeSync>
        <AgentBrainSync brain={brain} />
        <PortalEventsBridge brain={brain} />
        <KeyboardShortcuts />
        <ParticleBackground atlasBrain={brain} />
        <div className="relative z-10">
          <Navbar />
          <main>{children}</main>
          <Footer />
        </div>
        <FloatingEye atlasBrain={brain} />
        <ChatPanel atlasBrain={brain} />
      </ThemeSync>
    </AgentProvider>
  );
}
