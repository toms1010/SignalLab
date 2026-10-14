import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { formulas } from '@/data/formulas';
import { moduleAccentHex, modules } from '@/data/modules';
import { Formula, Segmented } from '@/components/ui/Controls';
import { Math } from '@/components/ui/Math';
import { EmptyState } from '@/components/ui/Controls';
import { cn } from '@/lib/cn';
import type { ModuleId } from '@/types';

export default function FormulaReferencePage() {
  const [q, setQ] = useState('');
  const [mod, setMod] = useState<'all' | ModuleId>('all');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return formulas.filter((f) => {
      if (mod !== 'all' && f.module !== mod) return false;
      if (!query) return true;
      const hay = [f.name, f.plain, f.assumptions, f.tags.join(' '), f.vars.map((v) => `${v.symbol} ${v.meaning} ${v.unit}`).join(' '), f.example?.question ?? '', f.example?.answer ?? '']
        .join(' ')
        .toLowerCase();
      return hay.includes(query);
    });
  }, [q, mod]);

  const grouped = useMemo(() => {
    const map = new Map<number, typeof filtered>();
    for (const f of filtered) {
      const list = map.get(f.module) ?? [];
      list.push(f);
      map.set(f.module, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div>
      <header className="mb-5">
        <div className="mono mb-1 text-[11px] tracking-[0.18em] text-[var(--cyan)] uppercase">Reference</div>
        <h1 className="display text-3xl font-bold">Formula Reference</h1>
        <p className="mt-2 max-w-3xl text-[14px] text-dim">
          Every formula used in SignalLab, with variable definitions, units, the assumptions it depends on, and a worked
          numerical example where one helps. Each card has a copy button that takes the plain-text form with you.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--text-faint)]" aria-hidden="true" />
          <label htmlFor="fx-search" className="sr-only">
            Search formulas
          </label>
          <input
            id="fx-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, symbol, unit or assumption…"
            className="focusable w-full rounded-xl border bord bg-[var(--panel)] py-2.5 pr-3 pl-9 text-[13px] outline-none placeholder:text-[var(--text-faint)]"
          />
        </div>
        <Segmented
          ariaLabel="Filter formulas by module"
          value={mod}
          onChange={setMod}
          options={[{ value: 'all' as const, label: 'All' }, ...modules.map((m) => ({ value: m.id as ModuleId, label: `M${m.id}` }))]}
        />
      </div>

      <p className="mono mb-4 text-[11.5px] text-faint">
        {filtered.length} of {formulas.length} formulas
      </p>

      {grouped.length === 0 ? (
        <EmptyState title="No formulas match that search" hint="Try a symbol such as “carson”, “Q(”, or a unit such as “baud”." />
      ) : (
        grouped.map(([moduleId, list]) => (
          <section key={moduleId} className="mb-7">
            <h2 className="display mb-3 flex items-center gap-2 text-[15px] font-bold">
              <span className="h-3 w-1 rounded-full" style={{ background: moduleAccentHex[moduleId] }} aria-hidden="true" />
              Module {moduleId} — {modules.find((m) => m.id === moduleId)?.shortTitle}
            </h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {list.map((f) => (
                <article key={f.id} className="glass p-4">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h3 className="display text-[13.5px] font-bold">{f.name}</h3>
                    <span className="mono shrink-0 text-[10px] text-faint">M{f.module}</span>
                  </div>

                  <Formula tex={f.tex} accent={moduleAccentHex[f.module]} plain={f.plain} />

                  <dl className="mt-3 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 text-[12px]">
                    {f.vars.map((v) => (
                      <div key={v.symbol} className="contents">
                        <dt className="mono text-[11.5px] break-all" style={{ color: 'var(--cyan)' }}>
                          {v.symbol}
                        </dt>
                        <dd className="m-0 min-w-0 break-words text-dim">
                          {v.meaning}
                          {v.unit ? <span className="text-faint"> — {v.unit}</span> : null}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-3 rounded-lg border-l-2 px-3 py-2 text-[12px] leading-relaxed text-dim"
                    style={{ borderColor: moduleAccentHex[f.module], background: 'var(--panel)' }}>
                    <strong className="block text-[11px] tracking-[0.08em] uppercase" style={{ color: moduleAccentHex[f.module] }}>
                      Assumptions
                    </strong>
                    {f.assumptions}
                  </p>

                  {f.example ? (
                    <div className="mt-2.5 rounded-lg px-3 py-2.5 text-[12.3px] leading-relaxed text-dim"
                      style={{ background: 'color-mix(in srgb, var(--green) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--green) 25%, transparent)' }}>
                      <p className="mb-1.5 font-medium" style={{ color: 'var(--green)' }}>
                        {f.example.question}
                      </p>
                      <ol className="m-0 list-decimal space-y-0.5 pl-4">
                        {f.example.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                      <p className="mt-1.5">
                        <strong>Answer:</strong> {f.example.answer}
                      </p>
                    </div>
                  ) : null}

                  {f.relatedLessons.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10.5px] tracking-[0.1em] text-faint uppercase">Used in</span>
                      {f.relatedLessons.map((lid) => (
                        <Link
                          key={lid}
                          to={`/lesson/${lid}`}
                          className={cn('rounded-full border px-2 py-0.5 text-[10.5px] text-dim transition-colors hover:text-[var(--cyan)]')}
                          style={{ borderColor: 'var(--stroke)' }}
                        >
                          {lid}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))
      )}

      <aside className="glass p-5">
        <h2 className="display mb-2 text-[14px] font-bold">A note on reading these formulas</h2>
        <p className="text-[13px] leading-relaxed text-dim">
          Almost every relationship here is an <em>approximation</em> that holds under stated conditions — a full-scale
          sine, additive white Gaussian noise, an ideal filter, a single tone. The <strong>Assumptions</strong> block on
          each card is not boilerplate: it is the part that tells you when the number stops being meaningful.
        </p>
        <div className="mt-3 grid gap-2 text-[12.5px] sm:grid-cols-3">
          {[
            { t: '6.02n dB', d: 'Dynamic range from level count — a range ratio, not an SNR.' },
            { t: '6.02n + 1.76 dB', d: 'SQNR, valid only for a full-scale sine through an ideal uniform quantiser.' },
            { t: 'Carson’s rule', d: 'An engineering estimate retaining ~98 % of power, not an exact bandwidth.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl border bord-soft px-3 py-2.5" style={{ background: 'var(--panel)' }}>
              <div className="mono text-[12px] font-bold" style={{ color: 'var(--gold)' }}>
                {x.t}
              </div>
              <div className="mt-0.5 text-[11.8px] leading-snug text-dim">{x.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Math tex="6.02 \\times 12 + 1.76 \\approx 72\\ \\mathrm{dB}" />
        </div>
      </aside>
    </div>
  );
}