'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { clsx } from 'clsx';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import { PlayPause } from './PlayPause';
import './bp.css';

/*
 * /biopharma · the cost of guessing (8 Oct 2026, from the founders' Merck LNP
 * deck, slide 3 "36 vs. 6 experiments"). One response surface, two ways to
 * spend runs. Left: a 6 × 6 design, every condition set before the first
 * result, measured a column at a time; its best lands near the optimum, not
 * on it. Right: six runs, each picked from the one before, walking onto it.
 * Both finish on the same beat: the design runs in parallel, the rounds in
 * sequence. Schematic: a made-up smooth surface, no data.
 *
 * One clock (useInViewMotion): in view, visible tab, motion allowed, not
 * paused. Under reduced motion both panels show their end state.
 */

const W = 320;
const H = 262;
const X0 = 34;
const X1 = 312;
const Y0 = 10;
const Y1 = 226;
/** Unit plot coordinates (origin bottom left) to the SVG. */
const px = (u: number) => X0 + u * (X1 - X0);
const py = (v: number) => Y1 - v * (Y1 - Y0);

const OPT = { u: 0.67, v: 0.5 };
const TILT = (-18 * Math.PI) / 180;
function response(u: number, v: number) {
  const du = u - OPT.u;
  const dv = v - OPT.v;
  const a = du * Math.cos(TILT) - dv * Math.sin(TILT);
  const b = du * Math.sin(TILT) + dv * Math.cos(TILT);
  return Math.exp(-(a * a) / 0.09 - (b * b) / 0.035);
}

const GRID = Array.from({ length: 36 }, (_, k) => {
  const c = k % 6;
  const r = Math.floor(k / 6);
  return { c, u: 0.08 + c * 0.168, v: 0.08 + r * 0.168 };
});
const GRID_BEST = GRID.reduce((b, p) => (response(p.u, p.v) > response(b.u, b.v) ? p : b), GRID[0]);

/** The six runs, each chosen from the results before it. */
const PATH = [
  { u: 0.06, v: 0.1 },
  { u: 0.22, v: 0.18 },
  { u: 0.34, v: 0.35 },
  { u: 0.48, v: 0.38 },
  { u: 0.57, v: 0.5 },
  OPT,
];

/** Beats: 0 empty · 1 design laid out / run 1 placed · 2..7 measuring · 7..10 hold. */
const TICKS = 11;
const BEAT = 1.15;
const END = 7;

/** Rounded, so server and browser agree on every coordinate. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A segment between two run marks, pulled back from both by `gap` so it starts and ends clear of the dots. */
function between(xa: number, ya: number, xb: number, yb: number, gap: number) {
  const len = Math.hypot(xb - xa, yb - ya);
  const ux = (xb - xa) / len;
  const uy = (yb - ya) / len;
  return [r2(xa + ux * gap), r2(ya + uy * gap), r2(xb - ux * gap), r2(yb - uy * gap)] as const;
}

function Field({ id }: { id: string }) {
  const rings = [1, 0.8, 0.62, 0.46, 0.32, 0.2];
  return (
    <g>
      <clipPath id={`${id}-clip`}>
        <rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} />
      </clipPath>
      <rect className="gs-plot" x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} />
      <g clipPath={`url(#${id}-clip)`}>
        {rings.map((k) => (
          <ellipse
            key={k}
            className="gs-ring"
            cx={r2(px(OPT.u))}
            cy={r2(py(OPT.v))}
            rx={r2(0.62 * k * (X1 - X0))}
            ry={r2(0.38 * k * (Y1 - Y0))}
            transform={`rotate(${(-TILT * 180) / Math.PI} ${r2(px(OPT.u))} ${r2(py(OPT.v))})`}
          />
        ))}
      </g>
      <line className="gs-axis" x1={X0 - 12} y1={Y1 + 12} x2={X1} y2={Y1 + 12} markerEnd="url(#gs-arrow)" />
      <line className="gs-axis" x1={X0 - 12} y1={Y1 + 12} x2={X0 - 12} y2={Y0} markerEnd="url(#gs-arrow)" />
      <text className="gs-tag" x={X0} y={Y1 + 30}>
        Setting 1
      </text>
      <text className="gs-tag" x={X0 - 18} y={Y1} transform={`rotate(-90 ${X0 - 18} ${Y1})`}>
        Setting 2
      </text>
    </g>
  );
}

function Star({ on }: { on: boolean }) {
  const cx = px(OPT.u);
  const cy = py(OPT.v);
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = (Math.PI / 5) * k - Math.PI / 2;
    const rad = k % 2 === 0 ? 9 : 3.8;
    return `${r2(cx + rad * Math.cos(a))},${r2(cy + rad * Math.sin(a))}`;
  }).join(' ');
  return <polygon className={clsx('gs-star', on && 'is-on')} points={pts} />;
}

export default function Guess({
  fixed,
  adaptive,
  alt,
  pause,
  play,
}: {
  fixed: { readonly name: string; readonly line: string };
  adaptive: { readonly name: string; readonly line: string };
  alt: string;
  pause: string;
  play: string;
}) {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion<HTMLDivElement>(0.15);
  const [tick, setTick] = useState(1);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % TICKS), BEAT * 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const t = allowed ? tick : END;
  /* the design: laid out on beat 1, measured a column per beat from beat 2 */
  const laid = t >= 1;
  const cols = Math.max(0, Math.min(6, t - 1));
  const measured = cols * 6;
  /* the rounds: run k is placed on beat k and measured on beat k + 1 */
  const placed = Math.min(PATH.length, t);
  const read = Math.max(0, Math.min(PATH.length, t - 1));
  const done = t >= END;

  return (
    <div ref={ref} className="gs" role="img" aria-label={alt}>
      <svg width="0" height="0" aria-hidden="true" className="gs-defs">
        <defs>
          <marker id="gs-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L8 4 L0 8 z" className="gs-arrowhead" />
          </marker>
          <marker id="gs-step" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" className="gs-stephead" />
          </marker>
        </defs>
      </svg>

      <figure className="gs-panel">
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <Field id="gs-fixed" />
          {GRID.map((p, k) => {
            const v = response(p.u, p.v);
            const isRead = p.c < cols;
            return (
              <circle
                key={k}
                className={clsx('gs-pt', laid && 'is-laid', isRead && 'is-read')}
                cx={r2(px(p.u))}
                cy={r2(py(p.v))}
                r={5}
                style={{ '--d': `${r2(k * 0.012)}s`, '--o': r2(0.15 + 0.85 * v) } as CSSProperties}
              />
            );
          })}
          {/* the design's best, and how far it sits from the optimum */}
          <line
            className={clsx('gs-gap', done && 'is-on')}
            x1={r2(px(GRID_BEST.u))}
            y1={r2(py(GRID_BEST.v))}
            x2={r2(px(OPT.u))}
            y2={r2(py(OPT.v))}
          />
          <circle className={clsx('gs-best', done && 'is-on')} cx={r2(px(GRID_BEST.u))} cy={r2(py(GRID_BEST.v))} r={10} />
          <Star on={done} />
        </svg>
        <figcaption>
          <span className="gs-name">{fixed.name}</span>
          <span className="gs-line">{fixed.line}</span>
          <span className="gs-count" aria-hidden="true">
            {`36 planned · ${measured} measured`}
          </span>
        </figcaption>
      </figure>

      <figure className="gs-panel gs-panel--adaptive">
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <Field id="gs-adaptive" />
          {PATH.slice(1).map((p, k) => {
            const from = PATH[k];
            const [x1, y1, x2, y2] = between(px(from.u), py(from.v), px(p.u), py(p.v), 8);
            return (
              <line
                key={k}
                className={clsx('gs-step', k + 1 < placed && 'is-on')}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                pathLength={1}
                markerEnd="url(#gs-step)"
              />
            );
          })}
          {PATH.map((p, k) => (
            <g key={k} className={clsx('gs-run', k < placed && 'is-laid', k < read && 'is-read')}>
              <circle cx={r2(px(p.u))} cy={r2(py(p.v))} r={5} style={{ '--o': r2(0.15 + 0.85 * response(p.u, p.v)) } as CSSProperties} />
              <text className="gs-n" x={r2(px(p.u) - 4)} y={r2(py(p.v) + (k === PATH.length - 1 ? 26 : -11))}>
                {k + 1}
              </text>
            </g>
          ))}
          <Star on={done} />
        </svg>
        <figcaption>
          <span className="gs-name">{adaptive.name}</span>
          <span className="gs-line">{adaptive.line}</span>
          <span className="gs-count" aria-hidden="true">
            {`${read} measured`}
          </span>
        </figcaption>
      </figure>

      {allowed ? <PlayPause paused={paused} onToggle={() => setPaused(!paused)} pause={pause} play={play} /> : null}
    </div>
  );
}
