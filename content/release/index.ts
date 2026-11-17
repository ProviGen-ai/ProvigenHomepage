/*
 * The model release page's data (draft, 30 Oct 2026). announcement.json is the
 * one file a release swaps: version, date, model card, every benchmark figure,
 * capabilities and limitations. It comes publication-safe from the model team;
 * the page reads every number from it, including the numbers inside sentences
 * (fill() below), so no figure is written into the page's prose.
 *
 * While any entry has standin: true, the page shows itself as a draft and marks
 * each figure with its measured_on. A null value renders as "to be measured",
 * never as a number. Placeholders in square brackets ([MODEL NAME], v[VERSION],
 * [TBD]) are listed by placeholders() so none survives a release unnoticed.
 */
import data from './announcement.json';
import cubeRunIndex from './cube-runs/index.json';
// import raceRunIndex from './cube-runs/direct/index.json';
/* The race by estimated moves remaining (15 Nov 2026). */
import raceRunIndex from './cube-runs/estimate/index.json';

/** A method's key in the result rows ("model", "bo_gp", "tabpfn_v2_5", ...). */
export type MethodKey = string;

/**
 * A compared method, in display order. `group` drives colour and folding:
 * "ours", "tabpfn", "bo", "doe", "reference" (random: drawn as a dashed line
 * where it is the chart's yardstick), anything else drawn neutral.
 */
export type Method = { key: MethodKey; name: string; group: string };
export type Cell = number | string | null | number[];

export type Benchmark = {
  id: string;
  title: string;
  question: string;
  task: string;
  dataset: { name: string; citation: string; url: string };
  baselines: { name: string; settings?: string }[];
  metric: { name: string; direction: string; unit: string };
  results: { group: string; values: Partial<Record<MethodKey, Cell>> }[];
  paired?: { comparison: string; result: string }[];
  /* Dropped from the data file on 30 Oct 2026 (founder: no hedging, no caveats,
     few insider details); optional so a later file may bring them back. */
  runs?: string;
  spread?: string;
  scope?: string;
  caveats?: string[];
  measured_on: string;
  standin: boolean;
  not_measured_yet?: boolean;
  /** Which section shows it; without it, see sectionOf(). */
  section?: 'results' | 'real_lab';
  /** The heading as a claim, shown instead of `title` only when `title_holds` is true. */
  claim_title?: string;
  title_holds?: boolean | null;
};

export type Headline = {
  id: string;
  text_template: string;
  values: Record<string, number | string | null>;
  benchmark: string;
  standin: boolean;
  not_measured_yet?: string;
};

export type ReleaseData = {
  schema_version: number;
  notes: string[];
  model: {
    name: string;
    version: string;
    release_date: string | null;
    status: string;
    one_line: string;
    /** What the name stands for (SDM: sequential decision model). */
    full_name?: string;
    standin: boolean;
  };
  model_card: {
    model_details: {
      type: string;
      parameters?: string;
      architecture?: string;
      inputs: string;
      outputs: string[];
      standin: boolean;
    };
    /* Off the page and out of the data file since 30 Oct 2026 (founder: no training details). */
    training_data?: {
      summary: string;
      task_families?: string[];
      variation_in_training: string[];
      standin: boolean;
    };
    intended_use: string[];
    out_of_scope?: string[];
    operating_envelope: Record<string, string | number | boolean>;
    training_compute?: Record<string, string | boolean>;
    evaluation_summary: string;
    license: string;
    citation: string;
  };
  /** Every method the results compare, in display order (from the data file since 30 Oct 2026). */
  methods?: Method[];
  headline_candidates: Headline[];
  benchmarks: Benchmark[];
  capabilities: { name: string; text: string; evidence?: string }[];
  /** What the model makes possible in a lab: descriptive, no figures. */
  enables: { title: string; text: string }[];
  limitations?: string[];
  /* The revamp after the survey of launch posts (30 Oct 2026). */
  copy: {
    kicker: string;
    section_titles: Record<'why' | 'category' | 'how' | 'results' | 'real_lab' | 'enables' | 'handles' | 'faq' | 'model_card' | 'cta', string>;
    results_intro_template: string;
    results_intro_values: Record<string, number | string | null>;
    cta_text: string;
  };
  takeaways: Templated[];
  category_explainer: { title: string; text: string };
  response_shapes: { title: string; families: { name: string; text: string }[] };
  summary_chart: {
    benchmark: string;
    group: string;
    reference: { key: string | null; label_template: string };
    title_template: string;
    /** The conclusion is shown as the chart's title only when true. */
    title_holds: boolean | null;
    as_of: string | null;
  };
  campaign_trace: {
    title: string;
    problem: string;
    x_label: string;
    y_label: string;
    /** One line per method, experiment by experiment; null until measured. */
    series: { key: string; y: number[] }[] | null;
  };
  asides: { anchor: string; title: string; text: string }[];
  faq: { q: string; a: string }[];
  /** The benchmarks tab: a few metrics, each a small table of SDM-1 against Bayesian optimization. */
  benchmark_overview?: BenchmarkOverview;
  /** Rows added after the first table (the model team, 15 Nov 2026: chemistry and materials), kept apart so the backup
      page's table stays as it was; the comparison page merges them in. Per metric id, the new rows. */
  /** The model card section's text on the comparison page (16 Nov 2026), over model.one_line and model_card's. */
  /** The comparison page's copy over `copy` (16 Nov 2026). */
  copy_added?: { note?: string; cta_text?: string };
  model_card_text?: {
    note?: string;
    one_line?: string;
    intended_use?: string[];
    evaluation_summary?: string;
    operating_envelope?: Record<string, string>;
    inputs?: string;
    outputs?: string[];
    access?: string;
  };
  benchmark_overview_added?: {
    note?: string;
    n_note?: string;
    /** A rough overview of the Bayesian optimization compared against (founder, 16 Nov 2026), under the table. */
    bo_note?: string;
    /** The table's order of benchmarks by id (founder, 16 Nov 2026: lab benchmarks right after the standard functions); ids not listed go last. */
    order?: string[];
    /** Benchmarks kept in the data but not shown (founder, 16 Nov 2026: EDBO and Liang shown as one pooled row). */
    hidden?: string[];
    /** Per metric id, the vs-BO text of an original row changed on the comparison page (founder, 16 Nov 2026: HPO-B 71% vs 72% reads as equal). */
    row_vs?: Record<string, { benchmark: string; n: number; vs_bo: string }[]>;
    /** Per benchmark id, its table text changed on the comparison page; citation null drops the footnote (and its
        link, which the benchmark's card carries instead; founder, 16 Nov 2026). */
    benchmark_text?: Record<string, { name?: string; detail?: string; citation?: null }>;
    batch_note?: string;
    /** `before`: placed just before that benchmark instead of at the end (founder, 16 Nov 2026: Bayesmark before HPO-B). */
    benchmarks: (BenchmarkOverview['benchmarks'][number] & { before?: string })[];
    rows: Record<string, BenchmarkOverview['metrics'][number]['rows']>;
    /** A metric's wording, corrected for the merged table (the model team, 15 Nov 2026: top 1% of the candidates). */
    metric_text?: Record<string, { name?: string; explain?: string; explain_brief?: string }>;
  };
  /** The highlights grid, if the data file sets it; otherwise the page builds it from the fields above. */
  highlights?: { value_template: string; values: Record<string, number | string | null>; label: string }[];
  /**
   * The cube demo (founder, 13 Nov 2026): settings, and whether the model
   * team's test holds, so the cube and its reveal may appear on the
   * published page. Absent, the defaults below apply and both stay hidden.
   */
  cube_demo?: CubeDemo;
  /**
   * The model pointed at its own pipeline (founder, 31 Oct 2026): one result
   * per target, a closing line. Nothing appears until `holds` is true.
   */
  self_optimization?: SelfOptimization;
  /** Shown inside the results aside only when `holds` is true; while null it does not appear at all. */
  contamination?: { title: string; text_template: string; values: Record<string, number | string | null>; holds: boolean | null; anchor: string };
};

export type BenchmarkOverview = {
  note?: string;
  n_note: string;
  /** The batch size each benchmark ran at (founder, 14 Nov 2026), shown after n_note on the comparison page's grid. */
  batch_note?: string;
  benchmarks: { id: string; name: string; detail: string; citation?: string; url?: string }[];
  metrics: {
    id: string;
    name: string;
    explain: string;
    /** One short sentence, shown bold on the comparison page (founder, 15 Nov 2026). */
    explain_brief?: string;
    better: 'higher' | 'lower';
    unit: string;
    rows: { benchmark: string; n: number; model: number; bo: number; vs_bo: string }[];
  }[];
  standin?: boolean;
};

export type CubeDemo = {
  holds: boolean | null;
  scramble_depth: number;
  /** Calls for level 1 (discover building blocks) and level 2 (solve with them). */
  discover_calls: number;
  solve_calls: number;
  batch: number;
  /** Building blocks level 1 keeps for level 2. */
  keep: number;
  /** One sentence with the test's figures, filled from values; shown under the reveal once it holds. */
  result_template?: string;
  values?: Record<string, number | string | null>;
};

const CUBE_DEFAULTS: CubeDemo = { holds: null, scramble_depth: 8, discover_calls: 20, solve_calls: 60, batch: 8, keep: 4 };

/**
 * The highlights grid (founder, 13 Nov 2026, after the big-figure grids of
 * other launch pages): the data file's `highlights`, else four or five
 * figures read from the fields that already carry them, each label restating
 * the sentence its figure comes from. A figure whose field is missing or
 * null is left out, never shown as a slot.
 */
export function highlights(): { value: string; label: string }[] {
  if (release.highlights?.length)
    return release.highlights.map((h) => ({ value: fill({ text_template: h.value_template, values: h.values }), label: h.label }));
  const items: { value: string; label: string }[] = [];
  const h = (id: string) => release.headline_candidates.find((x) => x.id === id);
  const abrupt = h('abrupt_vs_bo');
  if (abrupt && typeof abrupt.values.wins === 'number')
    items.push({
      value: `${abrupt.values.wins} of ${abrupt.values.runs}`,
      label: 'benchmark campaigns with sharp optima and abrupt changes where it beat standard Bayesian optimization',
    });
  const random = h('beats_random');
  if (random && typeof random.values.pct === 'number')
    items.push({ value: show(random.values.pct, { percent: true }), label: 'of benchmark campaigns where it beat random search' });
  const fewer = h('fewer_experiments');
  if (fewer && fewer.values.factor !== null && fewer.values.factor !== undefined)
    items.push({
      value: `${show(fewer.values.factor)}x`,
      label: 'faster than random screening to half of the best 5% of formulations, on a published cell-free campaign',
    });
  /* "18 vs 147 experiments" in the discovery table becomes 147 → 18. */
  const discovery = release.benchmarks.find((b) => b.id === 'discovery_cellfree');
  const top1 = discovery?.results.find((r) => /top 1%/i.test(r.group));
  const m = typeof top1?.values.model === 'string' ? top1.values.model.match(/\(([\d.]+) vs ([\d.]+) experiments\)/) : null;
  if (m)
    items.push({
      value: `${m[2]} → ${m[1]}`,
      label: `experiments to find every one of the best 1% of formulations (${top1!.group.replace(/^.*\((.*)\).*$/, '$1')}): random screening, then ${release.model.name}`,
    });
  const campaigns = release.copy.results_intro_values.campaigns;
  if (typeof campaigns === 'number')
    items.push({ value: show(campaigns), label: 'optimization campaigns, every method from the same starting experiments' });
  return items;
}

/**
 * Whether the try-it panel appears: always (the user, 17 Nov 2026). It plays the recorded runs
 * (content/release/try-runs/ridged.json) and asks the model for nothing, so nothing about it depends on an endpoint.
 *
 * Was `process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_SDM_LIVE === '1'`, from when the panel called
 * the model live: on a published page it hid the panel, and with it the landscape sticker in Application Areas, unless
 * that flag was set, while the flag's name said "live" and by then meant "show recordings". NEXT_PUBLIC_SDM_LIVE still
 * decides whether lib/sdm/client.ts calls the API at all, which the panel no longer does while a recording is passed.
 */
export const showTry = true;

export type SelfOptimization = {
  title: string;
  intro: string;
  results: { target: string; metric: string; value: number | string | null }[];
  closing: string;
  holds: boolean | null;
};

/** Any sentence with {placeholders} and their values. */
export type Templated = { text_template: string; values: Record<string, number | string | null>; benchmark?: string };

/* JSON imports are typed by their literal shape; the file is checked against ReleaseData by hand (schema_version 1). */
export const release = data as unknown as ReleaseData;

/** The page's address. Proposed, not yet chosen (the model's name is a placeholder). */
export const RELEASE_PATH = '/writings/introducing-model-name';
export const RELEASE_SLUG = 'introducing-model-name';
/** The address the page will have once merged and public (founder, 17 Nov 2026): on main, Writings became Blog, and
    the slug is the model's name. The route here stays at RELEASE_PATH until the merge, which moves the page folder to
    app/blog/introducing-sdm-1 and points main's /writings/introducing-model-name redirect there. */
export const RELEASE_PUBLIC_PATH = '/blog/introducing-sdm-1';
/** The day the release page carries, shared by the page and the landing page's banner (17 Nov 2026). */
export const RELEASE_DATE = '2026-11-17';

/* A data file without `methods` (schema of 30 Oct 2026, morning) names its
   methods by these keys. */
const LEGACY_METHODS: Method[] = [
  { key: 'model', name: release.model.name, group: 'ours' },
  { key: 'tabpfn', name: 'TabPFN v2.5', group: 'tabpfn' },
  { key: 'bo_gp', name: 'Bayesian optimization (GP)', group: 'bo' },
  { key: 'bo_gp_published', name: 'GP, HPO-B published', group: 'bo' },
  { key: 'fsbo_published', name: 'FSBO, published', group: 'other' },
  { key: 'random', name: 'Random search', group: 'reference' },
];

/** The methods in display order: the data file's list, else the legacy names. */
export const METHODS: Method[] = release.methods ?? LEGACY_METHODS;

/** Display name by key. */
export const METHOD_LABEL: Record<MethodKey, string> = Object.fromEntries(METHODS.map((m) => [m.key, m.name]));

/**
 * The methods one benchmark reports, in display order. Only keys present in
 * at least one result row; a key the methods list does not know is appended
 * under its own key, so no number is ever silently dropped.
 */
export function methodsIn(benchmark: Benchmark): Method[] {
  const present = new Set(benchmark.results.flatMap((r) => Object.keys(r.values)));
  const known = METHODS.filter((m) => present.has(m.key));
  const unknown = [...present].filter((k) => !METHODS.some((m) => m.key === k)).map((key) => ({ key, name: key, group: 'other' }));
  return [...known, ...unknown];
}

/**
 * Which value is best for this benchmark's metric: lower, higher, or (rows of
 * shares against nominal levels) closest to nominal. Undefined when the
 * direction is mixed, e.g. "higher; closest to 80%".
 */
function scoreOf(benchmark: Benchmark, key: MethodKey, nominal?: number[]): number | undefined {
  const dir = benchmark.metric.direction.toLowerCase();
  if (dir.includes(';')) return undefined;
  const scores = benchmark.results.flatMap((r) => {
    const v = r.values[key];
    if (typeof v === 'number') {
      if (/^lower\b/.test(dir)) return [v];
      if (/^higher\b/.test(dir)) return [-v];
      return [];
    }
    if (Array.isArray(v) && nominal && /^closest\b/.test(dir)) return [v.reduce((sum, x, i) => sum + Math.abs(x - nominal[i]), 0) / v.length];
    return [];
  });
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;
}

/**
 * The methods a chart draws: every method present, except that a group with
 * several versions (TabPFN) shows only its best one for this benchmark; the
 * others are returned as `folded`, for a table under the chart.
 */
export function chartMethods(benchmark: Benchmark, { nominal, foldGroups = ['tabpfn'] }: { nominal?: number[]; foldGroups?: string[] } = {}) {
  const all = methodsIn(benchmark);
  const folded: Method[] = [];
  for (const group of foldGroups) {
    const members = all.filter((m) => m.group === group);
    if (members.length < 2) continue;
    const scored = members.map((m) => ({ m, s: scoreOf(benchmark, m.key, nominal) }));
    const best = scored.every((x) => x.s !== undefined)
      ? scored.reduce((a, b) => ((b.s as number) < (a.s as number) ? b : a)).m
      : members[0];
    folded.push(...members.filter((m) => m !== best));
  }
  return { shown: all.filter((m) => !folded.includes(m)), folded };
}

export const TO_BE_MEASURED = 'to be measured';

/** A value for display: shares as percentages, integers as they are, null as "to be measured". */
export function show(value: Cell | undefined, { percent = false, decimals }: { percent?: boolean; decimals?: number } = {}): string {
  if (value === null || value === undefined) return TO_BE_MEASURED;
  if (Array.isArray(value)) return value.map((v) => show(v, { percent, decimals })).join(' / ');
  if (typeof value === 'string') return value;
  if (percent) return `${Math.round(value * 100)}%`;
  if (decimals !== undefined) return value.toFixed(decimals);
  /* Thousands as the rest of the page writes them: 1,650. */
  return Number.isInteger(value) ? value.toLocaleString('en-GB') : String(value);
}

/**
 * JSON drops trailing zeros (0.730 arrives as 0.73), so a table or chart sets
 * all its numbers to the most decimals any of them carries.
 */
export function decimalsOf(benchmark: Benchmark): number {
  /* toPrecision(12) drops float noise from computed values (0.30000000000000004). */
  const places = (v: number) => (Number.isInteger(v) ? 0 : String(Number(v.toPrecision(12))).split('.')[1]?.length ?? 0);
  return Math.max(
    0,
    ...benchmark.results.flatMap((r) =>
      Object.values(r.values).flatMap((v) => (typeof v === 'number' ? [places(v)] : Array.isArray(v) ? v.map(places) : [])),
    ),
  );
}

/**
 * A method's name in one benchmark. Without a methods list in the data file,
 * random takes the benchmark's own baseline name (search, ranking, screening).
 */
export function methodLabel(benchmark: Benchmark, key: MethodKey): string {
  if (!release.methods && key === 'random') return benchmark.baselines.find((b) => /^random/i.test(b.name))?.name ?? METHOD_LABEL.random;
  return METHOD_LABEL[key] ?? key;
}

/** Template keys whose values are shares of 1 and read as percentages. */
const PERCENT_KEY = /^(pct|cov\d+|gp_cov\d+)$/;

/** A section heading, verbatim from the data file. */
export const sectionTitle = (key: keyof ReleaseData['copy']['section_titles']) => release.copy.section_titles[key];

/** The collapsed aside for a section, if the data file has one. */
export const aside = (anchor: string) => release.asides.find((a) => a.anchor === anchor);

/** A headline's sentence with its values filled in from the data file. */
export function fill(headline: Templated | Headline): string {
  return headline.text_template.replace(/\{(\w+)\}(x?)/g, (_, key: string, times: string) => {
    const value = headline.values[key];
    /* A missing factor reads "[to be measured]", not "to be measuredx". */
    if (value === null || value === undefined) return `[${TO_BE_MEASURED}]`;
    return show(value, { percent: PERCENT_KEY.test(key) }) + times;
  });
}

export const headline = (id: string) => {
  const found = release.headline_candidates.find((h) => h.id === id);
  if (!found) throw new Error(`release: no headline "${id}" in announcement.json`);
  return found;
};

export const benchmark = (id: string) => {
  const found = release.benchmarks.find((b) => b.id === id);
  if (!found) throw new Error(`release: no benchmark "${id}" in announcement.json`);
  return found;
};

/** The cube's settings: the data file's, else defaults until the model team's test sets them. */
export const cubeDemo: CubeDemo = { ...CUBE_DEFAULTS, ...release.cube_demo };

/**
 * Whether the cube and its reveal appear. The cube replays recorded runs of
 * the model (components/release/cube/recording.ts, 13 Nov 2026), so it needs
 * no endpoint. On the published page only once the test holds and every
 * stored run comes from the model, not the mock: the reveal says the model
 * solved it. In development always (a mock run then says "Mock model").
 */
const cubeRunsFromModel = cubeRunIndex.length > 0 && cubeRunIndex.every((r) => r.model !== 'mock');
export const showCube = process.env.NODE_ENV !== 'production' || (cubeDemo.holds === true && cubeRunsFromModel);

/**
 * The same gate for the cube race (comparison page, 14 Nov 2026): on a production build only when every race run
 * (cube-runs/estimate/ since 15 Nov 2026, was cube-runs/direct/; all three methods) was recorded against the model (the
 * served endpoint, or the same model run locally). A mock recording never ships.
 */
const raceRunsFromModel = raceRunIndex.length > 0 && raceRunIndex.every((r) => r.model !== 'mock');
export const showRace = process.env.NODE_ENV !== 'production' || (cubeDemo.holds === true && raceRunsFromModel);

/**
 * The self-optimization section, only once the data file carries it and its
 * results hold. No wording lives in this repo until then: it would claim an
 * experiment that has not finished, and the repo is public.
 */
export const selfOptimization: SelfOptimization | undefined = (() => {
  const so = release.self_optimization;
  return so?.holds === true ? { ...so, intro: so.intro.replace('[MODEL NAME]', release.model.name) } : undefined;
})();

/** A benchmark's heading: its claim once that holds, else its neutral title. */
export const benchmarkTitle = (b: Benchmark) => (b.title_holds === true && b.claim_title ? b.claim_title : b.title);

/* Benchmarks on real lab data before the data file carried `section`. */
const REAL_LAB_IDS = ['cellfree_rerank', 'discovery_cellfree'];

/** The section a benchmark belongs to: its own `section`, else results (the lab ones by id). */
export const sectionOf = (b: Benchmark): 'results' | 'real_lab' => b.section ?? (REAL_LAB_IDS.includes(b.id) ? 'real_lab' : 'results');

/** True while any figure on the page is a stand-in: the page then shows itself as a draft. */
export const isDraft = JSON.stringify(release).includes('"standin":true');

/** Placeholders still in the data file, e.g. [MODEL NAME], [TBD]. */
export const placeholders = () => [...new Set(JSON.stringify(release).match(/\[(?:[A-Z][A-Z ]*|TBD[^\]"]*)\]/g) ?? [])];

/** A link only for a real address; "[TBD]" stays plain text. */
export const liveUrl = (url: string) => (/^https?:\/\//.test(url) ? url : undefined);
