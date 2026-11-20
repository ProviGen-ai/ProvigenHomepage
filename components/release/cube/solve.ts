/* The cube's solver sends the pre-2.0.0 body (see LegacyProposeRequest in lib/sdm/contract.ts): its
   multi-objective phases carry `goal` and `objectives` together, which request 2.0.0 refuses. Only
   scripts/record-cube.mjs sends it, and only when SDM_RECORD_API is set; the published page replays the
   committed runs and makes no calls. Re-recording against a 2.0.0 service needs a weight on every objective,
   which is the user's decision (20 Nov 2026), so the shape is named rather than quietly changed. */
import type { LegacyObservation, LegacyProposeRequest, Method, Param, ProposeResponse, Settings } from '@/lib/sdm/contract';
import {
  MOVES,
  applyMove,
  applyMoves,
  commutator,
  conjugate,
  FACES,
  inverse,
  isSolved,
  outcomes,
  pieceScore,
  pieceStates,
  piecesSolved,
  support,
  symmetric,
  type Cube,
  type Move,
  type Outcomes,
} from './cube';

/*
 * The cube as a two-level campaign for the model (founders, 13 Nov 2026): the
 * same model, used at two levels of abstraction.
 *
 * Level 1, discover building blocks. On a solved cube, each experiment is a
 * commutator A B A' B' with short parts A (1 to 3 moves) and B (1 to 2 moves).
 * The only result is how many pieces it moves (support; fewer is better, and
 * moving nothing counts as a failed run). That number falls step by step as A
 * and B overlap less, so the model gets partial credit long before it finds a
 * sequence that moves only two or three pieces.
 *
 * Level 2, use them. The cube is scrambled. Each experiment is a building
 * block from level 1 (or a single move), turned or mirrored by one of the
 * cube's 48 symmetries, placed with a short setup X (0 to 2 moves) as
 * X, block, X undone. The results are four counts after the whole sequence:
 * corners in place, corners turned right, edges in place, edges turned right.
 * An improving experiment is played on the cube and the next campaign starts
 * from there.
 *
 * The cube itself stays in the browser; the model sees only parameters and
 * results. Who answers is passed in as `ask`: the page replays recorded runs
 * (recording.ts), and the recorder (scripts/record-cube.mjs) asks the model.
 */

/** Where proposals come from: the model while recording, a recorded run on the page. */
export type Ask = (request: LegacyProposeRequest) => Promise<ProposeResponse>;

export type Block = { moves: Move[]; support: number; label: string };

export type PhaseConfig = {
  /** Calls the discovery level may make. */
  discoverCalls: number;
  /** Calls the solving level may make. */
  solveCalls: number;
  /** Proposals per call. */
  batch: number;
  /** Building blocks to keep. */
  keep: number;
};

const slots = (prefix: string, n: number): Param[] =>
  Array.from({ length: n }, (_, i): Param => ({ name: `${prefix}${i + 1}`, type: 'categorical', choices: MOVES }));
const read = (p: Settings, prefix: string, depthKey: string, max: number, min = 1) => {
  const depth = Math.min(max, Math.max(min, Math.round(Number(p[depthKey]))));
  return Array.from({ length: depth }, (_, i) => String(p[`${prefix}${i + 1}`])).filter((m) => MOVES.includes(m));
};

export const DISCOVER_SPACE: Param[] = [
  { name: 'a_depth', type: 'integer', low: 1, high: 3 },
  ...slots('a', 3),
  { name: 'b_depth', type: 'integer', low: 1, high: 2 },
  ...slots('b', 2),
];

export type DiscoverEvent = { experiments: number; best: number | null; blocks: Block[] };

/** Level 1. Returns the building blocks found (fewest pieces moved first). */
export async function discover(
  config: PhaseConfig,
  ask: Ask,
  on: (e: DiscoverEvent) => void,
  show: (moves: Move[]) => Promise<void>,
  wait: () => Promise<void>,
  cancelled: () => boolean,
): Promise<Block[]> {
  const history: LegacyObservation[] = [];
  const found = new Map<string, Block>();
  let experiments = 0;
  let best: number | null = null;
  for (let call = 0; call < config.discoverCalls; call++) {
    await wait();
    if (cancelled()) break;
    const answer = await ask({
      space: DISCOVER_SPACE,
      history,
      batch: config.batch,
      goal: 'minimize',
      objectives: [{ name: 'pieces_moved', goal: 'minimize' }],
    });
    let improved: Move[] | null = null;
    for (const { params } of answer.proposals) {
      const moves = commutator(read(params, 'a', 'a_depth', 3), read(params, 'b', 'b_depth', 2));
      const moved = support(moves);
      /* A sequence that moves nothing is not a building block: a failed run. */
      history.push({ params, value: moved === 0 ? null : moved, values: { pieces_moved: moved === 0 ? null : moved } });
      experiments += 1;
      if (moved === 0) continue;
      const key = moves.join(' ');
      if (!found.has(key)) found.set(key, { moves, support: moved, label: key });
      if (best === null || moved < best) {
        best = moved;
        improved = moves;
      }
    }
    const blocks = [...found.values()].sort((a, b) => a.support - b.support || a.moves.length - b.moves.length).slice(0, config.keep);
    on({ experiments, best, blocks });
    if (improved) await show(improved);
    if (blocks.length >= config.keep && blocks.every((b) => b.support <= 3)) break;
  }
  return [...found.values()].sort((a, b) => a.support - b.support || a.moves.length - b.moves.length).slice(0, config.keep);
}

export type SolveEvent = {
  experiments: number;
  solvedPieces: number;
  outcomes: Outcomes;
  last?: { setup: Move[]; block: string; symmetry: number; gain: number };
  done?: 'solved' | 'budget';
};

const total = (o: Outcomes) => o.cornersPlaced + o.cornersOriented + o.edgesPlaced + o.edgesOriented;

/** Level 2. Plays every improving sequence on the cube through `play`. */
export async function solveWith(
  blocks: Block[],
  start: Cube,
  config: PhaseConfig,
  ask: Ask,
  on: (e: SolveEvent) => void,
  play: (moves: Move[]) => Promise<void>,
  wait: () => Promise<void>,
  cancelled: () => boolean,
) {
  /* The choices one level up: every building block, and single moves for what blocks cannot do alone. */
  const choices = [...blocks.map((b, i) => `block ${i + 1}`), ...MOVES];
  const movesOf = (choice: string) => (choice.startsWith('block ') ? blocks[Number(choice.slice(6)) - 1].moves : [choice]);
  const space: Param[] = [
    { name: 'block', type: 'categorical', choices },
    { name: 'symmetry', type: 'integer', low: 0, high: 47 },
    { name: 'setup_depth', type: 'integer', low: 0, high: 2 },
    ...slots('x', 2),
  ];
  let cube = start;
  let history: LegacyObservation[] = [];
  let experiments = 0;
  let lastStep: SolveEvent['last'];
  const report = (extra: Partial<SolveEvent> = {}) =>
    on({ experiments, solvedPieces: piecesSolved(cube), outcomes: outcomes(cube), last: lastStep, ...extra });
  report();
  for (let call = 0; call < config.solveCalls; call++) {
    if (isSolved(cube)) return report({ done: 'solved' });
    await wait();
    if (cancelled()) return;
    const answer = await ask({
      space,
      history,
      batch: config.batch,
      goal: 'maximize',
      objectives: [
        { name: 'corners_placed', goal: 'maximize' },
        { name: 'corners_oriented', goal: 'maximize' },
        { name: 'edges_placed', goal: 'maximize' },
        { name: 'edges_oriented', goal: 'maximize' },
      ],
    });
    const before = outcomes(cube);
    let best: { moves: Move[]; gain: number; last: SolveEvent['last'] } | undefined;
    for (const { params } of answer.proposals) {
      const choice = choices.includes(String(params.block)) ? String(params.block) : MOVES[0];
      const symmetry = Math.min(47, Math.max(0, Math.round(Number(params.symmetry))));
      const setup = read(params, 'x', 'setup_depth', 2, 0);
      const moves = conjugate(setup, symmetric(movesOf(choice), symmetry));
      const after = outcomes(applyMoves(cube, moves));
      const values = {
        corners_placed: after.cornersPlaced - before.cornersPlaced,
        corners_oriented: after.cornersOriented - before.cornersOriented,
        edges_placed: after.edgesPlaced - before.edgesPlaced,
        edges_oriented: after.edgesOriented - before.edgesOriented,
      };
      const gain = total(after) - total(before);
      history.push({ params, value: gain, values });
      experiments += 1;
      if (!best || gain > best.gain) best = { moves, gain, last: { setup, block: choice, symmetry, gain } };
    }
    report();
    if (best && best.gain > 0) {
      await play(best.moves);
      cube = applyMoves(cube, best.moves);
      /* A new cube is a new landscape: the next campaign starts from an empty history. */
      history = [];
      lastStep = best.last;
      report();
    }
  }
  report({ done: isSolved(cube) ? 'solved' : 'budget' });
}

/*
 * One level (founder, 14 Nov 2026, comparison page: the discovery level confused people). The cube starts scrambled
 * and the model solves it directly. Each experiment is a short sequence: a setup X (0 to 2 moves), then either a few
 * plain moves A (1 to 3) or, when B has moves, the commutator A B A' B', then X undone. Two results come back,
 * rewarding what a solver wants: how many of the pieces solved before stay solved (keep what is right), and how much
 * closer the other pieces got (pieceScore: in its slot, turned right, solved). The experiment's value is the gain in
 * closeness overall, less a penalty for every solved piece it broke; an experiment with a positive value is played on
 * the cube, so the total closeness only ever rises and the run cannot go round in circles.
 */
export const DIRECT_SPACE: Param[] = [
  { name: 'setup_depth', type: 'integer', low: 0, high: 2 },
  ...slots('x', 2),
  { name: 'a_depth', type: 'integer', low: 1, high: 3 },
  ...slots('a', 3),
  { name: 'b_depth', type: 'integer', low: 0, high: 2 },
  ...slots('b', 2),
];

/** Each solved piece an experiment breaks costs this much closeness. (Unused since 14 Nov 2026.) */
const BREAK_PENALTY = 2;
void BREAK_PENALTY;
/** In the recorded value: a solved piece outweighs any change in closeness (20 pieces, at most 3 each). */
const SOLVED_WEIGHT = 100;

export type DirectEvent = {
  experiments: number;
  solvedPieces: number;
  /** Total closeness, 0 to 60 (20 pieces, 3 each). */
  closeness: number;
  /** Moves played on the cube so far. */
  moves: number;
  /** After a round of proposals: the closeness each proposal would have left the cube at, in order (the plot's dots). */
  round?: number[];
  /** Pieces solved after each experiment of this round (the race plot's dots, 14 Nov 2026). */
  roundSolved?: number[];
  done?: 'solved' | 'budget';
};

export const directMoves = (p: Settings): Move[] => {
  const x = read(p, 'x', 'setup_depth', 2, 0);
  const a = read(p, 'a', 'a_depth', 3);
  const b = read(p, 'b', 'b_depth', 2, 0);
  return conjugate(x, b.length ? commutator(a, b) : a);
};

const closenessOf = (cube: Cube) => pieceStates(cube).reduce((sum, p) => sum + pieceScore(p), 0);

/** The one-level campaign from a scrambled cube. Plays every accepted sequence through `play`. */
export async function solveDirect(
  start: Cube,
  config: Pick<PhaseConfig, 'solveCalls' | 'batch'> & { method?: Method },
  ask: Ask,
  on: (e: DirectEvent) => void,
  play: (moves: Move[]) => Promise<void>,
  wait: () => Promise<void>,
  cancelled: () => boolean,
) {
  let cube = start;
  let history: LegacyObservation[] = [];
  let experiments = 0;
  let moves = 0;
  const report = (extra: Partial<DirectEvent> = {}) =>
    on({ experiments, solvedPieces: piecesSolved(cube), closeness: closenessOf(cube), moves, ...extra });
  report();
  for (let call = 0; call < config.solveCalls; call++) {
    if (isSolved(cube)) return report({ done: 'solved' });
    await wait();
    if (cancelled()) return;
    const answer = await ask({
      space: DIRECT_SPACE,
      history,
      batch: config.batch,
      goal: 'maximize',
      /* The race (14 Nov 2026): the same campaign, the same results, for each method. */
      ...(config.method ? { method: config.method } : {}),
      /* Solved pieces first (14 Nov 2026, for a cube that gets fully solved): until then the objectives were
         solved_pieces_kept and closer, and a move was played whenever closeness rose by more than twice the solved
         pieces it broke, so a cube could drift away from solved while its closeness went up. */
      objectives: [
        { name: 'solved_pieces', goal: 'maximize' },
        { name: 'closer', goal: 'maximize' },
      ],
    });
    const before = pieceStates(cube);
    const solvedBefore = before.filter((p) => p.solved);
    const scoreBefore = new Map(before.map((p) => [p.id, pieceScore(p)]));
    // let best: { moves: Move[]; value: number } | undefined;
    let best: { moves: Move[]; value: number; solved: number; closer: number; broken: number } | undefined;
    const round: number[] = [];
    const roundSolved: number[] = [];
    for (const { params } of answer.proposals) {
      const seq = directMoves(params);
      const after = pieceStates(applyMoves(cube, seq));
      round.push(after.reduce((sum, p) => sum + pieceScore(p), 0));
      roundSolved.push(after.filter((p) => p.solved).length);
      const solvedAfter = new Set(after.filter((p) => p.solved).map((p) => p.id));
      const kept = solvedBefore.filter((p) => solvedAfter.has(p.id)).length;
      const broken = solvedBefore.length - kept;
      /* Closer: the change in closeness of the pieces that were not solved before. */
      const closer = after.filter((p) => !solvedBefore.some((q) => q.id === p.id)).reduce((sum, p) => sum + pieceScore(p) - (scoreBefore.get(p.id) ?? 0), 0);
      const gain = after.reduce((sum, p) => sum + pieceScore(p), 0) - before.reduce((sum, p) => sum + pieceScore(p), 0);
      // const value = gain - BREAK_PENALTY * broken;
      // history.push({ params, value, values: { solved_pieces_kept: kept, closer } });
      /* The change in solved pieces, then how much closer the others got: one value for the record, solved first. */
      const solved = solvedAfter.size - solvedBefore.length;
      const value = SOLVED_WEIGHT * solved + gain;
      history.push({ params, value, values: { solved_pieces: solved, closer } });
      experiments += 1;
      // if (!best || value > best.value) best = { moves: seq, value };
      if (!best || solved > best.solved || (solved === best.solved && closer > best.closer))
        best = { moves: seq, value, solved, closer, broken };
    }
    report({ round, roundSolved });
    // if (best && best.value > 0) {
    /* Played: more pieces solved, or none broken and the rest closer. Each played move raises (solved, closeness)
       in that order, so the cube never cycles. */
    const progress = best && (best.solved > 0 || (best.solved === 0 && best.broken === 0 && best.closer > 0));
    if (best && progress) {
      await play(best.moves);
      cube = applyMoves(cube, best.moves);
      moves += best.moves.length;
      /* A new cube is a new landscape: the next campaign starts from an empty history. */
      history = [];
      report();
    }
  }
  report({ done: isSolved(cube) ? 'solved' : 'budget' });
}

/*
 * The race by estimated moves remaining (founder, 15 Nov 2026, so that a cube gets fully solved). The pieces-solved
 * campaign above cannot solve a cube: tried with every possible experiment at each step, it stalled at 10 to 17 pieces
 * on every 8-move scramble, because the last pieces are only solved by sequences that first break solved ones. Here
 * each experiment is one to three face turns on the current cube, and two results come back, as a lab assay's readout:
 * the estimated moves remaining (a lower bound from pattern databases, 0 only when solved) and the pieces' summed
 * distance from home, which breaks ties. The best experiment of a round is played when it lowers the estimate, or
 * keeps it and lowers the distance; the cube changes only then.
 *
 * The readout is computed when the run is recorded (scripts/cube-pdb.mjs, tables of about 174 MB) and stored with it;
 * `measure` returns it for a call's k-th experiment. The page computes only the cube itself.
 */
export const ESTIMATE_SPACE: Param[] = [{ name: 'turns', type: 'integer', low: 1, high: 3 }, ...slots('turn', 3)];
/* Repeated runs (founder, 15 Nov 2026: 20 runs per scramble, the median shown). The served methods seed themselves from
   a hash of the request, so the same request always gives the same run. Run k lists the 18 moves in its own shuffled
   order (the same problem, relabelled), the same order for every method in that run. */
export const estimateSpace = (choices?: Move[]): Param[] =>
  choices ? [ESTIMATE_SPACE[0], ...ESTIMATE_SPACE.slice(1).map((p) => ({ ...p, choices }))] : ESTIMATE_SPACE;

export const estimateMoves = (p: Settings): Move[] => read(p, 'turn', 'turns', 3);

/*
 * Two variants to test (founder, 15 Nov 2026: give SDM-1 structure to learn), each move as a face (6 choices) and an
 * ordered angle (1 = a quarter turn clockwise, 2 = a half turn, 3 = a quarter turn back; 0 = no turn, whole sequences
 * only), so that experiments alike in their settings are alike in their moves:
 *   encoding 'ordered': step by step as above, 1 to 3 moves on the current cube.
 *   whole: N: every experiment is a whole sequence of up to N moves from the scrambled cube, one landscape for the
 *     whole run (no restarts); the cube shows the best sequence found so far.
 * `choices` holds the run's order of the faces for these (shuffled per run, as the moves are for the plain encoding).
 */
/* credit: 'prefix' (founder, 15 Nov 2026, with `whole`): a sequence is scored by the best state along it, not only where
   it ends, so a good start keeps its credit whatever follows; the readout's third number is how many moves in. */
/* score: 'one' (15 Nov 2026): one goal, the estimate first and the distance only as a tie-break (estimate + distance /
   100), the same order the cube ranks its own experiments by. Two goals are weighed 1 each by the server, so the
   distance (up to ~30) outweighed the estimate (up to ~7) and the model chased the measure that leads into dead ends;
   and the server's two-goal path waited for 5 distinct values of each, which the whole-number estimate rarely
   reaches, answering with Sobol until then. Off, two goals, as the runs recorded before. */
export type EstimateSetup = { choices?: Move[]; encoding?: 'ordered'; whole?: number; credit?: 'prefix'; score?: 'one' };
const ANGLE = ['', '', '2', "'"];
const faceSlots = (n: number, faces: string[], low: number): Param[] =>
  Array.from({ length: n }, (_, i): Param[] => [
    { name: `face${i + 1}`, type: 'categorical', choices: faces },
    { name: `angle${i + 1}`, type: 'integer', low, high: 3 },
  ]).flat();
export const spaceFor = (c: EstimateSetup): Param[] =>
  c.whole
    ? faceSlots(c.whole, c.choices ?? FACES, 0)
    : c.encoding === 'ordered'
      ? [{ name: 'turns', type: 'integer', low: 1, high: 3 }, ...faceSlots(3, c.choices ?? FACES, 1)]
      : estimateSpace(c.choices);
export const movesFor = (c: EstimateSetup, p: Settings): Move[] => {
  if (!c.whole && c.encoding !== 'ordered') return estimateMoves(p);
  const n = c.whole ?? Math.min(3, Math.max(1, Math.round(Number(p.turns))));
  const out: Move[] = [];
  for (let i = 1; i <= n; i++) {
    const face = String(p[`face${i}`]);
    const angle = Math.min(3, Math.max(0, Math.round(Number(p[`angle${i}`]))));
    if (!FACES.includes(face as (typeof FACES)[number]) || angle === 0) continue;
    out.push(`${face}${ANGLE[angle]}`);
  }
  return out;
};
/* Whole sequences keep one history for the run: past 200 experiments, the 100 best and the 100 latest are sent. */
const windowed = (history: LegacyObservation[]) => {
  if (history.length <= 200) return history;
  const keep = new Set(
    history
      .map((h, i) => [h.value ?? Infinity, i] as const)
      .sort((a, b) => a[0] - b[0] || a[1] - b[1])
      .slice(0, 100)
      .map(([, i]) => i),
  );
  for (let i = history.length - 1; keep.size < 200; i--) keep.add(i);
  return [...keep].sort((a, b) => a - b).map((i) => history[i]);
};

/** The readout of one experiment: [estimated moves remaining, summed distance from home]. */
export type Readout = [number, number] | [number, number, number];
/* `along`: with credit 'prefix', the state after each move of the sequence (the measure scores the best of them and
   says where, as the readout's third number). */
export type Measure = (call: number, k: number, after: Cube, along?: Cube[]) => Readout | Promise<Readout>;

export type EstimateEvent = DirectEvent & {
  /** Estimated moves remaining on the cube (0 when solved). */
  movesLeft: number;
  /** After a round of proposals: the estimate each would have left the cube at (the plot's dots). */
  roundLeft?: number[];
  /** When a better configuration is played: the experiment (counted from the start) that found it. */
  foundAt?: number;
};

const lower = (a: Readout, b: Readout) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);

export async function solveEstimate(
  start: Cube,
  config: Pick<PhaseConfig, 'solveCalls' | 'batch'> & EstimateSetup & { method?: Method; accept?: 'estimate' },
  ask: Ask,
  measure: Measure,
  on: (e: EstimateEvent) => void,
  /* `readout` (16 Nov 2026): the new best's readout, so a page can show only some changes (the race: only when the
     estimated moves remaining drop). */
  play: (moves: Move[], readout?: Readout) => Promise<void>,
  wait: () => Promise<void>,
  cancelled: () => boolean,
) {
  let cube = start;
  let history: LegacyObservation[] = [];
  let experiments = 0;
  let moves = 0;
  /* Whole sequences: the best sequence so far (the cube on show is the scramble with it applied). */
  let shown: Move[] = [];
  /* The scramble's own readout comes from the first call's records (index -1), so the page needs no tables. */
  let now: Readout = await measure(0, -1, start);
  const report = (extra: Partial<EstimateEvent> = {}) =>
    on({ experiments, solvedPieces: piecesSolved(cube), closeness: closenessOf(cube), moves, movesLeft: now[0], ...extra });
  report();
  for (let call = 0; call < config.solveCalls; call++) {
    if (now[0] === 0) return report({ done: 'solved' });
    await wait();
    if (cancelled()) return;
    const answer = await ask({
      // space: estimateSpace(config.choices),
      space: spaceFor(config),
      history: config.whole ? windowed(history) : history,
      batch: config.batch,
      goal: 'minimize',
      ...(config.method ? { method: config.method } : {}),
      ...(config.score === 'one'
        ? {}
        : {
            objectives: [
              { name: 'moves_left', goal: 'minimize' },
              { name: 'cubie_distance', goal: 'minimize' },
            ],
          }),
    });
    let best: { moves: Move[]; readout: Readout; after: Cube; at: number } | undefined;
    const roundLeft: number[] = [];
    const roundSolved: number[] = [];
    for (const [k, { params }] of answer.proposals.entries()) {
      // const seq = estimateMoves(params);
      // const after = applyMoves(cube, seq);
      const seq = movesFor(config, params);
      let after = applyMoves(config.whole ? start : cube, seq);
      let readout: Readout;
      if (config.whole && config.credit === 'prefix') {
        const along: Cube[] = [];
        let c = start;
        for (const m of seq) along.push((c = applyMove(c, m)));
        readout = await measure(call, k, after, along);
        /* The sequence counts up to its best state: the moves after it are dropped from what is shown. */
        const at = readout[2] ?? seq.length;
        seq.length = at;
        after = at ? along[at - 1] : start;
      } else readout = await measure(call, k, after);
      roundLeft.push(readout[0]);
      roundSolved.push(piecesSolved(after));
      /* One value for the record, the estimate first; the two results as they are. */
      history.push(
        config.score === 'one'
          ? { params, value: readout[0] + readout[1] / 100 }
          : { params, value: readout[0] + readout[1] / 100, values: { moves_left: readout[0], cubie_distance: readout[1] } },
      );
      experiments += 1;
      if (!best || lower(readout, best.readout)) best = { moves: seq, readout, after, at: experiments };
    }
    report({ roundLeft, roundSolved, round: roundSolved });
    // if (best && lower(best.readout, now)) {
    /* `accept: 'estimate'` (founder, 15 Nov 2026, after a stuck run): play only when the estimate drops. Playing a level
       estimate with a smaller distance walked cubes into dead ends (on one run the experiments that lower the estimate
       fell from 86 to 4 of 6,174). The distance still ranks a round's experiments and is still reported. Runs recorded
       before keep the old rule, so they replay as recorded. */
    const better =
      best && (config.whole ? lower(best.readout, now) : config.accept === 'estimate' ? best.readout[0] < now[0] : lower(best.readout, now));
    if (best && better && config.whole) {
      /* The cube on show goes from the best sequence so far to the new one; the history stays (one landscape). */
      await play([...inverse(shown), ...best.moves], best.readout);
      shown = best.moves;
      cube = best.after;
      now = best.readout;
      moves = best.moves.length;
      report({ foundAt: best.at });
    } else if (best && better) {
      await play(best.moves);
      cube = best.after;
      now = best.readout;
      moves += best.moves.length;
      /* A new cube is a new landscape: the next campaign starts from an empty history. */
      history = [];
      report({ foundAt: best.at });
    }
  }
  report({ done: now[0] === 0 ? 'solved' : 'budget' });
}
