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

/* ---- Pieces (13 Nov 2026): the four outcomes and support, for the two-phase campaign ---- */

const AXIS_OF: Record<Face, 0 | 1 | 2> = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 };

/** Corners and edges, each as its stickers (centres left out). */
function pieces(cube: Cube) {
  const groups = new Map<string, Sticker[]>();
  for (const s of cube) {
    const key = s.pos.join();
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return [...groups.values()].filter((g) => g.length >= 2);
}

/** A piece's home slot: the corner or edge between the centres of its colours. */
const home = (g: Sticker[]): Vec => {
  const h: Vec = [0, 0, 0];
  for (const s of g) h[AXIS_OF[s.color]] = FACE[s.color].sign;
  return h;
};

/*
 * Orientation in the convention two-phase solvers use (U/D for corners, F/B
 * for edges): a corner is oriented when its U-or-D-coloured sticker faces U
 * or D; an edge, when its reference sticker (U/D colour if it has one, else
 * its F/B colour) sits on the slot's reference face (U/D for edges in the top
 * or bottom layer, F/B for edges in the middle layer). Only quarter turns of
 * R, L, F, B twist corners; only quarter turns of F and B flip edges.
 */
function oriented(g: Sticker[]) {
  if (g.length === 3) return g.some((s) => (s.color === 'U' || s.color === 'D') && s.normal[1] !== 0);
  const ref = g.find((s) => s.color === 'U' || s.color === 'D') ?? g.find((s) => s.color === 'F' || s.color === 'B')!;
  const middleLayer = ref.pos[1] === 0;
  return middleLayer ? ref.normal[2] !== 0 : ref.normal[1] !== 0;
}

export type Outcomes = { cornersPlaced: number; cornersOriented: number; edgesPlaced: number; edgesOriented: number };

export function outcomes(cube: Cube): Outcomes {
  const o: Outcomes = { cornersPlaced: 0, cornersOriented: 0, edgesPlaced: 0, edgesOriented: 0 };
  for (const g of pieces(cube)) {
    const corner = g.length === 3;
    const placed = home(g).every((c, i) => c === g[0].pos[i]);
    if (placed) corner ? o.cornersPlaced++ : o.edgesPlaced++;
    if (oriented(g)) corner ? o.cornersOriented++ : o.edgesOriented++;
  }
  return o;
}

/** Pieces solved (placed and turned right), 0 to 20. */
export const piecesSolved = (cube: Cube) =>
  pieces(cube).filter((g) => g.every((s) => s.color === faceOf(s.normal))).length;

/** How many pieces a sequence moves: apply it to a solved cube and count the pieces it leaves unsolved. */
export const support = (moves: Move[]) => 20 - piecesSolved(applyMoves(solved(), moves));

export const inverse = (moves: Move[]) => moves.slice().reverse().map(invert);
export const commutator = (a: Move[], b: Move[]) => [...a, ...b, ...inverse(a), ...inverse(b)];
export const conjugate = (x: Move[], y: Move[]) => [...x, ...y, ...inverse(x)];

/*
 * The 48 symmetries of the cube, as signed permutation matrices (24
 * rotations, each with or without a mirror). A symmetry acts on a move by
 * sending the face's outward axis to its image; a mirror (determinant -1)
 * also reverses the turn. One operator found becomes 48.
 */
export const SYMMETRIES: number[][] = (() => {
  const out: number[][] = [];
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  for (const p of perms)
    for (let signs = 0; signs < 8; signs++) {
      const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      p.forEach((col, row) => (m[row * 3 + col] = signs & (1 << row) ? -1 : 1));
      out.push(m);
    }
  /* Identity first, so symmetry 0 leaves a sequence as it is. */
  out.sort((a, b) => Number(b.join() === '1,0,0,0,1,0,0,0,1') - Number(a.join() === '1,0,0,0,1,0,0,0,1'));
  return out;
})();

const det3 = (m: number[]) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);

export function symmetric(moves: Move[], s: number): Move[] {
  const m = SYMMETRIES[((s % 48) + 48) % 48];
  const mirror = det3(m) < 0;
  return moves.map((move) => {
    const face = move[0] as Face;
    const n: Vec = [0, 0, 0];
    n[AXIS_OF[face]] = FACE[face].sign;
    const image: Vec = [m[0] * n[0] + m[1] * n[1] + m[2] * n[2], m[3] * n[0] + m[4] * n[1] + m[5] * n[2], m[6] * n[0] + m[7] * n[1] + m[8] * n[2]];
    const target = faceOf(image);
    const suffix = move.slice(1);
    if (!mirror || suffix === '2') return `${target}${suffix}`;
    return suffix === "'" ? target : `${target}'`;
  });
}
