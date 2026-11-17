import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import BenchmarkOverview from '@/components/release/BenchmarkOverview';
import CfeValue from '@/components/release/CfeValue';
import DecisionTree from '@/components/release/DecisionTree';
/* import PaperBand from '@/components/release/PaperBand'; (the banner, set aside for small pieces, 14 Nov 2026) */
import PaperPiece, { type PieceKind, type PieceShape } from '@/components/release/PaperPiece';
/* import TexturedMark from '@/components/release/TexturedMark'; (the stamp, set aside) */
// import CubeLive from '@/components/release/cube/CubeLive'; (the single cube, commented out below)
import CubeRace from '@/components/release/cube/CubeRace';
import { ModelCard } from '@/components/release/ReleaseParts';
import Showcases, { type Showcase } from '@/components/release/Showcases';
import TryPanel, { type TryRecording } from '@/components/release/try/TryPanel';
/* Try it, recorded (founder, 16 Nov 2026: what visitors see is precomputed): scripts/try-job.mjs. */
import tryRidged from '@/content/release/try-runs/ridged.json';
import { ArrowIcon } from '@/components/site/Header';
import { RELEASE_PATH, release, showRace, showTry } from '@/content/release';
import '../writings.css';
import './release.css';

/*
 * The release page (16 Nov 2026, fifth copy): the founder's revisions, first worked out on the comparison page
 * (introducing-model-name-v2) and promoted here, as a backup of its current state. The page as it was before is kept,
 * not rendered, in _page-before-2026-11-16.tsx (older ones in _page-before-2026-11-15d.tsx, _page-before-2026-11-15c.tsx,
 * _page-before-2026-11-15b.tsx, _page-before-2026-11-15.tsx, _page-before-2026-11-14b.tsx and _page-before-2026-11-14.tsx).
 * Further revisions are tried on the comparison page first.
 */

/*
 * COMPARISON PAGE (13 Nov 2026): the release page with the founder's
 * revisions, side by side with /writings/introducing-model-name, which stays
 * as it was. Differences: no tab numbers and no "See it work" heading; the
 * cube says less (no recorded-run line, no sentences in its cards); a new
 * "Lab campaign" tab puts the value of fewer experiments on Olsen et al.'s
 * published campaign (components/release/CfeValue.tsx). Hidden like the
 * original: noindex, in no list.
 *
 * The original's notes follow.
 *
 * The SDM-1 launch page, a hidden draft (13 Nov 2026, founder's outline). One
 * page that walks a visitor through the announcement:
 *   1. what is released: SDM-1, a sequential decision model;
 *   2. why: optimization problems everywhere, and black-box optimization when
 *      nothing is known in advance; where it applies, with a biopharma and a
 *      chemicals example;
 *   3. three showcases as tabs: the Rubik's cube SDM-1 solves live, the
 *      hidden landscape to try yourself against DoE, Bayesian optimization and
 *      SDM-1, and the benchmark overview;
 *   4. one way in; questions and the model card folded at the end.
 * Short statements, little text (founder: "less text but clearer statements").
 * Every figure comes from content/release/announcement.json. The earlier
 * long-form page is kept, not rendered, in _longform.tsx.
 *
 * Not in the writings ledger, so in no list, sitemap or feed; noindex below.
 */

const { model } = release;

export const metadata: Metadata = {
  ...pageMetadata({
    title: `Introducing ${model.name}`,
    description: model.one_line,
    path: RELEASE_PATH,
    type: 'article',
  }),
  robots: { index: false, follow: false },
};

/* Where black-box optimization applies: classes of problems, not single examples (founder, 14 Nov 2026). */
/* Each field with a small paper tile in a texture that stands for it (founder, 14 Nov 2026). */
/* Each field framed by a paper silhouette of its industry, loosely placed beside it (founder, 14 Nov 2026). */
const FIELDS: { field: string; items: string[]; texture: PieceKind; seed: number; shape: PieceShape }[] = [
  { field: 'Biopharma', items: ['Culture media', 'Antibody production', 'LNP formulation'], texture: 'cells', seed: 31, shape: 'antibody' },
  { field: 'Chemicals', items: ['Reaction conditions', 'Catalysts', 'Solvent selection'], texture: 'marble', seed: 32, shape: 'flask' },
  /* Folded into Biopharma (founder, 14 Nov 2026): assay development moved there; formulation is covered by LNPs.
  { field: 'Formulation', example: 'Coatings, buffers, emulsions' },
  { field: 'Assay development', example: 'Assay conditions, sensitivity, robustness' }, */
  { field: 'Manufacturing', items: ['Injection molding', '3D printing', 'Semiconductor fabrication'], texture: 'charcoal', seed: 33, shape: 'gear' },
  { field: 'Machine learning', items: ['Hyperparameter tuning', 'Architecture search', 'Data mixtures'], texture: 'leaf', seed: 34, shape: 'network' },
  { field: 'Software infrastructure', items: ['Resource allocation', 'Load balancing', 'Database tuning'], texture: 'strata', seed: 35, shape: 'rack' },
];

/**
 * SDM-1's largest lead over Bayesian Optimization in the benchmark table's score rows (every benchmark, after 25
 * and 50 experiments): the highest of the table's "vs BO" figures (founder, 13 Nov 2026: "by up to"). The table
 * right below shows every row, the one where BO leads included.
 */
function boLead(overview: NonNullable<typeof release.benchmark_overview>) {
  const rows = overview.metrics.find((m) => m.id === 'score')?.rows ?? [];
  if (!rows.length) return 0;
  /* The table's own "vs BO" figures (e.g. "+40%", "−6%"), so the claim and the table always say the same. */
  return Math.max(...rows.map((r) => Number(r.vs_bo.replace('\u2212', '-').replace(/[^\d.-]/g, ''))));
}

/* The recording plays back when it comes from the model server; a mock recording (made before the real one) plays
   only where the page runs on the mock anyway (not live), so a deploy never shows mock runs as the model's. */
const tryRuns = tryRidged as unknown as TryRecording; /* JSON arrays read as number[][]; each run is [a, b, value] */
const tryRecording: TryRecording | undefined =
  tryRuns.source === 'model server' || process.env.NEXT_PUBLIC_SDM_LIVE !== '1' ? tryRuns : undefined;

export default function ReleasePage() {
  /* const open = placeholders(); (the draft notice is commented out below) */
  /* const overview = release.benchmark_overview; */
  /* The table with the chemistry and materials rows merged in (the model team, 15 Nov 2026). A metric without numbers
     for a new benchmark leaves it out of that metric's table. */
  const added = release.benchmark_overview_added;
  const base = release.benchmark_overview;
  const overview =
    base && added
      ? {
          ...base,
          n_note: added.n_note ?? base.n_note,
          batch_note: added.batch_note ?? base.batch_note,
          /* benchmarks: [...base.benchmarks, ...added.benchmarks], */
          /* Each added benchmark at the end, or just before the one its `before` names. */
          benchmarks: added.benchmarks.reduce(
            (list, { before, ...b }) => {
              const at = before ? list.findIndex((x) => x.id === before) : -1;
              return at < 0 ? [...list, b] : [...list.slice(0, at), b, ...list.slice(at)];
            },
            /* [...base.benchmarks], */
            /* The original benchmarks with their changed table text, if any. */
            base.benchmarks.map((b) => {
              const text = added.benchmark_text?.[b.id];
              if (!text) return b;
              const { citation, ...rest } = text;
              const out = { ...b, ...rest };
              if (citation === null) {
                delete out.citation;
                delete out.url;
              }
              return out;
            }),
          )
          /* Then the stated order, where the data file gives one (founder, 16 Nov 2026). */
          .map((b, i) => ({ b, i, at: added.order?.indexOf(b.id) ?? -1 }))
          .sort((x, y) => (x.at < 0 ? 1e9 + x.i : x.at) - (y.at < 0 ? 1e9 + y.i : y.at))
          .map(({ b }) => b),
          /* metrics: base.metrics.map((m) => ({ ...m, ...added.metric_text?.[m.id], rows: [...m.rows, ...(added.rows[m.id] ?? [])] })), */
          metrics: base.metrics.map((m) => ({
            ...m,
            ...added.metric_text?.[m.id],
            rows: [
              ...m.rows.map((r) => {
                const vs = added.row_vs?.[m.id]?.find((o) => o.benchmark === r.benchmark && o.n === r.n)?.vs_bo;
                return vs ? { ...r, vs_bo: vs } : r;
              }),
              ...(added.rows[m.id] ?? []),
            ],
          })),
        }
      : base;

  const showcases: Showcase[] = [
    ...(showRace
      ? [
          {
            id: 'cube',
            label: "Rubik's cube",
            /* The race (founder, 14 Nov 2026): three methods on the same scrambled cube, scored the same way. The single
               cube with its discovery level stays below, unused, for comparison. */
            content: (
              <>
                <CubeRace
                  label="Three methods solving the same Rubik's cube"
                  modelName={model.name}
                  intro={
                    <>
                      {/* More serious, no subtitle (founder, 14 Nov 2026). Was: "Three methods race to solve the same
                          Rubik's cube." with "Same cube, same scoring. First to solve it wins." */}
                      {/* Founder's wording (14 Nov 2026); was "Solving a Rubik's cube.", before that "Solving the same scrambled
                          Rubik's cube with three methods." */}
                      <p className="r-show-claim">Rubik&apos;s cube as a black-box problem without prior knowledge.</p>
                    </>
                  }
                />
              </>
            ),
            // unusedContent: (
            // <CubeLive
            // plain
            // flat
            // label="A Rubik's cube being solved"
            // modelName={model.name}
            // intro={
            // <>
            // <p className="r-show-claim">{model.name} solving a Rubik&apos;s cube.</p>
            // <p className="r-show-sub">
            // It knows nothing about Rubik&apos;s cubes. It proposes moves, hears back a few numbers, and decides
            // what to try next.
            // </p>
            // </>
            // }
            // />
            // ),
          },
        ]
      : []),
    {
      id: 'lab',
      label: 'Protein Expression',
      content: <CfeValue modelName={model.name} headline="two-lines" count="whole" />,
    },
    ...(showTry
      ? [
          {
            id: 'landscape',
            label: 'Try it',
            content: (
              <>
                <p className="r-show-claim">Find the highest point of a hidden landscape in 25 tries.</p>
                {/* Removed from the comparison page (founder, 14 Nov 2026):
                <p className="r-show-sub">
                  Place them yourself, or let {model.name}, Bayesian optimization or a design of experiments choose.
                  Then show the landscape.
                </p> */}
                {/* <TryPanel modelName={model.name} score gentle simple ridged doeCyan floatNotice /> */}
                <TryPanel modelName={model.name} score gentle simple ridged doeCyan floatNotice recorded={tryRecording} />
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <main id="main" className="s-page r-launch r-launch--v2 r-launch--next" data-theme="ivory">
      {/* The draft notice, hidden on the comparison page (founder, 14 Nov 2026); the original page keeps it.
      {isDraft ? (
        <div className="s-wrap">
          <aside className="r-launch-draft" aria-label="Draft">
            <strong>Draft.</strong> Every figure is a stand-in and will be measured again on the release model.
            {open.length ? ` Placeholders still open: ${open.join(', ')}.` : ''}
          </aside>
        </div>
      ) : null} */}

      <header className="r-launch-hero r-launch-hero--tree s-wrap">
        {/* Two columns on wide screens (founder, 14 Nov 2026): the text on the left; on the right the decision tree
            with the model sentence under it, together as tall as the text. Stacked, the tree steps out. */}
        <div className="r-hero-text">
        <p className="r-launch-kicker">Release</p>
        <h1 className="r-launch-title">
          Introducing <em>{model.name}</em>
        </h1>
        {model.full_name ? (
          <p className="r-launch-subtitle">
            {model.full_name
              .split(' ')
              .map((word) => word[0].toUpperCase() + word.slice(1))
              .join(' ')}
          </p>
        ) : null}
        {/* A standard release byline, company and date (founder, 14 Nov 2026, after comparable model releases). */}
        <p className="r-launch-byline">
          <time dateTime="2026-11-17">November 17, 2026</time>
        </p>
        {/* The name spelled out as its own line read too loud (founder, 13 Nov 2026); it now sits in the lede.
        {model.full_name ? (
          <p className="r-launch-name">
            SDM stands for <strong>{model.full_name.toLowerCase()}</strong>.
          </p>
        ) : null} */}
        <p className="r-launch-lede">
          After discovery, a new drug requires testing, optimization and manufacturing. Hundreds of billions of dollars are
          spent on this problem each year.
          <br />
          Much of it is costly trial and error to find the best outcome.
        </p>
        <p className="r-launch-lede">
          This is called <strong>black-box optimization</strong>. Examples beyond biopharma include tuning a chemical
          process, setting up a production line, running an energy grid, planning logistics, balancing load across data centers or training a
          large language model.
        </p>
        {/* The way in, under the second paragraph (founder, 14 Nov 2026). */}
        <a className="r-launch-access r-launch-access--lede" href="/contact">
          Try {model.name}
          <ArrowIcon />
        </a>
        </div>
        <div className="r-hero-side">
          <DecisionTree />
          {/* What the model is, after the problem it solves (founder, 13 Nov 2026); under the tree (14 Nov 2026). */}
          <p className="r-launch-name">
            <strong>{model.name} solves black-box optimization problems.</strong>
          </p>
        </div>
      </header>

      {/* What the model can do, before the fields (founder, 14 Nov 2026, after the register of comparable model
          releases): three short items, a bold lead and one sentence each. */}
      {/* Centred, title and list (founder, 15 Nov 2026). */}
      <section className="r-launch-can r-launch-can--center s-wrap" aria-labelledby="can">
        <h2 id="can" className="r-launch-h2">
          {/* What {model.name} can do */}
          {model.name} can
        </h2>
        <ul className="r-can-list">
          <li>
            <strong>Choose the next experiment.</strong> From every result so far, it proposes what to try next: one
            experiment at a time, or a batch to run in parallel.
          </li>
          <li>
            <strong>Search any mix of settings.</strong> Continuous values, whole numbers and categories, all in one search.
          </li>
          <li>
            {/* It needs only the settings and their results, not a model of the process. (draft; founder's copy below, 14 Nov 2026) */}
            {/* It needs only the possible settings, measurable results and an objective to achieve. (first founder copy) */}
            <strong>Start without prior knowledge.</strong> {model.name} only needs to know the possible settings, what
            results are measurable and which objectives should be achieved. Both settings and outcomes can be anonymized.
          </li>
        </ul>
      </section>

      <section className="r-launch-fields r-launch-fields--airy s-wrap" aria-label="Where it applies">
        {/* Paper pieces down the page (founder, 14 Nov 2026): colour accents, behind the content. */}
        {/* No title for now (founder, 14 Nov 2026); the statement tried in its place, kept for later:
        <h2 id="fields" className="r-fields-title">
          Wherever experiments are costly
        </h2> */}
        <ul>
          {FIELDS.map((f, i) => (
            <li key={f.field} className="r-field">
              <PaperPiece kind={f.texture} shape={f.shape} seed={f.seed} className={`r-field-shape r-field-shape--${i + 1}`} />
              {/* Tiles above each field, set aside (founder, 14 Nov 2026: shapes spread down the post instead).
              <PaperPiece kind={f.texture} seed={f.seed} ratio={0.72} className="r-field-tile" /> */}
              <span className="r-field-name">{f.field}</span>
              <ul className="r-field-items">
                {f.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* The paper-cut banner, set aside (founder, 14 Nov 2026): small pieces down the page instead.
      <PaperBand variant="collage" seed={7} /> */}

      {showcases.length ? (
        <section className="r-launch-show s-wrap" aria-label="Showcases">
          <Showcases items={showcases} numbered={false} />
        </section>
      ) : null}

      {/* Benchmarks as their own section below the tabs (founder, 13 Nov 2026), not a third tab. */}
      {overview ? (
        <section className="r-launch-bench s-wrap" aria-labelledby="benchmarks">
          <h2 id="benchmarks" className="r-launch-h2">
            Benchmarks
          </h2>
          <div className="w-prose">
            <p className="r-show-claim">
              {/* {model.name} beats Bayesian Optimization by up to {boLead(overview)}%, with the same number of experiments. */}
              {/* One line (founder, 15 Nov 2026). */}
              {/* {model.name} beats Bayesian Optimization by up to {boLead(overview)}% */}
              {/* No figure in the claim (founder, 15 Nov 2026); the table below carries the numbers. */}
              {model.name} outperforms Bayesian Optimization across benchmarks
            </p>
            <BenchmarkOverview
              data={overview}
              modelName={model.name}
              grid
              nCells
              explain
              /* Said once here, not in each benchmark's card (founder, 15 Nov 2026). */
              /* heldOut={`${model.name} was trained on none of these benchmarks.${
                release.contamination?.holds ? ` ${fill(release.contamination)}` : ''
              }`} (founder, 15 Nov 2026: without the count of problems) */
              heldOut={`${model.name} was trained on none of these benchmarks.${
                release.contamination?.holds ? ' We checked every benchmark for contamination.' : ''
              }`}
              /* The Bayesian optimization compared against, roughly (founder, 16 Nov 2026). */
              boNote={release.benchmark_overview_added?.bo_note}
            />
          </div>
        </section>
      ) : null}

      <section className="r-launch-cta" aria-labelledby="cta">
        <div className="s-wrap">
          <h2 id="cta" className="r-launch-h2">
            {release.copy.section_titles.cta}
          </h2>
          <p>{release.copy.cta_text}</p>
          <a className="r-launch-cta-link" href="/contact">
            Join the list
            <ArrowIcon />
          </a>
        </div>
      </section>

      <section className="r-launch-more s-wrap" aria-label="More">
        {/* The questions themselves, without a "Questions scientists ask" fold around them (founder, 13 Nov 2026). */}
        <div className="w-prose">
          <div className="r-faq">
            {release.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="w-prose">
          <ModelCard />
        </div>
        {/* An easter egg (founder, 14 Nov 2026): the mark, cut from the same paper as the pieces above. */}
        {/* The stamped mark, set aside (founder, 14 Nov 2026: did not look good).
        <TexturedMark kind="charcoal" seed={21} className="r-mark--end" /> */}
      </section>
    </main>
  );
}
