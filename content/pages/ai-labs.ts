/*
 * /ai-labs (7 Oct 2026; /frontier-labs from 6 Oct 2026 until then), the second
 * door of the homepage's "Start here": AI labs that build models of biology,
 * such as protein prediction, virtual cells and DNA and RNA models, and need
 * experimental data to train and test them on. Founder's brief: "not frontier
 * labs but AI labs ... that can leverage our pipeline to train their world
 * models, virtual cell or protein prediction"; "Phase 2 later", so everything
 * that is not built says so in words.
 *
 * 8 Oct 2026 (founder): no section labels; the intro in his words ("The
 * infrastructure exists. Decisions remain manual." and ProviGen as the middle
 * layer from intent to protocol); a BindCraft example after it; world models
 * out, DNA and RNA in; the three figures redrawn to show what each card says;
 * the planned part names partners that run fully automated labs around the
 * clock. "Next, we want to point that pipeline at what your model needs to
 * learn." is deleted.
 *
 * Public rules hold (founder, 3 Oct 2026): no lab of our own, nothing on using
 * or reselling partners' data (the data here is measured for the AI lab's own
 * project), no AI-company names. BindCraft is an open-source academic design
 * tool, named on the founder's word; the example is hypothetical and claims
 * nothing about BindCraft's results.
 * [TBC: founders sign off the offer and its wording.]
 */
import type { ModelCard } from '@/components/audiences/ailabs/ModelCards';

export const aiLabs = {
  meta: {
    title: 'For AI labs',
    description:
      'For AI labs building models of biology, from protein prediction to virtual cells and DNA and RNA: ProviGen turns intent into executable, optimised protocols that generate high-quality data. Planned for ProviGen’s next phase.',
  },
  hero: {
    title: { lead: 'Models propose.', em: 'Experiments decide' },
    dek: 'For AI labs building models of biology: protein prediction, virtual cells, DNA and RNA. Planned for our next phase.',
    /** components/audiences/ailabs/ProposeDecide: schematic, no data. */
    figure: {
      alt: 'A model’s guesses about a response, drawn as many faint curves with a wide band of uncertainty. Each round the model proposes experiments where it is least certain, the lab measures them, and the curves narrow onto the measurements until the model has learned the response.',
      pause: 'Pause the animation',
      play: 'Play the animation',
    },
  },
  idea: {
    id: 'idea',
    label: 'The idea',
    lines: [
      'The infrastructure exists. Decisions remain manual.',
      'ProviGen is the middle layer: it turns high-level intent, from a model or a scientist, into executable, optimised protocols that generate high-quality data.',
    ],
  },
  /** One case, briefly (founder: BindCraft and a thousand binders). Hypothetical; no outcome figures. */
  example: {
    id: 'example',
    label: 'An example',
    kicker: 'Example',
    lines: [
      'Say BindCraft returns a thousand binders that all look viable in silico. Which do you make and measure first?',
      'ProviGen picks the first plate that will tell you the most, writes its protocol, and lets each binding readout choose the next.',
    ],
    /** The map's caption, one per step. */
    steps: ['1,000 designs', 'Plate 1 · 24 across the map', 'Plate 1 measured', 'Plate 2 · 24 near the binders', 'Plate 2 measured'],
    alt: 'A map of a thousand designed binders as small dots. A first plate of 24 is picked across the whole map; once measured, a few of them bind. The second plate of 24 gathers around those binders.',
  },
  /**
   * What we plan to do (founder: "the what we plan to do section"): the data
   * each model family needs, each with a figure that shows the card's words
   * (components/audiences/ailabs/Cards.tsx).
   */
  uses: {
    id: 'models',
    label: 'What we plan',
    status: 'Planned · our next phase',
    lead: 'With partners that run fully automated labs around the clock, we plan to measure what each kind of model needs.',
    cards: [
      {
        id: 'protein',
        name: 'Protein prediction',
        line: 'Expression, stability, binding and activity, measured across designed variants, to train and test structure and function models.',
        alt: 'A grid of six designed protein variants by four measured properties: expression, stability, binding and activity. The grid fills column by column as each property is measured.',
      },
      {
        id: 'cells',
        name: 'Virtual cells',
        line: 'How cells respond to perturbations across media, doses and time, measured under conditions you choose.',
        alt: 'A grid of cells by dose and time. The cells appear time point by time point; at higher doses and later times they shrink and fade, showing their response.',
      },
      {
        id: 'nucleic',
        name: 'DNA and RNA',
        line: 'How sequence sets function: promoters, UTRs, guides and whole constructs, measured across designed variants for sequence models.',
        alt: 'A DNA strand with one designed region. Below it, six variants of that region, each with its changed bases marked and a bar for how strongly it is expressed; the bars grow in as they are measured.',
      },
    ] satisfies readonly ModelCard[],
  },
  close: {
    id: 'talk',
    eyebrow: 'AI labs',
    title: 'Building models of biology? Talk to us early.',
    note: 'Tell us what your model should learn.',
    primary: { href: '/contact', label: 'Contact us' },
    secondary: { href: '/biopharma', label: 'What the software does today' },
  },
} as const;
