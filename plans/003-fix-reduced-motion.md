# 003 — Fix reduced-motion: keep helpful transitions, drop only movement

- **Status**: TODO
- **Commit**: local
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 2 files (index.css, hooks/useMedia.ts), small

## Problem

The current `prefers-reduced-motion` implementation nukes ALL animations including helpful transitions (opacity, color), violating AUDIT.md: "Reduced motion means fewer and gentler animations, **not zero** — keep transitions that aid comprehension, remove position changes."

**Current code (src/index.css:500–509):**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Issues:**
1. `transition-duration: 0.001ms` removes ALL transitions including opacity fades, color changes, progress bar fills — these aid comprehension
2. `animation-duration: 0.001ms` kills keyframe animations (but Plan 001 removes decorative ones; `blinkdot` for live indicators should also be reduced, not killed)
3. No JS hook integration — components using Framer Motion don't respect reduced motion

**Missing:** `@media (hover: hover) and (pointer: fine)` guards on hover animations (AUDIT.md requirement)

## Target

```css
/* src/index.css — REPLACE lines 500–509 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    /* Drop position/scale/rotation animations, keep opacity/color */
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    transition-property: transform, opacity, color, background-color, border-color, box-shadow, width, height !important;
    scroll-behavior: auto !important;
  }
  
  /* Keep opacity/color transitions for comprehension */
  *,
  *::before,
  *::after {
    transition-duration: 0.001ms !important;
  }
  /* Allow opacity and color transitions to remain */
  [style*="opacity"], [style*="color"], [style*="background"], [style*="border"],
  .glass, .glass-hover, .switch, .term .tip,
  button, a, input, select, .focusable,
  [class*="transition-colors"], [class*="transition-opacity"] {
    transition-duration: 160ms !important;
    transition-property: opacity, color, background-color, border-color, box-shadow !important;
  }
}

/* Guard hover animations to pointer-fine devices only */
@media (hover: hover) and (pointer: fine) {
  .glass-hover:hover,
  .switch:hover::after,
  input[type='range']::-webkit-slider-thumb:hover,
  .bit-chip:hover,
  .focusable:hover,
  .segmented-button:hover,
  .nav-link:hover {
    /* hover transforms only on hover-capable devices */
  }
}

/* Disable hover transforms on touch */
@media (hover: none) {
  .glass-hover:hover { transform: none; }
  .switch:hover::after { transform: none; }
  input[type='range']::-webkit-slider-thumb:hover { transform: none; }
  .bit-chip:hover { transform: none; }
  .focusable:hover { transform: none; }
}
```

Wait — the CSS approach above is complex. Better approach per AUDIT.md: keep transitions on opacity/color, drop transform. Let me refine:

```css
/* src/index.css — REPLACE lines 500–509 with: */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    /* Disable transform/position animations, keep opacity/color */
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Re-enable ONLY opacity and color transitions for comprehension */
  *,
  *::before,
  *::after {
    transition-property: opacity, color, background-color, border-color, box-shadow, width, height !important;
    transition-duration: 160ms !important;
    transition-timing-function: ease-out !important;
  }
}

/* Hover animations only on pointer-fine devices */
@media (hover: hover) and (pointer: fine) {
  .glass-hover:hover,
  .switch:hover::after,
  input[type='range']::-webkit-slider-thumb:hover,
  .bit-chip:hover,
  [class*="hover:scale"],
  [class*="hover:translate"] {
    /* hover transforms allowed */
  }
}

@media (hover: none) {
  .glass-hover:hover { transform: none !important; }
  .switch:hover::after { transform: none !important; }
  input[type='range']::-webkit-slider-thumb:hover { transform: none !important; }
  .bit-chip:hover { transform: none !important; }
  [class*="hover:scale"] { transform: none !important; }
  [class*="hover:translate"] { transform: none !important; }
}
```

Actually, the cleanest approach per AUDIT.md example is:

```css
@media (prefers-reduced-motion: reduce) {
  .element { animation: fade 0.2s ease; } /* keep opacity/color, drop movement */
}
@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.05); }
}
```

So we should:
1. Change the blanket `transition-duration: 0.001ms` to only affect `transform` properties
2. Add hover guards
3. Update Framer Motion components to respect `usePrefersReducedMotion()`

## Repo conventions to follow

- `usePrefersReducedMotion()` hook exists at `src/hooks/useMedia.ts:21`
- Framer Motion components in `App.tsx`, `DashboardPage.tsx`, `ModulePage.tsx`, `LessonPage.tsx`, `ModuleQuiz.tsx` should branch on this hook
- CSS transitions already defined on specific properties (mostly)

## Steps

1. **Rewrite reduced-motion media query** in `src/index.css:500–509`:
   - Target only `transform` and `animation` (position changes), preserve `opacity`, `color`, `background-color`, `border-color`, `box-shadow`, `width`, `height` transitions
   - Add `@media (hover: hover) and (pointer: fine)` guard for hover transforms
   - Add `@media (hover: none)` to disable hover transforms on touch

2. **Update Framer Motion components** to respect reduced motion:
   - `src/app/App.tsx` line 49–59 (route transition): wrap in `usePrefersReducedMotion()` and disable `initial`/`exit` transforms when reduced
   - `src/app/App.tsx` line 121–131 (toasts): same
   - `src/pages/DashboardPage.tsx` line 107–111 (hero): same
   - `src/pages/ModulePage.tsx` line 54–58 (header): same
   - `src/pages/LessonPage.tsx` line 72–77 (lesson content): same
   - `src/components/quizzes/ModuleQuiz.tsx` line 86–91 (quiz results) and 287–320 (feedback): same

   Pattern:
   ```tsx
   const prefersReduced = usePrefersReducedMotion();
   <motion.div
     initial={prefersReduced ? false : { opacity: 0, transform: 'translateY(10px)' }}
     animate={{ opacity: 1, transform: 'translateY(0)' }}
     exit={prefersReduced ? false : { opacity: 0, transform: 'translateY(-6px)' }}
     transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: 'var(--ease-out)' }}
   >
   ```

3. **Add hover guards** to components using hover transforms:
   - Theme toggle (TopNav.tsx:56): already has `hover:scale-110` — add `@media (hover: hover) and (pointer: fine)` wrapper or move to CSS
   - Segmented button (Controls.tsx:134): `hover:scale-[1.04]`
   - Dashboard continue button (DashboardPage.tsx:148): `hover:scale-[1.03]`
   - Slider thumb (index.css:230): `transform: scale(1.25)`

## Boundaries

- Do NOT remove `blinkdot` animation — it's for live indicators, keep but respect reduced-motion
- Do NOT change `scroll-behavior: smooth` removal — that's correct for reduced motion
- Do NOT change Framer Motion logic beyond branching on reduced motion

## Verification

- **Mechanical**: `npm run typecheck && npm run build` — should pass
- **Feel check**:
  - Enable `prefers-reduced-motion` in DevTools Rendering panel
  - Navigate between routes — verify no slide movement, but content cross-fades (opacity)
  - Trigger a toast — verify no slide, but fade in/out works
  - Hover sidebar NavLinks — verify color/border transitions work, no transform
  - Hover theme toggle on desktop — verify scale works; on touch device (or DevTools touch simulation) — verify no scale
  - Hover slider thumb — verify no scale on touch, scale on desktop
  - Progress bar — verify width transition still animates (comprehension aid)
  - Tab through interactive elements — verify focus ring appears instantly (no transition delay)
- **Done when**: Reduced motion drops movement but keeps opacity/color feedback, hover transforms gated to pointer-fine, Framer Motion respects preference