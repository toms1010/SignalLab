import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import Background from '@/components/layout/Background';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNav } from '@/components/layout/TopNav';
import { useToast } from '@/hooks/useProgress';
import { moduleMap } from '@/data/modules';
import { getLesson, moduleLessonIds } from '@/data/lessons';
import type { ModuleId } from '@/types';

/**
 * Application shell: ambient background, collapsible sidebar, top bar and the
 * routed content area.
 *
 * Navigation closes the mobile drawer on every route change, and the drawer
 * itself is only mounted for small screens — there is no second copy of the
 * navigation in the DOM at desktop widths.
 */
export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const closeNav = useCallback(() => setNavOpen(false), []);

  const { title, subtitle } = usePageTitle(location.pathname);

  return (
    <div className="relative min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Background />

      {/*
        Sidebar and content are flex siblings. On small screens the sidebar is a
        fixed overlay (out of flow); from `lg` it becomes a static flex column.
        Keeping them in one flex row is what stops the content from being
        pushed below the navigation.
      */}
      <div className="relative z-10 flex min-h-screen">
        <Sidebar open={navOpen} onClose={closeNav} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav title={title} subtitle={subtitle} onOpenMenu={() => setNavOpen(true)} />

        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-16 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

            <footer className="mt-12 border-t bord-soft pt-5 text-center text-[11px] leading-relaxed text-faint">
              SignalLab — Interactive Digital &amp; Analog Communication Systems. All progress is stored locally in this browser.
              Nothing is uploaded, and every lesson works without an account.
            </footer>
          </main>
        </div>
      </div>

      <Toasts />
    </div>
  );
}

/** Derive the top-bar title from the route. */
function usePageTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname.startsWith('/lesson/')) {
    const id = pathname.replace('/lesson/', '');
    const lesson = getLesson(id);
    if (lesson) {
      const m = moduleMap.get(lesson.module);
      return {
        title: lesson.title,
        subtitle: `Module ${lesson.module} · ${m?.shortTitle ?? ''} · Lesson ${lesson.index} of ${moduleLessonIds(lesson.module).length}`,
      };
    }
  }
  if (pathname.startsWith('/module/')) {
    const id = Number(pathname.split('/')[2]);
    const m = moduleMap.get(id as ModuleId);
    if (m) return { title: m.title, subtitle: `Module ${m.id} of 6 · ${moduleLessonIds(m.id).length} lessons` };
  }
  if (pathname === '/') return { title: 'Course Dashboard', subtitle: 'Digital & Analog Communication Systems · Interactive Edition' };
  if (pathname === '/resources') return { title: 'Learning Resources', subtitle: 'Curated external material, filterable and bookmarkable' };
  if (pathname === '/my-resources') return { title: 'My Learning Resources', subtitle: 'Your bookmarks, completions and unfinished exercises' };
  if (pathname === '/paths') return { title: 'Guided Learning Paths', subtitle: 'Three ordered routes through the same lessons' };
  if (pathname === '/exercises') return { title: 'Practical Exercises', subtitle: 'Self-checked problems with worked solutions' };
  if (pathname === '/formulas') return { title: 'Formula Reference', subtitle: 'Every formula, with definitions, units and assumptions' };
  if (pathname === '/glossary') return { title: 'Technical Glossary', subtitle: 'Definitions behind every underlined term in the course' };
  if (pathname === '/settings') return { title: 'Progress & Settings', subtitle: 'Local storage, themes and reset controls' };
  return { title: 'Not found', subtitle: 'That route does not exist' };
}

/** Transient notification stack. */
function Toasts() {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  const icon = {
    ok: CheckCircle2,
    err: X,
    warn: TriangleAlert,
    info: Info,
  } as const;

  return (
    <div
      className="fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icon[t.tone];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="glass-solid flex items-start gap-2.5 px-3.5 py-2.5 text-[13px]"
              style={{ borderLeft: `3px solid var(--${t.tone === 'ok' ? 'green' : t.tone === 'err' ? 'red' : t.tone === 'warn' ? 'gold' : 'cyan'})` }}
            >
              <Icon
                size={16}
                className="mt-px shrink-0"
                style={{
                  color:
                    t.tone === 'ok'
                      ? 'var(--green)'
                      : t.tone === 'err'
                        ? 'var(--red)'
                        : t.tone === 'warn'
                          ? 'var(--gold)'
                          : 'var(--cyan)',
                }}
              />
              <span className="min-w-0">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}