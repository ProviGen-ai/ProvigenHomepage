import type { CSSProperties } from 'react';
import { clsx } from 'clsx';
import type { Forecast } from '@/content/writings/cheap-thought-costly-evidence';

/*
 * The six registry forecasts on one thin-line 2026–2036 timeline. Each forecast
 * is a stem at its deadline whose height is its probability (0–100%), with the
 * range drawn as a lighter band and the probability as a teal head. Built in
 * HTML/CSS rather than SVG so the mono labels keep their real pixel size on a
 * phone. All deadlines fall on 31 December, so year ticks sit at year ends and
 * carry that year's number: a stem on "2029" reads "by the end of 2029".
 *
 * `figure`: labelled, each stem links to its forecast block.
 * `card`: the index and "next" card motif; decorative, tiny labels only.
 * Motion: stems rise once the surrounding Reveal adds .is-in; motion off and
 * reduced motion show the final state (writings.css).
 */

const START = 2026.6;
const END = 2037.25;
const YEARS = Array.from({ length: 11 }, (_, i) => 2026 + i);
/* The three forecasts that close on 31 December 2030 share a tick; they fan
   out a few pixels so each keeps its own stem (on phones by half a year's
   width instead, see writings.css, so the fan never reaches the 2029 stem). */
const CLUSTER = { figure: 16, card: 13 } as const;

type Var = CSSProperties & Record<`--${string}`, string | number>;

function yearFraction(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const from = Date.UTC(y, 0, 1);
  const to = Date.UTC(y + 1, 0, 1);
  return y + (d.getTime() - from) / (to - from);
}
/* Deadlines are the last day of a year; plot them at that year's end. */
const at = (t: number) => ((t - START) / (END - START)) * 100;
const deadlineX = (iso: string) => at(Math.round(yearFraction(iso)));
const pct = (n: number) => `${Math.round(n * 1000) / 1000}%`;

export default function ForecastTimeline({
  forecasts,
  variant = 'figure',
  className,
}: {
  forecasts: Forecast[];
  variant?: 'figure' | 'card';
  className?: string;
}) {
  /* Offset forecasts that share a deadline, in order of appearance. */
  const seen = new Map<string, number>();
  const counts = forecasts.reduce(
    (m, f) => m.set(f.deadline, (m.get(f.deadline) ?? 0) + 1),
    new Map<string, number>(),
  );
  const placed = forecasts.map((f) => {
    const k = seen.get(f.deadline) ?? 0;
    seen.set(f.deadline, k + 1);
    const total = counts.get(f.deadline) ?? 1;
    const fan = k - (total - 1) / 2;
    const dx = fan * CLUSTER[variant];
    /* In a cluster the first label reads to the left of its stem and the
       others to the right, so no label sits on a neighbour's band. */
    const side = total > 1 ? (k === 0 ? 'is-left' : 'is-right') : undefined;
    return { f, x: deadlineX(f.deadline), dx, fan, side };
  });

  const isFigure = variant === 'figure';
  const summary = `Timeline from 2026 to 2036. ${forecasts
    .map(
      (f) =>
        `Forecast ${f.n}: ${f.probabilityLabel} ${f.qualifier} ${f.deadlineLabel}`,
    )
    .join('. ')}.`;

  return (
    <div
      className={clsx('w-tl', `w-tl--${variant}`, className)}
      {...(isFigure
        ? { role: 'group', 'aria-label': summary }
        : { 'aria-hidden': true })}
    >
      <div className="w-tl-plot">
        {isFigure && (
          <>
            <span
              className="w-tl-guide"
              style={{ bottom: '100%' } as Var}
              aria-hidden="true"
            >
              <i>100%</i>
            </span>
            <span
              className="w-tl-guide"
              style={{ bottom: '50%' } as Var}
              aria-hidden="true"
            >
              <i>50%</i>
            </span>
          </>
        )}
        <span className="w-tl-axis" aria-hidden="true" />
        {isFigure && (
          <span
            className="w-tl-now"
            style={{ left: pct(at(2026.75)) } as Var}
            aria-hidden="true"
          >
            <i>Oct 2026</i>
          </span>
        )}
        {placed.map(({ f, x, dx, fan, side }, i) => {
          const style: Var = {
            '--x': pct(x),
            '--dx': `${dx}px`,
            '--fan': fan,
            '--p': pct(f.probability),
            '--lo': pct(f.range[0]),
            '--hi': pct(f.range[1]),
            '--i': i,
          };
          const inner = (
            <>
              <span className="w-tl-band" />
              <span className="w-tl-stem" />
              <span className="w-tl-head" />
              <span
                className={clsx('w-tl-label', x > 90 ? 'is-end' : side)}
              >
                {isFigure && <b>{String(f.n).padStart(2, '0')}</b>}
                {f.probabilityLabel}
              </span>
            </>
          );
          return isFigure ? (
            <a
              key={f.id}
              href={`#${f.id}`}
              className="w-tl-col"
              style={style}
              aria-label={`Forecast ${f.n}: ${f.probabilityLabel} ${f.qualifier} ${f.deadlineLabel}. ${f.title}`}
            >
              {inner}
            </a>
          ) : (
            <span key={f.id} className="w-tl-col" style={style}>
              {inner}
            </span>
          );
        })}
      </div>
      <div className="w-tl-years" aria-hidden="true">
        {YEARS.map((y) => (
          <span
            key={y}
            className={clsx('w-tl-year', y % 2 === 1 && 'is-odd')}
            style={{ left: pct(at(y + 1)) } as Var}
          >
            {y}
          </span>
        ))}
      </div>
    </div>
  );
}
