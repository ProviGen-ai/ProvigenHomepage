/* Writings ledger, newest first. `date` is ISO for <time dateTime>; `dateLabel`
   is what the cards show. Titles may carry one <em>. `featured` entries open
   the index as large cards with their own visual, two to a row (the episode and
   the manifesto joined the forecast and the field note on 4 Oct 2026, on the
   founder's call); the rest form the compact "More writing" list. Every entry keeps a provenance line for its visual. */

export type WritingCategory = 'Perspective' | 'Field note' | 'Conversation' | 'Use case' | 'Release';

/**
 * Which visual a card carries (components/writings/WritingVisual). 'episode'
 * is a recorded conversation's own thumbnail, from `poster`.
 */
export type WritingVisual = 'forecast' | 'plate' | 'cycle' | 'membrane' | 'episode' | 'tree';

export type WritingCard = {
  slug: string;
  href: string;
  title: string;
  dek: string;
  date: string;
  dateLabel: string;
  category: WritingCategory;
  /** Mono tag line on featured cards. */
  tag: string;
  featured: boolean;
  visual: WritingVisual;
  /** The 'episode' visual's image: a 16:9 poster under public/. */
  poster?: string;
  provenance: string;
  /**
   * One quiet line after the essay pointing to the matching next step
   * (competitor review R22, 3 Oct 2026): shared links land on essays, and only
   * the field note ended with an invitation. None on the forecasts until their
   * probabilities are signed off (R02), and none on the field note, whose own
   * last paragraph already invites a conversation.
   */
  cta?: { text: string; label: string; href: string };
  /**
   * Reachable by direct link only (founder, 13 Nov 2026): left out of
   * /writings, the feed, the sitemap and the "Next" cards, while the page
   * itself still finds its card here.
   */
  unlisted?: boolean;
};

/* Dates are first publication (14 Oct 2026): the use cases and the manifesto
   as the old site published them, the episode as it aired. */
export const writings: WritingCard[] = [
  {
    /* The SDM-1 release (the user, 17 Nov 2026): the article lives at /blog/introducing-sdm-1, the address it keeps
       after the merge, and leads the gallery as the newest piece. */
    slug: 'introducing-sdm-1',
    href: '/blog/introducing-sdm-1',
    title: 'Introducing <em>SDM-1</em>.',
    /* Was "...decision making: it reads a campaign\u2019s results so far and proposes which experiments to run next."
       (the user, 17 Nov 2026: change what follows the colon), then "... decision making. It proposes the next experiments
       to run, from the results so far." The second half now comes from the page itself, the Partner with us section:
       "finds better results with the same number of experiments". */
    dek: 'A foundation model for experimental decision making.<br />Better results with the same number of experiments.',
    date: '2026-11-17',
    dateLabel: '17 November 2026',
    category: 'Release',
    tag: 'Release \u00b7 Sequential Decision Model \u00b7 November 2026',
    featured: true,
    visual: 'tree',
    provenance: 'The decision tree of the release page',
  },
  {
    /* Lucas Mair on the Frameshifts podcast, read for the company (4 Oct
       2026): the episode embedded behind one click, quotes with their times. */
    slug: 'frameshifts-episode-15',
    href: '/writings/frameshifts-episode-15',
    title: 'Biology is a steering <em>problem</em>.',
    dek: 'Our co-founder and CTO Lucas Mair on the Frameshifts podcast. Our reading: biology is a steering problem, the experiment is the bottleneck, and that is where lab-in-the-loop AI comes in.',
    date: '2026-08-31',
    dateLabel: '31 August 2026',
    category: 'Conversation',
    tag: 'Conversation · Frameshifts podcast · August 2026',
    featured: true,
    visual: 'episode',
    poster: '/assets/writings/frameshifts-episode-15/poster-1280.webp',
    provenance: 'Episode thumbnail by Frameshifts, in our colours',
    cta: {
      text: 'Have a process where each round is costly and the next one is hard to choose?',
      label: 'Contact us',
      href: '/contact',
    },
  },
  {
    /* The founder's data-room manifesto, published verbatim with citations
       on his call (4 Oct 2026). */
    slug: 'manifesto',
    href: '/writings/manifesto',
    title: 'The <em>Manifesto</em>.',
    dek: 'Biotech is entering a new era.<br />Lab-in-the-loop is becoming the new operating model for biotechnology.',
    date: '2026-09-25',
    dateLabel: '25 September 2026',
    category: 'Perspective',
    tag: 'Perspective · Manifesto · September 2026',
    featured: true,
    visual: 'cycle',
    provenance: 'Illustrative cycle, not a measurement',
    cta: {
      text: 'Want your lab’s automation to learn which experiment to run next?',
      label: 'Contact us',
      href: '/contact',
    },
  },
  /* Data-room material as essays (4 Oct 2026): the old site's two use-case
     pages, reworked under the public rules, and a reading note on the three
     papers the founder named. Each ends with its own invitation. */
  {
    slug: 'deciding-what-to-assemble-next',
    href: '/writings/deciding-what-to-assemble-next',
    unlisted: true,
    title: 'Deciding what to <em>assemble</em> next.',
    dek: 'Much of plasmid construction can run on automation. The decisions between the stages (ratios, cycles, which colonies to carry forward) are still made by hand, and that is where a decision loop earns its place.',
    date: '2026-06-08',
    dateLabel: '8 June 2026',
    category: 'Field note',
    tag: 'Field note · Use case · June 2026',
    featured: false,
    visual: 'plate',
    provenance: 'Illustrative plate, not data',
  },
  {
    slug: 'antibody-discovery',
    href: '/writings/antibody-discovery',
    unlisted: true,
    title: 'Which antibody to test <em>next</em>.',
    dek: 'An antibody program narrows a large pool gate by gate, under several properties at once. A note on how a decision loop chooses the next batch, and what a published lab-in-the-loop campaign by others actually shows.',
    date: '2026-06-08',
    dateLabel: '8 June 2026',
    category: 'Field note',
    tag: 'Field note · Use case · June 2026',
    featured: false,
    visual: 'plate',
    provenance: 'Illustrative plate, not data',
  },
  /* Cheap thought, costly evidence: not to be published (founder, 13 Nov 2026);
     the page sits in a private folder (app/writings/_cheap-thought-costly-evidence).
    {
      slug: 'cheap-thought-costly-evidence',
      href: '/writings/cheap-thought-costly-evidence',
      title: 'Cheap thought, costly <em>evidence</em>.',
      dek: 'Six dated forecasts for AI in experimental biology, each with a probability and the observation that would prove us wrong.',
      date: '2026-10-01',
      dateLabel: 'October 2026',
      category: 'Perspective',
      tag: 'Perspective · Forecast · October 2026',
      featured: true,
      visual: 'forecast',
      provenance: 'Provisional forecasts, not a completed expert study',
    },
  */
  /* The old site's use-case pages, back at their own URLs with their own text
     (founder, 27 Oct 2026; content/use-cases.ts). */
  {
    slug: 'use-case-dna-assembly',
    href: '/use-cases/dna-assembly',
    title: 'DNA Assembly & Plasmid <em>Manufacturing</em>',
    dek: 'How ProviGen turns plasmid manufacturing into a decision loop.',
    date: '2026-06-08',
    dateLabel: '8 June 2026',
    category: 'Use case',
    tag: 'Use case · June 2026',
    featured: false,
    visual: 'plate',
    provenance: 'Illustrative plate, not data',
  },
  {
    slug: 'use-case-antibody-discovery',
    href: '/use-cases/antibody-discovery',
    title: 'Antibody <em>Discovery</em>',
    dek: 'How ProviGen turns antibody discovery into a decision loop across design, build, test, and learn.',
    date: '2026-06-08',
    dateLabel: '8 June 2026',
    category: 'Use case',
    tag: 'Use case · June 2026',
    featured: false,
    visual: 'plate',
    provenance: 'Illustrative plate, not data',
  },
  {
    slug: 'closed-loop-optimization',
    href: '/writings/closed-loop-optimization',
    title: 'Closed-loop experimental campaigns in <em>practice</em>.',
    dek: 'How a lab learns between rounds, from assays to media, with peer-reviewed evidence and the data that arrives last.',
    date: '2026-04-13',
    dateLabel: 'April 2026',
    category: 'Field note',
    tag: 'Field note · Evidence · April 2026',
    featured: true,
    visual: 'plate',
    provenance: 'Illustrative figures and published external data',
  },
];

/** Newest first, whatever order the list above is written in. */
/** The listed pieces, newest first: what /writings, the feed, the sitemap and "Next" walk. */
export const orderedWritings = writings.filter((w) => !w.unlisted).sort((a, b) =>
  b.date.localeCompare(a.date),
);

/** The piece after `slug` in the ledger (wraps to the newest). */
export function nextWriting(slug: string): WritingCard | undefined {
  if (orderedWritings.length < 2) return undefined;
  const index = orderedWritings.findIndex((w) => w.slug === slug);
  return orderedWritings[(Math.max(index, 0) + 1) % orderedWritings.length];
}
