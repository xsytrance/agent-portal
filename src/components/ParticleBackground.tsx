import { useEffect, useRef, useState } from 'react';
import { useAgent } from '@/context/AgentContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';

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

interface ParticleBackgroundProps {
  particleCount?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ParticleBackground({
  particleCount,
  className,
  style,
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

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const count = particleCount ?? (isMobile ? 20 : 45);

  useEffect(() => {
    if (activeAgent.primaryColor !== targetColorRef.current) {
      targetColorRef.current = activeAgent.primaryColor;
      lastColorUpdateRef.current = Date.now();
    }
  }, [activeAgent.primaryColor]);

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
    particlesRef.current = Array.from({ length: count }, () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      return {
        x,
        y,
        baseX: x,
        baseY: y,
        vx: 0,
        vy: -(0.2 + Math.random() * 0.6),
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

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lerp color over 1.2s
      const elapsed = Date.now() - lastColorUpdateRef.current;
      const colorT = Math.min(elapsed / 1200, 1);
      colorRef.current = lerpColor(colorRef.current, targetColorRef.current, colorT);

      const baseRgb = hexToRgb(colorRef.current);
      const glowRgb = hexToRgb(activeAgent.glowColor);

      if (!reducedMotion) {
        particlesRef.current.forEach((p) => {
          const time = Date.now() / 1000;
          const sineX = Math.sin(time * 0.5 + p.phase) * (30 + Math.sin(p.phase) * 30);

          p.x += p.vx;
          p.y += p.vy;

          // Sine-wave drift
          p.x = p.baseX + sineX * (time * 0.1);

          // Cursor repulsion
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

      // Draw connections
      const connectionDist = 150;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${glowRgb.r},${glowRgb.g},${glowRgb.b},${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
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

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count, reducedMotion, activeAgent.glowColor, activeAgent.primaryColor]);

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
