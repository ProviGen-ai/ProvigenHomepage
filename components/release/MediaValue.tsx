import data from "@/content/release/media-value.json";

/*
 * Use Case #2 (founder, 17 Nov 2026: as Use Case #1, on the other life-science data; the user cleared the two media
 * sets, T cell and TF-1, and chose T cell). Kim and Audet's search for a primary T-cell expansion medium against SDM-1
 * on the same 535 formulations. Laid out as CfeValue (the same classes): the two-line headline, the plot, the figures,
 * the footnote.
 *
 * Measured (scripts/make-media-value.py -> content/release/media-value.json): Kim and Audet ran their search in
 * generations; a top-1% formulation first appears in generation 3. Their order within a generation is not recorded,
 * so their count is a lower bound: the 211 formulations of generations 1 and 2, plus one (at most 298). SDM-1, 10
 * campaigns from 10 random formulations each, reached one in all 10, a median of 27.5 experiments (shown as 28).
 * Bayesian optimization (10 of 10, median 36.5) and random (2 of 10) stay in the data, not shown, as on Use Case #1.
 * The caveat the user's clearance came with is in the footnote: these data were selected, with TF-1, from the study's
 * six by a coverage rule fixed before any score, and both come from one group's study.
 */

const GROUP = "Kim and Audet";
const BENCH_URL = "https://doi.org/10.5281/zenodo.21501659";
const lab = data.lab;
const sdm = data.sdm1;
const labCount = lab.first_top1_at_least;
const sdmCount = Math.round(sdm.median_first_top1);
const fewer = 1 - sdm.median_first_top1 / labCount;

/* The plot, as Use Case #1's (founder, 17 Nov 2026: "plot looks broken"; it ran to the end of generation 3 at 298 with
   that generation's dots and band, the lab line rose near the top at 211 before they had a top-1% formulation, and
   SDM-1's line ran on past its hit). Now the axis ends at the lab's count (212): their formulations of generations 1 and
   2 (spread across each generation's span; the order within one is not recorded), their best so far stepping at each
   generation's end, then up into the top 1% at 212 (the lower bound the headline states), ringed. SDM-1's typical
   campaign up to its first top-1% formulation, ringed. The previous version: scratchpad MediaValue.before-plot-redo.tsx. */
const W = 560;
const H = 250;
const M = { l: 40, r: 12, t: 10, b: 30 };
const X_MAX = labCount;
const x = (e: number) => M.l + (e / X_MAX) * (W - M.l - M.r);
const y = (v: number) => H - M.b - (Math.max(0, v) / 100) * (H - M.t - M.b);
const threshold = data.pool.top1_threshold;
/* Generations 1 and 2, each across its span on the x axis. */
const before = lab.generations.filter((g) => g.gen < lab.first_top1_generation);
const spans = before.reduce<{ start: number; end: number; points: number[] }[]>(
  (acc, g) => {
    const start = acc.length ? acc[acc.length - 1].end : 0;
    return [...acc, { start, end: start + g.new, points: g.points }];
  },
  [],
);
const labEnd = spans[spans.length - 1].end;
/* Was: the line stepping only at the end of each generation (17 Nov 2026):
( Their best so far, known at the end of each generation; at 212 into the top 1%. )
const labSteps = spans.reduce<number[]>(
  (acc, s) => [
    ...acc,
    Math.max(acc.length ? acc[acc.length - 1] : 0, ...s.points),
  ],
  [],
);
const labStair = (() => {
  let d = `M${x(spans[0].end).toFixed(1)},${y(labSteps[0]).toFixed(1)}`;
  spans.slice(1).forEach((s, k) => {
    d += ` H${x(s.end).toFixed(1)} V${y(labSteps[k + 1]).toFixed(1)}`;
  });
  return `${d} H${x(labCount).toFixed(1)} V${y(threshold).toFixed(1)}`;
})();
*/
/* Their best so far through the dots, from 0, as Use Case #1's line (founder, 17 Nov 2026: "plot still looks broken"; the
   line stepping only at each generation's end began in mid-air at 118). The dots keep a fixed order within each
   generation, their tested order there not being recorded; at 212 into the top 1%. */
const labXs = spans.flatMap((sp) =>
  sp.points.map(
    (_, i) => sp.start + ((i + 0.5) / sp.points.length) * (sp.end - sp.start),
  ),
);
const labYs = spans.flatMap((sp) => sp.points);
const labSteps = [Math.max(...spans[0].points)];
const labStair = (() => {
  let d = `M${x(0).toFixed(1)},${y(0).toFixed(1)}`;
  let last = 0;
  labYs.forEach((v, i) => {
    if (v > last) {
      d += ` H${x(labXs[i]).toFixed(1)} V${y(v).toFixed(1)}`;
      last = v;
    }
  });
  return `${d} H${x(labCount).toFixed(1)} V${y(threshold).toFixed(1)}`;
})();
/* SDM-1's campaign up to its first top-1% formulation. */
const sdmHit = sdm.shown.first_top1;
const sdmPoints = sdm.shown.points.slice(0, sdmHit);
const sdmBest = sdm.shown.best.slice(0, sdmHit);
const sdmStair = (() => {
  let d = `M${x(0).toFixed(1)},${y(0).toFixed(1)}`;
  let last = 0;
  sdmBest.forEach((v, i) => {
    if (v !== last) d += ` H${x(i + 1).toFixed(1)} V${y(v).toFixed(1)}`;
    last = v;
  });
  return d;
})();
const xTicks = [0, 50, 100, 150, X_MAX];

export default function MediaValue({ modelName }: { modelName: string }) {
  return (
    <div className="r-cfe r-cfe--media">
      <p className="r-show-claim">
        <span className="r-cfe-line">
          {/* Was "needed at least {labCount}" (founder, 17 Nov 2026: "at least" reads badly; ">"): more than the 211 they
              ran in generations 1 and 2 without a top-1% formulation. */}
          {GROUP} needed &gt;{labCount - 1} experiments.
        </span>{" "}
        <span className="r-cfe-punch">
          {modelName} would’ve needed {sdmCount}.
        </span>
      </p>

      <figure className="r-cfe-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="r-media-plot-title"
        >
          <title id="r-media-plot-title">
            {`T-cell expansion of the formulations ${GROUP} tested in their first ${lab.first_top1_generation - 1} generations, and their best so far: they reach the top 1% in generation ${lab.first_top1_generation}, after more than ${labCount - 1} experiments. A typical ${modelName} campaign on the same formulations reaches it after ${sdmHit}.`}
          </title>
          <line
            x1={M.l}
            x2={W - M.r}
            y1={y(0)}
            y2={y(0)}
            className="r-cfe-grid"
          />
          {[0, 50, 100].map((v) => (
            <text
              key={v}
              x={M.l - 7}
              y={y(v) + 3.5}
              className="r-cfe-tick"
              textAnchor="end"
            >
              {v}
            </text>
          ))}
          {xTicks.map((e) => (
            <text
              key={e}
              x={x(e)}
              y={H - M.b + 16}
              className="r-cfe-tick"
              textAnchor={e === X_MAX ? "end" : "middle"}
            >
              {e}
            </text>
          ))}
          <rect
            x={M.l}
            y={y(100)}
            width={W - M.l - M.r}
            height={y(threshold) - y(100)}
            className="r-cfe-top"
          />
          <text
            x={x(X_MAX * 0.5)}
            y={(y(100) + y(threshold)) / 2 + 4}
            className="r-cfe-note"
            textAnchor="middle"
          >
            Top 1%
          </text>
          {spans.flatMap((sp, k) =>
            sp.points.map((v, i) => (
              <circle
                key={`l${k}-${i}`}
                cx={x(
                  sp.start +
                    ((i + 0.5) / sp.points.length) * (sp.end - sp.start),
                )}
                cy={y(v)}
                r={1.2}
                className="r-cfe-dot"
              />
            )),
          )}
          {sdmPoints.map((v, i) => (
            <circle
              key={`s${i}`}
              cx={x(i + 1)}
              cy={y(v)}
              r={1.5}
              className="r-cfe-dot r-cfe-dot--sdm"
            />
          ))}
          <path d={labStair} className="r-cfe-lab" />
          <path d={sdmStair} className="r-cfe-sdm" />
          <circle
            cx={x(labCount)}
            cy={y(threshold)}
            r={3.2}
            className="r-cfe-hit"
          />
          <circle
            cx={x(sdmHit)}
            cy={y(sdmBest[sdmHit - 1])}
            r={3.2}
            className="r-cfe-hit r-cfe-hit--sdm"
          />
          <text
            x={x(labEnd) - 8}
            y={y(labSteps[0]) - 9}
            className="r-cfe-label"
            textAnchor="end"
          >
            {GROUP}
          </text>
          <text
            x={x(sdmHit) + 10}
            y={y(sdmBest[sdmHit - 1]) + 14}
            className="r-cfe-label r-cfe-label--sdm"
          >
            {modelName}
          </text>
          <text
            x={(M.l + W - M.r) / 2}
            y={H - 2}
            className="r-cfe-axis"
            textAnchor="middle"
          >
            Experiments
          </text>
          <text
            x={10}
            y={(M.t + H - M.b) / 2}
            className="r-cfe-axis"
            textAnchor="middle"
            transform={`rotate(-90 10 ${(M.t + H - M.b) / 2})`}
          >
            T-cell expansion (0–100)
          </text>
        </svg>
        <figcaption className="r-cfe-legend">
          <span className="r-cfe-key r-cfe-key--sdm">{modelName}</span>
          <span className="r-cfe-key r-cfe-key--lab">{GROUP}</span>
        </figcaption>
      </figure>

      <dl className="r-cfe-figures">
        <div>
          <dt>{Math.floor(fewer * 100)}%</dt>
          <dd>fewer experiments</dd>
        </div>
        <div>
          <dt>
            {sdm.reached} / {sdm.campaigns}
          </dt>
          <dd>campaigns reached the top 1%</dd>
        </div>
      </dl>

      {/* Three short lines (founder, 17 Nov 2026: cleaner). Was four: the source; the generations and their order; how
          SDM-1 chose, one at a time, in experiments; the selection of the data. Each point is kept, said shorter. */}
      <p className="r-cfe-foot">
        Dataset based on: {GROUP}, Communications Biology 2019, via{" "}
        <a href={BENCH_URL} target="_blank" rel="noopener noreferrer">
          Parsaee et al., Bioinformatics 2026
        </a>
        .
        <br />
        {GROUP} tested in generations; counted to the start of generation{" "}
        {lab.first_top1_generation}, in which they first reached the top 1%.
        <br />
        {modelName} chose one formulation at a time from the{" "}
        {data.pool.formulations} they tested (median of {sdm.campaigns} runs).
        {/* "One of two cell-culture datasets selected from the study's six, both from one group." (founder,
            17 Nov 2026: removed) */}
      </p>
    </div>
  );
}
