/**
 * Shared domain types for SignalLab.
 *
 * Everything the curriculum, quizzes, resources and progress system agree on is
 * declared here so that content data files and UI components stay in sync.
 */

/* ------------------------------------------------------------- curriculum */

export type LessonId = string;
export type ModuleId = 1 | 2 | 3 | 4 | 5 | 6;

export interface ModuleMeta {
  id: ModuleId;
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  objectives: string[];
}

/** A formula entry in the reference library. */
export interface FormulaVar {
  symbol: string;
  meaning: string;
  unit: string;
}

export interface WorkedExample {
  question: string;
  steps: string[];
  answer: string;
}

export interface Formula {
  id: string;
  module: ModuleId;
  name: string;
  /** LaTeX source, rendered with KaTeX. */
  tex: string;
  /** Plain-text fallback, also used by the copy button. */
  plain: string;
  vars: FormulaVar[];
  assumptions: string;
  example?: WorkedExample;
  tags: string[];
  relatedLessons: LessonId[];
}

/** A glossary definition shared by lessons and the glossary page. */
export interface GlossaryEntry {
  term: string;
  definition: string;
  synonyms: string;
  module: ModuleId;
}

export interface WorkedExampleBlock {
  title: string;
  given: string[];
  steps: string[];
  answer: string;
}

export interface Misconception {
  myth: string;
  truth: string;
}

/**
 * Rich-text mini markup used throughout lesson content:
 *   **bold**  `code`  $latex$  [[glossary term]]
 */
export interface LessonSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: { kind: 'note' | 'info' | 'limit'; title: string; body: string };
}

/** Declarative parameter controls consumed by a visualisation scene. */
export type ControlSpec =
  | {
      kind: 'range';
      id: string;
      label: string;
      min: number;
      max: number;
      step: number;
      value: number;
      unit?: string;
      hint?: string;
      format?: (v: number) => string;
      wide?: boolean;
    }
  | {
      kind: 'toggle';
      id: string;
      label: string;
      value: boolean;
      hint?: string;
    }
  | {
      kind: 'select';
      id: string;
      label: string;
      options: { value: string; label: string }[];
      value: string;
      hint?: string;
      wide?: boolean;
    }
  | {
      kind: 'text';
      id: string;
      label: string;
      value: string;
      placeholder?: string;
      hint?: string;
      wide?: boolean;
    };

export type ControlValues = Record<string, number | boolean | string>;

export interface Readout {
  key: string;
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad' | 'info' | 'limit';
}

export interface StatusBanner {
  tone: 'ok' | 'warn' | 'bad' | 'info' | 'limit';
  text: string;
}

export interface FurtherReadingItem {
  title: string;
  detail: string;
  why: string;
  href?: string;
  kind: 'read' | 'watch' | 'simulate' | 'practice' | 'advanced';
}

export interface Lesson {
  id: LessonId;
  module: ModuleId;
  index: number;
  title: string;
  sidebarLabel: string;
  minutes: number;
  summary: string;
  objectives: string[];
  sections: LessonSection[];
  keyTerms: string[];
  formulaIds: string[];
  worked: WorkedExampleBlock;
  applications: string[];
  misconceptions: Misconception[];
  conclusion: string;
  related: LessonId[];
  vizId: VizId;
  /** Optional overrides applied to a visualisation's default control values. */
  vizInitial?: ControlValues;
  furtherReading: FurtherReadingItem[];
  keywords: string[];
}

/* ----------------------------------------------------------------- quizzes */

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  /** Inline LaTeX allowed via $...$ in the prompt. */
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  /** Optional note about the misconception the wrong options encode. */
  misconception?: string;
  skill: 'definition' | 'calculation' | 'concept';
}

export interface ModuleQuiz {
  module: ModuleId;
  questions: QuizQuestion[];
}

export interface QuizResult {
  best: number;
  attempts: number;
  lastScore: number;
  lastAnswers: (string | null)[];
  at: number;
}

/* --------------------------------------------------------------- resources */

export type ResourceType =
  | 'book'
  | 'notes'
  | 'video'
  | 'simulation'
  | 'standard'
  | 'practice'
  | 'tool'
  | 'project';

export type ResourceFormat = 'read' | 'watch' | 'practice' | 'simulate' | 'reference';
export type ResourceDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type AccessLevel = 'free' | 'account' | 'paid' | 'institutional';

export interface Resource {
  id: string;
  title: string;
  author: string;
  type: ResourceType;
  difficulty: ResourceDifficulty;
  format: ResourceFormat;
  modules: ModuleId[];
  topics: string[];
  description: string;
  access: AccessLevel;
  /** Verified destination. `verified: 'direct'` means it points at a specific
   *  page; `'root'` means it is an official entry point whose search terms are
   *  listed in `verificationNote`. */
  verified: 'direct' | 'root';
  verificationNote: string;
  href: string;
}

/* -------------------------------------------------------------------- paths */

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  outcome: string;
  steps: { lesson: LessonId; note: string }[];
  resourceIds: string[];
}

/* ---------------------------------------------------------------- exercises */

export interface ExerciseStep {
  text: string;
  formula?: string;
}

export interface Exercise {
  id: string;
  module: ModuleId;
  title: string;
  question: string;
  given: string[];
  unit: string;
  /** Tolerance used by the checker, in the same unit as `answer`. */
  tolerance: number;
  answer: number;
  steps: ExerciseStep[];
  formulaIds: string[];
  lesson: LessonId;
  resourceIds: string[];
}

/* ------------------------------------------------------------------ progress */

export interface LessonProgress {
  done: boolean;
  at: number;
}

export interface ResourceProgress {
  bookmarked: boolean;
  completed: boolean;
  at: number;
}

export interface ExerciseProgress {
  solved: boolean;
  attempts: number;
  at: number;
}

export interface ActivityEntry {
  at: number;
  lesson: string;
}

export interface Preferences {
  theme: 'dark' | 'light';
  katex: boolean;
  motion: boolean;
  animateWhileHidden: boolean;
}

export interface ProgressState {
  v: number;
  lessons: Record<LessonId, LessonProgress>;
  quizzes: Record<string, QuizResult>;
  resources: Record<string, ResourceProgress>;
  exercises: Record<string, ExerciseProgress>;
  prefs: Preferences;
  /** Per-simulation control snapshots, so a lab reopens where you left it. */
  viz: Record<string, ControlValues>;
  path: string | null;
  lastLesson: LessonId | null;
  recent: ActivityEntry[];
}

/* --------------------------------------------------------- visualisation */

export type VizId =
  | 'digital-vs-analog'
  | 'sampling'
  | 'sample-hold'
  | 'snr-ber'
  | 'pulse-modulation'
  | 'pcm-chain'
  | 'quantizer'
  | 'companding'
  | 'pcm-codec'
  | 'dpcm'
  | 'delta-modulation'
  | 'sigma-delta'
  | 'bit-constellation'
  | 'mod-waveforms'
  | 'qam'
  | 'bit-comparison'
  | 'modems'
  | 'ofdm'
  | 'spread-spectrum'
  | 'am-lab'
  | 'fm-lab'
  | 'spectrum'
  | 'receiver'
  | 'mod-compare'
  | 'noise-lab'
  | 'transmission-errors'
  | 'parity-lab'
  | 'crc-lab'
  | 'hamming-lab'
  | 'arq-sim'
  | 'advanced-coding'
  | 'interleaving';

export interface VizPanelSpec {
  title: string;
  description: string;
}

/** A plot region rendered inside a scene. */
export interface PlotSpec {
  id: string;
  title: string;
  xLabel: string;
  yLabel: string;
  xUnit: string;
  yUnit: string;
  xDomain: [number, number];
  yDomain: [number, number];
  height?: number;
  /** Interactive axes: click/drag reports a data x-value. */
  interactiveX?: boolean;
  interactiveY?: boolean;
}

export interface SceneApi {
  canvas: HTMLCanvasElement;
  plot: (id: string) => PlotHandle;
  values: ControlValues;
  /** Signal the scene's own discrete time base has changed. */
  onValuesChange: () => void;
}

export interface PlotHandle {
  ctx: CanvasRenderingContext2D;
  box: { x: number; y: number; w: number; h: number };
  /** Map data coordinates to canvas pixels. */
  X: (v: number) => number;
  Y: (v: number) => number;
  colors: ThemeColors;
  width: number;
  height: number;
  xDomain: [number, number];
  yDomain: [number, number];
  pushLegend: (entry: LegendEntry) => void;
}

export interface LegendEntry {
  label: string;
  color: string;
  dash?: number[];
  marker?: 'circle' | 'square' | 'diamond' | 'cross' | 'none';
}

export interface ThemeColors {
  cyan: string;
  mag: string;
  gold: string;
  green: string;
  violet: string;
  orange: string;
  red: string;
  blue: string;
  gray: string;
  grid: string;
  axis: string;
  text: string;
  textDim: string;
  surface: string;
}