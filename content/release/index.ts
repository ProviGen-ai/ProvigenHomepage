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
};

export type Headline = {
  id: string;
  text_template: string;
  values: Record<string, number | null>;
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
    training_data: {
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
};

/* JSON imports are typed by their literal shape; the file is checked against ReleaseData by hand (schema_version 1). */
export const release = data as unknown as ReleaseData;

/** The page's address. Proposed, not yet chosen (the model's name is a placeholder). */
export const RELEASE_PATH = '/writings/introducing-model-name';
export const RELEASE_SLUG = 'introducing-model-name';

/* A data file without `methods` (schema of 30 Oct 2026, morning) names its
   methods by these keys. */
const LEGACY_METHODS: Method[] = [
  { key: 'model', name: release.model.name, group: 'ours' },
  { key: 'tabpfn', name: 'TabPFN v2.5', group: 'tabpfn' },
  { key: 'bo_gp', name: 'Bayesian optimisation (GP)', group: 'bo' },
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
  return decimals === undefined ? String(value) : value.toFixed(decimals);
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

/** A headline's sentence with its values filled in from the data file. */
export function fill(headline: Headline): string {
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

/** True while any figure on the page is a stand-in: the page then shows itself as a draft. */
export const isDraft = JSON.stringify(release).includes('"standin":true');

/** Placeholders still in the data file, e.g. [MODEL NAME], [TBD]. */
export const placeholders = () => [...new Set(JSON.stringify(release).match(/\[(?:[A-Z][A-Z ]*|TBD[^\]"]*)\]/g) ?? [])];

/** A link only for a real address; "[TBD]" stays plain text. */
export const liveUrl = (url: string) => (/^https?:\/\//.test(url) ? url : undefined);
