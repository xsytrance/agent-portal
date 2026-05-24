'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Signal } from '../lib/behavior/types';

interface SignalSenderConfig {
  batchSize?: number;
  flushIntervalMs?: number;
}

export function useSignalSender(config: SignalSenderConfig = {}) {
  const { batchSize = 10, flushIntervalMs = 5000 } = config;
  const pendingSignals = useRef<Signal[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flush = useCallback(async () => {
    if (pendingSignals.current.length === 0) return;

    const signalsToSend = [...pendingSignals.current];
    pendingSignals.current = []; // Clear current batch

    try {
      const response = await fetch('/api/agent/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signalsToSend),
      });

      if (!response.ok) {
        console.error('Failed to send signals', await response.text());
        // Simple retry logic could go here, or re-adding to queue,
        // but for now we just drop them to avoid memory leaks if offline
      }
    } catch (err) {
      console.error('Error sending signals:', err);
    }
  }, []);

  const sendSignal = useCallback((type: string, payload: Record<string, unknown> = {}, urgency = 1.0) => {
    const signal: Signal = {
      id: crypto.randomUUID(),
      source: 'user',
      type,
      payload,
      timestamp: Date.now(),
      urgency,
    };

    pendingSignals.current.push(signal);

    if (pendingSignals.current.length >= batchSize) {
      flush();
    }
  }, [batchSize, flush]);

  // Set up flush interval
  useEffect(() => {
    timeoutRef.current = setInterval(flush, flushIntervalMs);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
      // Flush remaining on unmount
      if (pendingSignals.current.length > 0) {
        // use sendBeacon or similar in production for reliable unload
        flush();
      }
    };
  }, [flush, flushIntervalMs]);

  return { sendSignal, flush };
}
