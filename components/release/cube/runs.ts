import index from "@/content/release/cube-runs/index.json";
import directIndex from "@/content/release/cube-runs/direct/index.json";
import estimateIndex from "@/content/release/cube-runs/estimate/index.json";
import scramble4Index from "@/content/release/cube-runs/estimate/scramble-4-one/index.json";
import type { CubeRun, CubeRunIndex } from "./recording";

/*
 * The cube's recorded runs (recording.ts), one file per seed, each loaded
 * only when the page plays it. Written by scripts/record-cube.mjs.
 */

export const cubeRuns = index as CubeRunIndex;
/** The race's runs (comparison page, 14 Nov 2026): one level, from a scramble, one run per seed and method. */
export const cubeRunsDirect = directIndex as CubeRunIndex;
/** The race by estimated moves remaining (15 Nov 2026): cube-runs/estimate/. */
export const cubeRunsEstimate = estimateIndex as CubeRunIndex;
/** The seeds the race can play: those with a run for every method. */
// export const raceSeeds = [...new Set(cubeRunsDirect.map((r) => r.seed))];
export const raceSeeds = [
  ...new Set(cubeRunsEstimate.map((r) => r.seed)),
].filter((seed) => cubeRunsEstimate.filter((r) => r.seed === seed).length >= 3);

/** True when every stored run comes from the model, not the page's mock. */
export const cubeRunsFromModel =
  cubeRuns.length > 0 && cubeRuns.every((r) => r.model !== "mock");

const LOADERS: Record<number, () => Promise<{ default: unknown }>> = {
  1: () => import("@/content/release/cube-runs/seed-1.json"),
  2: () => import("@/content/release/cube-runs/seed-2.json"),
  3: () => import("@/content/release/cube-runs/seed-3.json"),
  4: () => import("@/content/release/cube-runs/seed-4.json"),
  5: () => import("@/content/release/cube-runs/seed-5.json"),
};

const DIRECT_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "1-doe-lhs": () =>
    import("@/content/release/cube-runs/direct/seed-1-doe-lhs.json"),
  "1-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/direct/seed-1-bayesian-optimisation.json"),
  "1-sdm-1": () =>
    import("@/content/release/cube-runs/direct/seed-1-sdm-1.json"),
  "2-doe-lhs": () =>
    import("@/content/release/cube-runs/direct/seed-2-doe-lhs.json"),
  "2-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/direct/seed-2-bayesian-optimisation.json"),
  "2-sdm-1": () =>
    import("@/content/release/cube-runs/direct/seed-2-sdm-1.json"),
  "3-doe-lhs": () =>
    import("@/content/release/cube-runs/direct/seed-3-doe-lhs.json"),
  "3-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/direct/seed-3-bayesian-optimisation.json"),
  "3-sdm-1": () =>
    import("@/content/release/cube-runs/direct/seed-3-sdm-1.json"),
  "4-doe-lhs": () =>
    import("@/content/release/cube-runs/direct/seed-4-doe-lhs.json"),
  "4-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/direct/seed-4-bayesian-optimisation.json"),
  "4-sdm-1": () =>
    import("@/content/release/cube-runs/direct/seed-4-sdm-1.json"),
  "5-doe-lhs": () =>
    import("@/content/release/cube-runs/direct/seed-5-doe-lhs.json"),
  "5-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/direct/seed-5-bayesian-optimisation.json"),
  "5-sdm-1": () =>
    import("@/content/release/cube-runs/direct/seed-5-sdm-1.json"),
};

/* Three 6-move scrambles, each method's median run of 20 (15 Nov 2026; scripts/cube-stats.mjs). The 5-move runs of the
   first recording are kept in cube-runs/estimate/scramble-5/. */
const ESTIMATE_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "1-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/seed-1-doe-lhs.json"),
  "1-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/seed-1-bayesian-optimisation.json"),
  "1-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/seed-1-sdm-1.json"),
  "2-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/seed-2-doe-lhs.json"),
  "2-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/seed-2-bayesian-optimisation.json"),
  "2-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/seed-2-sdm-1.json"),
  "3-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/seed-3-doe-lhs.json"),
  "3-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/seed-3-bayesian-optimisation.json"),
  "3-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/seed-3-sdm-1.json"),
};

/* One 4-move scramble, 11 runs per method, whole sequences of up to 10 turns with prefix credit and one goal value
   (founder, 16 Nov 2026: show runs where the cube is solved, each method's 3 median runs). Case K (1..3) is each method's
   K-th middle run, ranks 5, 6, 7 of 11 (scripts/cube-stats.mjs --dir=scramble-4-one --cases=3). */
export const cubeRunsScramble4 = scramble4Index as CubeRunIndex;
export const scramble4Cases = [
  ...new Set(cubeRunsScramble4.map((r) => r.seed)),
];
/* All 10 runs per method, case K = each method's K-th ranked run (founder, 16 Nov 2026: one run per click, through the
   10, starting at a median one; scripts/cube-stats.mjs --dir=scramble-4-one --cases=10 --runs=10). */
const SCRAMBLE4_LOADERS: Record<string, () => Promise<{ default: unknown }>> = {
  "1-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-1-doe-lhs.json"),
  "1-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-1-bayesian-optimisation.json"),
  "1-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-1-sdm-1.json"),
  "2-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-2-doe-lhs.json"),
  "2-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-2-bayesian-optimisation.json"),
  "2-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-2-sdm-1.json"),
  "3-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-3-doe-lhs.json"),
  "3-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-3-bayesian-optimisation.json"),
  "3-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-3-sdm-1.json"),
  "4-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-4-doe-lhs.json"),
  "4-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-4-bayesian-optimisation.json"),
  "4-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-4-sdm-1.json"),
  "5-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-5-doe-lhs.json"),
  "5-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-5-bayesian-optimisation.json"),
  "5-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-5-sdm-1.json"),
  "6-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-6-doe-lhs.json"),
  "6-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-6-bayesian-optimisation.json"),
  "6-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-6-sdm-1.json"),
  "7-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-7-doe-lhs.json"),
  "7-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-7-bayesian-optimisation.json"),
  "7-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-7-sdm-1.json"),
  "8-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-8-doe-lhs.json"),
  "8-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-8-bayesian-optimisation.json"),
  "8-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-8-sdm-1.json"),
  "9-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-9-doe-lhs.json"),
  "9-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-9-bayesian-optimisation.json"),
  "9-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-9-sdm-1.json"),
  "10-doe-lhs": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-10-doe-lhs.json"),
  "10-bayesian-optimisation": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-10-bayesian-optimisation.json"),
  "10-sdm-1": () =>
    import("@/content/release/cube-runs/estimate/scramble-4-one/seed-10-sdm-1.json"),
};
export async function loadScramble4Run(
  seed: number,
  method: string,
): Promise<CubeRun> {
  const load = SCRAMBLE4_LOADERS[`${seed}-${method}`];
  if (!load) throw new Error(`cube: no recorded run for case ${seed}`);
  return (await load()).default as CubeRun;
}

/** `method`: the race's run of that method on the seed's scramble (cube-runs/direct/). */
export async function loadRun(seed: number, method?: string): Promise<CubeRun> {
  // const load = method ? DIRECT_LOADERS[`${seed}-${method}`] : LOADERS[seed];
  /* The race plays the estimate runs (15 Nov 2026); DIRECT_LOADERS stay for the pieces-solved runs. */
  void DIRECT_LOADERS;
  const load = method ? ESTIMATE_LOADERS[`${seed}-${method}`] : LOADERS[seed];
  if (!load) throw new Error(`cube: no recorded run for seed ${seed}`);
  return (await load()).default as CubeRun;
}
