# 001 — Remove decorative infinite animations from high-frequency surfaces

- **Status**: TODO
- **Commit**: local
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 2 files (index.css, DashboardPage.tsx), small

## Problem

The codebase runs four purely decorative infinite animations on every page load, violating the frequency rule: "100+ times/day → No animation. Ever."

**Locations and current code:**

```css
/* src/index.css:387–395 — floaty runs on logo (Sidebar.tsx:113) and ModulePage.tsx:69 */
@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.anim-floaty { animation: floaty 5s ease-in-out infinite; }
```

```css
/* src/index.css:396–404 — pulseGlow not currently used but defined */
@keyframes pulseGlow { ... }
.anim-pulse-glow { animation: pulseGlow 2.2s ease-in-out infinite; }
```

```css
/* src/index.css:422–432 — gradShift runs on "grad-text" class (DashboardPage.tsx:132, ModulePage.tsx:85, App.tsx:125) */
@keyframes gradShift { ... }
.grad-text { animation: gradShift 9s ease infinite; }
```

```css
/* src/index.css:405–412 — marquee runs on DashboardPage.tsx:198 */
@keyframes marquee { ... }
/* inline style: animation: 'marquee 34s linear infinite' */
```

```tsx
/* src/pages/DashboardPage.tsx:117 — decorative ΣΔ symbol */
<span className="... anim-floaty ..."><span className="display">ΣΔ</span></span>
```

```tsx
/* src/pages/DashboardPage.tsx:132 — gradient text animation */
<span className="grad-text">signals.</span>
```

```tsx
/* src/pages/DashboardPage.tsx:198 — marquee text */
<div className="flex w-max gap-8 whitespace-nowrap" style={{ animation: 'marquee 34s linear infinite' }}>
```

```tsx
/* src/components/layout/Sidebar.tsx:113 — brand logo floats on every page */
<div className="anim-floaty grid h-11 w-11 ...">...</div>
```

```tsx
/* src/pages/ModulePage.tsx:69 — module number floats */
<div className="anim-floaty grid h-14 w-14 ...">...</div>
```

**Why it matters:** These animations run continuously on every page. The brand logo in the sidebar is visible 100% of the time on desktop. The gradient text on the dashboard hero runs 9s cycles endlessly. The marquee scrolls forever. None convey state, provide feedback, or explain spatial relationships — they are purely decorative "looks cool" motion on high-frequency surfaces.

## Target

Remove all four infinite decorative animations and their usages. Keep the visual design (colors, gradients, layout) but make them static.

```css
/* src/index.css — DELETE lines 387–451 (all @keyframes and .anim-* classes) */
/* Keep only: blinkdot (used for live indicators), and the reduced-motion media query */
```

```tsx
/* src/pages/DashboardPage.tsx:117 — remove anim-floaty from ΣΔ */
<span className="pointer-events-none absolute -top-10 -right-6 select-none text-[150px] leading-none font-bold opacity-[0.05]" aria-hidden="true">
  <span className="display">ΣΔ</span>
</span>
```

```tsx
/* src/pages/DashboardPage.tsx:132 — remove grad-text, use static gradient */
<span className="bg-gradient-to-r from-[var(--cyan)] via-[var(--magenta)] to-[var(--gold)] bg-clip-text text-transparent">
  signals.
</span>
```

```tsx
/* src/pages/DashboardPage.tsx:198 — replace marquee with static flex or remove */
<div className="relative mt-5 overflow-hidden rounded-2xl border bord-soft py-2.5" style={{ background: 'var(--panel)', maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }} aria-hidden="true">
  <div className="flex gap-8 whitespace-nowrap">
    {/* static content, no animation */}
  </div>
</div>
```

```tsx
/* src/components/layout/Sidebar.tsx:113 — remove anim-floaty from brand logo */
<div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ ... }}>...</div>
```

```tsx
/* src/pages/ModulePage.tsx:69 — remove anim-floaty from module icon */
<div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ ... }}>...</div>
```

## Repo conventions to follow

- Static gradient text pattern already exists: `Formula.tsx:224` uses `<MathTex tex={tex} display className="text-[15px]" />` with static accent border
- No other infinite animations exist in the codebase besides these four
- The reduced-motion media query (index.css:500–509) will become simpler after removal

## Steps

1. **Delete keyframes and animation classes** from `src/index.css:387–451` (lines covering `floaty`, `pulseGlow`, `marquee`, `blinkdot`, `gradShift` and `.anim-floaty`, `.anim-pulse-glow`, `.anim-blink`, `.grad-text`). Keep `blinkdot` and `.anim-blink` — they are used for live status indicators (e.g., recording dots).

2. **Update DashboardPage.tsx**:
   - Line 117: Remove `anim-floaty` class from the ΣΔ decorative element
   - Line 132: Replace `grad-text` with static gradient using `bg-gradient-to-r from-[var(--cyan)] via-[var(--magenta)] to-[var(--gold)] bg-clip-text text-transparent`
   - Line 198: Remove inline `animation: 'marquee 34s linear infinite'` style; keep the mask gradient for fade effect but make content static

3. **Update Sidebar.tsx**: Line 113: Remove `anim-floaty` from brand logo div

4. **Update ModulePage.tsx**: Line 69: Remove `anim-floaty` from module icon div

5. **Verify reduced-motion media query** still works (it will now only affect transitions, which is correct)

## Boundaries

- Do NOT touch `blinkdot` keyframe or `.anim-blink` class — used for live indicators in visualizations
- Do NOT touch Framer Motion route transitions, toast animations, or sidebar drawer slide
- Do NOT change markup/structure — only remove animation classes and inline styles

## Verification

- **Mechanical**: `npm run typecheck && npm run build` — should pass
- **Feel check**:
  - Open app, verify sidebar brand logo is static (no floating)
  - Verify dashboard hero "signals." text is static gradient (no color shift)
  - Verify ΣΔ watermark is static (no float)
  - Verify marquee area shows static content (no horizontal scroll)
  - Verify ModulePage module icon is static
  - Toggle `prefers-reduced-motion` in DevTools Rendering panel — verify no layout shift, transitions still work for interactive elements (theme toggle, sliders, drawer)
- **Done when**: All four infinite animations removed, visual design preserved, no regressions in typecheck/build