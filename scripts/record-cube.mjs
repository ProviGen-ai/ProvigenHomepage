// Records the release page's cube runs, or checks the stored ones (13 Nov 2026).
//
//   npm run record:cube   ask the model for five runs (seeds 1-5) and store them
//   npm run check:cube    replay every stored run and fail if one no longer
//                         ends where it was recorded (after a change to
//                         components/release/cube/solve.ts or cube.ts)
//
// Recording asks the model at SDM_RECORD_API (base URL, the routes of
// lib/sdm/contract.ts, e.g. https://<api-id>.execute-api.eu-west-1.amazonaws.com/live),
// with SDM_RECORD_KEY sent as "Authorization: Bearer <key>" (the dev secret,
// per agent-002's API design). Both are read here only, on the machine that
// records, and never reach the page.
// Without SDM_RECORD_API it records the page's mock (lib/sdm/mock.ts): the
// runs then say model "mock" and the published page does not show the cube.
//
// Runs land in content/release/cube-runs/ (seed-N.json and index.json); see
// components/release/cube/recording.ts for the format.
import { build } from "esbuild";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
/* --direct (14 Nov 2026): the one-level runs (no discovery; solve.ts, solveDirect), stored in cube-runs/direct/. */
const direct = process.argv.includes("--direct");
/* --estimate (15 Nov 2026): the race by estimated moves remaining (solve.ts, solveEstimate), stored in
   cube-runs/estimate/. Each experiment's readout comes from scripts/cube-pdb.mjs and is stored with the run.
   --check --estimate --verify also measures every stored readout again (builds the tables, about 15 s). */
const estimate = process.argv.includes("--estimate");
const verify = process.argv.includes("--verify");
const race = direct || estimate;
/* --dir=scramble-4-one (16 Nov 2026): with --estimate, a setup's runs in their own folder under cube-runs/estimate/. */
const estimateDir = process.argv
  .find((a) => a.startsWith("--dir="))
  ?.split("=")[1];
const out = new URL(
  estimate
    ? `../content/release/cube-runs/estimate/${estimateDir ? `${estimateDir}/` : ""}`
    : direct
      ? "../content/release/cube-runs/direct/"
      : "../content/release/cube-runs/",
  import.meta.url,
);
const check = process.argv.includes("--check");
/* One cube at a time (founder, 14 Nov 2026: pre-record the cube, a way to get a single cube fully saved):
     --seed=3            only this seed (or --seed=1,4)
     --method=sdm-1      only this method of the race (or a comma list)
   Those runs are written and replace their entries in index.json; every other stored run and entry stays.
   SDM_RECORD_API may be a local model server (e.g. http://127.0.0.1:8091, BiofoundryDemo's sdm1_gpu_server run on
   this machine), so pre-recording needs no calls to the online API. */
const arg = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const onlySeeds = arg("seed")?.split(",").map(Number);
const onlyMethods = arg("method")?.split(",");
/* To try settings before they go into announcement.json's cube_demo: --scramble=5 (moves), --calls=120 (solve calls). */
const scrambleOverride = arg("scramble") ? Number(arg("scramble")) : undefined;
const callsOverride = arg("calls") ? Number(arg("calls")) : undefined;
/* --estimate --run=K (founder, 15 Nov 2026: 20 runs per scramble, the median shown): run K lists the moves in its own
   seeded order (solve.ts, estimateSpace), the same for every method. Written to cube-runs/estimate/runs/
   seed-S-METHOD-run-K.json, with no index; scripts/cube-stats.mjs then picks each median run and writes the index. */
const runNumber = arg("run") ? Number(arg("run")) : undefined;
if (runNumber !== undefined && !estimate)
  throw new Error("--run is for --estimate runs");

/* The cube's modules are TypeScript with the @/ alias: bundle them for node. */
const bundle = await build({
  stdin: {
    contents: `
      export * from './components/release/cube/recording.ts';
      export { solved, applyMove, applyMoves, MOVES } from './components/release/cube/cube.ts';
      export { estimateMoves, ESTIMATE_SPACE, estimateSpace } from './components/release/cube/solve.ts';
      export { mockPropose } from './lib/sdm/mock.ts';
      export { PUBLIC_LIMITS } from './lib/sdm/contract.ts';
      export { cubeDemo } from './content/release/index.ts';
    `,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  logLevel: "error",
});
const lib = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/* A seeded Fisher-Yates shuffle (the run's order of the moves). */
const shuffled = (items, random) => {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
/* The readout tables, built (or read from node_modules/.cache) only when needed. */
let pdb;
const pdbMeasure = async () =>
  (pdb ??= (await import("./cube-pdb.mjs")).makeMeasure(lib));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function replays(run) {
  const summary = await lib.campaign(
    run.config,
    run.scramble,
    lib.replayer(run, false),
    run.config.mode === "estimate" ? lib.recordedMeasure(run) : undefined,
  );
  return { ok: same(summary, run.summary), summary };
}

/* --verify: every stored readout measured again on the cube it was taken on (any variant: the run is replayed and each
   experiment's cube measured afresh). */
async function readoutsHold(run) {
  const pdbNow = await pdbMeasure();
  const recorded = lib.recordedMeasure(run);
  let held = true;
  await lib.campaign(
    run.config,
    run.scramble,
    lib.replayer(run, false),
    (call, k, after, along) => {
      const r = recorded(call, k, after, along);
      // if (!same(pdbNow(after), r)) held = false;
      if (!along) {
        if (!same(pdbNow(after), r)) held = false;
        return r;
      }
      /* Prefix credit (16 Nov 2026): the readout is the sequence's best state, [estimate, distance, prefix length]. It must
       be that state's measure, and no state the sequence reaches (one move or more; the start does not count) may score
       lower on estimate + distance / 100. */
      const start = lib.applyMoves(lib.solved(), run.scramble);
      const states = [start, ...along];
      const at = r[2] ?? along.length;
      const [h, d] = pdbNow(states[at]);
      if (h !== r[0] || d !== r[1]) held = false;
      if (
        along.some((c) => {
          const [hh, dd] = pdbNow(c);
          return hh + dd / 100 < h + d / 100;
        })
      )
        held = false;
      return r;
    },
  );
  return held;
}

if (check) {
  const index = JSON.parse(readFileSync(new URL("index.json", out), "utf8"));
  let failed = 0;
  /* The runs shown (from the index), and with --estimate every repeated run in runs/. */
  const files = index.map(
    ({ seed, method }) =>
      new URL(
        method ? `seed-${seed}-${method}.json` : `seed-${seed}.json`,
        out,
      ),
  );
  if (estimate && existsSync(new URL("runs/", out)))
    files.push(
      ...readdirSync(new URL("runs/", out))
        .filter((f) => f.endsWith(".json"))
        .sort()
        .map((f) => new URL(`runs/${f}`, out)),
    );
  for (const file of files) {
    const run = JSON.parse(readFileSync(file, "utf8"));
    const {
      seed,
      config: { method },
    } = run;
    const { ok: replayed, summary } = await replays(run);
    const ok =
      replayed &&
      (!verify || run.config.mode !== "estimate" || (await readoutsHold(run)));
    console.log(
      `seed ${seed}${method ? ` ${method}` : ""}${run.config.run ? ` run ${run.config.run}` : ""} (${run.model}): ${ok ? "replays as recorded" : "DIFFERS"}`,
    );
    if (!ok) {
      failed += 1;
      console.log("  recorded:", JSON.stringify(run.summary));
      console.log("  replayed:", JSON.stringify(summary));
    }
  }
  if (failed) {
    console.error(
      `${failed} run(s) no longer replay as recorded: record them again (npm run record:cube).`,
    );
    process.exit(1);
  }
  process.exit(0);
}

const base = (process.env.SDM_RECORD_API ?? "").replace(/\/$/, "");
const key = process.env.SDM_RECORD_KEY;
if (!base)
  console.warn(
    "SDM_RECORD_API is not set: recording the mock. The published page shows the cube only for runs of the model.",
  );

/* The same trimming the page's client applies (lib/sdm/client.ts), so the model sees what it would have seen live. */
const trim = (request) => ({
  ...request,
  history: request.history.slice(-lib.PUBLIC_LIMITS.maxHistory),
  batch: Math.min(request.batch, lib.PUBLIC_LIMITS.maxBatch),
});

async function live(request) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const response = await fetch(`${base}/v1/propose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify(trim(request)),
      signal: AbortSignal.timeout(120000),
    });
    if (response.status === 429 || response.status === 503) {
      const body = await response.json().catch(() => null);
      const wait =
        body?.retry_after_s ??
        (Number(response.headers.get("Retry-After")) || 30);
      console.warn(`  ${response.status}, retrying in ${wait}s`);
      await sleep(wait * 1000);
      continue;
    }
    if (!response.ok)
      throw new Error(
        `model answered ${response.status}: ${await response.text()}`,
      );
    return response.json();
  }
  throw new Error("model kept answering 429/503");
}

async function mock(request) {
  const answer = await lib.mockPropose(trim(request));
  if ("status" in answer) throw new Error(`mock answered ${answer.status}`);
  return answer;
}

/* One call per line keeps the files diffable. */
const format = (run) => {
  const { calls, ...head } = run;
  const top = JSON.stringify(head, null, 2).replace(/\n}$/, "");
  return `${top},\n  "calls": [\n${calls.map((c) => `    ${JSON.stringify(c)}`).join(",\n")}\n  ]\n}\n`;
};

const config = estimate
  ? {
      mode: "estimate",
      /* Tested 15 Nov 2026 on the local model server: at 5 moves SDM-1 solved 5 of 5 scrambles within 480
         experiments, at 8 moves no method solved one. */
      scrambleDepth: 5,
      discoverCalls: 0,
      solveCalls: 60,
      batch: lib.cubeDemo.batch,
      keep: 0,
    }
  : direct
    ? {
        mode: "direct",
        scrambleDepth: lib.cubeDemo.scramble_depth,
        discoverCalls: 0,
        /* The calls discovery would have made go to solving. */
        solveCalls: lib.cubeDemo.discover_calls + lib.cubeDemo.solve_calls,
        batch: lib.cubeDemo.batch,
        keep: 0,
      }
    : {
        scrambleDepth: lib.cubeDemo.scramble_depth,
        discoverCalls: lib.cubeDemo.discover_calls,
        solveCalls: lib.cubeDemo.solve_calls,
        batch: lib.cubeDemo.batch,
        keep: lib.cubeDemo.keep,
      };
if (scrambleOverride) config.scrambleDepth = scrambleOverride;
if (callsOverride) config.solveCalls = callsOverride;
mkdirSync(out, { recursive: true });
/* With --seed or --method, keep the stored entries of every run not recorded now. */
const partial = Boolean(onlySeeds || onlyMethods);
const index =
  partial && existsSync(new URL("index.json", out))
    ? JSON.parse(readFileSync(new URL("index.json", out), "utf8"))
    : [];
/* --direct records the race: every method on each seed's scramble, the same campaign and results for each. */
const jobs = lib.SEEDS.flatMap((seed) =>
  race
    ? lib.RACE_METHODS.map((method) => ({ seed, method }))
    : [{ seed, method: undefined }],
).filter(
  (j) =>
    (!onlySeeds || onlySeeds.includes(j.seed)) &&
    (!onlyMethods || onlyMethods.includes(j.method)),
);
if (!jobs.length) throw new Error("no run matches --seed / --method");
for (const { seed, method } of jobs) {
  const rec = lib.recorder(base ? live : mock);
  const moves = lib.scrambleFor(seed, config.scrambleDepth);
  // const runConfig = method ? { ...config, method } : config;
  const runConfig = {
    ...config,
    ...(method ? { method } : {}),
    ...(runNumber !== undefined
      ? {
          run: runNumber,
          choices: shuffled(lib.MOVES, lib.seeded(runNumber * 7919)),
          accept: "estimate",
        }
      : {}),
  };
  /* Estimate runs: measure each experiment and keep the readout with its call (k = -1: the scramble itself). */
  let start;
  const measure = estimate
    ? async (call, k, after) => {
        const r = (await pdbMeasure())(after);
        if (k < 0) start = r;
        else (rec.calls[call].r ??= [])[k] = r;
        return r;
      }
    : undefined;
  const summary = await lib.campaign(runConfig, moves, rec.ask, measure);
  const { model, version } = rec.meta();
  const run = {
    seed,
    model,
    version,
    recorded: new Date().toISOString().slice(0, 10),
    config: runConfig,
    scramble: moves,
    ...(estimate ? { start } : {}),
    summary,
    calls: rec.calls,
  };
  const { ok } = await replays(run);
  if (!ok)
    throw new Error(
      `seed ${seed}: the recording does not replay as it ran (is the solver deterministic?)`,
    );
  if (runNumber !== undefined) {
    mkdirSync(new URL("runs/", out), { recursive: true });
    writeFileSync(
      new URL(`runs/seed-${seed}-${method}-run-${runNumber}.json`, out),
      format(run),
    );
    console.log(
      `seed ${seed} ${method} run ${runNumber}: ${summary.solved ? `solved in ${summary.solveExperiments}` : `${summary.movesLeft} moves left after ${summary.solveExperiments}`}`,
    );
    continue;
  }
  writeFileSync(
    new URL(method ? `seed-${seed}-${method}.json` : `seed-${seed}.json`, out),
    format(run),
  );
  const entry = {
    seed,
    ...(method ? { method } : {}),
    model,
    version,
    recorded: run.recorded,
    solved: summary.solved,
  };
  const at = index.findIndex((e) => e.seed === seed && e.method === method);
  if (at >= 0) index[at] = entry;
  else index.push(entry);
  console.log(
    `seed ${seed}${method ? ` ${method}` : ""}: ${rec.calls.length} calls, ${summary.discoverExperiments} + ${summary.solveExperiments} experiments, ` +
      `${summary.solved ? "solved" : estimate ? `${summary.movesLeft} moves left (estimated)` : `${summary.solvedPieces}/20 pieces`}${race ? `, ${summary.moves} moves` : ""} (${model} ${version})`,
  );
}
if (runNumber === undefined)
  writeFileSync(
    new URL("index.json", out),
    `${JSON.stringify(index, null, 2)}\n`,
  );
