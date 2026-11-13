import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import BenchmarkOverview from '@/components/release/BenchmarkOverview';
import CubeLive from '@/components/release/cube/CubeLive';
import { ModelCard } from '@/components/release/ReleaseParts';
import Showcases, { type Showcase } from '@/components/release/Showcases';
import TryPanel from '@/components/release/try/TryPanel';
import { ArrowIcon } from '@/components/site/Header';
import { RELEASE_PATH, cubeDemo, isDraft, placeholders, release, showCube, showTry } from '@/content/release';
import '../writings.css';
import './release.css';

/*
 * The SDM-1 launch page, a hidden draft (13 Nov 2026, founder's outline). One
 * page that walks a visitor through the announcement:
 *   1. what is released: SDM-1, a sequential decision model;
 *   2. why: optimisation problems everywhere, and black-box optimisation when
 *      nothing is known in advance; where it applies, with a biopharma and a
 *      chemicals example;
 *   3. three showcases as tabs: the Rubik's cube SDM-1 solves live, the
 *      hidden landscape to try yourself against DoE, Bayesian optimisation and
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

/* Where black-box optimisation applies; the first two are the worked examples. */
const FIELDS: { field: string; example: string; featured?: boolean }[] = [
  {
    field: 'Biopharma',
    example:
      'Which cell culture media blend to test next for an antibody-producing cell line, when every run is a bioreactor batch that takes weeks.',
    featured: true,
  },
  {
    field: 'Chemicals',
    example:
      'Which temperature, pressure, residence time and catalyst loading to run next, to raise selectivity while keeping by-products under a limit.',
    featured: true,
  },
  { field: 'Formulation', example: 'Coatings, lipid nanoparticles, buffers: which mixture to make next.' },
  { field: 'Assay development', example: 'Which conditions make a readout robust enough to screen with.' },
  { field: 'Materials and energy', example: 'Electrolytes, alloys, catalysts: which composition to synthesise next.' },
  { field: 'Manufacturing', example: 'Which process settings to change next on a production line.' },
  { field: 'Machine learning', example: 'Which hyperparameters to train the next model with.' },
];

export default function ReleasePage() {
  const open = placeholders();
  const overview = release.benchmark_overview;

  const showcases: Showcase[] = [
    ...(showCube
      ? [
          {
            id: 'cube',
            label: "Rubik's cube",
            content: (
              <CubeLive
                label="A Rubik's cube being solved"
                modelName={model.name}
                config={{
                  scrambleDepth: cubeDemo.scramble_depth,
                  discoverCalls: cubeDemo.discover_calls,
                  solveCalls: cubeDemo.solve_calls,
                  batch: cubeDemo.batch,
                  keep: cubeDemo.keep,
                }}
                intro={
                  <>
                    <p className="r-show-claim">{model.name} is solving this cube, live.</p>
                    <p className="r-show-sub">
                      It knows nothing about Rubik&apos;s cubes. It proposes moves, hears back a few numbers, and decides
                      what to try next.
                    </p>
                  </>
                }
              />
            ),
          },
        ]
      : []),
    ...(showTry
      ? [
          {
            id: 'landscape',
            label: 'Hidden landscape',
            content: (
              <>
                <p className="r-show-claim">Find the highest point of a hidden landscape in 25 tries.</p>
                <p className="r-show-sub">
                  Place them yourself, or let {model.name}, Bayesian optimisation or a design of experiments choose.
                  Then show the landscape.
                </p>
                <TryPanel modelName={model.name} />
              </>
            ),
          },
        ]
      : []),
    ...(overview
      ? [
          {
            id: 'benchmarks',
            label: 'Benchmarks',
            content: (
              <>
                <p className="r-show-claim">Better than Bayesian optimisation in most comparisons, with the same number of experiments.</p>
                <BenchmarkOverview data={overview} modelName={model.name} />
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <main id="main" className="s-page r-launch" data-theme="ivory">
      {isDraft ? (
        <div className="s-wrap">
          <aside className="r-launch-draft" aria-label="Draft">
            <strong>Draft.</strong> Every figure is a stand-in and will be measured again on the release model.
            {open.length ? ` Placeholders still open: ${open.join(', ')}.` : ''}
          </aside>
        </div>
      ) : null}

      <header className="r-launch-hero s-wrap">
        <p className="r-launch-kicker">Release</p>
        <h1 className="r-launch-title">
          Introducing <em>{model.name}</em>
        </h1>
        {model.full_name ? (
          <p className="r-launch-name">
            SDM stands for <strong>{model.full_name.toLowerCase()}</strong>.
          </p>
        ) : null}
        <p className="r-launch-lede">
          Optimisation problems are everywhere: a recipe, a process, a formulation, a model to tune. When nobody knows in
          advance how the result depends on the settings, the way through is black-box optimisation: try a few settings,
          measure, and let the results decide what to try next. {model.name} makes that decision, from the first
          results, with nothing to fit or tune.
        </p>
      </header>

      <section className="r-launch-fields s-wrap" aria-labelledby="fields">
        <h2 id="fields" className="r-launch-h2">
          Where it applies
        </h2>
        <ul>
          {FIELDS.map((f) => (
            <li key={f.field} className={f.featured ? 'r-field r-field--featured' : 'r-field'}>
              <span className="r-field-name">{f.field}</span>
              <span className="r-field-example">{f.example}</span>
            </li>
          ))}
        </ul>
      </section>

      {showcases.length ? (
        <section className="r-launch-show s-wrap" aria-labelledby="showcases">
          <h2 id="showcases" className="r-launch-h2">
            See it work
          </h2>
          <Showcases items={showcases} />
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
        <details className="r-launch-fold w-prose">
          <summary>{release.copy.section_titles.faq}</summary>
          <div className="r-faq">
            {release.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </details>
        <div className="w-prose">
          <ModelCard />
        </div>
      </section>
    </main>
  );
}
