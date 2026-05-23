'use client';

import { useEffect, useRef, useState } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import type { AtlasBrainAPI } from '@/app/hooks/useAtlasBrain';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  phase: number;
}

interface MoodParams {
  speed: number;
  count: number;
  connectionOpacity: number;
  driftAmplitude: number;
}

interface ParticleBackgroundProps {
  particleCount?: number;
  className?: string;
  style?: React.CSSProperties;
  atlasBrain?: AtlasBrainAPI | null;
}

const MOOD_MAP: Record<string, MoodParams> = {
  RESTING: { speed: 0.3, count: 20, connectionOpacity: 0.05, driftAmplitude: 5 },
  THINKING: { speed: 0.5, count: 25, connectionOpacity: 0.08, driftAmplitude: 8 },
  OBSERVING: { speed: 0.8, count: 35, connectionOpacity: 0.1, driftAmplitude: 15 },
};

export default function ParticleBackground({
  particleCount,
  className,
  style,
  atlasBrain,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { activeAgent } = useAgent();
  const reducedMotion = useReducedMotion();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number | null>(null);
  const colorRef = useRef(activeAgent.primaryColor);
  const targetColorRef = useRef(activeAgent.primaryColor);
  const lastColorUpdateRef = useRef(Date.now());

  const [isMobile, setIsMobile] = useState<boolean>(false);

  // ── Mood-based particle params (smoothly lerped) ──
  const silenceMode = atlasBrain?.silenceMode ?? 'OBSERVING';
  const density = atlasBrain?.state?.density ?? 'medium';

  const targetMoodRef = useRef<MoodParams>(MOOD_MAP.OBSERVING);
  const currentMoodRef = useRef<MoodParams>({ ...MOOD_MAP.OBSERVING });

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const baseCount = particleCount ?? (isMobile ? 20 : 45);

  useEffect(() => {
    if (activeAgent.primaryColor !== targetColorRef.current) {
      targetColorRef.current = activeAgent.primaryColor;
      lastColorUpdateRef.current = Date.now();
    }
  }, [activeAgent.primaryColor]);

  // Update target mood params when silenceMode or density changes
  useEffect(() => {
    const mood = MOOD_MAP[silenceMode] ?? MOOD_MAP.OBSERVING;
    let targetCount = mood.count;

    // Apply density override
    if (density === 'ambient') targetCount = Math.floor(targetCount * 0.5);
    else if (density === 'low') targetCount = Math.floor(targetCount * 0.75);

    // Clamp to baseCount as upper bound
    targetCount = Math.min(targetCount, baseCount);

    targetMoodRef.current = {
      ...mood,
      count: targetCount,
    };
  }, [silenceMode, density, baseCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    // Init particles
    particlesRef.current = Array.from({ length: baseCount }, () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: -(0.25 + Math.random() * 0.55), // base vy; mood speed applied in loop
        radius: 2 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };

    const lerpColor = (from: string, to: string, t: number) => {
      const f = hexToRgb(from);
      const tt = hexToRgb(to);
      const r = Math.round(f.r + (tt.r - f.r) * t);
      const g = Math.round(f.g + (tt.g - f.g) * t);
      const b = Math.round(f.b + (tt.b - f.b) * t);
      return `rgb(${r},${g},${b})`;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const connectionDist = 150;
    const connectionDistSq = connectionDist * connectionDist;

    let head = new Int32Array(0);
    let next = new Int32Array(0);

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lerp color over 1.2s
      const elapsed = Date.now() - lastColorUpdateRef.current;
      const colorT = Math.min(elapsed / 1200, 1);
      colorRef.current = lerpColor(colorRef.current, targetColorRef.current, colorT);

      const baseRgb = hexToRgb(colorRef.current);
      const glowRgb = hexToRgb(activeAgent.glowColor);

      // ── Smoothly lerp mood params over ~2s ──
      const moodLerpSpeed = 0.015; // ~2s to converge
      currentMoodRef.current.speed = lerp(currentMoodRef.current.speed, targetMoodRef.current.speed, moodLerpSpeed);
      currentMoodRef.current.connectionOpacity = lerp(
        currentMoodRef.current.connectionOpacity,
        targetMoodRef.current.connectionOpacity,
        moodLerpSpeed,
      );
      currentMoodRef.current.driftAmplitude = lerp(
        currentMoodRef.current.driftAmplitude,
        targetMoodRef.current.driftAmplitude,
        moodLerpSpeed,
      );

      // Handle particle count changes (add or remove gradually)
      const targetCount = targetMoodRef.current.count;
      const currentCount = particlesRef.current.length;
      if (currentCount < targetCount) {
        // Add particles
        for (let i = currentCount; i < targetCount; i++) {
          const x = Math.random() * canvas.width;
          const y = canvas.height + 10 + Math.random() * 50;
          particlesRef.current.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: -(0.25 + Math.random() * 0.55), // base vy; mood speed applied in loop
            radius: 2 + Math.random() * 3,
            opacity: 0.3 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2,
          });
        }
      } else if (currentCount > targetCount) {
        // Remove particles (trim from end, let them fade out naturally)
        particlesRef.current = particlesRef.current.slice(0, targetCount);
      }

      const cm = currentMoodRef.current;

      if (!reducedMotion) {
        particlesRef.current.forEach((p) => {
          const time = Date.now() / 1000;
          const sineX = Math.sin(time * 0.5 + p.phase) * (30 + Math.sin(p.phase) * cm.driftAmplitude);

          // Apply lerped speed multiplier to base velocity (no re-randomization)
          p.x += p.vx;
          p.y += p.vy * cm.speed * 1.5;

          // Sine-wave drift
          p.x = p.baseX + sineX * (time * 0.1);

          // Cursor repulsion (untouched)
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            p.x += (dx / dist) * force * 3;
            p.y += (dy / dist) * force * 3;
          }

          // Reset when off top
          if (p.y < -10) {
            p.y = canvas.height + 10;
            p.baseY = canvas.height + 10;
            p.baseX = Math.random() * canvas.width;
          }
          if (p.x < -60) { p.baseX = canvas.width + 60; }
          if (p.x > canvas.width + 60) { p.baseX = -60; }
        });
      }

      // Draw connections (using lerped opacity) with spatial hashing
      const particles = particlesRef.current;
      const numParticles = particles.length;

      const cols = Math.ceil(canvas.width / connectionDist);
      const rows = Math.ceil(canvas.height / connectionDist);
      const totalCells = cols * rows;

      if (head.length < totalCells) {
        head = new Int32Array(totalCells);
      }
      if (next.length < numParticles) {
        next = new Int32Array(numParticles);
      }

      head.fill(-1, 0, totalCells);

      for (let i = 0; i < numParticles; i++) {
        const p = particles[i];
        let cx = Math.floor(p.x / connectionDist);
        let cy = Math.floor(p.y / connectionDist);

        if (cx < 0) cx = 0; else if (cx >= cols) cx = cols - 1;
        if (cy < 0) cy = 0; else if (cy >= rows) cy = rows - 1;

        const cellIndex = cy * cols + cx;
        next[i] = head[cellIndex];
        head[cellIndex] = i;
      }

      for (let i = 0; i < numParticles; i++) {
        const a = particles[i];
        let cx = Math.floor(a.x / connectionDist);
        let cy = Math.floor(a.y / connectionDist);

        if (cx < 0) cx = 0; else if (cx >= cols) cx = cols - 1;
        if (cy < 0) cy = 0; else if (cy >= rows) cy = rows - 1;

        const minX = cx > 0 ? cx - 1 : 0;
        const maxX = cx < cols - 1 ? cx + 1 : cols - 1;
        const minY = cy > 0 ? cy - 1 : 0;
        const maxY = cy < rows - 1 ? cy + 1 : rows - 1;

        for (let ny = minY; ny <= maxY; ny++) {
          const rowOffset = ny * cols;
          for (let nx = minX; nx <= maxX; nx++) {
            let j = head[rowOffset + nx];
            while (j !== -1) {
              if (i < j) {
                const b = particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < connectionDistSq) {
                  const dist = Math.sqrt(distSq);
                  const alpha = (1 - dist / connectionDist) * cm.connectionOpacity;
                  ctx.beginPath();
                  ctx.moveTo(a.x, a.y);
                  ctx.lineTo(b.x, b.y);
                  ctx.strokeStyle = `rgba(${glowRgb.r},${glowRgb.g},${glowRgb.b},${alpha})`;
                  ctx.lineWidth = 0.5;
                  ctx.stroke();
                }
              }
              j = next[j];
            }
          }
        }
      }

      // Draw particles
      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${baseRgb.r},${baseRgb.g},${baseRgb.b},${p.opacity})`;
        ctx.fill();
      });
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      const { baseRgb, glowRgb } = updateState(canvas);
      drawState(ctx, canvas, baseRgb, glowRgb);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [baseCount, reducedMotion, activeAgent.glowColor, activeAgent.primaryColor]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}
