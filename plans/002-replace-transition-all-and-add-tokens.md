# 002 — Replace `transition: all` with explicit property lists and add motion tokens

- **Status**: TODO
- **Commit**: local
- **Severity**: HIGH
- **Category**: Performance + Cohesion & tokens
- **Estimated scope**: 3 files (index.css, Controls.tsx, Sidebar.tsx), medium

## Problem

`transition: all` appears in 7+ locations, animating unintended properties off-GPU and causing style recalculation on every change. Per AUDIT.md: "`transition: all` animates unintended properties off-GPU — always a finding."

**Locations and current code:**

```css
/* src/index.css:172–183 — .glass surface used everywhere */
.glass {
  ...
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s ease;  /* GOOD — explicit properties */
}
```

```css
/* src/index.css:185–190 — .glass-hover:hover uses transition: all implicitly via hover */
.glass-hover:hover { ... }  /* inherits .glass transition — OK */
```

```css
/* src/index.css:287–299 — .switch toggle */
.switch {
  ...
  transition: background 0.25s ease;  /* GOOD — single property */
}
.switch::after {
  ...
  transition: transform 0.25s cubic-bezier(0.6, 1.6, 0.4, 1);  /* GOOD */
}
```

```css
/* src/index.css:333–382 — .term tooltip */
.term .tip {
  ...
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;  /* GOOD */
}
```

```tsx
/* src/components/ui/Controls.tsx:134 — Segmented button */
className="... transition-all hover:scale-[1.04]"  /* BAD — transition: all */
```

```tsx
/* src/components/ui/Controls.tsx:230 — Formula copy button */
className="... transition-colors hover:text-[var(--cyan)]"  /* GOOD — explicit */
```

```tsx
/* src/components/ui/Controls.tsx:347 — ProgressBar fill */
<div className="h-full rounded-full transition-[width] duration-700" ... />  /* GOOD — explicit */
```

```tsx
/* src/components/layout/Sidebar.tsx:102 — Sidebar drawer */
className={cn(..., 'transition-transform duration-300', ...)}  /* GOOD — explicit */
```

```tsx
/* src/components/layout/Sidebar.tsx:164–168 — NavLink dashboard */
className={({ isActive }) => cn(
  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all',  /* BAD */
  ...
)}
```

```tsx
/* src/components/layout/Sidebar.tsx:217–220 — NavLink module */
className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2 py-2 text-dim transition-all hover:bg-[var(--panel)] hover:text-[var(--text)]"  /* BAD */
```

```tsx
/* src/components/layout/Sidebar.tsx:261–267 — NavLink lesson */
className={({ isActive }) => cn(
  'flex items-center gap-2 rounded-lg border px-2 py-1.5 text-[12px] transition-all',  /* BAD */
  ...
)}
```

```tsx
/* src/components/layout/Sidebar.tsx:299–305 — SECTION_LINKS NavLink */
className={({ isActive }) => cn(
  'flex items-center gap-3 rounded-xl border px-3 py-2 text-[13px] transition-all',  /* BAD */
  ...
)}
```

```tsx
/* src/components/layout/TopNav.tsx:112 — Search button */
className={cn('focusable grid h-9 w-9 place-items-center rounded-full border bord text-dim hover:text-[var(--cyan)]')}  /* missing transition, but no 'all' */
```

```tsx
/* src/components/layout/TopNav.tsx:56 — Theme toggle */
className="focusable grid h-9 w-9 place-items-center rounded-full border bord transition-transform hover:scale-110"  /* GOOD — explicit */
```

```tsx
/* src/components/ui/Controls.tsx:218–235 — Formula component */
className="relative flex items-center overflow-hidden rounded-xl border px-4 py-3"  /* no transition */
```

```tsx
/* src/app/App.tsx:148 — Toast motion.div */
<motion.div
  initial={{ opacity: 0, x: 24 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 24 }}
  className="glass-solid ..."
  /* Framer Motion handles transform/opacity — OK */
>
```

**Why it matters:**
- `transition: all` on NavLinks (4 occurrences in Sidebar) animates `border-color`, `background`, `color`, `transform` (if any) on every hover/focus/active state change
- Segmented button `transition-all` animates all properties including `box-shadow` if added later
- Framer Motion `x`/`y` shorthands in App.tsx route transitions and toasts run on main thread, not GPU — per AUDIT.md: "Framer Motion `x`/`y`/`scale` shorthands are not hardware-accelerated — they run on the main thread and drop frames under load. Target: the full transform string"

## Target

1. **Replace all `transition-all` with explicit property lists** matching what actually changes
2. **Add CSS motion tokens** for consistent easing/duration across the codebase
3. **Convert Framer Motion shorthands to full transform strings**

```css
/* src/index.css — ADD after line 19 (--radius-panel) */
@theme {
  ...
  --radius-panel: 16px;
  
  /* Motion tokens — from AUDIT.md */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* strong ease-out for UI entrances/exits */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* strong ease-in-out for on-screen movement */
  --ease-spring: cubic-bezier(0.32, 0.72, 0, 1);     /* iOS-like drawer/spring curve */
  --duration-fast: 100ms;     /* button press, tooltip */
  --duration-base: 160ms;     /* standard UI transitions */
  --duration-slow: 250ms;     /* modals, drawers, complex */
  --duration-progress: 700ms; /* progress bars */
}
```

```css
/* src/index.css:172–183 — .glass already explicit, keep */
```

```tsx
/* src/components/layout/Sidebar.tsx — NavLink transitions */
'transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]'
/* instead of 'transition-all' */
```

```tsx
/* src/components/ui/Controls.tsx:134 — Segmented button */
className="rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:scale-[1.04]"
/* add explicit transform transition for hover scale */
```

```tsx
/* src/app/App.tsx:50–55 — Route transition: use full transform string */
<motion.div
  key={location.pathname}
  initial={{ opacity: 0, transform: 'translateY(10px)' }}
  animate={{ opacity: 1, transform: 'translateY(0)' }}
  exit={{ opacity: 0, transform: 'translateY(-6px)' }}
  transition={{ duration: 0.22, ease: 'var(--ease-out)' }}
>
```

```tsx
/* src/app/App.tsx:125–130 — Toast transition: use full transform string */
<motion.div
  key={t.id}
  initial={{ opacity: 0, transform: 'translateX(24px)' }}
  animate={{ opacity: 1, transform: 'translateX(0)' }}
  exit={{ opacity: 0, transform: 'translateX(24px)' }}
  transition={{ duration: 0.2, ease: 'var(--ease-out)' }}
  className="glass-solid ..."
/>
```

## Repo conventions to follow

- `.glass` (index.css:172) already uses explicit properties — exemplar
- `.switch` (index.css:287) uses explicit `background` and `transform` — exemplar
- `.term .tip` (index.css:365) uses explicit `opacity` and `transform` — exemplar
- ProgressBar (Controls.tsx:347) uses `transition-[width]` — exemplar
- Sidebar drawer (Sidebar.tsx:102) uses `transition-transform` — exemplar

## Steps

1. **Add motion tokens** to `src/index.css` @theme block (after `--radius-panel`)

2. **Fix Sidebar.tsx NavLinks** (4 occurrences):
   - Line 164: Replace `transition-all` → `transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]`
   - Line 220: Replace `transition-all` → `transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]`
   - Line 263: Replace `transition-all` → `transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]`
   - Line 301: Replace `transition-all` → `transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]`

3. **Fix Controls.tsx Segmented button** (line 134):
   - Replace `transition-all` → `transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]`
   - Add `transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]` for hover scale

4. **Fix App.tsx route transition** (lines 50–55):
   - Replace `y: 10` → `transform: 'translateY(10px)'`
   - Replace `y: 0` → `transform: 'translateY(0)'`
   - Replace `y: -6` → `transform: 'translateY(-6px)'`
   - Replace `ease: 'easeOut'` → `ease: 'var(--ease-out)'`
   - Replace `duration: 0.22` → `duration: 0.22` (keep, under 300ms budget)

5. **Fix App.tsx toast transition** (lines 125–130):
   - Replace `x: 24` → `transform: 'translateX(24px)'`
   - Replace `x: 0` → `transform: 'translateX(0)'`
   - Add explicit `transition={{ duration: 0.2, ease: 'var(--ease-out)' }}`

6. **Verify no other `transition-all` exists** (grep for it)

## Boundaries

- Do NOT change `.glass`, `.switch`, `.term .tip`, `.progress-bar`, sidebar drawer — already explicit
- Do NOT change Framer Motion `AnimatePresence` logic — only the transform values
- Do NOT add new dependencies

## Verification

- **Mechanical**: `npm run typecheck && npm run build` — should pass
- **Feel check**:
  - Hover NavLinks in sidebar — verify smooth color/border transition, no jank
  - Click theme toggle — verify scale transform is smooth
  - Navigate between routes — verify page transition feels crisp (0.22s ease-out)
  - Trigger a toast — verify slide-in from right is smooth
  - In DevTools Animations panel, set playback to 10% — verify route/toast transforms are GPU-accelerated (show as "transform" not "x/y")
  - Toggle `prefers-reduced-motion` — verify transitions become near-instant but opacity feedback remains
- **Done when**: All `transition-all` replaced, motion tokens defined and used, Framer Motion uses full transform strings