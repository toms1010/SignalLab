import { useId, type ChangeEvent, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { cssVar, plainMath } from '@/lib/math';
import { useToast } from '@/hooks/useProgress';
import { Math as MathTex } from '@/components/ui/Math';

/* =========================================================================
   ParameterSlider — glowing range input with the live value pinned to the
   right of the label. Touch-friendly: large thumb, generous hit area.
   ========================================================================= */

export type Accent = '' | 'magenta' | 'gold' | 'green';

export interface SliderProps {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  accent?: Accent;
  hint?: string;
  /** Custom formatting for the displayed value. */
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

export function Slider({
  label: text,
  value,
  min,
  max,
  step = 1,
  unit,
  accent = '',
  hint,
  format,
  onChange,
}: SliderProps) {
  const id = useId();
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const shown = format ? format(value) : String(value);
  const ariaLabel = typeof text === 'string' ? text : 'parameter';

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-dim uppercase">{text}</span>
        <span className="mono shrink-0 text-[13px] font-bold text-[var(--cyan)]">
          {shown}
          {unit ? <span className="ml-0.5 text-[10px] text-faint">{unit}</span> : null}
        </span>
      </label>
      <input
        id={id}
        type="range"
        aria-label={ariaLabel}
        className={accent}
        min={min}
        max={max}
        step={step}
        value={value}
        style={cssVar('--fill', `${pct}%`)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      />
      {hint ? <p className="mt-1 text-[11px] leading-snug text-faint">{hint}</p> : null}
    </div>
  );
}

/* =========================================================================
   Toggle — animated switch
   ========================================================================= */
export function Toggle({
  label: text,
  on,
  onChange,
  accent = '',
  hint,
}: {
  label: ReactNode;
  on: boolean;
  onChange: (v: boolean) => void;
  accent?: Accent;
  hint?: string;
}) {
  const ariaLabel = typeof text === 'string' ? text : 'toggle';
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13px] font-medium">{text}</div>
        {hint ? <div className="text-[11px] leading-snug text-faint">{hint}</div> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={ariaLabel}
        className={cn('switch', accent, on && 'on')}
        onClick={() => onChange(!on)}
      />
    </div>
  );
}

/* =========================================================================
   Segmented — radio group rendered as buttons
   ========================================================================= */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  accent = 'var(--cyan)',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:scale-[1.04]"
            style={
              on
                ? { borderColor: accent, color: accent, background: 'color-mix(in srgb, currentColor 12%, transparent)' }
                : { borderColor: 'var(--stroke)', color: 'var(--text-dim)' }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   Stat — compact readout pill
   ========================================================================= */
export type Tone = 'cyan' | 'magenta' | 'gold' | 'green' | 'red' | 'violet';

const TONE: Record<Tone, string> = {
  cyan: 'var(--cyan)',
  magenta: 'var(--magenta)',
  gold: 'var(--gold)',
  green: 'var(--green)',
  red: 'var(--red)',
  violet: 'var(--violet)',
};

export function Stat({
  label: text,
  value,
  tone = 'cyan',
  sub,
}: {
  label: string;
  value: string;
  tone?: Tone;
  sub?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border bord-soft px-3 py-2.5" style={{ background: 'var(--panel)' }}>
      <div className="truncate text-[9.5px] font-bold tracking-[0.14em] text-faint uppercase">{text}</div>
      <div className="mono mt-0.5 truncate text-[15px] leading-tight font-bold" style={{ color: TONE[tone] }} title={value}>
        {value}
      </div>
      {sub ? <div className="mt-1 text-[10px] leading-tight text-faint">{sub}</div> : null}
    </div>
  );
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const map = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' } as const;
  return <div className={cn('grid gap-2.5', map[cols])}>{children}</div>;
}

/* =========================================================================
   Formula — glowing formula plate with copy-to-clipboard
   ========================================================================= */
export function Formula({
  tex,
  caption,
  accent = 'var(--cyan)',
  plain,
}: {
  tex: string;
  caption?: string;
  accent?: string;
  /** Plain-text form used by the copy button. */
  plain?: string;
}) {
  const { push } = useToast();

  const copy = async () => {
    const text = plain ?? plainMath(tex);
    try {
      await navigator.clipboard.writeText(text);
      push('Formula copied to clipboard', 'ok');
    } catch {
      push('Clipboard unavailable — the formula is shown as text below.', 'warn');
    }
  };

  return (
    <div className="relative flex items-center overflow-hidden rounded-xl border px-4 py-3">
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
      />
      <div className="min-w-0 flex-1 pl-1">
        <MathTex tex={tex} display className="text-[15px]" />
        {caption ? <p className="mt-1 text-center text-[11px] leading-snug text-dim">{caption}</p> : null}
      </div>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 rounded-md border bord bg-[var(--panel)] px-2 py-1 text-[10px] font-bold text-dim transition-colors hover:text-[var(--cyan)]"
        aria-label="Copy this formula as plain text"
      >
        COPY
      </button>
    </div>
  );
}

/* =========================================================================
   Callout — note / warning / limitation
   ========================================================================= */
export function Callout({
  kind = 'note',
  title,
  children,
}: {
  kind?: 'note' | 'info' | 'limit' | 'warn' | 'ok';
  title: string;
  children: ReactNode;
}) {
  const map = {
    note: { border: 'var(--gold)', icon: '⚠', bg: 'color-mix(in srgb, var(--gold) 7%, transparent)' },
    info: { border: '#4FA8FF', icon: 'ℹ', bg: 'rgba(79,168,255,.08)' },
    limit: { border: 'var(--violet)', icon: '⌁', bg: 'color-mix(in srgb, var(--violet) 9%, transparent)' },
    warn: { border: 'var(--red)', icon: '⚠', bg: 'color-mix(in srgb, var(--red) 9%, transparent)' },
    ok: { border: 'var(--green)', icon: '✓', bg: 'color-mix(in srgb, var(--green) 9%, transparent)' },
  } as const;
  const s = map[kind];

  return (
    <div
      className="my-3 flex gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed text-dim"
      style={{ borderColor: `color-mix(in srgb, ${s.border} 45%, transparent)`, background: s.bg }}
    >
      <span aria-hidden="true" className="mt-px shrink-0" style={{ color: s.border }}>
        {s.icon}
      </span>
      <div className="min-w-0">
        <strong className="block" style={{ color: s.border }}>
          {title}
        </strong>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================================
   SectionCard — standard content block with a section heading
   ========================================================================= */
export function SectionCard({
  title,
  eyebrow,
  children,
  accent = 'var(--cyan)',
  right,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  accent?: string;
  right?: ReactNode;
}) {
  return (
    <article className="glass glass-hover p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <span
          className="mono grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold"
          style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, border: `1px solid ${accent}55` }}
        >
          <Check size={12} />
        </span>
        <h2 className="display text-[17px] leading-snug font-bold">{title}</h2>
        {eyebrow ? (
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] uppercase"
            style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, border: `1px solid ${accent}44` }}
          >
            {eyebrow}
          </span>
        ) : null}
        {right ? <div className="ml-auto">{right}</div> : null}
      </div>
      {children}
    </article>
  );
}

/* =========================================================================
   EmptyState
   ========================================================================= */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed px-6 py-10 text-center" style={{ borderColor: 'var(--stroke)' }}>
      <div className="display text-[15px] font-bold">{title}</div>
      {hint ? <p className="mt-1.5 text-[13px] text-dim">{hint}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* =========================================================================
   ProgressBar
   ========================================================================= */
export function ProgressBar({ value, accent = 'var(--cyan)', height = 6 }: { value: number; accent?: string; height?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="overflow-hidden rounded-full"
      style={{ background: 'var(--stroke)', height }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${clamped}%`, background: accent, boxShadow: `0 0 8px ${accent}` }}
      />
    </div>
  );
}