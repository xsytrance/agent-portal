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

// ── Internal Hook: State Management ───────────────────────────────
function useAtlasBrainState(brainRef: React.MutableRefObject<AtlasBrain | null>) {
  const [state, setState] = useState<AtlasState | null>(null);
  const [decision, setDecision] = useState<BehaviorDecision | null>(null);
  const [rareReady, setRareReady] = useState(false);
  const rareEventRef = useRef<boolean>(false);

  const applyDecision = useCallback((d: BehaviorDecision) => {
    setDecision(d);
    if (brainRef.current) {
      setState(brainRef.current.getState());
    }

    const hasRare = !!d.rareEventTrigger;
    setRareReady(hasRare);
    if (d.rareEventTrigger) {
      rareEventRef.current = d.rareEventTrigger;
    }
  }, [brainRef]);

  const consumeRareEvent = useCallback((): boolean => {
    const ev = rareEventRef.current;
    rareEventRef.current = false;
    setRareReady(false);
    return ev;
  }, []);

  return {
    state,
    decision,
    rareReady,
    rareEventRef,
    setState,
    setDecision,
    setRareReady,
    applyDecision,
    consumeRareEvent,
  };
}

// ── Internal Hook: Tick Loop ──────────────────────────────────────
function useAtlasBrainTick(
  brainRef: React.MutableRefObject<AtlasBrain | null>,
  applyDecision: (d: BehaviorDecision) => void,
  setState: React.Dispatch<React.SetStateAction<AtlasState | null>>
) {
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (brainRef.current) return;

    brainRef.current = new AtlasBrain();

    // Prime initial state
    const initialState = brainRef.current.getState();
    const initialDecision = brainRef.current.tick({
      type: 'TICK',
      timestamp: Date.now(),
    });
    setState(initialState);
    applyDecision(initialDecision);

    // Tick loop: every 500 ms
    tickRef.current = setInterval(() => {
      if (!brainRef.current) return;

      const d = brainRef.current.tick({
        type: 'TICK',
        timestamp: Date.now(),
      });
      applyDecision(d);
    }, 500);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      brainRef.current = null;
    };
  }, [applyDecision, setState, brainRef]);
}

// ── Internal Hook: Signals ────────────────────────────────────────
function useAtlasBrainSignals(
  brainRef: React.MutableRefObject<AtlasBrain | null>,
  applyDecision: (d: BehaviorDecision) => void
) {
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
      applyDecision(d);
      return d;
    },
    [brainRef, applyDecision],
  );

  const signalIdle = useCallback(() => sendSignal('IDLE'), [sendSignal]);
  const signalHover = useCallback((target: string) => sendSignal('HOVER', { target }), [sendSignal]);
  const signalScroll = useCallback(() => sendSignal('SCROLL'), [sendSignal]);
  const signalChat = useCallback(() => sendSignal('CHAT'), [sendSignal]);
  const signalAgentSwitch = useCallback(
    (agentId?: string) => sendSignal('AGENT_SWITCH', agentId ? { agentId } : undefined),
    [sendSignal],
  );

  return {
    sendSignal,
    signalIdle,
    signalHover,
    signalScroll,
    signalChat,
    signalAgentSwitch,
  };
}

export function useAtlasBrain(): AtlasBrainAPI {
  const brainRef = useRef<AtlasBrain | null>(null);

  const {
    state,
    decision,
    rareReady,
    setState,
    applyDecision,
    consumeRareEvent,
  } = useAtlasBrainState(brainRef);

  useAtlasBrainTick(brainRef, applyDecision, setState);

  const {
    sendSignal,
    signalIdle,
    signalHover,
    signalScroll,
    signalChat,
    signalAgentSwitch,
  } = useAtlasBrainSignals(brainRef, applyDecision);

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
