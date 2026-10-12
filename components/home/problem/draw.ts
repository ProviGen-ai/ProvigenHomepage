/*
 * Canvas drawing for the process landscape, in the plate kit's paper theme
 * (components/plate/kit.ts). Kept free of React: the component owns size,
 * clocks and motion gates; this file owns the picture.
 *
 * - The wireframe is drawn with hidden lines removed (a floating horizon,
 *   front to back), so the ridge reads as a surface and nothing behind it
 *   muddies the crest. Every segment's alpha is its depth fade times a density
 *   term: a row fades by how close it runs to the line already drawn in front
 *   of it (where the surface turns away), so grazing flanks never bundle into
 *   a dark band. Segments are quantised into a handful of Path2D strokes, and
 *   runs that share a stroke continue one subpath (no caps doubling at joints).
 * - Ink is structure. The only light is what is happening: the A → B path
 *   (teal, glowStroke) with a comet head while it draws, then a pulse that
 *   travels it and pings B. On paper the pulse is an intensification (deeper
 *   teal over a teal bed), not a pale wash. Trial-and-error attempts stay in ink.
 * - A and B are ring-and-core marks on a small clearing in the mesh; their
 *   labels hang off hairline leaders, letter-spaced mono caps that type in over
 *   one soft-edged clearing. Labels are laid out first and flip or clamp to
 *   stay inside the canvas; attempts never stall on them.
 * - Per frame nothing big is allocated: polylines project into scratch
 *   buffers made with the scene.
 */
import {
  AMBER_INK,
  INK,
  MONO,
  ORANGE,
  PAPER_THEME,
  TEAL,
  TEAL_INK,
  circle,
  clamp,
  clamp01,
  dot,
  ease,
  easeInOut,
  easeOut,
  glowStroke,
  halo,
  head,
  line,
  span,
  typed,
  type Ctx,
  type Rgba,
} from '@/components/plate/kit';
import { A, B, buildAttempts, buildPath, makeCamera, project, ripple, terrain, type Camera, type Pt } from './geometry';
import { ATTEMPTS_FROM, ATTEMPTS_TO, PATH_FROM, PATH_TO } from './timeline';

const THEME = PAPER_THEME;

/** wide: the full pinned stage · band: a short full-bleed strip (flow) · tall: phones. */
export type Layout = 'wide' | 'band' | 'tall';

/** A terrain-following polyline with its heights and a screen-space scratch buffer. */
export type Line3 = { pts: Pt[]; base: Float32Array; xy: Float32Array };

export type Scene = {
  width: number;
  height: number;
  layout: Layout;
  cam: Camera;
  cols: number;
  rows: number;
  xs: Float32Array;
  zs: Float32Array;
  base: Float32Array;
  sx: Float32Array;
  sy: Float32Array;
  depth: Float32Array;
  /** Depth fade per vertex, 0..1. */
  fade: Float32Array;
  /** Hidden-line state per vertex (1 = above everything in front of it). */
  seen: Uint8Array;
  /** Per row: distance (CSS px) from each vertex up to the line drawn in front. */
  gap: Float32Array;
  /** Floating horizon: the highest (smallest) screen y drawn so far, per CSS px column. */
  sky: Float32Array;
  attempts: Line3[];
  path: Line3;
  /** Second screen buffer for the path, for the pulse's sub-path. */
  pulseXY: Float32Array;
  ringsA: Line3[];
  ringsB: Line3[];
  labels: { a: string; b: string };
};

export type Frame = {
  /** Timeline progress 0..1 (see timeline.ts). */
  p: number;
  /** Seconds of figure time, for the slow breathing of the surface. */
  t: number;
  /** 0..1 reveal of the mesh, front to back, then the marks and labels. */
  intro: number;
  /** Seconds since the path completed (-1 while it is not complete): drives the pulse. */
  since: number;
  /** True when motion is off: no breathing, no pulse. */
  still: boolean;
};

/** Camera framing per layout (fitted so A and B land where the copy leaves room). */
export const CAMERAS: Record<Layout, Parameters<typeof makeCamera>[2]> = {
  wide: { horizon: 0.4, zoom: 0.8, pitch: 0.3, yaw: -0.1, camX: 0.35, camY: 1.6, camZ: -1.2 },
  band: { horizon: 0.02, zoom: 1.08, pitch: 0.5, yaw: 0.01, camX: -0.33, camY: 1.66, camZ: -1.19 },
  tall: { horizon: 0.1, zoom: 0.85, pitch: 0.28, yaw: 0.05, camX: -0.44, camY: 3.5, camZ: -0.17 },
};

const RING_RADII = [0.22, 0.42, 0.66];

export function ring(center: Pt, radius: number): Pt[] {
  const pts: Pt[] = [];
  for (let index = 0; index <= 72; index++) {
    const a = (index / 72) * Math.PI * 2;
    pts.push({ x: center.x + Math.cos(a) * radius, z: center.z + Math.sin(a) * radius * 0.9 });
  }
  return pts;
}
export const line3 = (pts: Pt[]): Line3 => ({
  pts,
  base: Float32Array.from(pts, (p) => terrain(p.x, p.z)),
  xy: new Float32Array(pts.length * 2),
});

export function createScene(
  width: number,
  height: number,
  layout: Layout,
  labels: { a: string; b: string },
  /** A figure of its own framing (the /biopharma rounds); the stage uses CAMERAS. */
  camera?: Parameters<typeof makeCamera>[2],
): Scene {
  // A desktop window taller than the 16:10 it was framed for keeps the same
  // low, level camera; the scene only slides down so the near slope still
  // reaches the foot of the frame (none of this applies from 1.2:1 up).
  const framing = camera ?? CAMERAS[layout];
  const lift = !camera && layout === 'wide' ? 0.3 * Math.min(0.45, Math.max(0, 1.2 - width / height)) : 0;
  const cam = makeCamera(width, height, { ...framing, horizon: (framing?.horizon ?? 0.4) + lift });
  // the crest needs finer columns on big screens (the mesh pass is cheap)
  const cols = layout === 'tall' ? 150 : width > 1200 ? 260 : 200;
  const rows = layout === 'tall' ? 52 : 64;
  const xs = new Float32Array(cols);
  const zs = new Float32Array(rows);
  for (let i = 0; i < cols; i++) xs[i] = -9 + (18.6 * i) / (cols - 1);
  for (let j = 0; j < rows; j++) zs[j] = 0.2 + 17.8 * Math.pow(j / (rows - 1), 1.6);
  const base = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) base[j * cols + i] = terrain(xs[i], zs[j]);
  }
  const path = line3(buildPath());
  const n = cols * rows;
  return {
    width,
    height,
    layout,
    cam,
    cols,
    rows,
    xs,
    zs,
    base,
    sx: new Float32Array(n),
    sy: new Float32Array(n),
    depth: new Float32Array(n),
    fade: new Float32Array(n),
    seen: new Uint8Array(n),
    gap: new Float32Array(cols),
    sky: new Float32Array(Math.ceil(width) + 2),
    attempts: buildAttempts().map(line3),
    path,
    pulseXY: new Float32Array(path.xy.length),
    ringsA: RING_RADII.map((r) => line3(ring(A, r))),
    ringsB: RING_RADII.map((r) => line3(ring(B, r * 1.15))),
    labels,
  };
}

const tmp = { x: 0, y: 0 };

/**
 * Projects a terrain-following polyline into `out` (x, y pairs), up to
 * `fraction` of it with an exact head. Returns the number of points written.
 */
export function screenPolyline(scene: Scene, l: Line3, t: number, lift: number, fraction = 1, out = l.xy): number {
  const { pts, base } = l;
  const last = Math.max(0, Math.min(pts.length - 1, fraction * (pts.length - 1)));
  const whole = Math.floor(last);
  let n = 0;
  for (let index = 0; index <= whole + 1 && index < pts.length; index++) {
    let px = pts[index].x;
    let pz = pts[index].z;
    let h = base[index];
    if (index > whole) {
      const f = last - whole;
      if (f <= 0) break;
      const prev = pts[whole];
      px = prev.x + (px - prev.x) * f;
      pz = prev.z + (pz - prev.z) * f;
      h = base[whole] + (h - base[whole]) * f;
    }
    if (project(scene.cam, px, h + ripple(px, pz, t) + lift, pz, tmp) <= 0.05) continue;
    out[n * 2] = tmp.x;
    out[n * 2 + 1] = tmp.y;
    n++;
  }
  return n;
}

/* The polyline that `traced` adds as a subpath (set with `polyline`): one shared
 * callback for glowStroke instead of a closure per stroke per frame. */
let tracedXY: Float32Array = new Float32Array(0);
let tracedFrom = 0;
let tracedTo = 0;
export const polyline = (xy: Float32Array, n: number, from = 0) => {
  tracedXY = xy;
  tracedFrom = from;
  tracedTo = n;
  return traced;
};
function traced(ctx: Ctx) {
  for (let i = tracedFrom; i < tracedTo; i++) {
    if (i > tracedFrom) ctx.lineTo(tracedXY[i * 2], tracedXY[i * 2 + 1]);
    else ctx.moveTo(tracedXY[i * 2], tracedXY[i * 2 + 1]);
  }
}

export function pointOn(scene: Scene, p: Pt, t: number, lift = 0) {
  const out = { x: 0, y: 0 };
  project(scene.cam, p.x, terrain(p.x, p.z) + ripple(p.x, p.z, t) + lift, p.z, out);
  return out;
}

/* ---------- the wireframe ---------- */

/** Alpha levels the mesh is quantised into, and the loudest a mesh line gets. */
const LEVELS = 14;
const ROW_ALPHA = 0.3;
const COL_ALPHA = 0.15;
const MESH_MAX = ROW_ALPHA;
/** Near, middle and far line widths (CSS px; at 2× DPR these are 2, 1.6 and 1.2 device px). */
const WIDTHS = [1, 0.8, 0.6];
/** Lines closer than this (CSS px) to the line in front of them start to fade. */
const CROWD = 7;
/** Row segments closer than this (CSS px) to the line in front are not drawn. */
const MERGE = 0.8;
/** Hidden-line tolerance (CSS px). */
const TOL = 0.75;

/* Mesh pass state, module level so the helpers are not rebuilt every frame. */
const paths: (Path2D | null)[] = Array.from({ length: WIDTHS.length * LEVELS }, () => null);
let lastSlot = -1;
let lastX = 0;
let lastY = 0;
let sky: Float32Array = new Float32Array(0);
const clip = { x: 0, y: 0 };

/** Queue a segment in its (width class, alpha level) stroke; a run that continues keeps one subpath. */
function add(alpha: number, d: number, x0: number, y0: number, x1: number, y1: number) {
  const level = Math.round((alpha / MESH_MAX) * (LEVELS - 1));
  if (level <= 0) {
    lastSlot = -1;
    return;
  }
  const cls = d < 4 ? 0 : d < 8 ? 1 : 2;
  const slot = cls * LEVELS + Math.min(LEVELS - 1, level);
  const path = (paths[slot] ??= new Path2D());
  if (slot !== lastSlot || x0 !== lastX || y0 !== lastY) path.moveTo(x0, y0);
  path.lineTo(x1, y1);
  lastSlot = slot;
  lastX = x1;
  lastY = y1;
}

function skyAt(x: number) {
  const b = Math.round(x);
  return b < 0 || b >= sky.length ? Infinity : sky[b];
}
const above = (x: number, y: number) => y <= skyAt(x) + TOL;

/** Clip a segment whose ends disagree to the horizon (bisection, sub-pixel by 5 steps), into `clip`. */
function clipTo(x0: number, y0: number, x1: number, y1: number) {
  let lo = 0;
  let hi = 1;
  for (let s = 0; s < 5; s++) {
    const m = (lo + hi) / 2;
    if (above(x0 + (x1 - x0) * m, y0 + (y1 - y0) * m)) lo = m;
    else hi = m;
  }
  clip.x = x0 + (x1 - x0) * lo;
  clip.y = y0 + (y1 - y0) * lo;
}

/** Draw the visible part of a segment (end 0 visible state v0, end 1 v1). */
function segment(alpha: number, d: number, x0: number, y0: number, v0: boolean, x1: number, y1: number, v1: boolean) {
  if (v0 && v1) add(alpha, d, x0, y0, x1, y1);
  else if (v0) {
    clipTo(x0, y0, x1, y1);
    add(alpha, d, x0, y0, clip.x, clip.y);
    lastSlot = -1;
  } else if (v1) {
    clipTo(x1, y1, x0, y0);
    add(alpha, d, clip.x, clip.y, x1, y1);
  } else lastSlot = -1;
}

export function drawMesh(ctx: Ctx, scene: Scene, t: number, intro: number) {
  const { width, height, cols, rows, xs, zs, base, sx, sy, depth, fade, seen, gap, cam } = scene;
  const wide = scene.layout !== 'tall';
  const margin = 40;
  sky = scene.sky;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const d = project(cam, xs[i], base[k] + ripple(xs[i], zs[j], t), zs[j], tmp);
      depth[k] = d;
      sx[k] = tmp.x;
      sy[k] = tmp.y;
      // near lines a touch stronger; the far range thins into the paper
      const far = clamp01((d - 1.6) / 14);
      fade[k] = Math.pow(1 - far, 1.35);
    }
  }
  const inFrame = (k: number) =>
    depth[k] > 0.05 && sx[k] > -margin && sx[k] < width + margin && sy[k] > -margin && sy[k] < height + margin;

  paths.fill(null);
  lastSlot = -1;
  // floating horizon: everything starts below the frame
  sky.fill(Infinity);

  const reveal = intro * (rows + 12);
  const rowA = wide ? ROW_ALPHA : ROW_ALPHA * 0.9;
  const colA = wide ? COL_ALPHA : COL_ALPHA * 1.1;

  for (let j = 0; j < rows; j++) {
    const on = clamp01((reveal - j) / 10);
    const row = j * cols;
    // 1 · which of this row's vertices clear the horizon built by the rows in
    // front, and how far above it they run (the crowding that matters)
    for (let i = 0; i < cols; i++) {
      const k = row + i;
      seen[k] = inFrame(k) && above(sx[k], sy[k]) ? 1 : 0;
      gap[i] = skyAt(sx[k]) - sy[k];
    }
    if (on > 0) {
      // 2 · columns from the row in front up to this row
      if (j > 0) {
        lastSlot = -1;
        for (let i = 0; i < cols; i++) {
          const k = row + i;
          const q = k - cols;
          if (!inFrame(k) || !inFrame(q)) continue;
          const g = i + 1 < cols ? Math.abs(sx[k + 1] - sx[k]) : CROWD;
          const crowd = clamp((g - 0.5) / CROWD, 0.05, 1);
          const alpha = colA * Math.min(fade[k], fade[q]) * crowd * on;
          segment(alpha, depth[k], sx[q], sy[q], seen[q] === 1, sx[k], sy[k], seen[k] === 1);
        }
      }
      // 3 · the row itself, faded where it runs close above the line in front
      lastSlot = -1;
      for (let i = 0; i + 1 < cols; i++) {
        const k = row + i;
        if (!inFrame(k) || !inFrame(k + 1)) {
          lastSlot = -1;
          continue;
        }
        const v0 = seen[k] === 1;
        const v1 = seen[k + 1] === 1;
        const g = v0 && v1 ? (gap[i] + gap[i + 1]) / 2 : v0 ? gap[i] : gap[i + 1];
        if (g < MERGE) {
          lastSlot = -1;
          continue;
        }
        const crowd = clamp((g - 0.5) / CROWD, 0.03, 1);
        const alpha = rowA * Math.min(fade[k], fade[k + 1]) * crowd * on + 0.012 * on;
        segment(alpha, depth[k], sx[k], sy[k], v0, sx[k + 1], sy[k + 1], v1);
      }
    }
    // 4 · raise the horizon to this row (interpolated per CSS px column)
    for (let i = 0; i + 1 < cols; i++) {
      const k = row + i;
      if (depth[k] <= 0.05 || depth[k + 1] <= 0.05) continue;
      let x0 = sx[k];
      let y0 = sy[k];
      let x1 = sx[k + 1];
      let y1 = sy[k + 1];
      if (x1 < x0) {
        x0 = sx[k + 1];
        y0 = sy[k + 1];
        x1 = sx[k];
        y1 = sy[k];
      }
      const b0 = Math.max(0, Math.ceil(x0));
      const b1 = Math.min(sky.length - 1, Math.floor(x1));
      const slope = x1 > x0 ? (y1 - y0) / (x1 - x0) : 0;
      for (let b = b0; b <= b1; b++) {
        const y = y0 + (b - x0) * slope;
        if (y < sky[b]) sky[b] = y;
      }
    }
  }

  // butt caps: a cap per piece would bead every joint at 2×
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  for (let slot = 0; slot < paths.length; slot++) {
    const path = paths[slot];
    if (!path) continue;
    const level = slot % LEVELS;
    ctx.strokeStyle = INK((level / (LEVELS - 1)) * MESH_MAX);
    ctx.lineWidth = WIDTHS[Math.floor(slot / LEVELS)];
    ctx.stroke(path);
  }
}

/** A soft clearing in everything drawn so far (destination-out), for the marks to sit on. */
export function clearing(ctx: Ctx, x: number, y: number, r: number, strength: number) {
  if (strength <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(0,0,0,${0.9 * strength})`);
  g.addColorStop((r - 3) / r, `rgba(0,0,0,${0.9 * strength})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- labels ---------- */

const PAD = 8;
/** Labels keep this far (CSS px) from the canvas edges. */
const EDGE = 16;
/** Attempts may not stall within this distance (CSS px) of a label. */
const KEEP_OFF = 14;

function glyphWidths(ctx: Ctx, s: string, size: number) {
  ctx.font = `400 ${size}px ${MONO}`;
  return Array.from(s, (ch) => ctx.measureText(ch).width);
}

export type Callout = {
  /** Leader direction: up (-1) or down (+1). */
  dir: -1 | 1;
  /** Preferred shelf direction: left (-1) or right (+1); flips when it would leave the canvas. */
  side: -1 | 1;
};

type Box = { l: number; t: number; r: number; b: number };

/** Where a callout's pieces land: worked out before anything is drawn. */
export type Placed = {
  caps: string;
  widths: number[];
  gapPx: number;
  textW: number;
  /** Leader x and its two ends. */
  x: number;
  y0: number;
  y1: number;
  /** Shelf extent and which end is the far one (the shelf's end dot). */
  s0: number;
  s1: number;
  far: number;
  /** Text left edge and baseline. */
  tx: number;
  ty: number;
  /** Text plus shelf: the no-go zone for the attempts. */
  box: Box;
};

export function place(
  ctx: Ctx,
  scene: Scene,
  m: { x: number; y: number },
  label: string,
  { dir, side }: Callout,
  stem: number,
  size: number,
  tracking: number,
): Placed {
  const caps = label.toUpperCase();
  const widths = glyphWidths(ctx, caps, size);
  const gapPx = size * tracking;
  const textW = widths.reduce((sum, w) => sum + w, 0) + gapPx * (widths.length - 1);
  const x = Math.round(m.x) + 0.5;
  const y0 = m.y + dir * 12;
  const y1 = Math.round(m.y + dir * stem) + 0.5;
  const { width } = scene;
  // flip the shelf when the label would leave the canvas; clamp if neither side fits
  const fits = (s: number) => (s > 0 ? x + PAD + textW + 6 <= width - EDGE : x - PAD - textW - 6 >= EDGE);
  const s = !fits(side) && fits(-side) ? -side : side;
  const tx = clamp(s > 0 ? x + PAD : x - PAD - textW, EDGE, width - EDGE - textW);
  const s0 = Math.min(x, tx - 6);
  const s1 = Math.max(x, tx + textW + 6);
  // text sits on the shelf going up, hangs under it going down
  const ty = dir < 0 ? y1 - 7 : y1 + size + 6;
  const top = dir < 0 ? ty - size : y1 - 1;
  const bottom = dir < 0 ? y1 + 1 : ty + size * 0.3;
  return {
    caps,
    widths,
    gapPx,
    textW,
    x,
    y0,
    y1,
    s0,
    s1,
    far: s > 0 ? s1 : s0,
    tx,
    ty,
    box: { l: s0, t: top, r: s1, b: bottom },
  };
}

const near = (box: Box, x: number, y: number, pad: number) =>
  x > box.l - pad && x < box.r + pad && y > box.t - pad && y < box.b + pad;

/**
 * Hairline leader from the mark, an elbow and a shelf under (or over) the
 * label. Grows in three beats over `u`: leader, shelf, then the text types
 * in over one soft-edged clearing that grows with it, so the mesh never
 * shows through the tracking or the word gaps.
 */
export function callout(ctx: Ctx, c: Placed, color: Rgba, key: string, u: number, size: number) {
  if (u <= 0) return;
  const p = span(u, 0.4, 1);
  const shown = typed(c.caps, p);
  if (shown.length) {
    let w = 0;
    for (let i = 0; i < shown.length; i++) w += c.widths[i] + (i ? c.gapPx : 0);
    const l = c.tx - 5;
    const r = c.tx + w + 5;
    const top = c.ty - size * 0.9;
    const h = size * 1.3;
    const fadeIn = Math.min(0.45, 6 / (r - l));
    const g = ctx.createLinearGradient(l, 0, r, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(fadeIn, 'rgba(0,0,0,0.95)');
    g.addColorStop(1 - fadeIn, 'rgba(0,0,0,0.95)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = g;
    ctx.fillRect(l, top, r - l, h);
    // a softer 3 px fringe above and below, so the clearing has no hard rim
    ctx.globalAlpha = 0.45;
    ctx.fillRect(l, top - 3, r - l, 3);
    ctx.fillRect(l, top + h, r - l, 3);
    ctx.restore();
  }
  const grow = span(u, 0, 0.35);
  line(ctx, c.x, c.y0, c.x, c.y0 + (c.y1 - c.y0) * grow, color(0.6));
  const reach = span(u, 0.25, 0.6);
  if (reach > 0) {
    line(ctx, c.x + (c.s0 - c.x) * reach, c.y1, c.x + (c.s1 - c.x) * reach, c.y1, color(0.5));
    if (reach >= 1) dot(ctx, c.far, c.y1, 1.6, color(0.75));
  }
  if (!shown.length) return;
  ctx.font = `400 ${size}px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cx = c.tx;
  for (let i = 0; i < shown.length; i++) {
    ctx.fillStyle = i === 0 ? key : INK(0.82);
    ctx.fillText(shown[i], cx, c.ty);
    cx += c.widths[i] + c.gapPx;
  }
}

/* ---------- the frame ---------- */

/**
 * The kit's paper halo is tuned for short strokes; a long line on a warm
 * gradient needs a wider, slightly louder tinted bed under glowStroke to
 * read as light rather than as a plain rule.
 */
export function bloom(ctx: Ctx, path: (ctx: Ctx) => void, color: Rgba, width: number) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [w, a] of [
    [width * 11, 0.035],
    [width * 5, 0.07],
  ] as const) {
    ctx.strokeStyle = color(a);
    ctx.lineWidth = w;
    ctx.beginPath();
    path(ctx);
    ctx.stroke();
  }
  ctx.restore();
}

const BANDS = 6;

/**
 * Comet trail along a screen polyline (head last): the last `length` px,
 * louder and wider toward the head. Like the kit's trailPath, but cut into
 * a few bands of equal length, each one subpath with butt caps, so on paper
 * no translucent pieces overlap into beads at the joints.
 */
export function comet(ctx: Ctx, xy: Float32Array, n: number, length: number, color: Rgba, width: number, peak = 0.6) {
  if (n < 2 || length <= 0 || peak <= 0) return;
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  const step = length / BANDS;
  let x = xy[(n - 1) * 2];
  let y = xy[(n - 1) * 2 + 1];
  let next = n - 2;
  let walked = 0;
  for (let band = 0; band < BANDS && next >= 0; band++) {
    const end = step * (band + 1);
    const k = 1 - (band + 0.5) / BANDS;
    ctx.beginPath();
    ctx.moveTo(x, y);
    while (next >= 0) {
      const nx = xy[next * 2];
      const ny = xy[next * 2 + 1];
      const d = Math.hypot(nx - x, ny - y);
      if (walked + d >= end && d > 0) {
        const f = (end - walked) / d;
        x += (nx - x) * f;
        y += (ny - y) * f;
        walked = end;
        ctx.lineTo(x, y);
        break;
      }
      walked += d;
      x = nx;
      y = ny;
      ctx.lineTo(x, y);
      next--;
    }
    ctx.strokeStyle = color(peak * k);
    ctx.lineWidth = width * k + 0.4;
    ctx.stroke();
  }
  ctx.restore();
}

/** Index from which the last `length` px of a screen polyline run. */
function tailFrom(xy: Float32Array, n: number, length: number) {
  let walked = 0;
  for (let i = n - 1; i > 0; i--) {
    walked += Math.hypot(xy[i * 2] - xy[i * 2 - 2], xy[i * 2 + 1] - xy[i * 2 - 1]);
    if (walked >= length) return i - 1;
  }
  return 0;
}

/** Pulse cycle once the path is complete: the comet travels, then B pings. */
const PULSE_PERIOD = 4.6;
const PULSE_TRAVEL = 2.1;

/**
 * Where the labels hang per layout. Wide: both stand up, A's shelf runs left,
 * B's right. Band and phones: A's leader drops (clear of the path that leaves
 * it up and right); on the band B's drops too, clear of the crest.
 */
const CALLOUTS: Record<Layout, { a: Callout; b: Callout }> = {
  wide: { a: { dir: -1, side: -1 }, b: { dir: -1, side: 1 } },
  band: { a: { dir: 1, side: 1 }, b: { dir: 1, side: -1 } },
  tall: { a: { dir: 1, side: 1 }, b: { dir: -1, side: -1 } },
};

export function drawScene(ctx: CanvasRenderingContext2D, scene: Scene, frame: Frame) {
  const { width, height } = scene;
  const { p, t, intro, since, still } = frame;
  const wide = scene.layout !== 'tall';
  ctx.clearRect(0, 0, width, height);

  drawMesh(ctx, scene, t, intro);

  const settle = clamp01((intro - 0.55) / 0.45);
  const a = pointOn(scene, A, t, 0.012);
  const b = pointOn(scene, B, t, 0.012);

  // Labels are placed first: they decide where the attempts may stall.
  const size = wide ? 11 : 10;
  const tracking = wide ? 0.2 : 0.16;
  const stem = scene.layout === 'wide' ? 64 : scene.layout === 'band' ? 44 : 38;
  const spots = CALLOUTS[scene.layout];
  const labelA = place(ctx, scene, a, scene.labels.a, spots.a, stem, size, tracking);
  const labelB = place(ctx, scene, b, scene.labels.b, spots.b, stem, size, tracking);
  // (crossing a leader is fine; running into the text or the shelf is not)
  const keepOff = (x: number, y: number) => near(labelA.box, x, y, KEEP_OFF) || near(labelB.box, x, y, KEEP_OFF);

  // Basin rings: the two stable states, as tinted contour hairlines.
  const rings = (set: Line3[], color: Rgba) => {
    set.forEach((r, index) => {
      const n = screenPolyline(scene, r, t, 0.004);
      ctx.beginPath();
      polyline(r.xy, n)(ctx);
      ctx.strokeStyle = color([0.62, 0.36, 0.2][index] * settle);
      ctx.lineWidth = index === 0 ? 1 : 0.8;
      ctx.stroke();
    });
  };
  ctx.lineJoin = 'round';
  rings(scene.ringsA, TEAL);
  rings(scene.ringsB, ORANGE);
  // the marks sit on a small clearing, so no mesh or contour runs through them
  clearing(ctx, a.x, a.y, 10, settle);
  clearing(ctx, b.x, b.y, 10, settle);

  // Trial and error: dashed attempts leave A, wander and stall. The one
  // running now carries a short solid ink trail and a ringed head. An attempt
  // that would run into a label stops short of it and fades out, without an ×.
  const count = scene.attempts.length;
  const runs = ATTEMPTS_TO - ATTEMPTS_FROM;
  const windowLength = runs * 0.24;
  const attemptStride = (runs - windowLength) / (count - 1);
  ctx.lineCap = 'butt';
  for (let index = 0; index < count; index++) {
    const start = ATTEMPTS_FROM + index * attemptStride;
    const local = clamp01((p - start) / windowLength);
    if (local <= 0) continue;
    const done = local >= 1;
    const afterDone = clamp01((p - start - windowLength) / 0.06);
    let alpha = done ? 0.6 - 0.32 * afterDone : 0.6;
    // Once the turn arrives the failures recede to faint traces.
    const fadeFrom = ATTEMPTS_TO + 0.01;
    if (p > fadeFrom) alpha = Math.min(alpha, 0.26 - 0.1 * clamp01((p - fadeFrom) / 0.18));
    const attempt = scene.attempts[index];
    const xy = attempt.xy;
    let n = screenPolyline(scene, attempt, t, 0.01, easeOut(local));
    let blocked = false;
    for (let i = 1; i < n; i++) {
      if (keepOff(xy[i * 2], xy[i * 2 + 1])) {
        n = i;
        blocked = true;
        break;
      }
    }
    if (n < 2) continue;
    const tail = blocked ? tailFrom(xy, n, 28) : n - 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    polyline(xy, tail + 1)(ctx);
    ctx.strokeStyle = INK(alpha);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (tail < n - 1) {
      ctx.beginPath();
      polyline(xy, n, tail)(ctx);
      ctx.strokeStyle = INK(alpha * 0.4);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const hx = xy[(n - 1) * 2];
    const hy = xy[(n - 1) * 2 + 1];
    if (done) {
      if (blocked) continue;
      const s = wide ? 3.5 : 3;
      ctx.beginPath();
      ctx.moveTo(hx - s, hy - s);
      ctx.lineTo(hx + s, hy + s);
      ctx.moveTo(hx + s, hy - s);
      ctx.lineTo(hx - s, hy + s);
      ctx.strokeStyle = INK(alpha + 0.1);
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      comet(ctx, xy, n, wide ? 70 : 50, INK, 1.5, 0.72);
      dot(ctx, hx, hy, 1.9, INK(0.85));
      circle(ctx, hx, hy, 5, INK(0.32));
    }
  }

  // The confident path: A over the saddle into B, a glowing teal line that
  // draws on with scroll, a comet head at its leading end.
  const q = easeInOut(clamp01((p - PATH_FROM) / (PATH_TO - PATH_FROM)));
  const glowW = wide ? 1.6 : 1.4;
  if (q > 0) {
    const xy = scene.path.xy;
    const n = screenPolyline(scene, scene.path, t, 0.016, q);
    if (n > 1) {
      bloom(ctx, polyline(xy, n), TEAL, glowW);
      glowStroke(ctx, THEME, polyline(xy, n), TEAL, glowW, 1.35);
      if (q < 1) {
        comet(ctx, xy, n, wide ? 150 : 90, TEAL_INK, wide ? 2.6 : 2.2);
        head(ctx, THEME, xy[(n - 1) * 2], xy[(n - 1) * 2 + 1], TEAL, wide ? 1 : 0.85);
      }
    }
  }

  // Once complete, a pulse travels the path every few seconds and pings B.
  // On paper light is an intensification: a deeper teal core a little wider
  // than the line, over a short teal bed, with the house head at the front.
  let ping = 0;
  if (!still && q >= 1 && since >= 0) {
    const phase = (since + PULSE_TRAVEL) % PULSE_PERIOD;
    if (phase < PULSE_TRAVEL) {
      const f = easeInOut(phase / PULSE_TRAVEL);
      const xy = scene.pulseXY;
      const n = screenPolyline(scene, scene.path, t, 0.016, f, xy);
      const gate = ease(f / 0.08) * ease((1 - f) / 0.08);
      if (n > 1 && gate > 0) {
        const tail = wide ? 70 : 50;
        comet(ctx, xy, n, tail, TEAL, glowW * 6, 0.08 * 2 * gate);
        comet(ctx, xy, n, tail, TEAL_INK, glowW + 1, 0.95 * gate);
        head(ctx, THEME, xy[(n - 1) * 2], xy[(n - 1) * 2 + 1], TEAL, (wide ? 0.85 : 0.75) * (0.4 + 0.6 * gate));
      }
    } else ping = (phase - PULSE_TRAVEL) / (PULSE_PERIOD - PULSE_TRAVEL);
  }

  // A and B: ring and core with a soft halo. B answers each arrival with a ring.
  const mark = (m: { x: number; y: number }, color: Rgba, s: number) => {
    if (s <= 0) return;
    halo(ctx, THEME, m.x, m.y, 24, color, 0.55 * s);
    circle(ctx, m.x, m.y, 7.5, color(0.9 * s), undefined, 1);
    dot(ctx, m.x, m.y, 3, color(s));
  };
  mark(a, TEAL, settle);
  const arrived = clamp01((p - PATH_TO) / 0.04);
  mark(b, ORANGE, settle);
  if (ping > 0 && ping < 1) {
    const u = easeOut(ping * 1.4);
    circle(ctx, b.x, b.y, 8 + 26 * u, ORANGE(0.7 * (1 - clamp01(ping * 1.4)) * arrived), undefined, 1);
  } else if (still && arrived > 0) {
    circle(ctx, b.x, b.y, 14, ORANGE(0.4), undefined, 0.8);
  }

  // Labels: hairline leaders and letter-spaced caps, typed in after the marks.
  callout(ctx, labelA, TEAL, TEAL_INK(1), settle, size);
  callout(ctx, labelB, ORANGE, AMBER_INK(1), settle, size);
}
