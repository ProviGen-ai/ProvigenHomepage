import type { Metadata } from 'next';
import { essayImage, pageMetadata } from '@/lib/site-env';
import ArticleShell from '@/components/ArticleShell';
import { CandidateSelection } from '@/components/Blueprint';
import BoSim from '@/components/writings/bo-sim/BoSim';
import {
  SIMULATION_SLOT,
  closedLoopArticle,
  prepareArticleHtml,
} from '@/content/closed-loop-article';
import '../writings.css';

export const metadata: Metadata = pageMetadata({
  title: 'Closed-loop experimental campaigns in practice',
  description:
    'A practical account of closed-loop design, delayed measurements, and adaptive experimental decisions.',
  path: '/writings/closed-loop-optimization',
  type: 'article',
  image: essayImage('closed-loop-optimization', 'Closed-loop experimental campaigns in practice.'),
});

/*
 * The field note is kept as its HTML string. The edits here are structural:
 * the "What counts as a sample?" heading gains an id so the contents can reach
 * it; two empty spans keep v1's section anchors (#assay-optimization,
 * #therapeutic-design) landing on their headings; and the string is split
 * twice, so the live simulation (BoSim, #simulation, where v1's /demo now
 * redirects) takes the place of the earlier GIF figure and the candidate
 * blueprint sits under the "Therapeutic design" heading, as before. Each part
 * then goes through prepareArticleHtml, which gives external links their
 * target and rel and puts the wide table in its own scroll container.
 */
const article = closedLoopArticle
  .replace('<h2>What counts as a sample?</h2>', '<h2 id="sample">What counts as a sample?</h2>')
  .replace('<h2 id="plate-design">', '<span id="assay-optimization"></span><h2 id="plate-design">')
  .replace('<h2 id="candidate-selection">', '<span id="therapeutic-design"></span><h2 id="candidate-selection">');
const [beforeSimulation, afterSimulation] = article.split(SIMULATION_SLOT);
const candidateHeading = '<h2 id="candidate-selection">';
const candidateStart = afterSimulation.indexOf(candidateHeading);
const candidateHeadingEnd = afterSimulation.indexOf('</h2>', candidateStart) + 5;
const beforeSelection = afterSimulation.slice(0, candidateHeadingEnd);
const afterSelection = afterSimulation.slice(candidateHeadingEnd);

const toc = [
  { id: 'core-loop', title: 'The core loop' },
  { id: 'plate-design', title: 'Assay optimization' },
  { id: 'candidate-selection', title: 'Therapeutic design' },
  { id: 'media-optimization', title: 'Media formulation' },
  { id: 'sample', title: 'What counts as a sample?' },
];

const references = [
  {
    label:
      'Narayanan et al. · Accelerating cell culture media development using Bayesian optimization-based iterative experimental design · Nature Communications · 2025',
    href: 'https://www.nature.com/articles/s41467-025-61113-5',
    note: 'The media example reconstructs this published study. Source data: figshare 27715134.',
  },
  {
    label:
      'Surjanovic & Bingham · Branin function · Virtual Library of Simulation Experiments: Test Functions and Datasets · Simon Fraser University',
    href: 'https://www.sfu.ca/~ssurjano/branin.html',
    note: 'Definition, domain and minima of the test function the simulation runs on.',
  },
  {
    label: 'AnotherSamWilson · GpParBayesAnimationSmall.gif · Wikimedia Commons · CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:GpParBayesAnimationSmall.gif',
    note: 'The one-input animation of Bayesian optimization in The core loop, cropped to its top panel.',
  },
  {
    label: 'PyLabRobot · open-source laboratory automation framework',
    href: 'https://github.com/PyLabRobot/pylabrobot',
    note: 'One of the open frameworks through which instruments can be driven programmatically.',
  },
  /* Hidden (founder, 23 Oct 2026).
  {
    // No href: the earlier posting is not a live destination, and this page is
    // where the field note now lives. Provenance stays as plain text.
    label: 'Original publication · ProviGen field note',
    note: 'First published April 2026.',
  },
  */
];

export default function CampaignArticle() {
  return (
    <ArticleShell
      slug="closed-loop-optimization"
      eyebrow="Field note"
      title="Closed-loop experimental campaigns in <em>practice</em>."
      dek="How assay optimisation, therapeutic design and media formulation become closed-loop projects that learn from each round."
      meta={{
        date: '2026-04-13',
        dateLabel: '13 April 2026',
        readingMinutes: 9,
      }}
      toc={toc}
      tocLabel="In this field note"
      /* Provenance box hidden (founder, 23 Oct 2026).
      note="An account of the approach and its applications. The media example reconstructs published research by Narayanan and colleagues; it is attributed literature evidence, rather than a ProviGen experimental result."
      */
      references={references}
      referencesLabel="References and credits"
    >
      <div
        className="p-writings-counted"
        dangerouslySetInnerHTML={{ __html: prepareArticleHtml(beforeSimulation) }}
      />
      <BoSim />
      <div
        className="p-writings-counted"
        dangerouslySetInnerHTML={{ __html: prepareArticleHtml(beforeSelection) }}
      />
      <div className="p-writings-plate">
        <CandidateSelection />
      </div>
      <div
        className="p-writings-counted"
        dangerouslySetInnerHTML={{ __html: prepareArticleHtml(afterSelection) }}
      />
    </ArticleShell>
  );
}
