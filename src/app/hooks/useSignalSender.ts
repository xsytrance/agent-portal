'use client';

import { useCallback, useRef } from 'react';
import { UserSignal } from '@/app/lib/signals/types';

export function useSignalSender(agentId: string) {
  const batchRef = useRef<UserSignal[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendBatch = useCallback(async () => {
    if (batchRef.current.length === 0) return;

    const toSend = [...batchRef.current];
    batchRef.current = []; // Clear current batch immediately

    try {
      await fetch('/api/agent/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSend),
      });
    } catch (e) {
      console.error('Failed to send signal batch', e);
    }
  }, []);

  const dispatchSignal = useCallback(
    (kind: UserSignal['kind'], payload: UserSignal['payload']) => {
      const signal: UserSignal = {
        id: crypto.randomUUID(),
        kind,
        timestamp: new Date().toISOString(),
        targetAgentId: agentId,
        userId: 'anonymous-session', // TBD Session tracking
        currentAgentId: agentId,
        payload,
      };

      batchRef.current.push(signal);

      // Debounce the batch dispatch to happen every 500ms
      if (!timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          sendBatch();
          timeoutRef.current = null;
        }, 500);
      }
    },
    [agentId, sendBatch]
  );

  return { dispatchSignal };
}
