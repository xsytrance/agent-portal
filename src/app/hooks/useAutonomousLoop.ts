'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import { useReducedMotion } from './useReducedMotion';

export function useAutonomousLoop() {
  const { activeAgent, autonomousEnabled, setAgentMessage, chatOpen } = useAgent();
  const reducedMotion = useReducedMotion();
  const lastEventTime = useRef(0);
  const lastInteractionTime = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordInteraction = useCallback(() => {
    lastInteractionTime.current = Date.now();
  }, []);

  useEffect(() => {
    const handler = () => { lastInteractionTime.current = Date.now(); };
    window.addEventListener('mousemove', handler);
    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || !autonomousEnabled) return;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastInteractionTime.current;
      const timeSinceLastEvent = now - lastEventTime.current;

      if (idleTime > 5000 && timeSinceLastEvent > 30000 && !chatOpen) {
        const messages = activeAgent.idleMessages;
        const msg = messages[Math.floor(Math.random() * messages.length)];
        setAgentMessage(msg);
        lastEventTime.current = now;

        setTimeout(() => {
          setAgentMessage(null);
        }, 5000);
      }
    }, 20000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeAgent, autonomousEnabled, chatOpen, reducedMotion, setAgentMessage]);

  return { recordInteraction };
}
