'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PortalEvent } from '@/app/lib/events/eventTypes';

const POLL_MS = 10000;

/**
 * Polls the public portal-event feed and surfaces events that arrived
 * since the page loaded. Polling (vs SSE) keeps this serverless-friendly
 * and cheap; the presence layer doesn't need sub-second latency to make
 * the eye glance up.
 */
export function usePortalEvents(onEvent?: (event: PortalEvent) => void) {
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/events', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { events?: PortalEvent[] } = await res.json();
      const incoming = Array.isArray(data.events) ? data.events : [];
      setConnected(true);

      const fresh = incoming.filter(e => e?.id && !seenIds.current.has(e.id));
      fresh.forEach(e => seenIds.current.add(e.id));

      // Events already in the store when the page loaded are history,
      // not something to react to now.
      if (!primed.current) {
        primed.current = true;
        return;
      }
      if (fresh.length) {
        setEvents(prev => [...prev.slice(-99), ...fresh]);
        fresh.forEach(e => onEventRef.current?.(e));
      }
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  return { events, connected };
}
