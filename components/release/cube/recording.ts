import type { Method, Param, ParamValue, Settings } from '@/lib/sdm/contract';
import { applyMoves, scramble, solved, type Move } from './cube';
import { discover, solveDirect, solveEstimate, solveWith, type Ask, type Measure, type PhaseConfig, type Readout } from './solve';

/*
 * Recorded cube runs (13 Nov 2026). The cube on the release page no longer
 * asks the model while a visitor watches: it would cost up to 240 model calls
 * per page view that the visitor never asked for. Instead the model's runs are
 * recorded once, for five seeds (scripts/record-cube.mjs), and the page
 * replays one of them through the same solver (solve.ts). Only the model's
 * proposals are stored; the cube, the building blocks and every number the
 * page shows are recomputed from them, so a replay is the run itself, not a
 * film of it. scripts/record-cube.mjs --check replays every stored run and
 * fails if it no longer ends where it was recorded (after a change to
 * solve.ts or cube.ts: record again).
 *
 * The seed fixes the scramble. Proposals are stored compactly, one array per
 * proposal in the order of the request's space, a categorical value as its
 * index into the choices (or the raw string when the model answered outside
 * them).
 */

/** `mode: 'direct'` (14 Nov 2026): one level, no discovery (solve.ts, solveDirect); stored in cube-runs/direct/. */
/* `mode: 'estimate'` (15 Nov 2026): the race by estimated moves remaining (solve.ts, solveEstimate); runs store their
   readouts (RecordedCall.r, CubeRun.start), stored in cube-runs/estimate/. */
export type CubeConfig = PhaseConfig & {
  scrambleDepth: number;
  mode?: 'direct' | 'estimate';
  method?: Method;
  /** Estimate runs, repeated (15 Nov 2026): the run's number and its order of the 18 moves (solve.ts, estimateSpace). */
  run?: number;
  choices?: Move[];
  /** Estimate runs since 15 Nov 2026: play only when the estimate drops (solve.ts, solveEstimate). */
  accept?: 'estimate';
  /** Variants under test (15 Nov 2026; solve.ts, EstimateSetup): face + ordered angle per move, whole sequences. */
  encoding?: 'ordered';
  whole?: number;
  /** Score a whole sequence by its best state along the way (15 Nov 2026; solve.ts, EstimateSetup). */
  credit?: 'prefix';
  /** One goal, the estimate first and the distance as a tie-break (15 Nov 2026; solve.ts, EstimateSetup). */
  score?: 'one';
};

export type RecordedCall = {
  /** How long the model took to answer, in ms (the replay paces itself by it). */
  ms: number;
  p: (number | string)[][];
  /** Estimate runs: each proposal's readout, [estimated moves remaining, summed distance from home]. */
  r?: Readout[];
};

export type RunSummary = {
  discoverExperiments: number;
  blocks: string[];
  solveExperiments: number;
  solvedPieces: number;
  solved: boolean;
  /** Direct runs only: moves played on the cube. */
  moves?: number;
  /** Estimate runs: estimated moves remaining at the end (0 when solved). */
  movesLeft?: number;
};

export type CubeRun = {
  seed: number;
  /** The answering model as it named itself ("mock" for the page's stand-in). */
  model: string;
  version: string;
  /** ISO date of the recording. */
  recorded: string;
  config: CubeConfig;
  scramble: Move[];
  /** Estimate runs: the scrambled cube's readout. */
  start?: Readout;
  calls: RecordedCall[];
  /** Where the run ended when recorded; the check replays and compares. */
  summary: RunSummary;
};

/** What the page needs to know about the runs without loading them. */
export type CubeRunIndex = {
  seed: number;
  model: string;
  version: string;
  recorded: string;
  solved: boolean;
  method?: Method;
  /** Estimate runs (15 Nov 2026): the run shown is the median of `stats.runs` runs of this method on this scramble. */
  run?: number;
  stats?: RunStats;
}[];

/** One method on one scramble over repeated runs (scripts/cube-stats.mjs). */
export type RunStats = {
  runs: number;
  solved: number;
  /** Experiments to solve, median over all runs (an unsolved run counts as more than the budget); null when most runs did not solve. */
  medianExperiments: number | null;
  budget: number;
};

/** The race's methods, in the order the page shows them (founder, 14 Nov 2026). */
export const RACE_METHODS: Method[] = ['sdm-1', 'bayesian-optimisation', 'doe-lhs'];

export const SEEDS = [1, 2, 3, 4, 5] as const;

/** A small seeded generator (mulberry32), for the scramble. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const scrambleFor = (seed: number, depth: number) => scramble(depth, seeded(seed));

export function encode(space: Param[], params: Settings): (number | string)[] {
  return space.map((p) => {
    const v = params[p.name];
    if (p.type !== 'categorical') return Number(v);
    const i = p.choices.indexOf(String(v));
    return i >= 0 ? i : String(v);
  });
}

export function decode(space: Param[], values: (number | string)[]): Settings {
  const params: Settings = {};
  space.forEach((p, i) => {
    const v = values[i];
    params[p.name] = (p.type === 'categorical' && typeof v === 'number' ? p.choices[v] : v) as ParamValue;
  });
  return params;
}

/** Answers with a recorded run's proposals, call by call, paced by the recorded times (clamped) unless `pace` is false. */
export function replayer(run: CubeRun, pace = true): Ask {
  let next = 0;
  return async (request) => {
    const call = run.calls[next++];
    if (!call) throw new Error('cube replay: the run asked for more calls than were recorded');
    if (pace) await new Promise((resolve) => setTimeout(resolve, Math.min(900, Math.max(250, call.ms))));
    return { proposals: call.p.map((values) => ({ params: decode(request.space, values) })), model: run.model, version: run.version };
  };
}

/** The readouts a run recorded (estimate runs): what the page and the check measure with. */
export const recordedMeasure =
  (run: CubeRun): Measure =>
  (call, k) => {
    const r = k < 0 ? run.start : run.calls[call]?.r?.[k];
    if (!r) throw new Error(`cube replay: no recorded readout for call ${call}, experiment ${k}`);
    return r;
  };

/** Wraps a live `ask`, keeping every call it answers in the recording's form. */
export function recorder(ask: Ask) {
  const calls: RecordedCall[] = [];
  let model = '';
  let version = '';
  const wrapped: Ask = async (request) => {
    const t0 = Date.now();
    const answer = await ask(request);
    calls.push({ ms: Date.now() - t0, p: answer.proposals.map(({ params }) => encode(request.space, params)) });
    model = answer.model;
    version = answer.version;
    return answer;
  };
  return { ask: wrapped, calls, meta: () => ({ model, version }) };
}

/** The whole two-level campaign without a screen: what the recorder and the check run. */
export async function campaign(config: CubeConfig, moves: Move[], ask: Ask, measure?: Measure): Promise<RunSummary> {
  const none = async () => undefined;
  if (config.mode === 'estimate') {
    if (!measure) throw new Error('cube: an estimate run needs its readouts');
    let end = { experiments: 0, solvedPieces: 0, moves: 0, movesLeft: -1, done: undefined as string | undefined };
    await solveEstimate(applyMoves(solved(), moves), config, ask, measure, (e) => (end = { ...e, done: e.done }), none, none, () => false);
    return {
      discoverExperiments: 0,
      blocks: [],
      solveExperiments: end.experiments,
      solvedPieces: end.solvedPieces,
      solved: end.done === 'solved',
      moves: end.moves,
      movesLeft: end.movesLeft,
    };
  }
  if (config.mode === 'direct') {
    let end: { experiments: number; solvedPieces: number; moves: number; done?: string } = { experiments: 0, solvedPieces: 0, moves: 0 };
    await solveDirect(applyMoves(solved(), moves), config, ask, (e) => (end = e), none, none, () => false);
    return { discoverExperiments: 0, blocks: [], solveExperiments: end.experiments, solvedPieces: end.solvedPieces, solved: end.done === 'solved', moves: end.moves };
  }
  let discoverExperiments = 0;
  const found = await discover(config, ask, (e) => (discoverExperiments = e.experiments), none, none, () => false);
  let last: { experiments: number; solvedPieces: number; done?: string } = { experiments: 0, solvedPieces: 0 };
  await solveWith(found, applyMoves(solved(), moves), config, ask, (e) => (last = e), none, none, () => false);
  return {
    discoverExperiments,
    blocks: found.map((b) => b.label),
    solveExperiments: last.experiments,
    solvedPieces: last.solvedPieces,
    solved: last.done === 'solved',
  };
}
