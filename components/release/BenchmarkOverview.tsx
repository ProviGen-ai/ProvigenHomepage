"use client";

import { useState } from "react";
import type { BenchmarkOverview as Overview } from "@/content/release";
import BenchmarkInfo, { type Info } from "./BenchmarkInfo";

/* How the score is worked out (founder, 17 Nov 2026: a small hover on the score's line). The same normalisation as
   Bayesmark, the NeurIPS 2020 black-box optimization challenge, as the data file's rows were scored. */
function scoreCard(): Info {
  const x = (v: number) => 10 + (v / 100) * 72;
  return {
    picture: () => (
      <svg viewBox="0 0 92 92" className="r-bench-pic" aria-hidden="true" focusable="false">
        {/* The scale: random search at 0, the optimum at 100, a campaign's result between them. */}
        <line x1={x(0)} y1={54} x2={x(100)} y2={54} className="r-bench-pic-track" />
        <line x1={x(0)} y1={54} x2={x(72)} y2={54} className="r-bench-pic-fill-line" />
        {[0, 100].map((v) => (
          <line key={v} x1={x(v)} y1={48} x2={x(v)} y2={60} className="r-bench-pic-track" />
        ))}
        <circle cx={x(72)} cy={54} r={4} className="r-bench-pic-knob" />
        <text x={x(0)} y={72} className="r-bench-pic-scale" textAnchor="start">
          0
        </text>
        <text x={x(100)} y={72} className="r-bench-pic-scale" textAnchor="end">
          100
        </text>
        <text x={x(0)} y={40} className="r-bench-pic-scale" textAnchor="start">
          random
        </text>
        <text x={x(100)} y={40} className="r-bench-pic-scale" textAnchor="end">
          optimum
        </text>
      </svg>
    ),
    lead: "Each campaign is scored against random search on the same task, so tasks of different difficulty can be averaged.",
    facts: [
      [
        "How",
        "After n experiments, the best result so far is measured as its distance from the task's optimum, and divided by the distance random search reaches with the same n. The score is 100 x (1 - that ratio).",
      ],
      [
        "So",
        "0 is what random search reaches, 100 is the optimum. A result worse than random scores 0, never a negative number.",
      ],
      [
        "Averaging",
        "Scored for every run of every task, then averaged over the runs and over the tasks in the row.",
      ],
      /* ["Left out", "A task random search already solves has no distance to divide by, so it is left out of the score;
         distance and top 1% still use it."] (founder, 17 Nov 2026: removed) */
    ],
  };
}

/*
 * The benchmarks showcase (founder, 13 Nov 2026, after the benchmark slide):
 * one metric at a time, chosen with chips; per benchmark, SDM-1 against
 * Bayesian optimization after 25 and 50 experiments, the better of the two
 * in bold. Every figure from the data file (benchmark_overview).
 */

/**
 * `grid` (comparison page, founder 14 Nov 2026, after the benchmark table of a comparable model release): a ruled
 * grid, one row per benchmark and budget, the model's column filled and outlined, the better value in bold, and the
 * other method's cell shaded where it is the better one.
 */
/* `nCells` (founder, 15 Nov 2026, comparison page): the column head reads "After n experiments", bold, and its cells
   "n = 25"; each measure's explanation is its one short sentence (explain_brief), bold. */
export default function BenchmarkOverview({
  data,
  modelName,
  grid = false,
  nCells = false,
  explain = false,
  heldOut,
  boNote,
  quietHeads = false,
  deltaHead = "Difference",
}: {
  data: Overview;
  modelName: string;
  grid?: boolean;
  nCells?: boolean;
  /** Each benchmark's name shows a small picture and a description on hover, focus or tap (comparison page, founder
      15 Nov 2026; BenchmarkInfo.tsx). */
  explain?: boolean;
  /** Under the table: that the model was trained on none of these benchmarks, and the contamination check (comparison
      page, founder 15 Nov 2026). */
  heldOut?: string;
  /** A rough overview of the Bayesian optimization settings, under the table (founder, 16 Nov 2026). */
  boNote?: string;
  /** The heads of the n and Difference columns set apart from the methods' heads: no box, smaller, at the bottom
      (comparison page, founder 16 Nov 2026: those columns looked like alternative methods). */
  quietHeads?: boolean;
  /** The comparison column's head (founder, 16 Nov 2026, comparison page: "Relative Difference", as its values are
      relative). */
  deltaHead?: string;
}) {
  const [metricId, setMetricId] = useState(data.metrics[0]?.id);
  const metric = data.metrics.find((m) => m.id === metricId) ?? data.metrics[0];
  if (!metric) return null;
  /* const better = (a: number, b: number) => (metric.better === 'higher' ? a > b : a < b); */
  /* A row the model team calls level (vs_bo "level", 15 Nov 2026) marks neither side as ahead. */
  /* An equal row (founder, 16 Nov 2026): its last column, the comparison, is highlighted as the winner instead. */
  /* const tie = (vs?: string) => vs === 'equal' || vs === 'level' || vs === '0%'; */
  /* "within noise" (16 Nov 2026): numbers apart but the paired difference under two standard errors; neither side marked. */
  const tie = (vs?: string) =>
    vs === "equal" || vs === "level" || vs === "0%" || vs === "within noise";
  /* Shown as 0% instead of "level" (founder, 16 Nov 2026): either way, neither side is marked ahead. */
  const better = (a: number, b: number, vs?: string) =>
    vs !== "level" &&
    vs !== "0%" &&
    vs !== "equal" &&
    vs !== "within noise" &&
    (metric.better === "higher" ? a > b : a < b);
  /* One number format per metric: a decimal on every value if any value has one (11.0%, not 11%). */
  const decimals = metric.rows.some(
    (r) => !Number.isInteger(r.model) || !Number.isInteger(r.bo),
  )
    ? 1
    : 0;
  const fmt = (v: number, unit: string) => `${v.toFixed(decimals)}${unit}`;

  return (
    <div className="r-bench">
      <div className="r-bench-chips" role="radiogroup" aria-label="Measure">
        {data.metrics.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={m.id === metric.id}
            onClick={() => setMetricId(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>
      {/* <p className="r-bench-explain">{metric.explain}</p> */}
      <p
        className={
          nCells && metric.explain_brief
            ? "r-bench-explain r-bench-explain--brief"
            : "r-bench-explain"
        }
      >
        {/* The score's line explains itself on hover (founder, 17 Nov 2026). */}
        {metric.id === "score" ? (
          <BenchmarkInfo id="score-how" card={scoreCard()}>
            {nCells && metric.explain_brief ? metric.explain_brief : metric.explain}
          </BenchmarkInfo>
        ) : nCells && metric.explain_brief ? (
          metric.explain_brief
        ) : (
          metric.explain
        )}
      </p>
      {grid ? (
        <div
          className={
            quietHeads
              ? "r-bench-table r-bench-grid r-bench-grid--quiet"
              : "r-bench-table r-bench-grid"
          }
          role="region"
          aria-label={`${metric.name}, table`}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <td />
                <th
                  scope="col"
                  className={
                    nCells
                      ? "r-bench-after r-bench-after--head"
                      : "r-bench-after"
                  }
                >
                  {nCells ? "After n experiments" : "After"}
                </th>
                <th scope="col" className="r-bench-model">
                  {modelName}
                </th>
                <th scope="col">Bayesian Optimization</th>
                <th scope="col" className="r-bench-delta-head">
                  {deltaHead}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.benchmarks.flatMap((b) =>
                metric.rows
                  .filter((r) => r.benchmark === b.id)
                  .sort((x, y) => x.n - y.n)
                  .map((r, i, all) => (
                    <tr
                      key={`${b.id}-${r.n}`}
                      className={
                        i === all.length - 1 ? "r-bench-last" : undefined
                      }
                    >
                      {i === 0 ? (
                        <th scope="rowgroup" rowSpan={all.length}>
                          <span className="r-bench-name">
                            {explain ? (
                              <BenchmarkInfo id={b.id}>
                                {b.name}
                                {b.citation ? "*" : ""}
                              </BenchmarkInfo>
                            ) : (
                              <>
                                {b.name}
                                {b.citation ? "*" : ""}
                              </>
                            )}
                          </span>
                          <span className="r-bench-detail">{b.detail}</span>
                        </th>
                      ) : null}
                      <td className="r-bench-after">
                        {nCells ? `n = ${r.n}` : `${r.n} experiments`}
                      </td>
                      <td
                        className={
                          better(r.model, r.bo, r.vs_bo)
                            ? "r-bench-model r-bench-win"
                            : "r-bench-model"
                        }
                      >
                        {fmt(r.model, metric.unit)}
                      </td>
                      <td
                        className={
                          better(r.bo, r.model, r.vs_bo)
                            ? "r-bench-win r-bench-other-win"
                            : undefined
                        }
                      >
                        {fmt(r.bo, metric.unit)}
                      </td>
                      <td
                        className={
                          tie(r.vs_bo)
                            ? "r-bench-delta r-bench-win r-bench-tie"
                            : "r-bench-delta"
                        }
                      >
                        {r.vs_bo}
                      </td>
                    </tr>
                  )),
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="r-bench-table"
          role="region"
          aria-label={`${metric.name}, table`}
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Benchmark</th>
                <th scope="col">After</th>
                <th scope="col" className="r-bench-model">
                  {modelName}
                </th>
                <th scope="col">Bayesian optimization</th>
                <th scope="col">{modelName} vs BO</th>
              </tr>
            </thead>
            <tbody>
              {data.benchmarks.map((b) => {
                const rows = metric.rows
                  .filter((r) => r.benchmark === b.id)
                  .sort((x, y) => x.n - y.n);
                return rows.map((r, i) => (
                  <tr
                    key={`${b.id}-${r.n}`}
                    className={i === 0 ? "r-bench-first" : undefined}
                  >
                    {i === 0 ? (
                      <th scope="rowgroup" rowSpan={rows.length}>
                        <span className="r-bench-name">
                          {b.name}
                          {b.citation ? "*" : ""}
                        </span>
                        <span className="r-bench-detail">{b.detail}</span>
                      </th>
                    ) : null}
                    <td className="r-bench-n">{r.n} experiments</td>
                    <td
                      className={
                        better(r.model, r.bo, r.vs_bo)
                          ? "r-bench-model r-bench-win"
                          : "r-bench-model"
                      }
                    >
                      {fmt(r.model, metric.unit)}
                    </td>
                    <td
                      className={
                        better(r.bo, r.model, r.vs_bo)
                          ? "r-bench-win"
                          : undefined
                      }
                    >
                      {fmt(r.bo, metric.unit)}
                    </td>
                    <td
                      className={
                        tie(r.vs_bo)
                          ? "r-bench-delta r-bench-win r-bench-tie"
                          : "r-bench-delta"
                      }
                    >
                      {r.vs_bo}
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
      {/* The grid (comparison page) adds the batch size each benchmark ran at (founder, 14 Nov 2026). */}
      <p className="r-bench-note">
        {data.n_note}
        {grid && data.batch_note ? ` ${data.batch_note}` : null}
      </p>
      {/* {heldOut ? <p className="r-bench-note">{heldOut}</p> : null} (moved last, founder 16 Nov 2026) */}
      {/* What the comparison runs against (founder, 16 Nov 2026). */}
      {boNote ? <p className="r-bench-note">{boNote}</p> : null}
      {/* That none of the benchmarks was in training: the last note (founder, 16 Nov 2026). */}
      {heldOut ? <p className="r-bench-note">{heldOut}</p> : null}
      {data.benchmarks
        .filter((b) => b.citation)
        .map((b) => (
          <p key={b.id} className="r-bench-note">
            *{" "}
            {b.url ? (
              <a href={b.url} target="_blank" rel="noopener noreferrer">
                {b.citation}
              </a>
            ) : (
              b.citation
            )}
          </p>
        ))}
    </div>
  );
}
