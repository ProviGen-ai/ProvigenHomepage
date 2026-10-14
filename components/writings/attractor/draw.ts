/*
 * Canvas drawing for the toggle-switch figure. Free of React: the component
 * owns size, visibility and the motion gate; model.ts owns the dynamics; this
 * file owns the picture. Phase plane: offset axes, a faint flow field (the
 * resting field and, during the push, the pushed one), the separatrix of the
 * resting system, the two attractor rings and the cells with short fading
 * trails. Below it, the push trace u(t) with its time cursor. 1px ink lines;
 * teal and orange appear only once a cycle has settled.
 */
import {
  CYCLE,
  PUSH,
  PUSH_OFF,
  PUSH_ON,
  TRAIL_LEN,
  drift,
  fixedPoints,
  type Run,
  type Trace,
} from './model';

export type Rgb = readonly [number, number, number];
export type Palette = { ink: Rgb; teal: Rgb; orange: Rgb };

/*
 * Data window on both axes (dimensionless expression). The axes sit at LO,
 * below zero, so the cloud at A (Y ≈ 0) does not lie on a line, and the
 * attractor labels have a margin to sit in.
 */
export const LO = -0.45;
export const HI = 5;
/** 0..1 along an axis. */
export const frac = (v: number) => (v - LO) / (HI - LO);

export const POINTS = fixedPoints();

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
/** The one easing: cubic in-out, the canvas twin of --e-in-out. */
export const ease = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};

const css = ([r, g, b]: Rgb, alpha: number) => `rgb(${r} ${g} ${b} / ${clamp01(alpha).toFixed(3)})`;
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const FALLBACK: Palette = { ink: [19, 19, 18], teal: [66, 145, 149], orange: [226, 159, 55] };

/** Brand colours from the v3 tokens in app/site.css (fallbacks are the same hexes). */
export function readPalette(el: Element): Palette {
  const style = getComputedStyle(el);
  const hex = (name: string, fallback: Rgb): Rgb => {
    const m = /^#([0-9a-f]{6})$/i.exec(style.getPropertyValue(name).trim());
    if (!m) return fallback;
    const n = Number.parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  };
  return {
    ink: hex('--c-ink', FALLBACK.ink),
    teal: hex('--c-teal', FALLBACK.teal),
    orange: hex('--c-orange', FALLBACK.orange),
  };
}

const px = (x: number, size: number) => frac(x) * size;
const py = (y: number, size: number) => (1 - frac(y)) * size;

/**
 * The flow field under push u, as short streamlets on a regular grid,
 * rendered once per size into its own canvas (or into `layer`, reused, when
 * only u changes). Each streamlet follows the field for a length that
 * saturates with speed, fades in from its tail and ends in a dot, so the
 * direction reads without arrowheads.
 */
export function flowLayer(
  size: number,
  dpr: number,
  palette: Palette,
  u: number,
  layer: HTMLCanvasElement = document.createElement('canvas'),
) {
  layer.width = Math.round(size * dpr);
  layer.height = Math.round(size * dpr);
  const ctx = layer.getContext('2d');
  if (!ctx) return layer;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  const n = Math.max(11, Math.round(size / 27));
  const cell = (HI - LO) / n;
  const SEGS = 4;
  const paths = Array.from({ length: SEGS }, () => new Path2D());
  const heads = new Path2D();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let x = LO + (i + 0.5) * cell;
      let y = LO + (j + 0.5) * cell;
      if (x < 0 || y < 0) continue;
      const [dx0, dy0] = drift(x, y, u);
      const speed = Math.hypot(dx0, dy0);
      const length = cell * 0.5 * (speed / (speed + 0.6));
      const ds = length / SEGS;
      // Centre the streamlet on its grid point.
      x -= (dx0 / (speed || 1)) * length * 0.5;
      y -= (dy0 / (speed || 1)) * length * 0.5;
      for (let s = 0; s < SEGS; s++) {
        const [dx, dy] = drift(x, y, u);
        const v = Math.hypot(dx, dy) || 1;
        const nx = x + (dx / v) * ds;
        const ny = y + (dy / v) * ds;
        paths[s].moveTo(px(x, size), py(y, size));
        paths[s].lineTo(px(nx, size), py(ny, size));
        x = nx;
        y = ny;
      }
      const hx = px(x, size);
      const hy = py(y, size);
      heads.moveTo(hx + 0.9, hy);
      heads.arc(hx, hy, 0.9, 0, Math.PI * 2);
    }
  }
  ctx.lineWidth = 1;
  paths.forEach((path, s) => {
    ctx.strokeStyle = css(palette.ink, 0.02 + 0.13 * ((s + 1) / SEGS) ** 1.5);
    ctx.stroke(path);
  });
  ctx.fillStyle = css(palette.ink, 0.2);
  ctx.fill(heads);
  return layer;
}

export type Layers = { rest: HTMLCanvasElement; pushed: HTMLCanvasElement };

/** Ground of the plane: flow field (cross-faded to the pushed field by `push`), axes, separatrix. */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  size: number,
  palette: Palette,
  layers: Layers,
  push: number,
) {
  ctx.clearRect(0, 0, size, size);
  if (push < 1) {
    ctx.globalAlpha = 1 - push;
    ctx.drawImage(layers.rest, 0, 0, size, size);
  }
  if (push > 0) {
    ctx.globalAlpha = push;
    ctx.drawImage(layers.pushed, 0, 0, size, size);
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;

  // Offset axes.
  ctx.beginPath();
  ctx.moveTo(0.5, 0);
  ctx.lineTo(0.5, size - 0.5);
  ctx.lineTo(size, size - 0.5);
  ctx.strokeStyle = css(palette.ink, 0.5);
  ctx.stroke();

  // Separatrix x = y of the resting system, from the origin out.
  ctx.beginPath();
  ctx.moveTo(px(0, size), py(0, size));
  ctx.lineTo(px(HI, size), py(HI, size));
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = css(palette.ink, 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
}

/** The two attractors as thin rings, drawn over the cells so a full basin still shows its centre. */
export function drawRings(ctx: CanvasRenderingContext2D, size: number, palette: Palette) {
  const r = ringRadius(size);
  ctx.beginPath();
  for (const p of [POINTS.a, POINTS.b]) {
    const cx = px(p.x, size);
    const cy = py(p.y, size);
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = css(palette.ink, 0.75);
  ctx.stroke();
}

export const ringRadius = (size: number) => Math.max(6, Math.min(9, size * 0.02));
const dotRadius = (size: number) => (size < 360 ? 1.45 : 1.7);

/**
 * Cells and their trails. `reveal` (0..1) tints each cell by its fate, read
 * once when the relax phase ends (orange for A, teal for B), so the colours
 * always match the printed counts and the still, even for a late cell that
 * drifts across x = y during the hold. Before that every cell is ink. `alpha`
 * fades the cloud in and out between cycles.
 */
export function drawCells(
  ctx: CanvasRenderingContext2D,
  size: number,
  palette: Palette,
  run: Run,
  reveal: number,
  alpha: number,
) {
  if (alpha <= 0) return;
  const { x, y, tx, ty, head, filled, fate, settled } = run;
  const inBAt = (i: number) => (settled ? fate[i] === 1 : y[i] > x[i]);
  const r = dotRadius(size);
  const groups: [Rgb, boolean][] = [
    [mix(palette.ink, palette.orange, reveal), false],
    [mix(palette.ink, palette.teal, reveal), true],
  ];
  ctx.lineWidth = 1;
  for (const [colour, inB] of groups) {
    // Trails, newest segment first, each age in one stroke.
    for (let k = 0; k < filled; k++) {
      const newer = (head - k + 1 + TRAIL_LEN) % TRAIL_LEN;
      const older = (head - k + TRAIL_LEN) % TRAIL_LEN;
      ctx.beginPath();
      for (let i = 0; i < x.length; i++) {
        if (inBAt(i) !== inB) continue;
        const o = i * TRAIL_LEN;
        const ax = k === 0 ? x[i] : tx[o + newer];
        const ay = k === 0 ? y[i] : ty[o + newer];
        ctx.moveTo(px(ax, size), py(ay, size));
        ctx.lineTo(px(tx[o + older], size), py(ty[o + older], size));
      }
      ctx.strokeStyle = css(colour, alpha * 0.26 * (1 - k / TRAIL_LEN) ** 1.6);
      ctx.stroke();
    }
    ctx.beginPath();
    for (let i = 0; i < x.length; i++) {
      if (inBAt(i) !== inB) continue;
      const cx = px(x[i], size);
      const cy = py(y[i], size);
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = css(colour, alpha * (0.82 + 0.18 * reveal));
    ctx.fill();
  }
}

/**
 * The still figure: every cell's whole path from the start of the push to the
 * settled state, faint and tinted by where it ended, with the end states on top.
 */
export function drawTraces(
  ctx: CanvasRenderingContext2D,
  size: number,
  palette: Palette,
  trace: Trace,
) {
  const { run, samples, px: tx, py: ty } = trace;
  const cells = run.x.length;
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  for (let i = 0; i < cells; i++) {
    const o = i * samples;
    ctx.beginPath();
    ctx.moveTo(px(tx[o], size), py(ty[o], size));
    for (let s = 1; s < samples; s++) ctx.lineTo(px(tx[o + s], size), py(ty[o + s], size));
    ctx.strokeStyle = css(run.fate[i] ? palette.teal : palette.orange, 0.085);
    ctx.stroke();
  }
  const r = dotRadius(size);
  for (const inB of [0, 1]) {
    ctx.beginPath();
    for (let i = 0; i < cells; i++) {
      if (run.fate[i] !== inB) continue;
      const cx = px(run.x[i], size);
      const cy = py(run.y[i], size);
      ctx.moveTo(cx + r, cy);
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = css(inB ? palette.teal : palette.orange, 1);
    ctx.fill();
  }
}

/**
 * The push trace: u(t) over one cycle as a square pulse, its height in
 * proportion to the slider's range. Live, the part already played is ink and
 * a hairline cursor marks now; still (t = null), the whole trace is ink.
 */
export function drawStrip(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: Palette,
  strength: number,
  t: number | null,
) {
  ctx.clearRect(0, 0, width, height);
  const base = height - 0.5;
  const top = base - Math.max(0, (strength / PUSH.max) * (height - 4));
  const at = (time: number) => Math.round((time / CYCLE) * (width - 1)) + 0.5;
  const trace = new Path2D();
  trace.moveTo(0, base);
  trace.lineTo(at(PUSH_ON), base);
  trace.lineTo(at(PUSH_ON), top);
  trace.lineTo(at(PUSH_OFF), top);
  trace.lineTo(at(PUSH_OFF), base);
  trace.lineTo(width, base);
  ctx.lineWidth = 1;
  ctx.lineJoin = 'miter';
  if (t === null) {
    ctx.strokeStyle = css(palette.ink, 0.85);
    ctx.stroke(trace);
    return;
  }
  ctx.strokeStyle = css(palette.ink, 0.2);
  ctx.stroke(trace);
  const now = at(t);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, now, height);
  ctx.clip();
  ctx.strokeStyle = css(palette.ink, 0.85);
  ctx.stroke(trace);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(now, 0);
  ctx.lineTo(now, height);
  ctx.strokeStyle = css(palette.ink, 0.4);
  ctx.stroke();
}
