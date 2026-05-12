'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '@/app/context/AgentContext';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import AgentSelector from './portal/AgentSelector';

/* ─── Feature icons as SVG components ─── */
function SparkleIcon({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
      <path d="M5 3l.5 2" />
      <path d="M19 3l-.5 2" />
      <path d="M20 10l2 .5" />
      <path d="M2 10l2-.5" />
    </svg>
  );
}

function PulseIcon({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-2.5" />
      <path d="M13 12H9" />
      <path d="M4.5 12H2" />
      <circle cx="16" cy="12" r="3" />
      <circle cx="6" cy="12" r="3" />
    </svg>
  );
}

function WandIcon({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4V2" />
      <path d="M15 16v-2" />
      <path d="M8 9h2" />
      <path d="M20 9h2" />
      <path d="M17.8 11.8l1.4 1.4" />
      <path d="M17.8 6.2l1.4-1.4" />
      <path d="M10.2 11.8l-1.4 1.4" />
      <path d="M10.2 6.2l-1.4-1.4" />
      <path d="M15 8a3 3 0 11-3 3" />
    </svg>
  );
}

function LayersIcon({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

const features = [
  {
    title: 'Generate Content',
    description: 'Create blog posts, charts, reports, summaries, and even mini webpages — all on demand, all styled to match your brand.',
    icon: SparkleIcon,
    image: '/feature-magic.png',
  },
  {
    title: 'React in Real-Time',
    description: 'Track cursor movement, respond to clicks, notice when visitors linger, and autonomously engage — your page becomes a conversation.',
    icon: PulseIcon,
    image: '/feature-reactive.png',
  },
  {
    title: 'Create Experiences',
    description: 'Transform your page on the fly — theme changes, card generation, data visualizations, interactive demos that appear out of nowhere.',
    icon: WandIcon,
    image: '/feature-create.png',
  },
  {
    title: 'Organize & Structure',
    description: 'Summarize information, categorize content, build dashboards, and create structure from chaos — your digital librarian.',
    icon: LayersIcon,
    image: null,
  },
];

/* ─── Reusable feature bullet icon ─── */
function BulletIcon({ type, color }: { type: string; color: string }) {
  if (type === 'sparkle') return <SparkleIcon color={color} />;
  if (type === 'pulse') return <PulseIcon color={color} />;
  return <WandIcon color={color} />;
}

export default function HomePage() {
  const { activeAgent, setChatOpen } = useAgent();
  const reducedMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [greetingDone, setGreetingDone] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setGreetingDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToAgents = () => {
    const el = document.getElementById('agents');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: '#FFF9F0' }}>
      {/* ════════ Section 1: Hero ════════ */}
      <section
        ref={heroRef}
        className="relative flex items-center min-h-[100dvh] overflow-hidden"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/hero-ambient-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Radial gradient overlay */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,249,240,0.6) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 w-full px-6 max-w-7xl mx-auto" style={{ paddingTop: 64 }}>
          <div className="max-w-xl">
            {/* Headline */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              <h1
                className="font-bold leading-[1.05]"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 'clamp(3rem, 7vw, 6rem)',
                  letterSpacing: '-0.03em',
                  color: '#1A1A2E',
                }}
              >
                Your Webpage
                <br />
                Just Came{' '}
                <span
                  className="inline-block"
                  style={{
                    color: activeAgent.primaryColor,
                    textShadow: `0 0 40px ${activeAgent.glowColor}`,
                    animation: greetingDone ? 'pulseGlow 3s ease-in-out infinite' : 'none',
                  }}
                >
                  Alive
                </span>
              </h1>
            </motion.div>

            {/* Subheadline */}
            <motion.p
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="mt-6"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '1.125rem',
                lineHeight: 1.65,
                color: '#64748B',
                maxWidth: 520,
              }}
            >
              Meet the AI agent that lives on your website. It talks to visitors, creates content, and makes your page feel magical.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.9,
                ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
              }}
              className="mt-8"
            >
              <button
                onClick={scrollToAgents}
                className="inline-flex items-center gap-2 px-7 py-3 text-white font-bold transition-all duration-300 hover:scale-105"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  backgroundColor: activeAgent.primaryColor,
                  borderRadius: '100px',
                  boxShadow: `0 0 20px ${activeAgent.glowColor}4D`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.15)';
                  e.currentTarget.style.boxShadow = `0 0 24px ${activeAgent.glowColor}66`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                  e.currentTarget.style.boxShadow = `0 0 20px ${activeAgent.glowColor}4D`;
                }}
              >
                Meet Your Agent
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{ animation: 'bounceArrow 1.5s ease-in-out infinite' }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Scroll Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: scrolled ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        >
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#CBD5E1',
              letterSpacing: '0.08em',
            }}
          >
            Scroll to explore
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'chevronBounce 2s ease-in-out infinite' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </section>

      {/* ════════ Section 2: Choose Your Agent ════════ */}
      <section
        id="agents"
        className="relative z-10"
        style={{
          padding: 'clamp(80px, 12vw, 160px) clamp(1rem, 5vw, 4rem)',
          background: `linear-gradient(180deg, #FFF9F0 0%, ${activeAgent.primaryColor}0A 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Section label */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-center mb-4"
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: activeAgent.primaryColor,
                textTransform: 'uppercase',
              }}
            >
              CHOOSE YOUR AGENT
            </span>
          </motion.div>

          {/* Section headline */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-center mb-4"
          >
            <h2
              className="font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
                color: '#1A1A2E',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              Who Will You Bring to Life?
            </h2>
          </motion.div>

          {/* Section description */}
          <motion.p
            initial={reducedMotion ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-center mx-auto mb-12"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: '#64748B',
              maxWidth: 560,
            }}
          >
            Each agent has a unique personality, style, and set of abilities. Pick the one that matches your vibe — you can always switch later.
          </motion.p>

          {/* Agent Cards */}
          <AgentSelector />
        </div>
      </section>

      {/* ════════ Section 3: Live Demo / Chat Panel ════════ */}
      <section
        id="demo"
        className="relative z-10"
        style={{
          padding: 'clamp(80px, 12vw, 160px) clamp(1rem, 5vw, 4rem)',
          background: `radial-gradient(circle at center, ${activeAgent.primaryColor}08 0%, #FFF9F0 70%)`,
        }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Section label */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-center mb-4"
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: activeAgent.primaryColor,
                textTransform: 'uppercase',
              }}
            >
              LIVE DEMO
            </span>
          </motion.div>

          {/* Section headline */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-center mb-12"
          >
            <h2
              className="font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
                color: '#1A1A2E',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              See What Your Agent Can Do
            </h2>
          </motion.div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            {/* Chat Panel (left, 3/5) */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="lg:col-span-3"
            >
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  backgroundColor: 'rgba(15, 15, 35, 0.92)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                  border: `1px solid ${activeAgent.glowColor}33`,
                  minHeight: 500,
                }}
              >
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="relative">
                    <img
                      src={activeAgent.avatar}
                      alt={activeAgent.name}
                      className="w-10 h-10 rounded-full object-cover"
                      style={{ border: `2px solid ${activeAgent.primaryColor}` }}
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500" style={{ border: '2px solid rgba(15,15,35,0.92)' }} />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold m-0" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem' }}>
                      {activeAgent.name}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#CBD5E1' }}>Online</span>
                    </div>
                  </div>
                </div>

                {/* Mock chat messages (static display) */}
                <div className="px-5 py-4 flex flex-col gap-3" style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {/* Agent intro */}
                  <div className="flex items-end gap-2">
                    <img src={activeAgent.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${activeAgent.primaryColor}` }} />
                    <div className="max-w-[80%] px-4 py-3" style={{ background: 'rgba(255,249,240,0.15)', borderRadius: '16px 16px 16px 4px', borderLeft: `3px solid ${activeAgent.primaryColor}`, color: 'white', fontSize: '0.9375rem', fontFamily: "'Inter', sans-serif", backdropFilter: 'blur(10px)' }}>
                      Hey! I'm {activeAgent.name}. I can generate charts, run simulations, and even repaint this whole page. Watch this —
                    </div>
                  </div>

                  {/* Chart card */}
                  <div className="flex items-end gap-2">
                    <img src={activeAgent.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${activeAgent.primaryColor}` }} />
                    <motion.div
                      initial={reducedMotion ? {} : { opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
                      className="max-w-[80%] px-4 py-3" style={{ background: 'rgba(255,249,240,0.15)', borderRadius: '16px 16px 16px 4px', borderLeft: `3px solid ${activeAgent.primaryColor}`, color: 'white', fontSize: '0.9375rem' }}
                    >
                      <img src="/demo-mock-chart.png" alt="Chart" className="w-full rounded-lg mb-2" style={{ maxHeight: 180, objectFit: 'cover' }} />
                      <p className="m-0" style={{ fontSize: '0.875rem', color: '#CBD5E1' }}>Your simulated traffic data — notice the weekend spike?</p>
                    </motion.div>
                  </div>

                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-3" style={{ backgroundColor: `${activeAgent.primaryColor}33`, borderRadius: '16px 16px 4px 16px', color: 'white', fontSize: '0.9375rem', fontFamily: "'Inter', sans-serif" }}>
                      That's amazing! What else can you do?
                    </div>
                  </div>

                  {/* Agent response */}
                  <div className="flex items-end gap-2">
                    <img src={activeAgent.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${activeAgent.primaryColor}` }} />
                    <div className="max-w-[80%] px-4 py-3" style={{ background: 'rgba(255,249,240,0.15)', borderRadius: '16px 16px 16px 4px', borderLeft: `3px solid ${activeAgent.primaryColor}`, color: 'white', fontSize: '0.9375rem', fontFamily: "'Inter', sans-serif", backdropFilter: 'blur(10px)' }}>
                      I can react to visitors in real-time. See that particle field behind you? I control that. Move your cursor and watch them scatter.
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div className="flex items-end gap-2">
                    <img src={activeAgent.avatar} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: `2px solid ${activeAgent.primaryColor}` }} />
                    <div className="flex items-center gap-2 px-4 py-4 rounded-2xl" style={{ background: 'rgba(255,249,240,0.15)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeAgent.primaryColor, animation: 'typingDot 1.4s ease-in-out infinite' }} />
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeAgent.primaryColor, animation: 'typingDot 1.4s ease-in-out 0.2s infinite' }} />
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeAgent.primaryColor, animation: 'typingDot 1.4s ease-in-out 0.4s infinite' }} />
                    </div>
                  </div>
                </div>

                {/* Input area */}
                <div className="px-5 py-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    readOnly
                    className="flex-1 px-4 py-3 text-white outline-none"
                    style={{
                      backgroundColor: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '16px',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9375rem',
                    }}
                  />
                  <button
                    onClick={() => setChatOpen(true)}
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:scale-110"
                    style={{ backgroundColor: activeAgent.primaryColor }}
                    aria-label="Open chat"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Info Panel (right, 2/5) */}
            <motion.div
              initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="lg:col-span-2"
            >
              <h3
                className="font-bold mb-4"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                  color: '#1A1A2E',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                This Is Just the Beginning
              </h3>
              <p
                className="mb-8"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  lineHeight: 1.55,
                  color: '#64748B',
                }}
              >
                In the full version, your agent will autonomously post updates, generate reports, rearrange content, and respond to every visitor uniquely. This demo uses mock data — the real magic connects to your backend.
              </p>

              {/* Feature bullets */}
              <div className="flex flex-col gap-5">
                {[
                  { icon: 'sparkle', text: 'Autonomous content generation' },
                  { icon: 'pulse', text: 'Real-time visitor reactions' },
                  { icon: 'wand', text: 'Visual page manipulation' },
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={reducedMotion ? {} : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div style={{ color: activeAgent.primaryColor, flexShrink: 0 }}>
                      <BulletIcon type={item.icon} color={activeAgent.primaryColor} />
                    </div>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.9375rem',
                        color: '#64748B',
                      }}
                    >
                      {item.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* CTA to open real chat */}
              <motion.button
                initial={reducedMotion ? {} : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.7 }}
                onClick={() => setChatOpen(true)}
                className="mt-8 px-6 py-3 font-bold transition-all duration-300 hover:scale-105"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  backgroundColor: 'transparent',
                  border: `2px solid ${activeAgent.primaryColor}`,
                  color: activeAgent.primaryColor,
                  borderRadius: '100px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = activeAgent.primaryColor;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = activeAgent.primaryColor;
                }}
              >
                Try the Chat
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════ Section 4: What Agents Can Do ════════ */}
      <section
        className="relative z-10"
        style={{
          padding: 'clamp(80px, 12vw, 160px) clamp(1rem, 5vw, 4rem)',
          backgroundColor: '#FFF9F0',
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Section label */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-center mb-4"
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: activeAgent.primaryColor,
                textTransform: 'uppercase',
              }}
            >
              CAPABILITIES
            </span>
          </motion.div>

          {/* Section headline */}
          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-center mb-12"
          >
            <h2
              className="font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
                color: '#1A1A2E',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              What Can Your Agent Do?
            </h2>
          </motion.div>

          {/* Feature cards 2x2 grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={reducedMotion ? {} : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                }}
                whileHover={{ y: -6 }}
                className="group relative rounded-3xl overflow-hidden transition-all duration-400"
                style={{
                  background: 'rgba(255, 249, 240, 0.15)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = activeAgent.glowColor;
                  e.currentTarget.style.boxShadow = `0 12px 40px ${activeAgent.glowColor}26`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {feature.image && (
                  <div className="w-full h-48 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="mb-4 relative inline-block">
                    <feature.icon color={activeAgent.primaryColor} />
                    {/* Rotating glow ring behind icon */}
                    <div
                      className="absolute inset-[-4px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        border: `2px solid ${activeAgent.primaryColor}40`,
                        animation: 'ringPulse 2s ease-in-out infinite',
                      }}
                    />
                  </div>
                  <h3
                    className="font-bold mb-2"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                      color: '#1A1A2E',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.9375rem',
                      lineHeight: 1.55,
                      color: '#64748B',
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ Section 5: Footer CTA ════════ */}
      <section
        className="relative z-10 flex flex-col items-center justify-center text-center"
        style={{
          minHeight: '50vh',
          padding: 'clamp(80px, 12vw, 160px) clamp(1rem, 5vw, 4rem)',
          backgroundColor: '#0F0F23',
        }}
      >
        <div className="max-w-2xl">
          <motion.h2
            initial={reducedMotion ? {} : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="font-bold mb-6"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              maxWidth: 640,
              margin: '0 auto 1.5rem',
            }}
          >
            Ready to Bring Your Page to Life?
          </motion.h2>

          <motion.p
            initial={reducedMotion ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="mb-8 mx-auto"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: '#CBD5E1',
              maxWidth: 480,
            }}
          >
            Your AI agent is waiting. Choose a starter, open the chat, and see what happens when a webpage gets a personality.
          </motion.p>

          <motion.div
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
            }}
          >
            <button
              onClick={scrollToAgents}
              className="inline-flex items-center gap-2 text-white font-bold transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '1.125rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                backgroundColor: activeAgent.primaryColor,
                borderRadius: '100px',
                padding: '16px 40px',
                boxShadow: `0 0 40px ${activeAgent.glowColor}66`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 60px ${activeAgent.primaryColor}66`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 40px ${activeAgent.glowColor}66`;
              }}
            >
              Get Started Free
            </button>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
