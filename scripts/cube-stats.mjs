// Statistics over the repeated cube runs, and the run each cube shows (founder, 15 Nov 2026).
//
//   node scripts/cube-stats.mjs
//
// Reads every run in content/release/cube-runs/estimate/runs/ (scripts/record-cube.mjs --estimate --run=K), and for
// each scramble and method:
//   - how many runs solved the cube within the budget, and the median experiments to solve over all runs (a run that
//     did not solve counts as more than the budget, so the median is null when half or more did not solve);
//   - the median run: the runs ranked by experiments to solve (unsolved after, by estimated moves left), the middle one
//     taken (the 10th of 20; with an odd count the exact middle). It is copied to cube-runs/estimate/seed-S-METHOD.json,
//     which the page plays, and index.json lists it with the statistics.
// Only scrambles with runs of every method are listed, and every method with the same number of runs.
import {
  copyFileSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";

/* const dir = new URL('../content/release/cube-runs/estimate/', import.meta.url); */
/* --dir=scramble-4-one (founder, 16 Nov 2026): the runs of one setup in their own folder under cube-runs/estimate/.
   --cases=3: each method's 3 middle runs instead of its one median (ranks 5, 6 and 7 of 11), written as
   seed-K-METHOD.json for K = 1..3 (the race plays case K as it played seed K: every method's K-th middle run side by
   side; the scramble comes from each run file). */
const opt = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const sub = opt("dir");
const cases = Number(opt("cases") ?? 1);
const dir = new URL(
  `../content/release/cube-runs/estimate/${sub ? `${sub}/` : ""}`,
  import.meta.url,
);
const METHODS = ["sdm-1", "bayesian-optimisation", "doe-lhs"];
const runs = readdirSync(new URL("runs/", dir))
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({
    file: f,
    run: JSON.parse(readFileSync(new URL(`runs/${f}`, dir), "utf8")),
  }));

const seeds = [...new Set(runs.map((r) => r.run.seed))].sort((a, b) => a - b);
const index = [];
const lines = [];
for (const seed of seeds) {
  const by = Object.fromEntries(
    METHODS.map((m) => [
      m,
      runs.filter((r) => r.run.seed === seed && r.run.config.method === m),
    ]),
  );
  /* --runs=10 (founder, 16 Nov 2026: 10 runs read more easily than 11): runs 1..10 of each method, the rest left out. */
  const cap = Number(opt('runs') ?? Infinity);
  const n = Math.min(cap, ...METHODS.map((m) => by[m].length));
  if (n === 0) continue;
  for (const method of METHODS) {
    /* The same runs for every method: run numbers 1..n where all have them. */
    const mine = by[method]
      .sort((a, b) => a.run.config.run - b.run.config.run)
      .slice(0, n);
    const budget = mine[0].run.config.solveCalls * mine[0].run.config.batch;
    const key = (r) =>
      r.summary.solved
        ? r.summary.solveExperiments
        : budget + 1 + r.summary.movesLeft;
    const ranked = mine
      .slice()
      .sort(
        (a, b) =>
          key(a.run) - key(b.run) || a.run.config.run - b.run.config.run,
      );
    const middle = ranked[Math.floor((ranked.length - 1) / 2)];
    /* The `cases` middle runs, the median among them (with 11 runs and 3 cases: ranks 5, 6, 7). */
    const lo = Math.max(0, Math.floor((ranked.length - cases) / 2));
    const picked = ranked.slice(lo, lo + cases);
    const keys = ranked.map((r) => key(r.run));
    const half = keys.length / 2;
    const medianKey =
      keys.length % 2
        ? keys[Math.floor(half)]
        : (keys[half - 1] + keys[half]) / 2;
    const solved = mine.filter((r) => r.run.summary.solved).length;
    const stats = {
      runs: n,
      solved,
      medianExperiments: medianKey <= budget ? medianKey : null,
      budget,
    };
    if (cases > 1) {
      picked.forEach((p, k) => {
        copyFileSync(
          new URL(`runs/${p.file}`, dir),
          new URL(`seed-${k + 1}-${method}.json`, dir),
        );
        const { model, version, recorded, summary, config } = p.run;
        index.push({
          seed: k + 1,
          scramble: seed,
          rank: lo + k + 1,
          method,
          run: config.run,
          model,
          version,
          recorded,
          solved: summary.solved,
          stats,
        });
      });
      lines.push(
        `scramble ${seed} ${method.padEnd(22)} solved ${String(solved).padStart(2)}/${n}, median ${stats.medianExperiments ?? `> ${budget}`}, ` +
          `shown: ${picked.map((p) => `run ${p.run.config.run} (${p.run.summary.solved ? `solved in ${p.run.summary.solveExperiments}` : `${p.run.summary.movesLeft} left`})`).join(", ")}`,
      );
      continue;
    }
    copyFileSync(
      new URL(`runs/${middle.file}`, dir),
      new URL(`seed-${seed}-${method}.json`, dir),
    );
    const { model, version, recorded, summary, config } = middle.run;
    index.push({
      seed,
      method,
      run: config.run,
      model,
      version,
      recorded,
      solved: summary.solved,
      stats,
    });
    lines.push(
      `scramble ${seed} ${method.padEnd(22)} solved ${String(solved).padStart(2)}/${n}, median ${stats.medianExperiments ?? `> ${budget}`}, ` +
        `shown: run ${config.run} (${summary.solved ? `solved in ${summary.solveExperiments}` : `${summary.movesLeft} left`})`,
    );
  }
}
writeFileSync(
  new URL("index.json", dir),
  `${JSON.stringify(index, null, 2)}\n`,
);
console.log(lines.join("\n"));
