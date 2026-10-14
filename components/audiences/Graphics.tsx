import type { CSSProperties } from 'react';
import Reveal from '@/components/Reveal';

/*
 * /biopharma's small graphics (8 Oct 2026): hairline marks in the site's
 * palette that draw themselves once they scroll into view (Reveal adds
 * .is-in; app/biopharma/biopharma.css holds the motion, stilled under
 * reduced motion). The three "why it is hard" diagrams and the task streams
 * gave way to the deck's figures the same evening (components/audiences/bp;
 * archived in output/provigen-website-removed-2026-10-08/biopharma-before-deck/).
 */

const i = (n: number) => ({ '--i': n }) as CSSProperties;

/** A count of experiments as dots, one group per round, filling round by round when seen. */
export function Dots({ rounds, per, label }: { rounds: number; per: number; label: (round: number) => string }) {
  return (
    <Reveal className="g-dots" threshold={0.4}>
      {Array.from({ length: rounds }, (_, r) => (
        <div key={r} className="g-dots-round" style={i(r)}>
          <span className="g-dots-grid" aria-hidden="true">
            {Array.from({ length: per }, (_, k) => (
              <span key={k} style={{ '--j': k } as CSSProperties} />
            ))}
          </span>
          <span className="g-dots-label">{label(r + 1)}</span>
        </div>
      ))}
    </Reveal>
  );
}

/** Two bars for the published comparison, growing in when seen. */
export function Bars({ a, b, aLabel, bLabel }: { a: number; b: number; aLabel: string; bLabel: string }) {
  const max = Math.max(a, b);
  return (
    <Reveal className="g-bars" threshold={0.4}>
      {[
        { v: a, label: aLabel, cls: 'is-a' },
        { v: b, label: bLabel, cls: 'is-b' },
      ].map((bar, n) => (
        <div key={bar.label} className={`g-bar ${bar.cls}`} style={{ ...i(n), '--w': `${(bar.v / max) * 100}%` } as CSSProperties}>
          <span className="g-bar-label">{bar.label}</span>
          <span className="g-bar-track">
            <span className="g-bar-fill" />
          </span>
          <span className="g-bar-value">{bar.v}</span>
        </div>
      ))}
    </Reveal>
  );
}

/** A first project as a line with a stop per step that draws itself. */
export function Timeline({ steps }: { steps: readonly { readonly when: string; readonly line: string }[] }) {
  return (
    <Reveal className="g-time" threshold={0.3} style={{ '--n': steps.length } as CSSProperties}>
      <span className="g-time-line" aria-hidden="true" />
      <ol className="g-time-steps">
        {steps.map((s, n) => (
          <li key={s.when} className="g-time-step" style={i(n)}>
            <span className="g-time-dot" aria-hidden="true" />
            <span className="g-time-when">{s.when}</span>
            <span className="g-time-what">{s.line}</span>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
