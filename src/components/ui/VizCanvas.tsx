import { useEffect, useRef, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useMedia';
import { cn } from '@/lib/cn';

/* =========================================================================
   VizCanvas — the drawing surface every signal visualisation uses.
   - device-pixel-ratio aware, so plots stay sharp on high-DPI screens
   - exactly one requestAnimationFrame loop per canvas, created in an effect and
     torn down on unmount, so switching lessons never leaks a loop
   - ResizeObserver keeps the drawing in step with container reflow
   - skips painting while the tab is hidden; renders a single held frame when
     the user prefers reduced motion
   ========================================================================= */

export type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void;

export interface VizCanvasProps {
  draw: DrawFn;
  /** CSS height in pixels. Width always fills the parent. */
  height?: number;
  /** Accessible description of what the canvas shows. */
  label: string;
  className?: string;
  /** Render one frame and hold — for static plots. */
  isStatic?: boolean;
}

export function VizCanvas({ draw, height = 300, label, className, isStatic = false }: VizCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  const reduced = usePrefersReducedMotion();

  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let alive = true;
    let w = 1;
    let h = 1;
    const start = performance.now();

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
    };

    const paint = (time: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.round(w * dpr));
      const targetH = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, w, h, time);
    };

    measure();

    const onResize = () => {
      measure();
      paint(0);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    if (isStatic || reduced) {
      paint(0);
    } else {
      const frame = (now: number) => {
        if (!alive) return;
        if (!document.hidden) paint((now - start) / 1000);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [isStatic, reduced]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className={cn('block w-full touch-manipulation', className)}
      style={{ height: `${height}px` }}
    />
  );
}

/* =====================================================================
   Canvas drawing helpers shared by the signal visualisations
   ===================================================================== */

export const C = {
  cyan: '#00F0FF',
  magenta: '#FF00AA',
  gold: '#FFD700',
  green: '#34D399',
  red: '#FF5C7A',
  violet: '#A78BFA',
  orange: '#FF8A3D',
  gray: '#7C90AC',
  white: '#EEF2FF',
} as const;

export interface Palette {
  cyan: string; magenta: string; gold: string; green: string; red: string;
  violet: string; orange: string; gray: string; white: string;
  grid: string; axis: string; text: string; textDim: string;
}

/** Theme-aware colours, re-read on every frame so a theme flip is instant. */
export function themeColors(): Palette {
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  return light
    ? {
        cyan: '#0090B3',
        magenta: '#D1007F',
        gold: '#A97E00',
        green: '#07976A',
        red: '#D92C4D',
        violet: '#5B48C9',
        orange: '#C05A12',
        gray: '#657A96',
        white: '#101736',
        grid: 'rgba(40,70,160,.13)',
        axis: 'rgba(20,40,90,.45)',
        text: '#43507A',
        textDim: '#6B779E',
      }
    : {
        cyan: '#00F0FF',
        magenta: '#FF00AA',
        gold: '#FFD700',
        green: '#34D399',
        red: '#FF5C7A',
        violet: '#A78BFA',
        orange: '#FF8A3D',
        gray: '#7C90AC',
        white: '#EEF2FF',
        grid: 'rgba(120,160,255,.10)',
        axis: 'rgba(180,205,240,.42)',
        text: '#9AA7C7',
        textDim: '#64719A',
      };
}

/** Blueprint-style background grid. */
export function grid(ctx: CanvasRenderingContext2D, w: number, h: number, step = 34): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(120,160,255,.09)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0.5; x < w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0.5; y < h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Horizontal axis line with an optional caption. */
export function axisX(ctx: CanvasRenderingContext2D, w: number, y: number, caption?: string): void {
  const col = themeColors();
  ctx.save();
  ctx.strokeStyle = col.axis;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(w, y + 0.5);
  ctx.stroke();
  if (caption) label(ctx, caption, 6, y - 6, col.textDim, 9);
  ctx.restore();
}

/** Styled monospace canvas text. */
export function label(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size = 10,
  align: CanvasTextAlign = 'left',
  bold = false,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700 ' : ''}${size}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** Apply a glowing stroke style. */
export function glow(ctx: CanvasRenderingContext2D, color: string, width = 2): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

/** Stroke a polyline from paired sample arrays through mapper functions. */
export function polyline(
  ctx: CanvasRenderingContext2D,
  xs: readonly number[],
  ys: readonly number[],
  toX: (v: number) => number,
  toY: (v: number) => number,
  steps = 1,
): void {
  ctx.beginPath();
  const n = Math.min(xs.length, ys.length);
  for (let i = 0; i < n; i += steps) {
    const px = toX(xs[i]!);
    const py = toY(ys[i]!);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

/** Standard page section. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('glass p-5 sm:p-6', className)}>{children}</section>;
}