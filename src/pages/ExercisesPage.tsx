import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lightbulb, RotateCcw, XCircle } from 'lucide-react';
import { exercises } from '@/data/paths';
import { modules, moduleAccentHex } from '@/data/modules';
import { getLesson } from '@/data/lessons';
import { formulaMap } from '@/data/formulas';
import { resources } from '@/data/resources';
import { useProgress } from '@/hooks/useProgress';
import { ProgressBar, Segmented } from '@/components/ui/Controls';
import { Math as MathTex } from '@/components/ui/Math';
import type { ModuleId } from '@/types';

export default function ExercisesPage() {
  const { exerciseState, recordExercise, solvedExercises } = useProgress();
  const [mod, setMod] = useState<'all' | ModuleId>('all');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const list = useMemo(() => (mod === 'all' ? exercises : exercises.filter((e) => e.module === mod)), [mod]);

  const check = (id: string, answer: number, tolerance: number) => {
    const raw = (answers[id] ?? '').trim();
    if (raw === '') return false;
    const value = Number(raw);
    // Absolute tolerance, with a relative fallback for very small answers.
    const allowed = Math.max(tolerance, Math.abs(answer) * 1e-4);
    return Number.isFinite(value) && Math.abs(value - answer) <= allowed;
  };

  return (
    <div>
      <header className="mb-5">
        <div className="mono mb-1 text-[11px] tracking-[0.18em] text-[var(--cyan)] uppercase">Learning Resources</div>
        <h1 className="display text-3xl font-bold">Practical Exercises &amp; Mini-Labs</h1>
        <p className="mt-2 max-w-3xl text-[14px] text-dim">
          Ten self-checked problems built from the same formulas as the lessons. Type an answer, compare it numerically
          within a stated tolerance, then read the full worked solution. Solved exercises are recorded on this device.
        </p>
      </header>

      <div className="glass mb-5 flex flex-wrap items-center gap-4 p-4">
        <Segmented
          ariaLabel="Filter exercises by module"
          value={mod}
          onChange={setMod}
          options={[{ value: 'all' as const, label: 'All' }, ...modules.map((m) => ({ value: m.id as ModuleId, label: `M${m.id}` }))]}
        />
        <div className="min-w-[180px] flex-1">
          <div className="mb-1.5 flex justify-between text-[11.5px]">
            <span className="text-dim">Solved</span>
            <span className="mono text-faint">
              {solvedExercises}/{exercises.length}
            </span>
          </div>
          <ProgressBar value={(solvedExercises / exercises.length) * 100} accent="var(--green)" height={6} />
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Clear every exercise result on this device?')) {
              exercises.forEach((e) => recordExercise(e.id, false));
              setAnswers({});
              setChecked({});
            }
          }}
          className="focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] text-faint hover:text-[var(--red)]"
          style={{ borderColor: 'var(--stroke)' }}
        >
          <RotateCcw size={12} /> Reset results
        </button>
      </div>

      <div className="space-y-4">
        {list.map((e) => {
          const st = exerciseState(e.id);
          const wasChecked = checked[e.id] ?? false;
          const correct = check(e.id, e.answer, e.tolerance);
          const lesson = getLesson(e.lesson);
          const accent = moduleAccentHex[e.module];
          const formula = e.formulaIds.map((id) => formulaMap.get(id)).filter(Boolean);

          return (
            <article key={e.id} className="glass p-5">
              <div className="mb-2 flex flex-wrap items-start gap-2.5">
                <span
                  className="mono grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold"
                  style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, border: `1px solid ${accent}44` }}
                  aria-hidden="true"
                >
                  {e.id.replace('ex-', '').toUpperCase()}
                </span>
                <h2 className="display min-w-0 flex-1 text-[15px] leading-snug font-bold">{e.title}</h2>
                {st.solved ? (
                  <span
                    className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: 'color-mix(in srgb, var(--green) 14%, transparent)', color: 'var(--green)' }}
                  >
                    <CheckCircle2 size={11} /> solved
                  </span>
                ) : null}
              </div>

              <p className="text-[13.4px] leading-relaxed text-dim">{e.question}</p>

              <pre className="mono mt-3 overflow-x-auto rounded-xl border px-3 py-2.5 text-[11.8px] leading-relaxed whitespace-pre-wrap" style={{ borderColor: 'var(--stroke)', background: 'var(--panel)', color: accent }}>
                {e.given.join('\n')}
              </pre>

              <div className="mt-3 flex flex-wrap items-end gap-2.5">
                <div className="min-w-[170px] flex-1">
                  <label htmlFor={`ans-${e.id}`} className="mb-1 block text-[10.5px] tracking-[0.1em] text-faint uppercase">
                    Your answer ({e.unit})
                  </label>
                  <input
                    id={`ans-${e.id}`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={answers[e.id] ?? ''}
                    onChange={(ev) => setAnswers((a) => ({ ...a, [e.id]: ev.target.value }))}
                    placeholder="type a number"
                    className="mono focusable w-full rounded-lg border bord bg-[var(--panel)] px-3 py-2.5 text-[13px] outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChecked((c) => ({ ...c, [e.id]: true }));
                    const ok = check(e.id, e.answer, e.tolerance);
                    recordExercise(e.id, ok);
                  }}
                  disabled={(answers[e.id] ?? '').trim() === ''}
                  className="focusable rounded-lg px-4 py-2.5 text-[12.5px] font-bold text-[var(--cyan)] disabled:opacity-40"
                  style={{ border: '1px solid color-mix(in srgb, var(--cyan) 45%, transparent)' }}
                >
                  Check answer
                </button>
              </div>

              {wasChecked ? (
                <div
                  className="mt-4 rounded-xl border px-4 py-3"
                  style={{
                    borderColor: correct ? 'color-mix(in srgb, var(--green) 40%, transparent)' : 'color-mix(in srgb, var(--red) 40%, transparent)',
                    background: correct ? 'color-mix(in srgb, var(--green) 6%, transparent)' : 'color-mix(in srgb, var(--red) 6%, transparent)',
                  }}
                  role="status"
                >
                  <div className="mb-2 flex items-center gap-2">
                    {correct ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
                    ) : (
                      <XCircle size={16} style={{ color: 'var(--red)' }} />
                    )}
                    <strong className="display text-[13px]" style={{ color: correct ? 'var(--green)' : 'var(--red)' }}>
                      {correct ? 'Correct' : `Not quite — the answer is ${formatAnswer(e.answer)} ${e.unit}`}
                    </strong>
                  </div>

                  <ol className="m-0 space-y-2.5 pl-1">
                    {e.steps.map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-dim">
                        <span
                          className="mono mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px]"
                          style={{ background: 'var(--panel)', border: '1px solid var(--stroke)' }}
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0">
                          {s.text}
                          {s.formula ? (
                            <span className="mono mt-1 block text-[11.5px] break-words" style={{ color: 'var(--magenta)' }}>
                              {s.formula}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {formula.length > 0 ? (
                    <div className="mt-3 rounded-lg p-3" style={{ background: 'var(--panel)' }}>
                      <div className="mb-1.5 text-[10.5px] tracking-[0.1em] text-faint uppercase">Governing formula</div>
                      {formula.map((f) => (
                        <div key={f!.id}>
                          <MathTex tex={f!.tex} display />
                          <p className="mt-1 text-[11.5px] leading-snug text-faint">{f!.assumptions}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {lesson ? (
                      <Link
                        to={`/lesson/${lesson.id}`}
                        className="focusable rounded-lg border px-2.5 py-1.5 text-[11.5px] text-dim hover:text-[var(--text)]"
                        style={{ borderColor: 'var(--stroke)' }}
                      >
                        Open lesson: {lesson.sidebarLabel}
                      </Link>
                    ) : null}
                    {e.resourceIds.map((rid) => {
                      const r = resources.find((x) => x.id === rid);
                      if (!r) return null;
                      return (
                        <Link
                          key={rid}
                          to="/resources"
                          className="focusable rounded-lg border px-2.5 py-1.5 text-[11.5px] text-dim hover:text-[var(--text)]"
                          style={{ borderColor: 'var(--stroke)' }}
                        >
                          Further reading: {r.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <aside className="glass mt-5 flex gap-3 p-5">
        <Lightbulb size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} aria-hidden="true" />
        <div className="min-w-0 text-[13px] leading-relaxed text-dim">
          <p>
            <strong className="text-[var(--text)]">On tolerance.</strong> Each exercise states a tolerance, and the
            checker also accepts a relative tolerance of 0.01 % so that large or small answers behave sensibly. Answers
            are compared as numbers, not strings — so <span className="mono">23.01</span>,{' '}
            <span className="mono">23.0</span> and <span className="mono">2.301e1</span> are the same answer.
          </p>
          <p className="mt-2">
            Worked solutions are always shown after you check, correct or not. Several of these problems are easier to
            <em> verify by hand</em> than by memory, and the step list is written to be read alongside a calculator.
          </p>
        </div>
      </aside>
    </div>
  );
}

function formatAnswer(v: number): string {
  if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.001 && v !== 0)) return v.toExponential(3);
  return String(Math.round(v * 1000) / 1000);
}
