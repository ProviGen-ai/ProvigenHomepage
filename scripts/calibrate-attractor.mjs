// Calibrates the toggle-switch figure (components/writings/attractor/model.ts):
// runs the exact model the page runs and reports, per push strength, the share
// of cells that end the relax phase in attractor B, plus a no-push control that
// checks for spontaneous switching. Paste the result into model.ts's header.
//
// usage: node scripts/calibrate-attractor.mjs [--seeds=40] [--sweep]
// (Node 22.18+ strips the TypeScript types of model.ts on import.)
import {
  CELLS,
  CYCLE,
  PUSH,
  SEED,
  STEPS,
  advance,
  createRun,
} from '../components/writings/attractor/model.ts';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};
const seedCount = Number(flag('seeds', 40));
const sweep = Boolean(flag('sweep', false));

const seeds = (count) => Array.from({ length: count }, (_, i) => 1000 + i * 7919);

/**
 * One full cycle. switched: cells in B when the relax phase ends; crossed:
 * cells that were ever on the B side of x = y; undecided: cells within one unit
 * of x = y when the fate is read; flipped: cells on the other side of x = y by
 * the end of the cycle than when their fate was read.
 */
function cycle(seed, strength) {
  const run = createRun(seed, strength);
  let crossed = 0;
  let undecided = 0;
  let flipped = 0;
  const ever = new Uint8Array(CELLS);
  while (run.step < STEPS) {
    const wasSettled = run.settled;
    advance(run, 1);
    for (let i = 0; i < CELLS; i++) if (run.y[i] > run.x[i]) ever[i] = 1;
    if (run.settled && !wasSettled) {
      for (let i = 0; i < CELLS; i++) if (Math.abs(run.x[i] - run.y[i]) < 1) undecided++;
    }
  }
  for (let i = 0; i < CELLS; i++) {
    crossed += ever[i];
    if ((run.y[i] > run.x[i] ? 1 : 0) !== run.fate[i]) flipped++;
  }
  return { switched: run.switched, crossed, undecided, flipped };
}

function row(strength, count) {
  const fractions = [];
  let crossed = 0;
  let undecided = 0;
  let flipped = 0;
  for (const seed of seeds(count)) {
    const r = cycle(seed, strength);
    fractions.push(r.switched / CELLS);
    crossed += r.crossed;
    undecided += r.undecided;
    flipped += r.flipped;
  }
  const mean = fractions.reduce((a, b) => a + b, 0) / fractions.length;
  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  return {
    strength,
    mean: pct(mean),
    min: pct(Math.min(...fractions)),
    max: pct(Math.max(...fractions)),
    switchedCells: Math.round(mean * CELLS * count),
    everCrossed: crossed,
    undecidedAtSettle: undecided,
    flippedAfter: flipped,
  };
}

console.log(`cells ${CELLS} · cycle ${CYCLE} time units · seeds ${seedCount}`);
console.table([
  { label: 'no push (20 cycles)', ...row(0, 20) },
  { label: 'low', ...row(PUSH.low, seedCount) },
  { label: 'near (default)', ...row(PUSH.near, seedCount) },
  { label: 'high', ...row(PUSH.high, seedCount) },
]);
const first = cycle(SEED, PUSH.near);
console.log(`first cycle on the page (seed ${SEED}, U = ${PUSH.near}): back to A ${CELLS - first.switched} · switched to B ${first.switched}`);
if (sweep) {
  const rows = [];
  for (let u = PUSH.min; u <= PUSH.max + 1e-9; u += 0.25) rows.push(row(Number(u.toFixed(2)), 12));
  console.table(rows);
}
