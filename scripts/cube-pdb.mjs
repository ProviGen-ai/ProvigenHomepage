// The measurement behind the cube race (founder, 15 Nov 2026): for a cube state, two results.
//
//   moves_left      Estimated moves remaining: a lower bound on the moves the cube still needs, from three
//                   pattern databases (Korf 1997): all 8 corners (8! x 3^7 = 88,179,840 states), and two sets of
//                   6 edges (12!/6! x 2^6 = 42,577,920 states each). Each table holds the fewest moves that solve
//                   its pieces, the others ignored; the estimate is the largest of the three. 0 only when solved.
//   cubie_distance  The pieces' summed distance from home: for every corner and edge, the fewest face turns that
//                   would bring it home turned right if it moved alone. Breaks ties between equal estimates.
//
// The race's methods never see these tables or the cube: they get the two numbers per experiment, as a lab gets an
// assay's readout. The tables (about 174 MB) are built once, in about 15 s, and kept in node_modules/.cache/cube-pdb/
// (never committed); only the recorder (scripts/record-cube.mjs) and its --verify use them. The page replays the
// recorded readouts (recording.ts) and needs no tables.
//
// `lib` is the bundled page cube (components/release/cube/cube.ts): solved, applyMove, MOVES. Built on the page's
// own moves, so the tables cannot disagree with the cube the page draws.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/* CUBE_PDB_CACHE: another folder for the tables (a cluster job's shared scratch, 15 Nov 2026). */
const CACHE = process.env.CUBE_PDB_CACHE
  ? `${process.env.CUBE_PDB_CACHE.replace(/\/$/, '')}/`
  : fileURLToPath(new URL('../node_modules/.cache/cube-pdb/', import.meta.url));

export function makeMeasure(lib) {
  const S0 = lib.solved();
  const key = (pos, normal) => `${pos.join()}|${normal.join()}`;
  const slotOf = new Map(S0.map((s, i) => [key(s.pos, s.normal), i]));
  const MOVES = lib.MOVES;
  /* PERM[m][i]: where the sticker in slot i goes under move m. */
  const PERM = MOVES.map((m) => {
    const c = lib.applyMove(S0.map((s, i) => ({ ...s, id: i })), m);
    const p = new Int8Array(54);
    c.forEach((s) => (p[s.id] = slotOf.get(key(s.pos, s.normal))));
    return p;
  });
  const groups = new Map();
  S0.forEach((s, i) => groups.set(s.pos.join(), [...(groups.get(s.pos.join()) ?? []), i]));
  const PIECES = [...groups.values()].filter((g) => g.length >= 2);
  const nrm = (i) => S0[i].normal;
  const pos = (i) => S0[i].pos;
  const color = (sticker) => S0[sticker].color;
  const det = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  /* Corner slots in one turning sense (U/D-facing slot first), so twists add up to 0 mod 3. */
  const CL = PIECES.filter((g) => g.length === 3).map((g) => {
    const y = g.find((s) => nrm(s)[1] !== 0);
    const o = g.filter((s) => s !== y);
    return det(nrm(y), nrm(o[0]), nrm(o[1])) > 0 ? [y, o[0], o[1]] : [y, o[1], o[0]];
  });
  /* Edge slots, the slot that counts as turned right first (U/D face; F/B for the middle layer). */
  const EL = PIECES.filter((g) => g.length === 2).map((g) => {
    const good = g.find((s) => (pos(s)[1] === 0 ? nrm(s)[2] !== 0 : nrm(s)[1] !== 0));
    return [good, g.find((s) => s !== good)];
  });
  const cLoc = new Int8Array(54).fill(-1);
  const cIdx = new Int8Array(54).fill(-1);
  CL.forEach((g, j) => g.forEach((s, k) => ((cLoc[s] = j), (cIdx[s] = k))));
  const eLoc = new Int8Array(54).fill(-1);
  const eIdx = new Int8Array(54).fill(-1);
  EL.forEach((g, j) => g.forEach((s, k) => ((eLoc[s] = j), (eIdx[s] = k))));
  const cMove = PERM.map((p) => CL.map((g) => g.map((s) => [cLoc[p[s]], cIdx[p[s]]])));
  const eMove = PERM.map((p) => EL.map((g) => g.map((s) => [eLoc[p[s]], eIdx[p[s]]])));

  /* Ranks: corner permutation (Lehmer), twists of the first 7 corners, the slots of a 6-edge set in order. */
  const F8 = [1, 1, 2, 6, 24, 120, 720, 5040];
  const rank8 = (p) => {
    let r = 0;
    for (let i = 0; i < 8; i++) {
      let c = 0;
      for (let j = i + 1; j < 8; j++) if (p[j] < p[i]) c++;
      r += c * F8[7 - i];
    }
    return r;
  };
  const unrank8 = (r) => {
    const items = [0, 1, 2, 3, 4, 5, 6, 7];
    const p = [];
    for (let i = 0; i < 8; i++) {
      const f = F8[7 - i];
      p.push(items.splice(Math.floor(r / f), 1)[0]);
      r %= f;
    }
    return p;
  };
  const twRank = (t) => t.slice(0, 7).reduce((r, v) => r * 3 + v, 0);
  const twUnrank = (r) => {
    const t = new Array(8);
    let sum = 0;
    for (let i = 6; i >= 0; i--) {
      t[i] = r % 3;
      r = Math.floor(r / 3);
      sum += t[i];
    }
    t[7] = (3 - (sum % 3)) % 3;
    return t;
  };
  const tRank = (locs) => {
    let r = 0;
    for (let i = 0; i < 6; i++) {
      let c = locs[i];
      for (let j = 0; j < i; j++) if (locs[j] < locs[i]) c--;
      r = r * (12 - i) + c;
    }
    return r;
  };
  const tUnrank = (r) => {
    const digits = [];
    for (let i = 5; i >= 0; i--) {
      digits[i] = r % (12 - i);
      r = Math.floor(r / (12 - i));
    }
    const free = [...Array(12).keys()];
    return digits.map((d) => free.splice(d, 1)[0]);
  };
  const NT = 665280;

  const cached = (name, size, build) => {
    const file = `${CACHE}${name}.bin`;
    if (existsSync(file)) {
      const d = new Uint8Array(readFileSync(file));
      if (d.length === size) return d;
    }
    const d = build();
    mkdirSync(CACHE, { recursive: true });
    writeFileSync(file, d);
    return d;
  };
  const DC = cached('corners', 40320 * 2187, () => {
    const pMove = new Uint16Array(40320 * 18);
    const tMove = new Uint16Array(2187 * 18);
    for (let r = 0; r < 40320; r++) {
      const p = unrank8(r);
      for (let m = 0; m < 18; m++) pMove[r * 18 + m] = rank8(p.map((loc) => cMove[m][loc][0][0]));
    }
    for (let r = 0; r < 2187; r++) {
      const t = twUnrank(r);
      for (let m = 0; m < 18; m++) {
        const n = new Array(8);
        for (let loc = 0; loc < 8; loc++) {
          const [l2, k2] = cMove[m][loc][t[loc]];
          n[l2] = k2;
        }
        tMove[r * 18 + m] = twRank(n);
      }
    }
    const D = new Uint8Array(40320 * 2187).fill(255);
    D[0] = 0;
    for (let d = 0; ; d++) {
      let added = 0;
      for (let i = 0; i < D.length; i++)
        if (D[i] === d) {
          const pr = Math.floor(i / 2187);
          const tr = i % 2187;
          for (let m = 0; m < 18; m++) {
            const j = pMove[pr * 18 + m] * 2187 + tMove[tr * 18 + m];
            if (D[j] === 255) (D[j] = d + 1), added++;
          }
        }
      if (!added) break;
    }
    return D;
  });
  const edgeTable = (SET, name) =>
    cached(name, NT * 64, () => {
      const pMove = new Int32Array(NT * 18);
      const fMask = new Uint8Array(NT * 18);
      for (let r = 0; r < NT; r++) {
        const locs = tUnrank(r);
        for (let m = 0; m < 18; m++) {
          let mask = 0;
          const moved = locs.map((loc, i) => {
            const [l2, k2] = eMove[m][loc][0];
            if (k2 !== 0) mask |= 1 << i;
            return l2;
          });
          pMove[r * 18 + m] = tRank(moved);
          fMask[r * 18 + m] = mask;
        }
      }
      const D = new Uint8Array(NT * 64).fill(255);
      D[tRank(SET) * 64] = 0;
      for (let d = 0; ; d++) {
        let added = 0;
        for (let i = 0; i < D.length; i++)
          if (D[i] === d) {
            const pr = i >> 6;
            const fl = i & 63;
            for (let m = 0; m < 18; m++) {
              const j = pMove[pr * 18 + m] * 64 + (fl ^ fMask[pr * 18 + m]);
              if (D[j] === 255) (D[j] = d + 1), added++;
            }
          }
        if (!added) break;
      }
      return D;
    });
  const SETA = [0, 1, 2, 3, 4, 5];
  const SETB = [6, 7, 8, 9, 10, 11];
  const DA = edgeTable(SETA, 'edges-a');
  const DB = edgeTable(SETB, 'edges-b');

  /* Per piece alone: the fewest face turns from any slot back to its home slot (BFS over one sticker's slots). */
  const DIST = new Map();
  for (const g of PIECES) {
    const t = new Int8Array(54).fill(-1);
    t[g[0]] = 0;
    let front = [g[0]];
    for (let k = 1; front.length; k++) {
      const next = [];
      for (const x of front)
        for (const p of PERM)
          if (t[p[x]] < 0) {
            t[p[x]] = k;
            next.push(p[x]);
          }
      front = next;
    }
    DIST.set(g[0], t);
  }

  /* The page's cube (stickers with colour, place and facing) as state[slot] = the sticker's home slot. */
  const AXIS = { R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 };
  const SIGN = { R: 1, L: -1, U: 1, D: -1, F: 1, B: -1 };
  const faceNormal = (c) => {
    const n = [0, 0, 0];
    n[AXIS[c]] = SIGN[c];
    return n;
  };
  function state(cube) {
    const byPos = new Map();
    for (const s of cube) byPos.set(s.pos.join(), [...(byPos.get(s.pos.join()) ?? []), s]);
    const st = new Int8Array(54);
    for (const g of byPos.values()) {
      const home = [0, 0, 0];
      for (const s of g) home[AXIS[s.color]] = SIGN[s.color];
      for (const s of g) st[slotOf.get(key(s.pos, s.normal))] = slotOf.get(key(home, faceNormal(s.color)));
    }
    return st;
  }

  function measure(cube) {
    const st = state(cube);
    const cPos = new Array(8);
    const cTw = new Array(8);
    CL.forEach((g, loc) => {
      cPos[cLoc[st[g[0]]]] = loc;
      cTw[loc] = g.findIndex((s) => 'UD'.includes(color(st[s])));
    });
    const ePos = new Array(12);
    const eFl = new Array(12);
    EL.forEach((g, loc) => {
      const piece = eLoc[st[g[0]]];
      ePos[piece] = loc;
      const ud = g.findIndex((s) => 'UD'.includes(color(st[s])));
      eFl[piece] = ud >= 0 ? ud : g.findIndex((s) => 'FB'.includes(color(st[s])));
    });
    const edges = (SET, D) => D[tRank(SET.map((p) => ePos[p])) * 64 + SET.reduce((m, p, i) => m | (eFl[p] << i), 0)];
    const movesLeft = Math.max(DC[rank8(cPos) * 2187 + twRank(cTw)], edges(SETA, DA), edges(SETB, DB));
    const where = new Int8Array(54);
    for (let i = 0; i < 54; i++) where[st[i]] = i;
    let cubieDistance = 0;
    for (const g of PIECES) cubieDistance += DIST.get(g[0])[where[g[0]]];
    return [movesLeft, cubieDistance];
  }

  /* Self-check: solved reads 0, and k random moves never read more than k moves left. */
  if (measure(S0)[0] !== 0 || measure(S0)[1] !== 0) throw new Error('cube-pdb: a solved cube does not read 0');
  let rnd = 7;
  for (let k = 1; k <= 10; k++) {
    let c = S0;
    for (let i = 0; i < k; i++) c = lib.applyMove(c, MOVES[(rnd = (rnd * 1103515245 + 12345) % 2147483648) % 18]);
    if (measure(c)[0] > k) throw new Error(`cube-pdb: ${k} moves read ${measure(c)[0]} moves left`);
  }
  return measure;
}
