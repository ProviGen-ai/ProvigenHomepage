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
 * them. 13 Oct 2026: the door lines say what we do, with nothing marked as
 * planned (Pharma & Biotech: the right parameters found automatically, data
 * from past runs, sources of variation, with the workflows of the /biopharma
 * page named as examples; AI Labs: from model prediction to physical execution on
 * partners' autonomous labs, a loop that can serve as a post-training
 * environment). Founder rules hold on every door: no own lab, no use of partners'
 * data, no metrics.
 */
export type Audience = {
  readonly id: string;
  readonly href: string;
  /** The door's name, in the display face. */
  readonly title: string;
  /** One sentence: what the reader finds behind it. */
  readonly line: string;
  /** Optional second paragraph under the line. */
  readonly more?: string;
  /** Optional examples under the line: a lead-in, then one bullet per item. */
  readonly examples?: { readonly lead: string; readonly items: readonly string[] };
  /** The mono call under it. */
  readonly cta: string;
};

export const audiences = {
  /**
   * Whether the doors link to /biopharma and /ai-labs. Off on the live site for
   * now (founder, 14 Oct 2026): the cards stay, without their call or link;
   * the website-fork branch keeps them on.
   */
  linked: false as boolean,
  /** The section's h2, set as a mono label. */
  label: 'Start here',
  doors: [
    {
      id: 'biopharma',
      href: '/biopharma',
      title: 'Pharma & Biotech',
      line: 'Lab-in-the-loop assay and process development: find the right parameters automatically, use data from past runs and characterise sources of variation.',
      examples: {
        lead: 'For example:',
        items: ['LNP formulation', 'iPSC differentiation', 'CHO cultures', 'Fermentation'],
      },
      cta: 'For your lab',
    },
    {
      id: 'ai-labs',
      href: '/ai-labs',
      title: 'AI Labs',
      line: 'Physically execute and validate your model’s predictions, fully automated, on your own infrastructure or that of our partners.',
      more: 'Each round of prediction, experiment and measurement yields ground truth validation data, which makes the loop a natural environment for post-training.',
      cta: 'For AI labs',
    },
  ] satisfies readonly Audience[],
} as const;
