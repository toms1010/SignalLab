import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  BookMarked,
  Binary,
  ChevronDown,
  CircleDot,
  FileText,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Radio,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sigma,
  SlidersHorizontal,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { modules, moduleAccentHex } from '@/data/modules';
import { lessonsForModule } from '@/data/lessons';
import { glossary } from '@/data/glossary';
import { formulas } from '@/data/formulas';
import { resources } from '@/data/resources';
import { exercises, learningPaths } from '@/data/paths';
import { useEscape } from '@/hooks/useMedia';
import { useProgress } from '@/hooks/useProgress';
import { cn } from '@/lib/cn';

const SECTION_LINKS = [
  { to: '/resources', label: 'Learning Resources', icon: BookMarked, badge: () => `${resources.length}` },
  { to: '/my-resources', label: 'My Resources', icon: FileText },
  { to: '/paths', label: 'Learning Paths', icon: Target, badge: () => `${learningPaths.length}` },
  { to: '/exercises', label: 'Practical Exercises', icon: FlaskConical, badge: () => `${exercises.length}` },
  { to: '/formulas', label: 'Formula Reference', icon: Sigma, badge: () => `${formulas.length}` },
  { to: '/glossary', label: 'Technical Glossary', icon: BookMarked, badge: () => `${glossary.length}` },
  { to: '/settings', label: 'Progress & Settings', icon: Settings },
] as const;

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { isLessonDone, modulePercent, overallPercent, completedCount, state, resetLessons } = useProgress();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number[]>(() => modules.map((m) => m.id));

  useEscape(open, onClose);

  // Close the drawer whenever the route changes on mobile.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Only track Escape / focus-trap concerns while the drawer is open.
  useEffect(() => {
    if (open && window.matchMedia('(max-width: 1023px)').matches) {
      searchRef.current?.focus();
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const out: { id: string; title: string; module: number }[] = [];
    for (const m of modules) {
      for (const l of lessonsForModule(m.id)) {
        const hay = `${l.title} ${l.sidebarLabel} ${l.summary} ${l.keywords.join(' ')}`.toLowerCase();
        if (hay.includes(q)) out.push({ id: l.id, title: l.title, module: m.id });
      }
    }
    return out.slice(0, 12);
  }, [query]);

  const toggleModule = (id: number) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <>
      {/* Scrim only exists while the mobile drawer is open. */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="lab-sidebar"
        aria-label="Course navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[292px] shrink-0 flex-col border-r bord transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'color-mix(in srgb, var(--bg) 84%, transparent)',
          backdropFilter: 'blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <div
            className="anim-floaty grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,.25), rgba(255,0,170,.25))',
              border: '1px solid rgba(0,240,255,.4)',
              boxShadow: '0 0 22px rgba(0,240,255,.3)',
              color: 'var(--cyan)',
            }}
            aria-hidden="true"
          >
            <Radio size={22} />
          </div>
          <div className="min-w-0">
            <div className="display text-[17px] leading-tight font-bold">
              Signal<span className="grad-text">Lab</span>
            </div>
            <div className="text-[9.5px] font-bold tracking-[0.26em] text-faint uppercase">Interactive Comms Lab</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focusable ml-auto rounded-lg border bord p-1.5 text-dim lg:hidden"
            aria-label="Close navigation"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <label className="sr-only" htmlFor="lesson-search">
            Search lessons and topics
          </label>
          <input
            ref={searchRef}
            id="lesson-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons…"
            className="w-full rounded-xl border bord bg-[var(--panel)] px-3 py-2 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)] focusable"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Nav body */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Modules">
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-[rgba(0,240,255,.1)] text-[var(--text)]'
                  : 'border-transparent text-dim hover:bg-[var(--panel)]',
              )
            }
          >
            <LayoutDashboard size={18} className="shrink-0 text-[var(--cyan)]" />
            Dashboard
          </NavLink>

          {results ? (
            <div className="pt-3">
              <div className="px-2 pb-1 text-[9.5px] font-bold tracking-[0.22em] text-faint uppercase">
                Search results
              </div>
              {results.length === 0 ? (
                <p className="px-3 py-2 text-[12px] text-faint">No lessons match “{query}”.</p>
              ) : (
                results.map((r) => (
                  <NavLink
                    key={r.id}
                    to={`/lesson/${r.id}`}
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] text-dim hover:bg-[var(--panel)] hover:text-[var(--text)]"
                  >
                    <CircleDot size={11} style={{ color: moduleAccentHex[r.module] }} />
                    <span className="min-w-0 truncate">{r.title}</span>
                  </NavLink>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="px-2 pt-4 pb-1 text-[9.5px] font-bold tracking-[0.26em] text-faint uppercase">Modules</div>
              {modules.map((m) => {
                const pct = modulePercent(m.id);
                const isOpen = expanded.includes(m.id);
                const Icon = [Activity, Binary, TrendingUp, Radio, SlidersHorizontal, ShieldCheck][m.id - 1] ?? Activity;
                const accent = moduleAccentHex[m.id];

                return (
                  <div key={m.id}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleModule(m.id)}
                        aria-expanded={isOpen}
                        className="focusable grid h-6 w-6 shrink-0 place-items-center rounded-md text-[var(--text-faint)] hover:text-[var(--text)]"
                        aria-label={`${isOpen ? 'Collapse' : 'Expand'} module ${m.id}`}
                      >
                        <ChevronDown size={13} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      <NavLink
                        to={`/module/${m.id}`}
                        onClick={onClose}
                        className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-dim transition-all hover:bg-[var(--panel)] hover:text-[var(--text)]"
                        style={{ color: 'inherit' }}
                      >
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                          style={{
                            background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                            color: accent,
                            border: `1px solid color-mix(in srgb, ${accent} 40%, transparent)`,
                          }}
                          aria-hidden="true"
                        >
                          <Icon size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="mono block text-[9.5px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>
                            Module {m.id}
                          </span>
                          <span className="block truncate text-[12.5px] leading-tight font-semibold text-[var(--text)]">
                            {m.shortTitle}
                          </span>
                        </span>
                        {pct === 100 ? (
                          <span className="mono shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-[var(--green)]" style={{ background: 'color-mix(in srgb, var(--green) 14%, transparent)' }}>
                            ✓
                          </span>
                        ) : (
                          <span className="mono shrink-0 text-[10px] text-faint">{pct}%</span>
                        )}
                      </NavLink>
                    </div>

                    {isOpen ? (
                      <div className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l pl-2" style={{ borderColor: 'var(--stroke)' }}>
                        {lessonsForModule(m.id).map((l) => {
                          const done = isLessonDone(l.id);
                          return (
                            <NavLink
                              key={l.id}
                              to={`/lesson/${l.id}`}
                              onClick={onClose}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[12px] transition-all',
                                  isActive
                                    ? 'bg-[color-mix(in_srgb,var(--cyan)_10%,transparent)] text-[var(--text)]'
                                    : 'border-transparent text-dim hover:bg-[var(--panel)]',
                                )
                              }
                            >
                              <span
                                className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border"
                                style={{
                                  borderColor: done ? 'var(--green)' : 'var(--text-faint)',
                                  background: done ? 'var(--green)' : 'transparent',
                                }}
                                aria-hidden="true"
                              />
                              <span className="min-w-0 flex-1 truncate">{l.sidebarLabel}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}

          <div className="px-2 pt-5 pb-1 text-[9.5px] font-bold tracking-[0.26em] text-faint uppercase">Reference</div>
          {SECTION_LINKS.map((s) => {
            const Icon = s.icon;
            const badge = 'badge' in s && typeof s.badge === 'function' ? s.badge() : undefined;
            return (
              <NavLink
                key={s.to}
                to={s.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-2 text-[13px] transition-all',
                    isActive
                      ? 'bg-[rgba(0,240,255,.1)] text-[var(--text)]'
                      : 'border-transparent text-dim hover:bg-[var(--panel)]',
                  )
                }
              >
                <Icon size={15} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                {badge ? <span className="mono text-[10px] text-faint">{badge}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: progress + reset */}
        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--stroke)' }}>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
            <span className="flex items-center gap-1" style={{ color: 'var(--gold)' }}>
              <GraduationCap size={12} />
              {completedCount} / {lessonsForModuleTotal()} lessons
            </span>
            <span className="mono text-faint">{overallPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--stroke)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${overallPercent}%`, background: 'linear-gradient(90deg, var(--cyan), var(--magenta))' }}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (Object.keys(state.lessons).length > 0 && window.confirm('Clear lesson completion and quiz scores?')) {
                resetLessons();
              }
            }}
            className="focusable mt-2.5 flex items-center gap-1.5 text-[11px] text-faint transition-colors hover:text-[var(--red)]"
          >
            <RefreshCw size={11} /> Reset lesson progress
          </button>
        </div>
      </aside>
    </>
  );
}

function lessonsForModuleTotal(): number {
  return modules.reduce((n, m) => n + lessonsForModule(m.id).length, 0);
}
