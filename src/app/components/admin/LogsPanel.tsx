'use client';

import { useState, useRef, useEffect } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import type { LogEntry } from '@/app/hooks/useAdminConfig';
import { motion } from 'framer-motion';
import { Trash2, Download } from 'lucide-react';

type LogFilter = 'all' | 'autonomous' | 'chat' | 'errors';

interface LogsPanelProps {
  logs: LogEntry[];
  onClear: () => void;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

const levelColors: Record<string, { bg: string; text: string }> = {
  info: { bg: '#3B82F6', text: '#fff' },
  warn: { bg: '#FF6B35', text: '#fff' },
  error: { bg: '#ef4444', text: '#fff' },
  autonomous: { bg: '#A855F7', text: '#fff' },
};

export default function LogsPanel({ logs, onClear }: LogsPanelProps) {
  const { activeAgent } = useAgent();
  const primaryColor = activeAgent.primaryColor;
  const [filter, setFilter] = useState<LogFilter>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'autonomous') return log.level === 'autonomous';
    if (filter === 'chat') return log.source === 'chat' || log.source === 'eye';
    if (filter === 'errors') return log.level === 'error' || log.level === 'warn';
    return true;
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs.length]);

  const handleExport = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-portal-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filters: { key: LogFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'autonomous', label: 'Autonomous' },
    { key: 'chat', label: 'Chat' },
    { key: 'errors', label: 'Errors' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h3
          className="font-bold mb-2"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
            color: '#1A1A2E',
          }}
        >
          System Logs
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Recent events and debug output.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full transition-all"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                backgroundColor: filter === f.key ? primaryColor : 'transparent',
                color: filter === f.key ? '#fff' : '#64748B',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#64748B',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <Download size={14} />
            Export JSON
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#64748B',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      {/* Log List */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{
          maxHeight: 500,
          borderRadius: 12,
          border: '1px solid #F1F5F9',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9375rem',
                color: '#64748B',
                textAlign: 'center',
              }}
            >
              No logs yet. Events will appear here as they happen.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 px-4 py-2 transition-colors hover:bg-black/[0.02]"
              style={{ borderBottom: '1px solid #F1F5F9' }}
            >
              <span
                className="flex-shrink-0"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  color: '#64748B',
                  minWidth: 70,
                }}
              >
                {formatTime(log.timestamp)}
              </span>
              <span
                className="flex-shrink-0 px-2 py-0.5"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: levelColors[log.level]?.bg || '#64748B',
                  color: levelColors[log.level]?.text || '#fff',
                  borderRadius: 100,
                  minWidth: 50,
                  textAlign: 'center',
                }}
              >
                {log.level.toUpperCase()}
              </span>
              <span
                className="flex-shrink-0"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6875rem',
                  color: '#CBD5E1',
                  minWidth: 50,
                }}
              >
                [{log.source}]
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: '#1A1A2E',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {log.message}
              </span>
            </motion.div>
          ))
        )}
      </div>

      <div
        className="mt-3 text-right"
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.6875rem',
          color: '#CBD5E1',
        }}
      >
        {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
        {filter !== 'all' && ' (filtered)'}
      </div>
    </div>
  );
}
