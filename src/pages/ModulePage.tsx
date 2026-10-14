import { useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Binary,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FlaskConical,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingUp,
} from 'lucide-react';
import { moduleAccentHex, modules, moduleMap } from '@/data/modules';
import { lessonsForModule } from '@/data/lessons';
import { useProgress } from '@/hooks/useProgress';
import { ModuleQuiz } from '@/components/quizzes/ModuleQuiz';
import { ProgressBar } from '@/components/ui/Controls';
import { cn } from '@/lib/cn';
import type { ModuleId } from '@/types';

const ICONS = [Activity, Binary, TrendingUp, Radio, SlidersHorizontal, ShieldCheck] as const;

export default function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const id = Number(moduleId) as ModuleId;
  const meta = moduleMap.get(id);
  const navigate = useNavigate();
  const { isLessonDone, modulePercent, moduleCompleted, setLastLesson, quizResult } = useProgress();

  // Opening a module is the natural "last visited" marker.
  useEffect(() => {
    if (meta) document.title = `Module ${id} — SignalLab`;
  }, [meta, id]);

  if (!meta) return <Navigate to="/404" replace />;

  const Icon = ICONS[id - 1] ?? Activity;
  const accent = moduleAccentHex[id];
  const lessons = lessonsForModule(id);
  const pct = modulePercent(id);
  const quiz = quizResult(id);
  const prev = id > 1 ? id - 1 : null;
  const next = id < 6 ? id + 1 : null;

  return (
    <div>
      {/* -------------------------------------------------------- header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass glass-hover relative overflow-hidden p-6 sm:p-7"
      >
        <span
          className="pointer-events-none absolute -top-8 -right-3 select-none text-[150px] leading-none font-bold opacity-[0.06]"
          aria-hidden="true"
        >
          {String(id).padStart(2, '0')}
        </span>

        <div className="relative flex flex-wrap items-start gap-4">
          <span
            className="anim-floaty grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
            style={{
              background: `color-mix(in srgb, ${accent} 12%, transparent)`,
              color: accent,
              border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
              boxShadow: `0 0 26px color-mix(in srgb, ${accent} 22%, transparent)`,
            }}
            aria-hidden="true"
          >
            <Icon size={27} />
          </span>

          <div className="min-w-[240px] flex-1">
            <div className="mono text-[10.5px] font-bold tracking-[0.24em] uppercase" style={{ color: accent }}>
              Module {id} of 6
            </div>
            <h1 className="display mt-1 text-3xl leading-tight font-bold sm:text-4xl">{meta.title}</h1>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-dim">{meta.description}</p>
          </div>

          {pct === 100 ? (
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
              style={{ background: 'color-mix(in srgb, var(--green) 14%, transparent)', color: 'var(--green)', border: '1px solid color-mix(in srgb, var(--green) 35%, transparent)' }}
            >
              <CheckCircle2 size={14} /> Complete{quiz ? ` · ${quiz.best}/3` : ''}
            </span>
          ) : null}
        </div>

        <div className="relative mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="text-dim">
              {moduleCompleted(id)} of {lessons.length} lessons
            </span>
            <span className="mono text-faint">{pct}%</span>
          </div>
          <ProgressBar value={pct} accent={accent} height={7} />
        </div>

        <div className="relative mt-5">
          <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.18em] text-faint uppercase">
            <Target size={12} /> Learning objectives
          </div>
          <ul className="flex flex-wrap gap-1.5">
            {meta.objectives.map((o) => (
              <li
                key={o}
                className="rounded-lg border bord-soft px-2.5 py-1.5 text-[11.8px] text-dim"
                style={{ background: 'var(--panel)' }}
              >
                {o}
              </li>
            ))}
          </ul>
        </div>
      </motion.header>

      {/* ------------------------------------------------------- lessons */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="glass p-5">
          <h2 className="display mb-3 flex items-center gap-2 text-[15px] font-bold">
            <BookIcon />
            Lessons in this module
          </h2>
          <ul className="space-y-1.5">
            {lessons.map((l, i) => {
              const done = isLessonDone(l.id);
              return (
                <li key={l.id}>
                  <Link
                    to={`/lesson/${l.id}`}
                    onClick={() => setLastLesson(l.id)}
                    className="flex items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-[var(--stroke)] hover:bg-[var(--panel)]"
                  >
                    <span
                      className={cn(
                        'mono grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold',
                      )}
                      style={{
                        background: done ? 'color-mix(in srgb, var(--green) 16%, transparent)' : `color-mix(in srgb, ${accent} 10%, transparent)`,
                        color: done ? 'var(--green)' : accent,
                        border: `1px solid ${done ? 'color-mix(in srgb, var(--green) 35%, transparent)' : `color-mix(in srgb, ${accent} 30%, transparent)`}`,
                      }}
                      aria-hidden="true"
                    >
                      {done ? <CheckCircle2 size={13} /> : i + 1}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] leading-snug font-semibold text-[var(--text)]">
                        {l.sidebarLabel}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-faint">{l.summary}</span>
                      <span className="mono mt-1 flex items-center gap-2.5 text-[10px] text-faint">
                        <span className="flex items-center gap-1">
                          <Clock3 size={10} /> {l.minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <FlaskConical size={10} /> {l.keyTerms.length} key terms
                        </span>
                      </span>
                    </span>

                    <ChevronRight size={15} className="mt-1 shrink-0 text-faint" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <ModuleQuiz module={id} />
      </div>

      {/* ------------------------------------------------ module nav */}
      <nav className="mt-5 flex flex-wrap items-center justify-between gap-3" aria-label="Module navigation">
        {prev ? (
          <Link
            to={`/module/${prev}`}
            className="focusable flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold text-dim transition-all hover:scale-[1.02] hover:text-[var(--text)]"
            style={{ borderColor: 'var(--stroke)' }}
          >
            <ChevronLeft size={15} /> Module {prev}: {moduleMap.get(prev as ModuleId)?.shortTitle}
          </Link>
        ) : (
          <Link
            to="/"
            className="focusable flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold text-dim transition-all hover:text-[var(--text)]"
            style={{ borderColor: 'var(--stroke)' }}
          >
            <ChevronLeft size={15} /> Dashboard
          </Link>
        )}

        {next ? (
          <button
            type="button"
            onClick={() => navigate(`/module/${next}`)}
            className="focusable flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-[var(--text)] transition-transform hover:scale-[1.03]"
            style={{ background: moduleAccentHex[next], color: '#04121a' }}
          >
            Module {next}: {moduleMap.get(next as ModuleId)?.shortTitle} <ArrowRight size={15} />
          </button>
        ) : (
          <Link
            to="/exercises"
            className="focusable flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-transform hover:scale-[1.03]"
            style={{ background: 'var(--gold)', color: '#1a1400' }}
          >
            Practise with the exercises <ArrowRight size={15} />
          </Link>
        )}
      </nav>

      <p className="mt-4 text-center text-[11.5px] text-faint">
        {modules.length} modules · {lessons.length} lessons in this module · quiz best{' '}
        {quiz ? `${quiz.best}/3` : 'not attempted'}
      </p>
    </div>
  );
}

function BookIcon() {
  return <FlaskConical size={15} style={{ color: 'var(--cyan)' }} aria-hidden="true" />;
}