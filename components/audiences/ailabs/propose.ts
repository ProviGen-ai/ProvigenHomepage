/*
 * /ai-labs hero figure, "Models propose. Experiments decide." (8 Oct 2026),
 * drawn with the plate kit on the hero's own field (no ground of its own).
 *
 * One design axis. Above it, the model: thirty posterior samples as ink
 * hairlines and their mean (the spread of the samples is the band). Below it, the model's
 * uncertainty as a profile. Each round:
 *
 *   1. propose: the model marks where it is least certain (the profile's
 *      peaks) and a dashed line rises from each mark;
 *   2. measure: a teal signal climbs each line from the axis and settles
 *      where the lab measures the response;
 *   3. decide: the samples pinch onto the new points (briefly lit teal),
 *      the band narrows and the profile falls.
 *
 * Five rounds, a hold on the settled model, then everything recedes to the
 * prior and it starts again. Ink is the model; teal is what experiments
 * return. No numbers, no units.
 */
import {
  INK,
  PAPER_THEME,
  TEAL,
  TEAL_INK,
  circle,
  clamp01,
  dot,
  easeInOut,
  easeOut,
  grid,
  halo,
  head,
  line,
  spaced,
  text,
  trailPath,
  type Ctx,
} from '@/components/plate/kit';
import type { PlateFrame, PlateLayout } from '@/components/plate/usePlate';
import { N, R, STATES, XS, type State } from './posterior';

const THEME = PAPER_THEME;

export const LAYOUTS = {
  wide: { w: 760, h: 510, key: 'wide' },
  narrow: { w: 520, h: 480, key: 'narrow' },
} as const satisfies Record<string, PlateLayout>;

const NARROW_BELOW = 640;
export const pickLayout = (cssWidth: number): PlateLayout =>
  cssWidth < NARROW_BELOW ? LAYOUTS.narrow : LAYOUTS.wide;

type Geo = {
  x0: number;
  x1: number;
  /** Value 0. */
  cy: number;
  /** Logical px per unit of response. */
  amp: number;
  top: number;
  bottom: number;
  axisY: number;
  stripY: number;
  stripH: number;
  labelY: number;
  size: number;
};

const GEO: Record<'wide' | 'narrow', Geo> = {
  wide: { x0: 16, x1: 744, cy: 200, amp: 72, top: 30, bottom: 370, axisY: 386, stripY: 464, stripH: 46, labelY: 494, size: 13 },
  narrow: { x0: 12, x1: 508, cy: 180, amp: 60, top: 34, bottom: 322, axisY: 338, stripY: 414, stripH: 40, labelY: 452, size: 16 },
};

/* ---------- time ---------- */

const INTRO = 1.2;
const ROUND = 4.8;
const HOLD = 2.8;
const RESET = 1.8;
export const CYCLE = INTRO + R * ROUND + HOLD + RESET;

/** Inside a round (seconds from its start). */
const PROPOSE = 0; // dashed lines start to rise
const RISE = 0.7; // how long a line takes
const MEASURE = 0.95; // the first signal leaves the axis
const CLIMB = 0.8;
const STAGGER = 0.18; // between points of one batch
const UPDATE0 = 2.1;
const UPDATE1 = 3.5;
const FADE0 = 3.5; // dashed lines and labels recede
const FADE1 = 4.2;

/** A still for reduced motion: rounds 1–3 measured, round 4's proposals standing. */
export const STILL_AT = INTRO + 3 * ROUND + 0.85;

type Phase =
  | { kind: 'intro'; u: number }
  | { kind: 'round'; r: number; u: number }
  | { kind: 'hold'; u: number }
  | { kind: 'reset'; u: number };

function phaseAt(t: number): Phase {
  let c = ((t % CYCLE) + CYCLE) % CYCLE;
  if (c < INTRO) return { kind: 'intro', u: c };
  c -= INTRO;
  if (c < R * ROUND) {
    const r = Math.floor(c / ROUND);
    return { kind: 'round', r: r + 1, u: c - r * ROUND };
  }
  c -= R * ROUND;
  if (c < HOLD) return { kind: 'hold', u: c };
  return { kind: 'reset', u: c - HOLD };
}

/** The model as drawn: two states and how far between them. */
function modelAt(p: Phase): { a: State; b: State; m: number } {
  switch (p.kind) {
    case 'intro':
      return { a: STATES[0], b: STATES[0], m: 0 };
    case 'round':
      return { a: STATES[p.r - 1], b: STATES[p.r], m: easeInOut((p.u - UPDATE0) / (UPDATE1 - UPDATE0)) };
    case 'hold':
      return { a: STATES[R], b: STATES[R], m: 0 };
    case 'reset':
      return { a: STATES[R], b: STATES[0], m: easeInOut(p.u / RESET) };
  }
}

const mix = (a: Float64Array, b: Float64Array, m: number, g: number) => a[g] + (b[g] - a[g]) * m;

/* ---------- drawing ---------- */

export function drawPropose(ctx: Ctx, f: PlateFrame) {
  const key = f.layout.key === 'narrow' ? 'narrow' : 'wide';
  const G = GEO[key];
  const W = f.layout.w;
  const g = grid(f.px);
  const p = phaseAt(f.moving ? f.t : STILL_AT);
  const { a, b, m } = modelAt(p);

  const X = (x: number) => G.x0 + (G.x1 - G.x0) * x;
  const Y = (v: number) => G.cy - v * G.amp;
  const gx = (i: number) => X(XS[i]);

  /* the plot is clipped above the axis: prior samples run off the top and bottom */
  ctx.save();
  ctx.beginPath();
  ctx.rect(G.x0 - 2, G.top, G.x1 - G.x0 + 4, G.bottom - G.top);
  ctx.clip();

  // the samples: ink hairlines, lit teal while they update
  const lift = Math.sin(Math.PI * clamp01(m)) * (p.kind === 'round' ? 1 : 0);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const curve = (s: number) => {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const v = mix(a.samples[s], b.samples[s], m, i);
      if (i === 0) ctx.moveTo(gx(i), Y(v));
      else ctx.lineTo(gx(i), Y(v));
    }
  };
  ctx.lineWidth = g.w(1);
  for (let s = 0; s < a.samples.length; s++) {
    curve(s);
    ctx.strokeStyle = INK(0.1);
    ctx.stroke();
  }
  if (lift > 0.01) {
    for (let s = 0; s < a.samples.length; s++) {
      curve(s);
      ctx.strokeStyle = TEAL(0.3 * lift);
      ctx.stroke();
    }
  }

  // the mean: it only reads as a belief once there is data, so it comes up as the spread falls
  let spread = 0;
  for (let i = 0; i < N; i++) spread += mix(a.sd, b.sd, m, i);
  spread /= N;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const v = mix(a.mean, b.mean, m, i);
    if (i === 0) ctx.moveTo(gx(i), Y(v));
    else ctx.lineTo(gx(i), Y(v));
  }
  ctx.strokeStyle = INK(0.62 * clamp01((1 - spread) * 4));
  ctx.lineWidth = 1.15;
  ctx.stroke();
  ctx.restore();

  /* the design axis */
  line(ctx, G.x0, g.mid(G.axisY), G.x1, g.mid(G.axisY), INK(0.26), g.w(1));

  /* the uncertainty profile */
  const sdAt = (i: number) => mix(a.sd, b.sd, m, i);
  ctx.beginPath();
  ctx.moveTo(gx(0), G.stripY);
  for (let i = 0; i < N; i++) ctx.lineTo(gx(i), G.stripY - sdAt(i) * G.stripH);
  ctx.lineTo(gx(N - 1), G.stripY);
  ctx.closePath();
  ctx.fillStyle = INK(0.05);
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const y = G.stripY - sdAt(i) * G.stripH;
    if (i === 0) ctx.moveTo(gx(i), y);
    else ctx.lineTo(gx(i), y);
  }
  ctx.strokeStyle = INK(0.5);
  ctx.lineWidth = 1;
  ctx.stroke();
  line(ctx, G.x0, g.mid(G.stripY), G.x1, g.mid(G.stripY), INK(0.18), g.w(1));
  spaced(ctx, G.x0, g.at(G.labelY), 'UNCERTAINTY', INK(0.5), 'left', G.size - 1.5, 0.3);

  /* the measurements */
  const settledAlpha = p.kind === 'reset' ? 1 - easeOut(p.u / (RESET * 0.6)) : 1;
  const currentRound = p.kind === 'round' ? p.r : p.kind === 'intro' ? 0 : R + 1;
  const sdIndex = (x: number) => Math.round(x * (N - 1));

  for (const o of b.obs.length >= a.obs.length ? b.obs : a.obs) {
    if (o.round >= currentRound) continue;
    settled(ctx, g, G, X(o.x), Y(o.y), settledAlpha);
  }

  if (p.kind === 'round') {
    const batch = STATES[p.r].obs.filter((o) => o.round === p.r);
    const fade = 1 - easeOut((p.u - FADE0) / (FADE1 - FADE0));
    batch.forEach((o, k) => {
      const x = X(o.x);
      const lag = k * STAGGER;
      // propose: a ring on the profile (drawn on the state before this round) and a dashed line up
      const peakY = G.stripY - STATES[p.r - 1].sd[sdIndex(o.x)] * G.stripH;
      const rise = easeOut((p.u - PROPOSE - lag) / RISE);
      if (rise > 0) {
        const yTop = peakY + (G.top + 6 - peakY) * rise;
        line(ctx, g.mid(x), peakY - 6, g.mid(x), Math.min(peakY - 6, yTop), INK(0.5 * fade), g.w(1), [3, 4]);
        circle(ctx, x, peakY, 4.5, INK(0.7 * Math.min(1, rise * 2) * fade), undefined, 1);
      }
      // measure: a signal climbs from the axis and settles on the response
      const climb = easeInOut((p.u - MEASURE - lag) / CLIMB);
      const yMeasured = Y(o.y);
      if (climb > 0 && climb < 1) {
        const yHead = G.axisY + (yMeasured - G.axisY) * climb;
        const pts: [number, number][] = [];
        for (let j = 0; j <= 12; j++) pts.push([x, G.axisY + (yHead - G.axisY) * (j / 12)]);
        trailPath(ctx, THEME, pts, 46, TEAL, 2);
        head(ctx, THEME, x, yHead, TEAL, 0.85);
      } else if (climb >= 1) {
        const since = p.u - MEASURE - lag - CLIMB;
        settled(ctx, g, G, x, yMeasured, 1);
        const flare = 1 - easeOut(since / 1.1);
        if (flare > 0) {
          halo(ctx, THEME, x, yMeasured, 22, TEAL, 0.55 * flare);
          circle(ctx, x, yMeasured, 6 + 10 * easeOut(since / 0.9), TEAL(0.55 * flare), undefined, 1);
        }
      }
    });

    // the words, once per round, on the batch's first point
    const first = batch[0];
    if (first) {
      const x = X(first.x);
      const right = first.x > 0.72;
      const proposedA = easeOut((p.u - 0.25) / 0.4) * fade;
      if (proposedA > 0) {
        text(ctx, x + (right ? -10 : 10), g.at(G.top + 16), 'proposed', INK(0.72 * proposedA), right ? 'right' : 'left', G.size);
      }
      const measuredA = easeOut((p.u - (MEASURE + CLIMB + 0.1)) / 0.4) * (1 - easeOut((p.u - 4.0) / 0.6));
      if (measuredA > 0) {
        const y = Y(first.y);
        const below = y < G.top + 40;
        text(
          ctx,
          x + (right ? -12 : 12),
          g.at(y + (below ? 20 : -12)),
          'measured',
          TEAL_INK(0.95 * measuredA),
          right ? 'right' : 'left',
          G.size,
        );
      }
    }
  }

  /* the round */
  const roundNo = p.kind === 'intro' ? 1 : p.kind === 'round' ? p.r : R;
  const counterA = p.kind === 'reset' ? 1 - easeOut(p.u / 0.7) : p.kind === 'intro' ? easeOut(p.u / 0.6) : 1;
  if (counterA > 0) {
    spaced(ctx, W - G.x0, g.at(G.top - 12), `ROUND ${String(roundNo).padStart(2, '0')}`, INK(0.62 * counterA), 'right', G.size - 1.5, 0.3);
  }
}

/** A measured point at rest: a teal-ink core in a hairline ring, and its site on the axis. */
function settled(ctx: Ctx, g: ReturnType<typeof grid>, G: Geo, x: number, y: number, alpha: number) {
  if (alpha <= 0) return;
  dot(ctx, x, y, 7, `rgba(248,244,239,${(0.7 * alpha).toFixed(3)})`);
  circle(ctx, x, y, 7, TEAL(0.45 * alpha), undefined, 1);
  dot(ctx, x, y, 3.1, TEAL_INK(alpha));
  line(ctx, g.mid(x), G.axisY - 5, g.mid(x), G.axisY + 5, TEAL_INK(0.7 * alpha), g.w(1));
}

