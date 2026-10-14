import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Trophy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { quizMap } from '@/data/quizzes';
import { moduleAccentHex } from '@/data/modules';
import { useProgress } from '@/hooks/useProgress';
import { RichText } from '@/components/ui/RichText';
import { ProgressBar } from '@/components/ui/Controls';
import { cn } from '@/lib/cn';
import type { ModuleId } from '@/types';

/**
 * Module checkpoint quiz.
 *
 * Scoring rules:
 *  - a question is answered exactly once per attempt; changing your pick after
 *    submitting is not possible, which is what stops a repeated submission from
 *    inflating the score;
 *  - only the *last* attempt is stored, but the best score across all attempts
 *    is retained, so retaking can only improve or maintain your record;
 *  - the stored answer list is what the dashboard's skill review reads.
 */
export function ModuleQuiz({ module }: { module: ModuleId }) {
  const quiz = quizMap.get(module);
  const { recordQuiz, quizResult } = useProgress();
  const saved = quizResult(module);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const accent = moduleAccentHex[module];
  const question = quiz?.questions[idx];

  // A fresh attempt starts whenever the module quiz is entered.
  const resetAttempt = () => {
    setIdx(0);
    setPicked(null);
    setLocked(false);
    setAnswers([]);
    setFinished(false);
    setScore(0);
  };

  useEffect(() => {
    resetAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const revealSolution = useMemo(() => (id: string) => quiz?.questions.find((q) => q.id === id), [quiz]);

  if (!quiz) return null;

  const submit = () => {
    if (!picked || locked) return;
    setLocked(true);
    const isRight = picked === question!.correctOptionId;
    if (isRight) setScore((s) => s + 1);
    setAnswers((a) => {
      const next = [...a];
      next[idx] = picked;
      return next;
    });
  };

  const next = () => {
    if (idx + 1 < quiz.questions.length) {
      setIdx((i) => i + 1);
      setPicked(null);
      setLocked(false);
    } else {
      const finalScore = score;
      setFinished(true);
      recordQuiz(module, finalScore, answers);
    }
  };

  /* ------------------------------------------------------------ results */
  if (finished) {
    const pct = (score / quiz.questions.length) * 100;
    const isBest = saved ? score >= saved.best : true;
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-5 sm:p-6"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-5">
          <div>
            <div
              className="display text-5xl leading-none font-bold"
              style={{ color: score === 3 ? 'var(--green)' : score >= 2 ? 'var(--gold)' : 'var(--red)' }}
            >
              {score}/{quiz.questions.length}
            </div>
            <div className="mt-1 text-[12px] text-dim">
              {score === 3
                ? 'Full marks on this checkpoint.'
                : score >= 2
                  ? 'Passed. Review the missed item below.'
                  : 'Below the pass mark. The explanations below are the fastest way back up.'}
            </div>
            <div className="mt-3 w-48">
              <ProgressBar value={pct} accent={score === 3 ? 'var(--green)' : score >= 2 ? 'var(--gold)' : 'var(--red)'} height={7} />
            </div>
          </div>

          <div className="min-w-[220px] flex-1">
            <div className="mb-2 flex items-center gap-2 text-[12px]">
              <Trophy size={14} style={{ color: 'var(--gold)' }} aria-hidden="true" />
              <span className="text-dim">
                Best score: <span className="mono" style={{ color: 'var(--gold)' }}>{saved?.best ?? score}/3</span>
                {saved && saved.attempts > 1 ? <span className="text-faint"> across {saved.attempts} attempts</span> : null}
              </span>
            </div>
            <p className="text-[12.3px] leading-relaxed text-faint">
              {isBest && score > 0
                ? 'That is a new personal best on this checkpoint.'
                : 'Retrying can only raise your best score; your best is kept across attempts.'}
            </p>
            <button
              type="button"
              onClick={resetAttempt}
              className="focusable mt-3 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold text-dim hover:text-[var(--text)]"
              style={{ borderColor: 'var(--stroke)' }}
            >
              <RotateCcw size={13} /> Retake this checkpoint
            </button>
          </div>
        </div>

        <ol className="mt-5 space-y-2.5">
          {quiz.questions.map((q, i) => {
            const given = answers[i];
            const right = given === q.correctOptionId;
            return (
              <li
                key={q.id}
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: right ? 'color-mix(in srgb, var(--green) 35%, transparent)' : 'color-mix(in srgb, var(--red) 35%, transparent)',
                  background: right ? 'color-mix(in srgb, var(--green) 5%, transparent)' : 'color-mix(in srgb, var(--red) 5%, transparent)',
                }}
              >
                <div className="flex items-start gap-2">
                  {right ? (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--green)' }} aria-hidden="true" />
                  ) : (
                    <X size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--red)' }} aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed font-medium">
                      <span className="mono mr-1.5 text-[11px] text-faint">Q{i + 1}</span>
                      <RichText text={q.prompt} />
                    </p>
                    {!right ? (
                      <p className="mt-1 text-[12.3px]" style={{ color: 'var(--green)' }}>
                        Correct answer: {q.options.find((o) => o.id === q.correctOptionId)?.text}
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </motion.section>
    );
  }

  /* ------------------------------------------------------------ question */
  return (
    <section className="glass p-5 sm:p-6" aria-labelledby="quiz-heading">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 id="quiz-heading" className="display text-[15px] font-bold">
          Module {module} checkpoint
        </h2>
        <span className="mono text-[11.5px] text-faint">
          Question {idx + 1} of {quiz.questions.length}
        </span>
        <div className="ml-auto flex gap-1.5" aria-hidden="true">
          {quiz.questions.map((q, i) => {
            const a = answers[i];
            const answered = a !== undefined && a !== null;
            return (
              <span
                key={q.id}
                className="h-2 w-2 rounded-full"
                style={{
                  background: !answered
                    ? i === idx
                      ? accent
                      : 'var(--stroke)'
                    : a === q.correctOptionId
                      ? 'var(--green)'
                      : 'var(--red)',
                }}
              />
            );
          })}
        </div>
        {saved && saved.attempts > 0 ? (
          <span className="mono text-[11px] text-faint">
            best {saved.best}/3 · {saved.attempts} attempt{saved.attempts === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      <div className="mb-4 h-0.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--stroke)' }}>
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${((idx + (locked ? 1 : 0)) / quiz.questions.length) * 100}%`, background: accent }}
        />
      </div>

      {question ? (
        <>
          <p className="mb-4 text-[14.5px] leading-relaxed font-medium">
            <RichText text={question.prompt} />
          </p>

          <div className="space-y-2" role="radiogroup" aria-label="Answer options">
            {question.options.map((o) => {
              const isPicked = picked === o.id;
              const isCorrect = o.id === question.correctOptionId;
              const showRight = locked && isCorrect;
              const showWrong = locked && isPicked && !isCorrect;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={isPicked}
                  disabled={locked}
                  onClick={() => setPicked(o.id)}
                  className={cn(
                    'focusable flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13.4px] leading-relaxed transition-colors',
                    locked && 'cursor-default opacity-100',
                    !locked && 'hover:border-[var(--cyan)]',
                    showRight && 'border-[var(--green)]',
                    showWrong && 'border-[var(--red)]',
                    isPicked && !locked && 'border-[var(--cyan)]',
                  )}
                  style={{
                    borderColor: showRight
                      ? 'color-mix(in srgb, var(--green) 55%, transparent)'
                      : showWrong
                        ? 'color-mix(in srgb, var(--red) 55%, transparent)'
                        : isPicked
                          ? 'color-mix(in srgb, var(--cyan) 55%, transparent)'
                          : 'var(--stroke)',
                    background: showRight
                      ? 'color-mix(in srgb, var(--green) 9%, transparent)'
                      : showWrong
                        ? 'color-mix(in srgb, var(--red) 9%, transparent)'
                        : 'var(--panel)',
                    opacity: locked && !isPicked && !isCorrect ? 0.5 : 1,
                  }}
                >
                  <span
                    className="mono mt-px grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-bold"
                    style={{
                      background: showRight
                        ? 'color-mix(in srgb, var(--green) 22%, transparent)'
                        : showWrong
                          ? 'color-mix(in srgb, var(--red) 22%, transparent)'
                          : 'var(--panel-strong)',
                      color: showRight ? 'var(--green)' : showWrong ? 'var(--red)' : 'var(--text-dim)',
                      border: '1px solid var(--stroke)',
                    }}
                    aria-hidden="true"
                  >
                    {o.id.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <RichText text={o.text} />
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {locked && picked ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-xl border px-4 py-3.5"
                style={{
                  borderColor: picked === question.correctOptionId
                    ? 'color-mix(in srgb, var(--green) 35%, transparent)'
                    : 'color-mix(in srgb, var(--red) 35%, transparent)',
                  background: picked === question.correctOptionId
                    ? 'color-mix(in srgb, var(--green) 6%, transparent)'
                    : 'color-mix(in srgb, var(--red) 6%, transparent)',
                }}
              >
                <div
                  className="display mb-1.5 text-[12px] tracking-[0.1em] uppercase"
                  style={{ color: picked === question.correctOptionId ? 'var(--green)' : 'var(--red)' }}
                >
                  {picked === question.correctOptionId ? 'Correct' : 'Not quite'}
                </div>
                <div className="text-[13px] leading-relaxed text-dim">
                  <RichText text={question.explanation} />
                  {revealSolution(question.id)?.misconception ? (
                    <p className="mt-2 rounded-lg px-3 py-2 text-[12.3px]" style={{ background: 'var(--panel)' }}>
                      <strong style={{ color: 'var(--gold)' }}>Common confusion:</strong>{' '}
                      {revealSolution(question.id)?.misconception}
                    </p>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-4 flex items-center gap-2.5">
            {!locked ? (
              <button
                type="button"
                onClick={submit}
                disabled={!picked}
                className="focusable rounded-lg px-4 py-2.5 text-[12.5px] font-bold text-[var(--cyan)] disabled:opacity-40"
                style={{ border: '1px solid color-mix(in srgb, var(--cyan) 45%, transparent)' }}
              >
                Submit answer
              </button>
            ) : (
              <button
                type="button"
                onClick={next}
                className="focusable rounded-lg px-4 py-2.5 text-[12.5px] font-bold text-[var(--cyan)]"
                style={{ border: '1px solid color-mix(in srgb, var(--cyan) 45%, transparent)' }}
              >
                {idx + 1 < quiz.questions.length ? 'Next question →' : 'See results'}
              </button>
            )}
            <span className="text-[11.5px] text-faint">One submission per question — answers cannot be changed afterwards.</span>
          </div>
        </>
      ) : null}
    </section>
  );
}