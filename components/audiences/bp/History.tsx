'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { PlayPause } from './PlayPause';
import { useWidth } from './useWidth';
import './bp.css';

/*
 * /biopharma · start with the runs you already have (9 Oct 2026; replaces
 * the two figures of 8 Oct, the run squares and the variance bar, which the
 * founder found "poorly executed, makes little sense"). One idea, as a
 * chart a process scientist reads at a glance: your past runs, particle size
 * by run. The model predicts the next run with a range, the run is read, and
 * it moves on; the ranges narrow as the record grows. Schematic: made-up
 * values, no data.
 *
 * Drawn at its measured width so text and 1 px lines stay crisp. One clock
 * (useInViewMotion); under reduced motion it shows every run read.
 */

/** Particle size in nm, run by run (made up): a team's history drifting toward its target. */
const ACTUAL = [131, 124, 128, 117, 121, 112, 115, 108, 110, 103, 106, 99, 101, 96, 98, 94];
/** The model's prediction for runs 9 to 16 and the half-width of its range. */
const PRED = [117, 97, 111, 95, 105, 93, 98, 92];
const HALF = [16, 14, 12, 11, 9, 8, 7, 6];
const FIRST = 8;
const RUNS = ACTUAL.length;
const TOP = 140;
const BOTTOM = 85;
/** Beats: predict, then read, for each of runs 9 to 16; then a hold. */
const HOLD = 4;
const TICKS = (RUNS - FIRST) * 2 + HOLD;
const BEAT = 1.1;

export default function Backtest({
  labels,
  alt,
  pause,
  play,
}: {
  labels: {
    readonly unit: string;
    readonly run: string;
    readonly predicted: string;
    readonly measured: string;
    readonly legendMeasured: string;
    readonly legendPredicted: string;
  };
  alt: string;
  pause: string;
  play: string;
}) {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion<HTMLDivElement>(0.3);
  const { ref: box, w } = useWidth<HTMLDivElement>(620);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % TICKS), BEAT * 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const t = allowed ? tick : TICKS - 1;
  const k = Math.min(RUNS - 1, FIRST + Math.floor(t / 2));
  const readNow = t >= (RUNS - FIRST) * 2 || t % 2 === 1;
  const known = (i: number) => i < k || (i === k && readNow);

  const h = w < 520 ? 250 : 300;
  const L = 52;
  const R = 14;
  const T = 14;
  const B = 34;
  const x = (i: number) => Math.round(L + (i / (RUNS - 1)) * (w - L - R)) + 0.5;
  const y = (v: number) => Math.round(T + ((TOP - v) / (TOP - BOTTOM)) * (h - T - B)) + 0.5;
  const line = ACTUAL.map((v, i) => [i, v] as const)
    .filter(([i]) => known(i))
    .map(([i, v], n) => `${n === 0 ? 'M' : 'L'}${x(i)} ${y(v)}`)
    .join(' ');
  const p = PRED[k - FIRST];
  const half = HALF[k - FIRST];
  const prev = k - 1;

  return (
    <div ref={ref} className="bt" role="img" aria-label={alt}>
      <div ref={box} className="bt-plot" aria-hidden="true">
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {[90, 110, 130].map((v) => (
            <g key={v}>
              <line className="bt-grid" x1={L} y1={y(v)} x2={w - R} y2={y(v)} />
              <text className="bt-tick" x={L - 10} y={y(v) + 4} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          <text className="bt-tick" x={L - 10} y={T + 4} textAnchor="end">
            {labels.unit}
          </text>
          <text className="bt-tick" x={x(0)} y={h - 10} textAnchor="middle">
            {`${labels.run} 1`}
          </text>
          <text className="bt-tick" x={x(RUNS - 1)} y={h - 10} textAnchor="end">
            {`${labels.run} ${RUNS}`}
          </text>

          {/* every range the model gave so far, as error bars: the current one bright, earlier ones faint */}
          {PRED.map((pv, j) => {
            const i = FIRST + j;
            if (i > k) return null;
            const top = y(pv + HALF[j]);
            const bottom = y(pv - HALF[j]);
            return (
              <g key={i} className={clsx('bt-range', i === k && 'is-now')}>
                {i === k ? <rect className="bt-band" x={x(i) - 8} y={top} width={16} height={bottom - top} rx={3} /> : null}
                <line x1={x(i)} y1={top} x2={x(i)} y2={bottom} />
                <line x1={x(i) - 5} y1={top} x2={x(i) + 5} y2={top} />
                <line x1={x(i) - 5} y1={bottom} x2={x(i) + 5} y2={bottom} />
              </g>
            );
          })}

          <path className="bt-line" d={line} />
          {!readNow ? <line className="bt-reach" x1={x(prev)} y1={y(ACTUAL[prev])} x2={x(k)} y2={y(p)} /> : null}
          {PRED.map((pv, j) => (FIRST + j <= k ? <circle key={`p${j}`} className={clsx('bt-pred', FIRST + j === k && 'is-now')} cx={x(FIRST + j)} cy={y(pv)} r={FIRST + j === k ? 5.5 : 3.5} /> : null))}
          {ACTUAL.map((v, i) => (known(i) ? <circle key={i} className={clsx('bt-dot', i >= FIRST && 'is-new')} cx={x(i)} cy={y(v)} r={4} /> : null))}
        </svg>
      </div>
      <div className="bt-foot" aria-hidden="true">
        <p className="bt-read">
          {`${labels.run} ${k + 1} · ${labels.predicted} ${p} ± ${half} ${labels.unit}`}
          <span className={clsx('bt-measured', readNow && 'is-on')}>{` · ${labels.measured} ${ACTUAL[k]} ${labels.unit}`}</span>
        </p>
        <ul className="bt-legend">
          <li>
            <span className="bt-key bt-key--dot" />
            {labels.legendMeasured}
          </li>
          <li>
            <span className="bt-key bt-key--pred" />
            {labels.legendPredicted}
          </li>
        </ul>
      </div>
      {allowed ? <PlayPause paused={paused} onToggle={() => setPaused(!paused)} pause={pause} play={play} /> : null}
    </div>
  );
}
