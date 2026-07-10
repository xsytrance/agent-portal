/**
 * useAtlasBrain
 *
 * The main integration hook that instantiates AtlasBrain, runs the
 * 500 ms tick loop, and exposes everything UI components need:
 *   • current state & decisions  (for debugging / display)
 *   • eye behavior               (for FloatingEye)
 *   • silence mode               (for status indicators)
 *   • rare-event readiness       (for one-off easter eggs)
 *   • typed signal helpers       (for idle, hover, scroll, chat, agent-switch)
 *
 * The brain instance lives in a ref so it survives React re-renders.
 * Only `state`, `decision`, and `rareReady` are React state — everything
 * else is ref-based to keep renders cheap.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { AtlasBrain } from '@/app/lib/atlas/brain';
import type {
  BehaviorSignal,
  BehaviorDecision,
  AtlasState,
  EyeBehavior,
  SilenceMode,
} from '@/app/lib/atlas/types';

export interface AtlasBrainAPI {
  /** Current state snapshot (for debugging / display panels) */
  state: AtlasState | null;
  /** Eye behavior for FloatingEye component */
  eyeBehavior: EyeBehavior | null;
  /** Silence mode for status indicators */
  silenceMode: SilenceMode;
  /** Whether a rare event is ready to fire (consume it!) */
  rareEventReady: boolean;
  /** Consume the current rare event trigger (returns it and clears) */
  consumeRareEvent: () => boolean;
  /** Signal that the user has gone idle */
  signalIdle: () => void;
  /** Signal that the user hovered over an interactive zone */
  signalHover: (target: string) => void;
  /** Signal that the user scrolled */
  signalScroll: () => void;
  /** Signal that the user opened / interacted with chat */
  signalChat: () => void;
  /** Signal that the active agent has been switched */
  signalAgentSwitch: (agentId?: string) => void;
  /** Raw signal method for custom signals */
  sendSignal: (type: BehaviorSignal['type'], payload?: Record<string, unknown>) => BehaviorDecision | undefined;
}

function useAtlasBrainState() {
  const [state, setState] = useState<AtlasState | null>(null);
  const [decision, setDecision] = useState<BehaviorDecision | null>(null);
  const [rareReady, setRareReady] = useState(false);
  const rareEventRef = useRef<boolean>(false);

  const updateFromDecision = useCallback((d: BehaviorDecision, currentState: AtlasState) => {
    setDecision(d);
    setState(currentState);
    const hasRare = !!d.rareEventTrigger;
    setRareReady(hasRare);
    if (d.rareEventTrigger) {
      rareEventRef.current = d.rareEventTrigger;
    }
  }, []);

  return { state, decision, rareReady, rareEventRef, setRareReady, updateFromDecision };
}

export function useAtlasBrain(): AtlasBrainAPI {
  const brainRef = useRef<AtlasBrain | null>(null);

  // React state and update logic
  const { state, decision, rareReady, rareEventRef, setRareReady, updateFromDecision } = useAtlasBrainState();

  // Refs for the tick loop
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (brainRef.current) return;

    brainRef.current = new AtlasBrain();

    // Prime initial state
    const initialDecision = brainRef.current.tick({
      type: 'TICK',
      timestamp: Date.now(),
    });
    updateFromDecision(initialDecision, brainRef.current.getState());

    // Tick loop: every 500 ms
    tickRef.current = setInterval(() => {
      if (!brainRef.current) return;

      const d = brainRef.current.tick({
        type: 'TICK',
        timestamp: Date.now(),
      });
      updateFromDecision(d, brainRef.current.getState());
    }, 500);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      brainRef.current = null;
    };
  }, [updateFromDecision]);

  const sendSignal = useCallback(
    (
      type: BehaviorSignal['type'],
      payload?: Record<string, unknown>,
    ): BehaviorDecision | undefined => {
      if (!brainRef.current) return undefined;

      const signal: BehaviorSignal = {
        type,
        timestamp: Date.now(),
        payload,
      };

      const d = brainRef.current.tick(signal);
      updateFromDecision(d, brainRef.current.getState());

      return d;
    },
    [updateFromDecision],
  );

  const signalIdle = useCallback(() => sendSignal('IDLE'), [sendSignal]);
  const signalHover = useCallback((target: string) => sendSignal('HOVER', { target }), [sendSignal]);
  const signalScroll = useCallback(() => sendSignal('SCROLL'), [sendSignal]);
  const signalChat = useCallback(() => sendSignal('CHAT'), [sendSignal]);
  const signalAgentSwitch = useCallback(
    (agentId?: string) => sendSignal('AGENT_SWITCH', agentId ? { agentId } : undefined),
    [sendSignal],
  );

  // ── Rare event consumption ──────────────────────────────────────
  const consumeRareEvent = useCallback((): boolean => {
    const ev = rareEventRef.current;
    rareEventRef.current = false;
    setRareReady(false);
    return ev;
  }, [rareEventRef, setRareReady]);

  return {
    state,
    eyeBehavior: decision?.eyeBehavior ?? null,
    silenceMode: decision?.silenceMode ?? 'OBSERVING',
    rareEventReady: rareReady,
    consumeRareEvent,
    signalIdle,
    signalHover,
    signalScroll,
    signalChat,
    signalAgentSwitch,
    sendSignal,
  };
}
