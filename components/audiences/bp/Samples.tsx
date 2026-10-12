import type { CSSProperties } from 'react';
import { clsx } from 'clsx';
import Reveal from '@/components/Reveal';
import './bp.css';

/*
 * /biopharma · the case study's two sample counts as one field of dots
 * (8 Oct 2026, from the founders' Merck LNP deck, slide 7; merged into one
 * field on 11 Oct on the founder's "pack die blauen Punkte in die grauen
 * rein"). One dot a sample, forty to a row: the whole field is what the
 * design of experiments needed, the lit first row what active learning
 * needed. The dots fill in order once seen, so the lit ones are done long
 * before the rest (Reveal adds .is-in; stilled under reduced motion).
 */

const COLS = 40;

export default function Samples({
  rows,
  alt,
}: {
  rows: readonly { readonly label: string; readonly figure: string; readonly n: number; readonly ours?: boolean }[];
  alt: string;
}) {
  const total = Math.max(...rows.map((row) => row.n));
  const lit = rows.find((row) => row.ours)?.n ?? 0;
  /* ours first, so its label sits over the lit dots */
  const sides = [...rows].sort((a, b) => Number(Boolean(b.ours)) - Number(Boolean(a.ours)));
  return (
    <Reveal className="sm" threshold={0.35}>
      <div role="img" aria-label={alt}>
        <p className="sm-head" aria-hidden="true">
          {sides.map((row) => (
            <span key={row.label} className={clsx('sm-side', row.ours && 'is-ours')}>
              <span className="sm-label">{row.label}</span>
              <span className="sm-figure">{row.figure}</span>
            </span>
          ))}
        </p>
        <span className="sm-dots" aria-hidden="true" style={{ '--cols': COLS } as CSSProperties}>
          {Array.from({ length: total }, (_, k) => (
            <span key={k} className={k < lit ? 'is-ours' : undefined} style={{ '--k': k } as CSSProperties} />
          ))}
        </span>
      </div>
    </Reveal>
  );
}
