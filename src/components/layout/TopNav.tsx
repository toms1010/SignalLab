import { useState } from 'react';
import { Menu, Moon, Search, Sun, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { lessonIds, searchLessons } from '@/data/lessons';
import { useProgress, useTheme } from '@/hooks/useProgress';
import { cn } from '@/lib/cn';

export interface TopNavProps {
  title: string;
  subtitle: string;
  onOpenMenu: () => void;
}

export function TopNav({ title, subtitle, onOpenMenu }: TopNavProps) {
  const { theme, toggle } = useTheme();
  const { overallPercent, completedCount } = useProgress();
  const navigate = useNavigate();
  const totalLessons = lessonIds.length;

  return (
    <header
      className="sticky top-0 z-20 border-b bord-soft no-print"
      style={{ background: 'color-mix(in srgb, var(--bg) 78%, transparent)', backdropFilter: 'blur(14px)' }}
    >
      <div className="mx-auto flex h-[62px] max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          className="focusable rounded-lg border bord p-2 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold sm:text-sm">{title}</div>
          <div className="hidden truncate text-[10.5px] text-faint sm:block">{subtitle}</div>
        </div>

        <SearchBox onPick={(id) => navigate(`/lesson/${id}`)} />

        <div className="hidden items-center gap-2 md:flex" title={`${completedCount} of ${totalLessons} lessons complete`}>
          <div className="h-2 w-28 overflow-hidden rounded-full" style={{ background: 'var(--stroke)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${overallPercent}%`, background: 'linear-gradient(90deg, var(--cyan), var(--magenta))' }}
            />
          </div>
          <span className="mono text-[11px] text-dim">{overallPercent}%</span>
        </div>

        <button
          type="button"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="focusable grid h-9 w-9 place-items-center rounded-full border bord transition-transform hover:scale-110"
          style={{ color: theme === 'dark' ? 'var(--gold)' : 'var(--cyan)' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}

/** Compact lesson search that only appears from `sm` upwards. */
function SearchBox({ onPick }: { onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const results = q.trim() ? searchLessons(q).slice(0, 6) : [];

  return (
    <div className="relative hidden sm:block">
      {open ? (
        <div className="flex items-center gap-2 rounded-full border bord px-3 py-1.5" style={{ background: 'var(--panel)' }}>
          <Search size={13} className="text-[var(--text-faint)]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lessons…"
            aria-label="Search lessons"
            className="w-36 bg-transparent text-[12.5px] outline-none placeholder:text-[var(--text-faint)]"
          />
          <button type="button" onClick={() => { setOpen(false); setQ(''); }} aria-label="Close search" className="text-[var(--text-faint)] hover:text-[var(--text)]">
            <X size={13} />
          </button>
          {results.length > 0 ? (
            <ul className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border bord bg-[var(--panel-solid)] shadow-lg">
              {results.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(l.id);
                      setOpen(false);
                      setQ('');
                    }}
                    className="block w-full px-3 py-2 text-left text-[12.5px] text-dim hover:bg-[var(--panel)] hover:text-[var(--text)]"
                  >
                    {l.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn('focusable grid h-9 w-9 place-items-center rounded-full border bord text-dim hover:text-[var(--cyan)]')}
          aria-label="Open lesson search"
        >
          <Search size={16} />
        </button>
      )}
    </div>
  );
}
