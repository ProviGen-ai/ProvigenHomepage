'use client';

import { useState } from 'react';
import type { BenchmarkOverview as Overview } from '@/content/release';

/*
 * The benchmarks showcase (founder, 13 Nov 2026, after the benchmark slide):
 * one metric at a time, chosen with chips; per benchmark, SDM-1 against
 * Bayesian optimisation after 25 and 50 experiments, the better of the two
 * in bold. Every figure from the data file (benchmark_overview).
 */


export default function BenchmarkOverview({ data, modelName }: { data: Overview; modelName: string }) {
  const [metricId, setMetricId] = useState(data.metrics[0]?.id);
  const metric = data.metrics.find((m) => m.id === metricId) ?? data.metrics[0];
  if (!metric) return null;
  const better = (a: number, b: number) => (metric.better === 'higher' ? a > b : a < b);
  /* One number format per metric: a decimal on every value if any value has one (11.0%, not 11%). */
  const decimals = metric.rows.some((r) => !Number.isInteger(r.model) || !Number.isInteger(r.bo)) ? 1 : 0;
  const fmt = (v: number, unit: string) => `${v.toFixed(decimals)}${unit}`;

  return (
    <div className="r-bench">
      <div className="r-bench-chips" role="radiogroup" aria-label="Measure">
        {data.metrics.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={m.id === metric.id} onClick={() => setMetricId(m.id)}>
            {m.name}
          </button>
        ))}
      </div>
      <p className="r-bench-explain">{metric.explain}</p>
      <div className="r-bench-table" role="region" aria-label={`${metric.name}, table`} tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th scope="col">Benchmark</th>
              <th scope="col">After</th>
              <th scope="col" className="r-bench-model">
                {modelName}
              </th>
              <th scope="col">Bayesian optimisation</th>
              <th scope="col">{modelName} vs BO</th>
            </tr>
          </thead>
          <tbody>
            {data.benchmarks.map((b) => {
              const rows = metric.rows.filter((r) => r.benchmark === b.id).sort((x, y) => x.n - y.n);
              return rows.map((r, i) => (
                <tr key={`${b.id}-${r.n}`} className={i === 0 ? 'r-bench-first' : undefined}>
                  {i === 0 ? (
                    <th scope="rowgroup" rowSpan={rows.length}>
                      <span className="r-bench-name">
                        {b.name}
                        {b.citation ? '*' : ''}
                      </span>
                      <span className="r-bench-detail">{b.detail}</span>
                    </th>
                  ) : null}
                  <td className="r-bench-n">{r.n} experiments</td>
                  <td className={better(r.model, r.bo) ? 'r-bench-model r-bench-win' : 'r-bench-model'}>{fmt(r.model, metric.unit)}</td>
                  <td className={better(r.bo, r.model) ? 'r-bench-win' : undefined}>{fmt(r.bo, metric.unit)}</td>
                  <td className="r-bench-delta">{r.vs_bo}</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
      <p className="r-bench-note">{data.n_note}</p>
      {data.benchmarks
        .filter((b) => b.citation)
        .map((b) => (
          <p key={b.id} className="r-bench-note">
            * {b.url ? (
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
