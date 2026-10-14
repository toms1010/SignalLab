import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock3,
  FlaskConical,
  Play,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  Activity,
  Binary,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { modules, moduleAccentHex } from '@/data/modules';
import { lessonIds, lessonsForModule } from '@/data/lessons';
import { getLesson } from '@/data/lessons';
import { quizzes } from '@/data/quizzes';
import { useProgress } from '@/hooks/useProgress';
import { ProgressBar, Stat } from '@/components/ui/Controls';
import { VizCanvas, label, themeColors, polyline } from '@/components/ui/VizCanvas';

const MODULE_ICONS = [Activity, Binary, TrendingUp, Radio, SlidersHorizontal, ShieldCheck] as const;

const MARQUEE_TERMS = [
  'Nyquist theorem',
  'aliasing',
  'PCM · G.711',
  'μ-law companding',
  'delta modulation',
  'sigma-delta',
  'QAM constellations',
  'OFDM · 5G',
  'spread spectrum',
  'Carson rule',
  'Hamming codes',
  'CRC',
  'interleaving',
  'BER waterfall',
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    overallPercent,
    completedCount,
    modulePercent,
    moduleCompleted,
    state,
    quizResult,
    averageQuizPercent,
    bookmarkedCount,
    solvedExercises,
    path,
    setLastLesson,
  } = useProgress();

  const totalLessons = lessonIds.length;
  const totalMinutes = useMemo(
    () => lessonsForModule(1).concat(lessonsForModule(2), lessonsForModule(3), lessonsForModule(4), lessonsForModule(5), lessonsForModule(6)).reduce((n, l) => n + l.minutes, 0),
    [],
  );

  /** Next lesson: resume the last one, else the first unfinished, else the first. */
  const nextLesson = useMemo(() => {
    if (state.lastLesson) return getLesson(state.lastLesson);
    for (const m of modules) {
      for (const l of lessonsForModule(m.id)) {
        if (!state.lessons[l.id]?.done) return l;
      }
    }
    return getLesson(lessonIds[0]);
  }, [state.lastLesson, state.lessons]);

  const recent = state.recent.slice(0, 5);
  const quizAttempts = quizzes.filter((q) => (quizResult(q.module)?.attempts ?? 0) > 0);

  /** Skills the user has missed, derived from recorded quiz answers. */
  const weakSkills = useMemo(() => {
    const tally = { definition: 0, calculation: 0, concept: 0 } as Record<string, number>;
    let answered = 0;
    for (const q of quizzes) {
      const res = quizResult(q.module);
      if (!res || res.attempts === 0) continue;
      q.questions.forEach((question, i) => {
        const picked = res.lastAnswers[i];
        if (!picked) return;
        answered++;
        if (picked !== question.correctOptionId) tally[question.skill] = (tally[question.skill] ?? 0) + 1;
      });
    }
    if (answered === 0) return null;
    return { tally, answered };
  }, [quizResult]);

  return (
    <div>
      {/* ---------------------------------------------------------- hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass glass-hover relative overflow-hidden p-6 sm:p-8"
      >
        <div
          className="pointer-events-none absolute -top-10 -right-6 select-none text-[150px] leading-none font-bold opacity-[0.05]"
          aria-hidden="true"
        >
          <span className="display">ΣΔ</span>
        </div>

        <div className="relative grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span
              className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10.5px] font-bold tracking-[0.18em] uppercase"
              style={{ borderColor: 'rgba(0,240,255,.4)', color: 'var(--cyan)', background: 'rgba(0,240,255,.06)' }}
            >
              <Sparkles size={12} /> 6 modules · {totalLessons} lessons
            </span>

            <h1 className="display text-4xl leading-[1.06] font-bold tracking-tight sm:text-5xl">
              Master the language
              <br />
              of <span className="grad-text">signals.</span>
            </h1>

            <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-dim">
              From the Nyquist sampling theorem to Hamming codes — every concept ships with a live simulation you can
              drive, real formulas with stated assumptions, and a checkpoint quiz.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!nextLesson) return;
                  setLastLesson(nextLesson.id);
                  navigate(`/lesson/${nextLesson.id}`);
                }}
                className="focusable flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.03]"
                style={{ background: 'linear-gradient(90deg, var(--cyan), #00b8d9)', color: '#031820', boxShadow: '0 0 26px rgba(0,240,255,.4)' }}
              >
                <Play size={16} />
                {completedCount === 0 ? 'Start module 1' : `Continue: ${nextLesson?.sidebarLabel ?? ''}`}
              </button>
              <Link
                to="/paths"
                className="focusable flex items-center gap-2 rounded-xl border bord px-4 py-3 text-sm font-semibold text-dim transition-colors hover:text-[var(--text)]"
              >
                <Target size={15} />
                {path ? 'View your learning path' : 'Choose a learning path'}
              </Link>
            </div>
          </div>

          <div className="relative">
            <VizCanvas draw={HeroWave} height={180} label="Animated layered waveforms with sample points" className="rounded-2xl border bord-soft" />
            <p className="mono pointer-events-none absolute bottom-2.5 left-3 text-[9.5px] text-faint">
              x(t) → Σ samples → bits → constellation → delivery
            </p>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { icon: BookOpen, v: String(totalLessons), l: 'Lessons', tone: 'var(--cyan)' as const },
            { icon: FlaskConical, v: String(modules.length), l: 'Modules', tone: 'var(--magenta)' as const },
            { icon: Clock3, v: `${Math.round(totalMinutes / 60)} h`, l: 'Study time', tone: 'var(--gold)' as const },
            { icon: Target, v: `${averageQuizPercent}%`, l: 'Avg quiz best', tone: 'var(--green)' as const },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border bord-soft px-3.5 py-3" style={{ background: 'var(--panel)' }}>
              <s.icon size={15} style={{ color: s.tone }} aria-hidden="true" />
              <div className="display mt-1 text-xl font-bold">{s.v}</div>
              <div className="text-[10.5px] text-faint">{s.l}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ------------------------------------------------------- marquee */}
      <div
        className="relative mt-5 overflow-hidden rounded-2xl border bord-soft py-2.5"
        style={{
          background: 'var(--panel)',
          maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)',
        }}
        aria-hidden="true"
      >
        <div className="flex w-max gap-8 whitespace-nowrap" style={{ animation: 'marquee 34s linear infinite' }}>
          {[0, 1].map((dup) => (
            <span key={dup} className="mono flex gap-8 text-[11px] font-semibold tracking-[0.2em] text-faint uppercase">
              {MARQUEE_TERMS.map((t) => (
                <span key={t} className="flex items-center gap-8">
                  {t}
                  <span style={{ color: 'var(--cyan)' }}>◆</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------- module grid */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="display text-xl font-bold">Your learning path</h2>
          <p className="text-sm text-dim">
            Digitise → encode → modulate → survive the channel → correct what noise breaks.
          </p>
        </div>
        <Link to="/module/1" className="focusable flex items-center gap-1 text-[13px] font-semibold text-[var(--cyan)]">
          Open module 1 <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((m, i) => {
          const Icon = MODULE_ICONS[i] ?? Activity;
          const accent = moduleAccentHex[m.id];
          const pct = modulePercent(m.id);
          const done = pct === 100;
          const quiz = quizResult(m.id);
          const lessons = lessonsForModule(m.id);

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <Link
                to={`/module/${m.id}`}
                className="glass glass-hover group relative block overflow-hidden p-5"
                aria-label={`Open module ${m.id}: ${m.title}`}
              >
                <span
                  className="pointer-events-none absolute -top-6 -right-3 select-none text-[92px] leading-none font-bold opacity-[0.08]"
                  aria-hidden="true"
                >
                  {String(m.id).padStart(2, '0')}
                </span>

                <div className="relative">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                        color: accent,
                        border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
                      }}
                      aria-hidden="true"
                    >
                      <Icon size={20} />
                    </span>
                    {done ? (
                      <span
                        className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                        style={{ background: 'color-mix(in srgb, var(--green) 12%, transparent)', color: 'var(--green)' }}
                      >
                        {quiz ? `Done · ${quiz.best}/3` : 'Done'}
                      </span>
                    ) : (
                      <span className="mono shrink-0 rounded-full border bord px-2 py-1 text-[10px] text-faint">
                        {lessons.length} lessons
                      </span>
                    )}
                  </div>

                  <div className="mono text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: accent }}>
                    Module {m.id}
                  </div>
                  <h3 className="display mt-1 text-[16.5px] leading-snug font-bold">{m.title}</h3>
                  <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-dim">{m.description}</p>

                  <div className="mt-3">
                    <ProgressBar value={pct} accent={accent} />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11.5px] font-semibold">
                    <span className="text-faint">
                      {moduleCompleted(m.id)} / {lessons.length} done
                      {quiz ? ` · quiz ${quiz.best}/3` : ''}
                    </span>
                    <span className="flex items-center gap-1 transition-transform group-hover:translate-x-1" style={{ color: accent }}>
                      {done ? 'Review' : 'Enter'} <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* -------------------------------------------- progress + analytics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="glass p-5">
          <h3 className="display mb-3 flex items-center gap-2 text-[14px] font-bold">
            <BarChart3 size={15} style={{ color: 'var(--cyan)' }} /> Progress
          </h3>
          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-[12px]">
                <span className="text-dim">Overall course</span>
                <span className="mono text-faint">
                  {completedCount}/{totalLessons} · {overallPercent}%
                </span>
              </div>
              <ProgressBar value={overallPercent} accent="linear-gradient(90deg, var(--cyan), var(--magenta))" height={7} />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Stat label="Bookmarks" value={String(bookmarkedCount)} tone="gold" />
              <Stat label="Exercises" value={`${solvedExercises}/10`} tone="green" />
              <Stat label="Quizzes taken" value={`${quizAttempts.length}/6`} tone="magenta" />
              <Stat label="Lessons left" value={String(totalLessons - completedCount)} tone="cyan" />
            </div>
          </div>
        </section>

        <section className="glass p-5">
          <h3 className="display mb-3 text-[14px] font-bold">Recent activity</h3>
          {recent.length === 0 ? (
            <p className="text-[12.5px] text-faint">
              Nothing yet — open a lesson and it will appear here so you can pick up where you left off.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {recent.map((r, i) => {
                const l = getLesson(r.lesson);
                if (!l) return null;
                return (
                  <li key={`${r.lesson}-${i}`}>
                    <Link
                      to={`/lesson/${l.id}`}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] text-dim transition-colors hover:bg-[var(--panel)] hover:text-[var(--text)]"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: moduleAccentHex[l.module] }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">{l.sidebarLabel}</span>
                      <span className="mono shrink-0 text-[10px] text-faint">
                        {new Date(r.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="glass p-5">
          <h3 className="display mb-3 text-[14px] font-bold">Quiz review</h3>
          {quizAttempts.length === 0 ? (
            <p className="text-[12.5px] text-faint">
              No quizzes attempted yet. Each module ends with a three-question checkpoint.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {quizzes.map((q) => {
                  const res = quizResult(q.module);
                  const accent = moduleAccentHex[q.module];
                  const best = res?.best ?? 0;
                  return (
                    <li key={q.module}>
                      <Link to={`/module/${q.module}`} className="block">
                        <div className="mb-1 flex justify-between text-[11.5px]">
                          <span className="text-dim">Module {q.module}</span>
                          <span className="mono" style={{ color: best === 3 ? 'var(--green)' : best >= 2 ? 'var(--gold)' : 'var(--red)' }}>
                            {res ? `${best}/3` : '—'}
                          </span>
                        </div>
                        <ProgressBar value={(best / 3) * 100} accent={accent} height={4} />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {weakSkills ? (
                <div className="mt-4 rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--stroke)' }}>
                  <p className="mb-1.5 text-[11px] font-bold tracking-[0.1em] text-faint uppercase">Missed by skill</p>
                  <div className="space-y-1">
                    {(['calculation', 'concept', 'definition'] as const).map((skill) => (
                      <div key={skill} className="flex justify-between text-[11.5px]">
                        <span className="capitalize text-dim">{skill}</span>
                        <span className="mono text-faint">{weakSkills.tally[skill] ?? 0} missed</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10.5px] leading-snug text-faint">
                    Based on {weakSkills.answered} answered questions. Too few answers for any statistical conclusion —
                    treat this as a pointer to review, not a measurement.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ hero wave */
function HeroWave(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const col = themeColors();
  ctx.clearRect(0, 0, w, h);
  const mid = h / 2;

  const wave = (color: string, amp: number, cycles: number, speed: number, width: number, alpha: number) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.lineJoin = 'round';
    const xs: number[] = [];
    const ys: number[] = [];
    const N = Math.max(60, Math.floor(w));
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const env = 0.55 + 0.45 * Math.sin(u * Math.PI);
      xs.push(u);
      ys.push(Math.sin(u * cycles * Math.PI * 2 + t * speed) * env * (0.7 + 0.3 * Math.sin(u * 3 + t)) * amp);
    }
    polyline(ctx, xs, ys, (u) => u * w, (y) => mid - y);
    ctx.restore();
  };

  wave(col.cyan, h * 0.26, 3, 1.1, 2.2, 0.95);
  wave(col.magenta, h * 0.19, 5, -0.8, 1.6, 0.7);
  wave(col.gold, h * 0.12, 8, 1.7, 1.2, 0.55);

  // Sample dots riding the cyan waveform.
  const N = 14;
  ctx.save();
  ctx.fillStyle = col.gold;
  ctx.shadowColor = col.gold;
  ctx.shadowBlur = 8;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const env = 0.55 + 0.45 * Math.sin(u * Math.PI);
    const y = mid - Math.sin(u * 3 * Math.PI * 2 + t * 1.1) * h * 0.26 * env * (0.7 + 0.3 * Math.sin(u * 3 + t));
    ctx.beginPath();
    ctx.arc(u * w, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  label(ctx, 'analog', 8, 12, col.text, 9);
  label(ctx, 'samples →', w - 8, 12, col.text, 9, 'right');
}