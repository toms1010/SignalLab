import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, ExternalLink, Filter, Search, Star } from 'lucide-react';
import { resources } from '@/data/resources';
import { modules, moduleAccentHex } from '@/data/modules';
import { lessonsForModule } from '@/data/lessons';
import { useProgress } from '@/hooks/useProgress';
import { EmptyState } from '@/components/ui/Controls';
import { cn } from '@/lib/cn';
import type { ModuleId, Resource, ResourceDifficulty, ResourceFormat, ResourceType } from '@/types';

const TYPES: { value: ResourceType; label: string }[] = [
  { value: 'book', label: 'Textbooks' },
  { value: 'notes', label: 'Lecture notes' },
  { value: 'video', label: 'Video lectures' },
  { value: 'simulation', label: 'Simulations' },
  { value: 'standard', label: 'Standards' },
  { value: 'practice', label: 'Practice' },
  { value: 'tool', label: 'Tools & docs' },
  { value: 'project', label: 'Projects' },
];

const DIFFICULTIES: ResourceDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
const FORMATS: ResourceFormat[] = ['read', 'watch', 'practice', 'simulate', 'reference'];

const ACCESS_LABEL: Record<Resource['access'], string> = {
  free: 'Free',
  account: 'Free account',
  paid: 'Purchase required',
  institutional: 'Library / institutional',
};

export default function ResourcesPage() {
  const { resourceState, toggleBookmark, toggleResourceDone } = useProgress();
  const [q, setQ] = useState('');
  const [type, setType] = useState<ResourceType | 'all'>('all');
  const [diff, setDiff] = useState<ResourceDifficulty | 'all'>('all');
  const [format, setFormat] = useState<ResourceFormat | 'all'>('all');
  const [mod, setMod] = useState<ModuleId | 'all'>('all');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return resources.filter((r) => {
      if (type !== 'all' && r.type !== type) return false;
      if (diff !== 'all' && r.difficulty !== diff) return false;
      if (format !== 'all' && r.format !== format) return false;
      if (mod !== 'all' && !r.modules.includes(mod)) return false;
      if (!query) return true;
      const hay = `${r.title} ${r.author} ${r.description} ${r.topics.join(' ')}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, type, diff, format, mod]);

  const clear = () => {
    setQ('');
    setType('all');
    setDiff('all');
    setFormat('all');
    setMod('all');
  };

  return (
    <div>
      <header className="mb-5">
        <div className="mono mb-1 text-[11px] tracking-[0.18em] text-[var(--cyan)] uppercase">Learning Resources</div>
        <h1 className="display text-3xl font-bold">Resource Library</h1>
        <p className="mt-2 max-w-3xl text-[14px] text-dim">
          Supplementary material curated from official and long-established sources. Bookmarks and completion are saved on
          this device. <strong className="text-[var(--text)]">These links leave SignalLab</strong> — every lesson,
          formula and simulation here works without them.
        </p>
      </header>

      <div className="glass mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(min(220px,100%), 2fr)_repeat(4,minmax(min(130px,100%), 1fr))]">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-faint)]" aria-hidden="true" />
            <label htmlFor="res-q" className="sr-only">
              Search resources
            </label>
            <input
              id="res-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, author, keyword…"
              className="focusable w-full rounded-xl border bord bg-[var(--panel)] py-2.5 pr-3 pl-9 text-[13px] outline-none placeholder:text-[var(--text-faint)]"
            />
          </div>

          <Select id="res-type" label="Resource type" value={type} onChange={(v) => setType(v as ResourceType | 'all')}
            options={[{ value: 'all', label: 'All types' }, ...TYPES.map((t) => ({ value: t.value, label: t.label }))]} />

          <Select id="res-diff" label="Difficulty" value={diff} onChange={(v) => setDiff(v as ResourceDifficulty | 'all')}
            options={[{ value: 'all', label: 'Any level' }, ...DIFFICULTIES.map((d) => ({ value: d, label: d }))]} />

          <Select id="res-format" label="Format" value={format} onChange={(v) => setFormat(v as ResourceFormat | 'all')}
            options={[{ value: 'all', label: 'Any format' }, ...FORMATS.map((f) => ({ value: f, label: f[0]!.toUpperCase() + f.slice(1) }))]} />

          <Select id="res-mod" label="Module" value={String(mod)} onChange={(v) => setMod(v === 'all' ? 'all' : (Number(v) as ModuleId))}
            options={[{ value: 'all', label: 'All modules' }, ...modules.map((m) => ({ value: String(m.id), label: `Module ${m.id}` }))]} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="mono text-[11.5px] text-faint">
            {filtered.length} of {resources.length} resources
          </p>
          <button type="button" onClick={clear} className="focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] text-dim hover:text-[var(--cyan)]" style={{ borderColor: 'var(--stroke)' }}>
            <Filter size={12} /> Clear filters
          </button>
        </div>
      </div>

      {/* Per-module collections: guarantees every module has real entries. */}
      <section className="mb-6">
        <h2 className="display mb-3 text-[15px] font-bold">Browse by module</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((m: (typeof modules)[number]) => {
            const list = resources.filter((r) => r.modules.includes(m.id));
            const lessons = lessonsForModule(m.id);
            return (
              <article key={m.id} className="glass p-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-1 rounded-full" style={{ background: moduleAccentHex[m.id] }} aria-hidden="true" />
                  <h3 className="display text-[13px] font-bold">
                    Module {m.id} — {m.shortTitle}
                  </h3>
                </div>
                <p className="mt-1.5 text-[12.3px] leading-relaxed text-dim">
                  {list.length} curated resources covering {lessons.map((l) => l.sidebarLabel.toLowerCase()).slice(0, 4).join(', ')}
                  {lessons.length > 4 ? ' and more' : ''}.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMod(m.id)}
                    className="focusable rounded-lg border px-2.5 py-1 text-[11px] font-semibold text-dim transition-colors hover:text-[var(--text)]"
                    style={{ borderColor: 'var(--stroke)' }}
                  >
                    Filter to module
                  </button>
                  <Link
                    to={`/module/${m.id}`}
                    className="focusable rounded-lg border px-2.5 py-1 text-[11px] font-semibold text-dim transition-colors hover:text-[var(--text)]"
                    style={{ borderColor: 'var(--stroke)' }}
                  >
                    Open lessons
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <h2 className="display mb-3 text-[15px] font-bold">All resources</h2>
      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing matches those filters"
          hint="Try clearing the search box or choosing “All types”."
          action={
            <button type="button" onClick={clear} className="focusable rounded-lg border px-3 py-1.5 text-[12px] text-dim" style={{ borderColor: 'var(--stroke)' }}>
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const st = resourceState(r.id);
            return (
              <ResourceCard
                key={r.id}
                resource={r}
                bookmarked={st.bookmarked}
                completed={st.completed}
                onBookmark={() => toggleBookmark(r.id)}
                onDone={() => toggleResourceDone(r.id)}
              />
            );
          })}
        </div>
      )}

      <aside className="glass mt-6 p-5">
        <h2 className="display mb-2 flex items-center gap-2 text-[14px] font-bold">
          <BookOpen size={15} style={{ color: 'var(--cyan)' }} /> How to read these entries
        </h2>
        <ul className="space-y-1.5 text-[13px] leading-relaxed text-dim">
          <li>
            <strong className="text-[var(--text)]">Verified direct link</strong> — the URL opens a specific page whose
            content matches the description.
          </li>
          <li>
            <strong className="text-[var(--text)]">Official entry point</strong> — the URL is an organisation's homepage
            or catalogue. Each such card states exactly what to search for there, so nobody has to guess.
          </li>
          <li>
            <strong className="text-[var(--text)]">Purchase required</strong> — commercial books point at publisher
            catalogue pages, never at unauthorised copies. You need a copy, a library loan or institutional access.
          </li>
          <li>
            No resource here has a fabricated rating, review count or completion statistic. Where a figure would be
            unverifiable, it is simply not stated.
          </li>
        </ul>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ card */
export function ResourceCard({
  resource: r,
  bookmarked,
  completed,
  onBookmark,
  onDone,
}: {
  resource: Resource;
  bookmarked: boolean;
  completed: boolean;
  onBookmark: () => void;
  onDone: () => void;
}) {
  const accent = moduleAccentHex[r.modules[0] ?? 1];

  return (
    <article className="glass glass-hover flex flex-col gap-2.5 p-4">
      <div className="flex items-start gap-2.5">
        <span
          className="mono grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[10px] font-bold"
          style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent, border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)` }}
          aria-hidden="true"
        >
          {r.type.slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="display text-[13.2px] leading-snug font-bold">{r.title}</h3>
          <p className="mt-0.5 truncate text-[11.5px] text-faint">{r.author}</p>
        </div>
        <button
          type="button"
          onClick={onBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? `Remove bookmark from ${r.title}` : `Bookmark ${r.title}`}
          className={cn(
            'focusable grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors',
            bookmarked ? 'text-[var(--gold)]' : 'text-faint hover:text-[var(--gold)]',
          )}
          style={{ borderColor: bookmarked ? 'color-mix(in srgb, var(--gold) 45%, transparent)' : 'var(--stroke)' }}
        >
          <Star size={14} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <p className="text-[12.4px] leading-relaxed text-dim">{r.description}</p>

      <div className="flex flex-wrap gap-1.5">
        <span className="mono rounded-full border px-2 py-0.5 text-[10px] text-faint" style={{ borderColor: 'var(--stroke)' }}>
          {r.difficulty}
        </span>
        <span className="mono rounded-full border px-2 py-0.5 text-[10px] text-faint" style={{ borderColor: 'var(--stroke)' }}>
          {r.format}
        </span>
        <span
          className="mono rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            background: r.access === 'free' ? 'color-mix(in srgb, var(--green) 14%, transparent)' : 'color-mix(in srgb, var(--gold) 14%, transparent)',
            color: r.access === 'free' ? 'var(--green)' : 'var(--gold)',
          }}
        >
          {ACCESS_LABEL[r.access]}
        </span>
        {r.modules.map((m) => (
          <span key={m} className="mono rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `color-mix(in srgb, ${moduleAccentHex[m]} 12%, transparent)`, color: moduleAccentHex[m] }}>
            M{m}
          </span>
        ))}
      </div>

      <p className="text-[11.3px] leading-snug text-faint">{r.verificationNote}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {r.href.startsWith('/') ? (
          <Link to={r.href} className="focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--cyan)]" style={{ borderColor: 'color-mix(in srgb, var(--cyan) 40%, transparent)' }}>
            Open
          </Link>
        ) : (
          <a
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            className="focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--cyan)]"
            style={{ borderColor: 'color-mix(in srgb, var(--cyan) 40%, transparent)' }}
          >
            <ExternalLink size={12} /> Visit
          </a>
        )}
        <button
          type="button"
          onClick={onDone}
          aria-pressed={completed}
          className={cn(
            'focusable flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors',
            completed ? 'text-[var(--green)]' : 'text-faint hover:text-[var(--green)]',
          )}
          style={{ borderColor: completed ? 'color-mix(in srgb, var(--green) 45%, transparent)' : 'var(--stroke)' }}
        >
          <CheckCircle2 size={12} /> {completed ? 'Completed' : 'Mark done'}
        </button>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------- select */
function Select({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[10.5px] tracking-[0.1em] text-faint uppercase">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focusable w-full cursor-pointer rounded-xl border bord bg-[var(--panel)] px-2.5 py-2.5 text-[12.5px] outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}