'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAgent } from '@/app/context/AgentContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeAgent } = useAgent();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Agents', href: '/#agents' },
    { label: 'Demo', href: '/#demo' },
    { label: 'Admin', href: '/admin' },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
        style={{
          height: 64,
          background: scrolled ? 'rgba(15, 15, 35, 0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        }}
      >
        <div className="flex items-center justify-between h-full px-6 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span
              className="font-bold text-white flex items-center gap-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem' }}
            >
              Agent P
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="inline-block">
                <ellipse cx="12" cy="12" rx="10" ry="7" fill="#fff" opacity="0.95" />
                <circle cx="12" cy="12" r="4" fill={activeAgent.primaryColor} />
                <circle cx="13" cy="11" r="1.5" fill="#fff" opacity="0.8" />
              </svg>
              rtal
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="relative text-sm font-bold transition-colors duration-300 no-underline group"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  color: '#CBD5E1',
                }}
              >
                <span className="group-hover:text-white transition-colors">{link.label}</span>
                <span
                  className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: activeAgent.primaryColor }}
                />
              </Link>
            ))}
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8"
            style={{ backgroundColor: 'rgba(15, 15, 35, 0.98)', backdropFilter: 'blur(24px)' }}
          >
            <button
              className="absolute top-4 right-4 text-white p-2"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {navLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-white no-underline font-bold"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '2rem',
                  }}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
