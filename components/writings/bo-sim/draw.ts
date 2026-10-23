/*
 * Canvas drawing and timeline for the closed-loop simulation (BoSim.tsx), in
 * the plate kit's language (components/plate/kit.ts) on paper. Free of React: the component owns size, the clock and the controls;
 * model.ts owns the numbers, belief.ts what the model believes; this file
 * owns the picture. A frame is a pure function of (run, τ), τ the time into
 * the run's cycle. Rebuilt 4 Oct 2026 ("improve that simulation by a lot"):
 * the idea has to read at a glance, so every layer says one thing and the
 * legend under each panel names it.
 *
 * Two panels of the same landscape, Branin's contours as hairlines
 * (log-spaced levels, so the three valleys read as nested rings), its three
 * equally good low points marked +.
 *
 * Left, planned up front: the twenty places appear first, all at once, as
 * rings (the plan exists before any result), and each fills as its
 * experiment runs. Right, chosen one at a time, drawn over what the model
 * believes after each measurement (belief.ts):
 *   - a soft teal light where it expects low values (its posterior mean);
 *   - a halftone of dots where it is unsure (its posterior sd: full dots
 *     where it knows nothing, none where it has measured);
 *   - just before each pick, amber isolines closing in on where an
 *     experiment is worth most (augmented expected improvement, the quantity
 *     the pick maximises, at half, three quarters and nine tenths of its
 *     largest value, over a faint amber light), a ring closing on the pick
 *     and a dashed line from the last one.
 * The pick lands as a teal point with a pulse, and the light and the dots
 * then settle into the refitted model. Amber is intent, teal is measured.
 * Each panel rings its best experiment so far, and every mark is clipped to
 * its panel's frame (picks often sit on the domain's edge). The first title
 * row carries the run's counter, "experiment 07 / 20".
 *
 * Below, best value so far for both on one log scale, from the worst value on
 * the domain down to the optimum (dashed): every experiment's own value as a
 * dot, the best so far as a staircase, each line named at its head, the
 * current experiment marked on the axis. Lengths, not numbers.
 *
 * Timing (smoothstep, ease-out for arrivals): the plan's rings draw in, the
 * three starts land on both sides, then one experiment per BEAT on both
 * sides; each model pick is preceded by AIM seconds of its acquisition. After
 * the twentieth, the bests stay ringed (SETTLE), held, and the next seed fades
 * in. Under reduced motion the figure is the finished run, still (STILL).
 */
import {
  INK,
  MINT,
  MINT_HOT,
  ORANGE,
  ORANGE_DEEP,
  PAPER,
  TAU,
  TEAL,
  TEAL_INK,
  clamp01,
  ease,
  easeOut,
  grid,
  measure,
  spaced,
  text,
  type Ctx,
  type Grid,
  type Rgba,
} from '@/components/plate/kit';
import type { PlateLayout } from '@/components/plate/usePlate';
import { F_MAX, F_STAR, MINIMA, N, N_START, braninAt, type Run } from './model';
import { G, NODES, PRIOR, beliefAt, sample, type Belief } from './belief';

/* ---------- look ---------- */

type RGB = readonly [number, number, number];

type Look = {
  readonly name: 'plate' | 'paper';
  readonly ground: string;
  /** How light adds up: additive on the dark plate, plain over on paper. */
  readonly blend: GlobalCompositeOperation;
  /** Structure and text. */
  readonly ink: Rgba;
  readonly planned: Rgba;
  readonly chosen: Rgba;
  /** The chosen side's text (teal itself is too light for small type on paper). */
  readonly chosenText: Rgba;
  /** The core of the newest pick. */
  readonly hot: Rgba;
  /** Where the model will measure next. */
  readonly aim: Rgba;
  readonly beliefRGB: RGB;
  readonly aimRGB: RGB;
  /** Alpha of each layer. */
  readonly a: {
    readonly frame: number;
    readonly corner: number;
    readonly contourHi: number;
    readonly contourLo: number;
    readonly optimum: number;
    readonly haze: number;
    readonly belief: number;
    readonly aimField: number;
    readonly title: number;
    readonly sub: number;
    readonly legend: number;
    readonly quiet: number;
    readonly ring: number;
    readonly dot: number;
    readonly chosenDot: number;
    readonly stair: number;
    readonly scatter: number;
    readonly glow: number;
  };
};

const PLATE_LOOK: Look = {
  name: 'plate',
  ground: '#0e1d1a',
  blend: 'lighter',
  ink: PAPER,
  planned: PAPER,
  chosen: MINT,
  chosenText: MINT,
  hot: MINT_HOT,
  aim: ORANGE,
  beliefRGB: [162, 208, 190],
  aimRGB: [226, 159, 55],
  a: {
    frame: 0.11,
    corner: 0.42,
    contourHi: 0.24,
    contourLo: 0.075,
    optimum: 0.55,
    haze: 0.34,
    belief: 0.5,
    aimField: 0.62,
    title: 0.9,
    sub: 0.5,
    legend: 0.62,
    quiet: 0.42,
    ring: 0.42,
    dot: 0.82,
    chosenDot: 0.9,
    stair: 0.9,
    scatter: 0.5,
    glow: 0.5,
  },
};

const PAPER_LOOK: Look = {
  name: 'paper',
  ground: '#fbf9f6',
  blend: 'source-over',
  ink: INK,
  planned: INK,
  chosen: TEAL,
  chosenText: TEAL_INK,
  hot: TEAL_INK,
  aim: ORANGE_DEEP,
  beliefRGB: [66, 145, 149],
  aimRGB: [226, 159, 55],
  a: {
    frame: 0.1,
    corner: 0.5,
    contourHi: 0.26,
    contourLo: 0.08,
    optimum: 0.6,
    haze: 0.24,
    belief: 0.3,
    aimField: 0.34,
    title: 0.86,
    sub: 0.52,
    legend: 0.66,
    quiet: 0.46,
    ring: 0.4,
    dot: 0.7,
    chosenDot: 1,
    stair: 0.9,
    scatter: 0.5,
    glow: 0.32,
  },
};

/*
 * Paper since 4 Oct 2026: on the dark plate the hairlines and the model's
 * light were thin and hard to read at the article's size, and the field
 * note's other figures sit on paper. The plate look is kept, one word away.
 */
const LOOKS = { plate: PLATE_LOOK, paper: PAPER_LOOK } as const;
const L: Look = LOOKS.paper;
/** The figure's look, for BoSim's class and CSS. */
export const LOOK = L.name;

/* ---------- timeline (seconds into a cycle) ---------- */

/** The plan's twenty rings draw in from PLAN_AT, one every PLAN_GAP, each over PLAN_IN. */
const PLAN_AT = 0.08;
const PLAN_GAP = 0.032;
const PLAN_IN = 0.32;
/** The three starts land on both sides from START, one every START_GAP. */
const START = 1.1;
const START_GAP = 0.18;
/** The first model pick (experiment N_START + 1) lands at LEAD; one more every BEAT. */
export const BEAT = 1.3;
export const LEAD = START + (N_START - 1) * START_GAP + BEAT + 0.15;
/** The acquisition shows for AIM s before a pick lands and fades over AIM_OUT after. */
const AIM = 0.66;
const AIM_OUT = 0.42;
/** After a measurement the model's picture moves to the refitted one over MORPH_IN, from MORPH_AT. */
const MORPH_AT = 0.12;
const MORPH_IN = 0.6;
/** A landing's pulse. */
const PULSE = 0.75;
/** A best-so-far step runs out over this long. */
const RUN_OUT = 0.42;

/** Time the k-th experiment (1-based) lands, on both sides. */
export const landAt = (k: number) =>
  k <= N_START ? START + (k - 1) * START_GAP : LEAD + (k - N_START - 1) * BEAT;
export const LAST = landAt(N);
/** The latest pick goes quiet; the bests stay ringed. */
export const SETTLE = LAST + 1.1;
export const HOLD = 6.5;
export const CYCLE = SETTLE + HOLD;
/** Cross-fade between one seed's cycle and the next. */
export const FADE = 0.45;
/** The still under reduced motion: the finished run. */
export const STILL = SETTLE + 1;

/** Experiments done (both strategies) at τ. */
export const doneAt = (tau: number) => {
  if (tau < START) return 0;
  if (tau < LEAD) return Math.min(N_START, 1 + Math.floor((tau - START) / START_GAP + 1e-9));
  return Math.min(N, N_START + 1 + Math.floor((tau - LEAD) / BEAT + 1e-9));
};

/* ---------- layout ---------- */

/*
 * Logical px are CSS px (the layout is as wide as the canvas box), so a
 * 1 px hairline and 11 px text are exactly that on every screen. Two shapes:
 * side by side from WIDE_MIN, stacked below it (phones). Every height is a
 * linear function of the width, which BoSim.css repeats to reserve the box
 * before the first frame and to place the controls (and its container
 * queries repeat WIDE_MIN): keep the two in step.
 *
 *   wide    h = P + 291,   P = ⌊(w − 80) / 2⌋, controls' top = P + 104
 *   narrow  h = 2P + 358,  P = w − 32,          controls' top = 2P + 186
 *
 * Panels are whole px, so the plate's height is too (Chrome snaps a canvas
 * box to whole CSS px; a fractional one stretches the bitmap by a row and
 * smears every hairline, measured 3 Oct 2026). An odd width's spare px goes
 * to the gap between the panels.
 */
/** Side by side from here: each panel's legend and line of explanation need about 280 px (PP Supply Mono, 4 Oct 2026). */
export const WIDE_MIN = 640;
const WIDE = { pad: 24, gap: 32, title: 30, sub: 47, top: 62, legend: 25, head: 62, plot: 88, plotH: 102, axis: 19, room: 66 } as const;
const NARROW = { pad: 16, title: 26, sub: 42, top: 56, legend: 23, between: 88, head: 62, plot: 86, plotH: 88, axis: 19, room: 60 } as const;
/** The domain square sits this far inside its panel's frame. */
const INSET = 8;
/**
 * The HTML controls on the chart's title row, right-aligned (BoSim.css):
 * Run again and pause, 152 px; below TIGHT px of plate Run again shows its
 * icon only, 66 px. The title shortens when it would run under them.
 */
const CONTROLS = 152;
const CONTROLS_TIGHT = 66;
export const TIGHT = 340;

export type Panel = {
  /** Frame (outer) box. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** The domain square, inside the frame. */
  readonly dx: number;
  readonly dy: number;
  readonly ds: number;
  /** Baselines of the title, its line of explanation and the legend. */
  readonly titleY: number;
  readonly subY: number;
  readonly legendY: number;
};

export type Chart = {
  /** The plot: experiment slots from x0 to x1, the worst value at top, the optimum at bottom. */
  readonly x0: number;
  readonly x1: number;
  readonly top: number;
  readonly bottom: number;
  /** Baselines of the chart's title and of the experiment numbers. */
  readonly headY: number;
  readonly axisY: number;
};

export type Geo = {
  readonly w: number;
  readonly h: number;
  readonly wide: boolean;
  readonly left: Panel;
  readonly right: Panel;
  readonly chart: Chart;
};

const panel = (x: number, y: number, size: number, titleY: number, subY: number, legend: number): Panel => ({
  x,
  y,
  size,
  dx: x + INSET,
  dy: y + INSET,
  ds: size - 2 * INSET,
  titleY,
  subY,
  legendY: y + size + legend,
});

export function geometry(w: number): Geo {
  if (w >= WIDE_MIN) {
    const { pad, gap, title, sub, top, legend, head, plot, plotH, axis, room } = WIDE;
    const P = Math.floor((w - 2 * pad - gap) / 2);
    const below = top + P;
    const plotTop = below + plot;
    return {
      w,
      h: P + 291,
      wide: true,
      left: panel(pad, top, P, title, sub, legend),
      right: panel(w - pad - P, top, P, title, sub, legend),
      chart: { x0: pad, x1: w - pad - room, top: plotTop, bottom: plotTop + plotH, headY: below + head, axisY: plotTop + plotH + axis },
    };
  }
  const { pad, title, sub, top, legend, between, head, plot, plotH, axis, room } = NARROW;
  const P = w - 2 * pad;
  const top2 = top + P + between;
  const below = top2 + P;
  const plotTop = below + plot;
  return {
    w,
    h: 2 * P + 358,
    wide: false,
    left: panel(pad, top, P, title, sub, legend),
    right: panel(pad, top2, P, top2 - (top - title), top2 - (top - sub), legend),
    chart: { x0: pad, x1: w - pad - room, top: plotTop, bottom: plotTop + plotH, headY: below + head, axisY: plotTop + plotH + axis },
  };
}

export function pickLayout(cssW: number): PlateLayout {
  const w = Math.max(280, Math.round(cssW));
  const g = geometry(w);
  return { w, h: g.h, key: g.wide ? 'wide' : 'narrow' };
}

/* ---------- the landscape ---------- */

/*
 * Contours of Branin, traced once: marching squares on a 256-cell grid of the
 * unit square (saddles split by the cell's mean), the segments chained into
 * polylines through the grid edges they share, one Path2D per level in unit
 * coordinates; each panel strokes them under a transform. Chained, not loose
 * segments: at DPR 1 a 1 px stroke is drawn as a hairline, and loose
 * segments double up where they meet, so the rings came out beaded like a
 * dashed line (3 Oct 2026). Log-spaced levels: the valleys hold the rings
 * 1 to 8, the slopes the rest. The grid runs BLEED past the domain on every
 * side, so the lines reach the panel's frame (INSET away) instead of stopping
 * short of it; the experiments stay in the domain.
 */
const LEVELS = [1, 2, 4, 8, 16, 32, 64, 128, 256];
const CELLS = 256;
/** Unit-square margin traced (and filled) past the domain: INSET on the narrowest panel. */
const BLEED = 0.04;
let traced: Path2D[] | null = null;

/** Work arrays for contourLines, one per grid edge, reused across levels. */
const buffers = (cells: number) => {
  const edges = 2 * (cells + 1) * (cells + 1);
  return {
    la: new Int32Array(edges),
    lb: new Int32Array(edges),
    ex: new Float64Array(edges),
    ey: new Float64Array(edges),
    used: new Uint8Array(edges),
  };
};

/**
 * The polylines of one level, as flat [u1, u2, …] arrays. A contour point is
 * a crossed grid edge: edge 2·node runs right from a node, 2·node + 1 up from
 * it (node = j·n + i). Each crossed edge has one link (a line's end, on the
 * domain's edge) or two.
 */
export function contourLines(f: Float64Array, cells: number, L: number, scratch = buffers(cells)): number[][] {
  const n = cells + 1;
  const h = 1 / cells;
  const edges = 2 * n * n;
  const { la, lb, ex, ey, used } = scratch;
  la.fill(-1);
  lb.fill(-1);
  used.fill(0);
  const link = (p: number, q: number) => {
    if (la[p] < 0) la[p] = q;
    else lb[p] = q;
    if (la[q] < 0) la[q] = p;
    else lb[q] = p;
  };
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      // corners: a (i, j), b (i + 1, j), c (i + 1, j + 1), d (i, j + 1); u2 is up
      const a = f[i * n + j];
      const b = f[(i + 1) * n + j];
      const c = f[(i + 1) * n + j + 1];
      const d = f[i * n + j + 1];
      const k = (a < L ? 1 : 0) | (b < L ? 2 : 0) | (c < L ? 4 : 0) | (d < L ? 8 : 0);
      if (k === 0 || k === 15) continue;
      const x0 = i * h;
      const y0 = j * h;
      const B = 2 * (j * n + i);
      const R = 2 * (j * n + i + 1) + 1;
      const T = 2 * ((j + 1) * n + i);
      const Lf = 2 * (j * n + i) + 1;
      // the crossing on each edge this cell's case uses (an edge shared with a neighbour gets the same value)
      if ((a < L) !== (b < L)) {
        ex[B] = x0 + (h * (L - a)) / (b - a);
        ey[B] = y0;
      }
      if ((b < L) !== (c < L)) {
        ex[R] = x0 + h;
        ey[R] = y0 + (h * (L - b)) / (c - b);
      }
      if ((d < L) !== (c < L)) {
        ex[T] = x0 + (h * (L - d)) / (c - d);
        ey[T] = y0 + h;
      }
      if ((a < L) !== (d < L)) {
        ex[Lf] = x0;
        ey[Lf] = y0 + (h * (L - a)) / (d - a);
      }
      switch (k) {
        case 1:
        case 14:
          link(Lf, B);
          break;
        case 2:
        case 13:
          link(B, R);
          break;
        case 3:
        case 12:
          link(Lf, R);
          break;
        case 4:
        case 11:
          link(R, T);
          break;
        case 6:
        case 9:
          link(B, T);
          break;
        case 7:
        case 8:
          link(Lf, T);
          break;
        case 5: // a and c inside: joined through the centre, or not
          if ((a + b + c + d) / 4 < L) {
            link(B, R);
            link(T, Lf);
          } else {
            link(Lf, B);
            link(R, T);
          }
          break;
        case 10: // b and d inside
          if ((a + b + c + d) / 4 < L) {
            link(Lf, B);
            link(R, T);
          } else {
            link(B, R);
            link(T, Lf);
          }
          break;
      }
    }
  }
  // walk the open lines first (from an end), then the rings
  const lines: number[][] = [];
  const walk = (start: number) => {
    const line = [ex[start], ey[start]];
    used[start] = 1;
    let prev = -1;
    let cur = start;
    for (;;) {
      const next = la[cur] >= 0 && la[cur] !== prev && !used[la[cur]] ? la[cur] : lb[cur] >= 0 && lb[cur] !== prev && !used[lb[cur]] ? lb[cur] : -1;
      if (next < 0) {
        if (cur !== start && lb[start] >= 0 && (la[cur] === start || lb[cur] === start)) line.push(ex[start], ey[start]);
        break;
      }
      used[next] = 1;
      line.push(ex[next], ey[next]);
      prev = cur;
      cur = next;
    }
    return line;
  };
  for (let p = 0; p < edges; p++) if (!used[p] && la[p] >= 0 && lb[p] < 0) lines.push(walk(p));
  for (let p = 0; p < edges; p++) if (!used[p] && la[p] >= 0) lines.push(walk(p));
  return lines;
}

/** Traces the contours ahead of the first frame (BoSim calls it when the page is idle). */
export const prepare = () => void trace();

function trace(): Path2D[] {
  if (traced) return traced;
  const n = CELLS + 1;
  const h = 1 / CELLS;
  const span = 1 + 2 * BLEED;
  const u = (g: number) => -BLEED + span * g;
  const f = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) f[i * n + j] = braninAt(u(i * h), u(j * h));
  const scratch = buffers(CELLS);
  traced = LEVELS.map((level) => {
    const p = new Path2D();
    for (const line of contourLines(f, CELLS, level, scratch)) {
      // a ring ends where it began: close it, so it has a join there and no caps
      const m = line.length;
      const ring = m > 6 && line[0] === line[m - 2] && line[1] === line[m - 1];
      p.moveTo(u(line[0]), u(line[1]));
      for (let k = 2; k < (ring ? m - 2 : m); k += 2) p.lineTo(u(line[k]), u(line[k + 1]));
      if (ring) p.closePath();
    }
    return p;
  });
  return traced;
}

/* ---------- fields (the model's light) ---------- */

/*
 * A field is a node grid of alphas (belief.ts's lattice) painted into a small
 * offscreen image and scaled onto the domain. Bilinear scaling of a 41 px
 * image shows the lattice as creases, so the grid is first upsampled ×UP with
 * Catmull-Rom (smooth to the first derivative); the browser's smoothing does
 * the last step. An image is repainted only when its inputs change.
 */
const UP = 4;
const M = G * UP + 1;
/** Image px past the lattice on every side, repeating its edge, so a field reaches the frame (INSET on the narrowest panel). */
const PAD = 6;
const MP = M + 2 * PAD;
const CR = Array.from({ length: UP }, (_, f) => {
  const t = f / UP;
  const t2 = t * t;
  const t3 = t2 * t;
  return [(-t3 + 2 * t2 - t) / 2, (3 * t3 - 5 * t2 + 2) / 2, (-3 * t3 + 4 * t2 + t) / 2, (t3 - t2) / 2] as const;
});
const clampNode = (i: number) => (i < 0 ? 0 : i > G ? G : i);

type Field = {
  cv: HTMLCanvasElement | null;
  img: ImageData | null;
  key: string;
  readonly node: Float32Array;
  readonly tmp: Float32Array;
  readonly out: Float32Array;
};
const makeField = (): Field => ({
  cv: null,
  img: null,
  key: '',
  node: new Float32Array(NODES * NODES),
  tmp: new Float32Array(NODES * M),
  out: new Float32Array(M * M),
});
const beliefField = makeField();
const aimField = makeField();

/** Node grid (i·NODES + j, j up) to an M × M image's rows (top down). */
function upsample(src: Float32Array, out: Float32Array, tmp: Float32Array) {
  for (let j = 0; j < NODES; j++) {
    for (let i = 0; i < G; i++) {
      const a = src[clampNode(i - 1) * NODES + j];
      const b = src[i * NODES + j];
      const c = src[(i + 1) * NODES + j];
      const d = src[clampNode(i + 2) * NODES + j];
      for (let f = 0; f < UP; f++) {
        const w = CR[f];
        tmp[j * M + i * UP + f] = w[0] * a + w[1] * b + w[2] * c + w[3] * d;
      }
    }
    tmp[j * M + G * UP] = src[G * NODES + j];
  }
  for (let x = 0; x < M; x++) {
    for (let j = 0; j < G; j++) {
      const a = tmp[clampNode(j - 1) * M + x];
      const b = tmp[j * M + x];
      const c = tmp[(j + 1) * M + x];
      const d = tmp[clampNode(j + 2) * M + x];
      for (let f = 0; f < UP; f++) {
        const w = CR[f];
        out[(M - 1 - (j * UP + f)) * M + x] = w[0] * a + w[1] * b + w[2] * c + w[3] * d;
      }
    }
    out[x] = tmp[G * M + x];
  }
}

function paint(f: Field, key: string, rgb: RGB, fill: (node: Float32Array) => void) {
  if (typeof document === 'undefined') return null;
  if (!f.cv) {
    f.cv = document.createElement('canvas');
    f.cv.width = MP;
    f.cv.height = MP;
  }
  if (f.key === key) return f.cv;
  const c = f.cv.getContext('2d');
  if (!c) return null;
  if (!f.img) f.img = c.createImageData(MP, MP);
  fill(f.node);
  upsample(f.node, f.out, f.tmp);
  const d = f.img.data;
  for (let y = 0, q = 0; y < MP; y++) {
    const row = Math.min(M - 1, Math.max(0, y - PAD)) * M;
    for (let x = 0; x < MP; x++, q += 4) {
      const a = f.out[row + Math.min(M - 1, Math.max(0, x - PAD))];
      d[q] = rgb[0];
      d[q + 1] = rgb[1];
      d[q + 2] = rgb[2];
      d[q + 3] = a <= 0 ? 0 : a >= 1 ? 255 : Math.round(a * 255);
    }
  }
  c.putImageData(f.img, 0, 0);
  f.key = key;
  return f.cv;
}

/** A field image over a panel's domain (pixel centres on the lattice nodes), out to the frame. */
function drawField(ctx: Ctx, p: Panel, cv: HTMLCanvasElement | null, alpha: number) {
  if (!cv || alpha <= 0.002) return;
  const k = p.ds / (M - 1);
  const o = (PAD + 0.5) * k;
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.size, p.size);
  ctx.clip();
  ctx.globalCompositeOperation = L.blend;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cv, p.dx - o, p.dy - o, MP * k, MP * k);
  ctx.restore();
}

const LOG_LO = Math.log10(F_STAR);
const LOG_HI = Math.log10(F_MAX);
/** 0 at the worst value on the domain, 1 at the optimum (log scale). */
const lowness = (v: number) =>
  Number.isNaN(v) ? 0 : 1 - clamp01((Math.log10(Math.max(v, F_STAR)) - LOG_LO) / (LOG_HI - LOG_LO));
/** How brightly a place glows for the model's estimate there: only the valleys it expects light up. */
const glowOf = (v: number) => lowness(v) ** 3;
/*
 * The acquisition as isolines: augmented expected improvement at AIM_LEVELS
 * of its largest value on the lattice, amber hairlines that draw in from the
 * outermost to the innermost before each pick, so the model is seen closing
 * in on where an experiment is worth most. The lattice is upsampled as the
 * fields are (Catmull-Rom, ×UP) and extended AIM_PAD cells past the domain by
 * repeating its edge, so a line that meets the domain's edge runs on to the
 * frame like Branin's contours. One set of Path2Ds (unit coordinates) per
 * model, kept for the two picks on screen at once. (4 Oct 2026 review: an
 * amber wash alone, from 30 % of the largest value, covered a quarter of the
 * panel early on and muddied the teal under it.)
 */
const AIM_LEVELS = [0.5, 0.75, 0.92] as const;
/** Each isoline's alpha, the inner ones louder. */
const AIM_ALPHA = [0.4, 0.62, 0.9] as const;
/** Under the isolines a faint amber light, nothing outside the outermost line, rising towards the largest value. */
const AIM_FLOOR = AIM_LEVELS[0];
const aimOf = (e: number) => clamp01((e - AIM_FLOOR) / (1 - AIM_FLOOR)) ** 1.6;
const AIM_PAD = 6;
const AIM_N = M + 2 * AIM_PAD;
const aimScratch = { tmp: new Float32Array(NODES * M), out: new Float32Array(M * M), f: new Float64Array(AIM_N * AIM_N) };
let aimBuffers: ReturnType<typeof buffers> | null = null;
const aimKept = new Map<string, Path2D[]>();

function aimLines(key: string, b: Belief): Path2D[] {
  const hit = aimKept.get(key);
  if (hit) return hit;
  const { tmp, out, f } = aimScratch;
  upsample(b.aim, out, tmp);
  for (let x = 0; x < AIM_N; x++) {
    const ix = Math.min(M - 1, Math.max(0, x - AIM_PAD));
    for (let y = 0; y < AIM_N; y++) {
      const iy = Math.min(M - 1, Math.max(0, y - AIM_PAD));
      f[x * AIM_N + y] = out[(M - 1 - iy) * M + ix];
    }
  }
  const cells = AIM_N - 1;
  const scratch = (aimBuffers ??= buffers(cells));
  // the extended grid's unit square to the domain's
  const u = (c: number) => (c * cells - AIM_PAD) / (M - 1);
  const paths = AIM_LEVELS.map((level) => {
    const p = new Path2D();
    for (const line of contourLines(f, cells, level, scratch)) {
      const m = line.length;
      const ring = m > 6 && line[0] === line[m - 2] && line[1] === line[m - 1];
      p.moveTo(u(line[0]), u(line[1]));
      for (let k = 2; k < (ring ? m - 2 : m); k += 2) p.lineTo(u(line[k]), u(line[k + 1]));
      if (ring) p.closePath();
    }
    return p;
  });
  aimKept.set(key, paths);
  while (aimKept.size > 4) aimKept.delete(aimKept.keys().next().value as string);
  return paths;
}

/** The isolines over a panel, the k-th drawn at alpha a(k). */
function strokeAim(ctx: Ctx, p: Panel, paths: Path2D[], a: (k: number) => number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.size, p.size);
  ctx.clip();
  ctx.translate(p.dx, p.dy + p.ds);
  ctx.scale(p.ds, -p.ds);
  ctx.lineWidth = 1 / p.ds;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  paths.forEach((path, k) => {
    const alpha = a(k);
    if (alpha <= 0.004) return;
    ctx.strokeStyle = L.aim(alpha);
    ctx.stroke(path);
  });
  ctx.restore();
}

/** The model's picture at τ: from one fitted state to the next, mixed as it settles. */
type State = { readonly a: Belief; readonly b: Belief; readonly mix: number; readonly sa: number; readonly sb: number };

function stateAt(run: Run, tau: number, done: number): State {
  if (done < N_START) return { a: PRIOR, b: PRIOR, mix: 1, sa: -1, sb: -1 };
  const s = done - N_START;
  const mix = ease((tau - landAt(done) - MORPH_AT) / MORPH_IN);
  return { a: beliefAt(run, s - 1), b: beliefAt(run, s), mix, sa: s - 1, sb: s };
}

function belief(ctx: Ctx, p: Panel, run: Run, st: State, fade: number) {
  const key = `${run.seed}|${st.sa}|${st.sb}|${st.mix.toFixed(3)}`;
  const cv = paint(beliefField, key, L.beliefRGB, (node) => {
    for (let k = 0; k < node.length; k++) {
      const ga = glowOf(st.a.mean[k]);
      node[k] = ga + (glowOf(st.b.mean[k]) - ga) * st.mix;
    }
  });
  drawField(ctx, p, cv, L.a.belief * fade);
}

/*
 * The model's uncertainty as a halftone: one dot per cell of a lattice about
 * 12 px apart, its radius rising with the posterior sd from nothing at
 * HAZE_CLEAR (the model knows the place to within about its noise) to full
 * where it is back to its prior (sd 1). Radii are quantised into a few
 * Path2D fills.
 */
const HAZE_STEP = 12;
const HAZE_CLEAR = 0.16;
const HAZE_BUCKETS = 7;
/** The last halftone built, reused while the model's picture holds still. */
let hazeKept: { key: string; paths: Path2D[] } = { key: '', paths: [] };
function haze(ctx: Ctx, p: Panel, run: Run, st: State, fade: number) {
  if (fade <= 0) return;
  ctx.fillStyle = L.ink(L.a.haze * fade);
  const key = `${run.seed}|${st.sa}|${st.sb}|${st.mix.toFixed(3)}|${p.dx}|${p.dy}|${p.ds}`;
  if (hazeKept.key === key) {
    for (const path of hazeKept.paths) ctx.fill(path);
    return;
  }
  const D = Math.max(16, Math.round(p.ds / HAZE_STEP));
  const step = p.ds / D;
  const rMax = Math.min(1.6, step * 0.135);
  const buckets = Array.from({ length: HAZE_BUCKETS }, () => new Path2D());
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < D; j++) {
      const u1 = (i + 0.5) / D;
      const u2 = (j + 0.5) / D;
      const sa = sample(st.a.sd, u1, u2);
      const sd = sa + (sample(st.b.sd, u1, u2) - sa) * st.mix;
      const v = (sd - HAZE_CLEAR) / (1 - HAZE_CLEAR);
      if (v <= 0.04) continue;
      const b = Math.min(HAZE_BUCKETS - 1, Math.floor(v * HAZE_BUCKETS));
      const r = rMax * ((b + 1) / HAZE_BUCKETS) ** 0.8;
      const x = p.dx + u1 * p.ds;
      const y = p.dy + (1 - u2) * p.ds;
      buckets[b].moveTo(x + r, y);
      buckets[b].arc(x, y, r, 0, TAU);
    }
  }
  hazeKept = { key, paths: buckets };
  for (const path of buckets) ctx.fill(path);
}

/* ---------- marks ---------- */

const TITLE = 11;
const SUB = 10.5;
const LEGEND = 10;
const SMALL = 10.5;

const at = (p: Panel, u1: number, u2: number): [number, number] => [p.dx + u1 * p.ds, p.dy + (1 - u2) * p.ds];

/** A soft round light under a point (additive on the plate). */
function glow(ctx: Ctx, x: number, y: number, r: number, colour: Rgba, a: number) {
  if (a <= 0.004) return;
  ctx.save();
  ctx.globalCompositeOperation = L.blend;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, colour(a));
  g.addColorStop(0.38, colour(a * 0.32));
  g.addColorStop(1, colour(0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function ring(ctx: Ctx, x: number, y: number, r: number, colour: string, width = 1) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
}

function disc(ctx: Ctx, x: number, y: number, r: number, colour: string) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** A low point of the landscape: a small hairline +, snapped. */
function plus(ctx: Ctx, snap: Grid, x: number, y: number, arm: number, colour: string) {
  const cx = snap.mid(x);
  const cy = snap.mid(y);
  ctx.strokeStyle = colour;
  ctx.lineWidth = snap.w(1);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cx - arm, cy);
  ctx.lineTo(cx + arm + snap.w(1) / 2, cy);
  ctx.moveTo(cx, cy - arm);
  ctx.lineTo(cx, cy + arm + snap.w(1) / 2);
  ctx.stroke();
}

function frame(ctx: Ctx, p: Panel, snap: Grid) {
  const x0 = snap.mid(p.x);
  const y0 = snap.mid(p.y);
  const x1 = snap.mid(p.x + p.size);
  const y1 = snap.mid(p.y + p.size);
  ctx.lineWidth = snap.w(1);
  ctx.setLineDash([]);
  ctx.strokeStyle = L.ink(L.a.frame);
  ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  // registration corners, a step brighter than the box
  const k = 8;
  ctx.strokeStyle = L.ink(L.a.corner);
  ctx.beginPath();
  ctx.moveTo(x0, y0 + k);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x0 + k, y0);
  ctx.moveTo(x1 - k, y0);
  ctx.lineTo(x1, y0);
  ctx.lineTo(x1, y0 + k);
  ctx.moveTo(x1, y1 - k);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - k, y1);
  ctx.moveTo(x0 + k, y1);
  ctx.lineTo(x0, y1);
  ctx.lineTo(x0, y1 - k);
  ctx.stroke();
}

function landscape(ctx: Ctx, p: Panel) {
  const paths = trace();
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.size, p.size);
  ctx.clip();
  ctx.translate(p.dx, p.dy + p.ds);
  ctx.scale(p.ds, -p.ds);
  ctx.lineWidth = 1 / p.ds;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  paths.forEach((path, i) => {
    // the valley rings brighter than the slopes
    ctx.strokeStyle = L.ink(L.a.contourHi + ((L.a.contourLo - L.a.contourHi) * i) / (LEVELS.length - 1));
    ctx.stroke(path);
  });
  ctx.restore();
}

function lows(ctx: Ctx, p: Panel, snap: Grid) {
  for (const [u1, u2] of MINIMA) {
    const [x, y] = at(p, u1, u2);
    plus(ctx, snap, x, y, 4, L.ink(L.a.optimum));
  }
}

/** Index of the best (lowest true value) of the first `done` experiments. */
function bestOf(f: Float64Array, done: number) {
  let b = 0;
  for (let i = 1; i < done; i++) if (f[i] < f[b]) b = i;
  return b;
}

/** The ring round a side's best experiment so far; it draws in where a new best lands. */
function bestRing(ctx: Ctx, p: Panel, pts: Float64Array, f: Float64Array, done: number, tau: number, colour: Rgba, fade: number) {
  if (done === 0) return;
  const b = bestOf(f, done);
  const since = tau - landAt(b + 1);
  const u = easeOut(since / 0.5);
  const [x, y] = at(p, pts[2 * b], pts[2 * b + 1]);
  ring(ctx, x, y, 7.5 + 6 * (1 - u), colour(0.78 * u * fade));
}

/* ---------- the two sides ---------- */

/** Clips what follows to a panel's frame, so a pulse or a ring at the domain's edge stops at the frame line. */
function clipTo(ctx: Ctx, p: Panel) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y, p.size, p.size);
  ctx.clip();
}

function plannedSide(ctx: Ctx, p: Panel, run: Run, tau: number, done: number, settled: boolean, fade: number) {
  for (let i = 0; i < N; i++) {
    const [x, y] = at(p, run.planned[2 * i], run.planned[2 * i + 1]);
    const shown = easeOut((tau - PLAN_AT - i * PLAN_GAP) / PLAN_IN);
    if (shown <= 0) continue;
    if (i < done) {
      const since = tau - landAt(i + 1);
      const newest = i === done - 1 && !settled;
      if (since < PULSE) ring(ctx, x, y, 3 + 11 * easeOut(since / PULSE), L.planned(0.42 * (1 - ease(since / PULSE)) * fade));
      disc(ctx, x, y, newest ? 2.9 : 2.5, L.planned((newest ? 1 : L.a.dot) * fade));
    } else {
      // the plan: every place before any result
      ring(ctx, x, y, 3.2 + 5 * (1 - shown), L.planned(L.a.ring * shown * fade));
    }
  }
  bestRing(ctx, p, run.planned, run.plannedF, done, tau, L.planned, fade);
}

function aim(ctx: Ctx, p: Panel, run: Run, tau: number, done: number, settled: boolean, fade: number) {
  // the pick being made: experiment done + 1, by the model fitted to `done` measurements
  if (!settled && done >= N_START && done < N) {
    const u = (tau - (landAt(done + 1) - AIM)) / AIM;
    if (u > 0) {
      const b = beliefAt(run, done - N_START);
      const key = `${run.seed}|${done}`;
      const cv = paint(aimField, key, L.aimRGB, (node) => {
        for (let k = 0; k < node.length; k++) node[k] = aimOf(b.aim[k]);
      });
      drawField(ctx, p, cv, L.a.aimField * ease(u / 0.5) * fade);
      // outermost first, closing in on the pick
      strokeAim(ctx, p, aimLines(key, b), (k) => AIM_ALPHA[k] * ease((u - 0.16 * k) / 0.4) * fade);
      const [tx, ty] = at(p, run.chosen[2 * done], run.chosen[2 * done + 1]);
      const [sx, sy] = at(p, run.chosen[2 * (done - 1)], run.chosen[2 * (done - 1) + 1]);
      const c = ease((u - 0.1) / 0.6);
      if (c > 0) dashTo(ctx, sx, sy, sx + (tx - sx) * c, sy + (ty - sy) * c, L.aim(0.62 * fade));
      ring(ctx, tx, ty, 6.5 + 12 * (1 - easeOut(u)), L.aim((0.3 + 0.62 * ease(u / 0.6)) * fade));
      disc(ctx, tx, ty, 1.4, L.aim(0.9 * ease((u - 0.55) / 0.3) * fade));
    }
  }
  // the pick just made: its light goes out, the line from the last one with it
  if (done > N_START) {
    const since = tau - landAt(done);
    if (since < AIM_OUT) {
      const b = beliefAt(run, done - 1 - N_START);
      const key = `${run.seed}|${done - 1}`;
      const cv = paint(aimField, key, L.aimRGB, (node) => {
        for (let k = 0; k < node.length; k++) node[k] = aimOf(b.aim[k]);
      });
      const out = 1 - ease(since / AIM_OUT);
      drawField(ctx, p, cv, L.a.aimField * out * fade);
      strokeAim(ctx, p, aimLines(key, b), (k) => AIM_ALPHA[k] * out * fade);
      const [tx, ty] = at(p, run.chosen[2 * (done - 1)], run.chosen[2 * (done - 1) + 1]);
      const [sx, sy] = at(p, run.chosen[2 * (done - 2)], run.chosen[2 * (done - 2) + 1]);
      dashTo(ctx, sx, sy, tx, ty, L.aim(0.62 * out * fade));
    }
  }
}

function dashTo(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, colour: string) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 1;
  ctx.lineCap = 'butt';
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
}

function chosenSide(ctx: Ctx, p: Panel, run: Run, tau: number, done: number, settled: boolean, fade: number) {
  for (let i = 0; i < done; i++) {
    const [x, y] = at(p, run.chosen[2 * i], run.chosen[2 * i + 1]);
    const since = tau - landAt(i + 1);
    const newest = i === done - 1 && !settled;
    if (since < PULSE) {
      const k = since / PULSE;
      ring(ctx, x, y, 3 + 15 * easeOut(k), L.chosen(0.7 * (1 - ease(k)) * fade));
      glow(ctx, x, y, 22, L.chosen, L.a.glow * 0.9 * (1 - ease(k)) * fade);
    }
    if (newest) {
      glow(ctx, x, y, 11, L.chosen, L.a.glow * 0.6 * fade);
      disc(ctx, x, y, 3, L.hot(fade));
    } else disc(ctx, x, y, 2.5, L.chosen(L.a.chosenDot * fade));
  }
  bestRing(ctx, p, run.chosen, run.chosenF, done, tau, L.chosen, fade);
}

/* ---------- titles and legends ---------- */

/** The first of the wordings that fits the width (the last one regardless). */
function fit(ctx: Ctx, variants: readonly string[], width: number, size: number) {
  return variants.find((v) => measure(ctx, v, size) <= width) ?? variants[variants.length - 1];
}

/**
 * Where the run is, on the plate's first title row, right-aligned: both sides
 * run their k-th experiment together, so one counter serves both. The number
 * is lit (and fades with the cycle); the words drop first when the row is
 * short (the narrowest phones).
 */
function counter(ctx: Ctx, g: Geo, snap: Grid, done: number, fade: number) {
  const p = g.wide ? g.right : g.left;
  const title = g.wide ? 'CHOSEN ONE AT A TIME' : 'PLANNED UP FRONT';
  const room = p.size - spaced(ctx, -9999, 0, title, 'rgba(0,0,0,0)', 'left', TITLE, 0.26) - 16;
  const y = snap.at(p.titleY);
  const tail = ` / ${N}`;
  const num = String(done).padStart(2, '0');
  const word = 'experiment ';
  const wTail = measure(ctx, tail, SUB);
  const wNum = measure(ctx, num, SUB);
  const x = p.x + p.size;
  text(ctx, x, y, tail, L.ink(L.a.sub), 'right', SUB);
  text(ctx, x - wTail, y, num, L.ink(0.92 * fade), 'right', SUB);
  if (wTail + wNum + measure(ctx, word, SUB) <= room) text(ctx, x - wTail - wNum, y, word, L.ink(L.a.sub), 'right', SUB);
}

function titles(ctx: Ctx, g: Geo, snap: Grid) {
  const { left: l, right: r } = g;
  spaced(ctx, l.x, snap.at(l.titleY), 'PLANNED UP FRONT', L.planned(L.a.title), 'left', TITLE, 0.26);
  const ls = fit(ctx, ['all twenty fixed before the first result', 'all fixed before the first result'], l.size, SUB);
  text(ctx, l.x, snap.at(l.subY), ls, L.ink(L.a.sub), 'left', SUB);
  spaced(ctx, r.x, snap.at(r.titleY), 'CHOSEN ONE AT A TIME', L.chosenText(L.a.title), 'left', TITLE, 0.26);
  // the first N_START are spread out, not picked by the model (23 Oct 2026)
  const rs = fit(
    ctx,
    ['three to start, then each picked by a model of the results so far', 'three to start, then each picked by a model of the results', 'three to start, then each picked by a model'],
    r.size,
    SUB,
  );
  text(ctx, r.x, snap.at(r.subY), rs, L.ink(L.a.sub), 'left', SUB);
}

/** A legend key: its glyph and its label, with a shorter label for the narrowest panels. */
type Key = { readonly glyph: (x: number, y: number) => void; readonly label: string; readonly short?: string };

/** A legend row: glyph, label, glyph, label, from the panel's left edge, tightened to fit the panel. */
function legend(ctx: Ctx, p: Panel, snap: Grid, keys: readonly Key[]) {
  const y = snap.at(p.legendY);
  const mid = y - 3.5;
  const width = (gap: number, short: boolean) =>
    keys.reduce((w, k) => w + 13 + measure(ctx, (short && k.short) || k.label, LEGEND), 0) + gap * (keys.length - 1);
  const gap = width(15, false) <= p.size ? 15 : 10;
  const short = width(gap, false) > p.size;
  let x = p.x;
  for (const k of keys) {
    const label = (short && k.short) || k.label;
    k.glyph(x + 4.5, mid);
    text(ctx, x + 13, y, label, L.ink(L.a.legend), 'left', LEGEND);
    x += 13 + measure(ctx, label, LEGEND) + gap;
  }
}

function legends(ctx: Ctx, g: Geo, snap: Grid) {
  legend(ctx, g.left, snap, [
    { glyph: (x, y) => ring(ctx, x, y, 3.2, L.planned(0.6)), label: 'planned' },
    { glyph: (x, y) => disc(ctx, x, y, 2.5, L.planned(L.a.dot)), label: 'run' },
    { glyph: (x, y) => ring(ctx, x, y, 4.5, L.planned(0.78)), label: 'best so far', short: 'best' },
    { glyph: (x, y) => plus(ctx, snap, x, y, 3.5, L.ink(L.a.optimum + 0.15)), label: 'optimum' },
  ]);
  legend(ctx, g.right, snap, [
    { glyph: (x, y) => disc(ctx, x, y, 2.5, L.chosen(L.a.chosenDot)), label: 'run' },
    {
      glyph: (x, y) => {
        ctx.fillStyle = L.ink(L.a.haze + 0.2);
        for (const dx of [-3, 0, 3]) for (const dy of [-3, 0, 3]) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, 0.9, 0, TAU);
          ctx.fill();
        }
      },
      label: 'unsure',
    },
    { glyph: (x, y) => glow(ctx, x, y, 7, L.chosen, 0.9), label: 'expected low', short: 'expects low' },
    {
      glyph: (x, y) => {
        ring(ctx, x, y, 3.6, L.aim(0.95));
        disc(ctx, x, y, 1.1, L.aim(0.95));
      },
      label: 'next pick',
    },
  ]);
}

/* ---------- best so far ---------- */

/** Height in the plot for a value: the worst on the domain at the top, the optimum at the bottom. */
const yOf = (c: Chart, v: number) => c.top + (c.bottom - c.top) * lowness(v);
const slot = (c: Chart) => (c.x1 - c.x0) / N;
const cx = (c: Chart, k: number) => c.x0 + (k + 0.5) * slot(c);

/**
 * One strategy's best so far as a staircase through the slot centres. The
 * newest step runs out across its slot and then drops to the new level.
 * Returns the head.
 */
function staircase(ctx: Ctx, c: Chart, best: Float64Array, done: number, grow: number, colour: string, width: number): [number, number] {
  ctx.beginPath();
  let hx = cx(c, 0);
  let hy = yOf(c, best[0]);
  ctx.moveTo(hx, hy);
  for (let k = 1; k < done; k++) {
    const x0 = cx(c, k - 1);
    const x1 = cx(c, k);
    const y0 = yOf(c, best[k - 1]);
    const y1 = yOf(c, best[k]);
    if (k === done - 1 && grow < 1) {
      const run = clamp01(grow / 0.6);
      const drop = ease((grow - 0.6) / 0.4);
      hx = x0 + (x1 - x0) * run;
      hy = y0 + (y1 - y0) * drop;
      ctx.lineTo(hx, y0);
      if (drop > 0) ctx.lineTo(hx, hy);
    } else {
      ctx.lineTo(x1, y0);
      ctx.lineTo(x1, y1);
      hx = x1;
      hy = y1;
    }
  }
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.setLineDash([]);
  ctx.stroke();
  return [hx, hy];
}

function chart(ctx: Ctx, g: Geo, snap: Grid, run: Run, tau: number, done: number, settled: boolean, fade: number) {
  const c = g.chart;
  const pad = c.x0;
  const free = g.w - 2 * pad - (g.w < TIGHT ? CONTROLS_TIGHT : CONTROLS) - 12;
  const full = spaced(ctx, -9999, 0, 'BEST VALUE SO FAR', 'rgba(0,0,0,0)', 'left', TITLE, 0.26) <= free;
  const head = spaced(ctx, c.x0, snap.at(c.headY), full ? 'BEST VALUE SO FAR' : 'BEST SO FAR', L.ink(L.a.title * 0.86), 'left', TITLE, 0.26);
  if (g.wide) text(ctx, c.x0 + head + 14, snap.at(c.headY), 'lower is better', L.ink(L.a.sub), 'left', SUB);

  // the optimum: a threshold, so dashed; named where the lines never are, bottom left
  const yb = snap.mid(c.bottom);
  ctx.strokeStyle = L.ink(0.36);
  ctx.lineWidth = snap.w(1);
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.moveTo(c.x0, yb);
  ctx.lineTo(c.x1, yb);
  ctx.stroke();
  ctx.setLineDash([]);
  text(ctx, c.x0, snap.at(c.bottom - 7), 'optimum', L.ink(L.a.quiet), 'left', SMALL);
  const optimumEnd = c.x0 + measure(ctx, 'optimum', SMALL) + 4;

  // one tick per experiment, under the line
  ctx.strokeStyle = L.ink(0.24);
  ctx.lineWidth = snap.w(1);
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const x = snap.mid(cx(c, k));
    ctx.moveTo(x, snap.at(c.bottom + 4));
    ctx.lineTo(x, snap.at(c.bottom + 7));
  }
  ctx.stroke();

  // experiment numbers: a few fixed ones, and the current one lit
  const cur = settled || done === 0 ? -1 : done - 1;
  const labelAt = (k: number) => String(k + 1).padStart(2, '0');
  const minGap = 24;
  for (const k of [0, 4, 9, 14, 19]) {
    if (cur >= 0 && Math.abs(cx(c, k) - cx(c, cur)) < minGap) continue;
    text(ctx, cx(c, k), snap.at(c.axisY), labelAt(k), L.ink(L.a.quiet), 'center', SMALL);
  }
  if (cur >= 0) {
    text(ctx, cx(c, cur), snap.at(c.axisY), labelAt(cur), L.ink(0.95), 'center', SMALL);
    // the cursor: a hairline through the plot at the experiment being run (clear of the optimum's name)
    const x = snap.mid(cx(c, cur));
    ctx.strokeStyle = L.ink(0.14 * fade);
    ctx.lineWidth = snap.w(1);
    ctx.beginPath();
    ctx.moveTo(x, c.top - 6);
    ctx.lineTo(x, x < optimumEnd ? c.bottom - 19 : c.bottom);
    ctx.stroke();
  }

  if (done === 0 || fade <= 0) return;
  const since = tau - landAt(done);
  const grow = ease(since / RUN_OUT);

  // every experiment's own value, a dot each, the two sides a hair apart
  for (let k = 0; k < done; k++) {
    const a = k === done - 1 ? ease(since / 0.25) : 1;
    disc(ctx, cx(c, k) - 2, yOf(c, run.plannedF[k]), 1.7, L.planned(L.a.scatter * a * fade));
    disc(ctx, cx(c, k) + 2, yOf(c, run.chosenF[k]), 1.7, L.chosen(Math.min(1, L.a.scatter * 1.3) * a * fade));
  }

  const hp = staircase(ctx, c, run.bestPlanned, done, grow, L.planned(L.a.stair * 0.66 * fade), 1.25);
  const hc = staircase(ctx, c, run.bestChosen, done, grow, L.chosen(L.a.stair * fade), 1.6);
  disc(ctx, hp[0], hp[1], 2.2, L.planned(fade));
  glow(ctx, hc[0], hc[1], 10, L.chosen, L.a.glow * 0.7 * fade);
  disc(ctx, hc[0], hc[1], 2.4, L.hot(fade));

  // each line named at its head, kept apart when they run close
  let yp = hp[1];
  let yc = hc[1];
  const sep = 12;
  if (Math.abs(yp - yc) < sep) {
    const m = (yp + yc) / 2;
    const up = yp <= yc ? -1 : 1;
    yp = m + (up * sep) / 2;
    yc = m - (up * sep) / 2;
  }
  text(ctx, hp[0] + 8, yp + 3.5, 'planned', L.planned(0.78 * fade), 'left', SMALL);
  text(ctx, hc[0] + 8, yc + 3.5, 'chosen', L.chosenText(fade), 'left', SMALL);
}

/* ---------- frames ---------- */

/** The plate before the run is ready: ground only, for the few frames until then. */
export function drawBlank(ctx: Ctx, g: Geo) {
  ctx.fillStyle = L.ground;
  ctx.fillRect(0, 0, g.w, g.h);
}

export type DrawOpts = {
  /** Backing-store px per logical px (PlateFrame.px). */
  readonly px: number;
  /** Fade this cycle in from the previous one (every cycle but the first). */
  readonly fadeIn: boolean;
};

/** One frame of a run at τ seconds into its cycle. */
export function drawFrame(ctx: Ctx, g: Geo, run: Run, tau: number, { px, fadeIn }: DrawOpts) {
  const snap = grid(px);
  drawBlank(ctx, g);

  const done = doneAt(tau);
  const settled = tau >= SETTLE;
  // the cycle's content fades out at its end and, after the first cycle, in at its start
  const fade = (fadeIn ? ease(tau / FADE) : 1) * (1 - ease((tau - (CYCLE - FADE)) / FADE));

  titles(ctx, g, snap);
  counter(ctx, g, snap, done, fade);
  for (const p of [g.left, g.right]) {
    frame(ctx, p, snap);
    landscape(ctx, p);
  }

  // right: what the model believes, under the marks
  const st = stateAt(run, tau, done);
  belief(ctx, g.right, run, st, fade);
  haze(ctx, g.right, run, st, fade);

  for (const p of [g.left, g.right]) lows(ctx, p, snap);

  clipTo(ctx, g.left);
  plannedSide(ctx, g.left, run, tau, done, settled, fade);
  ctx.restore();
  clipTo(ctx, g.right);
  aim(ctx, g.right, run, tau, done, settled, fade);
  chosenSide(ctx, g.right, run, tau, done, settled, fade);
  ctx.restore();

  legends(ctx, g, snap);
  chart(ctx, g, snap, run, tau, done, settled, fade);
}
