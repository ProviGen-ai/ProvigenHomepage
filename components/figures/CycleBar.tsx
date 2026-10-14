'use client';

import { useRef } from 'react';
import { DiagramMotionButton, along, straight, trailSmooth } from '@/components/Blueprint';
import { usePlate, type PlateLayout } from '@/components/plate/usePlate';
import {
  PLATE as T,
  MINT,
  MINT_HOT,
  ORANGE,
  PAPER,
  circle,
  clamp01,
  dot,
  ease,
  easeInOut,
  easeOut,
  glowStroke,
  ground,
  halo,
  hash,
  head,
  line,
  lit,
  measure,
  spaced,
  span,
  text,
  typed,
  type Align,
  type Ctx,
} from '@/components/plate/kit';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import '@/components/plate/Plate.css';

/*
 * Fig. 01 · A ten-day cycle, drawn on a dark plate (components/plate/kit.ts).
 *
 * Ten day columns under a ticked ruler, and two runs of the same cycle. The
 * upper run is the cycle as it is: two days of thinking (a dotted paper
 * stroke: a different kind of time), then culture, handling and measurement
 * (mint: physical days). In the lower run the thinking is instantaneous. A
 * funnel joins the upper run's two thinking days to the lower run's origin:
 * light runs down it, the two days collapse into one bright spike, and only
 * then do both comets leave. Faint shear lines join every later phase
 * boundary above to the same boundary two days earlier below, so the shift
 * is drawn, not inferred. The lower run ends on day 08 ("Cycle 10 → 8 days"),
 * and the eight physical days it still needs are bracketed in orange: the
 * constraint. Then each of those eight days is carried by a short light down
 * into one of three dashed lanes, 3 / 3 / 2 ("Change the experiment": dashed
 * is a goal, not a result, so nothing runs on the lanes).
 *
 * Each phase draws its own interior as the comet passes: a node-link sketch
 * of ideas while thinking (paper), a lineage of cells doubling day by day in
 * culture, hand-off chevrons while handling, a readout trace while measuring.
 * Light is only where something is happening; what has passed settles to a
 * low record. Structure and interiors are built once per size and cached.
 *
 * The plate is drawn at one logical px per CSS px (the article column is
 * narrow, so text keeps its size at every width); the row layout switches at
 * 640 px, and the CSS reserves the matching height so nothing below moves.
 * The bottom-right corner stays clear for the Pause / Play control.
 * Reduced motion: one still with both runs, the funnel, the bracket and the
 * lanes complete.
 */

const DAYS = 10;
const THINK_DAYS = 2;
const RUN_DAYS = DAYS - THINK_DAYS;

type PhaseDef = { label: string; from: number; to: number };
/* The cycle as it is, in days [from, to). */
const PHASES: PhaseDef[] = [
  { label: 'THINK', from: 0, to: 2 },
  { label: 'CULTURE', from: 2, to: 6 },
  { label: 'HANDLE', from: 6, to: 8 },
  { label: 'MEASURE', from: 8, to: 10 },
];
/* With the thinking instantaneous: the physical phases, two days earlier. */
const PHYSICAL = PHASES.slice(1).map((p) => ({
  ...p,
  from: p.from - THINK_DAYS,
  to: p.to - THINK_DAYS,
}));
/* The eight physical days land in lanes of 3 / 3 / 2. */
const LANE_COLS = 3;
const laneDays = (i: number) => (i < 2 ? LANE_COLS : RUN_DAYS - 2 * LANE_COLS);

const LABEL_THINK = 'THINKING → INSTANTANEOUS';
const LABEL_THINK_NARROW = ['THINKING →', 'INSTANTANEOUS'];
const LABEL_READOUT = 'CYCLE 10 → 8 DAYS';
const LABEL_FLOOR = 'PHYSICAL DAYS · THE CONSTRAINT';
const LABEL_LANES = 'CHANGE THE EXPERIMENT';
const LABEL_GOAL = 'DASHED = GOAL, NOT RESULT';

/* ---------- clock (seconds) ---------- */
const DAY = 0.42; // one day of the cycle
const T0 = 0.5; // light starts down the funnel
const T_PEAK = T0 + 0.42; // ... and reaches the origin: the flash peaks
const T_FLASH = 1.6; // the flash and its ring take this long to fade
const T_RUN = T_PEAK + 0.3; // both comets leave, a beat after the flash
const T_R2_END = T_RUN + RUN_DAYS * DAY;
const T_R1_END = T_RUN + DAYS * DAY;
const T_READ = T_R2_END + 0.1;
const T_SHEAR = T_R1_END + 0.1; // light runs down the shear lines
const T_FLOOR = T_R1_END + 0.45; // the bracket draws under the eight days
const T_FAN = T_FLOOR + 0.9;
const COPY = 0.55; // a day's light from the lower run to its lane
const T_LANES = T_FAN + 1.15; // the lane notes type in as the last copies land
const T_OUT = 10.5;
const LOOP = 11.1;
/** The reduced-motion still: everything has landed, no comet in flight. */
const STILL = 10;

/* ---------- layout ---------- */
const NARROW_MAX = 639; // matches the container query in CycleBar.css
const H_WIDE = 396;
const H_NARROW = 436;

type Box = { x0: number; x1: number; y0: number; y1: number };
type Line2 = [number, number][];
type Cell = { x: number; y: number; day: number; parent: number };
type RunInteriors = {
  /** Middle of the interior band. */
  mid: number;
  think: { nodes: [number, number][]; links: [number, number][] } | null;
  cells: Cell[];
  chevrons: number[];
  trace: Line2;
};

type Geo = {
  key: string;
  narrow: boolean;
  w: number;
  h: number;
  x0: number;
  P: number;
  dayY: number;
  rulerY: number;
  r1: number;
  r2: number;
  tagDy: number;
  /** Band above a row where the phase interiors draw: [top, bottom] offsets. */
  band: [number, number];
  thinkLabel: { x: number; ys: number[]; lines: string[] };
  /** Left edge and baseline of the readout (text that types in grows rightward). */
  readout: [number, number];
  floorY: number;
  floorLabel: [number, number];
  lanes: [number, number, number];
  notes: [number, number, number];
  cap: number; // caps label size
  small: number; // day numbers
  track: number; // caps tracking (em)
  cell: number; // culture cell radius
  /* cached structure */
  ruler: Path2D;
  minor: Path2D;
  cols: Path2D;
  tracks: Path2D;
  laneTracks: Path2D;
  /** Funnel edges (row 1's thinking days → row 2's origin) and shear lines, dense. */
  funnel: Line2[];
  shears: Line2[];
  funnelPath: Path2D;
  shearPath: Path2D;
  /** Day i of the lower run → its slot on a lane, dense. */
  copies: Line2[];
  runs: [RunInteriors, RunInteriors];
};

const X = (g: { x0: number; P: number }, day: number) => g.x0 + day * g.P;
const GAP = 3; // between a phase span and its neighbour

const capWidth = (ctx: Ctx, s: string, size: number, track: number) =>
  measure(ctx, s, size) + Math.max(0, s.length - 1) * size * track;

function geometry(ctx: Ctx, w: number, narrow: boolean): Geo {
  const base = narrow
    ? {
        x0: 16,
        dayY: 22,
        rulerY: 32,
        r1: 84,
        r2: 216,
        tagDy: 22,
        band: [-22, -8] as [number, number],
        floorDy: 52,
        lanes: [310, 330, 350] as [number, number, number],
        cap: 10,
        small: 10,
        track: 0.06,
        cell: 1.05,
      }
    : {
        x0: 40,
        dayY: 28,
        rulerY: 40,
        r1: 104,
        r2: 222,
        tagDy: 24,
        band: [-30, -8] as [number, number],
        floorDy: 38,
        lanes: [306, 330, 354] as [number, number, number],
        cap: 11,
        small: 10,
        track: 0.16,
        cell: 1.35,
      };
  const { x0, r1, r2, tagDy, band, cap, track, lanes } = base;
  const P = (w - 2 * x0) / DAYS;
  const g0 = { x0, P };
  const at = (d: number) => X(g0, d);
  // the shear region: lines leave row 1 at yS and meet row 2's band at yA
  const yS = r1 + tagDy + 8;
  const yA = r2 + band[0] - 3;
  const shearX = (d: number, y: number) => at(d) - THINK_DAYS * P * clamp01((y - yS) / (yA - yS));

  // the thinking label sits in the free band right of the funnel
  const lines = narrow ? LABEL_THINK_NARROW : [LABEL_THINK];
  const lh = cap + 3;
  const mid = (yS + yA) / 2;
  const ys = lines.map((_, i) => Math.round(mid + cap * 0.35 + (i - (lines.length - 1) / 2) * lh));
  const thinkX = Math.round(Math.max(...ys.map((y) => shearX(THINK_DAYS, y - cap * 0.8))) + (narrow ? 7 : 12));

  // readout: right of row 2's end (wide), or right-aligned under it (narrow)
  const rw = capWidth(ctx, LABEL_READOUT, cap, track);
  const readout: [number, number] = narrow
    ? [at(RUN_DAYS) - rw, r2 + 40]
    : [Math.min(at(RUN_DAYS) + 28, w - 14 - rw), r2 + 4];
  // the bracket under the eight physical days, its label centred below it
  const floorY = r2 + base.floorDy;
  const fw = capWidth(ctx, LABEL_FLOOR, cap, track);
  const floorLabel: [number, number] = [Math.round(at(RUN_DAYS / 2) - fw / 2), floorY + 16];
  const notes: [number, number, number] = narrow
    ? [x0, lanes[2] + 30, lanes[2] + 46]
    : [at(LANE_COLS) + 30, lanes[1] - 7, lanes[1] + 11];

  /* where text sits, so the dotted day columns can stop around it */
  const box = (x: number, y: number, wd: number, align: Align): Box => {
    const l = align === 'left' ? x : align === 'right' ? x - wd : x - wd / 2;
    return { x0: l - 6, x1: l + wd + 6, y0: y - cap - 2, y1: y + 5 };
  };
  const boxes: Box[] = [
    { x0: -1, x1: w + 1, y0: r1 + tagDy - 13, y1: r1 + tagDy + 5 },
    { x0: -1, x1: w + 1, y0: r2 + tagDy - 13, y1: r2 + tagDy + 5 },
    ...lines.map((s, i) => box(thinkX, ys[i], capWidth(ctx, s, cap, track), 'left')),
    box(readout[0], readout[1], rw, 'left'),
    box(floorLabel[0], floorLabel[1], fw, 'left'),
    box(notes[0], notes[1], capWidth(ctx, LABEL_LANES, cap, track), 'left'),
    box(notes[0], notes[2], capWidth(ctx, LABEL_GOAL, cap, track), 'left'),
  ];

  /* ruler: day boundaries long, half days medium, quarter days short */
  const ruler = new Path2D();
  const minor = new Path2D();
  ruler.moveTo(at(0), base.rulerY);
  ruler.lineTo(at(DAYS), base.rulerY);
  for (let q = 0; q <= DAYS * 4; q++) {
    const x = at(q / 4);
    const p = q % 4 === 0 ? ruler : minor;
    p.moveTo(x, base.rulerY);
    p.lineTo(x, base.rulerY + (q % 4 === 0 ? 7 : q % 2 === 0 ? 4 : 2));
  }
  /* row tracks with dial ticks at each day; taller marks at the phase ends */
  const tracks = new Path2D();
  const rows: [number, number, PhaseDef[]][] = [
    [r1, DAYS, PHASES],
    [r2, RUN_DAYS, PHYSICAL],
  ];
  for (const [y, n, list] of rows) {
    tracks.moveTo(at(0), y);
    tracks.lineTo(at(n), y);
    for (let d = 0; d <= n; d++) {
      tracks.moveTo(at(d), y - 3);
      tracks.lineTo(at(d), y + 3);
    }
    for (const p of list)
      for (const d of [p.from, p.to]) {
        tracks.moveTo(at(d), y - 6);
        tracks.lineTo(at(d), y + 6);
      }
  }
  /* lanes: a plain rail with day ticks (the dashes on top keep one rhythm) */
  const laneTracks = new Path2D();
  lanes.forEach((y, i) => {
    laneTracks.moveTo(at(0), y);
    laneTracks.lineTo(at(laneDays(i)), y);
    for (let d = 0; d <= laneDays(i); d++) {
      laneTracks.moveTo(at(d), y - 2);
      laneTracks.lineTo(at(d), y + 2);
    }
  });
  /* dotted day columns, broken around text */
  const cols = new Path2D();
  const top = base.rulerY + 12;
  const bottom = lanes[2] + 12;
  for (let d = 0; d <= DAYS; d++) {
    const x = at(d);
    const gaps = boxes
      .filter((b) => x > b.x0 && x < b.x1)
      .map((b) => [b.y0, b.y1] as const)
      .sort((a, b) => a[0] - b[0]);
    let y = top;
    for (const [a, b] of gaps) {
      if (a > y) {
        cols.moveTo(x, y);
        cols.lineTo(x, a);
      }
      y = Math.max(y, b);
    }
    if (bottom > y) {
      cols.moveTo(x, y);
      cols.lineTo(x, bottom);
    }
  }

  /*
   * The funnel: the ends of row 1's two thinking days (day 0 and day 2) run
   * down and meet at row 2's origin. The shear lines do the same for each
   * later boundary: day d above to day d - 2 below.
   */
  const leg = (d: number): Line2 => [
    ...straight([at(d), r1 + 7], [at(d), yS], 3),
    ...straight([at(d), yS], [at(d - THINK_DAYS), yA], 3).slice(1),
    ...straight([at(d - THINK_DAYS), yA], [at(d - THINK_DAYS), r2 - 7], 3).slice(1),
  ];
  const funnel = [straight([at(0), r1 + 7], [at(0), r2 - 7], 3), leg(THINK_DAYS)];
  const shears = [6, 8, 10].map(leg);
  /*
   * The copies: from the middle of each lower-run day, an S-curve down
   * through the bracket to the start of its slot on a lane, where the dash
   * then unrolls.
   */
  const copies = Array.from({ length: RUN_DAYS }, (_, i): Line2 => {
    const lane = Math.floor(i / LANE_COLS);
    const a: [number, number] = [at(i + 0.5), r2 + 4];
    const b: [number, number] = [at(i - lane * LANE_COLS) + GAP, lanes[lane]];
    return bezier(a, [a[0], floorY + 6], [b[0], b[1] - 26], b, 40);
  });
  const toPath = (list: Line2[]) => {
    const p = new Path2D();
    for (const pts of list) pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    return p;
  };

  const bandOf = (y: number): [number, number] => [y + band[0], y + band[1]];
  return {
    ...base,
    key: `${w}:${narrow}`,
    narrow,
    w,
    h: narrow ? H_NARROW : H_WIDE,
    P,
    thinkLabel: { x: thinkX, ys, lines },
    readout,
    floorY,
    floorLabel,
    notes,
    ruler,
    minor,
    cols,
    tracks,
    laneTracks,
    funnel,
    shears,
    funnelPath: toPath(funnel),
    shearPath: toPath(shears),
    copies,
    runs: [buildRun(g0, PHASES, bandOf(r1), narrow), buildRun(g0, PHYSICAL, bandOf(r2), narrow)],
  };
}

/** A cubic Bézier as a dense polyline. */
function bezier(a: [number, number], b: [number, number], c: [number, number], d: [number, number], n: number): Line2 {
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    const m = 1 - u;
    const k = [m * m * m, 3 * m * m * u, 3 * m * u * u, u * u * u];
    return [k[0] * a[0] + k[1] * b[0] + k[2] * c[0] + k[3] * d[0], k[0] * a[1] + k[1] * b[1] + k[2] * c[1] + k[3] * d[1]];
  });
}

/* ---------- phase interiors, built once per size ---------- */

function buildRun(
  g: { x0: number; P: number },
  phases: PhaseDef[],
  [top, bot]: [number, number],
  narrow: boolean,
): RunInteriors {
  const mid = (top + bot) / 2;
  const out: RunInteriors = { mid, think: null, cells: [], chevrons: [], trace: [] };
  for (const p of phases) {
    const a = X(g, p.from) + GAP;
    const b = X(g, p.to) - GAP;
    if (p.label === 'THINK') {
      // ideas: a node-link sketch, a few nodes a day, each tied back to one or two before it
      const n = (p.to - p.from) * (narrow ? 3 : 5);
      const nodes: [number, number][] = [];
      const links: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const x = a + 4 + ((i + 0.5) / n) * (b - a - 8) + (hash(i, 21) - 0.5) * ((b - a) / n) * 0.7;
        nodes.push([x, top + 2 + hash(i, 22) * (bot - top - 4)]);
        if (i > 0) links.push([i - 1, i]);
        if (i > 1 && hash(i, 23) > 0.45) links.push([i - 2, i]);
      }
      out.think = { nodes, links };
    } else if (p.label === 'CULTURE') {
      // cells doubling, one column a day on a fixed grid (1, 2, 4, 8), each tied to its parent
      const s = (bot - top) / 4;
      const c = narrow ? 3.2 : 4.5; // half the gap between the last day's two columns
      let prev: number[] = [];
      for (let d = 0; d < p.to - p.from; d++) {
        const cx = X(g, p.from + d + 0.5);
        const n = 1 << d;
        const here: number[] = [];
        for (let k = 0; k < n; k++) {
          let x = cx;
          let y = mid;
          if (n === 2) y = mid + (k - 0.5) * 2 * s;
          else if (n === 4) y = mid + (k - 1.5) * s;
          else if (n >= 8) {
            x = cx + (k % 2 ? c : -c);
            y = mid + (Math.floor(k / 2) - 1.5) * s;
          }
          here.push(out.cells.length);
          out.cells.push({ x, y, day: p.from + d, parent: prev.length ? prev[Math.floor(k / 2)] : -1 });
        }
        prev = here;
      }
    } else if (p.label === 'HANDLE') {
      // hand-offs: chevrons, one sample moved on at a time
      const n = Math.max(3, Math.floor((b - a - 4) / (narrow ? 8 : 12)));
      for (let k = 0; k < n; k++) out.chevrons.push(a + 2 + ((k + 0.5) / n) * (b - a - 4));
    } else {
      // a readout trace: a damped response with a little noise
      for (let x = a + 3; x <= b - 3; x += 2) {
        const u = (x - a) / (b - a);
        const v = 0.5 + 0.4 * Math.sin(u * 9.4) * Math.exp(-u * 1.2) + 0.1 * (hash(Math.round(x), 9) - 0.5);
        out.trace.push([x, bot - 1 - v * (bot - top - 2)]);
      }
    }
  }
  return out;
}

/*
 * A run's interiors up to x = upto (the comet, or everything once passed).
 * Brightness falls off behind the comet; the culture generation of the day
 * the comet is in is drawn hot.
 */
function drawInteriors(ctx: Ctx, g: Geo, run: RunInteriors, upto: number, racing: boolean, t: number, f: number) {
  const glow = (x: number) => {
    const behind = upto - x;
    return behind < 0 ? 0 : (0.42 + 0.55 * Math.exp(-behind / 30)) * f;
  };
  const liveDay = racing ? Math.floor((upto - g.x0) / g.P) : -1;
  const half = (g.band[1] - g.band[0]) / 2 - 3;
  lit(ctx, T, () => {
    ctx.lineWidth = 1;
    // thinking: paper, not mint (a different kind of time)
    if (run.think) {
      const { nodes, links } = run.think;
      for (const [i, j] of links) {
        const [bx, by] = nodes[j];
        if (bx > upto) continue;
        ctx.strokeStyle = PAPER(0.3 * glow(bx));
        ctx.beginPath();
        ctx.moveTo(nodes[i][0], nodes[i][1]);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
      const seed = Math.floor(t * 9);
      nodes.forEach(([x, y], i) => {
        if (x > upto) return;
        const flick = racing && upto - x < 60 ? (hash(i, seed) > 0.5 ? 1 : 0.5) : 0.85;
        dot(ctx, x, y, 1.15, PAPER(0.8 * glow(x) * flick));
      });
    }
    // culture: the lineage (hairlines), then the cells
    for (const c of run.cells) {
      if (c.parent < 0 || c.x - g.P * 0.3 > upto) continue;
      const p = run.cells[c.parent];
      ctx.strokeStyle = MINT(0.22 * glow(c.x));
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
    }
    for (const c of run.cells) {
      if (c.x - g.P * 0.3 > upto) continue;
      if (c.day === liveDay) dot(ctx, c.x, c.y, g.cell + 0.2, MINT_HOT(0.95 * f));
      else dot(ctx, c.x, c.y, g.cell, MINT(Math.max(0.55 * f, glow(c.x))));
    }
    // handling: chevrons
    for (const x of run.chevrons) {
      if (x > upto) break;
      ctx.strokeStyle = MINT(glow(x));
      ctx.beginPath();
      ctx.moveTo(x - half * 0.42, run.mid - half);
      ctx.lineTo(x + half * 0.42, run.mid);
      ctx.lineTo(x - half * 0.42, run.mid + half);
      ctx.stroke();
    }
  });
  // measuring: the trace plots as the comet passes
  const tr = run.trace;
  if (tr.length > 1 && upto > tr[0][0]) {
    const n = Math.min(tr.length, Math.floor((upto - tr[0][0]) / 2) + 1);
    if (n > 1) {
      lit(ctx, T, () => {
        ctx.strokeStyle = MINT(0.45 * f);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tr[0][0], tr[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(tr[i][0], tr[i][1]);
        ctx.stroke();
      });
      if (n < tr.length) trailSmooth(ctx, tr, 28, MINT, 1.4, f, n);
    }
  }
}

/* ---------- one run of the cycle ---------- */

/*
 * Comet tail along a straight row: a tapered wedge filled with a gradient
 * (clear at the tail, bright at the head) and a thin hot core over the last
 * stretch. One gradient has no beading where segments overlap under
 * additive light.
 */
function trailLine(ctx: Ctx, from: number, x: number, y: number, len: number, width: number, a = 1) {
  const x0 = Math.max(from, x - len);
  if (x - x0 < 1) return;
  lit(ctx, T, () => {
    const g = ctx.createLinearGradient(x0, 0, x, 0);
    g.addColorStop(0, MINT(0));
    g.addColorStop(1, MINT(0.6 * a));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x, y - width / 2);
    ctx.lineTo(x, y + width / 2);
    ctx.closePath();
    ctx.fill();
    const c0 = Math.max(from, x - len * 0.45);
    const core = ctx.createLinearGradient(c0, 0, x, 0);
    core.addColorStop(0, MINT_HOT(0));
    core.addColorStop(1, MINT_HOT(0.85 * a));
    ctx.strokeStyle = core;
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(c0, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
}

function drawRun(ctx: Ctx, g: Geo, phases: PhaseDef[], run: RunInteriors, y: number, day: number, t: number, f: number) {
  const end = phases[phases.length - 1].to;
  const racing = day > 0 && day < end;
  const cx = X(g, day);
  for (const p of phases) {
    const a = X(g, p.from) + GAP;
    const upto = Math.min(cx, X(g, p.to) - GAP);
    if (upto <= a) continue;
    if (p.label === 'THINK') {
      // thinking time: a dotted paper stroke, not the mint of physical days
      line(ctx, a, y, upto, y, PAPER(0.7 * f), 1, [1, 3]);
    } else lit(ctx, T, () => line(ctx, a, y, upto, y, MINT(0.5 * f), 1.5));
  }
  drawInteriors(ctx, g, run, Math.min(cx, X(g, end) - GAP), racing, t, f);
  // tags: lit while their phase runs
  for (const p of phases) {
    const active = racing && day >= p.from && day < p.to;
    const mid = (X(g, p.from) + X(g, p.to)) / 2;
    const on = p.label === 'THINK' ? PAPER(0.95) : MINT(0.95);
    spaced(ctx, mid, y + g.tagDy, p.label, active ? on : PAPER(0.5), 'center', g.cap, g.track);
  }
  if (racing) {
    trailLine(ctx, X(g, 0), cx, y, g.narrow ? 54 : 96, 3.4);
    head(ctx, T, cx, y);
  }
}

/** The ring that marks a run arriving at its end (capped at r 14, clear of the readout). */
function arrival(ctx: Ctx, x: number, y: number, u: number) {
  if (u <= 0 || u >= 1) return;
  lit(ctx, T, () => circle(ctx, x, y, 4 + 10 * easeOut(u), MINT(0.7 * (1 - u))));
}

/* ---------- frame ---------- */

function drawCycle(ctx: Ctx, g: Geo, t: number) {
  ground(ctx, T, g.w, g.h);
  const f = 1 - span(t, T_OUT, LOOP - 0.05); // everything dynamic fades before the loop restarts
  const d1 = Math.max(0, Math.min(DAYS, (t - T_RUN) / DAY));
  const d2 = Math.max(0, Math.min(RUN_DAYS, (t - T_RUN) / DAY));
  const x0 = X(g, 0);

  /* structure */
  ctx.lineWidth = 1;
  ctx.strokeStyle = PAPER(0.2);
  ctx.stroke(g.ruler);
  ctx.strokeStyle = PAPER(0.1);
  ctx.stroke(g.minor);
  ctx.setLineDash([1, 4]);
  ctx.strokeStyle = PAPER(0.11);
  ctx.stroke(g.cols);
  ctx.setLineDash([]);
  ctx.strokeStyle = PAPER(0.16);
  ctx.stroke(g.tracks);
  ctx.strokeStyle = PAPER(0.1);
  ctx.stroke(g.shearPath);
  ctx.strokeStyle = PAPER(0.2);
  ctx.stroke(g.funnelPath);

  /* day numbers: lit as the upper comet crosses them */
  const racing1 = t > T_RUN && t < T_R1_END;
  for (let i = 0; i < DAYS; i++) {
    const cx = X(g, i + 0.5);
    const near = racing1 ? clamp01(1 - Math.abs(d1 - (i + 0.5)) / 0.75) : 0;
    const s = String(i + 1).padStart(2, '0');
    text(ctx, cx, g.dayY, s, PAPER(0.36 * (1 - near)), 'center', g.small);
    if (near > 0) lit(ctx, T, () => text(ctx, cx, g.dayY, s, MINT(0.95 * near), 'center', g.small));
  }

  /* row 1: the cycle as it is */
  drawRun(ctx, g, PHASES, g.runs[0], g.r1, d1, t, f);
  arrival(ctx, X(g, DAYS), g.r1, (t - T_R1_END) / 0.7);

  /*
   * The collapse: light runs down both edges of the funnel from row 1's two
   * thinking days, which flare and fade as it leaves them; at the origin it
   * becomes one bright spike with a slow ring. The comets leave a beat later.
   */
  const pu = (t - T0) / (T_PEAK - T0);
  if (pu > 0 && pu < 1.4) {
    const take = 1 - ease(pu / 1.4);
    lit(ctx, T, () => line(ctx, x0 + GAP, g.r1, X(g, THINK_DAYS) - GAP, g.r1, PAPER(0.55 * take), 1.5));
    if (pu < 1)
      for (const edge of g.funnel) {
        const { at, upto } = along(edge, easeInOut(pu));
        trailSmooth(ctx, upto, 46, MINT, 1.6);
        lit(ctx, T, () => dot(ctx, at[0], at[1], 1.8, MINT_HOT(0.95)));
      }
  }
  const fu = (t - T_PEAK) / T_FLASH;
  const flash = fu >= 0 && fu < 1 ? 1 - ease(fu) : 0;
  if (flash > 0) {
    lit(ctx, T, () => {
      ctx.lineWidth = 1;
      ctx.strokeStyle = MINT(0.55 * flash);
      ctx.stroke(g.funnelPath);
    });
  }
  // the spike: row 2's thinking, all of it, in no time
  const top = g.r2 + g.band[0] - 3;
  glowStroke(
    ctx,
    T,
    (c) => {
      c.moveTo(x0, top);
      c.lineTo(x0, g.r2 + 8);
    },
    flash > 0.2 ? MINT_HOT : MINT,
    1,
    (0.5 + 0.5 * flash) * f,
  );
  if (flash > 0) {
    // narrow plates put the origin 16 px from the edge: the rings stay inside it
    const [hr, ra, rb] = g.narrow ? [8 + 8 * flash, 9, 6] : [20 + 22 * flash, 42, 22];
    halo(ctx, T, x0, g.r2, hr, MINT, 0.7 * flash);
    lit(ctx, T, () => {
      circle(ctx, x0, g.r2, 5 + ra * easeOut(fu), MINT(0.7 * flash));
      circle(ctx, x0, g.r2, 3 + rb * easeOut(fu * 1.3), MINT(0.4 * flash));
    });
  }
  lit(ctx, T, () => dot(ctx, x0, g.r2, 2.2, MINT_HOT((0.65 + 0.35 * flash) * f)));
  const tp = span(t, T_PEAK + 0.05, T_PEAK + 0.7);
  if (tp > 0) {
    const { x, ys, lines } = g.thinkLabel;
    const all = lines.join('\n');
    const shown = typed(all, tp).split('\n');
    shown.forEach((s, i) => spaced(ctx, x, ys[i], s, MINT((0.82 + 0.18 * flash) * f), 'left', g.cap, g.track));
  }

  /* row 2: the same physical days, from the origin */
  drawRun(ctx, g, PHYSICAL, g.runs[1], g.r2, d2, t, f);
  arrival(ctx, X(g, RUN_DAYS), g.r2, (t - T_R2_END) / 0.7);

  /* readout: types in as the lower run ends */
  const rp = span(t, T_READ, T_READ + 0.55);
  if (rp > 0) spaced(ctx, g.readout[0], g.readout[1], typed(LABEL_READOUT, rp), PAPER(0.92 * f), 'left', g.cap, g.track);

  /* the shift, drawn: light runs down each shear line, day d above to d − 2 below */
  g.shears.forEach((pts, k) => {
    const u = (t - T_SHEAR - k * 0.14) / 0.6;
    if (u <= 0 || u >= 1) return;
    const { at, upto } = along(pts, easeInOut(u));
    trailSmooth(ctx, upto, 36, MINT, 1.3, 0.85);
    lit(ctx, T, () => dot(ctx, at[0], at[1], 1.5, MINT_HOT(0.9)));
  });

  /*
   * The eight days are copied into three lanes (3 / 3 / 2), day by day: each
   * day of the lower run pulses, and a short light carries it from its slot
   * down to its slot on a lane, where its dashed copy draws in. The lanes are
   * a goal, so they stay still once filled: no comets run on them. The rails
   * only appear when the copying starts. (Drawn before the bracket, so the
   * bracket's label stays on top where a light crosses it.)
   */
  const rails = span(t, T_FAN - 0.25, T_FAN + 0.25) * f;
  if (rails > 0) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = PAPER(0.12 * rails);
    ctx.stroke(g.laneTracks);
  }
  const len = g.P - 2 * GAP;
  g.copies.forEach((pts, i) => {
    const t0 = T_FAN + i * 0.1;
    const lane = Math.floor(i / LANE_COLS);
    const col = i - lane * LANE_COLS;
    const pulse = 1 - clamp01((t - t0) / 0.6);
    if (t > t0 && pulse > 0)
      lit(ctx, T, () => line(ctx, X(g, i) + GAP, g.r2, X(g, i + 1) - GAP, g.r2, MINT_HOT(0.8 * pulse * f), 1.5));
    const m = (t - t0) / COPY;
    if (m > 0 && m < 1) {
      const { at, upto } = along(pts, easeInOut(m));
      trailSmooth(ctx, upto, g.narrow ? 30 : 44, MINT, 1.4, 0.9);
      lit(ctx, T, () => dot(ctx, at[0], at[1], 1.6, MINT_HOT(0.95)));
    }
    const u = easeOut((t - t0 - COPY * 0.85) / 0.3);
    if (u <= 0) return;
    const x = X(g, col) + GAP;
    const land = 1 - clamp01((t - t0 - COPY) / 0.5); // brighter just as it lands
    lit(ctx, T, () => {
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = X(g, col) - x0;
      line(ctx, x, g.lanes[lane], x + len * u, g.lanes[lane], MINT((0.55 + 0.35 * land) * f), 1.2);
      ctx.lineDashOffset = 0;
      ctx.setLineDash([]);
    });
  });

  /*
   * The constraint: an orange bracket under the eight physical days. Orange
   * marks a limit, not live light, so it is drawn plainly over the ground
   * (additive light would push it toward gold); only the travelling end
   * carries a halo.
   */
  const fp = easeInOut((t - T_FLOOR) / 0.7);
  if (fp > 0) {
    const y = g.floorY;
    const x8 = X(g, RUN_DAYS);
    const xe = x0 + (x8 - x0) * fp;
    const c = ORANGE(0.85 * f);
    line(ctx, x0, y, xe, y, c, 1);
    line(ctx, x0, y - 0.5, x0, y - 6, c, 1);
    for (let d = 1; d < RUN_DAYS; d++)
      if (X(g, d) <= xe) line(ctx, X(g, d), y - 0.5, X(g, d), y - 3, ORANGE(0.5 * f), 1);
    if (fp >= 1) line(ctx, x8, y - 0.5, x8, y - 6, c, 1);
    else {
      halo(ctx, T, xe, y, 10, ORANGE, 0.35);
      dot(ctx, xe, y, 1.6, ORANGE(1));
    }
    const lp = span(t, T_FLOOR + 0.25, T_FLOOR + 0.95);
    if (lp > 0) spaced(ctx, g.floorLabel[0], g.floorLabel[1], typed(LABEL_FLOOR, lp), c, 'left', g.cap, g.track);
  }

  /* notes */
  const [nx, n1, n2] = g.notes;
  const np = span(t, T_LANES, T_LANES + 0.6);
  if (np > 0) spaced(ctx, nx, n1, typed(LABEL_LANES, np), MINT(0.9 * f), 'left', g.cap, g.track);
  const gp = span(t, T_LANES + 0.5, T_LANES + 1.1);
  if (gp > 0) spaced(ctx, nx, n2, typed(LABEL_GOAL, gp), PAPER(0.5 * f), 'left', g.cap, g.track);
}

/* ---------- component ---------- */

const pickLayout = (cssW: number): PlateLayout => {
  const narrow = cssW <= NARROW_MAX;
  return { w: Math.round(cssW), h: narrow ? H_NARROW : H_WIDE, key: narrow ? 'narrow' : 'wide' };
};

export default function CycleBar() {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion();
  const cache = useRef<Geo | null>(null);
  const { canvasRef } = usePlate({
    layout: pickLayout,
    running,
    allowed,
    stillAt: STILL,
    draw: (ctx, { t, layout, moving }) => {
      const narrow = layout.key === 'narrow';
      let g = cache.current;
      if (!g || g.key !== `${layout.w}:${narrow}`) {
        g = geometry(ctx, layout.w, narrow);
        cache.current = g;
      }
      // the clock starts at stillAt: count the loop from there, so motion opens on day 00
      drawCycle(ctx, g, moving ? (t - STILL + LOOP) % LOOP : STILL);
    },
  });
  return (
    <div ref={ref} className="pl-plate cb-plate">
      <div className="pl-canvas-box cb-box">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A ten-day cycle on a ruler of days 01 to 10, run twice. The upper run is the cycle as it is: two days of thinking, then culture, handling and measurement. In the lower run the thinking is instantaneous: the two thinking days funnel into a single flash at the origin, and every later phase boundary moves two days earlier, so the same physical phases end on day 08: cycle 10 to 8 days. The eight physical days are bracketed as the constraint. A dashed row shows those eight days rearranged into three parallel lanes, labelled change the experiment: dashed is a goal, not a result."
        />
      </div>
      <div className="pl-controls">
        <DiagramMotionButton
          allowed={allowed}
          paused={paused}
          onToggle={() => setPaused(!paused)}
          name="the ten-day cycle"
          className="pl-motion-btn"
        />
      </div>
    </div>
  );
}
