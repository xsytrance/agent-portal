'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface PortalEvent {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

export function usePortalEvents() {
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const es = new EventSource('/api/agent/stream');
      esRef.current = es;
      es.onopen = () => setConnected(true);
      es.onmessage = (e) => {
        try { setEvents(p => [...p.slice(-99), JSON.parse(e.data)]); } catch { /* */ }
      };
      es.onerror = () => {
        setConnected(false);
        es.close();
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(connect, 5000);
      };
    } catch { setConnected(false); }
  }, []);

  useEffect(() => {
    connect();
    return () => { esRef.current?.close(); reconnectRef.current && clearTimeout(reconnectRef.current); };
  }, [connect]);

  return { events, connected };
}
