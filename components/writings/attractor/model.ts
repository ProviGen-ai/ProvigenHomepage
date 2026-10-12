/*
 * The symmetric genetic toggle switch (Gardner, Cantor & Collins 2000,
 * Nature 403:339–342) in its dimensionless form, two genes that repress each
 * other:
 *
 *   dx/dt = α / (1 + yⁿ) − x
 *   dy/dt = α / (1 + xⁿ) − y + u(t)
 *
 * with additive noise σ·dW on both, integrated by Euler–Maruyama at a fixed
 * step from a seeded PRNG (mulberry32), so a seed and a push strength fix a run
 * exactly, whatever the frame rate. Concentrations reflect at zero. u(t) = U
 * for t in [t0, t0 + T] is a transient induction of Y: an added production
 * term, not the paper's inducer, which weakens the repressor instead. For U
 * above about 0.60 the pushed system has only B (A is lost in a saddle-node),
 * so whether a cell switches is a race of push strength against push length T.
 *
 * α = 4, n = 3 is bistable: attractor A (X high, Y low) at (4.00, 0.06), B at
 * (0.06, 4.00) and a saddle at (1.28, 1.28); by symmetry the separatrix of the
 * resting system (push off) is the diagonal x = y. (n = 2 was tried first, at
 * α = 5: its saddle repels at only 0.39 per time unit, and at the default push
 * about 1.9 % of cells changed side during the hold, after their fate was read.
 * At n = 3, α = 4 the saddle repels at 1.04 and that drops to about 0.06 %.)
 * σ = 0.3, push length T = 2, push from t = 1.5.
 *
 * Calibration (node scripts/calibrate-attractor.mjs, run on this file: 160
 * cells start in A after a burn-in; fate = side of x = y when the relax phase
 * ends, 6.5 time units after the push; 40 seeds per row):
 *
 *   U = 0    no push, 20 cycles    0 of 3,200 cells switched; none ever crossed x = y
 *   U = 0.75 PUSH.low              0.1 % switched  (0–1.3 % per cycle)
 *   U = 1.65 PUSH.near, default    48 % switched   (39–56 % per cycle)
 *   U = 3    PUSH.high             100 % switched  (99.4–100 % per cycle)
 *
 * Sweep (12 seeds each): U 1.0 → 1 %, 1.25 → 9 %, 1.5 → 32 %, 1.75 → 62 %,
 * 2.0 → 86 %, 2.5 → 99 %. The first cycle on the page (SEED, U = 1.65) ends
 * 75 back in A, 85 switched to B.
 *
 * A toy model, not data: it shows how a bistable circuit absorbs a weak
 * perturbation, keeps a memory of a strong one, and near the threshold lets
 * noise decide. No React, no DOM.
 */

export const ALPHA = 4;
/** Hill coefficient n. hill() below multiplies v³ out, so change both together. */
export const HILL = 3;
export const SIGMA = 0.3;
/** Integration step, in model time units (1 unit = one degradation time). */
export const DT = 0.01;
export const CELLS = 160;
/** The first cycle's seed, so every visitor's first look is the same run. */
export const SEED = 20261001;
/** Model time units per second of wall clock. */
export const RATE = 1.35;

/** The slider range and the three calibrated strengths. */
/* The slider tops out at the high strength: above it nothing new happens, and
   at 3.5 some cells overshoot the plotted window (y > 5) during the push. */
export const PUSH = { min: 0, max: 3, step: 0.05, low: 0.75, near: 1.65, high: 3 } as const;

/* One cycle, in model time after an invisible burn-in at A. */
const BURN = 4;
export const REST = 1.5;
export const PULSE = 2;
export const RELAX = 6.5;
export const HOLD = 3;
export const FADE = 1.2;
export const PUSH_ON = REST;
export const PUSH_OFF = REST + PULSE;
export const SETTLED = PUSH_OFF + RELAX;
export const CYCLE = SETTLED + HOLD + FADE;
/* The same marks in whole steps, so no comparison rides on float error. */
export const STEPS = Math.round(CYCLE / DT);
const ON_STEP = Math.round(PUSH_ON / DT);
const OFF_STEP = Math.round(PUSH_OFF / DT);
const SETTLE_STEP = Math.round(SETTLED / DT);

/** Trail: one sample every TRAIL_EVERY steps, TRAIL_LEN samples kept. */
export const TRAIL_EVERY = 4;
export const TRAIL_LEN = 14;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The next seed in the sequence (so "Run again" walks a reproducible list). */
export const nextSeed = (seed: number) => (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0) || 1;

/* vⁿ with n = HILL = 3, multiplied out: Math.pow doubles the cost of the hot loop. */
const hill = (v: number) => ALPHA / (1 + v * v * v);

/** Drift of the deterministic system at (x, y) under push u. */
export function drift(x: number, y: number, u = 0): [number, number] {
  return [hill(y) - x, hill(x) - y + u];
}

/** The X nullcline x = α/(1+yⁿ) and the Y nullcline y = α/(1+xⁿ) + u. */
export const xNull = (y: number) => hill(y);
export const yNull = (x: number, u = 0) => hill(x) + u;

/** Stable states A, B and the saddle between them. */
export function fixedPoints() {
  let x = ALPHA;
  let y = 0;
  for (let i = 0; i < 200; i++) {
    y = hill(x);
    x = hill(y);
  }
  let lo = 0;
  let hi = ALPHA;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (mid * (1 + mid ** HILL) < ALPHA) lo = mid;
    else hi = mid;
  }
  const s = (lo + hi) / 2;
  return { a: { x, y }, b: { x: y, y: x }, saddle: { x: s, y: s } };
}

/** u at a given step of the cycle. */
export const pushAt = (step: number, strength: number) =>
  step >= ON_STEP && step < OFF_STEP ? strength : 0;

export type Run = {
  seed: number;
  strength: number;
  /** Steps taken since the visible cycle began. */
  step: number;
  x: Float64Array;
  y: Float64Array;
  /** Ring buffer of past positions, TRAIL_LEN per cell. */
  tx: Float32Array;
  ty: Float32Array;
  /** Index of the newest trail sample, and how many are filled. */
  head: number;
  filled: number;
  /** 1 if the cell ended the relax phase in B, 0 in A; set once settled. */
  fate: Uint8Array;
  settled: boolean;
  switched: number;
  next: () => number;
  spare: number;
};

function gaussian(run: Run) {
  if (!Number.isNaN(run.spare)) {
    const v = run.spare;
    run.spare = Number.NaN;
    return v;
  }
  let u = 0;
  while (u === 0) u = run.next();
  const r = Math.sqrt(-2 * Math.log(u));
  const a = 2 * Math.PI * run.next();
  run.spare = r * Math.sin(a);
  return r * Math.cos(a);
}

function integrate(run: Run, u: number) {
  const { x, y } = run;
  const kick = SIGMA * Math.sqrt(DT);
  for (let i = 0; i < x.length; i++) {
    const xi = x[i];
    const yi = y[i];
    x[i] = Math.abs(xi + DT * (hill(yi) - xi) + kick * gaussian(run));
    y[i] = Math.abs(yi + DT * (hill(xi) - yi + u) + kick * gaussian(run));
  }
}

function sampleTrail(run: Run) {
  run.head = (run.head + 1) % TRAIL_LEN;
  run.filled = Math.min(TRAIL_LEN, run.filled + 1);
  for (let i = 0; i < run.x.length; i++) {
    run.tx[i * TRAIL_LEN + run.head] = run.x[i];
    run.ty[i * TRAIL_LEN + run.head] = run.y[i];
  }
}

/** A fresh cycle: every cell starts in A and settles there off-screen. */
export function createRun(seed: number, strength: number, cells = CELLS): Run {
  const { a } = fixedPoints();
  const run: Run = {
    seed,
    strength,
    step: 0,
    x: new Float64Array(cells).fill(a.x),
    y: new Float64Array(cells).fill(a.y),
    tx: new Float32Array(cells * TRAIL_LEN),
    ty: new Float32Array(cells * TRAIL_LEN),
    head: 0,
    filled: 0,
    fate: new Uint8Array(cells),
    settled: false,
    switched: 0,
    next: mulberry32(seed),
    spare: Number.NaN,
  };
  for (let k = Math.round(BURN / DT); k > 0; k--) integrate(run, 0);
  sampleTrail(run);
  return run;
}

/** Model time of the run, in units since the cycle began. */
export const timeOf = (run: Run) => run.step * DT;

/** Advances the run by whole steps (never past the end of the cycle). */
export function advance(run: Run, steps: number) {
  for (let k = 0; k < steps && run.step < STEPS; k++) {
    integrate(run, pushAt(run.step, run.strength));
    run.step++;
    if (run.step % TRAIL_EVERY === 0) sampleTrail(run);
    if (run.step === SETTLE_STEP) settle(run);
  }
}

function settle(run: Run) {
  let switched = 0;
  for (let i = 0; i < run.x.length; i++) {
    const b = run.y[i] > run.x[i] ? 1 : 0;
    run.fate[i] = b;
    switched += b;
  }
  run.switched = switched;
  run.settled = true;
}

/**
 * The whole cycle at once, for the still figure: each cell's path from the
 * start of the push to the settled state, sampled every `every` steps.
 */
export function traceCycle(seed: number, strength: number, every = 8, cells = CELLS) {
  const run = createRun(seed, strength, cells);
  advance(run, ON_STEP);
  const samples = Math.floor((SETTLE_STEP - ON_STEP) / every) + 1;
  const px = new Float32Array(cells * samples);
  const py = new Float32Array(cells * samples);
  for (let s = 0; s < samples; s++) {
    if (s > 0) advance(run, every);
    for (let i = 0; i < cells; i++) {
      px[i * samples + s] = run.x[i];
      py[i * samples + s] = run.y[i];
    }
  }
  // Read the fates even when `every` does not divide the relax phase.
  if (!run.settled) advance(run, SETTLE_STEP - run.step);
  return { run, samples, px, py };
}

export type Trace = ReturnType<typeof traceCycle>;
