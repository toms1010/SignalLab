# 004 — Add missing transitions for jarring state changes

- **Status**: TODO
- **Commit**: local
- **Severity**: MEDIUM
- **Category**: Missed opportunities
- **Estimated scope**: 4 files (Sidebar.tsx, TopNav.tsx, ModuleQuiz.tsx, Lab.tsx), small

## Problem

Several spatially-connected UI elements change state instantly without transitions, causing jarring changes that violate spatial consistency (AUDIT.md: "State changes that teleport (content swaps, layout jumps) where a brief transition would prevent a jarring change" and "Spatially-connected UI (a panel that appears from a trigger) with no motion explaining where it came from").

**Locations:**

1. **Sidebar module lesson list expansion** (Sidebar.tsx:252–283):
   - When `isOpen` toggles, the lesson list appears/disappears instantly
   - No slide-down/up, no fade — layout jumps

2. **TopNav SearchBox dropdown** (TopNav.tsx:88–106):
   - Results list appears/disappears instantly on `open` state change
   - No transition from the search button trigger

3. **ModuleQuiz answer feedback** (ModuleQuiz.tsx:287–320):
   - Explanation panel appears instantly after submit
   - Uses `AnimatePresence` with `initial={{ opacity: 0, y: 8 }}` but no `transition` prop — snaps in

4. **LabShell reset button** (Lab.tsx:268–277):
   - Reset button appears when `reset` prop provided
   - No entrance animation

5. **Theme toggle** (TopNav.tsx:52–60):
   - Icon swaps (Sun ↔ Moon) instantly on theme change
   - No crossfade or rotation to explain the change

## Target

Add brief, purposeful transitions (150–250ms, ease-out) to each:

### 1. Sidebar module lesson list — slide down/up from module header

```tsx
/* src/components/layout/Sidebar.tsx:252–283 */
{isOpen ? (
  <motion.div
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.2, ease: 'var(--ease-out)' }}
    className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l pl-2"
    style={{ borderColor: 'var(--stroke)' }}
  >
    {lessonsForModule(m.id).map((l) => ( ... ))}
  </motion.div>
) : null}
```

### 2. TopNav SearchBox dropdown — scale from search button

```tsx
/* src/components/layout/TopNav.tsx:88–106 */
<AnimatePresence>
  {open && results.length > 0 && (
    <motion.ul
      initial={{ opacity: 0, transform: 'scaleY(0.9)', transformOrigin: 'top right' }}
      animate={{ opacity: 1, transform: 'scaleY(1)', transformOrigin: 'top right' }}
      exit={{ opacity: 0, transform: 'scaleY(0.9)', transformOrigin: 'top right' }}
      transition={{ duration: 0.15, ease: 'var(--ease-out)' }}
      className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border bord bg-[var(--panel-solid)] shadow-lg"
    >
      {results.map((l) => ( ... ))}
    </motion.ul>
  )}
</AnimatePresence>
```

### 3. ModuleQuiz feedback — add transition to AnimatePresence

```tsx
/* src/components/quizzes/ModuleQuiz.tsx:287–320 */
<AnimatePresence mode="wait">
  {locked && picked ? (
    <motion.div
      initial={{ opacity: 0, transform: 'translateY(8px)' }}
      animate={{ opacity: 1, transform: 'translateY(0)' }}
      exit={{ opacity: 0, transform: 'translateY(-4px)' }}
      transition={{ duration: 0.18, ease: 'var(--ease-out)' }}
      className="mt-4 rounded-xl border px-4 py-3.5"
      style={{ ... }}
    >
      ...
    </motion.div>
  ) : null}
</AnimatePresence>
```

### 4. LabShell reset button — fade in when provided

```tsx
/* src/components/visualizations/Lab.tsx:268–277 */
{reset ? (
  <motion.button
    initial={{ opacity: 0, transform: 'translateX(8px)' }}
    animate={{ opacity: 1, transform: 'translateX(0)' }}
    transition={{ duration: 0.2, ease: 'var(--ease-out)' }}
    type="button"
    onClick={reset}
    aria-label="Reset this simulation to its defaults"
    className="focusable flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold text-dim hover:text-[var(--cyan)]"
    style={{ borderColor: 'var(--stroke)' }}
  >
    <RotateCcw size={11} /> Reset
  </motion.button>
) : null}
```

### 5. Theme toggle icon — crossfade on theme change

```tsx
/* src/components/layout/TopNav.tsx:52–60 */
<button ... className="focusable grid h-9 w-9 place-items-center rounded-full border bord transition-transform hover:scale-110">
  <AnimatePresence mode="wait">
    {theme === 'dark' ? (
      <motion.component
        key="sun"
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        exit={{ opacity: 0, rotate: 90 }}
        transition={{ duration: 0.2, ease: 'var(--ease-out)' }}
      >
        <Sun size={16} />
      </motion.component>
    ) : (
      <motion.component
        key="moon"
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        exit={{ opacity: 0, rotate: 90 }}
        transition={{ duration: 0.2, ease: 'var(--ease-out)' }}
      >
        <Moon size={16} />
      </motion.component>
    )}
  </AnimatePresence>
</button>
```

## Repo conventions to follow

- Framer Motion `AnimatePresence` with `mode="wait"` used in App.tsx:49, 121
- Motion tokens from Plan 002: `var(--ease-out)`, `var(--duration-base)`
- Full transform strings (not x/y shorthands) per Plan 002

## Steps

1. **Add Framer Motion import** to Sidebar.tsx, TopNav.tsx, ModuleQuiz.tsx, Lab.tsx (if not present)
2. **Implement Sidebar lesson list slide** (Sidebar.tsx:252–283)
3. **Implement TopNav SearchBox dropdown scale** (TopNav.tsx:88–106)
4. **Add transition to ModuleQuiz feedback** (ModuleQuiz.tsx:287–320)
5. **Add entrance to LabShell reset button** (Lab.tsx:268–277)
6. **Implement Theme toggle icon crossfade** (TopNav.tsx:52–60)

## Boundaries

- Do NOT animate the sidebar drawer itself (already has `transition-transform duration-300`)
- Do NOT change quiz question transitions (only the feedback panel)
- Do NOT add stagger to lesson list items — keep simple
- Duration budgets: 150–250ms for all, ease-out

## Verification

- **Mechanical**: `npm run typecheck && npm run build` — should pass
- **Feel check**:
  - Click module chevron in sidebar — verify lesson list slides down smoothly from header
  - Click module chevron again — verify slides up
  - Open search in TopNav, type query — verify dropdown scales from search button (top-right origin)
  - Submit quiz answer — verify feedback panel slides up with fade
  - Click reset in any lab — verify button fades in from right
  - Toggle theme — verify Sun/Moon crossfade with subtle rotation
  - Toggle `prefers-reduced-motion` — verify all new transitions drop movement but keep opacity
  - In DevTools Animations panel at 10% — verify transform origins are correct (sidebar from module header, search from button, theme toggle center)
- **Done when**: All five jarring state changes have purposeful transitions, respect reduced motion, use motion tokens