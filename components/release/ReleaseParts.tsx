import type { ReactNode } from 'react';
import {
  METHODS,
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
 * orange, industry tools (BayBE, BoFire) slate blue, design of experiments
 * stone and sand, others faint; a second member
 * of a group takes the group's second colour. Random search, where it is the
 * yardstick (the same value in every row), is a dashed line, not a bar. A chart
 * shows the best TabPFN version for that benchmark; the other versions are in
 * a folded table under it. No "best" highlighting in tables.
 */

const PALETTE: Record<string, string[]> = {
  ours: ['var(--c-teal)'],
  tabpfn: ['var(--c-ink)', 'var(--c-line-3)'],
  bo: ['var(--c-orange)', 'var(--c-amber-ink)'],
  /* BayBE, BoFire: separate products, both always shown (not folded like TabPFN versions). */
  industry: ['var(--r-industry-1)', 'var(--r-industry-2)'],
  /* Sand, not mint, for the second DoE: mint sat too close to the model's teal. */
  doe: ['var(--r-doe-1)', 'var(--c-sand)'],
  other: ['var(--c-faint)'],
};

/**
 * Each shown method's colour: its group's palette, by order within the group.
 * A group shown with more members than its palette (all TabPFN versions in the
 * summary chart) steps its first colour from light to full, the last listed
 * (the newest version) darkest.
 */
function colours(methods: Method[]) {
  const count: Record<string, number> = {};
  for (const m of methods) count[m.group] = (count[m.group] ?? 0) + 1;
  const seen: Record<string, number> = {};
  return Object.fromEntries(
    methods.map((m) => {
      const palette = PALETTE[m.group] ?? PALETTE.other;
      const i = (seen[m.group] = (seen[m.group] ?? -1) + 1);
      const n = count[m.group];
      if (n > palette.length) {
        const share = Math.round((0.3 + (0.7 * (i + 1)) / n) * 100);
        return [m.key, `color-mix(in srgb, ${palette[0]} ${share}%, transparent)`];
      }
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

function Legend({
  benchmark,
  methods,
  colour,
  line,
  incumbent,
}: {
  benchmark: Benchmark;
  methods: Method[];
  colour: Record<string, string>;
  line?: { method: Method; value: number };
  incumbent?: string;
}) {
  return (
    <ul className="r-legend">
      {methods.map((m) => (
        <li key={m.key}>
          <span className="r-key" style={{ background: colour[m.key] }} aria-hidden="true" />
          {methodLabel(benchmark, m.key)}
        </li>
      ))}
      {incumbent ? (
        <li>
          <span className="r-key r-key--ref r-key--incumbent" aria-hidden="true" />
          {incumbent}
        </li>
      ) : null}
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
export function RegretBars({
  benchmark,
  group,
  title,
  reference,
  asOf,
  fold = true,
}: {
  benchmark: Benchmark;
  /** Only this result row (the summary chart). */
  group?: string;
  /** A title over the chart, e.g. the conclusion it supports. */
  title?: string;
  /** The strongest alternative, drawn as a second line instead of a bar. */
  reference?: { key: string; label: string };
  asOf?: string | null;
  /** Fold TabPFN versions to the best one (default); the summary chart shows every method. */
  fold?: boolean;
}) {
  const rows = group ? benchmark.results.filter((r) => r.group === group) : benchmark.results;
  /* Nothing measured yet: every method keeps its slot (no best version to pick). */
  const measured = rows.some((r) => Object.values(r.values).some((v) => typeof v === 'number'));
  const { shown, folded } = chartMethods(benchmark, { foldGroups: fold && measured ? ['tabpfn'] : [] });
  const line = yardstick(benchmark, shown);
  const bars = shown.filter((m) => m !== line?.method && m.key !== reference?.key);
  const refValue = reference ? rows[0]?.values[reference.key] : undefined;
  const colour = colours(bars);
  const decimals = decimalsOf(benchmark);
  const numbers = rows.flatMap((r) => bars.map((m) => r.values[m.key]).filter((v): v is number => typeof v === 'number'));
  const scale = Math.max(line?.value ?? 0, typeof refValue === 'number' ? refValue : 0, ...numbers) || 1;
  const at = (v: number) => `${(v / scale) * 100}%`;
  return (
    <figure className="r-figure">
      {title ? <p className="r-chart-title">{title}</p> : null}
      <Legend
        benchmark={benchmark}
        methods={bars}
        colour={colour}
        line={line}
        incumbent={reference && typeof refValue === 'number' ? `${reference.label} = ${show(refValue, { decimals })}` : undefined}
      />
      <div className="r-bars">
        {line ? <span className="r-bars-ref" style={{ left: at(line.value) }} aria-hidden="true" /> : null}
        {reference && typeof refValue === 'number' ? (
          <span className="r-bars-ref r-bars-ref--incumbent" style={{ left: at(refValue) }} aria-hidden="true" />
        ) : null}
        {rows.map((r) => (
          <div key={r.group} className="r-bars-group" role="group" aria-label={r.group}>
            <p className="r-bars-label">{r.group}</p>
            {bars
              .filter((m) => m.key in r.values)
              .map((m) => {
                const v = r.values[m.key];
                /* Null is an empty slot, never a bar of zero. */
                if (typeof v !== 'number') {
                  return (
                    <div key={m.key} className="r-bar-row r-bar-row--empty">
                      <span className="s-sr">
                        {methodLabel(benchmark, m.key)}: {show(v)}
                      </span>
                      <span className="r-bar-slot" style={{ borderColor: colour[m.key] }} aria-hidden="true" />
                    </div>
                  );
                }
                return (
                  <div key={m.key} className="r-bar-row">
                    <span className="s-sr">{methodLabel(benchmark, m.key)}:</span>
                    <span className="r-bar" style={{ width: at(v), background: colour[m.key] }} aria-hidden="true" />
                    <span className="r-val">{show(v, { decimals })}</span>
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
        {benchmark.metric.name}
        {/* The unit, unless the legend already gives the yardstick ("random search = 1.0"). */}
        {line ? '' : ` (${benchmark.metric.unit})`}. Lower is better.{measured ? '' : ` Values ${TO_BE_MEASURED}.`}
        {asOf ? ` As of ${asOf}.` : ''}
      </figcaption>
      {group || !measured ? null : <Folded benchmark={benchmark} shown={shown} folded={folded} />}
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
  /* Many methods over few rows read better turned on their side: one row per method. */
  if (methods.length > 6 && benchmark.results.length <= 3) {
    return (
      <div className="p-writings-table-scroll r-table r-table--turned" tabIndex={0} role="region" aria-label={`${benchmark.title}, table`}>
        <table>
          <thead>
            <tr>
              <th scope="col">{benchmark.metric.unit.length > 2 ? benchmark.metric.unit : ''}</th>
              {benchmark.results.map((r) => (
                <th key={r.group} scope="col">
                  {r.group}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {methods.map((m) => (
              <tr key={m.key}>
                <th scope="row" className={m.group === 'ours' ? 'r-col-model' : undefined}>
                  {methodLabel(benchmark, m.key)}
                </th>
                {benchmark.results.map((r) => {
                  const v = r.values[m.key];
                  return (
                    <td key={r.group} className={[m.group === 'ours' ? 'r-col-model' : '', v === null ? 'r-pending' : ''].join(' ').trim() || undefined}>
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

/**
 * "How this was measured", collapsed inline under each result (the Odyssey
 * pattern, 30 Oct 2026): the task, the data and its citation, the methods.
 */
export function BenchmarkAside({ benchmark }: { benchmark: Benchmark }) {
  const url = liveUrl(benchmark.dataset.url);
  const compared = release.methods
    ? methodsIn(benchmark)
        .filter((m) => m.group !== 'ours')
        .map((m) => m.name)
    : benchmark.baselines.map((b) => b.name);
  return (
    <Aside title="How this was measured">
      <p>{benchmark.task}</p>
      <p>
        {benchmark.dataset.name}.{' '}
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {benchmark.dataset.citation}
          </a>
        ) : (
          benchmark.dataset.citation
        )}
        . Compared with {compared.join(', ')}.
      </p>
    </Aside>
  );
}

/** A collapsed aside inside the narrative: method detail on request, not in the way of the story. */
export function Aside({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="r-aside">
      <summary>{title}</summary>
      <div className="r-aside-body">{children}</div>
    </details>
  );
}

/* A small drawing per landscape family, matched by its name; none for a name it does not know. */
const SHAPE_GLYPHS: [RegExp, ReactNode][] = [
  [/smooth/i, <path key="s" d="M4 30 C 18 30, 22 8, 36 8 S 54 26, 60 26" />],
  [/sharp|peak/i, <path key="p" d="M4 30 L 26 29 L 32 6 L 38 29 L 60 30" />],
  [/threshold|step/i, <path key="t" d="M4 28 L 28 28 L 28 10 L 60 10" />],
  [/fail|saturat/i, <path key="f" d="M4 30 L 18 30 C 26 30, 30 8, 40 8 L 60 8" />],
  [
    /noise|batch/i,
    <g key="n">
      {[[8, 24], [14, 18], [20, 22], [26, 14], [32, 17], [38, 11], [44, 15], [50, 9], [56, 13]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r={1.8} />
      ))}
    </g>,
  ],
  [
    /parameter|dimension/i,
    <g key="d">
      <path d="M8 30 L 8 6 M8 30 L 34 30 M8 30 L 24 18" />
      <path d="M40 30 L 40 6 M40 30 L 60 30 M40 30 L 52 20 M40 30 L 56 14 M40 30 L 48 10" />
    </g>,
  ],
];

/** The landscapes it is built for, as a grid of small drawings. */
export function ResponseShapes() {
  const { title, families } = release.response_shapes;
  return (
    <figure className="r-figure r-shapes">
      <p className="r-chart-title">{title}</p>
      <ul className="r-shapes-list">
        {families.map((f) => {
          const glyph = SHAPE_GLYPHS.find(([re]) => re.test(f.name))?.[1];
          return (
            <li key={f.name}>
              {glyph ? (
                <svg viewBox="0 0 64 36" aria-hidden="true">
                  {glyph}
                </svg>
              ) : null}
              <span className="r-shape-name">{f.name}</span>
              <span className="r-shape-text">{f.text}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

/**
 * One campaign, experiment by experiment: a line per method once measured
 * (series [{key, y[]}], a handful of methods), a framed slot until then.
 */
export function CampaignTrace() {
  const t = release.campaign_trace;
  const series = t.series ?? [];
  const W = 640;
  const H = 360;
  const pad = { l: 48, r: 16, t: 16, b: 40 };
  const n = Math.max(1, ...series.map((s) => s.y.length));
  const ymax = Math.max(1e-9, ...series.flatMap((s) => s.y));
  const px = (i: number) => pad.l + (i / Math.max(1, n - 1)) * (W - pad.l - pad.r);
  const py = (v: number) => H - pad.b - (v / ymax) * (H - pad.t - pad.b);
  const methods = series.map((s) => METHODS.find((m) => m.key === s.key) ?? { key: s.key, name: s.key, group: 'other' });
  const line = methods.find((m) => m.group === 'reference');
  const colour = colours(methods.filter((m) => m !== line));
  /* x ticks at round experiment counts: every 10 up to 50, else four steps. */
  const step = n <= 60 ? 10 : Math.ceil(n / 4 / 10) * 10;
  const xticks = series.length ? Array.from({ length: Math.floor(n / step) + 1 }, (_, i) => i * step).filter((x) => x > 0) : [];
  /* The model is drawn last, on top; random dashed. */
  const order = [...series].sort((a, b) => Number(a.key === 'model') - Number(b.key === 'model'));
  return (
    <figure className="r-figure r-trace">
      <p className="r-chart-title">{t.title}</p>
      {series.length ? (
        <ul className="r-legend">
          {methods.map((m) => (
            <li key={m.key}>
              <span className={m === line ? 'r-key r-key--ref' : 'r-key'} style={m === line ? undefined : { background: colour[m.key] }} aria-hidden="true" />
              {m.name}
            </li>
          ))}
        </ul>
      ) : null}
      {/* On a phone the plot keeps a readable width and scrolls sideways, as the tables do. */}
      <div className="r-trace-scroll">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${t.title}. ${t.problem}. ${series.length ? methods.map((m) => m.name).join(', ') : TO_BE_MEASURED}`}
        className={series.length ? 'r-trace-drawn' : undefined}
      >
        <line className="r-grid" x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} />
        <line className="r-grid" x1={pad.l} x2={pad.l} y1={pad.t} y2={H - pad.b} />
        {xticks.map((x) => (
          <text key={x} className="r-axis" x={px(x - 1)} y={H - pad.b + 14} textAnchor="middle">
            {x}
          </text>
        ))}
        <text className="r-axis" x={(W + pad.l) / 2} y={H - 8} textAnchor="middle">
          {t.x_label}
        </text>
        <text className="r-axis" transform={`translate(14 ${(H - pad.b + pad.t) / 2}) rotate(-90)`} textAnchor="middle">
          {t.y_label}
        </text>
        {series.length ? (
          order.map((s) => {
            const m = methods.find((x) => x.key === s.key);
            return (
              <polyline
                key={s.key}
                className={m === line ? 'r-cov-line r-trace-ref' : 'r-cov-line'}
                stroke={m === line ? 'var(--c-ink)' : colour[s.key]}
                points={s.y.map((v, i) => `${px(i)},${py(v)}`).join(' ')}
              />
            );
          })
        ) : (
          <text className="r-axis r-trace-pending" x={(W + pad.l) / 2} y={(H - pad.b + pad.t) / 2} textAnchor="middle">
            [{TO_BE_MEASURED}]
          </text>
        )}
      </svg>
      </div>
      <figcaption data-kind="Benchmark">{t.problem}</figcaption>
    </figure>
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
  const record = (r: Record<string, string | number | boolean>) =>
    Object.entries(r)
      .filter(([k]) => k !== 'standin')
      .map(([k, v]) => [human(k), String(v)] as const);
  /* No training rows (founder, 30 Oct 2026: no training details on the page). */
  const sections: [string, ReactNode][] = [
    ['Model', <>{release.model.name} {release.model.version}. {release.model.status}</>],
    ['Type', d.type],
    ['Inputs', d.inputs],
    ['Outputs', <List key="o" items={d.outputs} />],
    ['Intended use', <List key="u" items={card.intended_use} />],
    ['Operating envelope', <List key="e" items={record(card.operating_envelope).map(([k, v]) => `${k}: ${v}`)} />],
    ['Evaluation', card.evaluation_summary],
    ['License', card.license],
    ['Citation', card.citation],
  ];
  return (
    <details className="r-card">
      {/* The section's heading already says "Model card". */}
      <summary>
        Open the card <span>{release.model.name} {release.model.version}</span>
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
