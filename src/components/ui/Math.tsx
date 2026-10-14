import { renderKatex } from '@/lib/math';
import { plainMath } from '@/lib/math';
import { cn } from '@/lib/cn';

/**
 * Renders LaTeX with KaTeX, falling back to readable plain text.
 *
 * Kept in its own module so the component name `Math` does not shadow the
 * global `Math` used elsewhere in the UI layer.
 */
export function Math({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const { html, ok } = renderKatex(tex, display);
  if (!ok) {
    return (
      <span className={cn('mono text-[13px]', className)} title={plainMath(tex)}>
        {plainMath(tex)}
      </span>
    );
  }
  // KaTeX's own serialiser produces this HTML from a known-safe escape.
  return <span className={cn(display ? 'math-scroll block text-center' : 'math-scroll', className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
