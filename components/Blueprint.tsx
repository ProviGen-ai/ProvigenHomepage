'use client';

import { useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { usePlate } from '@/components/plate/usePlate';
import {
  PLATE as T,
  MINT,
  MINT_HOT,
  ORANGE,
  PAPER,
  circle,
  clamp01,
  dot,
  easeInOut,
  easeOut,
  ground,
  halo,
  hash,
  head,
  line,
  lit,
  spaced,
  span,
  typed,
  type Ctx,
  type Rgba,
} from '@/components/plate/kit';
import { useDiagramMotion } from '@/lib/use-diagram-motion';
import '@/components/plate/Plate.css';

export function DiagramMotionButton({
  allowed,
  paused,
  onToggle,
  name,
  className = 'blueprint-motion-toggle',
}: {
  allowed: boolean;
  paused: boolean;
  onToggle: () => void;
  name: string;
  /** 'pl-motion-btn' for a control set on a dark plate. */
  className?: string;
}) {
  // Under reduced motion there is nothing to play: no button, no "Motion paused" label.
  if (!allowed) return null;
  return (
    <button
      type="button"
      className={className}
      aria-pressed={paused}
      aria-label={`${paused ? 'Play' : 'Pause'} ${name}`}
      onClick={onToggle}
    >
      {/* the same solid glyph as the homepage plates (Fig. 02, Fig. 03) */}
      <svg viewBox="0 0 16 16" aria-hidden="true">
        {paused ? (
          <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" />
        ) : (
          <path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" fill="currentColor" />
        )}
      </svg>
      <span>{paused ? 'Play' : 'Pause'}</span>
    </button>
  );
}

/* ---------- plate helpers shared by the canvas figures (CycleBar too) ---------- */

export type Pt = readonly [number, number];

/** A straight run as a dense polyline (for comets that travel it). */
export function straight(a: Pt, b: Pt, step = 4) {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n] as [number, number]);
}

/** Position at share p of a dense polyline, and the polyline up to it. */
export function along(pts: readonly Pt[], p: number) {
  const n = pts.length - 1;
  const f = clamp01(p) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const k = f - i;
  const at: [number, number] = [
    pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
    pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k,
  ];
  return { at, upto: [...pts.slice(0, i + 1), at] };
}

/*
 * Comet trail along a polyline (head at pts[n - 1]): the last `len` px drawn
 * as one path per pass, a wide faint pass, a mid pass and a thin hot core,
 * each stroked with one gradient from clear at the tail to bright at the
 * head. Nothing overlaps itself, so additive light stays smooth (the kit's
 * segmented trailPath beads into a string of pearls at these widths). The
 * gradient runs along the chord, which holds on short, gently curved tails.
 */
export function trailSmooth(
  ctx: Ctx,
  pts: readonly Pt[],
  len: number,
  color: Rgba = MINT,
  width = 2,
  a = 1,
  n = pts.length,
) {
  if (n < 2 || len <= 0 || a <= 0) return;
  const [hx, hy] = pts[n - 1];
  let i = n - 1;
  let tx = hx;
  let ty = hy;
  let walked = 0;
  while (i > 0) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (walked + d >= len) {
      const k = (len - walked) / d;
      tx = x1 + (x0 - x1) * k;
      ty = y1 + (y0 - y1) * k;
      break;
    }
    walked += d;
    i--;
    tx = x0;
    ty = y0;
  }
  if (Math.hypot(hx - tx, hy - ty) < 1) return;
  const hot = color === MINT ? MINT_HOT : color;
  const passes: [Rgba, number, number, number][] = [
    // colour, width, alpha at the head, where along the tail it starts
    [color, width * 2.8, 0.13, 0],
    [color, width, 0.5, 0],
    [hot, 1, 0.95, 0.45],
  ];
  lit(ctx, T, () => {
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'round';
    for (const [c, w, peak, from] of passes) {
      const gr = ctx.createLinearGradient(tx, ty, hx, hy);
      gr.addColorStop(0, c(0));
      gr.addColorStop(from, c(0));
      gr.addColorStop(1, c(peak * a));
      ctx.strokeStyle = gr;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      for (let j = i; j < n; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.stroke();
    }
  });
}

type FrameMotion = {
  running: boolean;
  allowed: boolean;
  paused: boolean;
  setPaused: (p: boolean) => void;
};

function BlueprintFrame({
  title,
  caption,
  className,
  controlInPlate = false,
  children,
}: {
  title: string;
  caption: string;
  className: string;
  /** The figure sets its own Pause / Play inside its plate (canvas figures). */
  controlInPlate?: boolean;
  /** Content, or a function of the frame's motion gate (for canvas figures). */
  children: ReactNode | ((motion: FrameMotion) => ReactNode);
}) {
  const { ref, running, allowed, paused, setPaused } = useDiagramMotion();
  return (
    <div ref={ref} className={`blueprint ${className}`} data-running={running}>
      <figure>
        <div className="blueprint-heading">
          <span className="eyebrow">{title}</span>
          {!controlInPlate && (
            <DiagramMotionButton
              allowed={allowed}
              paused={paused}
              onToggle={() => setPaused(!paused)}
              name={title.toLowerCase()}
            />
          )}
        </div>
        {typeof children === 'function'
          ? children({ running, allowed, paused, setPaused })
          : children}
        <figcaption className="blueprint-caption">
          <span className="blueprint-caption-kind">Conceptual schematic</span>
          {caption}
        </figcaption>
      </figure>
    </div>
  );
}

function BlueprintDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern
        id={`${id}-dots`}
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="1" cy="1" r="0.65" fill="currentColor" opacity=".52" />
      </pattern>
      <marker
        id={`${id}-arrow`}
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
        markerUnits="userSpaceOnUse"
      >
        <path d="M1 1L7 4L1 7" className="bp-arrow" />
      </marker>
    </defs>
  );
}

// Shared projection: a logical plate coordinate becomes an isometric point.
function platePoint(u: number, v: number, y: number, x = 400, width = 170) {
  return { x: x + (u - v) * width, y: y + ((u + v - 1) * width) / 2 };
}

function PlateGrid({
  y,
  x = 400,
  width = 170,
  wells = false,
}: {
  y: number;
  x?: number;
  width?: number;
  wells?: boolean;
}) {
  const corners = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].map(([u, v]) => platePoint(u, v, y, x, width));
  return (
    <g className="bp-plate">
      <polygon
        points={corners.map((p) => `${p.x},${p.y}`).join(' ')}
        className="bp-plane"
      />
      {wells
        ? Array.from({ length: 48 }, (_, i) => {
            const p = platePoint(
              ((i % 8) + 0.5) / 8,
              (Math.floor(i / 8) + 0.5) / 6,
              y,
              x,
              width,
            );
            const selected = [10, 11, 18, 19, 28, 29].includes(i);
            return (
              <ellipse
                key={i}
                cx={p.x}
                cy={p.y}
                rx="5"
                ry="2.5"
                className={
                  selected ? 'bp-well is-selected bp-motion' : 'bp-well'
                }
                style={{ '--well-delay': `${(i % 4) * 0.3}s` } as CSSProperties}
              />
            );
          })
        : Array.from({ length: 5 }, (_, i) => {
            const t = (i + 1) / 6;
            const a = platePoint(t, 0, y, x, width);
            const b = platePoint(t, 1, y, x, width);
            const c = platePoint(0, t, y, x, width);
            const d = platePoint(1, t, y, x, width);
            return (
              <path
                key={i}
                d={`M${a.x} ${a.y}L${b.x} ${b.y}M${c.x} ${c.y}L${d.x} ${d.y}`}
                className="bp-grid-line"
              />
            );
          })}
    </g>
  );
}

export function ExperimentStack() {
  const uid = useId().replace(/:/g, '');
  const stages = [
    ['01', 'Experimental', 'design'],
    ['02', 'Physical', 'experiments'],
    ['03', 'Observations', '& context'],
  ];
  return (
    <BlueprintFrame
      className="experiment-stack"
      title="Intelligence meets experiment"
      caption="Experimental plans become physical work. Observations return with their context to inform the next design."
    >
      <div className="stack-blueprint-canvas">
        <svg
          className="blueprint-svg"
          viewBox="0 0 720 640"
          aria-hidden="true"
          focusable="false"
        >
          <BlueprintDefs id={uid} />
          <g transform="translate(20 0)">
            <g className="bp-construction">
              <path d="M400 55V585M230 140V500M570 140V500" />
              <path d="M400 235L570 320M230 320L400 405M400 415L570 500M230 500L400 585" />
            </g>
            <PlateGrid y={500} />
            <path
              d="M315 500L400 457.5L485 500L400 542.5Z"
              fill={`url(#${uid}-dots)`}
              className="bp-stipple-plane"
            />
            <PlateGrid y={320} wells />
            <path
              d="M230 320V334L400 419L570 334V320M400 405V419"
              className="bp-plate-depth"
            />
            <PlateGrid y={140} />
            <path
              d="M400 151V307"
              className="bp-flow-line"
              markerEnd={`url(#${uid}-arrow)`}
            />
            <path
              d="M400 151V307"
              pathLength="100"
              className="bp-flow-packet bp-motion stack-design-packet"
            />
            <path
              d="M400 350V491"
              className="bp-flow-line"
              markerEnd={`url(#${uid}-arrow)`}
            />
            <path
              d="M400 350V491"
              pathLength="100"
              className="bp-flow-packet bp-motion stack-measure-packet"
            />
            <path
              d="M357.5 140L400 118.75L442.5 140L400 161.25Z"
              className="bp-selected-plane bp-motion"
            />
            <path
              d="M578 499H610Q640 499 640 469V170Q640 140 610 140H578"
              className="bp-feedback-line"
              markerEnd={`url(#${uid}-arrow)`}
            />
            <path
              d="M578 499H610Q640 499 640 469V170Q640 140 610 140H578"
              pathLength="100"
              className="bp-flow-packet bp-motion stack-return-packet"
            />
            {[140, 320, 500].map((y) => (
              <path key={y} d={`M190 ${y}H218`} className="bp-label-leader" />
            ))}
            <text
              x="663"
              y="322"
              textAnchor="middle"
              transform="rotate(-90 663 322)"
              className="bp-svg-note"
            >
              INFORM THE NEXT DESIGN
            </text>
          </g>
        </svg>
        <ol
          className="stack-blueprint-labels"
          aria-label="Experimental system layers"
        >
          {stages.map(([number, line1, line2], i) => (
            <li
              key={number}
              style={{ top: `${((140 + i * 180) / 640) * 100}%` }}
            >
              <span>{number}</span>
              <strong>
                {line1}
                <br />
                {line2}
              </strong>
            </li>
          ))}
        </ol>
      </div>
    </BlueprintFrame>
  );
}

const loopPositions = [
  { x: 320, y: 88 },
  { x: 512, y: 280 },
  { x: 320, y: 472 },
  { x: 128, y: 280 },
];
const loopConnections = [
  'M320 184V98',
  'M502 280H416',
  'M320 462V376',
  'M138 280H224',
];
const modelOutline =
  'M320 184C364 173 409 215 416 258C428 306 389 364 342 374C288 389 232 358 224 305C211 255 227 208 274 192C290 186 305 188 320 184Z';

export function LoopSchematic({ index }: { index: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <div className="loop-schematic blueprint" data-phase={index}>
      <svg
        className="blueprint-svg"
        viewBox="0 0 640 560"
        aria-hidden="true"
        focusable="false"
      >
        <BlueprintDefs id={uid} />
        <g className="bp-construction">
          <path d="M320 60V500M100 280H540" />
          <path d="M160 160L480 400M480 160L160 400" />
          <path d="M83 161V141H103M537 141H557V161M557 399V419H537M103 419H83V399" />
        </g>
        {loopPositions.map((p, i) => {
          const next = loopPositions[(i + 1) % 4];
          const path = `M${p.x} ${p.y}L${next.x} ${next.y}`;
          const midX = (p.x + next.x) / 2;
          const midY = (p.y + next.y) / 2;
          return (
            <g
              key={i}
              className={
                i === index ? 'bp-loop-edge is-active' : 'bp-loop-edge'
              }
            >
              <path d={path} className="bp-loop-track" />
              <path
                d={`M${midX - (next.x - p.x) * 0.03} ${midY - (next.y - p.y) * 0.03}L${midX} ${midY}`}
                className="bp-loop-direction"
                markerEnd={`url(#${uid}-arrow)`}
              />
              {i === index && (
                <path d={path} pathLength="100" className="bp-loop-packet" />
              )}
            </g>
          );
        })}
        <path d={modelOutline} className="bp-model-surface" />
        <path
          d={modelOutline}
          fill={`url(#${uid}-dots)`}
          className="bp-model-stipple"
        />
        <path d={modelOutline} className="bp-model-membrane" />
        <path
          d={modelOutline}
          transform="translate(320 280) scale(.88) translate(-320 -280)"
          className="bp-model-inner"
        />
        {loopConnections.map((d, i) => (
          <g
            key={d}
            className={
              index === i
                ? 'bp-model-connection is-active'
                : 'bp-model-connection'
            }
          >
            <path
              d={d}
              className="bp-flow-line"
              markerEnd={`url(#${uid}-arrow)`}
            />
            {index === i && (
              <path
                d={d}
                pathLength="100"
                className="bp-model-packet bp-motion"
              />
            )}
          </g>
        ))}
        <path d="M250 248H390V314H250Z" className="bp-model-label-field" />
        {loopPositions.map((p, i) => (
          <g
            key={i}
            className={index === i ? 'bp-loop-node is-active' : 'bp-loop-node'}
          >
            <rect
              x={p.x - 3}
              y={p.y - 3}
              width="6"
              height="6"
              className="bp-node-point"
            />
            {index === i && (
              <rect
                x={p.x - 9}
                y={p.y - 9}
                width="18"
                height="18"
                className="bp-node-bracket"
              />
            )}
          </g>
        ))}
      </svg>
      <div className="loop-model-label" aria-hidden="true">
        MODEL<small>UPDATE</small>
      </div>
      <div className="loop-schematic-labels" aria-hidden="true">
        {['Design', 'Execute', 'Measure', 'Learn'].map((label, i) => (
          <span
            key={label}
            className={`loop-schematic-label label-${i}${index === i ? ' is-active' : ''}`}
          >
            <small>0{i + 1}</small>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}


/* ======================================================================
 * Evidence informs the next batch: a canvas figure on a dark plate
 * (components/plate/kit.ts).
 *
 * Three inputs (prior observations, objectives, constraints) each send a
 * comet along a rail into one node, and from there into a field of candidate
 * conditions. Each arrival leaves its mark on the field: the prior
 * observations appear as measured points, the objective as faint contours,
 * the constraint as an orange boundary that strikes out the conditions
 * beyond it. A scan then crosses the field and lights the batch: six
 * conditions, some where the objective looks best and some where the field
 * is least explored. The rest dim. The hand-off mirrors the input side: each
 * chosen condition runs a hairline to one exit port on the field's edge, and
 * from there the comets fan out, one to each row of a plate, where the
 * condition fills three replicate wells beside a column of controls.
 *
 * Wide plates (760 px and up) run left to right; narrower ones stack the same
 * figure top to bottom. Both draw at one logical px per CSS px, so text keeps
 * its size, and CSS reserves each layout's height (the bottom-right corner
 * stays clear for Pause / Play). Rails, rays and fans are cached as Path2D
 * per size. Reduced motion: one still with the batch on the plate.
 * ====================================================================== */

const CS_INPUTS = ['PRIOR OBSERVATIONS', 'OBJECTIVES', 'CONSTRAINTS'] as const;
const CS_WIDE_MIN = 760; // matches the container query in blueprints.css
const CS_H_WIDE = 304;
const CS_H_NARROW = 702;
const CS_COLS = 8;
const CS_ROWS = 6;

/* ---------- the candidate field (unit square, v down), fixed ---------- */

type Cand = { u: number; v: number; out: boolean; seen: boolean; pick: number };

const OBJ: [number, number] = [0.6, 0.56]; // where the objective peaks
const BOUND: [number, number, number] = [1, 0, 0.42]; // constraint: circle about the top-right corner

const CANDS: Cand[] = (() => {
  const n = 10;
  const out: Cand[] = [];
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const k = j * n + i;
      const u = 0.07 + ((i + 0.5 + (hash(k, 1) - 0.5) * 0.7) / n) * 0.86;
      const v = 0.07 + ((j + 0.5 + (hash(k, 2) - 0.5) * 0.7) / n) * 0.86;
      const outside = Math.hypot(u - BOUND[0], v - BOUND[1]) < BOUND[2];
      out.push({ u, v, out: outside, seen: false, pick: -1 });
    }
  // prior observations: earlier rounds explored the lower left
  const seen = [62, 71, 73, 81, 84, 90, 52, 44, 93];
  for (const k of seen) out[k].seen = true;
  // the batch: best of objective plus distance from anything measured
  const obs = out.filter((c) => c.seen);
  const score = (c: Cand) => {
    const d = Math.hypot(c.u - OBJ[0], c.v - OBJ[1]);
    const near = Math.min(...obs.map((o) => Math.hypot(c.u - o.u, c.v - o.v)));
    return Math.exp(-(d * d) / (2 * 0.16 * 0.16)) + 0.9 * near;
  };
  const ranked = out.filter((c) => !c.out && !c.seen).sort((a, b) => score(b) - score(a));
  const chosen: Cand[] = [];
  for (const c of ranked) {
    if (chosen.length === CS_ROWS) break;
    if (chosen.every((o) => Math.hypot(c.u - o.u, c.v - o.v) > 0.17)) chosen.push(c);
  }
  // the scan crosses left to right: number the picks in that order
  chosen.sort((a, b) => a.u - b.u).forEach((c, i) => (c.pick = i));
  return out;
})();
const PICKS = CANDS.filter((c) => c.pick >= 0).sort((a, b) => a.pick - b.pick);

/*
 * Plate map: pick k fills row k as three adjacent replicates (start column
 * per row, staggered; the last row ends at the right so its label clears
 * the controls label); controls in column 1.
 */
const TRIPLET_AT = [3, 5, 2, 4, 2, 5];
/* One control per replicate row (founder, 23 Oct 2026; was rows 2–5 only). */
const CONTROLS = [0, 1, 2, 3, 4, 5];

/* ---------- clock (seconds) ---------- */
const CS_IN = (i: number) => 0.3 + i * 0.45; // station i lights
const CS_TRAVEL = 1.0; // a comet from station to field
const CS_LAND = (i: number) => CS_IN(i) + 0.45 + CS_TRAVEL;
const CS_SCAN = CS_LAND(2) + 0.7; // the scan crosses the field
const CS_SCAN_DUR = 1.3;
const CS_SEND = CS_SCAN + CS_SCAN_DUR + 0.35; // picks travel to the plate
const CS_SEND_GAP = 0.16;
const CS_SEND_DUR = 1.1;
const sendAt = (k: number) => CS_SEND + k * CS_SEND_GAP;
const CS_CTRL = sendAt(CS_ROWS - 1) + CS_SEND_DUR + 0.3;
const CS_OUT = 10.3;
const CS_LOOP = 11;
const CS_STILL = 9.2;

/* When each well fills: [row][col], Infinity for wells the batch leaves empty. */
const FILL_AT: number[][] = Array.from({ length: CS_ROWS }, (_, k) =>
  Array.from({ length: CS_COLS }, (_, c) => {
    const j = c - TRIPLET_AT[k];
    return j >= 0 && j < 3 ? sendAt(k) + CS_SEND_DUR + j * 0.09 : Infinity;
  }),
);

/* ---------- layout ---------- */

type CsGeo = {
  wide: boolean;
  w: number;
  h: number;
  st: [number, number][]; // station centres
  sr: number;
  labels: { x: number; y: number; lines: string[]; align: 'left' | 'center' }[];
  paths: [number, number][][]; // station → node → field, dense
  rails: Path2D;
  node: [number, number];
  port: [number, number];
  sq: { x: number; y: number; s: number };
  proposeAt: [number, number];
  plate: { x: number; y: number; p: number };
  /** Pick k → port → its row → its first well, dense; and where along it the port is. */
  sends: [number, number][][];
  portShare: number[];
  /** The record each send leaves: the ray inside the field, the fan outside the plate. */
  rays: Path2D[];
  fans: Path2D[];
  cap: number;
  track: number;
};

function cubic(a: Pt, b: Pt, c: Pt, d: Pt, n = 40) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    pts.push([
      m * m * m * a[0] + 3 * m * m * t * b[0] + 3 * m * t * t * c[0] + t * t * t * d[0],
      m * m * m * a[1] + 3 * m * m * t * b[1] + 3 * m * t * t * c[1] + t * t * t * d[1],
    ]);
  }
  return pts;
}

const polyLen = (pts: readonly Pt[]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
};
const toPath = (pts: readonly Pt[]) => {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  return p;
};

const wellXY = (g: Pick<CsGeo, 'plate'>, col: number, row: number): [number, number] => [
  g.plate.x + (col + 0.5) * g.plate.p,
  g.plate.y + (row + 0.5) * g.plate.p,
];
const candXY = (g: Pick<CsGeo, 'sq'>, c: Cand): [number, number] => [g.sq.x + c.u * g.sq.s, g.sq.y + c.v * g.sq.s];

function csGeometry(w: number, wide: boolean): CsGeo {
  let g: Omit<CsGeo, 'rails' | 'sends' | 'portShare' | 'rays' | 'fans'>;
  /** The fan from the port to row k's entry, just outside the plate's left edge. */
  let fan: (entry: Pt, k: number) => [number, number][];
  if (wide) {
    const ox = Math.round((w - 760) / 2);
    const cy = 152;
    const ys = [52, 152, 252];
    const node: [number, number] = [ox + 250, cy];
    const sq = { x: ox + 280, y: cy - 92, s: 184 };
    const port: [number, number] = [sq.x + sq.s + 18, cy];
    g = {
      wide,
      w,
      h: CS_H_WIDE,
      st: ys.map((y) => [ox + 26, y]),
      sr: 16,
      labels: ys.map((y, i) => ({ x: ox + 54, y: y - 9, lines: [CS_INPUTS[i]], align: 'left' as const })),
      paths: ys.map((y) => [
        ...straight([ox + 46, y], [ox + 196, y]),
        ...cubic([ox + 196, y], [ox + 232, y], [ox + 220, cy], node).slice(1),
        ...straight(node, [sq.x, cy]).slice(1),
      ]),
      node,
      port,
      sq,
      proposeAt: [sq.x, sq.y - 14],
      plate: { x: ox + 574, y: cy - (CS_ROWS * 21) / 2, p: 21 },
      cap: 11,
      track: 0.16,
    };
    fan = (e) => cubic(port, [port[0] + 38, port[1]], [e[0] - 38, e[1]], e, 32);
  } else {
    const cx = w / 2;
    const d = Math.min(110, (w - 24) / 3);
    const node: [number, number] = [cx, 136];
    const s = Math.min(208, w - 48);
    const sq = { x: cx - s / 2, y: 168, s };
    const port: [number, number] = [cx, sq.y + s + 18];
    const xs = [cx - d, cx, cx + d];
    g = {
      wide,
      w,
      h: CS_H_NARROW,
      st: xs.map((x) => [x, 70]),
      sr: 14,
      labels: [
        { x: xs[0], y: 26, lines: ['PRIOR', 'OBSERVATIONS'], align: 'center' },
        { x: xs[1], y: 40, lines: ['OBJECTIVES'], align: 'center' },
        { x: xs[2], y: 40, lines: ['CONSTRAINTS'], align: 'center' },
      ],
      paths: xs.map((x) => [
        ...cubic([x, 86], [x, 114], [cx, 108], node),
        ...straight(node, [cx, sq.y]).slice(1),
      ]),
      node,
      port,
      sq,
      proposeAt: [cx + 14, 140],
      plate: { x: cx - 96, y: port[1] + 94, p: 24 },
      cap: 10,
      track: 0.08,
    };
    /*
     * A ribbon down the left gutter: out of the port to lane k (4 px apart,
     * the deepest row outermost), down past the plate's edge, and a quarter
     * turn into the row. The lanes nest, so no two cross.
     */
    fan = (e, k) => {
      const x = e[0] - 4 - 4 * k;
      const top = port[1] + 76;
      const r = 8;
      return [
        ...cubic(port, [port[0], port[1] + 44], [x, top - 34], [x, top], 36),
        ...straight([x, top], [x, e[1] - r], 3).slice(1),
        ...cubic([x, e[1] - r], [x, e[1] - r * 0.45], [x + r * 0.45, e[1]], [x + r, e[1]], 6).slice(1),
        ...straight([x + r, e[1]], e, 3).slice(1),
      ];
    };
  }
  const m = 6; // the plate frame's margin around the wells
  const sends: [number, number][][] = [];
  const portShare: number[] = [];
  const rays: Path2D[] = [];
  const fans: Path2D[] = [];
  PICKS.forEach((c, k) => {
    const a = candXY(g, c);
    const well = wellXY(g, TRIPLET_AT[k], k);
    const entry: Pt = [g.plate.x - m - 12, well[1]];
    const ray = straight(a, g.port, 3);
    const out = fan(entry, k);
    const row = straight(entry, well, 3);
    const all = [...ray, ...out.slice(1), ...row.slice(1)];
    sends.push(all);
    portShare.push(polyLen(ray) / polyLen(all));
    rays.push(toPath(ray));
    fans.push(toPath(out));
  });
  const rails = new Path2D();
  for (const pts of g.paths) rails.addPath(toPath(pts));
  return { ...g, rails, sends, portShare, rays, fans };
}

/* ---------- station interiors ---------- */

function stationInterior(ctx: Ctx, i: number, x: number, y: number, r: number, a: number, t: number) {
  const k = r / 16;
  if (i === 0) {
    // earlier measurements: a small scatter that lights point by point
    const pts: [number, number][] = [[-9, 5], [-5, 2], [-2, 4], [1, -1], [4, 0], [7, -4], [9, -6]];
    lit(ctx, T, () => {
      line(ctx, x - 10 * k, y + 6 * k, x + 10 * k, y - 6 * k, PAPER(0.14));
      pts.forEach(([px, py], j) => {
        const on = a > 0 ? clamp01(a * 9 - j) : 0;
        dot(ctx, x + px * k, y + py * k, 1.3, on > 0 ? MINT(0.35 + 0.6 * on) : PAPER(0.4));
      });
    });
  } else if (i === 1) {
    // the objective: a target, with a ring closing on it while active
    lit(ctx, T, () => {
      circle(ctx, x, y, 8 * k, a > 0 ? MINT(0.6) : PAPER(0.28));
      circle(ctx, x, y, 3.5 * k, a > 0 ? MINT(0.75) : PAPER(0.32));
      dot(ctx, x, y, 1.3, a > 0 ? MINT_HOT(1) : PAPER(0.5));
      if (a > 0) {
        const u = (t * 1.6) % 1;
        circle(ctx, x, y, (13 - 9 * easeOut(u)) * k, MINT(0.7 * (1 - u)));
      }
    });
  } else {
    // a constraint: spec limits, and a trace that leaves them in orange
    // (the orange pieces are drawn plainly: additive light would turn them gold)
    const lim = 5 * k;
    line(ctx, x - 11 * k, y - lim, x + 11 * k, y - lim, PAPER(0.3));
    line(ctx, x - 11 * k, y + lim, x + 11 * k, y + lim, PAPER(0.3));
    const pts = Array.from({ length: 25 }, (_, s): [number, number] => [
      x + (-10 + (20 * s) / 24) * k,
      y - Math.sin((s / 24) * Math.PI * 2 + (a > 0 ? t * 3 : 0)) * 7.2 * k,
    ]);
    const pass = (over: boolean, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let s = 1; s < pts.length; s++) {
        if (Math.abs(pts[s][1] - y) > lim !== over) continue;
        ctx.moveTo(pts[s - 1][0], pts[s - 1][1]);
        ctx.lineTo(pts[s][0], pts[s][1]);
      }
      ctx.stroke();
    };
    lit(ctx, T, () => pass(false, a > 0 ? MINT(0.8) : PAPER(0.3)));
    pass(true, ORANGE(a > 0 ? 0.9 : 0.45));
  }
}

/* ---------- frame ---------- */

/** A small hairline node with a flash when something passes through it (the input node, the exit port). */
function junction(ctx: Ctx, [x, y]: Pt, hit: number, on: boolean, f: number) {
  circle(ctx, x, y, 6, PAPER(0.3), T.ground);
  if (hit > 0) {
    halo(ctx, T, x, y, 18, MINT, 0.5 * hit);
    lit(ctx, T, () => circle(ctx, x, y, 6 + 10 * (1 - hit), MINT(0.6 * hit)));
  }
  lit(ctx, T, () => dot(ctx, x, y, 2, on ? MINT_HOT(0.9 * f) : PAPER(0.5)));
}

/** 1 → 0 over `dur` seconds after `at`, 0 outside. */
const pulse = (t: number, at: number, dur: number) => {
  const u = (t - at) / dur;
  return u > 0 && u < 1 ? 1 - u : 0;
};

function drawSelection(ctx: Ctx, g: CsGeo, t: number) {
  ground(ctx, T, g.w, g.h);
  const f = 1 - span(t, CS_OUT, CS_LOOP - 0.05);
  const { sq } = g;

  /* rails and the input node */
  ctx.lineWidth = 1;
  ctx.strokeStyle = PAPER(0.14);
  ctx.stroke(g.rails);
  const nodeHit = Math.max(...[0, 1, 2].map((i) => pulse(t, CS_LAND(i) - 0.22, 0.6)));
  junction(ctx, g.node, nodeHit, t > CS_LAND(0), f);

  /* stations */
  g.st.forEach(([x, y], i) => {
    const a0 = CS_IN(i);
    const act = t >= a0 && t < a0 + 0.95 ? span(t, a0, a0 + 0.2) * (1 - span(t, a0 + 0.75, a0 + 0.95)) : 0;
    circle(ctx, x, y, g.sr, act > 0 ? MINT(0.25 + 0.55 * act) : PAPER(0.2), T.ground);
    stationInterior(ctx, i, x, y, g.sr, act, t);
    const lb = g.labels[i];
    lb.lines.forEach((s, j) =>
      spaced(ctx, lb.x, lb.y + j * 14, s, act > 0 ? MINT(0.95) : PAPER(0.55), lb.align, g.cap, g.track),
    );
    // the comet: every input travels in mint (orange stays for what is out of limits)
    const u = (t - a0 - 0.45) / CS_TRAVEL;
    if (u > 0 && u < 1) {
      const { at, upto } = along(g.paths[i], easeInOut(u));
      trailSmooth(ctx, upto, g.wide ? 70 : 54, MINT, 2);
      head(ctx, T, at[0], at[1]);
    }
  });

  /* the field */
  spaced(ctx, g.proposeAt[0], g.proposeAt[1], 'PROPOSE A BATCH', PAPER(0.62), 'left', g.cap, g.track);
  ctx.strokeStyle = PAPER(0.16);
  ctx.strokeRect(sq.x + 0.5, sq.y + 0.5, sq.s, sq.s);
  // corner registration ticks just outside the frame
  ctx.strokeStyle = PAPER(0.3);
  ctx.beginPath();
  for (const [cx, cy, dx, dy] of [
    [sq.x, sq.y, -1, -1],
    [sq.x + sq.s, sq.y, 1, -1],
    [sq.x, sq.y + sq.s, -1, 1],
    [sq.x + sq.s, sq.y + sq.s, 1, 1],
  ]) {
    ctx.moveTo(cx + dx * 4, cy);
    ctx.lineTo(cx + dx * 9, cy);
    ctx.moveTo(cx, cy + dy * 4);
    ctx.lineTo(cx, cy + dy * 9);
  }
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.rect(sq.x, sq.y, sq.s, sq.s);
  ctx.clip();
  // objective: contours draw in when its comet arrives
  const oc = span(t, CS_LAND(1), CS_LAND(1) + 0.9) * f;
  if (oc > 0) {
    const [ox, oy] = [sq.x + OBJ[0] * sq.s, sq.y + OBJ[1] * sq.s];
    [0.11, 0.21, 0.32, 0.44].forEach((r, j) => {
      const p = clamp01(oc * 1.6 - j * 0.2);
      if (p <= 0) return;
      ctx.strokeStyle = PAPER(0.1 + 0.05 * (3 - j));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(ox, oy, r * sq.s * 1.15, r * sq.s * 0.82, -0.5, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.stroke();
    });
  }
  // constraint: the excluded corner, hatched, with an orange boundary
  const bc = span(t, CS_LAND(2), CS_LAND(2) + 0.7) * f;
  const [bx, by, br] = [sq.x + BOUND[0] * sq.s, sq.y + BOUND[1] * sq.s, BOUND[2] * sq.s];
  if (bc > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = ORANGE(0.1 * bc);
    ctx.beginPath();
    for (let d = -sq.s; d < sq.s; d += 7) {
      ctx.moveTo(bx - br + d, by + br);
      ctx.lineTo(bx - br + d + br * 2, by - br);
    }
    ctx.stroke();
    ctx.restore();
    // a limit, not live light: drawn plainly over the ground, so it stays orange
    ctx.strokeStyle = ORANGE(0.85 * bc);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, br, Math.PI / 2 + (1 - bc) * (Math.PI / 2), Math.PI);
    ctx.stroke();
  }
  /*
   * The record of the hand-off: each pick's ray to the port, once its comet
   * has passed. Stacked, the rays cross the other picks and the contours, so
   * there they fade again and only the fans outside the field stay.
   */
  g.rays.forEach((ray, k) => {
    const at = sendAt(k) + CS_SEND_DUR;
    const p = span(t, at - CS_SEND_DUR * 0.5, at) * (g.wide ? 1 : 1 - span(t, at + 0.3, at + 1.1)) * f;
    if (p <= 0) return;
    ctx.strokeStyle = MINT(0.16 * p);
    ctx.lineWidth = 1;
    ctx.stroke(ray);
  });
  ctx.restore();

  // the scan
  const sp = (t - CS_SCAN) / CS_SCAN_DUR;
  const scanX = sq.x + easeInOut(sp) * sq.s;
  if (sp > 0 && sp < 1) {
    lit(ctx, T, () => {
      const band = ctx.createLinearGradient(scanX - 46, 0, scanX, 0);
      band.addColorStop(0, MINT(0));
      band.addColorStop(1, MINT(0.06));
      ctx.fillStyle = band;
      ctx.fillRect(Math.max(sq.x, scanX - 46), sq.y + 1, Math.min(46, scanX - sq.x), sq.s - 1);
      line(ctx, scanX, sq.y - 6, scanX, sq.y + sq.s + 6, MINT(0.85));
    });
  }

  // candidates
  const seenAt = (c: Cand) => CS_LAND(0) + 0.05 + c.u * 0.5;
  const struckAt = (c: Cand) => CS_LAND(2) + 0.3 + (1 - Math.hypot(c.u - BOUND[0], c.v - BOUND[1]) / BOUND[2]) * 0.4;
  const pickAt = (c: Cand) => CS_SCAN + CS_SCAN_DUR * Math.min(1, Math.max(0, inverseEase(c.u)));
  const dimmed = span(t, CS_SCAN + CS_SCAN_DUR, CS_SCAN + CS_SCAN_DUR + 0.5) * f;
  for (const c of CANDS) {
    const [x, y] = candXY(g, c);
    if (c.seen && t >= seenAt(c) && f > 0) {
      const p = span(t, seenAt(c), seenAt(c) + 0.35);
      dot(ctx, x, y, 2, PAPER((0.8 - 0.2 * dimmed) * p * f));
      continue;
    }
    if (c.out && t >= struckAt(c) && f > 0) {
      const p = span(t, struckAt(c), struckAt(c) + 0.3) * f;
      const s = 2.6;
      line(ctx, x - s, y - s, x + s, y + s, ORANGE(0.85 * p));
      line(ctx, x + s, y - s, x - s, y + s, ORANGE(0.85 * p));
      if (p < 1) dot(ctx, x, y, 1.1, PAPER(0.28 * (1 - p)));
      continue;
    }
    if (c.pick >= 0 && t >= pickAt(c) && f > 0) {
      const u = (t - pickAt(c)) / 0.5;
      const p = easeOut(u);
      // the marker steps back while its own comet is in flight, so two heads never stack
      const away = span(t, sendAt(c.pick), sendAt(c.pick) + 0.15) * (1 - span(t, sendAt(c.pick) + CS_SEND_DUR * 0.6, sendAt(c.pick) + CS_SEND_DUR));
      const a = (1 - 0.65 * away) * f;
      if (u < 1) halo(ctx, T, x, y, 16, MINT, 0.55 * (1 - u));
      lit(ctx, T, () => {
        circle(ctx, x, y, 5 + 12 * (1 - p), MINT((0.35 + 0.5 * p) * a));
        dot(ctx, x, y, 2.3, MINT_HOT(0.95 * a));
      });
      continue;
    }
    dot(ctx, x, y, 1.1, PAPER(0.3 - 0.14 * dimmed));
  }

  /* the exit port and the fans out of it, kept as a faint record once passed */
  const portHit = Math.max(
    ...PICKS.map((_, k) => pulse(t, sendAt(k) + CS_SEND_DUR * inverseEase(g.portShare[k]) - 0.05, 0.5)),
  );
  g.fans.forEach((fanPath, k) => {
    const p = span(t, sendAt(k) + CS_SEND_DUR * 0.6, sendAt(k) + CS_SEND_DUR) * f;
    if (p <= 0) return;
    ctx.strokeStyle = MINT(0.16 * p);
    ctx.lineWidth = 1;
    ctx.stroke(fanPath);
  });
  junction(ctx, g.port, portHit, t > sendAt(0) + CS_SEND_DUR * 0.3 && f > 0, f);

  /* the plate */
  const { plate: pl } = g;
  const pw = CS_COLS * pl.p;
  const ph = CS_ROWS * pl.p;
  const m = 6;
  // frame with the A1 corner chamfered, as on a real plate
  ctx.strokeStyle = PAPER(0.24);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pl.x - m + 7, pl.y - m);
  ctx.lineTo(pl.x + pw + m, pl.y - m);
  ctx.lineTo(pl.x + pw + m, pl.y + ph + m);
  ctx.lineTo(pl.x - m, pl.y + ph + m);
  ctx.lineTo(pl.x - m, pl.y - m + 7);
  ctx.closePath();
  ctx.stroke();
  const wr = pl.p * 0.3;
  for (let r = 0; r < CS_ROWS; r++)
    for (let c = 0; c < CS_COLS; c++) {
      const [x, y] = wellXY(g, c, r);
      const at = FILL_AT[r][c];
      const ctrl = c === 0 && CONTROLS.includes(r);
      if (t >= at && f > 0) {
        const u = (t - at) / 0.45;
        if (u < 1) halo(ctx, T, x, y, 14, MINT, 0.5 * (1 - u));
        lit(ctx, T, () => {
          dot(ctx, x, y, wr * 0.5, MINT((0.6 + 0.35 * Math.max(0, 1 - u)) * f));
          circle(ctx, x, y, wr, MINT((0.55 + 0.4 * Math.max(0, 1 - u)) * f), undefined, 1.2);
        });
      } else if (ctrl && t >= CS_CTRL + r * 0.07 && f > 0) {
        const p = span(t, CS_CTRL + r * 0.07, CS_CTRL + r * 0.07 + 0.35) * f;
        circle(ctx, x, y, wr, PAPER(0.2 + 0.6 * p));
        dot(ctx, x, y, 1.4, PAPER(0.75 * p));
      } else {
        circle(ctx, x, y, wr, PAPER(0.16));
      }
    }

  // the picks travel: a hairline to the port, then a fan out to their rows
  PICKS.forEach((_, k) => {
    const u = (t - sendAt(k)) / CS_SEND_DUR;
    if (u <= 0 || u >= 1) return;
    const { at, upto } = along(g.sends[k], easeInOut(u));
    trailSmooth(ctx, upto, g.wide ? 56 : 48, MINT, 1.8);
    head(ctx, T, at[0], at[1], MINT, 0.75);
  });

  // labels under the plate, with leaders
  const lp = span(t, CS_CTRL + 0.3, CS_CTRL + 0.9) * f;
  if (lp > 0) {
    const base = pl.y + ph + m;
    const ly = base + 22;
    const [cx0] = wellXY(g, 0, 0);
    const [rx] = wellXY(g, TRIPLET_AT[CS_ROWS - 1] + 1, CS_ROWS - 1); // middle replicate of the last row
    line(ctx, cx0, base + 3, cx0, ly - 12, PAPER(0.3 * lp));
    line(ctx, rx, base + 3, rx, ly - 12, MINT(0.45 * lp));
    spaced(ctx, cx0 - 4, ly, typed('CONTROLS', lp), PAPER(0.7 * lp), 'left', g.cap, g.track);
    spaced(ctx, rx, ly, typed('REPLICATES', lp), MINT(0.85 * lp), 'center', g.cap, g.track);
  }
}

/** The eased travels: at what share of the time does an eased run reach share u? */
function inverseEase(u: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (easeInOut(mid) < u) lo = mid;
    else hi = mid;
  }
  return lo;
}

function CandidateCanvas({ running, allowed, paused, setPaused }: FrameMotion) {
  const cache = useRef<CsGeo | null>(null);
  const { canvasRef } = usePlate({
    layout: (cssW) => {
      const wide = cssW >= CS_WIDE_MIN;
      return { w: Math.round(cssW), h: wide ? CS_H_WIDE : CS_H_NARROW, key: wide ? 'wide' : 'narrow' };
    },
    running,
    allowed,
    stillAt: CS_STILL,
    draw: (ctx, { t, layout, moving }) => {
      const wide = layout.key === 'wide';
      let g = cache.current;
      if (!g || g.w !== layout.w || g.wide !== wide) {
        g = csGeometry(layout.w, wide);
        cache.current = g;
      }
      // the clock starts at stillAt: count the loop from there
      drawSelection(ctx, g, moving ? (t - CS_STILL + CS_LOOP) % CS_LOOP : CS_STILL);
    },
  });
  return (
    <div className="pl-plate cs-plate">
      <div className="pl-canvas-box cs-box">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Three inputs, prior observations, objectives and constraints, feed one node that proposes a batch from a field of candidate conditions. The prior observations appear as measured points, the objective as contours, and the constraint as a boundary that strikes out the conditions beyond it. A scan selects six conditions, some near the best expected outcome and some in unexplored regions; the rest are dimmed. The selected conditions leave the field through one port and fan out to a plate, each as three replicate wells in its own row, beside a column of control wells."
        />
      </div>
      <div className="pl-controls">
        <DiagramMotionButton
          allowed={allowed}
          paused={paused}
          onToggle={() => setPaused(!paused)}
          name="evidence informs the next batch"
          className="pl-motion-btn"
        />
      </div>
    </div>
  );
}

export function CandidateSelection() {
  return (
    <BlueprintFrame
      className="candidate-blueprint"
      title="Evidence informs the next batch"
      caption="Prior observations, objectives, and constraints inform which conditions to investigate. The proposed batch includes the controls and replicates the question requires."
      controlInPlate
    >
      {(motion) => <CandidateCanvas {...motion} />}
    </BlueprintFrame>
  );
}
