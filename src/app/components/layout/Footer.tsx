'use client';

import { useAgent } from '@/app/context/AgentContext';

export default function Footer() {
  const { activeAgent } = useAgent();

  return (
    <footer className="w-full py-16 px-6" style={{ backgroundColor: '#0F0F23' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <span
              className="font-bold text-white flex items-center gap-1 mb-3"
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
            <p style={{ color: '#64748B', fontSize: '0.9375rem', fontFamily: "'Inter', sans-serif" }}>
              Your page. Alive.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="no-underline transition-colors duration-300 hover:text-white"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#CBD5E1',
                }}
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-white"
              style={{ color: '#CBD5E1' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-white"
              style={{ color: '#CBD5E1' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        <div
          className="mt-12 pt-8 text-center"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#64748B',
          }}
        >
          Built with living code
        </div>
      </div>
    </footer>
  );
}
