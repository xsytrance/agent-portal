'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '@/app/context/AgentContext';
import type { AtlasBrainAPI } from '@/app/hooks/useAtlasBrain';

interface Message {
  id: string;
  role: 'agent' | 'user';
  content: string;
}

interface ChatMeta {
  mock: boolean;
  budgetStatus: string | null;
  sessionTokens: number;
}

interface ChatPanelProps {
  atlasBrain?: AtlasBrainAPI | null;
}

/** Stable per-tab session id so the server-side budget ledger can track us. */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = sessionStorage.getItem('portal-session-id');
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('portal-session-id', id);
  }
  return id;
}

export default function ChatPanel({ atlasBrain }: ChatPanelProps) {
  const { activeAgent, chatOpen, setChatOpen, setIsThinking } = useAgent();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [meta, setMeta] = useState<ChatMeta>({ mock: false, budgetStatus: null, sessionTokens: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const welcomedAgents = useRef<Set<string>>(new Set());
  // Which agent the in-memory transcript belongs to — guards against
  // persisting one agent's conversation under another's storage key
  // after a switch.
  const transcriptAgentRef = useRef<string | null>(null);

  // Signal chat interaction to AtlasBrain. Depend on the stable callback,
  // not the atlasBrain object — that's rebuilt every brain tick, and
  // signalChat() itself triggers a re-render (setState loop otherwise).
  const signalChat = atlasBrain?.signalChat;
  useEffect(() => {
    if (chatOpen && signalChat) {
      signalChat();
    }
  }, [chatOpen, signalChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typedText]);

  // Focus the input when the panel opens; Escape closes it
  useEffect(() => {
    if (!chatOpen) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChatOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chatOpen, setChatOpen]);

  /** Typewriter: reveal an agent reply, then commit it to the transcript. */
  const typeOutReply = useCallback((content: string, onDone?: () => void) => {
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
    setTyping(true);
    setTypedText('');
    let charIndex = 0;
    typeIntervalRef.current = setInterval(() => {
      if (charIndex < content.length) {
        charIndex = Math.min(content.length, charIndex + 2);
        setTypedText(content.slice(0, charIndex));
      } else {
        if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
        typeIntervalRef.current = null;
        setTyping(false);
        setTypedText('');
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + Math.random(),
          role: 'agent',
          content,
        }]);
        onDone?.();
      }
    }, 18);
  }, []);

  useEffect(() => () => {
    if (typeIntervalRef.current) clearInterval(typeIntervalRef.current);
  }, []);

  // Restore per-agent transcript; greet on first open of each agent
  useEffect(() => {
    if (!chatOpen) return;
    transcriptAgentRef.current = activeAgent.id;
    const stored = sessionStorage.getItem(`portal-chat-${activeAgent.id}`);
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
        return;
      } catch { /* fall through to greeting */ }
    }
    setMessages([]);
    if (!welcomedAgents.current.has(activeAgent.id)) {
      welcomedAgents.current.add(activeAgent.id);
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        typeOutReply(activeAgent.welcomeMessage);
      }, 600);
    }
  }, [chatOpen, activeAgent.id, activeAgent.welcomeMessage, setIsThinking, typeOutReply]);

  // Persist transcript per agent
  useEffect(() => {
    if (messages.length === 0) return;
    if (transcriptAgentRef.current !== activeAgent.id) return;
    try {
      sessionStorage.setItem(`portal-chat-${activeAgent.id}`, JSON.stringify(messages.slice(-40)));
    } catch { /* storage full — transcript just won't persist */ }
  }, [messages, activeAgent.id]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setTyping(true);
    setIsThinking(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentId: activeAgent.id,
          sessionId: getSessionId(),
          history: nextMessages.slice(-16).map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: {
        response: string;
        emotion?: string;
        mock?: boolean;
        usage?: { prompt: number; completion: number };
        budget?: { status: string; tokensUsed: number; totalBudget: number };
      } = await res.json();

      setMeta({
        mock: !!data.mock,
        budgetStatus: data.budget?.status ?? null,
        sessionTokens: data.budget?.tokensUsed ?? 0,
      });

      // The reply's emotion drives the eye and the particles.
      if (data.emotion && atlasBrain) {
        atlasBrain.sendSignal('EMOTION', { emotion: data.emotion });
      }

      setIsThinking(false);
      typeOutReply(data.response);
    } catch {
      setIsThinking(false);
      typeOutReply("*static* Connection hiccup — I'm still here, try that again.");
    }
  };

  const budgetWorry = meta.budgetStatus === 'warning' || meta.budgetStatus === 'critical' || meta.budgetStatus === 'exhausted';

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            onClick={() => setChatOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="fixed top-0 right-0 z-50 flex flex-col"
            style={{
              width: typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : (typeof window !== 'undefined' && window.innerWidth < 1024 ? '50vw' : '420px'),
              height: '100dvh',
              backgroundColor: 'rgba(15, 15, 35, 0.92)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderLeft: `1px solid ${activeAgent.glowColor}33`,
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="relative">
                <img
                  src={activeAgent.avatar}
                  alt={activeAgent.name}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: `2px solid ${activeAgent.primaryColor}` }}
                />
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: '#22c55e', border: '2px solid rgba(15,15,35,0.92)' }}
                />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold m-0" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem' }}>
                  {activeAgent.name}
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#CBD5E1' }}>
                    {meta.mock ? 'Online · demo mode' : 'Online'}
                  </span>
                </div>
              </div>
              {budgetWorry && (
                <span
                  title={`Session token budget: ${meta.budgetStatus}`}
                  className="px-2 py-1 rounded-full"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.625rem',
                    color: meta.budgetStatus === 'warning' ? '#FBBF24' : '#F87171',
                    border: `1px solid ${meta.budgetStatus === 'warning' ? '#FBBF2455' : '#F8717155'}`,
                  }}
                >
                  {meta.budgetStatus === 'warning' ? 'budget low' : 'budget spent'}
                </span>
              )}
              <button
                onClick={() => setChatOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                aria-label="Close chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ scrollbarWidth: 'thin', scrollbarColor: `${activeAgent.primaryColor}66 transparent` }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'agent' && (
                    <img
                      src={activeAgent.avatar}
                      alt={activeAgent.name}
                      className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 self-end"
                      style={{ border: `2px solid ${activeAgent.primaryColor}` }}
                    />
                  )}
                  <div
                    className="max-w-[80%] px-4 py-3"
                    style={{
                      background: msg.role === 'user'
                        ? `${activeAgent.primaryColor}33`
                        : 'rgba(255,249,240,0.15)',
                      color: 'white',
                      borderRadius: msg.role === 'user'
                        ? '16px 16px 4px 16px'
                        : '16px 16px 16px 4px',
                      borderLeft: msg.role === 'agent' ? `3px solid ${activeAgent.primaryColor}` : 'none',
                      fontSize: '0.9375rem',
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: 1.55,
                      backdropFilter: msg.role === 'agent' ? 'blur(10px)' : 'none',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && typedText && (
                <div className="flex justify-start">
                  <img
                    src={activeAgent.avatar}
                    alt={activeAgent.name}
                    className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 self-end"
                    style={{ border: `2px solid ${activeAgent.primaryColor}` }}
                  />
                  <div
                    className="max-w-[80%] px-4 py-3"
                    style={{
                      background: 'rgba(255,249,240,0.15)',
                      color: 'white',
                      borderRadius: '16px 16px 16px 4px',
                      borderLeft: `3px solid ${activeAgent.primaryColor}`,
                      fontSize: '0.9375rem',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {typedText}
                    <span className="inline-block w-0.5 h-4 ml-0.5 bg-white animate-pulse align-middle" />
                  </div>
                </div>
              )}

              {typing && !typedText && (
                <div className="flex justify-start">
                  <img
                    src={activeAgent.avatar}
                    alt={activeAgent.name}
                    className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 self-end"
                    style={{ border: `2px solid ${activeAgent.primaryColor}` }}
                  />
                  <div className="flex items-center gap-2 px-4 py-4 rounded-2xl" style={{ background: 'rgba(255,249,240,0.15)' }}>
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{
                        backgroundColor: activeAgent.primaryColor,
                        animation: 'typingDot 1.4s ease-in-out infinite',
                      }}
                    />
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{
                        backgroundColor: activeAgent.primaryColor,
                        animation: 'typingDot 1.4s ease-in-out 0.2s infinite',
                      }}
                    />
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{
                        backgroundColor: activeAgent.primaryColor,
                        animation: 'typingDot 1.4s ease-in-out 0.4s infinite',
                      }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Message ${activeAgent.name}...`}
                className="flex-1 px-4 py-3 text-white outline-none transition-all duration-300"
                style={{
                  backgroundColor: 'rgba(26, 26, 46, 0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = activeAgent.primaryColor; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              />
              <button
                onClick={handleSend}
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110"
                style={{ backgroundColor: activeAgent.primaryColor }}
                aria-label="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
