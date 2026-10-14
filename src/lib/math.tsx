import katex from 'katex';
import type { CSSProperties } from 'react';

/**
 * Render LaTeX to HTML with KaTeX, falling back to readable plain text.
 *
 * KaTeX is bundled (not fetched at runtime), but a malformed expression can
 * still throw — the fallback keeps the formula legible instead of blank.
 */
export function renderKatex(tex: string, displayMode = false): { html: string; ok: boolean } {
  try {
    return {
      html: katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        strict: 'ignore',
        output: 'html',
      }),
      ok: true,
    };
  } catch {
    return { html: escapeHtml(tex), ok: false };
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Rough plain-text maths, used for the copy button and as the no-KaTeX
 * fallback so a formula is always readable and always copyable.
 */
export function plainMath(tex: string): string {
  return tex
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
    .replace(/\\log_\{?10\}?/g, 'log10')
    .replace(/\\ln/g, 'ln')
    .replace(/\\log/g, 'log')
    .replace(/\\mu/g, 'µ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\beta/g, 'β')
    .replace(/\\eta/g, 'η')
    .replace(/\\alpha/g, 'α')
    .replace(/\\delta/g, 'δ')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\sum/g, 'sum')
    .replace(/\\lceil/g, 'ceil')
    .replace(/\\rfloor/g, 'floor')
    .replace(/\\geq/g, '>=')
    .replace(/\\le(?![a-zA-Z])/g, '<=')
    .replace(/\\approx/g, '≈')
    .replace(/\\times/g, '×')
    .replace(/\\pm/g, '±')
    .replace(/\\cdot/g, '·')
    .replace(/\\infty/g, '∞')
    .replace(/\\,|\\;|\\!|\\quad/g, ' ')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\operatorname\{([^{}]*)\}/g, '$1')
    .replace(/[\\{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Inline CSS custom-property helper used by the glowing slider track. */
export const cssVar = (name: string, value: string | number): CSSProperties =>
  ({ [name]: value }) as CSSProperties;