import type { ReactNode } from 'react';
import {
  METHOD_LABEL,
  TO_BE_MEASURED,
  decimalsOf,
  methodLabel,
  liveUrl,
  release,
  show,
  type Benchmark,
  type Cell,
  type MethodKey,
} from '@/content/release';

/*
 * Pieces of the model release page (app/writings/introducing-model-name).
 * Server components; every figure comes from content/release/announcement.json.
 * Colours: the model teal, Bayesian optimisation orange, TabPFN ink, random a
 * dashed reference. No "best" highlighting: the tables show the numbers, and
 * where a baseline leads is left for the reader to see.
 */

const COLOR: Partial<Record<MethodKey, string>> = {
  model: 'var(--c-teal)',
  bo_gp: 'var(--c-orange)',
  tabpfn: 'var(--c-ink)',
};

/** Stand-in marker, shown while the page is a draft. */
export function MeasuredOn({ benchmark }: { benchmark: Benchmark }) {
  if (!benchmark.standin) return null;
  return (
    <p className="r-standin">
      <span>Stand-in</span> {benchmark.not_measured_yet ? 'Model not measured yet; baseline only' : `Measured on the ${benchmark.measured_on}`}
    </p>
  );
}

function Legend({ methods }: { methods: MethodKey[] }) {
  return (
    <ul className="r-legend">
      {methods.map((m) => (
        <li key={m}>
          <span className={m === 'random' ? 'r-key r-key--ref' : 'r-key'} style={{ background: COLOR[m] }} aria-hidden="true" />
          {METHOD_LABEL[m]}
          {m === 'random' ? ' = 1.0' : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Held-out search: regret relative to random search, one block of bars per
 * problem group, lower is better, random search the dashed line at 1.0.
 * HTML bars, not SVG, so the labels keep their size on a phone.
 */
export function RegretBars({ benchmark }: { benchmark: Benchmark }) {
  const methods: MethodKey[] = ['model', 'bo_gp', 'tabpfn'];
  const decimals = decimalsOf(benchmark);
  return (
    <figure className="r-figure">
      <Legend methods={[...methods, 'random']} />
      <div className="r-bars">
        {benchmark.results.map((r) => (
          <div key={r.group} className="r-bars-group" role="group" aria-label={r.group}>
            <p className="r-bars-label">{r.group}</p>
            {methods.map((m) => {
              const v = r.values[m];
              return (
                <div key={m} className="r-bar-row">
                  <span className="s-sr">{METHOD_LABEL[m]}:</span>
                  {typeof v === 'number' ? (
                    <>
                      <span className="r-bar" style={{ width: `${Math.min(v, 1) * 100}%`, background: COLOR[m] }} aria-hidden="true" />
                      <span className="r-val">{show(v, { decimals })}</span>
                    </>
                  ) : (
                    <span className="r-val r-val--pending">{TO_BE_MEASURED}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <p className="r-bars-axis" aria-hidden="true">
          <span>0</span>
          <span>random = 1.0</span>
        </p>
      </div>
      <figcaption data-kind="Benchmark">
        {benchmark.metric.name}. Lower is better.
      </figcaption>
    </figure>
  );
}

/**
 * Calibration: for each condition, the share of outcomes inside the model's
 * 50 / 80 / 95% intervals against the nominal level. On the diagonal is exact.
 */
export function CoveragePlot({ benchmark, nominal = [0.5, 0.8, 0.95] }: { benchmark: Benchmark; nominal?: number[] }) {
  const methods: MethodKey[] = ['model', 'bo_gp'];
  const S = 260;
  const pad = { l: 40, r: 12, t: 12, b: 34 };
  const lo = 0.3;
  const hi = 1;
  const px = (v: number) => pad.l + ((v - lo) / (hi - lo)) * (S - pad.l - pad.r);
  const py = (v: number) => S - pad.b - ((v - lo) / (hi - lo)) * (S - pad.t - pad.b);
  const ticks = [0.4, 0.6, 0.8, 1];

  return (
    <figure className="r-figure">
      <Legend methods={methods} />
      <div className="r-panels">
        {benchmark.results.map((r) => (
          <svg
            key={r.group}
            className="r-cov"
            viewBox={`0 0 ${S} ${S + 34}`}
            role="img"
            aria-label={`${r.group}. Nominal ${nominal.map((n) => show(n, { percent: true })).join(', ')}. ${methods
              .map((m) => `${METHOD_LABEL[m]}: ${show(r.values[m] as Cell, { percent: true })}`)
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
            {methods.map((m) => {
              const ys = r.values[m];
              if (!Array.isArray(ys)) return null;
              const pts = nominal.map((n, i) => [px(n), py(ys[i])] as const);
              return (
                <g key={m}>
                  <polyline className="r-cov-line" points={pts.map((p) => p.join(',')).join(' ')} stroke={COLOR[m]} />
                  {pts.map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r={4} fill={COLOR[m]} />
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
    </figure>
  );
}

/** A benchmark's results as a table: one row per group, one column per method present. */
export function ResultsTable({ benchmark, percent = false }: { benchmark: Benchmark; percent?: boolean }) {
  const order: MethodKey[] = ['model', 'tabpfn', 'bo_gp', 'bo_gp_published', 'fsbo_published', 'random'];
  const methods = order.filter((m) => benchmark.results.some((r) => m in r.values));
  const decimals = decimalsOf(benchmark);
  return (
    <div className="p-writings-table-scroll r-table" tabIndex={0} role="region" aria-label={`${benchmark.title}, table`}>
      <table>
        <thead>
          <tr>
            {/* The unit heads the row labels, unless it is a bare symbol ("x"). */}
            <th scope="col">{benchmark.metric.unit.length > 2 ? benchmark.metric.unit : ''}</th>
            {methods.map((m) => (
              <th key={m} scope="col" className={m === 'model' ? 'r-col-model' : undefined}>
                {methodLabel(benchmark, m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {benchmark.results.map((r) => (
            <tr key={r.group}>
              <th scope="row">{r.group}</th>
              {methods.map((m) => {
                const v = r.values[m];
                return (
                  <td key={m} className={[m === 'model' ? 'r-col-model' : '', v === null ? 'r-pending' : ''].join(' ').trim() || undefined}>
                    {m in r.values ? show(v, { percent, decimals }) : ''}
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
            <th scope="col">{METHOD_LABEL.model}</th>
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
      . Compared with {benchmark.baselines.map((b) => b.name).join(', ')}.
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
