/*
 * Homepage section 1b · Start here (founder, 6 Oct 2026): right under the
 * opening, one door per audience, so every stakeholder finds what they need
 * and calls us. Each door opens a page that explains ProviGen again for that
 * reader: /biopharma (the technical one, which grows as we add what we can
 * offer) and /ai-labs (planned, our next phase). On 7 Oct 2026 the founder
 * removed the Investors door and turned "Frontier labs" into AI Labs: labs
 * building models of biology, such as protein prediction and virtual cells.
 *
 * Thejas Nagaraju's critique of 4 Oct 2026 ("who is the 'you'?") is answered
 * here: the reader picks who they are before the problem section speaks to
 * them. Founder rules hold on every door: no own lab, no use of partners'
 * data, no metrics.
 */
export type Audience = {
  readonly id: string;
  readonly href: string;
  /** The door's name, in the display face. */
  readonly title: string;
  /** One sentence: what the reader finds behind it. */
  readonly line: string;
  /** The mono call under it. */
  readonly cta: string;
};

export const audiences = {
  /** The section's h2, set as a mono label. */
  label: 'Start here',
  doors: [
    {
      id: 'biopharma',
      href: '/biopharma',
      title: 'Pharma & Biotech',
      line: 'What the software does for process development, assay development and manufacturing, with a worked example.',
      cta: 'For your lab',
    },
    {
      id: 'ai-labs',
      href: '/ai-labs',
      title: 'AI Labs',
      line: 'Experimental data for models of biology, from protein prediction to virtual cells. Planned for our next phase.',
      cta: 'For AI labs',
    },
  ] satisfies readonly Audience[],
} as const;
