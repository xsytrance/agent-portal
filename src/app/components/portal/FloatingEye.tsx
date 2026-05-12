'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';

interface FloatingEyeProps {
  size?: number;
  mobileSize?: number;
}

export default function FloatingEye({ size = 96, mobileSize = 64 }: FloatingEyeProps) {
  const { activeAgent, setChatOpen, agentMessage, isThinking } = useAgent();
  const reducedMotion = useReducedMotion();
  const eyeRef = useRef<HTMLDivElement>(null);
  const pupilRef = useRef<HTMLDivElement>(null);
  const [emotion] = useState<'neutral' | 'happy' | 'curious' | 'surprised' | 'sleepy'>('neutral');
  const [isClient, setIsClient] = useState<boolean>(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const pupilPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [blink, setBlink] = useState(false);
  const lastBlinkRef = useRef(Date.now() + 3000);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  useEffect(() => {
    if (reducedMotion || !isClient) return;

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      if (!eyeRef.current || !pupilRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const eyeRect = eyeRef.current.getBoundingClientRect();
      const eyeCx = eyeRect.left + eyeRect.width / 2;
      const eyeCy = eyeRect.top + eyeRect.height / 2;

      const dx = mouseRef.current.x - eyeCx;
      const dy = mouseRef.current.y - eyeCy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 10;

      const targetX = dist > 0 ? (dx / dist) * Math.min(dist * 0.05, maxDist) : 0;
      const targetY = dist > 0 ? (dy / dist) * Math.min(dist * 0.05, maxDist) : 0;

      pupilPos.current = {
        x: lerp(pupilPos.current.x, targetX, 0.08),
        y: lerp(pupilPos.current.y, targetY, 0.08),
      };

      pupilRef.current.style.transform = `translate(${pupilPos.current.x}px, ${pupilPos.current.y}px)`;

      // Random blink
      const now = Date.now();
      if (now > lastBlinkRef.current) {
        setBlink(true);
        lastBlinkRef.current = now + 3000 + Math.random() * 3000;
        setTimeout(() => setBlink(false), 150);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, isClient]);

  const handleClick = useCallback(() => {
    setChatOpen(true);
  }, [setChatOpen]);

  if (!isClient) return null;

  const eyeSize = typeof window !== 'undefined' && window.innerWidth < 640 ? mobileSize : size;
  const pupilSize = 12;
  const highlightSize = 4;

  const irisTransform = emotion === 'surprised' ? 'scale(0.8)' : emotion === 'happy' ? 'scale(1.05)' : 'scale(1)';
  const eyeTransform = emotion === 'surprised' ? 'scale(1.2)' : 'scale(1)';

  return (
    <>
      {agentMessage && (
        <div
          className="fixed z-40 transition-all duration-500 pointer-events-none"
          style={{
            right: typeof window !== 'undefined' && window.innerWidth < 640 ? '50%' : '32px',
            bottom: `${eyeSize + 40}px`,
            transform: typeof window !== 'undefined' && window.innerWidth < 640 ? 'translateX(50%)' : 'none',
          }}
        >
          <div
            className="glass rounded-2xl px-5 py-3 pointer-events-auto"
            style={{
              maxWidth: 280,
              border: `1px solid ${activeAgent.glowColor}`,
              color: 'white',
              fontSize: '0.9375rem',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.55,
            }}
          >
            {agentMessage}
          </div>
        </div>
      )}

      <div
        ref={eyeRef}
        onClick={handleClick}
        className="fixed z-40 cursor-pointer"
        style={{
          right: typeof window !== 'undefined' && window.innerWidth < 640 ? '50%' : '32px',
          bottom: '32px',
          width: eyeSize,
          height: eyeSize,
          transform: typeof window !== 'undefined' && window.innerWidth < 640
            ? `translateX(50%) ${eyeTransform}`
            : eyeTransform,
          marginRight: undefined,
          marginLeft: undefined,
          animation: reducedMotion ? 'none' : 'eyeFloat 4s ease-in-out infinite',
          transition: 'transform 0.3s ease',
          boxShadow: `0 0 30px ${activeAgent.glowColor}4D`,
          borderRadius: '50%',
        }}
      >
        {/* Sclera */}
        <svg
          width={eyeSize}
          height={eyeSize}
          viewBox="0 0 100 100"
          style={{
            transform: blink ? 'scaleY(0.1)' : 'scaleY(1)',
            transition: blink ? 'transform 0.05s' : 'transform 0.15s',
          }}
        >
          <defs>
            <filter id="eyeShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feFlood floodColor="#000" floodOpacity="0.15" />
              <feComposite in2="offsetblur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={activeAgent.primaryColor} />
              <stop offset="70%" stopColor={activeAgent.secondaryColor} />
              <stop offset="100%" stopColor={activeAgent.primaryColor} />
            </radialGradient>
          </defs>

          <ellipse cx="50" cy="50" rx="42" ry="35" fill="#FFF" filter="url(#eyeShadow)" />

          {/* Iris */}
          <g style={{ transform: irisTransform, transformOrigin: '50px 50px', transition: 'transform 0.4s ease' }}>
            <circle cx="50" cy="50" r="22" fill="url(#irisGrad)" />
            <circle cx="50" cy="50" r="18" fill={activeAgent.primaryColor} opacity="0.6" />
          </g>
        </svg>

        {/* Pupil (follows cursor) */}
        <div
          ref={pupilRef}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: pupilSize,
            height: pupilSize,
            marginLeft: -pupilSize / 2,
            marginTop: -pupilSize / 2,
            borderRadius: '50%',
            backgroundColor: '#1A1A2E',
            transition: 'width 0.3s, height 0.3s',
            zIndex: 2,
          }}
        />

        {/* Specular highlight */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '58%',
            width: highlightSize,
            height: highlightSize,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.8)',
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />

        {/* Eyelid (for sleepy emotion) */}
        {emotion === 'sleepy' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '55%',
              borderRadius: '50% 50% 0 0',
              backgroundColor: 'rgba(26, 26, 46, 0.4)',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Emotion smile curve */}
        {emotion === 'happy' && (
          <svg
            width={eyeSize * 0.6}
            height={12}
            viewBox="0 0 60 12"
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '20%',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            <path d="M5 5 Q30 15 55 5" fill="none" stroke={activeAgent.primaryColor} strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}

        {/* Thinking ring */}
        {isThinking && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: '-8px',
              right: '-8px',
              bottom: '-8px',
              borderRadius: '50%',
              border: `2px solid ${activeAgent.primaryColor}`,
              opacity: 0.6,
              animation: 'ringPulse 1.5s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </>
  );
}
