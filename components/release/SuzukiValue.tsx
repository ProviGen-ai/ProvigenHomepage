import data from "@/content/release/suzuki-value.json";

/*
 * Use Case #2 (the user, through biofoundrydemo-ai-b9, 17 Nov 2026): a Suzuki coupling on Pfizer's flow robot.
 *
 * The story is the robot and SDM-1 together, never one instead of the other: Pfizer's chemists chose the options and
 * their robot measured every combination, and that complete map lets SDM-1 be replayed as if it had been driving the
 * robot in a closed loop. Five conditions a round, each answered with Pfizer's own measurement, so every number on the
 * card is a real reading.
 *
 * Deliberately not here, on the model team's instruction and the user's rules:
 *   - no "Pfizer needed 3,696 experiments", no experiments-saved share, no comparison with their four days: they
 *     mapped the whole reaction, which SDM-1 does not produce;
 *   - no Bayesian optimization or random search, which stay in the benchmark table;
 *   - no months or money, which would need assumptions about a robot's round time and cost per run that only the user
 *     can give.
 */

const GROUP = "Pfizer";
const PAPER_URL = "https://doi.org/10.1126/science.aap9112";

/* The plot: experiments against yield, as Use Case #1's. The highlighted replay's own experiments as dots and its best
   so far as a step line; the other 29 replays' best so far faint behind it; the top-1% band; and the yields of all
   3,696 measured conditions as a histogram against the right edge. */
const W = 560;
const H = 250;
/* t: room above the top-1% field for its label (the user, 17 Nov 2026); was 10. */
/* r: no histogram column since the screen is drawn as dots in the plot (the user, 17 Nov 2026); was 74. */
/* t: room above the top-1% field for its label and for the model's, which stands over the circled experiment
   (the user, 17 Nov 2026); was 24. */
const M = { l: 40, r: 16, t: 44, b: 30 };
/* The whole screen on the axis, logarithmically (the user, 17 Nov 2026): SDM-1's experiments on the left, the 3,696
   conditions the robot measured at the far end, where their yields are drawn. Was linear, 0 to 50. */
const X_MAX = data.conditions;
const x = (e: number) =>
  M.l + (Math.log10(Math.max(1, e)) / Math.log10(X_MAX)) * (W - M.l - M.r);
const y = (v: number) => H - M.b - (Math.max(0, v) / 100) * (H - M.t - M.b);
/* On a log axis the first experiment is the left edge, so a line starts there, not at 0. */
const stair = (values: number[]) => {
  let d = `M${x(1).toFixed(1)},${y(values[0]).toFixed(1)}`;
  let last = values[0];
  values.forEach((v, i) => {
    if (v !== last) d += ` H${x(i + 1).toFixed(1)} V${y(v).toFixed(1)}`;
    last = v;
  });
  return `${d} H${x(values.length).toFixed(1)}`;
};
const highlight = data.highlight;
/* The replays as one band, not 29 lines (the user, 17 Nov 2026: the traces cluttered the plot): the middle half of
   them, the 25th to the 75th percentile of the best so far at each experiment, stepped like the lines it replaces. */
const BAND = (() => {
  const at = (i: number, q: number) => {
    const column = data.best_so_far.map((run) => run[i]).sort((a, b) => a - b);
    const k = (column.length - 1) * q;
    const lo = Math.floor(k);
    return column[lo] + (column[Math.ceil(k)] - column[lo]) * (k - lo);
  };
  const steps = (q: number) =>
    Array.from({ length: data.budget }, (_, i) => at(i, q));
  const high = steps(0.75);
  const low = steps(0.25);
  let d = `M${x(1).toFixed(1)},${y(high[0]).toFixed(1)}`;
  high.forEach((v, i) => {
    d += ` H${x(i + 1).toFixed(1)} V${y(v).toFixed(1)}`;
  });
  for (let i = low.length - 1; i >= 1; i--)
    d += ` V${y(low[i]).toFixed(1)} H${x(i).toFixed(1)}`;
  return `${d} V${y(low[0]).toFixed(1)} Z`;
})();
/* All the conditions the robot measured, as dots over the plot (the user, 17 Nov 2026: fill the plot with actual
   dots; was a histogram against the right edge). Their yields come from the screen's distribution in 2-point bins,
   which is what the model team released; the screen has no run order, so a dot's place along the axis means nothing
   and only its height is data. Spread with a fixed seed, so every visitor sees the same cloud. */
const CLOUD = (() => {
  let seed = 20261117;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const { bin_edges: edges, counts } = data.screen_histogram;
  /* Beyond SDM-1's own experiments (the user, 17 Nov 2026: dots over the run read as scattered): the run holds the
     left of the axis, the rest of the robot's screen the right. Was the whole width. */
  const left = x(data.budget);
  const right = x(X_MAX);
  const dots: string[] = [];
  counts.forEach((c, i) => {
    for (let k = 0; k < c; k++) {
      const px = left + random() * (right - left);
      const py = y(edges[i] + random() * (edges[i + 1] - edges[i]));
      dots.push(`M${px.toFixed(1)},${py.toFixed(1)}l0,0`);
    }
  });
  return dots.join("");
})();

export default function SuzukiValue({ modelName }: { modelName: string }) {
  return (
    <div className="r-cfe r-cfe--suzuki">
      <p className="r-show-claim">
        <span className="r-cfe-line">On a robot,</span>{" "}
        <span className="r-cfe-punch">
          {modelName} finds a top-1% condition in {data.median_first_top1}{" "}
          experiments.
        </span>
      </p>

      <figure className="r-cfe-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="r-suzuki-plot-title"
        >
          <title id="r-suzuki-plot-title">
            {`Yield against experiments, on a logarithmic axis, for ${data.replays} runs of ${modelName} driving the robot, five conditions per round. A typical run reaches the top 1% after ${highlight.first_top1} experiments; every run reaches it by experiment ${data.latest_first_top1}. On the right, the yields of all ${data.conditions.toLocaleString("en-US")} conditions the robot measured.`}
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
          {/* 1,000 dropped (the user's screenshot, 17 Nov 2026: it ran into 3,696). */}
          {[1, 10, 100, X_MAX].map((e) => (
            <text
              key={e}
              x={x(e)}
              y={H - M.b + 16}
              className="r-cfe-tick"
              textAnchor={e === X_MAX ? "end" : e === 1 ? "start" : "middle"}
            >
              {e.toLocaleString("en-US")}
            </text>
          ))}
          {/* The top 1% as a field one can see, its lower edge drawn, and its label above it rather than inside
              (the user, 17 Nov 2026). */}
          <rect
            x={M.l}
            y={y(data.max_yield)}
            width={W - M.l - M.r}
            height={y(data.top1_cut_yield) - y(data.max_yield)}
            className="r-cfe-top r-cfe-top--strong"
          />
          <line
            x1={M.l}
            x2={W - M.r}
            y1={y(data.top1_cut_yield)}
            y2={y(data.top1_cut_yield)}
            className="r-cfe-top-edge"
          />
          {/* Was "Top 1% of 3,696 conditions" at the field's left (the user, 17 Nov 2026: just "Top 1%", on the
              right). */}
          <text
            x={W - M.r}
            y={y(data.max_yield) - 7}
            className="r-cfe-note"
            textAnchor="end"
          >
            Top 1%
          </text>
          {/* Was every other replay as a faint line (the user, 17 Nov 2026: too cluttered). */}
          <path d={CLOUD} className="r-suzuki-cloud" />
          <path d={BAND} className="r-cfe-band" />
          {/* The model's own experiments, picked out from the screen's faint dots (the user, 17 Nov 2026); they were
              r 1.5 at 35%. */}
          {highlight.yields.map((v, i) => (
            <circle
              key={i}
              cx={x(i + 1)}
              cy={y(v)}
              r={2.4}
              className="r-cfe-dot r-cfe-dot--sdm r-suzuki-pick"
            />
          ))}
          <path d={stair(highlight.best)} className="r-cfe-sdm" />
          <circle
            cx={x(highlight.first_top1)}
            cy={y(highlight.best[highlight.first_top1 - 1])}
            r={3.2}
            className="r-cfe-hit r-cfe-hit--sdm"
          />
          {/* Over the circled experiment, above the line (the user, 17 Nov 2026); was below it, among the dots. */}
          <text
            x={x(highlight.first_top1)}
            y={y(100) - 24}
            className="r-cfe-label r-cfe-label--sdm"
          >
            {modelName}
            {/* Left-aligned from the circled experiment, same height (the user, 17 Nov 2026); was centred on it. */}
            <tspan
              x={x(highlight.first_top1)}
              dy={14}
              className="r-cfe-label-sub"
            >
              top 1% at experiment {highlight.first_top1}
            </tspan>
          </text>
          {/* Was a dashed line and "SDM-1 stops at 50" here (the user, 17 Nov 2026: odd on the plot). */}
          <text
            x={x(X_MAX)}
            y={y(0) - 6}
            className="r-cfe-tick"
            textAnchor="end"
          >
            Every condition the robot measured
          </text>
          <text
            x={(M.l + W - M.r) / 2}
            y={H - 2}
            className="r-cfe-axis"
            textAnchor="middle"
          >
            Experiments (log scale)
          </text>
          <text
            x={10}
            y={(M.t + H - M.b) / 2}
            className="r-cfe-axis"
            textAnchor="middle"
            transform={`rotate(-90 10 ${(M.t + H - M.b) / 2})`}
          >
            Yield (%)
          </text>
        </svg>
        {/* Was "A typical replay" and "The middle half of 30 replays" (the user, 17 Nov 2026: a reader does not know
            what a replay is; name the line by what it draws). */}
        {/* The model alone (the user, 17 Nov 2026: no further text in the legend). Was two keys, the second
            "The middle half of 30 runs". */}
        <figcaption className="r-cfe-legend">
          <span className="r-cfe-key r-cfe-key--sdm">{modelName}</span>
        </figcaption>
      </figure>

      <dl className="r-cfe-figures">
        <div>
          <dt>{data.median_first_top1}</dt>
          <dd>experiments to the top 1%</dd>
        </div>
        <div>
          <dt>{data.median_best_after_10}%</dt>
          <dd>median yield after 10</dd>
        </div>
        <div>
          <dt>
            {data.reached_within_50} / {data.replays}
          </dt>
          <dd>runs reached the top 1%</dd>
        </div>
      </dl>

      <p className="r-cfe-foot">
        {GROUP}&apos;s flow robot measured every combination of ligand, base,
        solvent and coupling partner for this reaction. That complete map lets{" "}
        {modelName} be replayed driving the robot: {data.batch} experiments per
        round, each answered with {GROUP}&apos;s own measurement.
        <br />
        Dataset:{" "}
        <a href={PAPER_URL} target="_blank" rel="noopener noreferrer">
          Perera et al., Science 2018
        </a>{" "}
        ({GROUP}), as released with Shields et al., Nature 2021.{" "}
        {data.conditions.toLocaleString("en-US")} conditions: 4 electrophiles ×
        3 boron reagents × 11 ligands × 7 bases × 4 solvents.
        <br />
        The faint dots are all {data.conditions.toLocaleString("en-US")}{" "}
        conditions the robot measured, placed by their yield alone: the screen
        has no run order.
        <br />
        {data.replays} runs, each from a random first batch of {data.batch}.{" "}
        {modelName} saw the conditions only as categories, with no chemistry
        descriptors. Top 1% = the {data.top1_conditions} conditions with a yield
        of {data.top1_cut_yield}% or more.
      </p>
    </div>
  );
}
