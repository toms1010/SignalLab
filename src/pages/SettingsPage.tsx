import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, Download, HardDrive, RotateCcw, Trash2, Upload } from 'lucide-react';
import { modules } from '@/data/modules';
import { lessonIds, lessonsForModule } from '@/data/lessons';
import { lessons } from '@/data/lessons';
import { useProgress } from '@/hooks/useProgress';
import { ProgressBar, Segmented, Toggle } from '@/components/ui/Controls';
import { storageSizeBytes, STORAGE_KEY } from '@/lib/storage';
import { cn } from '@/lib/cn';
import type { ProgressState } from '@/types';

export default function SettingsPage() {
  const {
    state,
    prefs,
    setPref,
    modulePercent,
    moduleCompleted,
    quizResult,
    resetLessons,
    resetResources,
    resetExercises,
    resetAll,
  } = useProgress();
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signallab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as ProgressState;
        if (!parsed || typeof parsed !== 'object') throw new Error('Not an object');
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        setImportMsg('Progress imported. Reload the page to apply it.');
      } catch {
        setImportMsg('That file is not valid SignalLab progress data.');
      }
    };
    reader.readAsText(file);
  };

  const quizRows = modules.map((m) => {
    const res = quizResult(m.id);
    return { m, res, pct: res ? (res.best / 3) * 100 : 0 };
  });

  return (
    <div>
      <header className="mb-5">
        <div className="mono mb-1 text-[11px] tracking-[0.18em] text-[var(--cyan)] uppercase">Manage</div>
        <h1 className="display text-3xl font-bold">Progress &amp; Settings</h1>
        <p className="mt-2 max-w-3xl text-[14px] text-dim">
          Everything SignalLab remembers lives in this browser's <code>localStorage</code> under the single key{' '}
          <span className="mono text-[12px] text-[var(--cyan)]">{STORAGE_KEY}</span>. Nothing is uploaded, and no
          personal data is stored.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass min-w-0 p-5">
          <h2 className="display mb-3 text-[14px] font-bold">Completion breakdown</h2>
          <div className="sl-scroll overflow-x-auto rounded-xl border bord-soft">
            <table className="w-full min-w-[420px] border-collapse text-[12.5px]">
              <thead>
                <tr>
                  {['Module', 'Lessons', 'Done', 'Quiz best', 'Progress'].map((h) => (
                    <th key={h} className="border-b px-3 py-2 text-left text-[10.5px] tracking-[0.1em] text-faint uppercase" style={{ borderColor: 'var(--stroke)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => {
                  const pct = modulePercent(m.id);
                  const res = quizResult(m.id);
                  return (
                    <tr key={m.id}>
                      <td className="border-b px-3 py-2">
                        <Link to={`/module/${m.id}`} className="hover:text-[var(--cyan)]">
                          {m.id}. {m.shortTitle}
                        </Link>
                      </td>
                      <td className="mono border-b px-3 py-2 text-dim">{lessonsForModule(m.id).length}</td>
                      <td className="mono border-b px-3 py-2 text-dim">{moduleCompleted(m.id)}</td>
                      <td className="mono border-b px-3 py-2">
                        {res ? (
                          <span style={{ color: res.best === 3 ? 'var(--green)' : res.best >= 2 ? 'var(--gold)' : 'var(--red)' }}>
                            {res.best}/3
                          </span>
                        ) : (
                          <span className="text-faint">—</span>
                        )}
                      </td>
                      <td className="border-b px-3 py-2">
                        <div className="w-24">
                          <ProgressBar value={pct} accent={pct === 100 ? 'var(--green)' : 'var(--cyan)'} height={5} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2.5 text-[11.5px] text-faint">
            {lessons.length} lessons across 6 modules · {lessons.reduce((n, l) => n + l.minutes, 0)} minutes of material
            in total.
          </p>
        </section>

        <section className="glass min-w-0 p-5">
          <h2 className="display mb-3 text-[14px] font-bold">Preferences</h2>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-dim">Theme</span>
              <Segmented
                ariaLabel="Theme"
                value={prefs.theme}
                onChange={(v) => setPref('theme', v)}
                options={[
                  { value: 'dark' as const, label: 'Dark' },
                  { value: 'light' as const, label: 'Light' },
                ]}
              />
            </div>

            <Toggle
              label="Render formulas with KaTeX"
              on={prefs.katex}
              onChange={(v) => setPref('katex', v)}
              hint="Off shows plain-text mathematics instead — useful on very low-power devices."
            />
            <Toggle
              label="Animate interface transitions"
              on={prefs.motion}
              onChange={(v) => setPref('motion', v)}
              hint="Lab animations keep running either way; this controls page transitions."
            />
            <Toggle
              label="Keep waveforms animating in hidden tabs"
              on={prefs.animateWhileHidden}
              onChange={(v) => setPref('animateWhileHidden', v)}
              hint="Off (recommended) pauses canvas loops when the tab is not visible, saving battery."
            />
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-faint">
            SignalLab also respects your operating system's “reduce motion” setting automatically: when it is on, no
            particle field, marquee or looping animation is rendered, and plots are drawn as a single static frame.
          </p>
        </section>

        <section className="glass min-w-0 p-5">
          <h2 className="display mb-3 text-[14px] font-bold">Quiz performance</h2>
          <ul className="space-y-2">
            {quizRows.map(({ m, res, pct }) => (
              <li key={m.id}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-dim">Module {m.id} — {m.shortTitle}</span>
                  <span className="mono text-faint">
                    {res ? `${res.best}/3 · ${res.attempts} attempt${res.attempts === 1 ? '' : 's'}` : 'not attempted'}
                  </span>
                </div>
                <ProgressBar value={pct} accent={m.accent} height={5} />
              </li>
            ))}
          </ul>
        </section>

        <section className="glass min-w-0 p-5">
          <h2 className="display mb-3 flex items-center gap-2 text-[14px] font-bold">
            <Database size={15} style={{ color: 'var(--cyan)' }} /> Stored data
          </h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
            {[
              ['Storage key', STORAGE_KEY],
              ['Approx. size', `${storageSizeBytes()} bytes`],
              ['Lessons tracked', `${Object.keys(state.lessons).length} / ${lessonIds.length}`],
              ['Quizzes recorded', String(Object.keys(state.quizzes).length)],
              ['Resource entries', String(Object.keys(state.resources).length)],
              ['Exercises recorded', String(Object.keys(state.exercises).length)],
              ['Saved viz presets', String(Object.keys(state.viz).length)],
              ['Learning path', state.path ?? 'none selected'],
            ].map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-faint">{k}</dt>
                <dd className="mono m-0 truncate text-dim">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={exportJson} className="focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] text-dim hover:text-[var(--text)]" style={{ borderColor: 'var(--stroke)' }}>
              <Download size={12} /> Export JSON
            </button>
            <label className="focusable flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] text-dim hover:text-[var(--text)]" style={{ borderColor: 'var(--stroke)' }}>
              <Upload size={12} /> Import JSON
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importJson(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {importMsg ? <p className="mt-2 text-[11.5px] text-[var(--cyan)]">{importMsg}</p> : null}
        </section>
      </div>

      <section className="glass mt-4 p-5">
        <h2 className="display mb-2 flex items-center gap-2 text-[14px] font-bold">
          <Trash2 size={15} style={{ color: 'var(--red)' }} /> Reset
        </h2>
        <p className="mb-3 text-[12.5px] leading-relaxed text-dim">
          Each button removes a specific slice of local data and nothing else. External links, lesson content and every
          simulation stay exactly as they are.
        </p>
        <ul className="mb-4 space-y-1.5 text-[12.3px] leading-relaxed text-dim">
          <li>
            <strong className="text-[var(--text)]">Lesson &amp; quiz progress</strong> — completion flags, quiz scores
            and attempts, last-visited lesson and recent activity.
          </li>
          <li>
            <strong className="text-[var(--text)]">Resources</strong> — bookmarks, completed-resource marks and the
            selected learning path.
          </li>
          <li>
            <strong className="text-[var(--text)]">Exercises</strong> — solved flags and attempt counts.
          </li>
          <li>
            <strong className="text-[var(--text)]">Everything</strong> — all of the above plus preferences and saved
            simulation control values.
          </li>
        </ul>

        <div className="flex flex-wrap gap-2">
          <ResetButton label="Reset lesson & quiz progress" onClick={() => confirmThen(resetLessons, 'Clear lesson completion and quiz scores?')} />
          <ResetButton label="Reset resources & path" onClick={() => confirmThen(resetResources, 'Clear bookmarks and the selected path?')} />
          <ResetButton label="Reset exercises" onClick={() => confirmThen(resetExercises, 'Clear all exercise results?')} />
          <ResetButton
            label="Reset everything"
            danger
            onClick={() =>
              confirmThen(() => {
                resetAll();
              }, 'Delete ALL SignalLab data on this device? This cannot be undone.')
            }
          />
        </div>
      </section>
    </div>
  );
}

function confirmThen(fn: () => void, message: string) {
  if (window.confirm(message)) fn();
}

function ResetButton({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focusable flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors',
        danger ? 'text-[var(--red)]' : 'text-dim hover:text-[var(--text)]',
      )}
      style={{ borderColor: danger ? 'color-mix(in srgb, var(--red) 45%, transparent)' : 'var(--stroke)' }}
    >
      {danger ? <HardDrive size={13} /> : <RotateCcw size={13} />}
      {label}
    </button>
  );
}