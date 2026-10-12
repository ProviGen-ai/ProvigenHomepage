'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { clsx } from 'clsx';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { PlayPause } from './PlayPause';
import { useWidth } from './useWidth';
import './bp.css';

/*
 * /biopharma · round by round (11 Oct 2026; the fourth drawing, and the
 * plainest). Earlier versions drew plates. The founder found they did not
 * explain themselves ("what should I see and understand here?") and asked
 * for the improvement "without cluttering the website", so the plate is gone
 * and one chart is left, the one a process scientist would draw: each
 * round's conditions as dots against the target band, with the process as
 * it runs today as a dashed line. Round by round the dots move into the
 * band: none, then four, then fourteen of eighteen.
 * Schematic: made-up particle sizes for an LNP formulation, no data.
 *
 * Drawn at its measured width so text and 1 px lines stay crisp. One clock
 * (useInViewMotion): a round's dots drop in per beat. Under reduced motion
 * all three rounds show.
 */

/** Mean particle size in nm of each round's eighteen conditions (made up). */
const ROUNDS = [
  [171, 158, 149, 183, 142, 136, 164, 127, 152, 119, 145, 133, 176, 124, 139, 112, 161, 108],
  [128, 117, 109, 134, 104, 99, 121, 96, 113, 102, 125, 94, 107, 118, 101, 111, 98, 115],
  [97, 91, 104, 88, 95, 86, 101, 93, 89, 99, 92, 107, 87, 96, 90, 103, 94, 85],
];
const REFERENCE = 131;
const TARGET = [80, 100] as const;
const inBand = (v: number) => v >= TARGET[0] && v <= TARGET[1];
const hits = (round: readonly number[]) => round.filter(inBand).length;

/** Beats: empty, then a round per beat, then a hold on all three. */
const HOLD = 4;
const TICKS = 1 + ROUNDS.length + HOLD;
const END = ROUNDS.length;
const BEAT = 1.5;

export default function Rounds({
  labels,
  alt,
  pause,
  play,
}: {
  labels: {
    /** "Round 1", "Round 2", "Round 3". */
    readonly rounds: readonly string[];
    readonly unit: string;
    readonly target: string;
    readonly reference: string;
    readonly inTarget: string;
  };
  alt: string;
  pause: string;
  play: string;
}) {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion<HTMLDivElement>(0.3);
  const { ref: box, w } = useWidth<HTMLDivElement>(620);
  const [tick, setTick] = useState(END);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % TICKS), BEAT * 1000);
    return () => window.clearInterval(id);
  }, [running]);

  /** How many rounds are on the chart. */
  const shown = allowed ? Math.min(END, tick) : END;

  const h = w < 460 ? 260 : 340;
  const L = 44;
  const R = 10;
  const T = 12;
  const B = 12;
  const y = (v: number) => Math.round(T + ((190 - v) / (190 - 76)) * (h - T - B)) + 0.5;
  const colW = (w - L - R) / ROUNDS.length;
  const x = (i: number, k: number) => Math.round(L + (i + 0.5) * colW + (((k * 7) % 18) / 17 - 0.5) * colW * 0.5);

  return (
    <div ref={ref} className="rd" role="img" aria-label={alt}>
      <div ref={box} className="rd-plot" aria-hidden="true">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <rect className="rd-band" x={L} y={y(TARGET[1])} width={w - L - R} height={y(TARGET[0]) - y(TARGET[1])} />
          <text className="rd-tick rd-tick--target" x={L + 10} y={y(TARGET[0]) - 8}>
            {labels.target}
          </text>
          {[100, 140, 180].map((v) => (
            <g key={v}>
              <line className="rd-grid" x1={L} y1={y(v)} x2={w - R} y2={y(v)} />
              <text className="rd-tick" x={L - 9} y={y(v) + 4} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          <text className="rd-tick" x={L - 9} y={y(80) + 4} textAnchor="end">
            80
          </text>
          <line className="rd-ref" x1={L} y1={y(REFERENCE)} x2={w - R} y2={y(REFERENCE)} />
          <text className="rd-tick rd-tick--ref" x={w - R - 8} y={y(REFERENCE) - 8} textAnchor="end">
            {labels.reference}
          </text>
          {ROUNDS.map((values, i) =>
            i < shown
              ? values.map((v, k) => (
                  <circle
                    key={`${i}-${k}`}
                    className={clsx('rd-dot', inBand(v) && 'is-hit')}
                    cx={x(i, k)}
                    cy={y(v)}
                    r={5}
                    style={{ '--d': `${k * 0.03}s` } as CSSProperties}
                  />
                ))
              : null,
          )}
        </svg>
      </div>
      <ol className="rd-cols" aria-hidden="true" style={{ paddingLeft: L, paddingRight: R }}>
        {ROUNDS.map((values, i) => (
          <li key={i} className={clsx('rd-col', i < shown && 'is-on', hits(values) > 0 && 'is-hit')}>
            <span className="rd-name">{labels.rounds[i]}</span>
            <span className="rd-result">{`${hits(values)} ${labels.inTarget}`}</span>
          </li>
        ))}
      </ol>
      <p className="rd-unit" aria-hidden="true">
        {labels.unit}
      </p>
      {allowed ? <PlayPause paused={paused} onToggle={() => setPaused(!paused)} pause={pause} play={play} /> : null}
    </div>
  );
}
