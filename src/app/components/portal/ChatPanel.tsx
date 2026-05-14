'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '@/app/context/AgentContext';
import type { AtlasBrainAPI } from '@/app/hooks/useAtlasBrain';

interface Message {
  id: string;
  role: 'agent' | 'user';
  content: string;
  isChart?: boolean;
}

interface CustomerModel {
  id: string;
  label: string;
  family: string;
}

const mockConversation: { role: 'agent' | 'user'; content: string; isChart?: boolean }[] = [
  { role: 'agent', content: "Hey! I'm your AI agent. I can generate charts, run simulations, and even repaint this whole page. Watch this —" },
  { role: 'agent', content: "chart", isChart: true },
  { role: 'user', content: "That's amazing! What else can you do?" },
  { role: 'agent', content: "I can react to visitors in real-time. See that particle field behind you? I control that. Move your cursor and watch them scatter." },
  { role: 'agent', content: "I can also create content on demand — blog posts, summaries, reports. Even mini webpages that pop up right here." },
  { role: 'agent', content: "Try typing something below, or just keep exploring. I'll be right here." },
];

interface ChatPanelProps {
  atlasBrain?: AtlasBrainAPI | null;
}

export default function ChatPanel({ atlasBrain }: ChatPanelProps) {
  const { activeAgent, chatOpen, setChatOpen, setIsThinking } = useAgent();

  // Signal chat interaction to AtlasBrain
  useEffect(() => {
    if (chatOpen && atlasBrain) {
      atlasBrain.signalChat();
    }
  }, [chatOpen, atlasBrain]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [chatSessionId, setChatSessionId] = useState<string | undefined>();
  const [sendError, setSendError] = useState<string | null>(null);
  const [models, setModels] = useState<CustomerModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');
  const [accountMode, setAccountMode] = useState<'guest' | 'paid' | 'unknown'>('unknown');
  const [lastStatus, setLastStatus] = useState('Demo mode. Sign in and add credits for paid model access.');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const convoIndex = useRef(0);
  const isAutoPlaying = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typedText]);

  useEffect(() => {
    fetch('/api/agent/models')
      .then((res) => res.json())
      .then((data) => {
        const available = data.models || [];
        setModels(available);
        if (available[0]?.id) setSelectedModel(available[0].id);
      })
      .catch(() => {
        setModels([]);
      });
  }, []);

  // Auto-play mock conversation when chat opens
  useEffect(() => {
    if (!chatOpen) {
      setMessages([]);
      convoIndex.current = 0;
      isAutoPlaying.current = false;
      return;
    }

    if (isAutoPlaying.current) return;
    isAutoPlaying.current = true;

    const playNext = () => {
      if (convoIndex.current >= mockConversation.length) {
        setTyping(false);
        return;
      }

      const msg = mockConversation[convoIndex.current];
      convoIndex.current++;

      if (msg.role === 'agent' && !msg.isChart) {
        setTyping(true);
        setIsThinking(true);
        let charIndex = 0;
        setTypedText('');

        const typeInterval = setInterval(() => {
          if (charIndex < msg.content.length) {
            setTypedText(msg.content.slice(0, charIndex + 1));
            charIndex++;
          } else {
            clearInterval(typeInterval);
            setTyping(false);
            setIsThinking(false);
            setTypedText('');
            setMessages((prev) => [...prev, {
              id: Date.now().toString() + Math.random(),
              role: 'agent',
              content: msg.content,
            }]);
            setTimeout(playNext, 1500);
          }
        }, 30);
      } else if (msg.isChart) {
        setTyping(false);
        setIsThinking(false);
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + Math.random(),
          role: 'agent',
          content: '',
          isChart: true,
        }]);
        setTimeout(playNext, 1500);
      } else {
        setTyping(false);
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + Math.random(),
          role: 'user',
          content: msg.content,
        }]);
        setTimeout(playNext, 1000);
      }
    };

    setTimeout(playNext, 500);

    return () => {
      setIsThinking(false);
    };
  }, [chatOpen, setIsThinking]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const outbound = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: outbound,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSendError(null);
    setTyping(true);
    setIsThinking(true);

    try {
      const history = messages
        .filter((msg) => !msg.isChart)
        .slice(-10)
        .map((msg) => ({ role: msg.role === 'user' ? 'user' as const : 'assistant' as const, content: msg.content }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: outbound,
          agentId: activeAgent.id,
          history,
          chatSessionId,
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.response) throw new Error(data.error || `Chat failed with HTTP ${res.status}`);
      if (data.chatSessionId) setChatSessionId(data.chatSessionId);
      setAccountMode(data.user?.isGuest ? 'guest' : 'paid');
      setLastStatus(data.budgetBlocked
        ? `Blocked: ${data.reason || 'Wallet guardrail active'}`
        : data.mock
          ? 'Demo/template response. Paid provider access requires sign-in and credits.'
          : `Paid response via ${data.model || 'selected model'}`);
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + Math.random(),
        role: 'agent',
        content: data.budgetBlocked ? `${data.response}` : data.response,
      }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send message';
      setSendError(message);
      const responses = activeAgent.chatResponses;
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + Math.random(),
        role: 'agent',
        content: responses[Math.floor(Math.random() * responses.length)],
      }]);
    } finally {
      setTyping(false);
      setIsThinking(false);
    }
  };

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
                    Online
                  </span>
                </div>
              </div>
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

            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="flex-1 rounded-xl px-3 py-2 text-white"
                  style={{ backgroundColor: 'rgba(26,26,46,0.75)', border: '1px solid rgba(255,255,255,0.16)' }}
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.family}: {model.label}
                    </option>
                  ))}
                  {models.length === 0 && <option value={selectedModel}>ChatGPT Fast</option>}
                </select>
                <span className="rounded-full px-2 py-1" style={{ fontSize: '0.6875rem', color: accountMode === 'paid' ? '#86EFAC' : '#FCD34D', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                  {accountMode === 'paid' ? 'Paid' : 'Demo'}
                </span>
              </div>
              <p className="m-0" style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>
                {lastStatus}
              </p>
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
                    {msg.isChart ? (
                      <div>
                        <img
                          src="/demo-mock-chart.png"
                          alt="Chart"
                          className="w-full rounded-lg mb-2"
                          style={{ maxHeight: 200, objectFit: 'cover' }}
                        />
                        <p className="m-0" style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>
                          Your simulated traffic data — notice the weekend spike?
                        </p>
                      </div>
                    ) : (
                      msg.content
                    )}
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
            <div className="relative px-5 py-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {sendError && (
                <div className="absolute bottom-[76px] left-5 right-5 rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.16)', color: '#FCA5A5', fontSize: '0.75rem' }}>
                  Chat service fallback: {sendError}
                </div>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
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
