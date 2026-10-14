import { Fragment, type ReactNode } from 'react';

/**
 * Display headings are set in PP Supply Mono Ultralight (founder, 3 Oct 2026).
 * A monospace face centres a full stop or an apostrophe in its own cell, so
 * "experiment." reads "experiment ." and "Biology’s" reads "Biology ’s". This
 * wraps each full stop that follows a letter in .s-stop and each apostrophe in
 * .s-apos (site.css), which pull the mark back to the letter spacing. The text
 * itself, and what a screen reader or a copy reads, is unchanged.
 */
export default function MonoMarks({ children }: { children: string }): ReactNode {
  const parts = children.split(/([.’])/);
  if (parts.length === 1) return children;
  return parts.map((part, index) => {
    if (part === '’') {
      return (
        <span key={index} className="s-apos">
          ’
        </span>
      );
    }
    // Only a stop that ends a word: never a decimal point or a leading dot.
    if (part === '.' && /\p{L}$/u.test(parts[index - 1] ?? '')) {
      return (
        <span key={index} className="s-stop">
          .
        </span>
      );
    }
    return part ? <Fragment key={index}>{part}</Fragment> : null;
  });
}
