"use client";

import { useState } from "react";
import type { BenchmarkOverview as Overview } from "@/content/release";

/*
 * The benchmarks as a radar (founder, 17 Nov 2026, after a comparable release's chart by slice): one spoke per
 * benchmark, SDM-1 and Bayesian optimization each a closed line over them, for one measure and one budget at a time.
 * A trial under the table on the comparison page; the table stays the full record. Further out is always better: a
 * measure where lower is better (distance from the optimum) runs on an inverted scale, 0 on the outer ring (founder,
 * 17 Nov 2026; was left out of the radar).
 *
 * Every number from the same merged overview the table reads (page.tsx). Hover, focus or tap a spoke for its values.
 */

const W = 760;
const H = 600;
const CX = W / 2;
const CY = H / 2 + 6;
const R = 196;
/* const RINGS = [20, 40, 60, 80, 100]; (higher-is-better only) */
const STEP = 20;

/* Split a name into lines of at most `max` characters, at spaces. */
/* Shorter names where the table's would not fit the radar in two lines (founder, 17 Nov 2026: "Standard optimization
   functions" took three). The table keeps the full name. */
const SHORT: Record<string, string> = { functions: "Standard functions" };

/* Split a name into at most two lines of about `max` characters, at spaces; anything left over joins the second line,
   so a label is never three lines. */
function wrap(text: string, max = 16) {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines[lines.length - 1];
    if (last && (lines.length === 2 || (last + " " + word).length <= max))
      lines[lines.length - 1] = last + " " + word;
    else lines.push(word);
  }
  return lines;
}

export default function BenchmarkRadar({
  data,
  modelName,
}: {
  data: Overview;
  modelName: string;
}) {
  /* const metrics = data.metrics.filter((m) => m.better === "higher"); */
  const metrics = data.metrics;
  const [metricId, setMetricId] = useState(metrics[0]?.id);
  const [n, setN] = useState(50);
  const [active, setActive] = useState<number | null>(null);
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0];
  if (!metric) return null;

  const budgets = [...new Set(metric.rows.map((r) => r.n))].sort(
    (a, b) => a - b,
  );
  /* The spokes: every shown benchmark with a row for this measure and budget, in the table's order. */
  const spokes = data.benchmarks.flatMap((b) => {
    const row = metric.rows.find((r) => r.benchmark === b.id && r.n === n);
    return row ? [{ b, row }] : [];
  });
  const count = spokes.length;
  if (count < 3) return null;

  /* The scale: higher is better, 0 in the middle to 100 outside; lower is better, inverted, 0 outside and in the
     middle the next step above the largest value of either budget, so switching budgets keeps the scale. */
  const higher = metric.better === "higher";
  const top = higher
    ? 100
    : Math.ceil(
        Math.max(...metric.rows.flatMap((r) => [r.model, r.bo])) / STEP,
      ) * STEP;
  const frac = (v: number) =>
    Math.max(0, Math.min(1, higher ? v / top : (top - v) / top));
  /* The rings' values, from the middle outwards; the middle itself has none. */
  const rings = Array.from({ length: top / STEP }, (_, k) =>
    higher ? (k + 1) * STEP : top - (k + 1) * STEP,
  );
  const angle = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / count;
  const at = (i: number, v: number) => {
    /* const r = (Math.max(0, Math.min(100, v)) / 100) * R; */
    const r = frac(v) * R;
    return [CX + r * Math.cos(angle(i)), CY + r * Math.sin(angle(i))] as const;
  };
  const shape = (pick: (row: (typeof spokes)[number]["row"]) => number) =>
    spokes
      .map(({ row }, i) =>
        at(i, pick(row))
          .map((c) => c.toFixed(1))
          .join(","),
      )
      .join(" ");
  const unit = metric.unit ?? "";
  const fmt = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`;
  const shown = active === null ? null : spokes[active];

  return (
    <figure className="r-radar">
      <div className="r-radar-controls">
        <div className="r-bench-chips" role="radiogroup" aria-label="Measure">
          {metrics.map((m) => (
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
        <div
          className="r-bench-chips"
          role="radiogroup"
          aria-label="Number of experiments"
        >
          {budgets.map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={b === n}
              onClick={() => setN(b)}
            >
              n = {b}
            </button>
          ))}
        </div>
      </div>

      <div className="r-radar-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${metric.name} after ${n} experiments, ${modelName} and Bayesian optimization, per benchmark. The table above lists every value.`}
          onMouseLeave={() => setActive(null)}
        >
          {rings.map((v) => (
            <polygon
              key={v}
              className="r-radar-ring"
              points={spokes
                .map((_, i) =>
                  at(i, v)
                    .map((c) => c.toFixed(1))
                    .join(","),
                )
                .join(" ")}
            />
          ))}
          {spokes.map((_, i) => {
            const [x, y] = at(i, higher ? top : 0);
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                className={
                  active === i ? "r-radar-spoke is-active" : "r-radar-spoke"
                }
              />
            );
          })}
          {/* The ring values along the first spoke's right side. */}
          {rings.map((v) => (
            <text
              key={v}
              x={CX + 6}
              y={CY - frac(v) * R + 4}
              className="r-radar-tick"
            >
              {v}
              {unit}
            </text>
          ))}

          <polygon
            className="r-radar-area r-radar-area--bo"
            points={shape((r) => r.bo)}
          />
          <polygon
            className="r-radar-area r-radar-area--model"
            points={shape((r) => r.model)}
          />
          {spokes.map(({ row }, i) => {
            const [x, y] = at(i, row.bo);
            return (
              <rect
                key={`bo${i}`}
                x={x - 3.5}
                y={y - 3.5}
                width={7}
                height={7}
                className="r-radar-dot r-radar-dot--bo"
              />
            );
          })}
          {spokes.map(({ row }, i) => {
            const [x, y] = at(i, row.model);
            return (
              <circle
                key={`m${i}`}
                cx={x}
                cy={y}
                r={4.5}
                className="r-radar-dot r-radar-dot--model"
              />
            );
          })}

          {/* The benchmark names around the outside, with their size under them. */}
          {spokes.map(({ b }, i) => {
            const a = angle(i);
            const cos = Math.cos(a);
            const sin = Math.sin(a);
            const x = CX + (R + 26) * cos;
            const y = CY + (R + 26) * sin;
            const anchor =
              Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
            const lines = wrap(SHORT[b.id] ?? b.name);
            const total = lines.length + 1;
            /* Above the centre the block ends at the point; below it starts there; at the sides it is centred. */
            const y0 =
              sin < -0.5
                ? y - (total - 1) * 17
                : sin > 0.5
                  ? y + 12
                  : y - ((total - 1) * 17) / 2 + 5;
            return (
              <text
                key={b.id}
                x={x}
                y={y0}
                textAnchor={anchor}
                className={
                  active === i ? "r-radar-label is-active" : "r-radar-label"
                }
              >
                {lines.map((l, k) => (
                  <tspan key={k} x={x} dy={k === 0 ? 0 : 17}>
                    {l}
                  </tspan>
                ))}
                <tspan x={x} dy={16} className="r-radar-detail">
                  {b.detail}
                </tspan>
              </text>
            );
          })}

          {/* A wedge per spoke, larger than the marks, for hover, focus and tap. */}
          {spokes.map(({ b }, i) => {
            const half = Math.PI / count;
            const p = (t: number, r: number) =>
              `${(CX + r * Math.cos(t)).toFixed(1)},${(CY + r * Math.sin(t)).toFixed(1)}`;
            return (
              <path
                key={`hit${b.id}`}
                d={`M${CX},${CY} L${p(angle(i) - half, R + 20)} A${R + 20},${R + 20} 0 0 1 ${p(angle(i) + half, R + 20)} Z`}
                className="r-radar-hit"
                tabIndex={0}
                aria-label={`${b.name}: ${modelName} ${fmt(spokes[i].row.model)}, Bayesian optimization ${fmt(spokes[i].row.bo)}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => setActive(i)}
              />
            );
          })}
        </svg>

        {shown ? (
          <div className="r-radar-tip" role="status">
            <p className="r-radar-tip-name">{shown.b.name}</p>
            <p>
              <span
                className="r-radar-key r-radar-key--model"
                aria-hidden="true"
              />
              {modelName} <strong>{fmt(shown.row.model)}</strong>
            </p>
            <p>
              <span
                className="r-radar-key r-radar-key--bo"
                aria-hidden="true"
              />
              Bayesian optimization <strong>{fmt(shown.row.bo)}</strong>
            </p>
            <p className="r-radar-tip-vs">{shown.row.vs_bo}</p>
          </div>
        ) : null}
      </div>

      <figcaption className="r-radar-caption">
        <span className="r-radar-legend">
          <span>
            <span
              className="r-radar-key r-radar-key--model"
              aria-hidden="true"
            />
            {modelName}
          </span>
          <span>
            <span className="r-radar-key r-radar-key--bo" aria-hidden="true" />
            Bayesian optimization
          </span>
        </span>
        {/* The line under the legend, removed (founder, 17 Nov 2026):
        <span>
          {metric.name} after {n} experiments, per benchmark.{" "}
          {higher
            ? `Rings at ${rings.slice(0, -1).join(", ")} and ${rings[rings.length - 1]}${unit}; the middle is 0.`
            : `Lower is better, so the scale is inverted: 0${unit} on the outer ring, ${top}${unit} in the middle.`}
        </span> */}
      </figcaption>
    </figure>
  );
}
