# Animation Improvement Plans

Generated from `improve-animations` audit of SignalCraft (commit: local).

## Plan Summary

| # | Title | Severity | Category | Status |
|---|-------|----------|----------|--------|
| 001 | Remove decorative infinite animations from high-frequency surfaces | HIGH | Purpose & frequency | TODO |
| 002 | Replace `transition: all` with explicit properties and add motion tokens | HIGH | Performance + Cohesion | TODO |
| 003 | Fix reduced-motion: keep helpful transitions, drop only movement | HIGH | Accessibility | TODO |
| 004 | Add missing transitions for jarring state changes | MEDIUM | Missed opportunities | TODO |
| 005 | Fix physicality: transform origins, press feedback | MEDIUM | Physicality & origin | TODO |

## Recommended Execution Order

1. **001** → **002** → **003** → **005** → **004**

### Rationale

- **001 first**: Removes the most egregious violations (infinite decorative animations) and simplifies the reduced-motion surface for 003
- **002 second**: Establishes motion tokens (`--ease-out`, `--duration-*`) that all subsequent plans depend on
- **003 third**: Fixes accessibility baseline; must run after tokens exist so Framer Motion components can use `var(--ease-out)`
- **005 fourth**: Adds physicality polish (press feedback, tooltip origin) using tokens from 002
- **004 last**: Adds new transitions for missed opportunities; depends on tokens from 002 and reduced-motion behavior from 003

## Dependencies

```
001 ──┐
      ├──→ 002 ──┐
003 ←────────────┤
      005 ←──────┘
           │
           └──→ 004
```

- 002 must complete before 003, 004, 005 (they all use `var(--ease-out)`, `var(--duration-*)`)
- 003 should complete before 004 (new transitions must respect reduced-motion)
- 001 and 003 both touch `index.css` reduced-motion media query — 001 simplifies it, 003 rewrites it

## Verification Checklist (run after all plans)

- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes  
- [ ] `npm run test` passes (79 tests)
- [ ] No `transition-all` remains in codebase
- [ ] No infinite decorative animations remain (`floaty`, `pulseGlow`, `marquee`, `gradShift` removed; `blinkdot` preserved)
- [ ] `prefers-reduced-motion` drops transforms but keeps opacity/color transitions
- [ ] `hover` transforms gated to `@media (hover: hover) and (pointer: fine)`
- [ ] Framer Motion components use full transform strings, not `x`/`y` shorthands
- [ ] Tooltip (`.term .tip`) scales from trigger (bottom center)
- [ ] All primary interactive elements have `:active` press feedback
- [ ] Sidebar lesson list slides, SearchBox dropdown scales from button, quiz feedback slides, lab reset fades, theme toggle crossfades
- [ ] All new transitions respect reduced-motion (movement dropped, opacity kept)

## Notes

- The codebase uses **Framer Motion 14** for route transitions, toasts, and page entrances; **CSS transitions** for hover/press states; **CSS keyframes** for decorative animations (being removed); **Canvas rAF loops** for visualization scenes (out of scope for these plans).
- Personality: **Engineering laboratory** — crisp, technical, not playful. Durations stay under 300ms, easings are strong ease-out (`cubic-bezier(0.23, 1, 0.32, 1)`).
- Visualization scenes (`src/components/visualizations/scenes/`) use `requestAnimationFrame` for real-time simulation — these are **exempt** from UI animation audit (they are the content, not chrome).