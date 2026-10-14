import { useCallback, useEffect, useRef, useState } from 'react';

/** Subscribe to a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True when the user has asked the OS to reduce motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * True while the element is on screen.
 * Labs use this to pause their animation loops when scrolled out of view or
 * when the tab is hidden, so nothing renders in the background.
 */
export function useIsVisible<T extends HTMLElement>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onVisibility = useCallback(() => {
    if (document.hidden) setVisible(false);
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [onVisibility]);

  return [ref, visible];
}

/** Debounce a rapidly-changing value (search inputs, sliders that persist). */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

/** Close on Escape — used by the mobile drawer and modals. */
export function useEscape(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onEscape]);
}