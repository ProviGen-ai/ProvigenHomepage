/*
 * What the model believes, for the figure (draw.ts, 4 Oct 2026). A run keeps
 * the model it fitted after each measurement (model.ts, Run.models); this
 * reads three things off each one on a lattice of the unit square, with the
 * functions the picks themselves are made with (predict, incumbentOf,
 * augmentedEI), so the picture is the model's own state, not a stand-in:
 *
 *   mean  its estimate of the function, in the function's units;
 *   sd    how unsure it is, standardised (1 = it knows nothing there);
 *   aim   augmented expected improvement, as a share of its largest value on
 *         the lattice: where the next experiment is worth most. The pick
 *         itself is the refined maximiser (nextExperiment), so it lands at
 *         the lattice's brightest place or between its nodes.
 *
 * Computed lazily, one step at a time (about 1 ms each), and kept per run.
 * No React, no DOM.
 */
import { augmentedEI, incumbentOf, predict, type Run } from './model';

/** Cells per side of the lattice; values sit on its (G + 1)² nodes, u = i / G. */
export const G = 40;
export const NODES = G + 1;

export type Belief = {
  /** Per node, index i·NODES + j for (u1, u2) = (i / G, j / G). */
  readonly mean: Float32Array;
  readonly sd: Float32Array;
  readonly aim: Float32Array;
};

/** Before the first fit: no estimate, unsure everywhere, nowhere to aim. */
export const PRIOR: Belief = {
  mean: new Float32Array(NODES * NODES).fill(Number.NaN),
  sd: new Float32Array(NODES * NODES).fill(1),
  aim: new Float32Array(NODES * NODES),
};

const kept = new WeakMap<Run, Belief[]>();

/** The model after N_START + s measurements (s = 0 … N − N_START); PRIOR for s < 0. */
export function beliefAt(run: Run, s: number): Belief {
  if (s < 0 || !run.models[s]) return PRIOR;
  let list = kept.get(run);
  if (!list) {
    list = [];
    kept.set(run, list);
  }
  const hit = list[s];
  if (hit) return hit;
  const m = run.models[s];
  const incumbent = incumbentOf(m);
  const mean = new Float32Array(NODES * NODES);
  const sd = new Float32Array(NODES * NODES);
  const aim = new Float32Array(NODES * NODES);
  const p = { mu: 0, sd: 0 };
  let top = 0;
  for (let i = 0; i < NODES; i++) {
    for (let j = 0; j < NODES; j++) {
      const k = i * NODES + j;
      predict(m, i / G, j / G, p);
      mean[k] = m.mean + m.sd * p.mu;
      sd[k] = p.sd;
      const e = augmentedEI(m, p.mu, p.sd, incumbent);
      aim[k] = e;
      if (e > top) top = e;
    }
  }
  if (top > 0) for (let k = 0; k < aim.length; k++) aim[k] /= top;
  const b = { mean, sd, aim };
  list[s] = b;
  return b;
}

/** Bilinear read of a node grid at (u1, u2) in the unit square. */
export function sample(grid: Float32Array, u1: number, u2: number) {
  const x = Math.min(G - 1e-6, Math.max(0, u1 * G));
  const y = Math.min(G - 1e-6, Math.max(0, u2 * G));
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const a = grid[i * NODES + j];
  const b = grid[(i + 1) * NODES + j];
  const c = grid[i * NODES + j + 1];
  const d = grid[(i + 1) * NODES + j + 1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
