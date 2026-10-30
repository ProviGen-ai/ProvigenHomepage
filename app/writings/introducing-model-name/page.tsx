import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import ArticleShell from '@/components/ArticleShell';
import {
  BenchmarkFacts,
  Caveats,
  CoveragePlot,
  MeasuredOn,
  ModelCard,
  PairedTable,
  RegretBars,
  ResultsTable,
} from '@/components/release/ReleaseParts';
import { ArrowIcon } from '@/components/site/Header';
import {
  RELEASE_PATH,
  RELEASE_SLUG,
  benchmark,
  fill,
  headline,
  isDraft,
  liveUrl,
  placeholders,
  release,
} from '@/content/release';
import '../writings.css';
import './release.css';

/*
 * The model release page, a hidden draft (30 Oct 2026). Not in the writings
 * ledger, so it is in no list, sitemap or feed; noindex below. It stays on a
 * local branch until the founder says otherwise.
 *
 * A template for [MODEL NAME] v[VERSION]: every figure, the version, the date
 * and the model card come from content/release/announcement.json, and the
 * sentences that carry a figure are filled from it (fill()). The prose written
 * here carries no numbers. Outline after the model team's brief: claim and
 * number, why, how, results (where the baselines win too), real lab data,
 * limits, capabilities, model card, a call to contact.
 */

const { model } = release;
const title = `Introducing <em>${model.name}</em>`;

export const metadata: Metadata = {
  ...pageMetadata({
    title: `Introducing ${model.name}`,
    description: model.one_line,
    path: RELEASE_PATH,
    type: 'article',
  }),
  robots: { index: false, follow: false },
};

const toc = [
  { id: 'why', title: 'Why the next experiment' },
  { id: 'how', title: 'How it works' },
  { id: 'results', title: 'Results' },
  { id: 'lab-data', title: 'Real lab data' },
  { id: 'limits', title: 'Where it is not ahead' },
  { id: 'capabilities', title: 'What it handles' },
  { id: 'model-card', title: 'Model card' },
];

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

export default function ReleasePage() {
  const hero = headline('abrupt_vs_bo');
  const second = headline('calibration');
  const heldout = benchmark(hero.benchmark);
  const calibration = benchmark('calibration_heldout');
  const hpoPrediction = benchmark('hpo_prediction');
  const hpoSearch = benchmark('hpo_search');
  const cellfree = benchmark('cellfree_rerank');
  const discovery = benchmark('discovery_cellfree');
  const fewer = headline('fewer_experiments');
  const open = placeholders();

  return (
    <ArticleShell
      slug={RELEASE_SLUG}
      eyebrow="Release"
      title={title}
      dek={model.one_line}
      banner={`${model.version} · ${model.status}`}
      meta={{
        date: model.release_date ?? '',
        dateLabel: model.release_date ? formatDate(model.release_date) : 'Date to be set',
        readingMinutes: 8,
      }}
      toc={toc}
      tocLabel="In this release"
      note={
        isDraft ? (
          <>
            A draft for a future release. Every figure is a stand-in, measured on the current development model or an
            earlier internal model as marked, and will be measured again on the release model. Figures not measured yet
            read “to be measured”.{open.length ? ` Placeholders still open: ${open.join(', ')}.` : ''}
          </>
        ) : undefined
      }
      noteLabel="Draft"
      lead={
        <section className="r-hero" aria-label="Headline result">
          <p className="r-hero-figure">
            {hero.values.wins} <span>of</span> {hero.values.runs}
          </p>
          <p className="r-hero-claim">{fill(hero)}</p>
          <p className="r-hero-second">{fill(second)}</p>
          <p className="r-hero-scope">
            {heldout.scope} {isDraft ? `Stand-in: ${heldout.measured_on}.` : ''}
          </p>
        </section>
      }
      references={references}
      referencesLabel="Data and benchmarks"
    >
      {/* .p-writings-counted: headings without section numbers, as on the other field notes. */}
      <div className="p-writings-counted r-body">
      <section id="why" aria-labelledby="why-h">
        <h2 id="why-h">Why the next <em>experiment</em></h2>
        <p>
          In a lab campaign every experiment costs a plate, reagents, instrument time and days of waiting. How many a
          campaign needs depends mostly on one recurring decision: which experiments to run next. Often it is settled by
          a fixed screen planned up front, or by judgement between rounds.
        </p>
        <p>
          Methods that make that decision from data exist. Bayesian optimisation is the standard one, but each campaign
          needs its own model fitted, its assumptions chosen and its settings tuned, and it expects responses to change
          smoothly. Lab responses often do not: a formulation precipitates past a threshold, nothing grows under some
          conditions, a readout saturates.
        </p>
      </section>

      <section id="how" aria-labelledby="how-h">
        <h2 id="how-h">How it <em>works</em></h2>
        <ol className="r-steps">
          <li>
            <span className="r-step-title">Simulated campaigns</span>
            {release.model_card.training_data.summary}
          </li>
          <li>
            <span className="r-step-title">One pretrained model</span>
            {release.capabilities.find((c) => c.name === 'No per-campaign tuning')?.text}
          </li>
          <li>
            <span className="r-step-title">In the loop with the lab</span>
            {release.model_card.intended_use[0]}
          </li>
        </ol>
        <p>
          What it returns for a campaign: {release.model_card.model_details.outputs.map((o) => o[0].toLowerCase() + o.slice(1)).join('; ')}.
        </p>
      </section>

      <section id="results" aria-labelledby="results-h">
        <h2 id="results-h">
          <em>Results</em>
        </h2>
        <p>{release.model_card.evaluation_summary} The baselines are named, and so are the places where they lead.</p>

        <h3>{heldout.title}</h3>
        <p className="r-question">{heldout.question}</p>
        <MeasuredOn benchmark={heldout} />
        <RegretBars benchmark={heldout} />
        <p>{fill(headline('beats_random'))}</p>
        <PairedTable benchmark={heldout} />
        <Caveats benchmark={heldout} />
        <BenchmarkFacts benchmark={heldout} />

        <h3>{calibration.title}</h3>
        <p className="r-question">{calibration.question}</p>
        <MeasuredOn benchmark={calibration} />
        <CoveragePlot benchmark={calibration} />
        <ResultsTable benchmark={calibration} percent />
        <Caveats benchmark={calibration} />
        <BenchmarkFacts benchmark={calibration} />

        <h3>{hpoPrediction.title}</h3>
        <p className="r-question">{hpoPrediction.question}</p>
        <MeasuredOn benchmark={hpoPrediction} />
        <ResultsTable benchmark={hpoPrediction} />
        <Caveats benchmark={hpoPrediction} />
        <BenchmarkFacts benchmark={hpoPrediction} />

        <h3>{hpoSearch.title}</h3>
        <p className="r-question">{hpoSearch.question}</p>
        <MeasuredOn benchmark={hpoSearch} />
        <ResultsTable benchmark={hpoSearch} />
        <Caveats benchmark={hpoSearch} />
        <BenchmarkFacts benchmark={hpoSearch} />
      </section>

      <section id="lab-data" aria-labelledby="lab-data-h">
        <h2 id="lab-data-h">
          Real lab <em>data</em>
        </h2>
        <h3>{cellfree.title}</h3>
        <p className="r-question">{cellfree.question}</p>
        <MeasuredOn benchmark={cellfree} />
        <ResultsTable benchmark={cellfree} />
        <PairedTable benchmark={cellfree} />
        <Caveats benchmark={cellfree} />
        <BenchmarkFacts benchmark={cellfree} />

        <h3>{discovery.title}</h3>
        <p className="r-question">{discovery.question}</p>
        <MeasuredOn benchmark={discovery} />
        <p>{fill(fewer)}</p>
        {fewer.not_measured_yet ? <p className="r-pending-note">{fewer.not_measured_yet}</p> : null}
        <ResultsTable benchmark={discovery} />
        <Caveats benchmark={discovery} />
        <BenchmarkFacts benchmark={discovery} />
      </section>

      <section id="limits" aria-labelledby="limits-h">
        <h2 id="limits-h">
          Where it is not <em>ahead</em>
        </h2>
        <ul>
          {release.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <section id="capabilities" aria-labelledby="capabilities-h">
        <h2 id="capabilities-h">
          What it <em>handles</em>
        </h2>
        <dl className="r-caps">
          {release.capabilities.map((c) => (
            <div key={c.name}>
              <dt>{c.name}</dt>
              <dd>
                {c.text}
                {c.evidence ? <span className="r-evidence">{c.evidence}</span> : null}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="model-card" aria-labelledby="model-card-h">
        <h2 id="model-card-h">
          Model <em>card</em>
        </h2>
        <ModelCard />
      </section>

      <p className="w-cta">
        <span>Access opens later. To hear when it does, or to talk about a campaign of yours,</span>{' '}
        <a className="w-cta-link" href="/contact">
          contact us
          <ArrowIcon />
        </a>
      </p>
      </div>
    </ArticleShell>
  );
}
