import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  LightbulbIcon,
  Play,
  Sparkles,
  Target,
  ThumbsDown,
  Zap,
} from 'lucide-react';
import { getLesson, lessons, adjacentLessons } from '@/data/lessons';
import { moduleAccentHex, moduleMap } from '@/data/modules';
import { formulaMap } from '@/data/formulas';
import { useProgress } from '@/hooks/useProgress';
import { RichText, Term } from '@/components/ui/RichText';
import { Callout as CalloutUI, Formula, ProgressBar } from '@/components/ui/Controls';
import { VizFor } from '@/components/visualizations/registry';
import { cn } from '@/lib/cn';

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = getLesson(lessonId);
  const { isLessonDone, toggleLesson, setLastLesson, modulePercent } = useProgress();

  // Opening a lesson is the natural "last visited" marker.
  const lessonIdRef = lesson?.id;
  useEffect(() => {
    if (lessonIdRef) setLastLesson(lessonIdRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonIdRef]);

  if (!lesson) return <Navigate to="/404" replace />;

  const accent = moduleAccentHex[lesson.module];
  const meta = moduleMap.get(lesson.module);
  const done = isLessonDone(lesson.id);
  const { prev, next } = adjacentLessons(lesson.id);
  const formulas = lesson.formulaIds.map((id) => formulaMap.get(id)).filter(Boolean);
  const reading = lesson.furtherReading;

  return (
    <div>
      {/* ------------------------------------------------------ header */}
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <Link
          to={`/module/${lesson.module}`}
          className="focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold text-dim hover:text-[var(--text)]"
          style={{ borderColor: 'var(--stroke)' }}
        >
          <ArrowLeft size={13} /> Module {lesson.module}
        </Link>
        <span className="mono text-[11px] text-faint">
          Lesson {lesson.index} · {lesson.minutes} min
        </span>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="mono text-[11px] text-faint">
            Module {lesson.module}: {modulePercent(lesson.module)}%
          </span>
          <div className="w-20">
            <ProgressBar value={modulePercent(lesson.module)} accent={accent} height={4} />
          </div>
        </div>
      </header>

      <motion.div
        key={lesson.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]"
      >
        {/* ---------------------------------------------------- reading */}
        <div className="min-w-0 space-y-4">
          <div className="glass glass-hover p-5 sm:p-6">
            <div className="mono mb-1.5 text-[10.5px] font-bold tracking-[0.2em] uppercase" style={{ color: accent }}>
              {meta?.shortTitle}
            </div>
            <h1 className="display text-2xl leading-tight font-bold sm:text-[28px]">{lesson.title}</h1>
            <p className="mt-2 text-[13.8px] leading-relaxed text-dim">{lesson.summary}</p>

            <div className="mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.16em] text-faint uppercase">
                <Target size={12} /> By the end of this lesson you can
              </div>
              <ul className="space-y-1.5">
                {lesson.objectives.map((o) => (
                  <li key={o} className="flex gap-2.5 text-[13.2px] leading-relaxed text-dim">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: accent, boxShadow: `0 0 7px ${accent}` }}
                      aria-hidden="true"
                    />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* theory sections */}
          {lesson.sections.map((s, i) => (
            <article key={i} className="glass glass-hover p-5 sm:p-6">
              {s.heading ? (
                <h2 className="display mb-3 flex items-center gap-2.5 text-[16px] font-bold">
                  <span
                    className="mono grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold"
                    style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, border: `1px solid ${accent}44` }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  {s.heading}
                </h2>
              ) : null}

              <div className="prose-lab">
                {(s.paragraphs ?? []).map((p, j) => (
                  <p key={j}>
                    <RichText text={p} />
                  </p>
                ))}
              </div>

              {s.bullets?.length ? (
                <ul className="space-y-2">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="flex gap-2.5 text-[13.4px] leading-relaxed text-dim">
                      <span
                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: accent }}
                        aria-hidden="true"
                      />
                      <span>
                        <RichText text={b} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {s.note ? (
                <CalloutUI
                  kind={s.note.kind === 'info' ? 'info' : s.note.kind === 'limit' ? 'limit' : 'note'}
                  title={s.note.title}
                >
                  <RichText text={s.note.body} />
                </CalloutUI>
              ) : null}
            </article>
          ))}

          {/* key terms */}
          {lesson.keyTerms.length > 0 ? (
            <article className="glass p-5 sm:p-6">
              <h2 className="display mb-3 flex items-center gap-2 text-[15px] font-bold">
                <BookOpen size={15} style={{ color: accent }} aria-hidden="true" /> Key terms
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {lesson.keyTerms.map((t) => (
                  <Term key={t} term={t} />
                ))}
              </div>
              <p className="mt-2.5 text-[11.5px] text-faint">
                Each term opens its definition on hover, on keyboard focus, or on tap.
              </p>
            </article>
          ) : null}

          {/* formulas */}
          {formulas.length > 0 ? (
            <article className="glass p-5 sm:p-6">
              <h2 className="display mb-3 text-[15px] font-bold">Formulas used here</h2>
              <div className="space-y-3">
                {formulas.map((f) => (
                  <div key={f!.id}>
                    <Formula tex={f!.tex} plain={f!.plain} accent={accent} />
                    <p className="mt-1.5 text-[12.2px] leading-relaxed text-faint">
                      <strong className="text-dim">Assumptions:</strong> {f!.assumptions}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                to="/formulas"
                className="focusable mt-3 inline-block rounded-lg border px-2.5 py-1.5 text-[11.5px] text-dim hover:text-[var(--text)]"
                style={{ borderColor: 'var(--stroke)' }}
              >
                Full formula reference →
              </Link>
            </article>
          ) : null}

          {/* worked example */}
          <article className="glass p-5 sm:p-6">
            <h2 className="display mb-3 flex items-center gap-2 text-[15px] font-bold">
              <Sparkles size={15} style={{ color: 'var(--gold)' }} aria-hidden="true" />
              Worked example — {lesson.worked.title}
            </h2>
            <pre
              className="mono mb-3 overflow-x-auto rounded-xl border px-3.5 py-2.5 text-[11.8px] leading-relaxed whitespace-pre-wrap"
              style={{ borderColor: 'var(--stroke)', background: 'var(--panel)', color: accent }}
            >
              {lesson.worked.given.join('\n')}
            </pre>
            <ol className="space-y-2.5">
              {lesson.worked.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[13.3px] leading-relaxed text-dim">
                  <span
                    className="mono mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px]"
                    style={{ background: 'var(--panel)', border: '1px solid var(--stroke)' }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span>
                    <RichText text={s} />
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-xl border-l-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-dim"
              style={{ borderColor: 'var(--green)', background: 'color-mix(in srgb, var(--green) 6%, transparent)' }}>
              <strong style={{ color: 'var(--green)' }}>Answer. </strong>
              <RichText text={lesson.worked.answer} />
            </p>
          </article>

          {/* applications */}
          {lesson.applications.length > 0 ? (
            <article className="glass p-5 sm:p-6">
              <h2 className="display mb-3 flex items-center gap-2 text-[15px] font-bold">
                <Zap size={15} style={{ color: accent }} aria-hidden="true" /> Where this is used
              </h2>
              <ul className="space-y-2">
                {lesson.applications.map((a, i) => (
                  <li key={i} className="flex gap-2.5 text-[13.3px] leading-relaxed text-dim">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} aria-hidden="true" />
                    <span>
                      <RichText text={a} />
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}

          {/* misconceptions */}
          {lesson.misconceptions.length > 0 ? (
            <article className="glass p-5 sm:p-6">
              <h2 className="display mb-3 flex items-center gap-2 text-[15px] font-bold">
                <ThumbsDown size={15} style={{ color: 'var(--red)' }} aria-hidden="true" /> Common mistakes
              </h2>
              <div className="space-y-3">
                {lesson.misconceptions.map((mc, i) => (
                  <div key={i} className="rounded-xl border bord-soft p-3.5" style={{ background: 'var(--panel)' }}>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--red)' }}>
                      <LightbulbIcon size={12} className="mr-1.5 inline" aria-hidden="true" />
                      <strong>Myth:</strong> <RichText text={mc.myth} />
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-dim">
                      <CheckCircle2 size={12} className="mr-1.5 inline" style={{ color: 'var(--green)' }} aria-hidden="true" />
                      <strong style={{ color: 'var(--green)' }}>Actually:</strong> <RichText text={mc.truth} />
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {/* further learning */}
          <article className="glass p-5 sm:p-6">
            <h2 className="display mb-1 flex items-center gap-2 text-[15px] font-bold">
              <Lightbulb size={15} style={{ color: 'var(--gold)' }} aria-hidden="true" /> Further learning
            </h2>
            <p className="mb-3 text-[12px] text-faint">
              Supplementary only — everything above is self-contained. External items open in a new tab.
            </p>
            <ul className="space-y-2">
              {reading.map((r, i) => (
                <li key={i} className="rounded-xl border bord-soft px-3.5 py-2.5" style={{ background: 'var(--panel)' }}>
                  <div className="flex items-center gap-2">
                    <KindBadge kind={r.kind} />
                    {r.href ? (
                      r.href.startsWith('/') ? (
                        <Link to={r.href} className="min-w-0 flex-1 truncate text-[13px] font-semibold hover:text-[var(--cyan)]">
                          {r.title}
                        </Link>
                      ) : (
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[13px] font-semibold hover:text-[var(--cyan)]"
                        >
                          <span className="truncate">{r.title}</span>
                          <ExternalLink size={11} className="shrink-0 opacity-60" />
                        </a>
                      )
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{r.title}</span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-faint">{r.detail}</p>
                  <p className="mt-1 text-[12.2px] leading-relaxed text-dim">
                    <strong style={{ color: 'var(--gold)' }}>Why: </strong>
                    {r.why}
                  </p>
                </li>
              ))}
            </ul>
          </article>

          {/* completion */}
          <article className="glass p-5 text-center">
            <p className="mb-3 text-[13px] text-dim">
              {done
                ? 'Marked complete. Untick it if you want to revisit it in your progress list.'
                : 'Finished reading and working through the simulation? Mark it complete to update your progress.'}
            </p>
            <button
              type="button"
              onClick={() => toggleLesson(lesson.id)}
              aria-pressed={done}
              className={cn(
                'focusable flex items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-bold transition-transform hover:scale-[1.03]',
              )}
              style={{
                background: done ? 'color-mix(in srgb, var(--green) 16%, transparent)' : `color-mix(in srgb, ${accent} 16%, transparent)`,
                color: done ? 'var(--green)' : accent,
                border: `1px solid ${done ? 'color-mix(in srgb, var(--green) 45%, transparent)' : `color-mix(in srgb, ${accent} 45%, transparent)`}`,
              }}
            >
              {done ? <CheckCircle2 size={16} /> : <Play size={16} />}
              {done ? 'Lesson complete' : 'Mark lesson complete'}
            </button>
          </article>
        </div>

        {/* --------------------------------------------------------- lab */}
        <aside className="min-w-0">
          <div className="xl:sticky xl:top-[80px]">
            <VizFor lessonId={lesson.id} vizId={lesson.vizId} accent={accent} />
          </div>
        </aside>
      </motion.div>

      {/* ---------------------------------------------------- conclusion */}
      <section className="glass glass-hover mt-5 p-5 sm:p-6">
        <h2 className="display mb-2 text-[15px] font-bold">Conclusion</h2>
        <p className="text-[13.6px] leading-relaxed text-dim">
          <RichText text={lesson.conclusion} />
        </p>
        {lesson.related.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {lesson.related.map((rid) => {
              const r = getLesson(rid);
              if (!r) return null;
              return (
                <Link
                  key={rid}
                  to={`/lesson/${rid}`}
                  className="focusable rounded-lg border px-2.5 py-1.5 text-[11.8px] text-dim transition-colors hover:text-[var(--text)]"
                  style={{ borderColor: 'var(--stroke)' }}
                >
                  Related: {r.sidebarLabel}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* ----------------------------------------------------- next/prev */}
      <nav className="mt-5 flex flex-wrap items-center justify-between gap-3" aria-label="Lesson navigation">
        {prev ? (
          <Link
            to={`/lesson/${prev.id}`}
            className="focusable flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold text-dim transition-all hover:scale-[1.02] hover:text-[var(--text)] sm:flex-none"
            style={{ borderColor: 'var(--stroke)' }}
          >
            <ArrowLeft size={15} className="shrink-0" />
            <span className="min-w-0 truncate">{prev.sidebarLabel}</span>
          </Link>
        ) : (
          <Link
            to={`/module/${lesson.module}`}
            className="focusable flex items-center gap-2 rounded-xl border px-4 py-2.5 text-[13px] font-semibold text-dim"
            style={{ borderColor: 'var(--stroke)' }}
          >
            <ArrowLeft size={15} /> Module {lesson.module} overview
          </Link>
        )}

        {next ? (
          <Link
            to={`/lesson/${next.id}`}
            className="focusable flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold text-[var(--text)] transition-transform hover:scale-[1.03] sm:flex-none"
            style={{ background: accent, color: '#04121a' }}
          >
            <span className="min-w-0 truncate">{next.sidebarLabel}</span>
            <ArrowRight size={15} className="shrink-0" />
          </Link>
        ) : (
          <Link
            to="/exercises"
            className="focusable flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold"
            style={{ background: 'var(--gold)', color: '#1a1400' }}
          >
            Final lesson — try the exercises <ArrowRight size={15} />
          </Link>
        )}
      </nav>

      <p className="mt-4 text-center text-[11px] text-faint">
        Lesson {lessons.findIndex((l) => l.id === lesson.id) + 1} of {lessons.length} in the course.
      </p>
    </div>
  );
}

function KindBadge({ kind }: { kind: string }) {
  const map: Record<string, { label: string; color: string }> = {
    read: { label: 'READ', color: 'var(--cyan)' },
    watch: { label: 'WATCH', color: 'var(--magenta)' },
    simulate: { label: 'SIMULATE', color: 'var(--green)' },
    practice: { label: 'PRACTICE', color: 'var(--gold)' },
    advanced: { label: 'ADVANCED', color: 'var(--violet)' },
  };
  const m = map[kind] ?? map.read!;
  return (
    <span
      className="mono shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.1em]"
      style={{ background: `color-mix(in srgb, ${m.color} 14%, transparent)`, color: m.color }}
    >
      {m.label}
    </span>
  );
}
