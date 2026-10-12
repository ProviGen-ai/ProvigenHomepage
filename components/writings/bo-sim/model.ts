/*
 * The simulation behind the field note's Fig. 01 (BoSim.tsx): twenty
 * experiments planned up front against twenty chosen one at a time, on the
 * Branin–Hoo function, the standard two-dimensional test function for global
 * optimisers (Dixon & Szegő 1978; definition as in Surjanovic & Bingham,
 * Virtual Library of Simulation Experiments):
 *
 *   f(x1, x2) = (x2 − b·x1² + c·x1 − r)² + s·(1 − t)·cos(x1) + s
 *   b = 5.1 / 4π², c = 5 / π, r = 6, s = 10, t = 1 / 8π
 *   x1 ∈ [−5, 10], x2 ∈ [0, 15]
 *
 * minimised. Three global minima, f* = 0.397887, at (−π, 12.275),
 * (π, 2.275) and (9.42478, 2.475); the largest value, 308.13, is in the
 * corner (−5, 0).
 *
 * Planned up front: a maximin Latin hypercube of N = 20 points (the best of
 * LHS_TRIES random Latin hypercubes by smallest pairwise distance), run in
 * the order it was drawn. Chosen one at a time: a maximin Latin hypercube of
 * N_START = 3 points, then 17 points, each the maximiser of expected
 * improvement under a Gaussian-process model of everything measured so far.
 * Every measurement carries Gaussian noise of NOISE × the function's range
 * on the domain (sd 6.2), drawn from the seed; the planned design never looks
 * at its measurements, so only the model sees the noise.
 *
 * The model, refitted after every measurement:
 *   - inputs scaled to [0, 1]², measurements standardised (mean 0, sd 1);
 *   - Matérn 5/2 kernel with one lengthscale per input, signal variance 1;
 *   - the noise term is the known measurement noise in standardised units;
 *   - lengthscales by maximum a posteriori on a 10 × 10 log grid (LENGTHS)
 *     under a weak log-normal prior (median LS_PRIOR_MEDIAN, log sd 1).
 *     Measured 3 Oct 2026 over 120 seeds: plain marginal likelihood put a
 *     lengthscale at an end of the grid in 79 % of the fits on three points
 *     (66 % on four, 38 % on five); with the prior, in none;
 *   - the acquisition is expected improvement (Jones, Schonlau & Welch 1998)
 *     in its form for noisy measurements, augmented EI (Huang, Allen, Notz &
 *     Zeng 2006): the improvement is counted from the posterior mean at the
 *     measured point with the lowest mean + 1 sd, and scaled by
 *     1 − σnoise / √(s² + σnoise²), so a place the model already knows to
 *     within the noise is not measured again and again. Over 120 seeds at
 *     this noise, plain EI re-measured within 0.3 units of an earlier point
 *     in 22 % of its picks and augmented EI in 6 % (8 % over the
 *     calibration's 200), for the same outcomes; plain EI's repeats stacked
 *     dots in the figure. ξ = 0.01; maximised on a 48 × 48 lattice of cell
 *     centres, then refined by a pattern search from the best three cells.
 *
 * Nothing here is fitted to Branin: the prior, the grid and the lattice are
 * generic, and the same code would run on any function of two inputs. On
 * Branin it behaves as GP-EI does: it probes edges and corners, where it
 * knows least (63 % of its picks land on the domain's edge, many of them
 * along x1 = 10 beside the third minimum), and gathers its later picks near
 * the minima.
 *
 * Seeds: one seed fixes a run (both designs and every noise draw), from three
 * independent mulberry32 streams, so the planned design does not change when
 * the model's code does. A run keeps the model it fitted after each
 * measurement (Run.models); the figure reads what that model believes, how
 * sure it is and where it would measure next off those very models
 * (belief.ts, through predict, incumbentOf and augmentedEI, the functions the
 * picks are made with), so a frame is a pure function of (seed, t).
 * (4 Oct 2026: nextExperiment's acquisition was split into incumbentOf and
 * augmentedEI for the figure, the same arithmetic in the same order; the
 * calibration reproduced to the last digit.)
 *
 * Calibration (node scripts/calibrate-bo-sim.mjs) is recorded in BoSim.tsx.
 * No React, no DOM.
 */

/* ---------- the test function ---------- */

const B = 5.1 / (4 * Math.PI * Math.PI);
const C = 5 / Math.PI;
const R = 6;
const S = 10;
const T = 1 / (8 * Math.PI);

export const X1 = [-5, 10] as const;
export const X2 = [0, 15] as const;

export function branin(x1: number, x2: number) {
  const q = x2 - B * x1 * x1 + C * x1 - R;
  return q * q + S * (1 - T) * Math.cos(x1) + S;
}

/** Branin at a point of the unit square (u1, u2 ∈ [0, 1]). */
export const braninAt = (u1: number, u2: number) =>
  branin(X1[0] + (X1[1] - X1[0]) * u1, X2[0] + (X2[1] - X2[0]) * u2);

/** The global minimum value and its three locations, in the unit square. */
export const F_STAR = 0.397887357729738;
export const MINIMA: readonly (readonly [number, number])[] = [
  [-Math.PI, 12.275],
  [Math.PI, 2.275],
  [9.42477796, 2.475],
].map(([x1, x2]) => [(x1 - X1[0]) / (X1[1] - X1[0]), (x2 - X2[0]) / (X2[1] - X2[0])] as const);
/** The largest value on the domain, at (−5, 0). */
export const F_MAX = branin(-5, 0);
export const RANGE = F_MAX - F_STAR;

/* ---------- the experiment ---------- */

/** Experiments per strategy. */
export const N = 20;
/** Spread-out experiments the model starts from. */
export const N_START = 3;
/** Measurement noise, as a share of the function's range on the domain. */
export const NOISE = 0.02;
export const NOISE_SD = NOISE * RANGE;
/** Random Latin hypercubes drawn per design; the most spread out is kept. */
export const LHS_TRIES = 64;
/** The first run on the page (scripts/calibrate-bo-sim.mjs picks it). */
export const SEED = 2101025223;

/* ---------- random numbers ---------- */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The next seed in the sequence ("Run again" and each new cycle walk a reproducible list). */
export const nextSeed = (seed: number) => (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0) || 1;

function gaussian(next: () => number) {
  let u = 0;
  while (u === 0) u = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
}

/* ---------- Latin hypercube ---------- */

function permutation(n: number, next: () => number) {
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p;
}

/**
 * A maximin Latin hypercube of n points in the unit square, as [u1, u2, …]:
 * each axis cut into n equal strata, one point per stratum and axis, placed
 * at random inside its cell; of `tries` such designs the one whose closest
 * pair is farthest apart. Points stay in the order they were drawn.
 */
export function latinHypercube(n: number, next: () => number, tries = LHS_TRIES) {
  let best = new Float64Array(2 * n);
  let bestGap = -1;
  for (let k = 0; k < tries; k++) {
    const a = permutation(n, next);
    const b = permutation(n, next);
    const pts = new Float64Array(2 * n);
    for (let i = 0; i < n; i++) {
      pts[2 * i] = (a[i] + next()) / n;
      pts[2 * i + 1] = (b[i] + next()) / n;
    }
    let gap = Infinity;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        gap = Math.min(gap, Math.hypot(pts[2 * i] - pts[2 * j], pts[2 * i + 1] - pts[2 * j + 1]));
    if (gap > bestGap) {
      bestGap = gap;
      best = pts;
    }
  }
  return best;
}

/* ---------- the Gaussian-process model ---------- */

const SQRT5 = Math.sqrt(5);
/** Matérn 5/2 correlation at scaled distance r. */
const matern = (r: number) => {
  const s = SQRT5 * r;
  return (1 + s + (s * s) / 3) * Math.exp(-s);
};

/** The lengthscale grid, per input, on the unit square: 0.06 to 2, log-spaced. */
export const LENGTHS = Array.from({ length: 10 }, (_, i) => 0.06 * (2 / 0.06) ** (i / 9));
export const LS_PRIOR_MEDIAN = 0.3;
const LS_PRIOR_LOG_SD = 1;
/** Kept in the kernel's diagonal on top of the noise, for a stable factorisation. */
const JITTER = 1e-8;
/** Expected-improvement margin, in standardised units. */
const XI = 0.01;
/** The acquisition lattice. */
const ACQ = 48;

export type Model = {
  n: number;
  /** Inputs, [u1, u2, …]. */
  x: Float64Array;
  /** Standardisation of the measurements. */
  mean: number;
  sd: number;
  /** Measurement noise sd, in standardised units. */
  noise: number;
  /** Inverse lengthscales. */
  il1: number;
  il2: number;
  /** Cholesky factor of K + noise (row-major, lower), and (K + noise)⁻¹ y. */
  chol: Float64Array;
  alpha: Float64Array;
  /** Scratch for one prediction. */
  k: Float64Array;
};

function factor(x: Float64Array, n: number, il1: number, il2: number, nugget: number, out: Float64Array) {
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      const d1 = (x[2 * i] - x[2 * j]) * il1;
      const d2 = (x[2 * i + 1] - x[2 * j + 1]) * il2;
      out[i * n + j] = matern(Math.sqrt(d1 * d1 + d2 * d2)) + (i === j ? nugget : 0);
    }
  }
  // Cholesky in place, lower triangle.
  for (let j = 0; j < n; j++) {
    let d = out[j * n + j];
    for (let k = 0; k < j; k++) d -= out[j * n + k] * out[j * n + k];
    if (d <= 0) return false;
    d = Math.sqrt(d);
    out[j * n + j] = d;
    for (let i = j + 1; i < n; i++) {
      let s = out[i * n + j];
      for (let k = 0; k < j; k++) s -= out[i * n + k] * out[j * n + k];
      out[i * n + j] = s / d;
    }
  }
  return true;
}

/** Solves (L Lᵀ) a = y for the factor in `l`; returns yᵀ a and fills `a`. */
function solve(l: Float64Array, n: number, y: Float64Array, a: Float64Array) {
  for (let i = 0; i < n; i++) {
    let s = y[i];
    for (let k = 0; k < i; k++) s -= l[i * n + k] * a[k];
    a[i] = s / l[i * n + i];
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = a[i];
    for (let k = i + 1; k < n; k++) s -= l[k * n + i] * a[k];
    a[i] = s / l[i * n + i];
  }
  let q = 0;
  for (let i = 0; i < n; i++) q += y[i] * a[i];
  return q;
}

/** Fits the model to n measurements y at points x (MAP lengthscales on the grid). */
export function fit(x: Float64Array, y: Float64Array, n: number, noiseSd = NOISE_SD): Model {
  let mean = 0;
  for (let i = 0; i < n; i++) mean += y[i];
  mean /= n;
  let v = 0;
  for (let i = 0; i < n; i++) v += (y[i] - mean) ** 2;
  const sd = Math.max(Math.sqrt(v / Math.max(1, n - 1)), 1e-9);
  const ys = new Float64Array(n);
  for (let i = 0; i < n; i++) ys[i] = (y[i] - mean) / sd;
  const nugget = (noiseSd / sd) ** 2 + JITTER;

  const l = new Float64Array(n * n);
  const a = new Float64Array(n);
  let best = -Infinity;
  let b1 = LS_PRIOR_MEDIAN;
  let b2 = LS_PRIOR_MEDIAN;
  for (const l1 of LENGTHS) {
    for (const l2 of LENGTHS) {
      if (!factor(x, n, 1 / l1, 1 / l2, nugget, l)) continue;
      const q = solve(l, n, ys, a);
      let logDet = 0;
      for (let i = 0; i < n; i++) logDet += Math.log(l[i * n + i]);
      const prior =
        -((Math.log(l1 / LS_PRIOR_MEDIAN) ** 2) + Math.log(l2 / LS_PRIOR_MEDIAN) ** 2) /
        (2 * LS_PRIOR_LOG_SD * LS_PRIOR_LOG_SD);
      const score = -0.5 * q - logDet + prior;
      if (score > best) {
        best = score;
        b1 = l1;
        b2 = l2;
      }
    }
  }
  const chol = new Float64Array(n * n);
  const alpha = new Float64Array(n);
  factor(x, n, 1 / b1, 1 / b2, nugget, chol);
  solve(chol, n, ys, alpha);
  return {
    n,
    x: x.slice(0, 2 * n),
    mean,
    sd,
    noise: noiseSd / sd,
    il1: 1 / b1,
    il2: 1 / b2,
    chol,
    alpha,
    k: new Float64Array(n),
  };
}

/**
 * Posterior mean and sd of the model at (u1, u2), in standardised units
 * (the sd of the underlying function, without the measurement noise).
 */
export function predict(m: Model, u1: number, u2: number, out: { mu: number; sd: number }) {
  const { n, x, il1, il2, chol, alpha, k } = m;
  let mu = 0;
  for (let i = 0; i < n; i++) {
    const d1 = (u1 - x[2 * i]) * il1;
    const d2 = (u2 - x[2 * i + 1]) * il2;
    k[i] = matern(Math.sqrt(d1 * d1 + d2 * d2));
    mu += k[i] * alpha[i];
  }
  // v = L⁻¹ k, in place
  let vv = 0;
  for (let i = 0; i < n; i++) {
    let s = k[i];
    for (let j = 0; j < i; j++) s -= chol[i * n + j] * k[j];
    k[i] = s / chol[i * n + i];
    vv += k[i] * k[i];
  }
  out.mu = mu;
  out.sd = Math.sqrt(Math.max(1e-12, 1 - vv));
  return out;
}

/** erfc, fractional error under 1.2e-7 (Numerical Recipes' erfcc). */
function erfc(x: number) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}
const INV_SQRT2 = 1 / Math.SQRT2;
const INV_SQRT2PI = 1 / Math.sqrt(2 * Math.PI);

/** Expected improvement below `incumbent` (minimisation), standardised units. */
export function expectedImprovement(mu: number, sd: number, incumbent: number) {
  const gain = incumbent - mu - XI;
  if (sd < 1e-9) return Math.max(gain, 0);
  const z = gain / sd;
  return gain * 0.5 * erfc(-z * INV_SQRT2) + sd * INV_SQRT2PI * Math.exp(-0.5 * z * z);
}

/**
 * The level augmented expected improvement counts from: the posterior mean at
 * the measured point with the lowest posterior mean + 1 sd.
 */
export function incumbentOf(m: Model) {
  const p = { mu: 0, sd: 0 };
  let incumbent = Infinity;
  let lowest = Infinity;
  for (let i = 0; i < m.n; i++) {
    predict(m, m.x[2 * i], m.x[2 * i + 1], p);
    if (p.mu + p.sd < lowest) {
      lowest = p.mu + p.sd;
      incumbent = p.mu;
    }
  }
  return incumbent;
}

/**
 * Augmented expected improvement (Huang et al. 2006) at a point where the
 * model predicts (mu, sd), standardised units: expected improvement below
 * the incumbent, scaled by 1 − σnoise / √(sd² + σnoise²).
 */
export const augmentedEI = (m: Model, mu: number, sd: number, incumbent: number) =>
  expectedImprovement(mu, sd, incumbent) * (1 - m.noise / Math.sqrt(sd * sd + m.noise * m.noise));

/**
 * The next experiment: the maximiser over the unit square of augmented
 * expected improvement, counted from incumbentOf(m).
 */
export function nextExperiment(m: Model): [number, number] {
  const p = { mu: 0, sd: 0 };
  const incumbent = incumbentOf(m);
  const ei = (u1: number, u2: number) => {
    predict(m, u1, u2, p);
    return augmentedEI(m, p.mu, p.sd, incumbent);
  };
  // the best three lattice cells, then a pattern search from each
  const top: [number, number, number][] = [];
  for (let i = 0; i < ACQ; i++) {
    for (let j = 0; j < ACQ; j++) {
      const u1 = (i + 0.5) / ACQ;
      const u2 = (j + 0.5) / ACQ;
      const e = ei(u1, u2);
      if (top.length < 3 || e > top[2][0]) {
        top.push([e, u1, u2]);
        top.sort((a, b) => b[0] - a[0]);
        if (top.length > 3) top.pop();
      }
    }
  }
  let best: [number, number, number] = top[0];
  for (const start of top) {
    let [e, u1, u2] = start;
    let h = 1 / ACQ;
    for (let round = 0; round < 7; round++) {
      let moved = true;
      while (moved) {
        moved = false;
        for (const [d1, d2] of DIRS) {
          const v1 = Math.min(1, Math.max(0, u1 + d1 * h));
          const v2 = Math.min(1, Math.max(0, u2 + d2 * h));
          const ev = ei(v1, v2);
          if (ev > e + 1e-15) {
            e = ev;
            u1 = v1;
            u2 = v2;
            moved = true;
          }
        }
      }
      h /= 2;
    }
    if (e > best[0]) best = [e, u1, u2];
  }
  return [best[1], best[2]];
}

const DIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.7071, 0.7071],
  [-0.7071, 0.7071],
  [0.7071, -0.7071],
  [-0.7071, -0.7071],
];

/* ---------- a run ---------- */

export type Run = {
  seed: number;
  /** Planned up front: N points [u1, u2, …] in run order, and the true value at each. */
  planned: Float64Array;
  plannedF: Float64Array;
  /** Chosen one at a time: N_START spread-out points, then the model's picks. */
  chosen: Float64Array;
  chosenF: Float64Array;
  /** What the model saw: the noisy measurement of each chosen point. */
  chosenY: Float64Array;
  /** Best true value among the first k + 1 experiments, per strategy. */
  bestPlanned: Float64Array;
  bestChosen: Float64Array;
  /**
   * The figure's display layer: the model after each measurement from the
   * N_START-th on, models[s] fitted to N_START + s measurements
   * (s = 0 … N − N_START), the very models the picks were made from.
   * belief.ts reads what it believes off them. Empty with `fog: false`.
   */
  models: Model[];
};

const ratchet = (f: Float64Array) => {
  const out = new Float64Array(f.length);
  let b = Infinity;
  for (let i = 0; i < f.length; i++) out[i] = b = Math.min(b, f[i]);
  return out;
};

/**
 * One seed's run of both strategies. `fog: false` skips the display layer
 * and `noise` overrides NOISE (both for the calibration script only).
 */
export function simulate(seed: number, { fog = true, noise = NOISE }: { fog?: boolean; noise?: number } = {}): Run {
  const designRng = mulberry32(seed ^ 0x2545f491);
  const startRng = mulberry32(seed ^ 0x6c8e9cf5);
  const noiseRng = mulberry32(seed ^ 0x1b873593);
  const noiseSd = noise * RANGE;

  const planned = latinHypercube(N, designRng);
  const plannedF = new Float64Array(N);
  for (let i = 0; i < N; i++) plannedF[i] = braninAt(planned[2 * i], planned[2 * i + 1]);

  const chosen = new Float64Array(2 * N);
  chosen.set(latinHypercube(N_START, startRng));
  const chosenF = new Float64Array(N);
  const chosenY = new Float64Array(N);
  const measure = (i: number) => {
    chosenF[i] = braninAt(chosen[2 * i], chosen[2 * i + 1]);
    chosenY[i] = chosenF[i] + noiseSd * gaussian(noiseRng);
  };
  for (let i = 0; i < N_START; i++) measure(i);

  const models: Model[] = [];
  for (let n = N_START; ; n++) {
    // a noise-free run still keeps a hair of nugget (JITTER) in the kernel
    const m = fit(chosen, chosenY, n, noiseSd);
    if (fog) models.push(m);
    if (n === N) break;
    const [u1, u2] = nextExperiment(m);
    chosen[2 * n] = u1;
    chosen[2 * n + 1] = u2;
    measure(n);
  }

  return {
    seed,
    planned,
    plannedF,
    chosen,
    chosenF,
    chosenY,
    bestPlanned: ratchet(plannedF),
    bestChosen: ratchet(chosenF),
    models,
  };
}
