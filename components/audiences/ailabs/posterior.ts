/*
 * The model behind the /ai-labs hero figure (8 Oct 2026): a Gaussian process
 * over one design axis, learning a hidden response from rounds of
 * measurements. Everything is computed once, at module load, from fixed
 * seeds, so every frame (and every visitor) draws the same story.
 *
 * - The response is a smooth curve with a feature the first design misses.
 *   The model only ever sees it through measurements.
 * - The model's beliefs are drawn as posterior samples. They are prior
 *   samples (random Fourier features) updated by Matheron's rule, so a sample
 *   keeps its identity from round to round and a morph between two rounds is
 *   a plain lerp: the curves visibly pinch onto each new measurement.
 * - Round 1 is a spread-out first design of three. Every later round
 *   proposes two points where the model is least certain (the variance does
 *   not depend on the result, so the second pick conditions on the first).
 *
 * Schematic: no units, no numbers on screen.
 */
import { rng } from '@/components/plate/kit';

/** Grid points across the design axis (drawn curves). */
export const N = 160;
/** Posterior samples drawn as hairlines. */
export const S = 30;
/** Rounds of measurements after the prior. */
export const R = 5;

const ELL = 0.095; // kernel length scale on [0, 1]
const SIGNAL = 1; // prior standard deviation
const NOISE = 0.05; // measurement noise (standard deviation)
const FEATURES = 96; // random Fourier features per prior sample

/**
 * The hidden response: a slow wave with a faster one riding on its middle.
 * The first design of three sees almost none of the fast part, so the model
 * is confidently wrong until round 4 (largest error 1.24 in the prior, 0.96
 * after round 1, 0.10 after round 5; scratch check, 8 Oct 2026).
 */
export function truth(x: number) {
  return (
    0.7 * Math.sin(Math.PI * 2 * (1.1 * x + 0.15)) +
    0.55 * Math.sin(Math.PI * 2 * (2.6 * x + 0.3)) * Math.exp(-(((x - 0.6) / 0.3) ** 2))
  );
}

const kern = (a: number, b: number) => SIGNAL * SIGNAL * Math.exp(-((a - b) ** 2) / (2 * ELL * ELL));

export const XS: Float64Array = Float64Array.from({ length: N }, (_, i) => i / (N - 1));

/** Standard normals from a seeded uniform source (Box-Muller). */
function normals(next: () => number) {
  return () => {
    const u = Math.max(next(), 1e-12);
    const v = next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
  };
}

/** Solve (A) x = b for a small symmetric positive definite A (Cholesky). */
function solveSPD(A: number[][], b: number[]) {
  const m = A.length;
  const L = A.map(() => Array.from({ length: m }, () => 0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-12)) : s / L[j][j];
    }
  }
  const y: number[] = Array.from({ length: m }, () => 0);
  for (let i = 0; i < m; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  const x: number[] = Array.from({ length: m }, () => 0);
  for (let i = m - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < m; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}

/** Posterior sd on the grid given observation sites (it does not depend on the results). */
function sdAt(X: readonly number[]) {
  const out = new Float64Array(N);
  const K = X.map((a, i) => X.map((b, j) => kern(a, b) + (i === j ? NOISE * NOISE : 0)));
  for (let g = 0; g < N; g++) {
    const k = X.map((a) => kern(XS[g], a));
    const v = X.length ? solveSPD(K, k) : [];
    let q = 0;
    for (let i = 0; i < k.length; i++) q += k[i] * v[i];
    out[g] = Math.sqrt(Math.max(SIGNAL * SIGNAL - q, 0));
  }
  return out;
}

export type Obs = { readonly x: number; readonly y: number; readonly round: number };

export type State = {
  /** S curves of N values each. */
  readonly samples: readonly Float64Array[];
  readonly mean: Float64Array;
  readonly sd: Float64Array;
  /** Observations made up to and including this state's round. */
  readonly obs: readonly Obs[];
};

function build() {
  const rand = rng(20261008);
  const gauss = normals(rand);

  // prior samples: random Fourier features of the squared-exponential kernel
  const prior: { w: number[]; om: number[]; b: number[] }[] = [];
  for (let s = 0; s < S; s++) {
    const w: number[] = [];
    const om: number[] = [];
    const b: number[] = [];
    for (let k = 0; k < FEATURES; k++) {
      w.push(gauss());
      om.push(gauss() / ELL);
      b.push(rand() * Math.PI * 2);
    }
    prior.push({ w, om, b });
  }
  const scale = SIGNAL * Math.sqrt(2 / FEATURES);
  const priorAt = (s: number, x: number) => {
    const { w, om, b } = prior[s];
    let v = 0;
    for (let k = 0; k < FEATURES; k++) v += w[k] * Math.cos(om[k] * x + b[k]);
    return v * scale;
  };
  const priorGrid = prior.map((_, s) => Float64Array.from(XS, (x) => priorAt(s, x)));

  // proposals: a first design of three, then two per round at the largest posterior sd
  const sites: { x: number; round: number }[] = [
    { x: 0.13, round: 1 },
    { x: 0.46, round: 1 },
    { x: 0.87, round: 1 },
  ];
  const lo = Math.round(0.035 * (N - 1));
  const hi = Math.round(0.965 * (N - 1));
  for (let r = 2; r <= R; r++) {
    for (let pick = 0; pick < 2; pick++) {
      const sd = sdAt(sites.map((o) => o.x));
      let best = lo;
      for (let g = lo; g <= hi; g++) if (sd[g] > sd[best]) best = g;
      sites.push({ x: XS[best], round: r });
    }
  }
  const noise = rng(7741);
  const nGauss = normals(noise);
  const obsAll: Obs[] = sites.map((o) => ({ x: o.x, y: truth(o.x) + NOISE * nGauss(), round: o.round }));
  // each sample's own noise draw per observation (Matheron's rule)
  const eps = prior.map(() => obsAll.map(() => NOISE * nGauss()));

  const states: State[] = [];
  for (let r = 0; r <= R; r++) {
    const obs = obsAll.filter((o) => o.round <= r);
    const X = obs.map((o) => o.x);
    const Y = obs.map((o) => o.y);
    const K = X.map((a, i) => X.map((b, j) => kern(a, b) + (i === j ? NOISE * NOISE : 0)));
    const kx = Array.from(XS, (x) => X.map((a) => kern(x, a)));
    const mean = new Float64Array(N);
    if (X.length) {
      const alpha = solveSPD(K, Y);
      for (let g = 0; g < N; g++) mean[g] = kx[g].reduce((acc, k, i) => acc + k * alpha[i], 0);
    }
    const samples = priorGrid.map((f, s) => {
      if (!X.length) return f;
      const resid = X.map((x, i) => Y[i] + eps[s][obsAll.indexOf(obs[i])] - priorAt(s, x));
      const a = solveSPD(K, resid);
      return Float64Array.from(f, (v, g) => v + kx[g].reduce((acc, k, i) => acc + k * a[i], 0));
    });
    states.push({ samples, mean, sd: sdAt(X), obs });
  }
  return { states, obs: obsAll };
}

const built = build();

/** states[0] is the prior; states[r] has seen rounds 1 … r. */
export const STATES: readonly State[] = built.states;
/** Every observation, in the order it is made. */
export const OBS: readonly Obs[] = built.obs;
/** The observations proposed (and then measured) in round r. */
export const roundObs = (r: number) => OBS.filter((o) => o.round === r);
