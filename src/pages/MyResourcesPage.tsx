import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, CheckCircle2, ExternalLink, Target } from 'lucide-react';
import { resources } from '@/data/resources';
import { exercises } from '@/data/paths';
import { ResourceCard } from '@/pages/ResourcesPage';
import { useProgress } from '@/hooks/useProgress';
import { ProgressBar } from '@/components/ui/Controls';
import { EmptyState } from '@/components/ui/Controls';
import { getLesson } from '@/data/lessons';

export default function MyResourcesPage() {
  const { state, resourceState, toggleBookmark, toggleResourceDone, exerciseState, solvedExercises, recordExercise } =
    useProgress();

  const bookmarked = useMemo(() => resources.filter((r) => resourceState(r.id).bookmarked), [resourceState]);
  const completed = useMemo(() => resources.filter((r) => resourceState(r.id).completed), [resourceState]);
  const open = useMemo(() => exercises.filter((e) => !exerciseState(e.id).solved), [exerciseState]);

  const completionPct = resources.length === 0 ? 0 : Math.round((completed.length / resources.length) * 100);

  return (
    <div>
      <header className="mb-5">
        <div className="mono mb-1 text-[11px] tracking-[0.18em] text-[var(--cyan)] uppercase">Learning Resources</div>
        <h1 className="display text-3xl font-bold">My Learning Resources</h1>
        <p className="mt-2 max-w-3xl text-[14px] text-dim">
          Your bookmarks, finished materials and unfinished exercises — read from this browser's local storage. Nothing
          here is synced to an account, because there is no account.
        </p>
      </header>

      <div className="glass mb-6 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="min-w-[180px] flex-1">
            <div className="mb-1.5 flex justify-between text-[12px]">
              <span className="text-dim">Resource completion</span>
              <span className="mono text-faint">
                {completed.length}/{resources.length}
              </span>
            </div>
            <ProgressBar value={completionPct} accent="var(--green)" height={7} />
          </div>
          <div className="flex gap-2">
            <Pill icon={<Bookmark size={13} />} label="Bookmarked" value={String(bookmarked.length)} tone="var(--gold)" />
            <Pill icon={<CheckCircle2 size={13} />} label="Completed" value={String(completed.length)} tone="var(--green)" />
            <Pill icon={<Target size={13} />} label="Exercises" value={`${solvedExercises}/${exercises.length}`} tone="var(--cyan)" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Bookmarked" count={bookmarked.length}>
          {bookmarked.length === 0 ? (
            <EmptyState
              title="No bookmarks yet"
              hint="Star any resource in the library to keep it here."
              action={
                <Link to="/resources" className="focusable rounded-lg border px-3 py-1.5 text-[12px] text-[var(--cyan)]" style={{ borderColor: 'color-mix(in srgb, var(--cyan) 40%, transparent)' }}>
                  Browse the library
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {bookmarked.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  bookmarked
                  completed={resourceState(r.id).completed}
                  onBookmark={() => toggleBookmark(r.id)}
                  onDone={() => toggleResourceDone(r.id)}
                />
              ))}
            </div>
          )}
        </Section>

        <Section title="Completed" count={completed.length}>
          {completed.length === 0 ? (
            <EmptyState title="Nothing marked complete yet" hint="Use “Mark done” on any resource card when you finish it." />
          ) : (
            <ul className="space-y-1.5">
              {completed.map((r) => (
                <li key={r.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[12.5px]">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--green)' }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[var(--text)]">{r.title}</span>
                    <span className="block text-[11.5px] text-faint">{r.author}</span>
                  </span>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="focusable shrink-0 rounded-md border p-1.5 text-[var(--cyan)]"
                    style={{ borderColor: 'var(--stroke)' }}
                    aria-label={`Open ${r.title}`}
                  >
                    <ExternalLink size={12} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <section className="glass mt-4 p-5">
        <h2 className="display mb-3 text-[14px] font-bold">Unfinished exercises</h2>
        {open.length === 0 ? (
          <p className="text-[13px] text-dim">
            All ten practical exercises are solved. You can still revisit any of them from the exercises page.
          </p>
        ) : (
          <ul className="space-y-2">
            {open.map((e) => {
              const lesson = getLesson(e.lesson);
              const st = exerciseState(e.id);
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl border bord-soft px-3 py-2.5" style={{ background: 'var(--panel)' }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium">{e.title}</div>
                    <div className="text-[11.5px] text-faint">
                      Module {e.module} · {st.attempts} attempt{st.attempts === 1 ? '' : 's'}
                      {lesson ? ` · pairs with “${lesson.sidebarLabel}”` : ''}
                    </div>
                  </div>
                  <Link
                    to="/exercises"
                    className="focusable rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold text-dim hover:text-[var(--text)]"
                    style={{ borderColor: 'var(--stroke)' }}
                  >
                    Solve
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 text-[11.5px] text-faint">
          Saved locally under a single key ({state.v ? 'schema v1' : 'default'}). Clearing site data in your browser
          removes all of it.
        </p>
      </section>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => open.forEach((e) => recordExercise(e.id, false))}
          className="focusable rounded-lg border px-3 py-1.5 text-[11.5px] text-faint hover:text-[var(--red)]"
          style={{ borderColor: 'var(--stroke)' }}
        >
          Mark unfinished exercises as unsolved
        </button>
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="glass p-5">
      <h2 className="display mb-3 flex items-center gap-2 text-[14px] font-bold">
        {title}
        <span className="mono ml-auto text-[11px] text-faint">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function Pill({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border bord-soft px-3 py-2" style={{ background: 'var(--panel)' }}>
      <div className="flex items-center gap-1 text-[10px] tracking-[0.1em] text-faint uppercase">
        <span style={{ color: tone }} aria-hidden="true">
          {icon}
        </span>
        {label}
      </div>
      <div className="mono mt-0.5 text-[16px] font-bold" style={{ color: tone }}>
        {value}
      </div>
    </div>
  );
}