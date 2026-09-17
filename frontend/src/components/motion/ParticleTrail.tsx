import { useEffect, useRef } from 'react';

/**
 * Minimal canvas particle trail for MotionCursor.
 * 6 points, alpha fade, RAF — hidden when reduced-motion.
 */
export default function ParticleTrail({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pts = useRef<{ x: number; y: number; a: number }[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const onMove = (e: MouseEvent) => {
      pts.current.push({ x: e.clientX, y: e.clientY, a: 1 });
      if (pts.current.length > 14) pts.current.shift();
    };
    const tick = () => {
      const dpr = window.devicePixelRatio || 1;
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
      c.style.width = window.innerWidth + 'px';
      c.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      pts.current.forEach((p) => {
        p.a *= 0.86;
        if (p.a < 0.02) return;
        ctx.globalAlpha = p.a * 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#0F172A';
        ctx.fill();
      });
      pts.current = pts.current.filter((p) => p.a > 0.02);
      rafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9997,
      }}
    />
  );
}
