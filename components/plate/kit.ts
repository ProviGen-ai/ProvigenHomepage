/*
 * Plate kit: the drawing language for every animated figure on the site
 * (1 Oct 2026, after the instrument-panel figures in Extropic's "First Sparks
 * of Thermodynamic Recursive Intelligence"). Canvas 2D, hand-drawn per frame:
 *
 * - Hairlines carry structure: 1 logical px at low alpha (0.08 to 0.2).
 * - Light is reserved for what is happening now: a live element is drawn
 *   bright, and on a dark plate it is composited additively, so overlapping
 *   strokes and halos read as glow. Nothing is blurred; glow is layered alpha.
 * - Labels are PP Supply Mono Regular (Geist Mono until 3 Oct 2026), 10 to
 *   12 logical px, caps letter-spaced; numbers and quiet labels lower case,
 *   never bold.
 * - One accent per meaning: mint is the live signal and what was kept; orange
 *   is B, out of spec and what was reverted; paper is structure and text.
 *
 * Two themes share the primitives: PLATE (the film's green-black ground, glow
 * by additive light) and PAPER (ink on the page, glow by a soft tinted halo).
 * Every colour is a function of alpha, so a draw call says how loud it is.
 */

export type Rgba = (alpha: number) => string;
export type Ctx = CanvasRenderingContext2D;

const rgba =
  (r: number, g: number, b: number): Rgba =>
  (a) =>
    `rgba(${r},${g},${b},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(3)})`;

/* Brand swatches (app/site.css), as alpha functions. */
export const PAPER = rgba(248, 244, 239); // --c-paper
export const INK = rgba(19, 19, 18); // --c-ink
export const MINT = rgba(162, 208, 190); // --c-mint
export const MINT_HOT = rgba(214, 238, 228); // mint lifted toward white: the core of a live point
export const TEAL = rgba(66, 145, 149); // --c-teal
export const TEAL_INK = rgba(42, 102, 105); // --c-teal-ink
export const ORANGE = rgba(226, 159, 55); // --c-orange
export const AMBER_INK = rgba(138, 85, 9); // --c-amber-ink
export const SAND = rgba(230, 217, 171); // --c-sand

/** The plate ground: the customer film's green-black (Inside.css #0e1d1a). */
export const PLATE_GROUND = '#0e1d1a';
export const PAPER_GROUND = '#f8f4ef';

export type Theme = {
  readonly name: 'plate' | 'paper';
  /** Fill behind the drawing (the canvas is cleared to this each frame). */
  readonly ground: string;
  /** Hairlines, dial ticks, axes, quiet structure. */
  readonly line: Rgba;
  /** Text and labels. */
  readonly text: Rgba;
  /** The live signal, the active station, what was kept. */
  readonly live: Rgba;
  /** The hot core of a live point (brighter than live). */
  readonly hot: Rgba;
  /** B, out of spec, what was reverted. */
  readonly warn: Rgba;
  /** How light adds up: 'lighter' on the plate, plain over on paper. */
  readonly blend: GlobalCompositeOperation;
  /** Alpha multiplier for halos (paper halos must stay faint to read as glow, not smudge). */
  readonly halo: number;
};

export const PLATE: Theme = {
  name: 'plate',
  ground: PLATE_GROUND,
  line: PAPER,
  text: PAPER,
  live: MINT,
  hot: MINT_HOT,
  warn: ORANGE,
  blend: 'lighter',
  halo: 1,
};

export const PAPER_THEME: Theme = {
  name: 'paper',
  ground: PAPER_GROUND,
  line: INK,
  text: INK,
  live: TEAL,
  hot: TEAL_INK,
  warn: ORANGE,
  blend: 'source-over',
  halo: 0.55,
};

export const MONO = '"PP Supply Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
export const TAU = Math.PI * 2;

/* ---------- numbers ---------- */

export const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
/** Smoothstep: the default ease for every travel and fade. */
export const ease = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
/** Ease-out cubic: for things that arrive and settle. */
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 3;
/** Ease-in-out cubic: for longer travels. */
export const easeInOut = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
/** 0 → 1 over [a, b] of t, eased. */
export const span = (t: number, a: number, b: number) => ease((t - a) / (b - a));
/** Deterministic hash in [0, 1): the same (i, seed) always lights the same thing. */
export const hash = (i: number, seed = 0) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
/** Seeded PRNG (xorshift32) for figures that need a reproducible sequence. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/* ---------- device pixels ---------- */

/**
 * A plate is scaled to its box, so one logical px is rarely one device px, and
 * a hairline or a text baseline that falls between two device pixels is
 * smeared over both. A grid puts them back on whole pixels of the backing
 * store (`px` is store px per logical px, PlateFrame.px; usePlate sizes the
 * store at the screen's DPR, so these are device pixels): `at` for a baseline or an edge,
 * `mid` for the centre line of a stroke `w` logical px wide, `w` for a stroke
 * width in whole device px (never under one). Only straight horizontal and
 * vertical marks are snapped; arcs and curves stay smooth.
 */
export type Grid = {
  readonly at: (v: number) => number;
  readonly mid: (v: number, w?: number) => number;
  readonly w: (w?: number) => number;
};

export function grid(px: number): Grid {
  const dev = (lw: number) => Math.max(1, Math.round(lw * px));
  return {
    at: (v) => Math.round(v * px) / px,
    mid: (v, lw = 1) => {
      const d = dev(lw);
      return (Math.round(v * px - d / 2) + d / 2) / px;
    },
    w: (lw = 1) => dev(lw) / px,
  };
}

/* ---------- compositing ---------- */

/**
 * Fill the frame with the theme ground. Draw it first, every frame: additive
 * light then adds onto the real ground colour, not onto transparent black.
 */
export function ground(ctx: Ctx, theme: Theme, w: number, h: number) {
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 0, w, h);
}

/** Run draw calls with the theme's light blend (additive on the plate). */
export function lit(ctx: Ctx, theme: Theme, fn: () => void) {
  ctx.save();
  ctx.globalCompositeOperation = theme.blend;
  fn();
  ctx.restore();
}

/* ---------- text ---------- */

export type Align = 'left' | 'center' | 'right';

/**
 * One line of mono text. Size is in logical px; weight 400 by default (the
 * site's labels are thin, but 300 breaks up on a dark ground below 12 px).
 */
export function text(
  ctx: Ctx,
  x: number,
  y: number,
  s: string,
  color: string,
  align: Align = 'left',
  size = 12,
  weight = 400,
) {
  ctx.font = `${weight} ${size}px ${MONO}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

/** Width of a string in the mono face at a size (for strike-throughs, underlines, layout). */
export function measure(ctx: Ctx, s: string, size = 12, weight = 400) {
  ctx.font = `${weight} ${size}px ${MONO}`;
  return ctx.measureText(s).width;
}

/**
 * Caps label with even tracking (em fraction), drawn glyph by glyph so it
 * matches in every browser (canvas letterSpacing is not everywhere yet).
 */
export function spaced(
  ctx: Ctx,
  x: number,
  y: number,
  s: string,
  color: string,
  align: Align = 'left',
  size = 11,
  tracking = 0.32,
  weight = 400,
) {
  ctx.font = `${weight} ${size}px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  const gap = size * tracking;
  const widths = Array.from(s, (ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, w) => a + w, 0) + gap * Math.max(0, widths.length - 1);
  let cx = align === 'left' ? x : align === 'center' ? x - total / 2 : x - total;
  Array.from(s).forEach((ch, i) => {
    ctx.fillText(ch, cx, y);
    cx += widths[i] + gap;
  });
  return total;
}

/** The first share p of a string, for text that types itself in. */
export const typed = (s: string, p: number) => s.slice(0, Math.ceil(s.length * clamp01(p)));

/* ---------- lines ---------- */

export function line(
  ctx: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  width = 1,
  dash?: readonly number[],
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash as number[]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  if (dash) ctx.setLineDash([]);
}

export function circle(
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  stroke?: string,
  fill?: string,
  width = 1,
) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

export function dot(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/**
 * A stroke with light: a wide faint pass, a mid pass and a thin bright core,
 * composited with the theme blend. `path` adds the subpath (no beginPath).
 */
export function glowStroke(
  ctx: Ctx,
  theme: Theme,
  path: (ctx: Ctx) => void,
  color: Rgba,
  width = 1.2,
  strength = 1,
) {
  const h = theme.halo * strength;
  lit(ctx, theme, () => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const passes: [number, number][] = [
      [width * 7, 0.035 * h],
      [width * 3.2, 0.09 * h],
      [width, 0.92 * strength],
    ];
    for (const [w, a] of passes) {
      ctx.strokeStyle = color(a);
      ctx.lineWidth = w;
      ctx.beginPath();
      path(ctx);
      ctx.stroke();
    }
  });
}

/** A soft round halo (radial gradient), the glow under a live point. */
export function halo(ctx: Ctx, theme: Theme, x: number, y: number, r: number, color: Rgba, a = 0.35) {
  lit(ctx, theme, () => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color(a * theme.halo));
    g.addColorStop(0.35, color(a * 0.35 * theme.halo));
    g.addColorStop(1, color(0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  });
}

/**
 * The comet head: a bright core, a hairline ring and a soft halo. The house
 * mark for "the signal is here".
 */
export function head(ctx: Ctx, theme: Theme, x: number, y: number, color: Rgba = theme.live, scale = 1) {
  halo(ctx, theme, x, y, 16 * scale, color, 0.42);
  lit(ctx, theme, () => {
    dot(ctx, x, y, 3 * scale, theme.name === 'plate' && color === theme.live ? theme.hot(1) : color(1));
    circle(ctx, x, y, 7 * scale, color(0.45));
  });
}

/**
 * Comet trail along a circle arc ending at angle `at` (radians, canvas
 * convention: 0 = 3 o'clock, clockwise positive). `length` is the arc behind
 * the head in radians; the trail brightens and thickens toward the head.
 */
export function trailArc(
  ctx: Ctx,
  theme: Theme,
  cx: number,
  cy: number,
  r: number,
  at: number,
  length: number,
  color: Rgba = theme.live,
  segments = 16,
  width = 2.4,
) {
  if (length <= 0) return;
  lit(ctx, theme, () => {
    ctx.lineCap = 'round';
    const step = length / segments;
    for (let s = 0; s < segments; s++) {
      const k = 1 - s / segments;
      ctx.strokeStyle = color(0.55 * k);
      ctx.lineWidth = width * k + 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, at - step * (s + 1), at - step * s);
      ctx.stroke();
    }
  });
}

/**
 * Comet trail along any polyline (points in order, head last): the last
 * `length` logical px of the path, brightening toward the head.
 */
export function trailPath(
  ctx: Ctx,
  theme: Theme,
  pts: readonly (readonly [number, number])[],
  length: number,
  color: Rgba = theme.live,
  width = 2.2,
) {
  if (pts.length < 2 || length <= 0) return;
  // walk back from the head, cutting the path into short pieces
  const pieces: [number, number, number, number, number][] = [];
  let walked = 0;
  for (let i = pts.length - 1; i > 0 && walked < length; i--) {
    const [x1, y1] = pts[i];
    const [x0, y0] = pts[i - 1];
    const d = Math.hypot(x1 - x0, y1 - y0);
    pieces.push([x0, y0, x1, y1, walked]);
    walked += d;
  }
  lit(ctx, theme, () => {
    ctx.lineCap = 'round';
    for (const [x0, y0, x1, y1, w] of pieces) {
      const k = 1 - clamp01(w / length);
      if (k <= 0) continue;
      ctx.strokeStyle = color(0.55 * k);
      ctx.lineWidth = width * k + 0.4;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  });
}

/** Dial ticks around a ring: every tick short, every `major`-th long, every `skip`-th left out. */
export function dial(
  ctx: Ctx,
  cx: number,
  cy: number,
  r: number,
  n: number,
  color: string,
  { major = 6, skip = 0, short = 3, long = 6, inward = true } = {},
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    if (skip && k % skip === 0) continue;
    const a = (k / n) * TAU;
    const l = k % major === 0 ? long : short;
    const r0 = inward ? r - l : r;
    const r1 = inward ? r : r + l;
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
  }
  ctx.stroke();
}

/** Faint registration dot grid over the whole plate. */
export function dotGrid(ctx: Ctx, w: number, h: number, step: number, color: string, size = 1.1) {
  ctx.fillStyle = color;
  const o = step / 2;
  for (let y = o; y < h; y += step) for (let x = o; x < w; x += step) ctx.fillRect(x - size / 2, y - size / 2, size, size);
}

/** A strike-through for a reverted row: a hairline through the x-height, above an arrow's shaft. */
export function strike(ctx: Ctx, x: number, y: number, w: number, color: string, size = 12) {
  line(ctx, x, y - size * 0.37, x + w, y - size * 0.37, color, 1);
}

/* ---------- white ground (How it works, 3 Oct 2026) ---------- */

/**
 * A figure drawn straight on a white section, with no panel of its own: the
 * paper theme (ink structure, teal light) on #fff. Orange itself is 2.3:1 on
 * white, too faint for a mark, so the warn colour is orange deepened halfway
 * to amber-ink (3.6:1); orange text stays AMBER_INK.
 */
export const WHITE_GROUND = '#ffffff';
export const ORANGE_DEEP = rgba(182, 122, 32);
export const WHITE_THEME: Theme = { ...PAPER_THEME, ground: WHITE_GROUND, warn: ORANGE_DEEP };

/**
 * trailArc for a light ground: the same taper, cut into a few bands of equal
 * length, each one arc with butt caps. Round caps overlap at every joint; on
 * the plate that adds up as glow, on white it reads as beads.
 */
export function trailArcBands(
  ctx: Ctx,
  theme: Theme,
  cx: number,
  cy: number,
  r: number,
  at: number,
  length: number,
  color: Rgba = theme.live,
  bands = 8,
  width = 2.4,
  peak = 0.55,
) {
  if (length <= 0 || peak <= 0) return;
  lit(ctx, theme, () => {
    ctx.lineCap = 'butt';
    const step = length / bands;
    for (let s = 0; s < bands; s++) {
      const k = 1 - (s + 0.5) / bands;
      ctx.strokeStyle = color(peak * k);
      ctx.lineWidth = width * k + 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, at - step * (s + 1), at - step * s);
      ctx.stroke();
    }
  });
}
