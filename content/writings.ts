/* Writings ledger, newest first. `date` is ISO for <time dateTime>; `dateLabel`
   is what the cards show. Titles may carry one <em>. `featured` entries open
   the index as large cards with their own visual, two to a row (the episode and
   the manifesto joined the forecast and the field note on 4 Oct 2026, on the
   founder's call); the rest form the compact "More writing" list. Every entry keeps a provenance line for its visual. */

export type WritingCategory = 'Perspective' | 'Field note' | 'Conversation' | 'Use case';

/**
 * Which visual a card carries (components/writings/WritingVisual). 'episode'
 * is a recorded conversation's own thumbnail, from `poster`.
 */
export type WritingVisual = 'forecast' | 'plate' | 'cycle' | 'membrane' | 'episode';

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
};

/* Dates are first publication (14 Oct 2026): the use cases and the manifesto
   as the old site published them, the episode as it aired. */
export const writings: WritingCard[] = [
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
    dek: 'Biotech is entering a new era. Lab-in-the-loop is becoming the new operating model for biotechnology.',
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
export const orderedWritings = [...writings].sort((a, b) =>
  b.date.localeCompare(a.date),
);

/** The piece after `slug` in the ledger (wraps to the newest). */
export function nextWriting(slug: string): WritingCard | undefined {
  if (orderedWritings.length < 2) return undefined;
  const index = orderedWritings.findIndex((w) => w.slug === slug);
  return orderedWritings[(Math.max(index, 0) + 1) % orderedWritings.length];
}
