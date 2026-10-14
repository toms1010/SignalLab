import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useMedia';

/**
 * Ambient laboratory backdrop: a blueprint grid, an animated particle network,
 * and three soft accent glows.
 *
 * Performance and accessibility:
 *  - particle count scales with viewport area and is hard-capped;
 *  - the rAF loop is stopped when the tab is hidden;
 *  - the whole component is aria-hidden;
 *  - reduced-motion users get the static grid with no animation.
 */
export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduced) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    interface P {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      c: string;
    }

    let raf = 0;
    let w = 0;
    let h = 0;
    let pts: P[] = [];

    const COLORS = ['0,240,255', '0,240,255', '255,0,170', '139,123,255', '255,215,0'];
    const LINK = 118;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Deterministic layout: particles are seeded by index, not Math.random,
      // so resizing back and forth does not reshuffle the whole field.
      const count = Math.min(80, Math.max(18, Math.floor((w * h) / 24000)));
      pts = Array.from({ length: count }, (_, i) => {
        const a = Math.sin(i * 12.9898) * 43758.5453;
        const b = Math.sin(i * 78.233) * 12345.6789;
        const frac = (v: number) => v - Math.floor(v);
        return {
          x: frac(a) * w,
          y: frac(b) * h,
          vx: (frac(a * 1.7) - 0.5) * 0.32,
          vy: (frac(b * 2.3) - 0.5) * 0.32,
          r: 0.6 + frac(a * 3.1) * 1.7,
          c: COLORS[i % COLORS.length]!,
        };
      });
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(document.body);

    const loop = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }

      // O(n²) link pass — safe because the count is capped at 80.
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i]!;
          const b = pts[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = `rgba(0,240,255,${(1 - Math.sqrt(d2) / LINK) * 0.15})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.shadowBlur = 6;
      for (const p of pts) {
        ctx.fillStyle = `rgba(${p.c},0.6)`;
        ctx.shadowColor = `rgba(${p.c},0.9)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    if (!document.hidden) raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="bg-blueprint absolute inset-0 opacity-70" />
      {!reduced && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-60" />}
      <div
        className="absolute -top-[15%] -left-40 h-[480px] w-[480px] rounded-full opacity-[0.13] blur-[110px]"
        style={{ background: 'radial-gradient(circle, #00f0ff, transparent 65%)' }}
      />
      <div
        className="absolute top-[35%] -right-40 h-[520px] w-[520px] rounded-full opacity-[0.1] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #ff00aa, transparent 65%)' }}
      />
      <div
        className="absolute -bottom-[20%] left-[30%] h-[420px] w-[420px] rounded-full opacity-[0.07] blur-[110px]"
        style={{ background: 'radial-gradient(circle, #ffd700, transparent 65%)' }}
      />
    </div>
  );
}