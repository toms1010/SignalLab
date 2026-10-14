# 005 — Fix physicality: scale(0) entrances, transform origins, press feedback

- **Status**: TODO
- **Commit**: local
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 4 files (index.css, App.tsx, Controls.tsx, TopNav.tsx), small

## Problem

Multiple violations of physicality rules from AUDIT.md:
1. **Tooltip scales from center** instead of trigger (`.term .tip` uses `transform: translate(-50%, 6px)` → `translate(-50%, 0)` with default `transform-origin: center`)
2. **No press feedback** (`:active` scale) on primary interactive elements: theme toggle, segmented buttons, dashboard continue button, sidebar NavLinks
3. **Switch uses overshooting spring** (`cubic-bezier(0.6, 1.6, 0.4, 1)`) — intentional but should be documented as deliberate
4. **Framer Motion entrances use `y: 10` (translateY) without scale** — this is actually correct per AUDIT.md ("Never `scale(0)` — nothing in the real world appears from nothing. Target: `scale(0.9–0.97)` + `opacity: 0`")

Wait — the route transitions and toasts use `y: 10` / `x: 24` which is translate only, no scale. That's actually correct! The AUDIT.md says "Never `scale(0)`" and "Popovers/dropdowns/tooltips scale from their trigger". Let me re-check:

- Route transition: `initial={{ opacity: 0, y: 10 }}` → translate only ✓
- Toast: `initial={{ opacity: 0, x: 24 }}` → translate only ✓
- Dashboard hero: `initial={{ opacity: 0, y: 16 }}` → translate only ✓
- ModulePage header: `initial={{ opacity: 0, y: 12 }}` → translate only ✓
- LessonPage content: `initial={{ opacity: 0, y: 10 }}` → translate only ✓
- ModuleQuiz results: `initial={{ opacity: 0, y: 10 }}` → translate only ✓
- ModuleQuiz feedback: `initial={{ opacity: 0, y: 8 }}` → translate only ✓

Good — no `scale(0)` entrances. The main issues are:

1. **Tooltip (`.term .tip`)**: scales from center, should scale from trigger
2. **Missing press feedback** on:
   - Theme toggle (TopNav.tsx:56) — has `hover:scale-110` but no `:active`
   - Segmented buttons (Controls.tsx:134) — has `hover:scale-[1.04]` but no `:active`
   - Dashboard continue button (DashboardPage.tsx:148) — has `hover:scale-[1.03]` but no `:active`
   - Sidebar NavLinks — no hover/press transforms at all
   - Search button (TopNav.tsx:112) — no hover/press
   - Slider thumb (index.css:230) — has hover scale but no press

3. **Switch overshooting spring** — document as deliberate

## Target

### 1. Fix tooltip transform origin

```css
/* src/index.css:346–382 — .term .tip */
.term .tip {
  ...
  transform-origin: bottom center;  /* Scale from trigger (bottom of term) */
  transform: translate(-50%, 6px) scale(0.95);  /* Start slightly smaller */
  transition: opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.term:hover .tip,
.term:focus-visible .tip,
.term:focus .tip {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0) scale(1);  /* Scale to normal from trigger */
}
```

### 2. Add press feedback (`:active` scale) to interactive elements

```css
/* src/index.css — ADD after .focusable */
.focusable:active {
  transform: scale(0.97);
  transition: transform 0.1s var(--ease-out);
}

/* Theme toggle */
button[aria-label*="theme"]:active,
button[aria-label*="Theme"]:active {
  transform: scale(0.95);
}

/* Segmented buttons */
.segmented-button:active {
  transform: scale(0.97);
}

/* Dashboard continue button */
button[onClick*="navigate"]:active,
a[href*="/lesson/"]:active {
  transform: scale(0.97);
}

/* Sidebar NavLinks */
.nav-link:active {
  transform: scale(0.98);
}

/* Search button */
button[aria-label="Open lesson search"]:active,
button[aria-label="Close search"]:active {
  transform: scale(0.95);
}
```

Actually, better to add `:active` styles inline where the hover styles are defined, since Tailwind doesn't have `:active` utilities by default. Let me use inline styles or CSS classes.

Better approach — add a utility class in index.css:

```css
/* src/index.css — ADD near .focusable (line 163) */
.press-feedback:active {
  transform: scale(0.97);
  transition: transform 0.1s var(--ease-out);
}
.press-feedback-subtle:active {
  transform: scale(0.98);
  transition: transform 0.1s var(--ease-out);
}
```

Then apply in components.

### 3. Document switch spring as deliberate

```css
/* src/index.css:311 — comment the spring */
.switch::after {
  ...
  /* Deliberate overshooting spring for tactile toggle feel */
  transition: transform 0.25s cubic-bezier(0.6, 1.6, 0.4, 1);
  ...
}
```

## Repo conventions to follow

- `.focusable` class exists (index.css:163) for focus rings
- `transition-transform` used on sidebar drawer, theme toggle
- Framer Motion uses `easeOut` for entrances

## Steps

1. **Fix tooltip transform origin** in `src/index.css:350`:
   - Add `transform-origin: bottom center;`
   - Change initial transform to `translate(-50%, 6px) scale(0.95);`
   - Change hover transform to `translate(-50%, 0) scale(1);`
   - Use `var(--ease-out)` for transition easing

2. **Add press feedback utility classes** in `src/index.css` after `.focusable` (line 167):
   ```css
   .press-feedback:active {
     transform: scale(0.97);
     transition: transform 0.1s var(--ease-out);
   }
   .press-feedback-subtle:active {
     transform: scale(0.98);
     transition: transform 0.1s var(--ease-out);
   }
   .press-feedback-strong:active {
     transform: scale(0.95);
     transition: transform 0.1s var(--ease-out);
   }
   ```

3. **Apply press feedback** to components:
   - `src/components/layout/TopNav.tsx:56` (theme toggle): add `press-feedback-strong`
   - `src/components/ui/Controls.tsx:134` (Segmented buttons): add `press-feedback`
   - `src/pages/DashboardPage.tsx:148` (Continue button): add `press-feedback`
   - `src/components/layout/Sidebar.tsx:158` (Dashboard NavLink): add `press-feedback-subtle`
   - `src/components/layout/Sidebar.tsx:217` (Module NavLink): add `press-feedback-subtle`
   - `src/components/layout/Sidebar.tsx:257` (Lesson NavLink): add `press-feedback-subtle`
   - `src/components/layout/Sidebar.tsx:295` (Section NavLinks): add `press-feedback-subtle`
   - `src/components/layout/TopNav.tsx:112` (Search button): add `press-feedback-strong`
   - `src/components/layout/TopNav.tsx:110` (Close search button): add `press-feedback-strong`

4. **Document switch spring** in `src/index.css:311` with comment

5. **Add press feedback to slider thumb** (index.css:230):
   ```css
   input[type='range']::-webkit-slider-thumb:active {
     transform: scale(1.1);
   }
   input[type='range']::-moz-range-thumb:active {
     transform: scale(1.1);
   }
   ```

## Boundaries

- Do NOT change route transitions, toast animations, dashboard hero, ModulePage header, LessonPage content — already use translate-only entrances (correct)
- Do NOT change Framer Motion logic beyond adding press-feedback classes
- Do NOT add `:active` to non-interactive elements

## Verification

- **Mechanical**: `npm run typecheck && npm run build` — should pass
- **Feel check**:
  - Hover a glossary term (`.term`) — verify tooltip scales from bottom center (not center)
  - Press theme toggle — verify subtle scale down (0.95) on press, back on release
  - Press segmented button in any quiz — verify scale down
  - Press dashboard continue button — verify scale down
  - Press sidebar NavLinks — verify subtle scale down (0.98)
  - Press search buttons — verify scale down
  - Drag slider thumb — verify active scale (1.1) on press
  - Toggle switch — verify overshooting spring still works (deliberate)
  - Toggle `prefers-reduced-motion` — verify press feedback becomes instant but still triggers
  - In DevTools at 10% playback — verify tooltip transform-origin is bottom center
- **Done when**: Tooltip scales from trigger, all primary interactive elements have press feedback, switch spring documented