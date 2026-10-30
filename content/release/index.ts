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

export type MethodKey = 'model' | 'bo_gp' | 'tabpfn' | 'random' | 'bo_gp_published' | 'fsbo_published';
export type Cell = number | string | null | number[];

export type Benchmark = {
  id: string;
  title: string;
  question: string;
  task: string;
  dataset: { name: string; citation: string; url: string };
  baselines: { name: string; settings: string }[];
  metric: { name: string; direction: string; unit: string };
  runs: string;
  results: { group: string; values: Partial<Record<MethodKey, Cell>> }[];
  paired?: ({ comparison: string } & Record<string, string>)[];
  spread?: string;
  scope: string;
  caveats: string[];
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
      parameters: string;
      architecture: string;
      inputs: string;
      outputs: string[];
      standin: boolean;
    };
    training_data: {
      summary: string;
      task_families: string[];
      variation_in_training: string[];
      standin: boolean;
    };
    intended_use: string[];
    out_of_scope: string[];
    operating_envelope: Record<string, string | number | boolean>;
    training_compute: Record<string, string | boolean>;
    evaluation_summary: string;
    license: string;
    citation: string;
  };
  headline_candidates: Headline[];
  benchmarks: Benchmark[];
  capabilities: { name: string; text: string; evidence?: string }[];
  limitations: string[];
};

/* JSON imports are typed by their literal shape; the file is checked against ReleaseData by hand (schema_version 1). */
export const release = data as unknown as ReleaseData;

/** The page's address. Proposed, not yet chosen (the model's name is a placeholder). */
export const RELEASE_PATH = '/writings/introducing-model-name';
export const RELEASE_SLUG = 'introducing-model-name';

/** Display names for the methods, as the data file names its baselines. */
export const METHOD_LABEL: Record<MethodKey, string> = {
  model: release.model.name,
  bo_gp: 'Bayesian optimisation (GP)',
  tabpfn: 'TabPFN v2.5',
  random: 'Random search',
  bo_gp_published: 'GP, HPO-B published',
  fsbo_published: 'FSBO, published',
};

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
  const places = (v: number) => (Number.isInteger(v) ? 0 : String(v).split('.')[1]?.length ?? 0);
  return Math.max(
    0,
    ...benchmark.results.flatMap((r) =>
      Object.values(r.values).flatMap((v) => (typeof v === 'number' ? [places(v)] : Array.isArray(v) ? v.map(places) : [])),
    ),
  );
}

/** A method's name in one benchmark: its own baseline name for random (search or ranking). */
export function methodLabel(benchmark: Benchmark, key: MethodKey): string {
  if (key === 'random') return benchmark.baselines.find((b) => /^random/i.test(b.name))?.name ?? METHOD_LABEL.random;
  return METHOD_LABEL[key];
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
