import type { Metadata } from 'next';
import { Fragment } from 'react';
import { pageMetadata } from '@/lib/site-env';
import ArticleShell from '@/components/ArticleShell';
import {
  Aside,
  BenchmarkAside,
  CampaignTrace,
  CoveragePlot,
  ModelCard,
  PairedTable,
  RegretBars,
  ResponseShapes,
  ResultsTable,
} from '@/components/release/ReleaseParts';
import { ArrowIcon } from '@/components/site/Header';
import CubeLive from '@/components/release/cube/CubeLive';
import TryPanel from '@/components/release/try/TryPanel';
import {
  METHOD_LABEL,
  RELEASE_PATH,
  RELEASE_SLUG,
  aside,
  benchmark,
  fill,
  headline,
  isDraft,
  benchmarkTitle,
  cubeDemo,
  highlights,
  showCube,
  showTry,
  liveUrl,
  placeholders,
  release,
  sectionOf,
  selfOptimization,
  show,
  TO_BE_MEASURED,
  type Benchmark,
} from '@/content/release';
import '../writings.css';
import './release.css';

/*
 * KEPT, NOT RENDERED (13 Nov 2026): the long-form version of the release page,
 * replaced by page.tsx (one flowing launch page with three showcases, founder's
 * outline). Not a route (only page.tsx is); kept so nothing written here is lost.
 *
 * The model release page, a hidden draft (30 Oct 2026). Not in the writings
 * ledger, so it is in no list, sitemap or feed; noindex below. It stays on a
 * local branch until the founder says otherwise.
 *
 * A template for [MODEL NAME] v[VERSION]: every figure, heading, the version,
 * the date and the model card come from content/release/announcement.json,
 * and the sentences that carry a figure are filled from it (fill()). The prose
 * written here carries no numbers.
 *
 * Outline (revamp after the model team's survey of launch posts, 30 Oct 2026):
 * hero and takeaways; why; the category explained; how, with the landscapes it
 * is built for; results opening with the evaluation size, a summary chart, one
 * campaign's trace, then each benchmark with its method folded inline; the
 * real lab campaign; the model optimising its own pipeline (founder, 31 Oct
 * 2026); what it enables; what it handles; questions; model card; call to
 * action. Framed on biotech, biochemical and chemical applications. Confident, no caveats, no training details (founder).
 */

const { model } = release;
const T = release.copy.section_titles;

const metadata: Metadata = {
  ...pageMetadata({
    title: `Introducing ${model.name}`,
    description: model.one_line,
    path: RELEASE_PATH,
    type: 'article',
  }),
  robots: { index: false, follow: false },
};

const toc = [
  { id: 'why', title: T.why },
  { id: 'category', title: T.category },
  { id: 'how', title: T.how },
  ...(showCube ? [{ id: 'cube', title: 'The cube at the top of this page' }] : []),
  { id: 'results', title: T.results },
  { id: 'real-lab', title: T.real_lab },
  ...(selfOptimization ? [{ id: 'self', title: selfOptimization.title }] : []),
  { id: 'enables', title: T.enables },
  { id: 'handles', title: T.handles },
  ...(showTry ? [{ id: 'try', title: 'Try it on a hidden landscape' }] : []),
  { id: 'faq', title: T.faq },
  { id: 'model-card', title: T.model_card },
];

/** A heading from the data file, verbatim, its last word in the site's teal. */
function Heading({ id, text }: { id: string; text: string }) {
  const cut = text.lastIndexOf(' ');
  return (
    <h2 id={id}>
      {cut > 0 ? (
        <>
          {text.slice(0, cut)} <em>{text.slice(cut + 1)}</em>
        </>
      ) : (
        <em>{text}</em>
      )}
    </h2>
  );
}

/* Datasets, each cited once (by address, else by citation), in the order the
   results use them; where benchmarks cite one source differently, the fuller
   citation and name are kept. */
const sources = new Map<string, { citation: string; name: string; href?: string }>();
for (const { dataset } of release.benchmarks) {
  const href = liveUrl(dataset.url);
  const key = href ?? dataset.citation;
  const seen = sources.get(key);
  sources.set(key, {
    href,
    citation: seen && seen.citation.length > dataset.citation.length ? seen.citation : dataset.citation,
    name: seen && seen.name.length > dataset.name.length ? seen.name : dataset.name,
  });
}
const references = [...sources.values()].map((d) => ({ label: `${d.citation} · ${d.name}`, href: d.href }));

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function LongformReleasePage() {
  const hero = headline('abrupt_vs_bo');
  /* A second hero line, if the data file carries one (the calibration line left on 31 Oct 2026). */
  const second = release.headline_candidates.find((h) => h.id === 'calibration');
  const summary = release.summary_chart;
  const summaryBenchmark = benchmark(summary.benchmark);
  const contamination = release.contamination;
  const howAside = aside('how');
  const resultsAside = aside('results');
  const open = placeholders();

  /*
   * One result, whatever its id (a new benchmark in the data file needs no code):
   * its title (unless it repeats the section's), the question, then by shape:
   * coverage rows (arrays) as the calibration plot and a table; lower-is-better
   * rows as bars (null values as empty slots); anything else as a table. Its headline sentences (those not in the hero) and head-to-head
   * results follow, then how it was measured, folded inline.
   */
  const inHero = [hero.id, second?.id];
  const result = (b: Benchmark, section: string) => {
    const sentences = release.headline_candidates.filter((h) => h.benchmark === b.id && !inHero.includes(h.id));
    const said = sentences.map((h) => <p key={h.id}>{fill(h)}</p>);
    const coverage = b.results.some((r) => Object.values(r.values).some(Array.isArray));
    const figure = coverage ? (
      <>
        <CoveragePlot benchmark={b} />
        <ResultsTable benchmark={b} percent />
        {said}
      </>
    ) : /^lower\b/i.test(b.metric.direction) ? (
      <>
        <RegretBars benchmark={b} />
        {said}
      </>
    ) : (
      <>
        {said}
        {/* Charts say what they measure in their caption; a table says it here. */}
        <p className="r-table-note">{b.metric.name}</p>
        <ResultsTable benchmark={b} />
      </>
    );
    return (
      <Fragment key={b.id}>
        {benchmarkTitle(b) !== section ? <h3>{benchmarkTitle(b)}</h3> : null}
        <p className="r-question">{b.question}</p>
        {figure}
        <PairedTable benchmark={b} />
        <BenchmarkAside benchmark={b} />
      </Fragment>
    );
  };
  const resultsIn = (section: 'results' | 'real_lab') => release.benchmarks.filter((b) => sectionOf(b) === section);

  return (
    <ArticleShell
      slug={RELEASE_SLUG}
      eyebrow={release.copy.kicker}
      title={`<em>${model.name}</em>`}
      dek={model.one_line}
      banner={model.status}
      meta={{
        date: model.release_date ?? '',
        dateLabel: model.release_date ? formatDate(model.release_date) : 'Date to be set',
        readingMinutes: 7,
      }}
      toc={toc}
      tocLabel="In this release"
      note={
        isDraft ? (
          <>
            A draft for a future release. Every figure is a stand-in from a development model and will be measured again
            on the release model. Figures not measured yet read “to be measured”.
            {open.length ? ` Placeholders still open: ${open.join(', ')}.` : ''}
          </>
        ) : undefined
      }
      noteLabel="Draft"
      lead={
        <>
          {/* The cube opens the page unexplained; the reveal section says what solves it (founder, 13 Nov 2026). */}
          {showCube ? (
            <CubeLive
              label="A Rubik's cube being solved"
              modelName={model.name}
            />
          ) : null}
          <section className="r-hero" aria-label="Headline result">
            <p className="r-hero-figure">
              {hero.values.wins} <span>of</span> {hero.values.runs}
            </p>
            <p className="r-hero-claim">{fill(hero)}</p>
            {second ? <p className="r-hero-second">{fill(second)}</p> : null}
          </section>
          <aside className="r-takeaways" aria-labelledby="r-takeaways-label">
            <p id="r-takeaways-label" className="r-takeaways-label">
              Takeaways
            </p>
            <ul>
              {release.takeaways.map((t) => (
                <li key={t.text_template}>{fill(t)}</li>
              ))}
            </ul>
          </aside>
        </>
      }
      references={references}
      referencesLabel="Data and benchmarks"
    >
      {/* .p-writings-counted: headings without section numbers, as on the other field notes. */}
      <div className="p-writings-counted r-body">
        <section aria-labelledby="why">
          <Heading id="why" text={T.why} />
          <p>
            Every campaign comes down to one decision, made again and again: what do you run next? In biotech,
            biochemical and chemical development, each answer costs a plate, reagents, instrument time and days of waiting.
          </p>
          <p>
            Today that decision is usually a fixed screen planned up front, or judgement between rounds. Bayesian
            optimisation makes it from data, but it fits a fresh model to every campaign from scratch, starting from
            assumptions chosen up front, chiefly that responses change smoothly.
          </p>
          <p>
            Lab responses often do not. A formulation precipitates past a threshold. Nothing grows under some conditions.
            A readout saturates.
          </p>
          <p>{model.name} is built for those campaigns. There is nothing to fit. It starts from your first results.</p>
        </section>

        <section aria-labelledby="category">
          <Heading id="category" text={T.category} />
          <div className="r-explainer">
            <p className="r-explainer-title">{release.category_explainer.title}</p>
            <p>{release.category_explainer.text}</p>
          </div>
        </section>

        <section aria-labelledby="how">
          <Heading id="how" text={T.how} />
          <ol className="r-steps">
            <li>
              <span className="r-step-title">Bring your results</span>
              Give it the settings you tried and what you measured. Say where runs fail or a readout saturates.
            </li>
            <li>
              <span className="r-step-title">Nothing to fit</span>
              It reads your campaign and predicts how untested settings will turn out.
            </li>
            <li>
              <span className="r-step-title">Run the next plate</span>
              It proposes the next experiment or a whole plate. Each new result goes into the next proposal.
            </li>
          </ol>
          <ResponseShapes />
          {howAside ? (
            <Aside title={howAside.title}>
              <p>{howAside.text}</p>
            </Aside>
          ) : null}
        </section>

        {showCube ? (
          <section aria-labelledby="cube">
            <h2 id="cube">
              The cube at the top of this <em>page</em>
            </h2>
            <p>
              Is being solved by {model.name}, right now, while you read. Not by a cube solver: {model.name} knows
              nothing about cubes. It sees the cube the way it sees a lab campaign, as a black box: settings go in, a few
              numbers come back.
            </p>
            <p>
              The same model works on it at two levels. First it optimises sequences of moves, looking for ones that
              disturb as few pieces as possible. Then it goes one level up and optimises with what it found: each
              experiment is now a whole building block, turned or mirrored and set in place. Nothing in the model changes
              between the two. Only what counts as one experiment does.
            </p>
            {cubeDemo.holds === true && cubeDemo.result_template ? (
              <p>{fill({ text_template: cubeDemo.result_template, values: cubeDemo.values ?? {} })}</p>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="results">
          <Heading id="results" text={T.results} />
          {/* The highlights: big figures, small labels, each from the data file (highlights()). */}
          <dl className="r-highlights">
            {highlights().map((h) => (
              <div key={h.label}>
                <dt>{h.value}</dt>
                <dd>{h.label}</dd>
              </div>
            ))}
          </dl>
          <p>{fill({ text_template: release.copy.results_intro_template, values: release.copy.results_intro_values })}</p>
          {resultsAside ? (
            <Aside title={resultsAside.title}>
              <p>{resultsAside.text}</p>
              {/* Only once the check has passed; while `holds` is null it does not appear at all. */}
              {contamination?.holds === true ? (
                <p>
                  <strong>{contamination.title}.</strong> {fill(contamination)}
                </p>
              ) : null}
            </Aside>
          ) : null}

          <RegretBars
            benchmark={summaryBenchmark}
            group={summary.group}
            title={summary.title_holds === true ? fill({ text_template: summary.title_template, values: {} }) : summaryBenchmark.title}
            reference={
              summary.reference.key
                ? {
                    key: summary.reference.key,
                    label: summary.reference.label_template.replace('{name}', METHOD_LABEL[summary.reference.key] ?? summary.reference.key),
                  }
                : undefined
            }
            asOf={summary.as_of ? formatDate(summary.as_of) : null}
            fold={false}
          />
          <CampaignTrace />

          {resultsIn('results').map((b) => result(b, T.results))}
        </section>

        <section aria-labelledby="real-lab">
          <Heading id="real-lab" text={T.real_lab} />
          {resultsIn('real_lab').map((b) => result(b, T.real_lab))}
        </section>

        {/* Founder's gated slot (31 Oct 2026): this section and its contents entry appear only once its results hold. */}
        {selfOptimization ? (
          <section aria-labelledby="self">
            <Heading id="self" text={selfOptimization.title} />
            <p>{selfOptimization.intro}</p>
            <ul className="r-self">
              {selfOptimization.results.map((r) => (
                <li key={r.target}>
                  <span className="r-self-target">{r.target}</span>
                  <span className={r.value === null ? 'r-self-value r-pending' : 'r-self-value'}>
                    {r.value === null ? `[${TO_BE_MEASURED}]` : show(r.value)}
                  </span>
                  <span className="r-self-metric">{r.metric}</span>
                </li>
              ))}
            </ul>
            <p>{selfOptimization.closing}</p>
          </section>
        ) : null}

        <section aria-labelledby="enables">
          <Heading id="enables" text={T.enables} />
          <dl className="r-caps r-enables">
            {release.enables.map((e) => (
              <div key={e.title}>
                <dt>{e.title}</dt>
                <dd>{e.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="handles">
          <Heading id="handles" text={T.handles} />
          <dl className="r-caps">
            {release.capabilities.map((c) => (
              <div key={c.name}>
                <dt>{c.name}</dt>
                <dd>{c.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        {showTry ? (
          <section aria-labelledby="try">
            <h2 id="try">
              Try it on a hidden <em>landscape</em>
            </h2>
            <p>
              One landscape, hidden, with regions where runs fail. Choose who picks the experiments: you, by clicking;{' '}
              {model.name}; Bayesian optimisation; or a design of experiments planned up front. Each gets 25 tries on the
              same landscape. Show it when you are done, and draw a new one to go again.
            </p>
            <TryPanel modelName={model.name} />
          </section>
        ) : null}

        <section aria-labelledby="faq">
          <Heading id="faq" text={T.faq} />
          <div className="r-faq">
            {release.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="model-card">
          <Heading id="model-card" text={T.model_card} />
          <ModelCard />
        </section>

        <section className="r-close" aria-labelledby="cta">
          <Heading id="cta" text={T.cta} />
          <p className="r-cta">
            <span>{release.copy.cta_text}</span>{' '}
            <a className="w-cta-link" href="/contact">
              Join the list
              <ArrowIcon />
            </a>
          </p>
        </section>
      </div>
    </ArticleShell>
  );
}
