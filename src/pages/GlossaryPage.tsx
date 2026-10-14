import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { glossary } from '@/data/glossary';
import { moduleAccentHex, modules } from '@/data/modules';
import { Segmented } from '@/components/ui/Controls';
import { EmptyState } from '@/components/ui/Controls';
import type { ModuleId } from '@/types';

export default function GlossaryPage() {
  const [q, setQ] = useState('');
  const [mod, setMod] = useState<'all' | ModuleId>('all');

  const entries = useMemo(() => {
    const query = q.trim().toLowerCase();
    return glossary
      .filter((g) => (mod === 'all' ? true : g.module === mod))
      .filter((g) =>
        query ? `${g.term} ${g.definition} ${g.synonyms}`.toLowerCase().includes(query) : true,
      )
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [q, mod]);

  return (
    <div>
      <header className="mb-5">
        <div className="mono mb-1 text-[11px] tracking-[0.18em] text-[var(--cyan)] uppercase">Reference</div>
        <h1 className="display text-3xl font-bold">Technical Glossary</h1>
        <p className="mt-2 max-w-3xl text-[14px] text-dim">
          Every underlined term in the lessons reads from this list. Hover, focus or tap a term inside a lesson to see its
          definition without leaving the page.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-faint)]" aria-hidden="true" />
          <label htmlFor="gl-search" className="sr-only">
            Search glossary
          </label>
          <input
            id="gl-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms and definitions…"
            className="focusable w-full rounded-xl border bord bg-[var(--panel)] py-2.5 pr-3 pl-9 text-[13px] outline-none placeholder:text-[var(--text-faint)]"
          />
        </div>
        <Segmented
          ariaLabel="Filter glossary by module"
          value={mod}
          onChange={setMod}
          options={[{ value: 'all' as const, label: 'All' }, ...modules.map((m) => ({ value: m.id as ModuleId, label: `M${m.id}` }))]}
        />
      </div>

      <p className="mono mb-4 text-[11.5px] text-faint">
        {entries.length} of {glossary.length} terms
      </p>

      {entries.length === 0 ? (
        <EmptyState title="No terms match that search" hint="Try “aliasing”, “companding”, “interleaving” or “image”." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((g) => (
            <article key={g.term} className="glass glass-hover p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="display text-[13.5px] font-bold" style={{ color: moduleAccentHex[g.module] }}>
                  {g.term}
                </h2>
                <span className="mono shrink-0 rounded-full border px-1.5 py-0.5 text-[9.5px] text-faint" style={{ borderColor: 'var(--stroke)' }}>
                  M{g.module}
                </span>
              </div>
              <p className="mt-1.5 text-[12.6px] leading-relaxed text-dim">{g.definition}</p>
              {g.synonyms ? <p className="mono mt-1.5 text-[10.5px] text-faint">{g.synonyms}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}