import type { ReactNode } from 'react';
import {
  TO_BE_MEASURED,
  chartMethods,
  decimalsOf,
  methodLabel,
  methodsIn,
  liveUrl,
  release,
  show,
  type Benchmark,
  type Method,
} from '@/content/release';

/*
 * Pieces of the model release page (app/writings/introducing-model-name).
 * Server components; every figure comes from content/release/announcement.json,
 * and so do the columns: each chart and table shows the methods a benchmark
 * reports, in the data file's order (methodsIn, chartMethods).
 *
 * Colours by method group: the model teal, TabPFN ink, Bayesian optimisation
 * orange, design of experiments stone and mint, others faint; a second member
 * of a group takes the group's second colour. Random search, where it is the
 * yardstick (the same value in every row), is a dashed line, not a bar. A chart
 * shows the best TabPFN version for that benchmark; the other versions are in
 * a folded table under it. No "best" highlighting in tables.
 */

const PALETTE: Record<string, string[]> = {
  ours: ['var(--c-teal)'],
  tabpfn: ['var(--c-ink)', 'var(--c-line-3)'],
  bo: ['var(--c-orange)', 'var(--c-amber-ink)'],
  doe: ['var(--c-muted)', 'var(--c-mint)'],
  other: ['var(--c-faint)'],
};

/** Each shown method's colour: its group's palette, by order within the group. */
function colours(methods: Method[]) {
  const seen: Record<string, number> = {};
  return Object.fromEntries(
    methods.map((m) => {
      const palette = PALETTE[m.group] ?? PALETTE.other;
      const i = (seen[m.group] = (seen[m.group] ?? -1) + 1);
      return [m.key, palette[Math.min(i, palette.length - 1)]];
    }),
  ) as Record<string, string>;
}

/** A reference method drawn as a line: the same number in every row of the benchmark. */
function yardstick(benchmark: Benchmark, methods: Method[]) {
  for (const m of methods.filter((x) => x.group === 'reference')) {
    const values = benchmark.results.map((r) => r.values[m.key]);
    if (values.every((v) => typeof v === 'number' && v === values[0])) return { method: m, value: values[0] as number };
  }
  return undefined;
}

/** Stand-in marker per result. Off the page since 30 Oct 2026 (the Draft box says it once); kept for reuse. */
export function MeasuredOn({ benchmark }: { benchmark: Benchmark }) {
  if (!benchmark.standin) return null;
  return (
    <p className="r-standin">
      <span>Stand-in</span> {benchmark.not_measured_yet ? 'Model not measured yet; baseline only' : `Measured on the ${benchmark.measured_on}`}
    </p>
  );
}

function Legend({ benchmark, methods, colour, line }: { benchmark: Benchmark; methods: Method[]; colour: Record<string, string>; line?: { method: Method; value: number } }) {
  return (
    <ul className="r-legend">
      {methods.map((m) => (
        <li key={m.key}>
          <span className="r-key" style={{ background: colour[m.key] }} aria-hidden="true" />
          {methodLabel(benchmark, m.key)}
        </li>
      ))}
      {line ? (
        <li>
          <span className="r-key r-key--ref" aria-hidden="true" />
          {methodLabel(benchmark, line.method.key)} = {show(line.value, { decimals: 1 })}
        </li>
      ) : null}
    </ul>
  );
}

/** The versions a chart leaves out, folded under it as a table. */
function Folded({ benchmark, shown, folded, percent = false }: { benchmark: Benchmark; shown: Method[]; folded: Method[]; percent?: boolean }) {
  if (!folded.length) return null;
  const groups = new Set(folded.map((m) => m.group));
  const keys = methodsIn(benchmark).filter((m) => groups.has(m.group) && (shown.includes(m) || folded.includes(m)));
  return (
    <details className="r-facts r-folded">
      <summary>All {keys[0].name.split(' ')[0]} versions</summary>
      <ResultsTable benchmark={benchmark} percent={percent} only={keys.map((m) => m.key)} />
    </details>
  );
}

/**
 * Bars per result row, lower is better. A yardstick method (random search at
 * 1.0) is the dashed line the bars are measured against; the scale reaches
 * whichever is longer, the line or the longest bar.
 * HTML bars, not SVG, so the labels keep their size on a phone.
 */
export function RegretBars({ benchmark }: { benchmark: Benchmark }) {
  const { shown, folded } = chartMethods(benchmark);
  const line = yardstick(benchmark, shown);
  const bars = shown.filter((m) => m !== line?.method);
  const colour = colours(bars);
  const decimals = decimalsOf(benchmark);
  const numbers = benchmark.results.flatMap((r) => bars.map((m) => r.values[m.key]).filter((v): v is number => typeof v === 'number'));
  const scale = Math.max(line?.value ?? 0, ...numbers) || 1;
  const at = (v: number) => `${(v / scale) * 100}%`;
  return (
    <figure className="r-figure">
      <Legend benchmark={benchmark} methods={bars} colour={colour} line={line} />
      <div className="r-bars">
        {line ? <span className="r-bars-ref" style={{ left: at(line.value) }} aria-hidden="true" /> : null}
        {benchmark.results.map((r) => (
          <div key={r.group} className="r-bars-group" role="group" aria-label={r.group}>
            <p className="r-bars-label">{r.group}</p>
            {bars
              .filter((m) => m.key in r.values)
              .map((m) => {
                const v = r.values[m.key];
                return (
                  <div key={m.key} className="r-bar-row">
                    <span className="s-sr">{methodLabel(benchmark, m.key)}:</span>
                    {typeof v === 'number' ? (
                      <>
                        <span className="r-bar" style={{ width: at(v), background: colour[m.key] }} aria-hidden="true" />
                        <span className="r-val">{show(v, { decimals })}</span>
                      </>
                    ) : (
                      <span className="r-val r-val--pending">{show(v)}</span>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
        <p className="r-bars-axis" aria-hidden="true">
          <span>0</span>
          {line ? (
            <span className="r-bars-axis-ref" style={{ left: at(line.value) }}>
              {methodLabel(benchmark, line.method.key).toLowerCase()} = {show(line.value, { decimals: 1 })}
            </span>
          ) : null}
        </p>
      </div>
      <figcaption data-kind="Benchmark">
        {benchmark.metric.name}. Lower is better.
      </figcaption>
      <Folded benchmark={benchmark} shown={shown} folded={folded} />
    </figure>
  );
}

/**
 * Calibration: for each condition, the share of outcomes inside each method's
 * 50 / 80 / 95% ranges against the nominal level. On the diagonal is exact.
 */
export function CoveragePlot({ benchmark, nominal = [0.5, 0.8, 0.95] }: { benchmark: Benchmark; nominal?: number[] }) {
  const { shown, folded } = chartMethods(benchmark, { nominal });
  const methods = shown.filter((m) => benchmark.results.some((r) => Array.isArray(r.values[m.key])));
  const colour = colours(methods);
  const S = 260;
  const pad = { l: 40, r: 12, t: 12, b: 34 };
  const lo = 0.3;
  const hi = 1;
  const px = (v: number) => pad.l + ((v - lo) / (hi - lo)) * (S - pad.l - pad.r);
  const py = (v: number) => S - pad.b - ((v - lo) / (hi - lo)) * (S - pad.t - pad.b);
  const ticks = [0.4, 0.6, 0.8, 1];

  return (
    <figure className="r-figure">
      <Legend benchmark={benchmark} methods={methods} colour={colour} />
      <div className="r-panels">
        {benchmark.results.map((r) => (
          <svg
            key={r.group}
            className="r-cov"
            viewBox={`0 0 ${S} ${S + 34}`}
            role="img"
            aria-label={`${r.group}. Nominal ${nominal.map((n) => show(n, { percent: true })).join(', ')}. ${methods
              .map((m) => `${methodLabel(benchmark, m.key)}: ${show(r.values[m.key], { percent: true })}`)
              .join('. ')}.`}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line className="r-grid" x1={px(lo)} x2={px(hi)} y1={py(t)} y2={py(t)} />
                <text className="r-axis" x={pad.l - 6} y={py(t) + 3} textAnchor="end">
                  {show(t, { percent: true })}
                </text>
                <text className="r-axis" x={px(t)} y={S - pad.b + 14} textAnchor="middle">
                  {show(t, { percent: true })}
                </text>
              </g>
            ))}
            <line className="r-ref" x1={px(lo)} y1={py(lo)} x2={px(hi)} y2={py(hi)} />
            <text className="r-axis" x={(px(lo) + px(hi)) / 2} y={S - 4} textAnchor="middle">
              nominal level
            </text>
            {/* The model is drawn last, on top. */}
            {[...methods.filter((m) => m.group !== 'ours'), ...methods.filter((m) => m.group === 'ours')].map((m) => {
              const ys = r.values[m.key];
              if (!Array.isArray(ys)) return null;
              const pts = nominal.map((n, i) => [px(n), py(ys[i])] as const);
              return (
                <g key={m.key}>
                  <polyline className="r-cov-line" points={pts.map((p) => p.join(',')).join(' ')} stroke={colour[m.key]} />
                  {pts.map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r={4} fill={colour[m.key]} />
                  ))}
                </g>
              );
            })}
            <text className="r-group" x={pad.l} y={S + 26}>
              {r.group}
            </text>
          </svg>
        ))}
      </div>
      <figcaption data-kind="Benchmark">
        {benchmark.metric.name}, against the nominal level; on the dashed diagonal is exact.
      </figcaption>
      <Folded benchmark={benchmark} shown={shown} folded={folded} percent />
    </figure>
  );
}

/**
 * A benchmark's results as a table: one row per group, one column per method
 * it reports, in the data file's order (or only the keys in `only`).
 */
export function ResultsTable({ benchmark, percent = false, only }: { benchmark: Benchmark; percent?: boolean; only?: string[] }) {
  const methods = methodsIn(benchmark).filter((m) => !only || only.includes(m.key));
  const decimals = decimalsOf(benchmark);
  return (
    <div className="p-writings-table-scroll r-table" tabIndex={0} role="region" aria-label={`${benchmark.title}, table`}>
      {/* Wider than the column when there are many methods: the wrapper scrolls. */}
      <table style={{ minWidth: `${Math.max(520, 180 + methods.length * 96)}px` }}>
        <thead>
          <tr>
            {/* The unit heads the row labels, unless it is a bare symbol ("x"). */}
            <th scope="col">{benchmark.metric.unit.length > 2 ? benchmark.metric.unit : ''}</th>
            {methods.map((m) => (
              <th key={m.key} scope="col" className={m.group === 'ours' ? 'r-col-model' : undefined}>
                {methodLabel(benchmark, m.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {benchmark.results.map((r) => (
            <tr key={r.group}>
              <th scope="row">{r.group}</th>
              {methods.map((m) => {
                const v = r.values[m.key];
                return (
                  <td key={m.key} className={[m.group === 'ours' ? 'r-col-model' : '', v === null ? 'r-pending' : ''].join(' ').trim() || undefined}>
                    {m.key in r.values ? show(v, { percent, decimals }) : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Head-to-head results, as the data file states them. */
export function PairedTable({ benchmark }: { benchmark: Benchmark }) {
  if (!benchmark.paired?.length) return null;
  return (
    <div className="p-writings-table-scroll r-table r-table--paired" tabIndex={0} role="region" aria-label="Head to head, table">
      <table>
        <thead>
          <tr>
            <th scope="col">Head to head</th>
            <th scope="col">{release.model.name}</th>
          </tr>
        </thead>
        <tbody>
          {benchmark.paired.map((p) => (
            <tr key={p.comparison}>
              <th scope="row">{p.comparison}</th>
              <td className="r-col-model">{p.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One line of source under each result: the data, its citation, the methods compared. */
export function BenchmarkSource({ benchmark }: { benchmark: Benchmark }) {
  const url = liveUrl(benchmark.dataset.url);
  return (
    <p className="r-source">
      {benchmark.dataset.name}.{' '}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {benchmark.dataset.citation}
        </a>
      ) : (
        benchmark.dataset.citation
      )}
      . Compared with{' '}
      {(release.methods
        ? methodsIn(benchmark)
            .filter((m) => m.group !== 'ours')
            .map((m) => m.name)
        : benchmark.baselines.map((b) => b.name)
      ).join(', ')}
      .
    </p>
  );
}

/** Where the result stops: the caveats, always shown, never folded away. */
export function Caveats({ benchmark }: { benchmark: Benchmark }) {
  if (!benchmark.caveats?.length) return null;
  return (
    <ul className="r-caveats">
      {benchmark.caveats.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );
}

const human = (key: string) => {
  const text = key.replace(/_/g, ' ');
  return text[0].toUpperCase() + text.slice(1);
};

function List({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

/** The model card, folded: every field from the data file, stand-in flags left out. */
export function ModelCard() {
  const card = release.model_card;
  const d = card.model_details;
  const t = card.training_data;
  const record = (r: Record<string, string | number | boolean>) =>
    Object.entries(r)
      .filter(([k]) => k !== 'standin')
      .map(([k, v]) => [human(k), String(v)] as const);
  const sections: [string, ReactNode][] = [
    ['Model', <>{release.model.name} {release.model.version}. {release.model.status}</>],
    ['Type', d.type],
    ['Inputs', d.inputs],
    ['Outputs', <List key="o" items={d.outputs} />],
    ['Training data', t.summary],
    ['Varied in training', <List key="v" items={t.variation_in_training} />],
    ['Intended use', <List key="u" items={card.intended_use} />],
    ['Operating envelope', <List key="e" items={record(card.operating_envelope).map(([k, v]) => `${k}: ${v}`)} />],
    ['Evaluation', card.evaluation_summary],
    ['License', card.license],
    ['Citation', card.citation],
  ];
  return (
    <details className="r-card">
      <summary>
        Model card <span>{release.model.name} {release.model.version}</span>
      </summary>
      <dl>
        {sections.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
