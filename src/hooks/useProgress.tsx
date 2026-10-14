import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { loadState, saveState, clearState, STORAGE_KEY } from '@/lib/storage';
import { lessonIds, lessonMap } from '@/data/lessons';
import type { ControlValues, LessonId, Preferences, ProgressState, QuizResult } from '@/types';
import type { ModuleId } from '@/types';

/* ------------------------------------------------------------------ theme */

interface ThemeCtx {
  theme: 'dark' | 'light';
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <Providers>');
  return ctx;
}

/* ------------------------------------------------------------------ toast */

export interface Toast {
  id: number;
  message: string;
  tone: 'ok' | 'err' | 'warn' | 'info';
}

interface ToastCtx {
  toasts: Toast[];
  push: (message: string, tone?: Toast['tone']) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <Providers>');
  return ctx;
}

/* --------------------------------------------------------------- progress */

interface ProgressApi {
  state: ProgressState;
  prefs: Preferences;

  /* lessons */
  isLessonDone: (id: LessonId) => boolean;
  toggleLesson: (id: LessonId) => void;
  markLesson: (id: LessonId, done: boolean) => void;
  completedCount: number;
  overallPercent: number;
  modulePercent: (module: number) => number;
  moduleCompleted: (module: number) => number;

  /* quizzes */
  quizResult: (module: number) => QuizResult | undefined;
  recordQuiz: (module: number, score: number, answers: (string | null)[]) => void;
  averageQuizPercent: number;

  /* resources */
  resourceState: (id: string) => { bookmarked: boolean; completed: boolean };
  toggleBookmark: (id: string) => void;
  toggleResourceDone: (id: string) => void;
  bookmarkedCount: number;
  completedResourceCount: number;

  /* exercises */
  exerciseState: (id: string) => { solved: boolean; attempts: number };
  recordExercise: (id: string, solved: boolean) => void;
  solvedExercises: number;

  /* misc */
  lastLesson: LessonId | null;
  setLastLesson: (id: LessonId) => void;
  recent: { at: number; lesson: LessonId }[];

  /* viz prefs */
  vizValues: (key: string, defaults: ControlValues) => ControlValues;
  setVizValues: (key: string, values: ControlValues) => void;

  /* path + settings */
  path: string | null;
  setPath: (id: string | null) => void;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  resetLessons: () => void;
  resetResources: () => void;
  resetExercises: () => void;
  resetAll: () => void;
  storageOk: boolean;
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <Providers>');
  return ctx;
}

/* ---------------------------------------------------------------- provider */

export function Providers({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadState());
  const [storageOk, setStorageOk] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  /* Keep the DOM theme attribute in sync with stored preference. */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.prefs.theme);
  }, [state.prefs.theme]);

  /* Flush to localStorage whenever state changes. */
  useEffect(() => {
    const result = saveState(state);
    if (!result.ok) setStorageOk(false);
  }, [state, storageOk]);

  const push = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  const api = useMemo<ProgressApi>(() => {
    const mutate = (fn: (draft: ProgressState) => ProgressState) => setState((prev) => fn(prev));

    const completed = lessonIds.filter((id) => state.lessons[id]?.done);
    const total = lessonIds.length;

    const noteRecent = (draft: ProgressState, id: LessonId): ProgressState => {
      const without = draft.recent.filter((r) => r.lesson !== id);
      return { ...draft, recent: [{ at: Date.now(), lesson: id }, ...without].slice(0, 12) };
    };

    const moduleLessonCount = (m: number) => lessonIds.filter((id) => lessonMap.get(id)?.module === m).length;
    const moduleLessonDone = (m: number) =>
      lessonIds.filter((id) => lessonMap.get(id)?.module === m && state.lessons[id]?.done).length;

    return {
      state,
      storageOk,
      prefs: state.prefs,

      isLessonDone: (id) => state.lessons[id]?.done === true,

      markLesson: (id, done) =>
        mutate((d) => {
          const lessons = { ...d.lessons };
          if (done) lessons[id] = { done: true, at: Date.now() };
          else delete lessons[id];
          return noteRecent({ ...d, lessons }, id);
        }),

      toggleLesson: (id) =>
        mutate((d) => {
          const lessons = { ...d.lessons };
          if (lessons[id]?.done) delete lessons[id];
          else lessons[id] = { done: true, at: Date.now() };
          return noteRecent({ ...d, lessons }, id);
        }),

      completedCount: completed.length,
      overallPercent: total === 0 ? 0 : Math.round((completed.length / total) * 100),
      moduleCompleted: (m) => moduleLessonDone(m),
      modulePercent: (m) => {
        const c = moduleLessonCount(m);
        return c === 0 ? 0 : Math.round((moduleLessonDone(m) / c) * 100);
      },

      quizResult: (module) => state.quizzes[String(module)],

      recordQuiz: (module, score, answers) =>
        mutate((d) => {
          const prev = d.quizzes[String(module)];
          const next: QuizResult = {
            best: Math.max(prev?.best ?? 0, score),
            attempts: (prev?.attempts ?? 0) + 1,
            lastScore: score,
            lastAnswers: answers,
            at: Date.now(),
          };
          return { ...d, quizzes: { ...d.quizzes, [String(module)]: next } };
        }),

      averageQuizPercent: (() => {
        const attempted = Object.values(state.quizzes).filter((q) => q.attempts > 0);
        if (attempted.length === 0) return 0;
        const sum = attempted.reduce((acc, q) => acc + (q.best / 3) * 100, 0);
        return Math.round(sum / attempted.length);
      })(),

      resourceState: (id) => ({
        bookmarked: state.resources[id]?.bookmarked === true,
        completed: state.resources[id]?.completed === true,
      }),

      toggleBookmark: (id) =>
        mutate((d) => {
          const cur = d.resources[id] ?? { bookmarked: false, completed: false, at: 0 };
          const next = { ...cur, bookmarked: !cur.bookmarked, at: Date.now() };
          return { ...d, resources: { ...d.resources, [id]: next } };
        }),

      toggleResourceDone: (id) =>
        mutate((d) => {
          const cur = d.resources[id] ?? { bookmarked: false, completed: false, at: 0 };
          const next = { ...cur, completed: !cur.completed, at: Date.now() };
          return { ...d, resources: { ...d.resources, [id]: next } };
        }),

      bookmarkedCount: Object.values(state.resources).filter((r) => r.bookmarked).length,
      completedResourceCount: Object.values(state.resources).filter((r) => r.completed).length,

      exerciseState: (id) => ({
        solved: state.exercises[id]?.solved === true,
        attempts: state.exercises[id]?.attempts ?? 0,
      }),

      recordExercise: (id, solved) =>
        mutate((d) => {
          const cur = d.exercises[id] ?? { solved: false, attempts: 0, at: 0 };
          return {
            ...d,
            exercises: {
              ...d.exercises,
              [id]: { solved: solved || cur.solved, attempts: cur.attempts + 1, at: Date.now() },
            },
          };
        }),

      solvedExercises: Object.values(state.exercises).filter((e) => e.solved).length,

      lastLesson: state.lastLesson,
      setLastLesson: (id) => mutate((d) => noteRecent({ ...d, lastLesson: id }, id)),
      recent: state.recent,

      vizValues: (key, defaults) => ({ ...defaults, ...(state.viz[key] ?? {}) }),
      setVizValues: (key, values) =>
        mutate((d) => ({ ...d, viz: { ...d.viz, [key]: values } })),

      path: state.path,
      setPath: (id) => mutate((d) => ({ ...d, path: id })),

      setPref: (key, value) => mutate((d) => ({ ...d, prefs: { ...d.prefs, [key]: value } })),

      resetLessons: () => mutate((d) => ({ ...d, lessons: {}, quizzes: {}, lastLesson: null, recent: [] })),
      resetResources: () => mutate((d) => ({ ...d, resources: {}, path: null })),
      resetExercises: () => mutate((d) => ({ ...d, exercises: {} })),

      resetAll: () => {
        clearState();
        setState(loadState());
        setStorageOk(true);
      },
    };
  }, [state, storageOk]);

  const themeValue = useMemo<ThemeCtx>(
    () => ({
      theme: state.prefs.theme,
      toggle: () => api.setPref('theme', state.prefs.theme === 'dark' ? 'light' : 'dark'),
    }),
    [api, state.prefs.theme],
  );

  const toastValue = useMemo<ToastCtx>(() => ({ toasts, push }), [toasts, push]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <ToastContext.Provider value={toastValue}>
        <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
}

export { STORAGE_KEY };
export type { ModuleId };