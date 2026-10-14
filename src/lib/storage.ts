/**
 * Typed, defensive localStorage persistence.
 *
 * Requirements this module satisfies:
 *  - never throws when storage is unavailable (private mode, quota, disabled);
 *  - repairs malformed or outdated stored data instead of trusting it;
 *  - validates every field against the expected shape before use;
 *  - keeps a working copy in memory so the app still runs without storage.
 */

import type {
  ActivityEntry,
  ControlValues,
  ExerciseProgress,
  LessonId,
  LessonProgress,
  Preferences,
  ProgressState,
  QuizResult,
  ResourceProgress,
} from '@/types';

export const STORAGE_KEY = 'signallab.v1';
export const SCHEMA_VERSION = 1;

export const defaultPreferences: Preferences = {
  theme: 'dark',
  katex: true,
  motion: true,
  animateWhileHidden: false,
};

export function defaultState(): ProgressState {
  return {
    v: SCHEMA_VERSION,
    lessons: {},
    quizzes: {},
    resources: {},
    exercises: {},
    prefs: { ...defaultPreferences },
    viz: {},
    path: null,
    lastLesson: null,
    recent: [],
  };
}

/* --------------------------------------------------------------- guards */

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function repairRecord<T>(
  raw: unknown,
  validate: (value: unknown) => T | null,
): Record<string, T> {
  if (!isObject(raw)) return {};
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== 'string' || key.length > 120) continue;
    const v = validate(value);
    if (v !== null) out[key] = v;
  }
  return out;
}

const lessonValidator = (v: unknown): LessonProgress | null => {
  if (!isObject(v)) return null;
  return { done: v.done === true, at: isFiniteNumber(v.at) ? v.at : 0 };
};

const quizValidator = (v: unknown): QuizResult | null => {
  if (!isObject(v)) return null;
  const best = isFiniteNumber(v.best) ? Math.min(3, Math.max(0, Math.round(v.best))) : 0;
  return {
    best,
    attempts: isFiniteNumber(v.attempts) ? Math.max(0, Math.round(v.attempts)) : 0,
    lastScore: isFiniteNumber(v.lastScore) ? Math.min(3, Math.max(0, Math.round(v.lastScore))) : 0,
    lastAnswers: Array.isArray(v.lastAnswers)
      ? v.lastAnswers.slice(0, 20).map((a) => (typeof a === 'string' ? a : null))
      : [],
    at: isFiniteNumber(v.at) ? v.at : 0,
  };
};

const resourceValidator = (v: unknown): ResourceProgress | null => {
  if (!isObject(v)) return null;
  return {
    bookmarked: v.bookmarked === true,
    completed: v.completed === true,
    at: isFiniteNumber(v.at) ? v.at : 0,
  };
};

const exerciseValidator = (v: unknown): ExerciseProgress | null => {
  if (!isObject(v)) return null;
  return {
    solved: v.solved === true,
    attempts: isFiniteNumber(v.attempts) ? Math.max(0, Math.round(v.attempts)) : 0,
    at: isFiniteNumber(v.at) ? v.at : 0,
  };
};

const controlValidator = (v: unknown): ControlValues | null => {
  if (!isObject(v)) return null;
  const out: ControlValues = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val)) out[k] = val;
    else if (typeof val === 'boolean') out[k] = val;
    else if (typeof val === 'string' && val.length <= 512) out[k] = val;
  }
  return out;
};

const activityValidator = (v: unknown): ActivityEntry | null => {
  if (!isObject(v)) return null;
  if (!isFiniteNumber(v.at) || typeof v.lesson !== 'string') return null;
  return { at: v.at, lesson: v.lesson.slice(0, 120) };
};

/**
 * Coerce arbitrary parsed JSON into a valid ProgressState.
 * Anything unrecognised falls back to the default — never crashes.
 */
export function sanitize(raw: unknown): ProgressState {
  const base = defaultState();
  if (!isObject(raw)) return base;

  const prefs: Preferences = { ...base.prefs };
  if (isObject(raw.prefs)) {
    if (raw.prefs.theme === 'light' || raw.prefs.theme === 'dark') prefs.theme = raw.prefs.theme;
    if (typeof raw.prefs.katex === 'boolean') prefs.katex = raw.prefs.katex;
    if (typeof raw.prefs.motion === 'boolean') prefs.motion = raw.prefs.motion;
    if (typeof raw.prefs.animateWhileHidden === 'boolean') prefs.animateWhileHidden = raw.prefs.animateWhileHidden;
  }

  return {
    v: SCHEMA_VERSION,
    lessons: repairRecord<LessonProgress>(raw.lessons, lessonValidator),
    quizzes: repairRecord<QuizResult>(raw.quizzes, quizValidator),
    resources: repairRecord<ResourceProgress>(raw.resources, resourceValidator),
    exercises: repairRecord<ExerciseProgress>(raw.exercises, exerciseValidator),
    prefs,
    viz: repairRecord<ControlValues>(raw.viz, controlValidator),
    path: typeof raw.path === 'string' ? raw.path : null,
    lastLesson: typeof raw.lastLesson === 'string' ? raw.lastLesson : null,
    recent: Array.isArray(raw.recent)
      ? raw.recent
          .map((e) => activityValidator(e))
          .filter((e): e is ActivityEntry => e !== null)
          .slice(0, 30)
      : [],
  };
}

/* --------------------------------------------------------------- driver */

let memoryFallback: ProgressState | null = null;
let storageWorks: boolean | null = null;

function canUseStorage(): boolean {
  if (storageWorks !== null) return storageWorks;
  try {
    const probe = '__signallab_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    storageWorks = true;
  } catch {
    storageWorks = false;
  }
  return storageWorks;
}

export function loadState(): ProgressState {
  if (!canUseStorage()) {
    if (!memoryFallback) memoryFallback = defaultState();
    return memoryFallback;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state: ProgressState): { ok: boolean; error?: string } {
  memoryFallback = state;
  if (!canUseStorage()) {
    return { ok: false, error: 'Browser storage is unavailable — progress will be lost when this tab closes.' };
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not write to browser storage.' };
  }
}

export function clearState(): void {
  memoryFallback = defaultState();
  if (canUseStorage()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing further we can do */
    }
  }
}

export function storageSizeBytes(): number {
  try {
    return (window.localStorage.getItem(STORAGE_KEY) ?? '').length;
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------------ selectors */

export const isLessonDone = (s: ProgressState, id: LessonId): boolean => s.lessons[id]?.done === true;

export function completedLessonCount(s: ProgressState, all: readonly LessonId[]): number {
  return all.reduce((n, id) => n + (isLessonDone(s, id) ? 1 : 0), 0);
}

export function overallPercent(s: ProgressState, all: readonly LessonId[]): number {
  if (all.length === 0) return 0;
  return Math.round((completedLessonCount(s, all) / all.length) * 100);
}

export function bestQuizScore(s: ProgressState, moduleId: number | string): number | null {
  const q = s.quizzes[String(moduleId)];
  return q && q.attempts > 0 ? q.best : null;
}