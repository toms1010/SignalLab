import { describe, expect, it } from 'vitest';
import { sanitize, defaultState, storageSizeBytes, completedLessonCount, overallPercent } from '@/lib/storage';
import { lessons, lessonIds, getLesson, searchLessons, adjacentLessons } from '@/data/lessons';
import { modules } from '@/data/modules';
import { formulas, formulaMap } from '@/data/formulas';
import { glossary } from '@/data/glossary';
import { quizzes } from '@/data/quizzes';
import { resources } from '@/data/resources';
import { exercises, learningPaths } from '@/data/paths';
import { moduleAccentHex } from '@/data/modules';
import { VISUALIZATIONS } from '@/components/visualizations/registry';
import type { VizId } from '@/types';


describe('storage sanitisation', () => {
  it('returns defaults for null, undefined and non-objects', () => {
    for (const bad of [null, undefined, 42, 'nope', [1, 2, 3]]) {
      const s = sanitize(bad);
      expect(s).toEqual(defaultState());
    }
  });

  it('repairs partial or malformed stored data instead of throwing', () => {
    const s = sanitize({
      v: 'wrong',
      lessons: { good: { done: true, at: 5 }, bad: 'nope', worse: { done: 'yes' } },
      quizzes: { '1': { best: 99, attempts: -4, lastScore: 'x', lastAnswers: ['a', 3] } },
      prefs: { theme: 'purple', katex: 'yes' },
      path: 123,
      lastLesson: 5,
      recent: [{ at: 1, lesson: 'm1-sampling' }, { nope: true }],
      unknownKey: 'ignored',
    });
    expect(s.v).toBe(1);
    expect(s.lessons.good).toEqual({ done: true, at: 5 });
    expect(s.lessons.bad).toBeUndefined();
    expect(s.lessons.worse).toEqual({ done: false, at: 0 });
    // best is clamped to 0..3, attempts cannot be negative.
    expect(s.quizzes['1']!.best).toBe(3);
    expect(s.quizzes['1']!.attempts).toBe(0);
    expect(s.quizzes['1']!.lastAnswers).toEqual(['a', null]);
    // invalid theme falls back, non-boolean katex falls back
    expect(s.prefs.theme).toBe('dark');
    expect(s.prefs.katex).toBe(true);
    expect(s.path).toBeNull();
    expect(s.lastLesson).toBeNull();
    expect(s.recent).toEqual([{ at: 1, lesson: 'm1-sampling' }]);
  });

  it('survives a localStorage getter that throws', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage disabled');
      },
    });
    try {
      // Must degrade gracefully rather than throw into the render tree.
      expect(() => storageSizeBytes()).not.toThrow();
      expect(storageSizeBytes()).toBe(0);
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
    }
  });
});

describe('progress arithmetic', () => {
  it('computes completion from real lesson ids', () => {
    expect(overallPercent(defaultState(), lessonIds)).toBe(0);
    const s = defaultState();
    s.lessons[lessonIds[0]!] = { done: true, at: 0 };
    expect(completedLessonCount(s, lessonIds)).toBe(1);
    expect(overallPercent(s, lessonIds)).toBe(Math.round((1 / lessonIds.length) * 100));
  });
});

describe('curriculum integrity', () => {
  it('defines six modules', () => {
    expect(modules).toHaveLength(6);
    expect(modules.map((m) => m.id)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const m of modules) {
      expect(moduleAccentHex[m.id]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(m.objectives.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('defines every lesson referenced by the sidebar and dashboard', () => {
    expect(lessons.length).toBe(39);
    expect(new Set(lessonIds).size).toBe(lessons.length);
    for (const l of lessons) {
      expect(l.id).toMatch(/^m[1-6]-/);
      expect(l.objectives.length).toBeGreaterThanOrEqual(3);
      expect(l.sections.length).toBeGreaterThanOrEqual(3);
      expect(l.applications.length).toBeGreaterThanOrEqual(2);
      expect(l.misconceptions.length).toBeGreaterThanOrEqual(2);
      expect(l.furtherReading.length).toBeGreaterThanOrEqual(3);
      expect(l.keyTerms.length).toBeGreaterThanOrEqual(3);
      expect(l.vizId).toBeTruthy();
    }
  });

  it('assigns lesson indices contiguously within each module', () => {
    for (const m of modules) {
      const list = lessons.filter((l) => l.module === m.id);
      expect(list.map((l) => l.index)).toEqual(list.map((_, i) => i + 1));
    }
  });

  it('resolves every related-lesson and formula reference', () => {
    for (const l of lessons) {
      for (const r of l.related) expect(getLesson(r), `${l.id} → ${r}`).toBeDefined();
      for (const f of l.formulaIds) expect(formulaMap.has(f), `${l.id} → ${f}`).toBe(true);
    }
  });

  it('names a glossary term for every key term used', () => {
    const terms = new Set(glossary.map((g) => g.term));
    for (const l of lessons) {
      for (const t of l.keyTerms) expect(terms.has(t), `${l.id} key term "${t}"`).toBe(true);
    }
  });

  it('links only valid lessons from the adjacent-lesson helper', () => {
    for (const l of lessons) {
      const { prev, next } = adjacentLessons(l.id);
      if (prev) expect(prev.module).toBeLessThanOrEqual(l.module);
      if (next) expect(next.module).toBeGreaterThanOrEqual(l.module);
    }
    expect(adjacentLessons(lessonIds[0]!).prev).toBeUndefined();
    expect(adjacentLessons(lessonIds.at(-1)!).next).toBeUndefined();
  });

  it('finds lessons by keyword and by title', () => {
    expect(searchLessons('aliasing').length).toBeGreaterThan(0);
    expect(searchLessons('nyquist').length).toBeGreaterThan(0);
    expect(searchLessons('zzzz-not-a-topic')).toHaveLength(0);
    expect(searchLessons('')).toHaveLength(0);
  });
});

describe('formula library', () => {
  it('has unique ids and complete metadata', () => {
    expect(new Set(formulas.map((f) => f.id)).size).toBe(formulas.length);
    for (const f of formulas) {
      expect(f.name.length).toBeGreaterThan(0);
      expect(f.tex.length).toBeGreaterThan(0);
      expect(f.plain.length).toBeGreaterThan(0);
      expect(f.assumptions.length).toBeGreaterThan(20);
      expect(f.vars.length).toBeGreaterThan(0);
      for (const v of f.vars) {
        expect(v.symbol.length).toBeGreaterThan(0);
        expect(v.unit.length).toBeGreaterThan(0);
      }
    }
  });

  it('covers all six modules', () => {
    for (const m of [1, 2, 3, 4, 5, 6]) {
      expect(formulas.filter((f) => f.module === m).length).toBeGreaterThan(0);
    }
  });

  it('links every formula to a real lesson', () => {
    for (const f of formulas) {
      for (const id of f.relatedLessons) expect(getLesson(id), `${f.id} → ${id}`).toBeDefined();
    }
  });
});

describe('quizzes', () => {
  it('has three questions per module with one valid correct answer', () => {
    expect(quizzes).toHaveLength(6);
    for (const q of quizzes) {
      expect(q.questions).toHaveLength(3);
      for (const question of q.questions) {
        expect(question.options).toHaveLength(4);
        expect(new Set(question.options.map((o) => o.id)).size).toBe(4);
        expect(question.options.some((o) => o.id === question.correctOptionId)).toBe(true);
        expect(question.explanation.length).toBeGreaterThan(40);
        expect(['definition', 'calculation', 'concept']).toContain(question.skill);
      }
      expect(new Set(q.questions.map((x) => x.id)).size).toBe(3);
    }
  });

  it('mixes at least one calculation and one concept question per module', () => {
    for (const q of quizzes) {
      expect(q.questions.some((x) => x.skill === 'calculation')).toBe(true);
      expect(q.questions.some((x) => x.skill === 'concept')).toBe(true);
    }
  });
});

describe('resources', () => {
  it('has unique ids, absolute-or-internal hrefs and honest access labels', () => {
    expect(new Set(resources.map((r) => r.id)).size).toBe(resources.length);
    for (const r of resources) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.author.length).toBeGreaterThan(0);
      expect(r.description.length).toBeGreaterThan(40);
      expect(r.modules.length).toBeGreaterThan(0);
      for (const m of r.modules) expect([1, 2, 3, 4, 5, 6]).toContain(m);
      expect(r.href.startsWith('https://') || r.href.startsWith('/')).toBe(true);
      expect(r.verificationNote.length).toBeGreaterThan(20);
    }
  });

  it('covers every module', () => {
    for (const m of [1, 2, 3, 4, 5, 6]) {
      expect(resources.filter((r) => r.modules.includes(m as never)).length).toBeGreaterThan(0);
    }
  });
});

describe('exercises and learning paths', () => {
  it('gives every exercise a tolerance, steps and a valid lesson link', () => {
    expect(exercises).toHaveLength(10);
    for (const e of exercises) {
      expect(e.tolerance).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(e.answer)).toBe(true);
      expect(e.steps.length).toBeGreaterThanOrEqual(3);
      expect(e.given.length).toBeGreaterThan(0);
      expect(getLesson(e.lesson), e.id).toBeDefined();
      for (const f of e.formulaIds) expect(formulaMap.has(f)).toBe(true);
    }
  });

  it('covers every module across the exercise set', () => {
    const covered = new Set(exercises.map((e) => e.module));
    for (const m of [1, 2, 3, 4, 5, 6]) expect(covered.has(m as never)).toBe(true);
  });

  it('defines three learning paths pointing only at real lessons', () => {
    expect(learningPaths).toHaveLength(3);
    for (const p of learningPaths) {
      expect(p.steps.length).toBeGreaterThan(0);
      for (const s of p.steps) expect(getLesson(s.lesson), `${p.id} → ${s.lesson}`).toBeDefined();
      for (const r of p.resourceIds) expect(resources.some((x) => x.id === r)).toBe(true);
    }
    // The engineering path must cover all six modules.
    const eng = learningPaths.find((p) => p.id === 'path-engineering')!;
    const modulesCovered = new Set(eng.steps.map((s) => getLesson(s.lesson)!.module));
    expect(modulesCovered.size).toBe(6);
  });
});
describe('visualization registry', () => {
  it('gives every lesson a scene that exists, with usable defaults', () => {
    for (const l of lessons) {
      const entry = VISUALIZATIONS[l.vizId as keyof typeof VISUALIZATIONS];
      expect(entry, `${l.id} → ${l.vizId}`).toBeDefined();
      expect(typeof entry.scene).toBe('function');
      expect(entry.hint.length).toBeGreaterThan(10);
      expect(entry.defaults).toBeTypeOf('object');
    }
  });

  it('accepts the vizInitial values supplied by each lesson', () => {
    // The starter control values in the data must be renderable by the scene.
    for (const l of lessons) {
      if (!l.vizInitial) continue;
      const entry = VISUALIZATIONS[l.vizId as keyof typeof VISUALIZATIONS]!;
      for (const [key, value] of Object.entries(l.vizInitial)) {
        const expected = (entry.defaults as Record<string, unknown>)[key];
        expect(expected, `${l.id} control "${key}"`).toBeDefined();
        // Same primitive kind on both sides, or the slider would break.
        expect(typeof value, `${l.id} control "${key}" type`).toBe(typeof expected);
      }
    }
  });

  it('registers no dead scenes', () => {
    const used = new Set(lessons.map((l) => l.vizId));
    const orphans = Object.keys(VISUALIZATIONS).filter((id) => !used.has(id as VizId));
    expect(orphans, 'scenes no lesson or module references').toEqual([]);
  });
});
