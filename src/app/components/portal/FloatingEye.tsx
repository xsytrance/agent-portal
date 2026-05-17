'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import type { AtlasBrainAPI } from '@/app/hooks/useAtlasBrain';

interface FloatingEyeProps {
  size?: number;
  mobileSize?: number;
  atlasBrain?: AtlasBrainAPI | null;
}

export default function FloatingEye({ size = 96, mobileSize = 64, atlasBrain }: FloatingEyeProps) {
  const { activeAgent, setChatOpen, agentMessage, isThinking } = useAgent();
  const reducedMotion = useReducedMotion();
  const eyeRef = useRef<HTMLDivElement>(null);
  const pupilRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [emotion] = useState<'neutral' | 'happy' | 'curious' | 'surprised' | 'sleepy'>('neutral');
  const [isClient, setIsClient] = useState<boolean>(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const pupilPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [blink, setBlink] = useState(false);
  const lastBlinkRef = useRef(Date.now() + 3000);
  const breathStartRef = useRef(Date.now());

  // ── Emotional polish refs (updated in raf, no re-renders) ──
  const pupilScaleRef = useRef(1);
  const dartRef = useRef({ x: 0, y: 0, active: false, startTime: 0 });
  const currentEyelidRef = useRef(0);

  // Read eye behavior + silence mode from atlas brain
  const eyeBehavior = atlasBrain?.eyeBehavior;
  const silenceMode = atlasBrain?.silenceMode;

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
      if (!eyeRef.current || !pupilRef.current || !svgRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const eyeRect = eyeRef.current.getBoundingClientRect();
      const eyeCx = eyeRect.left + eyeRect.width / 2;
      const eyeCy = eyeRect.top + eyeRect.height / 2;

      const trackingSpeed = eyeBehavior?.trackingSpeed ?? 0.08;
      const movementRange = eyeBehavior?.movementRange ?? 10;

      // ── 3. Partial attention: drift toward secondary target ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const partialAttention = (eyeBehavior as any)?.partialAttention;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const secondaryTarget = (eyeBehavior as any)?.secondaryTarget;
      let targetX = 0;
      let targetY = 0;

      if (partialAttention && secondaryTarget) {
        const sdx = (secondaryTarget as { x: number; y: number }).x - eyeCx;
        const sdy = (secondaryTarget as { x: number; y: number }).y - eyeCy;
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
        targetX = sdist > 0 ? (sdx / sdist) * Math.min(sdist * 0.03, movementRange * 0.5) : 0;
        targetY = sdist > 0 ? (sdy / sdist) * Math.min(sdist * 0.03, movementRange * 0.5) : 0;
      } else {
        const dx = mouseRef.current.x - eyeCx;
        const dy = mouseRef.current.y - eyeCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        targetX = dist > 0 ? (dx / dist) * Math.min(dist * 0.05, movementRange) : 0;
        targetY = dist > 0 ? (dy / dist) * Math.min(dist * 0.05, movementRange) : 0;
      }

      pupilPos.current = {
        x: lerp(pupilPos.current.x, targetX, trackingSpeed),
        y: lerp(pupilPos.current.y, targetY, trackingSpeed),
      };

      // ── 6. THINKING mode: occasional pupil dart ──
      let dartX = 0;
      let dartY = 0;
      if (eyeBehavior?.thinkingWobble && !dartRef.current.active) {
        // Occasional dart (~every 1.5-3.5s)
        if (Math.random() < 0.008) {
          const angle = Math.random() * Math.PI * 2;
          const distance = 4 + Math.random() * 5;
          dartRef.current = {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            active: true,
            startTime: Date.now(),
          };
        }
      }
      if (dartRef.current.active) {
        const dartElapsed = Date.now() - dartRef.current.startTime;
        if (dartElapsed > 250) {
          dartRef.current.active = false;
          dartRef.current.x = 0;
          dartRef.current.y = 0;
        } else {
          // Quick out-and-back curve
          const dartT = dartElapsed / 250;
          const envelope = Math.sin(dartT * Math.PI); // 0→1→0
          dartX = dartRef.current.x * envelope;
          dartY = dartRef.current.y * envelope;
        }
      }

      // ── 6. THINKING mode: very subtle wobble (±1px) ──
      let wobbleX = 0;
      let wobbleY = 0;
      if (eyeBehavior?.thinkingWobble) {
        const wt = Date.now() / 1000;
        wobbleX = Math.sin(wt * 3) * 0.6;
        wobbleY = Math.cos(wt * 2.3) * 0.5;
      }

      const finalX = pupilPos.current.x + wobbleX + dartX;
      const finalY = pupilPos.current.y + wobbleY + dartY;
      pupilRef.current.style.transform = `translate(${finalX}px, ${finalY}px)`;

      // ── 4. Cognition cues: subtle pupil dilation/constriction ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cue = (eyeBehavior as any)?.cognitionCue;
      const baseDilation = eyeBehavior?.pupilDilation ?? 1;
      let targetPupilScale = baseDilation;

      if (cue === 'processing') {
        targetPupilScale = baseDilation * 1.08;
      } else if (cue === 'recalling') {
        targetPupilScale = baseDilation * 0.95;
      }

      pupilScaleRef.current = lerp(pupilScaleRef.current, targetPupilScale, 0.12);

      // Apply pupil size directly (no re-render)
      const basePupilSize = 12;
      const currentPupilSize = basePupilSize * pupilScaleRef.current;
      pupilRef.current.style.width = `${currentPupilSize}px`;
      pupilRef.current.style.height = `${currentPupilSize}px`;
      pupilRef.current.style.marginLeft = `${-currentPupilSize / 2}px`;
      pupilRef.current.style.marginTop = `${-currentPupilSize / 2}px`;

      // ── 2. Breathing rhythm: barely perceptible scale pulse ──
      const breathPeriod = silenceMode === 'RESTING' ? 4000 : 2500;
      const breathPhase = ((Date.now() - breathStartRef.current) % breathPeriod) / breathPeriod;
      const breathScale = 1 + Math.sin(breathPhase * Math.PI * 2) * 0.03;

      const irisTransform = emotion === 'surprised'
        ? 'scale(0.8)'
        : emotion === 'happy'
          ? 'scale(1.05)'
          : 'scale(1)';
      svgRef.current.style.transform = `${irisTransform} scale(${breathScale})`;

      // ── 5. RESTING mode: half-lidded eyelid (smooth lerp) ──
      const targetEyelid = silenceMode === 'RESTING'
        ? (eyeBehavior?.eyelidOpenness ?? 0.65)
        : emotion === 'sleepy'
          ? 0.55
          : 0;
      currentEyelidRef.current = lerp(currentEyelidRef.current, targetEyelid, 0.03);

      // ── 7. Blink rate wiring: use eyeBehavior rates ──
      const now = Date.now();
      if (now > lastBlinkRef.current) {
        setBlink(true);
        const blinkMin = eyeBehavior?.blinkRateMin ?? 3000;
        const blinkMax = eyeBehavior?.blinkRateMax ?? 6000;
        lastBlinkRef.current = now + blinkMin + Math.random() * (blinkMax - blinkMin);
        setTimeout(() => setBlink(false), 150);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, isClient, eyeBehavior, silenceMode, emotion]);

  const handleClick = useCallback(() => {
    setChatOpen(true);
  }, [setChatOpen]);

  if (!isClient) return null;

  const eyeSize = typeof window !== 'undefined' && window.innerWidth < 640 ? mobileSize : size;
  const highlightSize = 4;

  const eyeTransform = emotion === 'surprised' ? 'scale(1.2)' : 'scale(1)';

  // Eyelid height derived from animated ref (rounded for display)
  const eyelidDisplayPct = Math.round(currentEyelidRef.current * 100);

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
          ref={svgRef}
          width={eyeSize}
          height={eyeSize}
          viewBox="0 0 100 100"
          style={{
            transformOrigin: '50% 50%',
            transition: 'transform 0.3s ease',
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

          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="35"
            fill="#FFF"
            filter="url(#eyeShadow)"
            style={{
              transform: blink ? 'scaleY(0.1)' : 'scaleY(1)',
              transition: blink ? 'transform 0.05s' : 'transform 0.15s',
              transformOrigin: '50px 50px',
            }}
          />

          {/* Iris */}
          <g style={{ transformOrigin: '50px 50px', transition: 'transform 0.4s ease' }}>
            <circle cx="50" cy="50" r="22" fill="url(#irisGrad)" />
            <circle cx="50" cy="50" r="18" fill={activeAgent.primaryColor} opacity="0.6" />
          </g>
        </svg>

        {/* Pupil (follows cursor + emotional polish) */}
        <div
          ref={pupilRef}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 12,
            height: 12,
            marginLeft: -6,
            marginTop: -6,
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

        {/* ── 5. RESTING mode: dynamic half-lidded overlay ── */}
        {eyelidDisplayPct > 1 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: `${eyelidDisplayPct}%`,
              borderRadius: '50% 50% 0 0',
              backgroundColor: 'rgba(26, 26, 46, 0.4)',
              zIndex: 4,
              pointerEvents: 'none',
              transition: 'height 0.1s linear',
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

        {/* ── 6. Thinking ring: more subtle ── */}
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
              opacity: 0.4,
              animation: 'ringPulse 1.5s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </>
  );
}
