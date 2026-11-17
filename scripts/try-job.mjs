// Records "Try it" (founder, 16 Nov 2026: what visitors see is precomputed; live calls only where people actually
// interact with the model). In the panel the model, Bayesian optimization and the design each see only their own
// history on a landscape, never the visitor's clicks, so a fixed set of landscapes can be recorded in full and the
// panel plays them back with no call to the API.
//
// Each landscape: the same requests the panel sends (TryPanel.tsx, next): SDM-1 and Bayesian optimization one
// experiment per call, 25 calls, each with that method's history so far; the design one call for all 25.
//
// Bundle (one file, no node_modules needed to run it):
//   npx esbuild scripts/try-job.mjs --bundle --platform=node --format=esm --outfile=<dir>/try-job.bundle.mjs
// Run (Node 20 or later; a model server answering lib/sdm/contract.ts at --api, e.g. BiofoundryDemo's
// `python -m src.serving.sdm1_gpu_server --host 127.0.0.1 --port 8091` on the same node, so no online API is called):
//   node try-job.bundle.mjs --api=http://127.0.0.1:8091 --seeds=1-20 --out=<dir>/try-ridged.json
// Options: --mock (the page's mock, no server), --kind=ridged|gentle|plain (the landscape family; the comparison page
// uses ridged), --methods=sdm-1,bayesian-optimisation,doe-lhs.
// The file goes to content/release/try-runs/<kind>.json.
import { writeFileSync } from 'node:fs';
import { makeGentleLandscape, makeLandscape, makeRidgedLandscape } from '../components/release/try/landscapes.ts';
import { mockPropose } from '../lib/sdm/mock.ts';

const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const api = (arg('api', '') ?? '').replace(/\/$/, '');
const useMock = process.argv.includes('--mock');
const out = arg('out');
const kind = arg('kind', 'ridged');
const seedsArg = arg('seeds', '1-20');
const methods = arg('methods', 'sdm-1,bayesian-optimisation,doe-lhs').split(',');
if (!out || (!api && !useMock)) {
  console.error('usage: try-job.bundle.mjs --api=URL|--mock --seeds=1-20 --out=FILE [--kind=ridged]');
  process.exit(2);
}
const seeds = seedsArg.split(',').flatMap((part) => {
  const [lo, hi] = part.split('-').map(Number);
  return hi ? Array.from({ length: hi - lo + 1 }, (_, i) => lo + i) : [lo];
});
const make = { ridged: makeRidgedLandscape, gentle: makeGentleLandscape, plain: makeLandscape }[kind];
if (!make) throw new Error(`unknown --kind=${kind}`);

/* As the panel (TryPanel.tsx). */
const MAX = 25;
const SPACE = [
  { name: 'setting_a', type: 'continuous', low: 0, high: 1 },
  { name: 'setting_b', type: 'continuous', low: 0, high: 1 },
];
const clamp = (v) => Math.min(1, Math.max(0, Number(v)));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ask(request) {
  if (useMock) {
    const answer = await mockPropose(request);
    if ('status' in answer) throw new Error(`mock refused: ${answer.status}`);
    return answer;
  }
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const response = await fetch(`${api}/v1/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(300000),
      });
      if (response.ok) return await response.json();
      const text = await response.text();
      if (response.status < 500 && response.status !== 429) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
    } catch (error) {
      if (String(error).includes('HTTP 4')) throw error;
    }
    await sleep(2000 * 2 ** attempt);
  }
  throw new Error('the server did not answer after 8 attempts');
}

const landscapes = [];
const versions = {};
const t0 = Date.now();
for (const seed of seeds) {
  const land = make(seed);
  const measure = (a, b) => {
    const value = land.f(a, b);
    return [a, b, value === null ? null : Math.round(value * 1000) / 1000];
  };
  const runs = {};
  for (const method of methods) {
    if (method === 'doe-lhs') {
      const answer = await ask({ space: SPACE, history: [], batch: MAX, goal: 'maximize', method });
      runs[method] = answer.proposals.map(({ params }) => measure(clamp(params.setting_a), clamp(params.setting_b)));
      versions[method] = `${answer.model} ${answer.version ?? ''}`.trim();
      continue;
    }
    const taken = [];
    for (let k = 0; k < MAX; k++) {
      const history = taken.map(([a, b, value]) => ({ params: { setting_a: a, setting_b: b }, value }));
      const answer = await ask({ space: SPACE, history, batch: 1, goal: 'maximize', method });
      const p = answer.proposals[0]?.params;
      if (!p) throw new Error(`seed ${seed} ${method}: no proposal at experiment ${k + 1}`);
      taken.push(measure(clamp(p.setting_a), clamp(p.setting_b)));
      versions[method] = `${answer.model} ${answer.version ?? ''}`.trim();
    }
    runs[method] = taken;
  }
  const best = Object.fromEntries(
    Object.entries(runs).map(([m, rs]) => [m, Math.max(...rs.map((r) => r[2] ?? -Infinity))]),
  );
  landscapes.push({ seed, top: land.best, runs });
  console.log(`seed ${seed}: top ${land.best}, best ${JSON.stringify(best)} (${Math.round((Date.now() - t0) / 1000)} s)`);
  /* Written after every landscape, so a cut-off job keeps what it has. */
  writeFileSync(
    out,
    JSON.stringify({ kind, recorded: new Date().toISOString(), source: useMock ? 'mock' : 'model server', versions, landscapes }) + '\n',
  );
}
