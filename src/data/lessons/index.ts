import type { Lesson, LessonId } from '@/types';
import { module1Lessons } from './module1';
import { module2Lessons } from './module2';
import { module3Lessons } from './module3';
import { module4Lessons } from './module4';
import { module5Lessons } from './module5';
import { module6Lessons } from './module6';

/** All 39 lessons, in curriculum order. */
export const lessons: Lesson[] = [
  ...module1Lessons,
  ...module2Lessons,
  ...module3Lessons,
  ...module4Lessons,
  ...module5Lessons,
  ...module6Lessons,
];

export const lessonMap = new Map<LessonId, Lesson>(lessons.map((l) => [l.id, l]));

export const lessonIds: LessonId[] = lessons.map((l) => l.id);

export const lessonsForModule = (module: number): Lesson[] => lessons.filter((l) => l.module === module);

export const getLesson = (id: LessonId | undefined): Lesson | undefined =>
  id ? lessonMap.get(id) : undefined;

/** Flat list of lesson ids per module, used for progress arithmetic. */
export const moduleLessonIds = (module: number): LessonId[] =>
  lessons.filter((l) => l.module === module).map((l) => l.id);

/** Next / previous lesson within the whole course, wrapping at the ends. */
export const adjacentLessons = (id: LessonId): { prev?: Lesson; next?: Lesson } => {
  const i = lessons.findIndex((l) => l.id === id);
  if (i < 0) return {};
  return {
    prev: i > 0 ? lessons[i - 1] : undefined,
    next: i < lessons.length - 1 ? lessons[i + 1] : undefined,
  };
};

/** Search across lesson titles, summaries, keywords and section text. */
export function searchLessons(query: string): Lesson[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return lessons.filter((l) => {
    const haystack = [
      l.title,
      l.sidebarLabel,
      l.summary,
      l.keywords.join(' '),
      l.objectives.join(' '),
      l.sections.map((s) => `${s.heading ?? ''} ${(s.paragraphs ?? []).join(' ')} ${(s.bullets ?? []).join(' ')}`).join(' '),
    ]
      .join(' ')
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}