import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '@/context/AgentContext';

interface Message {
  id: string;
  role: 'agent' | 'user';
  content: string;
  isChart?: boolean;
}

const mockConversation: { role: 'agent' | 'user'; content: string; isChart?: boolean }[] = [
  { role: 'agent', content: "Hey! I'm your AI agent. I can generate charts, run simulations, and even repaint this whole page. Watch this —" },
  { role: 'agent', content: "chart", isChart: true },
  { role: 'user', content: "That's amazing! What else can you do?" },
  { role: 'agent', content: "I can react to visitors in real-time. See that particle field behind you? I control that. Move your cursor and watch them scatter." },
  { role: 'agent', content: "I can also create content on demand — blog posts, summaries, reports. Even mini webpages that pop up right here." },
  { role: 'agent', content: "Try typing something below, or just keep exploring. I'll be right here." },
];

export default function ChatPanel() {
  const { activeAgent, chatOpen, setChatOpen, setIsThinking } = useAgent();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const convoIndex = useRef(0);
  const isAutoPlaying = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typedText]);

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

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Mock agent response
    setTimeout(() => {
      setTyping(true);
      setIsThinking(true);
      const responses = activeAgent.chatResponses;
      const response = responses[Math.floor(Math.random() * responses.length)];

      setTimeout(() => {
        setTyping(false);
        setIsThinking(false);
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + Math.random(),
          role: 'agent',
          content: response,
        }]);
      }, 1500);
    }, 500);
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
            <div className="px-5 py-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
