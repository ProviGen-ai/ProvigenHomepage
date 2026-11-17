import data from '@/content/release/cfe-value.json';

/*
 * The value of fewer experiments on a published lab campaign (founder and
 * advisor feedback, 13 Nov 2026: say what it saves the person running the
 * lab, not "X% better than BO"). Comparison page only, for now. Kept short
 * (founder: less verbose, a smaller graphic).
 *
 * Measured (scripts/make-cfe-value.py -> content/release/cfe-value.json):
 * Olsen et al. 2026, the campaign's last stage (rounds 30 to 44, 434
 * formulations, all of the campaign's best). The lab tested 472 formulations
 * of that stage before reaching one of its top 1%. SDM-1 searching the same
 * 434 reached one in every campaign (10), at a median of 15 experiments,
 * each campaign starting from 5 random formulations. Like the benchmark, this
 * picks among formulations the lab had made. Bayesian Optimization is left out
 * here (founder, 13 Nov 2026); it stays in the data (cfe-value.json).
 *
 * From the paper: about 175 h of wet-lab work for 1,231 formulations; $8.35
 * for all small-molecule reagents of the whole campaign; 20-h incubations.
 *
 * Measured since 14 Nov 2026 (S1-004-077): SDM-1 as served needs a median of
 * 17 experiments one at a time, and in rounds of 5 reaches the top 1% in round 3.
 * Assumed (ASSUMPTIONS, named in the footnote): two rounds a week (one until 15 Nov 2026), staff cost per
 * hour, the value of a month.
 *
 * Since 14 Nov 2026 (founder, option B "for a fair comparison"): the whole campaign, both sides counted the same
 * way. The data come in 3 reagent sets (Supplementary Data 2 sheets EX1-11, EX12-29, EX30-44; the components differ
 * per sheet). On each set, count the experiments until its first top-1% formulation, then move on to the next set:
 * Olsen et al. in their own order 234 + 5 + 472 = 711; SDM-1 (served model, 10 runs per set, choosing among the
 * formulations they tested) 16 + 47.5 + 17 = 80.5, shown as 81. Neither side could have known at the time that it
 * had hit the top 1% (it is defined over all formulations tested), so the stop is the same hindsight rule for both.
 * Calendar time: the paper gives about 175 h of wet-lab work and 43 rounds, but not how long a round took, so one
 * round a week is our assumption; Olsen et al.'s rounds to each set's hit as they ran them (11 + 1 + 14 = 26);
 * SDM-1 proposing 5 experiments per round (an assumption: its counts are measured one at a time).
 */

const ASSUMPTIONS = {
  /** One lab round (prepare, 20 h incubation, read out, decide) per week. */
  // weeksPerRound: 1,
  /** Two lab rounds a week (founder, 15 Nov 2026; was one). */
  weeksPerRound: 0.5,
  /** Fully loaded staff cost, US$ per hour. */
  staffPerHour: 100,
  /** What a month of a small team's running cost is worth, US$. */
  valuePerMonth: 20000,
  /** SDM-1's experiments per round (each stage starts with a round of its 5 starting formulations). */
  sdmPerRound: 5,
  /** Hours a scientist spends at the bench on a working day (the rest goes to planning, analysis, meetings); on the
      high side, so the days saved are not overstated (founder, 14 Nov 2026). */
  benchHoursPerDay: 6,
};
const PAPER = { hours: 175, formulations: 1231 };
const PAPER_URL = 'https://doi.org/10.1038/s41467-026-69605-8';
/* Who ran the campaign (founder: name the research group, not "the lab", and keep it short): the paper's citation. */
const GROUP = 'Olsen et al.';

const stage = data.stages['ex30-44'];
const lab = data.lab['ex30-44'];
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
/* SDM-1 as the API serves it (S1-004-077, 14 Nov 2026), not the research setting (which needed 15). */
const served = data.served;
const sdmHits = served.batch1.first_top1.filter((h): h is number => h !== null);
const sdmMedian = median(sdmHits);
/* Measured in rounds of 5: the round of the first top-1% formulation (round 0 = the 5 starting formulations). */
const sdmRound5 = median(served.batch5.first_round.filter((r): r is number => r !== null));
const minutesEach = (PAPER.hours * 60) / PAPER.formulations;
const labHours = (lab.first_top1 * minutesEach) / 60;
const sdmHours = (sdmMedian * minutesEach) / 60;
/* Final stage only (the release page's backup; the comparison page counts the whole campaign, below). */
const timeSaved = 1 - sdmMedian / lab.first_top1;
const labRounds = lab.first_top1_round - data.convergence.rounds[0] + 1;
const sdmRounds = sdmRound5 + 1;
const monthsSooner = ((labRounds - sdmRounds) * ASSUMPTIONS.weeksPerRound * 7) / 30.44;
const saved = (labHours - sdmHours) * ASSUMPTIONS.staffPerHour + monthsSooner * ASSUMPTIONS.valuePerMonth;

/* The whole campaign (founder, 14 Nov 2026): SDM-1 stage by stage, each until that stage's top 1%. */
const STAGE_KEYS = ['ex1-11', 'ex12-29', 'ex30-44'] as const;
/* One experiment at a time (until 14 Nov 2026): 16 + 47.5 + 17 = 80.5, shown as 81.
const phases = STAGE_KEYS.map((k) => data.served_stages[k]); */
/* In rounds of 27 formulations, to match Olsen et al.'s round size (founder, 14 Nov 2026; agent-004's cfe-b27 runs):
   medians 34.5 + 44 + 29.5 = 108 experiments; the plot draws seed 6, whose three sets take 34 + 36 + 38 = 108. */
const phases = STAGE_KEYS.map((k) => ({ ...data.served_b27[k], campaign: data.served_b27[k].shown }));
const phaseMedians = phases.map((p) => p.median_first_top1);
const sdmTotal = Math.round(phaseMedians.reduce((a, b) => a + b, 0));
const labTotal = STAGE_KEYS.reduce((a, k) => a + data.lab[k].first_top1, 0);
const totalTimeSaved = 1 - sdmTotal / labTotal;
const labTotalHours = (labTotal * minutesEach) / 60;
const sdmTotalHours = (sdmTotal * minutesEach) / 60;
/* Olsen et al. per reagent set, each until its first top-1% formulation (option B, founder 14 Nov 2026). */
const SET_FIRST_ROUND = [1, 12, 30];
const labSetHits = STAGE_KEYS.map((k) => data.lab[k].first_top1);
const labSetRounds = STAGE_KEYS.map((k, i) => data.lab[k].first_top1_round - SET_FIRST_ROUND[i] + 1);
/* Until 14 Nov 2026 (option C): Olsen et al.'s whole campaign up to their final set's hit (1,179, round 43).
const labTotal = lab.first_top1_global;
const labTotalRounds = lab.first_top1_round; */
const labTotalRounds = labSetRounds.reduce((a, b) => a + b, 0);
// const sdmTotalRounds = phaseMedians.reduce((a, m) => a + Math.ceil(m / ASSUMPTIONS.sdmPerRound), 0);
/* Measured rounds of 27, each set's round of its 5 starting formulations included (round 0): 3 + 3 + 2.5 = 8.5. */
const sdmSetRounds = phases.map((p) => p.median_first_round + 1);
const sdmTotalRounds = sdmSetRounds.reduce((a, b) => a + b, 0);
const totalMonthsSooner = ((labTotalRounds - sdmTotalRounds) * ASSUMPTIONS.weeksPerRound * 7) / 30.44;
/* With batches of 5 (until 14 Nov 2026; dropped by the founder: not measured to the end on set 2):
const totalSaved =
  (labTotalHours - sdmTotalHours) * ASSUMPTIONS.staffPerHour + totalMonthsSooner * ASSUMPTIONS.valuePerMonth; */
void [labTotalRounds, sdmTotalRounds, totalMonthsSooner];
/* One experiment at a time, as measured (founder, 14 Nov 2026): no calendar-time claim (one at a time takes more
   rounds than Olsen et al.'s plates, and the paper gives no round length), only bench hours and their staff cost. */
const fewerHours = labTotalHours - sdmTotalHours;
const fewerDays = fewerHours / ASSUMPTIONS.benchHoursPerDay;
// const totalSaved = fewerHours * ASSUMPTIONS.staffPerHour;
void fewerDays;
/* Rounds of 27, measured: bench hours at the paper's pace, plus the months sooner at a team's monthly cost. */
const totalSaved = fewerHours * ASSUMPTIONS.staffPerHour + totalMonthsSooner * ASSUMPTIONS.valuePerMonth;

/* Short enough for one line in the figure row: $57k. */
const usdK = (n: number) => `$${Math.round(n / 1000)}k`;

/*
 * The plot: Olsen et al.'s whole campaign, all 1,231 formulations in the order tested (dots, at each
 * formulation's mean yield) and their best so far. The comparison sits in the final stage: SDM-1 starts
 * where that stage starts, from the same best so far, and searches the same formulations.
 */
const W = 560;
/* 300 for a while on 17 Nov 2026, to show the top-1% band; reverted, it made the card taller. The band keeps its
   stronger tint and its drawn lower edge instead. */
const H = 250;
const M = { l: 40, r: 12, t: 10, b: 30 };
const campaign = data.campaign;
const X_MAX = campaign.formulations;
const Y_MAX = 2.8;
const x = (e: number) => M.l + (e / X_MAX) * (W - M.l - M.r);
const y = (v: number) => H - M.b - (Math.max(0, v) / Y_MAX) * (H - M.t - M.b);
/* Best so far as a step line from (from, start): `start` is the best before the first value. */
const stair = (values: number[], from = 0, start = 0) => {
  let d = `M${x(from).toFixed(1)},${y(start).toFixed(1)}`;
  let last = start;
  values.forEach((v, i) => {
    if (v !== last) d += ` H${x(from + i + 1).toFixed(1)} V${y(v).toFixed(1)}`;
    last = v;
  });
  return `${d} H${x(from + values.length).toFixed(1)}`;
};
const curves = data.convergence.curves;
/* One typical SDM-1 campaign (closest to the median), drawn with every formulation it chose in its first 50. */
const SDM_SHOWN = 50;
const sdmRun = curves['sdm-1_served_campaign'];
/* Both start from nothing at experiment 0 (founder, 13 Nov 2026). SDM-1 picks among the formulations of Olsen
   et al.'s final stage; the footnote says so. */
const FINAL = campaign.stage_starts[2];
const finalPoints = sdmRun.points.slice(0, SDM_SHOWN);
const finalBest = sdmRun.best.slice(0, SDM_SHOWN);
/* SDM-1 phase after phase (founder, 14 Nov 2026): the typical campaign of each stage (closest to its median) up to
   its first top-1% formulation, one after the other; each phase's hit is ringed, at its height. */
const wholePoints = phases.flatMap((p) => p.campaign.points);
const wholeBest = wholePoints.reduce<number[]>(
  (acc, v) => [...acc, Math.max(v, acc.length ? acc[acc.length - 1] : 0)],
  [],
);
const sdmPhaseEnds = phases.reduce<number[]>(
  (acc, p) => [...acc, (acc.length ? acc[acc.length - 1] : 0) + p.campaign.first_top1],
  [],
);
/* Olsen et al. the same way: each set's formulations in their order, up to its first top-1% formulation. */
const labSetPoints = STAGE_KEYS.flatMap((k, i) =>
  campaign.points.slice(campaign.stage_starts[i], campaign.stage_starts[i] + labSetHits[i]),
);
const labSetBest = labSetPoints.reduce<number[]>(
  (acc, v) => [...acc, Math.max(v, acc.length ? acc[acc.length - 1] : 0)],
  [],
);
const labPhaseEnds = labSetHits.reduce<number[]>((acc, h) => [...acc, (acc.length ? acc[acc.length - 1] : 0) + h], []);
const threshold = lab.top1_threshold_g_per_L;
/* Olsen et al.'s first formulation in the best 1%, counted over their whole campaign (1,179). */
const labHit = FINAL + lab.first_top1;
const finalHit = sdmRun.first_top1;
const wholeHit = wholePoints.length;

/**
 * `headline`: 'pair' (Olsen et al.'s count, then SDM-1's on its own line) or 'single' (founder, 14 Nov 2026, the
 * comparison page: one sentence led by SDM-1, phrased as what it would have needed on their data).
 */
export default function CfeValue({
  modelName,
  headline = 'pair',
  count = 'final',
}: {
  modelName: string;
  /** 'two-lines' (founder, 14 Nov 2026): "Olsen et al. needed 1,179 experiments." then "SDM-1 would've needed 17."
      on its own line, in the left column as before. */
  headline?: 'pair' | 'single' | 'two-lines';
  /** 'whole' (founder, 14 Nov 2026, comparison page): SDM-1 counted over all three stages, phase 1 + 2 + 3, against
      Olsen et al.'s whole campaign; 'final' (default): their final stage only, as before. */
  count?: 'final' | 'whole';
}) {
  const whole = count === 'whole';
  const sdmPoints = whole ? wholePoints : finalPoints;
  const sdmBest = whole ? wholeBest : finalBest;
  const sdmHit = whole ? wholeHit : finalHit;
  const sdmCount = whole ? sdmTotal : sdmMedian;
  const labCount = whole ? labTotal : labHit;
  const labPoints = whole ? labSetPoints : campaign.points;
  const labBest = whole ? labSetBest : campaign.best;
  /* Whole campaign: the axis ends at Olsen et al.'s count (711), so SDM-1's phases get room. */
  const xMax = whole ? labTotal : X_MAX;
  const xTicks = whole ? [0, 200, 400, 600, labTotal] : [0, 250, 500, 750, 1000, X_MAX];
  const x = (e: number) => M.l + (e / xMax) * (W - M.l - M.r);
  const stair = (values: number[]) => {
    let d = `M${x(0).toFixed(1)},${y(0).toFixed(1)}`;
    let last = 0;
    values.forEach((v, i) => {
      if (v !== last) d += ` H${x(i + 1).toFixed(1)} V${y(v).toFixed(1)}`;
      last = v;
    });
    return `${d} H${x(values.length).toFixed(1)}`;
  };
  return (
    <div className="r-cfe">
      {headline === 'two-lines' ? (
        <p className="r-show-claim">
          <span className="r-cfe-line">
            {GROUP} needed {labCount.toLocaleString('en-US')} experiments.
          </span>{' '}
          <span className="r-cfe-punch">
            {/* {modelName} would’ve needed {sdmMedian}. (final stage only, until 14 Nov 2026) */}
            {/* "would’ve needed" until 17 Nov 2026 (the user: clean up the title). */}
            {modelName} would have needed {sdmCount}.
          </span>
        </p>
      ) : headline === 'single' ? (
        <p className="r-show-claim">
          <span className="r-cfe-answer">
            {modelName} would’ve needed {sdmMedian}
          </span>{' '}
          instead of {labHit.toLocaleString('en-US')} experiments to reach top 1% of results.
        </p>
      ) : (
        <p className="r-show-claim">
          {GROUP} needed {labHit.toLocaleString('en-US')} experiments to reach the top 1%.{' '}
          <span className="r-cfe-punch">
            {modelName} needed {sdmMedian}.
          </span>
        </p>
      )}

      <figure className="r-cfe-plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="r-cfe-plot-title">
          <title id="r-cfe-plot-title">
            {whole
              ? `Yield of the formulations ${GROUP} tested, in their order, in each of their 3 reagent sets up to that set's first top-1% formulation, and their best so far: ${labTotal} experiments. A typical ${modelName} campaign, searching the same sets the same way: ${sdmHit}.`
              : `Yield of all ${X_MAX} formulations ${GROUP} tested, in order, and their best so far: they reach the best 1% after ${labHit} experiments. A typical ${modelName} campaign, picking among the formulations of their final stage, after ${sdmHit}.`}
          </title>
          {[0, 1, 2].map((v) => (
            <g key={v}>
              {/* Only the baseline: the paper grid behind the plot replaces the lines at 1 and 2 (founder, 14 Nov 2026). */}
              {v === 0 ? <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className="r-cfe-grid" /> : null}
              <text x={M.l - 7} y={y(v) + 3.5} className="r-cfe-tick" textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {xTicks.map((e) => (
            <text key={e} x={x(e)} y={H - M.b + 16} className="r-cfe-tick" textAnchor={e === xMax ? 'end' : 'middle'}>
              {e.toLocaleString('en-US')}
            </text>
          ))}
          <rect
            x={M.l}
            y={y(Y_MAX)}
            width={W - M.l - M.r}
            height={y(threshold) - y(Y_MAX)}
            className="r-cfe-top r-cfe-top--strong"
          />
          {/* Its lower edge, so the threshold itself is visible (17 Nov 2026). */}
          <line x1={M.l} x2={W - M.r} y1={y(threshold)} y2={y(threshold)} className="r-cfe-top-edge" />
          <text x={x(xMax * 0.5)} y={(y(Y_MAX) + y(threshold)) / 2 + 4} className="r-cfe-note" textAnchor="middle">
            Top 1%
          </text>
          {labPoints.map((v, i) => (
            <circle key={`l${i}`} cx={x(i + 1)} cy={y(v)} r={1.2} className="r-cfe-dot" />
          ))}
          {sdmPoints.map((v, i) => (
            <circle key={`s${i}`} cx={x(i + 1)} cy={y(v)} r={1.5} className="r-cfe-dot r-cfe-dot--sdm" />
          ))}
          <path d={stair(labBest)} className="r-cfe-lab" />
          <path d={stair(sdmBest)} className="r-cfe-sdm" />
          {/* Where each stage's top 1% was reached, at that formulation's yield. */}
          {whole
            ? /* labPhaseEnds.map: a ring per reagent set, until 14 Nov 2026 */ labPhaseEnds.slice(-1).map((e) => (
                <circle key={`lh${e}`} cx={x(e)} cy={y(labPoints[e - 1])} r={3.2} className="r-cfe-hit" />
              ))
            : null}
          {whole
            ? /* sdmPhaseEnds.map: a ring per reagent set, until 14 Nov 2026 */ sdmPhaseEnds.slice(-1).map((e) => (
                <circle
                  key={`sh${e}`}
                  cx={x(e)}
                  cy={y(sdmPoints[e - 1])}
                  r={3.2}
                  className="r-cfe-hit r-cfe-hit--sdm"
                />
              ))
            : null}
          <text x={x(labCount) - 8} y={y(labBest[labCount - 1]) - 9} className="r-cfe-label" textAnchor="end">
            {GROUP}
          </text>
          {/* Up and right of the line's corner, clear of SDM-1's dots below it. */}
          <text x={x(sdmHit) + 26} y={y(sdmBest[sdmHit - 1]) + 13} className="r-cfe-label r-cfe-label--sdm">
            {modelName}
          </text>
          <text x={(M.l + W - M.r) / 2} y={H - 2} className="r-cfe-axis" textAnchor="middle">
            Experiments
          </text>
          <text
            x={10}
            y={(M.t + H - M.b) / 2}
            className="r-cfe-axis"
            textAnchor="middle"
            transform={`rotate(-90 10 ${(M.t + H - M.b) / 2})`}
          >
            Yield (g/L)
          </text>
        </svg>
        <figcaption className="r-cfe-legend">
          <span className="r-cfe-key r-cfe-key--sdm">{modelName}</span>
          <span className="r-cfe-key r-cfe-key--lab">{GROUP}</span>
        </figcaption>
      </figure>

      {/* Whole campaign (founder, 14 Nov 2026): one measured figure, 89% fewer experiments, until the batch-27 runs give
          measured rounds for months and cost. Bench days and staff-cost savings kept below, not shown. */}
      {/* Rounds of 27 (founder, 14 Nov 2026): fewer experiments, months sooner and money saved, from measured rounds. */}
      {whole ? (
        <dl className="r-cfe-figures">
          <div>
            <dt>{Math.round(totalTimeSaved * 100)}%</dt>
            <dd>fewer experiments</dd>
          </div>
          <div>
            <dt>~{totalMonthsSooner.toFixed(1)}</dt>
            <dd>fewer months</dd>
          </div>
          <div>
            <dt>~{usdK(totalSaved)}</dt>
            <dd>saved</dd>
          </div>
        </dl>
      ) : null}
      <dl className="r-cfe-figures" hidden={whole}>
        <div>
          <dt>{Math.round((whole ? totalTimeSaved : timeSaved) * 100)}%</dt>
          <dd>reduced bench time</dd>
        </div>
        {whole ? (
          <div>
            {/* <dt>~{Math.round(fewerHours)}</dt> <dd>fewer bench hours</dd> */}
            <dt>~{Math.round(fewerDays)}</dt>
            <dd>fewer days at the bench</dd>
          </div>
        ) : (
          <div>
            <dt>~{monthsSooner.toFixed(1)}</dt>
            <dd>fewer months</dd>
          </div>
        )}
        <div>
          <dt>~{usdK(whole ? totalSaved : saved)}</dt>
          <dd>saved</dd>
        </div>
      </dl>

      <p className="r-cfe-foot">
        {/* The paper linked (founder, 14 Nov 2026; comparison page): its DOI, the same link as the benchmarks' citation. */}
        Dataset based on:{' '}
        {whole ? (
          <a href={PAPER_URL} target="_blank" rel="noopener noreferrer">
            Olsen et al., Nature Communications 2026
          </a>
        ) : (
          'Olsen et al., Nature Communications 2026'
        )}{'.'}
        <br />
        {whole ? (
          <>
            {/* Both counted ... {modelName} 16 + 48 + 17 (median of 10 runs per set, one experiment at a time, choosing
                among the formulations tested). (one at a time, until 14 Nov 2026) */}
            {/* The per-set breakdown (until 14 Nov 2026; founder: simplify a lot): Olsen et al.: 234 + 5 + 472 experiments
                in 11 + 1 + 14 rounds. SDM-1, in rounds of 27 formulations to match Olsen et al.'s round size, choosing
                among the formulations they tested: 34.5 + 44 + 29.5 experiments in 3 + 3 + 2.5 rounds, the first round
                being its 5 starting formulations (median of 10 runs per set). */}
            {/* The two method lines as one (the user, 17 Nov 2026). */}
            Both counted until the first top-1% formulation in each of the
            campaign&apos;s 3 reagent sets, {modelName} in batches of 27 as in
            the paper.
            <br />
            {/* "(from the paper)" after "min per formulation" removed (founder, 15 Nov 2026). */}
            {/* The interpolation left gaps: "$ 100 /h" (the user, 17 Nov 2026: clean up the text). */}
            {`Assumptions: ${minutesEach.toFixed(1)} min per formulation, two rounds a week, $${ASSUMPTIONS.staffPerHour} an hour, ${usdK(ASSUMPTIONS.valuePerMonth)} a month.`}
            {/* <br /> */}
            {/* Assumptions: ... one round a week, SDM-1 proposing 5 experiments per round, $100/h, $20k/month. (batches
                of 5, dropped 14 Nov 2026)
            Assumptions: {minutesEach.toFixed(1)} min of bench time per formulation (175 h for 1,231 in the paper),{' '}
            {ASSUMPTIONS.benchHoursPerDay} h at the bench per working day, ${ASSUMPTIONS.staffPerHour}/h staff cost.
            (bench days, dropped 14 Nov 2026 until the batch-27 runs) */}
          </>
        ) : (
          <>
            {modelName} chose its experiments from {stage.formulations} formulations tested (median of 10 runs).
            <br />
            Assumptions: {minutesEach.toFixed(1)} min per formulation, two rounds a week, ${ASSUMPTIONS.staffPerHour}/h,{' '}
            {usdK(ASSUMPTIONS.valuePerMonth)}/month.
          </>
        )}
      </p>
    </div>
  );
}
