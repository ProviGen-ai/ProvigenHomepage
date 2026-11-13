import { propose } from '@/lib/sdm/client';
import type { Observation, Param } from '@/lib/sdm/contract';
import { MOVES, applyMoves, isSolved, score, type Cube, type Move } from './cube';

/*
 * The cube as a black box for the model (founder, 13 Nov 2026). One
 * experiment is one sequence of moves: an integer `depth` (how many moves)
 * and `depth` move slots, each a choice of the 18 face turns; slots past
 * `depth` are ignored. The result is the change in stickers in place after
 * the whole sequence, never per move, so a sequence is only worth something
 * if, as a whole, it leaves the cube better: the model has to find how long a
 * sequence must be before any sequence of that length helps.
 *
 * The loop: ask for a batch of sequences, try each on a copy of the cube (in
 * the browser; the model never sees the cube), keep the best. If it helped,
 * play it on the cube and start a new campaign from there; otherwise ask
 * again with the failures in the history. It ends when the cube is solved or
 * the call budget is spent.
 */

export type SolveConfig = {
  /** The longest sequence the model may propose. */
  maxDepth: number;
  /** Sequences per call. */
  batch: number;
  /** Calls this cube may make in one page view. */
  maxCalls: number;
};

export function space(maxDepth: number): Param[] {
  return [
    { name: 'depth', type: 'integer', low: 1, high: maxDepth },
    ...Array.from({ length: maxDepth }, (_, i): Param => ({ name: `move${i + 1}`, type: 'categorical', choices: MOVES })),
  ];
}

export function decode(params: Record<string, number | string>, maxDepth: number): Move[] {
  const depth = Math.min(maxDepth, Math.max(1, Math.round(Number(params.depth))));
  return Array.from({ length: depth }, (_, i) => String(params[`move${i + 1}`])).filter((m) => MOVES.includes(m));
}

export type SolveEvent =
  | { kind: 'tried'; experiments: number }
  | { kind: 'improved'; moves: Move[]; gain: number; experiments: number }
  | { kind: 'solved'; experiments: number }
  | { kind: 'budget'; experiments: number };

/**
 * Drive one solve. `play` animates a sequence on the visible cube and resolves
 * when it has finished; `wait` resolves when the page lets the demo go on (in
 * view, not paused). Errors from the client (high demand, limits) propagate.
 */
export async function solve(
  start: Cube,
  config: SolveConfig,
  on: (event: SolveEvent) => void,
  play: (moves: Move[]) => Promise<void>,
  wait: () => Promise<void>,
  cancelled: () => boolean,
) {
  const sp = space(config.maxDepth);
  let cube = start;
  let history: Observation[] = [];
  let experiments = 0;
  for (let call = 0; call < config.maxCalls; call++) {
    if (isSolved(cube)) return on({ kind: 'solved', experiments });
    await wait();
    if (cancelled()) return;
    const answer = await propose({ space: sp, history, batch: config.batch, goal: 'maximize' });
    if (cancelled()) return;
    const before = score(cube);
    let best: { moves: Move[]; gain: number } | undefined;
    for (const { params } of answer.proposals) {
      const moves = decode(params, config.maxDepth);
      const gain = score(applyMoves(cube, moves)) - before;
      history.push({ params, value: gain });
      experiments += 1;
      if (!best || gain > best.gain || (gain === best.gain && moves.length < best.moves.length)) best = { moves, gain };
    }
    on({ kind: 'tried', experiments });
    if (best && best.gain > 0) {
      on({ kind: 'improved', moves: best.moves, gain: best.gain, experiments });
      await play(best.moves);
      cube = applyMoves(cube, best.moves);
      /* A new cube is a new landscape: the next campaign starts from an empty history. */
      history = [];
    }
  }
  on(isSolved(cube) ? { kind: 'solved', experiments } : { kind: 'budget', experiments });
}
