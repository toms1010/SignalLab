import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Compass, GraduationCap, Target } from 'lucide-react';
import { learningPaths } from '@/data/paths';
import { resources } from '@/data/resources';
import { getLesson } from '@/data/lessons';
import { moduleAccentHex } from '@/data/modules';
import { useProgress } from '@/hooks/useProgress';
import { ProgressBar } from '@/components/ui/Controls';
import { cn } from '@/lib/cn';

const PATH_ICON = [Compass, GraduationCap, Target] as const;

export default function PathsPage() {
  const { path, setPath, isLessonDone } = useProgress();

  return (
    <div>
      <header className="mb-5">
        <div className="mono mb-1 text-[11px] tracking-[0.18em] text-[var(--cyan)] uppercase">Learning Resources</div>
        <h1 className="display text-3xl font-bold">Guided Learning Paths</h1>
        <p className="mt-2 max-w-3xl text-[14px] text-dim">
          Three ordered routes through the same 39 lessons. Every step is a real lesson with its own simulation and quiz —
          nothing here is a placeholder card.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {learningPaths.map((p, i) => {
          const Icon = PATH_ICON[i] ?? Compass;
          const selected = path === p.id;
          const doneCount = p.steps.filter((s) => isLessonDone(s.lesson)).length;
          const pct = Math.round((doneCount / p.steps.length) * 100);
          const books = p.resourceIds.map((id) => resources.find((r) => r.id === id)).filter(Boolean);

          return (
            <article
              key={p.id}
              className={cn('glass flex flex-col gap-3 p-5', selected && 'border-[var(--cyan)]')}
              style={selected ? { boxShadow: '0 0 0 1px var(--cyan) inset' } : undefined}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: 'color-mix(in srgb, var(--cyan) 12%, transparent)', color: 'var(--cyan)', border: '1px solid color-mix(in srgb, var(--cyan) 40%, transparent)' }}
                  aria-hidden="true"
                >
                  <Icon size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="display text-[15px] font-bold">{p.title}</h2>
                  <p className="mt-1 text-[12.4px] leading-relaxed text-dim">{p.description}</p>
                </div>
              </div>

              <p className="rounded-lg border-l-2 px-3 py-2 text-[12.3px] leading-relaxed text-dim"
                style={{ borderColor: 'var(--green)', background: 'color-mix(in srgb, var(--green) 6%, transparent)' }}>
                <strong className="block text-[10.5px] tracking-[0.1em] uppercase" style={{ color: 'var(--green)' }}>
                  Outcome
                </strong>
                {p.outcome}
              </p>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                  <span className="text-dim">
                    {doneCount} / {p.steps.length} lessons
                  </span>
                  <span className="mono text-faint">{pct}%</span>
                </div>
                <ProgressBar value={pct} accent={selected ? 'var(--cyan)' : 'var(--gray)'} height={5} />
              </div>

              <ol className="min-h-0 flex-1 space-y-0.5">
                {p.steps.map((s, n) => {
                  const lesson = getLesson(s.lesson);
                  if (!lesson) return null;
                  const accent = moduleAccentHex[lesson.module];
                  const done = isLessonDone(s.lesson);
                  return (
                    <li key={`${p.id}-${s.lesson}`}>
                      <Link
                        to={`/lesson/${s.lesson}`}
                        className="flex items-start gap-2 rounded-lg px-1.5 py-1.5 text-[12.3px] transition-colors hover:bg-[var(--panel)]"
                      >
                        <span
                          className="mono mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px]"
                          style={{
                            background: done ? 'color-mix(in srgb, var(--green) 16%, transparent)' : 'var(--panel)',
                            color: done ? 'var(--green)' : 'var(--text-faint)',
                            border: `1px solid ${done ? 'color-mix(in srgb, var(--green) 35%, transparent)' : 'var(--stroke)'}`,
                          }}
                          aria-hidden="true"
                        >
                          {done ? <CheckCircle2 size={11} /> : n + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[var(--text)]">{lesson.sidebarLabel}</span>
                          <span className="block text-[11px] text-faint">{s.note}</span>
                        </span>
                        <span className="mono shrink-0 text-[9.5px]" style={{ color: accent }}>
                          M{lesson.module}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>

              {books.length > 0 ? (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] tracking-[0.1em] text-faint uppercase">
                    <BookOpen size={11} /> Suggested resources
                  </div>
                  <ul className="space-y-1">
                    {books.map((b) => (
                      <li key={b!.id}>
                        <Link
                          to="/resources"
                          className="block truncate text-[11.8px] text-dim hover:text-[var(--cyan)]"
                        >
                          {b!.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setPath(selected ? null : p.id)}
                className={cn(
                  'focusable mt-1 rounded-xl px-3 py-2 text-[12.5px] font-bold transition-all hover:scale-[1.02]',
                  selected ? 'text-[var(--cyan)]' : 'text-dim hover:text-[var(--text)]',
                )}
                style={{
                  border: `1px solid ${selected ? 'color-mix(in srgb, var(--cyan) 45%, transparent)' : 'var(--stroke)'}`,
                  background: selected ? 'color-mix(in srgb, var(--cyan) 8%, transparent)' : 'transparent',
                }}
              >
                {selected ? '✓ Selected as your path' : 'Select this path'}
              </button>
            </article>
          );
        })}
      </div>

      <section className="glass mt-5 p-5">
        <h2 className="display mb-2 text-[14px] font-bold">Choosing between them</h2>
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-dim">
          {[
            'The Beginner path touches 9 lessons and skips the advanced material. It gets you from “what is a sample?” to a working mental model of a digital link.',
            'The Engineering path is the whole course: all 39 lessons, every simulation, all six quizzes. That is the one your prompt’s acceptance criteria describe.',
            'The Advanced path re-visits 16 lessons in the order that builds on each other — noise shaping, OFDM, image rejection, modern FEC — for someone who already has the fundamentals.',
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--cyan)' }} aria-hidden="true" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11.5px] text-faint">
          Paths overlap on purpose — several lessons appear in more than one, because the sequence is about review as
          much as first exposure. Every module is covered by the Engineering path.
        </p>
      </section>
    </div>
  );
}