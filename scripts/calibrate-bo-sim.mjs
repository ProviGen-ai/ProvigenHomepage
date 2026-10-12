// Calibrates the closed-loop simulation (components/writings/bo-sim/model.ts):
// runs the exact model the figure runs on many seeds and reports, for twenty
// experiments planned up front and twenty chosen one at a time, the best true
// value after k experiments (median and interquartile range), how often the
// chosen ones end lower, and the gap the figure's strip draws: the difference
// of log10(best after 20) between the two. It then picks the figure's first
// seed: the one whose gap is closest to the median gap (typical, not
// cherry-picked; among the seeds within 0.02 decades of it, the one whose
// staircases stay closest to the median staircases throughout). Paste the
// result into BoSim.tsx's header and set SEED in model.ts.
//
// The seeds are the sequence the figure itself walks ("Run again" and each
// new cycle call nextSeed), starting from --base, so the runs a visitor sees
// after the first are in the calibrated set too.
//
// usage: node scripts/calibrate-bo-sim.mjs [--seeds=200] [--base=20261003] [--sensitivity] [--verbose]
// (Node 22.18+ strips the TypeScript types of model.ts on import.)
import {
  F_STAR,
  N,
  N_START,
  NOISE,
  NOISE_SD,
  SEED,
  nextSeed,
  simulate,
} from '../components/writings/bo-sim/model.ts';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.slice(hit.indexOf('=') + 1) : true;
};
const count = Number(flag('seeds', 200));
const base = Number(flag('base', 20261003)) >>> 0;
const sensitivity = Boolean(flag('sensitivity', false));
const verbose = Boolean(flag('verbose', false));
if (count < 100) console.warn(`warning: ${count} seeds; the figure's record is based on at least 100`);

const walk = (from, n) => {
  const out = [from];
  while (out.length < n) out.push(nextSeed(out[out.length - 1]));
  return out;
};
const quantile = (values, p) => {
  const s = [...values].sort((a, b) => a - b);
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
};
const median = (v) => quantile(v, 0.5);
const iqr = (v, d = 2) => `${quantile(v, 0.25).toFixed(d)}–${quantile(v, 0.75).toFixed(d)}`;
/** Share of `values` at or below v. */
const rank = (values, v) => values.filter((x) => x <= v).length / values.length;
const pct = (v) => `${(v * 100).toFixed(0)} %`;

/** All runs for a list of seeds, with the per-run numbers the report needs. */
function runAll(seeds, noise = NOISE) {
  return seeds.map((seed) => {
    const r = simulate(seed, { fog: false, noise });
    let edge = 0;
    let repeat = 0;
    for (let i = N_START; i < N; i++) {
      const u1 = r.chosen[2 * i];
      const u2 = r.chosen[2 * i + 1];
      if (u1 <= 1e-9 || u1 >= 1 - 1e-9 || u2 <= 1e-9 || u2 >= 1 - 1e-9) edge++;
      // within 0.3 units of the 15-unit domain of an earlier experiment
      for (let j = 0; j < i; j++) {
        if (Math.hypot(u1 - r.chosen[2 * j], u2 - r.chosen[2 * j + 1]) < 0.02) {
          repeat++;
          break;
        }
      }
    }
    const planned = r.bestPlanned[N - 1];
    const chosen = r.bestChosen[N - 1];
    return {
      seed,
      bestPlanned: Array.from(r.bestPlanned),
      bestChosen: Array.from(r.bestChosen),
      planned,
      chosen,
      gap: Math.log10(planned) - Math.log10(chosen),
      edge,
      repeat,
    };
  });
}

const seeds = walk(base, count);
const t0 = performance.now();
const runs = runAll(seeds);
const ms = (performance.now() - t0) / runs.length;

console.log(
  `Branin, ${N} experiments per strategy (${N_START} to start), noise sd ${NOISE_SD.toFixed(2)} (${NOISE * 100} % of the range) · ${count} seeds from ${base} · ${ms.toFixed(0)} ms per run`,
);

/* best true value after k experiments */
const ks = [1, 3, 5, 10, 15, 20];
console.table(
  ks.map((k) => {
    const p = runs.map((r) => r.bestPlanned[k - 1]);
    const c = runs.map((r) => r.bestChosen[k - 1]);
    return {
      'after k': k,
      'planned median': +median(p).toFixed(2),
      'planned IQR': iqr(p),
      'chosen median': +median(c).toFixed(2),
      'chosen IQR': iqr(c),
      'chosen lower': pct(runs.filter((r) => r.bestChosen[k - 1] < r.bestPlanned[k - 1]).length / runs.length),
    };
  }),
);

const P = runs.map((r) => r.planned);
const C = runs.map((r) => r.chosen);
const G = runs.map((r) => r.gap);
const medGap = median(G);
const picks = runs.length * (N - N_START);
console.log(`best after ${N}: planned median ${median(P).toFixed(2)} (IQR ${iqr(P)}), chosen median ${median(C).toFixed(2)} (IQR ${iqr(C)}); optimum ${F_STAR.toFixed(3)}`);
console.log(`chosen ends lower in ${pct(runs.filter((r) => r.chosen < r.planned).length / runs.length)} of seeds`);
console.log(`gap drawn by the strip, log10(planned) − log10(chosen): median ${medGap.toFixed(3)} (IQR ${iqr(G, 3)})`);
console.log(
  `model picks on the domain's edge ${pct(runs.reduce((a, r) => a + r.edge, 0) / picks)}, within 0.3 units of an earlier experiment ${pct(runs.reduce((a, r) => a + r.repeat, 0) / picks)}`,
);

/*
 * The figure's first seed: closest to the median gap after 20. The strip
 * shows the whole climb, not only its end, so among the seeds within 0.02
 * decades of that (the same gap, to the eye) the tie goes to the run whose
 * two staircases stay closest to the median staircases at every k (mean
 * absolute distance in decades of log10 best so far). 3 Oct 2026, 200
 * seeds: eight seeds in the band, and the closest staircases (0.141; next
 * 0.143) belong to the seed the endpoint alone picks, so both readings of
 * "typical" agree.
 */
const medianTrack = (key) =>
  Array.from({ length: N }, (_, k) => median(runs.map((r) => Math.log10(r[key][k]))));
const trackP = medianTrack('bestPlanned');
const trackC = medianTrack('bestChosen');
const typicality = (r) => {
  let d = 0;
  for (let k = 0; k < N; k++) {
    d += Math.abs(Math.log10(r.bestPlanned[k]) - trackP[k]) + Math.abs(Math.log10(r.bestChosen[k]) - trackC[k]);
  }
  return d / (2 * N);
};
const ranked = runs
  .map((r, i) => ({ r, i, off: Math.abs(r.gap - medGap), typical: typicality(r) }))
  .sort((a, b) => a.off - b.off);
const near = ranked.filter((x) => x.off <= 0.02).sort((a, b) => a.typical - b.typical);
const pick = near[0] ?? ranked[0];
console.log(
  `${near.length} seeds within 0.02 decades of the median gap; their distance from the median staircases: ${near
    .map((x) => x.typical.toFixed(3))
    .join(' ')}`,
);
console.log(
  `default seed ${pick.r.seed} (walk step ${pick.i}): planned ${pick.r.planned.toFixed(2)} (rank ${pct(rank(P, pick.r.planned))}), chosen ${pick.r.chosen.toFixed(2)} (rank ${pct(rank(C, pick.r.chosen))}), gap ${pick.r.gap.toFixed(3)} against the median ${medGap.toFixed(3)}`,
);
console.log(
  `  its best so far, planned: ${pick.r.bestPlanned.map((v) => v.toFixed(1)).join(' ')}\n  its best so far, chosen:  ${pick.r.bestChosen.map((v) => v.toFixed(1)).join(' ')}`,
);
if (pick.r.seed !== SEED) console.log(`→ set SEED = ${pick.r.seed} in model.ts (now ${SEED})`);
else console.log('SEED in model.ts is this seed');

if (verbose) {
  console.table(runs.map((r) => ({ seed: r.seed, planned: +r.planned.toFixed(3), chosen: +r.chosen.toFixed(3), gap: +r.gap.toFixed(3) })));
}

/* how the comparison moves with the noise (the figure uses NOISE) */
if (sensitivity) {
  const sub = seeds.slice(0, 100);
  console.table(
    [0, 0.005, 0.01, NOISE, 0.03, 0.05].map((noise) => {
      const rs = runAll(sub, noise);
      const p = rs.map((r) => r.planned);
      const c = rs.map((r) => r.chosen);
      return {
        'noise, share of range': noise,
        'planned median': +median(p).toFixed(2),
        'chosen median': +median(c).toFixed(2),
        'chosen IQR': iqr(c),
        'chosen lower': pct(rs.filter((r) => r.chosen < r.planned).length / rs.length),
        'median gap (log10)': +median(rs.map((r) => r.gap)).toFixed(3),
      };
    }),
  );
}
