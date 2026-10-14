import { Fragment, type ReactNode } from 'react';
import { getGlossaryEntry } from '@/data/glossary';
import { Math } from '@/components/ui/Math';

/**
 * Inline glossary term. The tooltip is rendered in CSS (see `.term` in
 * index.css) and opens on hover, keyboard focus and touch — no JavaScript
 * state, so it works on every input method.
 */
export function Term({ term, children }: { term: string; children?: ReactNode }) {
  const entry = getGlossaryEntry(term);
  if (!entry) return <>{children ?? term}</>;
  return (
    <button type="button" className="term" aria-label={`Definition of ${term}: ${entry.definition}`}>
      {children ?? term}
      <span className="tip" role="tooltip">
        {entry.definition}
        {entry.synonyms ? <em style={{ display: 'block', marginTop: 6, opacity: 0.7 }}>{entry.synonyms}</em> : null}
      </span>
    </button>
  );
}

/**
 * Renders the lesson markup dialect:
 *   **bold**          → <strong>
 *   `code`            → <code>
 *   [[Term]]          → glossary tooltip
 *   $latex$           → KaTeX inline
 *
 * Everything is escaped first, then the markers are expanded, so lesson text
 * can never inject markup.
 */
export function RichText({ text }: { text: string }): ReactNode {
  // Split on the two inline markers first so escaping cannot touch them.
  const tokens: { kind: 'text' | 'term' | 'math'; value: string }[] = [];
  let rest = text;

  const pattern = /\[\[([^\]]+)\]\]|\$([^$]+)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(rest)) !== null) {
    if (m.index > last) tokens.push({ kind: 'text', value: rest.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ kind: 'term', value: m[1] });
    else tokens.push({ kind: 'math', value: m[2]! });
    last = m.index + m[0].length;
  }
  if (last < rest.length) tokens.push({ kind: 'text', value: rest.slice(last) });

  return tokens.map((tok, i) => {
    if (tok.kind === 'math') return <Math key={i} tex={tok.value} />;
    if (tok.kind === 'term') return <Term key={i} term={tok.value} />;
    return <Fragment key={i}>{inlineMarkup(tok.value)}</Fragment>;
  });
}

/** `**bold**`, `*italic*` and `` `code` `` inside a plain text run. */
function inlineMarkup(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*([^*\n]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] !== undefined) parts.push(<strong key={`b${m.index}`}>{m[1]}</strong>);
    else if (m[2] !== undefined) parts.push(<em key={`i${m.index}`}>{m[2]}</em>);
    else if (m[3] !== undefined) parts.push(<code key={`c${m.index}`}>{m[3]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}