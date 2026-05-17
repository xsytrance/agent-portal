/**
 * useIdleDetection
 *
 * Detects when the user has been idle (no mouse, scroll, keypress).
 * Uses refs (not state) for the idle flag to avoid re-renders.
 * Calls onIdle / onActive callbacks when transitions occur.
 *
 * @example
 * ```tsx
 * const { isIdle } = useIdleDetection({
 *   timeoutMs: 5000,
 *   onIdle: () => console.log('user went idle'),
 *   onActive: () => console.log('user returned'),
 * });
 *
 * // Later:
 * if (isIdle()) { ... }
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseIdleDetectionOptions {
  /** Milliseconds of inactivity before considering idle. Default: 5000 */
  timeoutMs?: number;
  /** Called once when the user becomes idle */
  onIdle?: (idleDurationMs: number) => void;
  /** Called once when the user returns from idle */
  onActive?: (idleDurationMs: number) => void;
}

export function useIdleDetection(options: UseIdleDetectionOptions = {}) {
  const { timeoutMs = 5000, onIdle, onActive } = options;

  // Use refs for flags to avoid re-renders on every mouse move
  const isIdleRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastActiveTimeRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    const now = Date.now();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If we were idle, transition back to active
    if (isIdleRef.current) {
      isIdleRef.current = false;
      onActive?.(now - lastActiveTimeRef.current);
    }

    lastActiveTimeRef.current = now;

    // Start a new idle timer
    timerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      onIdle?.(timeoutMs);
    }, timeoutMs);
  }, [timeoutMs, onIdle, onActive]);

  useEffect(() => {
    // Listen to all interactive events
    const events: string[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true }),
    );

    // Start the initial timer
    resetTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer),
      );
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resetTimer]);

  /** Returns the current idle state (callable anytime, no re-render) */
  const isIdle = useCallback(() => isIdleRef.current, []);

  return { isIdle };
}
