import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { Slider, Stat, Toggle, type Accent, type Tone } from '@/components/ui/Controls';
import { cn } from '@/lib/cn';
import type { ControlValues, Readout, StatusBanner } from '@/types';

/* =========================================================================
   Shared laboratory shell.
   Every visualisation is a scene that supplies:
     - its parameter controls
     - one or more canvases
     - live readouts derived from the actual computation
   and gets persistence of its control values for free.
   ========================================================================= */

/** Merge stored simulation preferences with a scene's own defaults. */
export function useLabValues(key: string, defaults: ControlValues) {
  const { vizValues, setVizValues } = useProgress();
  const [values, setValues] = useState<ControlValues>(() => vizValues(key, defaults));

  const set = useCallback(
    (id: string, value: number | boolean | string) => {
      setValues((prev) => {
        const next = { ...prev, [id]: value };
        setVizValues(key, next);
        return next;
      });
    },
    [key, setVizValues],
  );

  const reset = useCallback(() => {
    setVizValues(key, defaults);
    setValues(defaults);
  }, [key, defaults, setVizValues]);

  return { values, set, reset };
}

/* ------------------------------------------------------------- controls */

export type SliderSpec = {
  kind: 'slider';
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  accent?: Accent;
  hint?: string;
  format?: (v: number) => string;
};

export type ToggleSpec = {
  kind: 'toggle';
  id: string;
  label: string;
  hint?: string;
};

export type SelectSpec = {
  kind: 'select';
  id: string;
  label: string;
  options: { value: string; label: string }[];
};

export type TextSpec = {
  kind: 'text';
  id: string;
  label: string;
  placeholder?: string;
  hint?: string;
  width?: string;
};

export type Control = SliderSpec | ToggleSpec | SelectSpec | TextSpec;

export interface ControlsProps {
  specs: Control[];
  values: ControlValues;
  set: (id: string, v: number | boolean | string) => void;
  accent?: string;
  /** Grid columns: 1 on very narrow panels, 2 where there is room. */
  columns?: 1 | 2;
}

export function Controls({ specs, values, set, columns = 2 }: ControlsProps) {
  if (specs.length === 0) return null;
  return (
    <div className={cn('grid gap-3', columns === 2 ? 'sm:grid-cols-2' : '')}>
      {specs.map((spec) => {
        switch (spec.kind) {
          case 'slider':
            return (
              <Slider
                key={spec.id}
                label={spec.label}
                value={num(values[spec.id], spec.min)}
                min={spec.min}
                max={spec.max}
                step={spec.step ?? 1}
                unit={spec.unit}
                accent={spec.accent}
                hint={spec.hint}
                format={spec.format}
                onChange={(v) => set(spec.id, v)}
              />
            );
          case 'toggle':
            return (
              <div key={spec.id} className={columns === 2 ? 'sm:col-span-1' : ''}>
                <Toggle
                  label={spec.label}
                  hint={spec.hint}
                  on={values[spec.id] === true}
                  onChange={(v) => set(spec.id, v)}
                />
              </div>
            );
          case 'select':
            return (
              <div key={spec.id} className="min-w-0">
                <label
                  htmlFor={`sel-${spec.id}`}
                  className="mb-1 block text-[10.5px] font-semibold tracking-[0.1em] text-dim uppercase"
                >
                  {spec.label}
                </label>
                <select
                  id={`sel-${spec.id}`}
                  value={String(values[spec.id] ?? '')}
                  onChange={(e) => set(spec.id, e.target.value)}
                  className="focusable w-full cursor-pointer rounded-xl border bord bg-[var(--panel)] px-2.5 py-2.5 text-[12.5px] outline-none"
                >
                  {spec.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          case 'text':
            return (
              <div key={spec.id} className="min-w-0">
                <label htmlFor={`txt-${spec.id}`} className="mb-1 block text-[10.5px] font-semibold tracking-[0.1em] text-dim uppercase">
                  {spec.label}
                </label>
                <input
                  id={`txt-${spec.id}`}
                  type="text"
                  value={String(values[spec.id] ?? '')}
                  placeholder={spec.placeholder}
                  onChange={(e) => set(spec.id, e.target.value)}
                  className="mono focusable w-full rounded-xl border bord bg-[var(--panel)] px-3 py-2.5 text-[12.5px] outline-none"
                />
                {spec.hint ? <p className="mt-1 text-[11px] text-faint">{spec.hint}</p> : null}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

/* ------------------------------------------------------------ readouts */

const TONE_MAP: Record<NonNullable<Readout['tone']>, Tone> = {
  good: 'green',
  warn: 'gold',
  bad: 'red',
  info: 'cyan',
  limit: 'violet',
};
const toneToStat = (t: Readout['tone']): Tone => (t ? TONE_MAP[t] : 'cyan');

export function Readouts({ items, columns = 4 }: { items: Readout[]; columns?: 2 | 3 | 4 }) {
  if (items.length === 0) return null;
  const map = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4' } as const;
  return (
    <div className={cn('grid gap-2.5', map[columns])}>
      {items.map((r) => (
        <Stat key={r.key} label={r.label} value={r.value} tone={toneToStat(r.tone)} />
      ))}
    </div>
  );
}

export function StatusNote({ status }: { status?: StatusBanner }) {
  if (!status) return null;
  const map = {
    ok: { bg: 'color-mix(in srgb, var(--green) 8%, transparent)', border: 'color-mix(in srgb, var(--green) 40%, transparent)', color: 'var(--green)', icon: '✓' },
    warn: { bg: 'color-mix(in srgb, var(--gold) 8%, transparent)', border: 'color-mix(in srgb, var(--gold) 40%, transparent)', color: 'var(--gold)', icon: '⚠' },
    bad: { bg: 'color-mix(in srgb, var(--red) 8%, transparent)', border: 'color-mix(in srgb, var(--red) 40%, transparent)', color: 'var(--red)', icon: '✕' },
    info: { bg: 'color-mix(in srgb, var(--cyan) 8%, transparent)', border: 'color-mix(in srgb, var(--cyan) 40%, transparent)', color: 'var(--cyan)', icon: 'ℹ' },
    limit: { bg: 'color-mix(in srgb, var(--violet) 9%, transparent)', border: 'color-mix(in srgb, var(--violet) 40%, transparent)', color: 'var(--violet)', icon: '⌁' },
  } as const;
  const s = map[status.tone];
  return (
    <p
      className="flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[12.6px] leading-relaxed text-dim"
      style={{ background: s.bg, borderColor: s.border }}
    >
      <span className="mt-px shrink-0" style={{ color: s.color }} aria-hidden="true">
        {s.icon}
      </span>
      <span className="min-w-0">{status.text}</span>
    </p>
  );
}

/* -------------------------------------------------------------- canvas */

export function LabCanvas({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border bord-soft">{children}</div>;
}

/* ---------------------------------------------------------- lab wrapper */

export interface LabShellProps {
  title: string;
  description: string;
  accent?: string;
  specs?: Control[];
  values: ControlValues;
  set: (id: string, v: number | boolean | string) => void;
  reset?: () => void;
  children: ReactNode;
  status?: StatusBanner;
  readouts?: Readout[];
  readoutColumns?: 2 | 3 | 4;
  columns?: 1 | 2;
}

export function LabShell({
  title,
  description,
  specs = [],
  values,
  set,
  reset,
  children,
  status,
  readouts,
  readoutColumns = 4,
  columns = 2,
}: LabShellProps) {
  return (
    <section className="glass p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-2.5">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
          style={{ background: 'color-mix(in srgb, var(--cyan) 10%, transparent)', color: 'var(--cyan)', border: '1px solid color-mix(in srgb, var(--cyan) 32%, transparent)' }}
          aria-hidden="true"
        >
          <FlaskConical size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="display text-[14.5px] leading-tight font-bold">{title}</h2>
          <p className="mt-0.5 text-[11.8px] leading-snug text-faint">{description}</p>
        </div>
        {reset ? (
          <button
            type="button"
            onClick={reset}
            aria-label="Reset this simulation to its defaults"
            className="focusable flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold text-dim hover:text-[var(--cyan)]"
            style={{ borderColor: 'var(--stroke)' }}
          >
            <RotateCcw size={11} /> Reset
          </button>
        ) : null}
      </div>

      <LabCanvas>{children}</LabCanvas>

      <div className="mt-3 space-y-3">
        {specs.length > 0 ? <Controls specs={specs} values={values} set={set} columns={columns} /> : null}
        {status ? <StatusNote status={status} /> : null}
        {readouts && readouts.length > 0 ? <Readouts items={readouts} columns={readoutColumns} /> : null}
      </div>
    </section>
  );
}

export interface SceneProps {
  /** Persisted-state key. Defaults to the scene name in the registry. */
  key_?: string;
  /** Per-lesson starting values, layered over the scene's own defaults. */
  overrides?: ControlValues;
}

/* -------------------------------------------------------------- helpers */

export function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export function bool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

/** Drop empty readouts and give the rest a stable key. */
export function makeReadouts(items: Omit<Readout, 'key'>[]): Readout[] {
  return items
    .filter((r) => r.value !== '')
    .map((r, i) => ({ ...r, key: `${i}-${r.label}` }));
}

/** Deterministic hash → seed, so scenes never need Math.random. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** memoised derived value helper used by scenes that compute from controls. */
export function useDerived<T>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}