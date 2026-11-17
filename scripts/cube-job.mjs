// One repeated cube run, as a self-contained job for a compute cluster (founder, 15 Nov 2026: the 20-runs-per-scramble
// batch goes to the Freighter / AWS clusters, not this laptop).
//
// Bundle (on a machine with this repo; one file, no node_modules needed to run it):
//   npx esbuild scripts/cube-job.mjs --bundle --platform=node --format=esm --outfile=<dir>/cube-job.bundle.mjs
// Run (Node 20 or later; a model server answering the contract of lib/sdm/contract.ts at --api, e.g. BiofoundryDemo's
// `python -m src.serving.sdm1_gpu_server --host 127.0.0.1 --port 8091` on the same node):
//   CUBE_PDB_CACHE=<shared dir> node --max-old-space-size=3000 cube-job.bundle.mjs \
//     --api=http://127.0.0.1:8091 --seed=1 --method=sdm-1 --run=1 --out=<dir>/seed-1-sdm-1-run-1.json
// Options: --scramble=6 (moves) --calls=125 --batch=8 (125 x 8 = 1,000 experiments), --mock (the page's mock, no server),
// --encoding=ordered, --whole=N, --credit=prefix (with --whole: scored by the best state along the sequence),
// --score=one (one goal, estimate + distance / 100, instead of two).
// The readout tables (scripts/cube-pdb.mjs, about 174 MB) are built once into CUBE_PDB_CACHE (about 15 s) and read
// from there by every later job. Each job prints one line and writes the run; scripts/record-cube.mjs --check
// --estimate --verify replays and re-measures every run once the files are back in content/release/cube-runs/estimate/runs/.
//
// The same campaign as `scripts/record-cube.mjs --estimate --run=K` (that script needs this repo and esbuild at run time).
import { writeFileSync } from 'node:fs';
import { applyMove, applyMoves, FACES, MOVES, solved } from '../components/release/cube/cube.ts';
import { campaign, recordedMeasure, recorder, replayer, scrambleFor, seeded } from '../components/release/cube/recording.ts';
import { PUBLIC_LIMITS } from '../lib/sdm/contract.ts';
import { mockPropose } from '../lib/sdm/mock.ts';
import { makeMeasure } from './cube-pdb.mjs';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const seed = Number(arg('seed'));
const method = arg('method');
const run = Number(arg('run'));
const out = arg('out');
const api = (arg('api', '') ?? '').replace(/\/$/, '');
const useMock = process.argv.includes('--mock');
if (!seed || !method || !run || !out || (!api && !useMock)) {
  console.error('usage: cube-job.bundle.mjs --api=URL|--mock --seed=N --method=M --run=K --out=FILE [--scramble=6 --calls=125 --batch=8]');
  process.exit(2);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/* The run's order of the moves: the same seeded shuffle as record-cube.mjs --run=K. */
const shuffled = (items, random) => {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/* What the page's client sends (lib/sdm/client.ts): the last 200 observations, at most 8 proposals. */
const trim = (request) => ({
  ...request,
  history: request.history.slice(-PUBLIC_LIMITS.maxHistory),
  batch: Math.min(request.batch, PUBLIC_LIMITS.maxBatch),
});
async function live(request) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const response = await fetch(`${api}/v1/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trim(request)),
        signal: AbortSignal.timeout(300000),
      });
      if (response.status === 429 || response.status === 503) {
        await sleep(((await response.json().catch(() => null))?.retry_after_s ?? 10) * 1000);
        continue;
      }
      if (!response.ok) throw new Error(`model answered ${response.status}: ${await response.text()}`);
      return response.json();
    } catch (error) {
      if (attempt === 7) throw error;
      await sleep(5000);
    }
  }
  throw new Error('model kept answering 429/503');
}
async function mock(request) {
  const answer = await mockPropose(trim(request));
  if ('status' in answer) throw new Error(`mock answered ${answer.status}`);
  return answer;
}

const pdb = makeMeasure({ solved, applyMove, applyMoves, MOVES });
const config = {
  mode: 'estimate',
  scrambleDepth: Number(arg('scramble', '6')),
  discoverCalls: 0,
  solveCalls: Number(arg('calls', '125')),
  batch: Number(arg('batch', '8')),
  keep: 0,
  method,
  run,
  /* --encoding=ordered (face + ordered angle per move) or --whole=N (whole sequences of up to N moves): the variants
     under test (15 Nov 2026); the run's shuffle is then of the 6 faces. */
  ...(arg('encoding') === 'ordered' ? { encoding: 'ordered' } : {}),
  ...(arg('whole') ? { whole: Number(arg('whole')) } : {}),
  /* --credit=prefix (with --whole): a sequence scored by the best state along it (15 Nov 2026). */
  ...(arg('credit') === 'prefix' ? { credit: 'prefix' } : {}),
  /* --score=one: one goal (estimate + distance / 100) instead of two (15 Nov 2026). */
  ...(arg('score') === 'one' ? { score: 'one' } : {}),
  choices: arg('encoding') === 'ordered' || arg('whole') ? shuffled(FACES, seeded(run * 7919)) : shuffled(MOVES, seeded(run * 7919)),
  /* Play only when the estimate drops (15 Nov 2026). */
  accept: 'estimate',
};
const rec = recorder(useMock ? mock : live);
const moves = scrambleFor(seed, config.scrambleDepth);
let start;
/* The better of two readouts: fewer moves left, then the smaller distance. */
const lower = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
const measure = async (call, k, after, along) => {
  let r = pdb(after);
  /* With --credit=prefix: the best state along the sequence, and how many moves in (the first such, if tied). */
  if (along) {
    r = [...pdb(along.length ? along[0] : after), along.length ? 1 : 0];
    along.forEach((c, i) => {
      const x = pdb(c);
      if (lower(x, r)) r = [x[0], x[1], i + 1];
    });
  }
  if (k < 0) start = r;
  else (rec.calls[call].r ??= [])[k] = r;
  return r;
};
const t0 = Date.now();
const summary = await campaign(config, moves, rec.ask, measure);
const { model, version } = rec.meta();
const result = { seed, model, version, recorded: new Date().toISOString().slice(0, 10), config, scramble: moves, start, summary, calls: rec.calls };
/* The run must replay from its own records, as the page plays it. */
const replayed = await campaign(config, moves, replayer(result, false), recordedMeasure(result));
if (!same(replayed, summary)) throw new Error(`seed ${seed} ${method} run ${run}: the recording does not replay as it ran`);
const { calls, ...head } = result;
const top = JSON.stringify(head, null, 2).replace(/\n}$/, '');
writeFileSync(out, `${top},\n  "calls": [\n${calls.map((c) => `    ${JSON.stringify(c)}`).join(',\n')}\n  ]\n}\n`);
console.log(
  `seed ${seed} ${method} run ${run}: ${summary.solved ? `solved in ${summary.solveExperiments}` : `${summary.movesLeft} moves left after ${summary.solveExperiments}`} ` +
    `(${model}, ${Math.round((Date.now() - t0) / 1000)} s)`,
);
