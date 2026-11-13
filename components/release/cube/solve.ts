import { propose } from '@/lib/sdm/client';
import type { Observation, Param, Settings } from '@/lib/sdm/contract';
import {
  MOVES,
  applyMoves,
  commutator,
  conjugate,
  isSolved,
  outcomes,
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
 * results.
 */

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
  on: (e: DiscoverEvent) => void,
  show: (moves: Move[]) => Promise<void>,
  wait: () => Promise<void>,
  cancelled: () => boolean,
): Promise<Block[]> {
  const history: Observation[] = [];
  const found = new Map<string, Block>();
  let experiments = 0;
  let best: number | null = null;
  for (let call = 0; call < config.discoverCalls; call++) {
    await wait();
    if (cancelled()) break;
    const answer = await propose(
      {
        space: DISCOVER_SPACE,
        history,
        batch: config.batch,
        goal: 'minimize',
        objectives: [{ name: 'pieces_moved', goal: 'minimize' }],
      },
      'demo',
    );
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
  let history: Observation[] = [];
  let experiments = 0;
  let lastStep: SolveEvent['last'];
  const report = (extra: Partial<SolveEvent> = {}) =>
    on({ experiments, solvedPieces: piecesSolved(cube), outcomes: outcomes(cube), last: lastStep, ...extra });
  report();
  for (let call = 0; call < config.solveCalls; call++) {
    if (isSolved(cube)) return report({ done: 'solved' });
    await wait();
    if (cancelled()) return;
    const answer = await propose({
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
    }, 'demo');
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
