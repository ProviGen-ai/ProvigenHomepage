/*
 * A 3x3x3 cube for the release page's demo (13 Nov 2026). Each of the 54
 * stickers is a position and an outward normal on the integer grid
 * {-1, 0, 1}^3 (x right, y up, z towards the viewer) and the colour of the
 * face it started on. A face turn rotates every sticker in that layer about
 * the face's axis. Centres never move under face turns, so a sticker is in
 * place when its colour is the colour of the face its normal points to.
 *
 * score() counts stickers in place (54 when solved): the only thing the model
 * is told about a cube is how that number changed after a whole sequence of
 * moves, never which moves helped.
 */

export type Vec = [number, number, number];
export type Face = 'U' | 'D' | 'R' | 'L' | 'F' | 'B';
export type Sticker = { pos: Vec; normal: Vec; color: Face };
export type Cube = Sticker[];

export const FACES: Face[] = ['U', 'D', 'R', 'L', 'F', 'B'];

/* Each face: its outward axis (index and sign) and the sense of a clockwise
   quarter turn seen from outside, as an angle about the positive axis. */
const FACE: Record<Face, { axis: 0 | 1 | 2; sign: 1 | -1 }> = {
  R: { axis: 0, sign: 1 },
  L: { axis: 0, sign: -1 },
  U: { axis: 1, sign: 1 },
  D: { axis: 1, sign: -1 },
  F: { axis: 2, sign: 1 },
  B: { axis: 2, sign: -1 },
};

/** The 18 face turns: U, U' (anticlockwise), U2 (half turn), and so on. */
export const MOVES = FACES.flatMap((f) => [f, `${f}'`, `${f}2`]);
export type Move = string;

const faceOf = (normal: Vec): Face => {
  const axis = normal.findIndex((c) => c !== 0) as 0 | 1 | 2;
  return (Object.keys(FACE) as Face[]).find((f) => FACE[f].axis === axis && FACE[f].sign === normal[axis])!;
};

export function solved(): Cube {
  const cube: Cube = [];
  for (const f of FACES) {
    const { axis, sign } = FACE[f];
    const others = [0, 1, 2].filter((a) => a !== axis);
    for (const a of [-1, 0, 1])
      for (const b of [-1, 0, 1]) {
        const pos: Vec = [0, 0, 0];
        pos[axis] = sign;
        pos[others[0]] = a;
        pos[others[1]] = b;
        const normal: Vec = [0, 0, 0];
        normal[axis] = sign;
        cube.push({ pos, normal, color: f });
      }
  }
  return cube;
}

/** A move's face, the turn angle in quarter turns about the positive axis, and the layer it moves. */
export function parseMove(move: Move) {
  const face = move[0] as Face;
  const { axis, sign } = FACE[face];
  const quarter = move.endsWith('2') ? 2 : move.endsWith("'") ? -1 : 1;
  /* Clockwise seen from outside the face is a negative rotation about its outward normal. */
  const turns = -quarter * sign;
  return { face, axis, layer: sign, turns };
}

/** Rotate a vector about a coordinate axis by a number of quarter turns (right-handed). */
export function rotate(v: Vec, axis: 0 | 1 | 2, turns: number): Vec {
  const q = ((turns % 4) + 4) % 4;
  let [x, y, z] = v;
  for (let i = 0; i < q; i++) {
    if (axis === 0) [y, z] = [-z, y];
    else if (axis === 1) [z, x] = [-x, z];
    else [x, y] = [-y, x];
  }
  return [x, y, z];
}

export function applyMove(cube: Cube, move: Move): Cube {
  const { axis, layer, turns } = parseMove(move);
  return cube.map((s) =>
    s.pos[axis] === layer ? { ...s, pos: rotate(s.pos, axis as 0 | 1 | 2, turns), normal: rotate(s.normal, axis as 0 | 1 | 2, turns) } : s,
  );
}

export const applyMoves = (cube: Cube, moves: Move[]) => moves.reduce(applyMove, cube);

export const score = (cube: Cube) => cube.filter((s) => s.color === faceOf(s.normal)).length;

export const isSolved = (cube: Cube) => score(cube) === 54;

/** A random scramble of `length` moves, never turning the same face twice in a row. */
export function scramble(length: number, random = Math.random): Move[] {
  const moves: Move[] = [];
  while (moves.length < length) {
    const m = MOVES[Math.floor(random() * MOVES.length)];
    if (moves.length && moves[moves.length - 1][0] === m[0]) continue;
    moves.push(m);
  }
  return moves;
}

export const invert = (move: Move): Move => (move.endsWith('2') ? move : move.endsWith("'") ? move[0] : `${move[0]}'`);
