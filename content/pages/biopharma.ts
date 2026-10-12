/*
 * /biopharma, the Pharma & Biotech door of the homepage's "Start here".
 *
 * 8 Oct 2026, evening: rebuilt from the founders' Merck LNP deck (Lucas and
 * Thejas, 9 slides; ~/Downloads/ProviGen_Merck_LNP.pdf and .pptx are the
 * same deck) on the founder's ask to "draw inspiration from the decks and
 * propose the best possible subpage". What the deck brought:
 * - "36 vs. 6 experiments": most experiments are chosen before the data
 *   exists (Guess);
 * - "Real workflows span many parameters, not two": LNP, iPSC, CHO and
 *   fermentation with their parameters (Params);
 * - walk-forward prediction on past runs and splitting process effects from
 *   biological ones (History);
 * - the enzymatic-assay case study (~200 to ~40 samples, an industry
 *   partner's two robotic workcells), gated below;
 * - Genentech's lab-in-the-loop preprint;
 * - "Active learning does not require automation" (Modes), with the deck's
 *   cover sketch of a workcell.
 * Left out of the deck: the "10–100x more sample efficient" line (no
 * source), the ~$10k saving per round, the "5x" and the Helsinki lab photo
 * (a partner's lab, brand logos in view), the contacts (no team on this
 * page) and the Merck name.
 *
 * Kept from the version of earlier the same day (archived in
 * output/provigen-website-removed-2026-10-08/biopharma-before-deck/): the
 * hero footage, the plate round, the published studies, the first project.
 * Today's partner rows were kept too, then cut that night on the founder's
 * word. The homepage's landscapes, the three "why it is hard"
 * diagrams and the task streams gave way to the deck's figures.
 *
 * 9 Oct 2026: three figures redrawn, each as one idea, on the founder's
 * "much simpler, convey the core message": the five-step plate became three
 * plates of one LNP example (Rounds), the run lines and sliders became the
 * count of combinations (Params, LNP only, the workflow tabs gone), and the
 * run squares and variance bar became one backtest chart (History). The
 * earlier figures are archived in
 * output/provigen-website-removed-2026-10-08/biopharma-figures-before-simplify/.
 *
 * Founder rules: no section labels (as on /ai-labs since 8 Oct), no own lab,
 * nothing on using partners' data, no ownership statements. ProviGen figures
 * only with sign-off: the case study is listed in claims-ledger.json, unsigned,
 * and carries [TBC], so a production build fails until it is approved
 * (scripts/check-claims.mjs). Partners are described by their work, never
 * named. 11 Oct 2026 (founder: no more content to share for now, "delete
 * or optimize"): no [TBC] is left on the page. The lines were reworded so
 * they hold as written (no week counts in the first project, no partner
 * note). Still to confirm off the page: the case study's figures and the
 * measure behind "precision" (claims-ledger "biopharma-case-study" stays
 * unsigned until the founder signs), the partner's approval of the wording,
 * and with Lucas that the test on past runs is offered today.
 */
import type { Param } from '@/components/audiences/bp/Params';

export const biopharma = {
  meta: {
    title: 'For pharma and biotech',
    description:
      'ProviGen for process development, assay and MSAT teams: each result chooses the next experiment, as a ranked list for your bench or a protocol for your instruments.',
  },
  hero: {
    /** Not the homepage's "Every result steers the next experiment" (founder: no replication of the homepage). */
    title: { lead: 'Your next round,', em: 'designed from the last' },
    dek: 'For process development, assay and MSAT teams. Your target and ranges go in; the next round comes out, as a ranked list for your bench or a protocol for your instruments.',
    cta: { href: '/contact', label: 'Bring us one process' },
    /** The founder's own plate-handling footage (8 Oct 2026), full frame 16:9 from the 4K source; see IMAGE_PROVENANCE.md. */
    film: {
      name: 'bp-hero',
      poster: '/assets/v3/bp-hero-poster.webp',
      label: 'An eight-channel pipette head lowering its tips into a 96-well plate of yellow samples.',
    },
  },

  /** The figures' pause control (WCAG 2.2.2). */
  pause: 'Pause the animation',
  play: 'Play the animation',

  /** Deck slide 3, "The cost of guessing". */
  guess: {
    id: 'guess',
    label: 'The cost of guessing',
    head: { lead: 'Most experiments are chosen', em: 'before the data exists' },
    fixed: { name: 'Chosen up front', line: 'Thirty-six conditions, all set before the first result.' },
    adaptive: { name: 'Chosen as you learn', line: 'Six runs, each picked from the one before.' },
    alt: 'Two panels on the same response surface, its optimum marked with a star. Left, chosen up front: a six by six grid of thirty-six conditions is laid out at once and measured a column at a time; its best run lands near the star, not on it. Right, chosen as you learn: six runs, each placed from the result before, step from the lower left onto the star.',
  },

  /**
   * Round by round (11 Oct 2026, the fourth drawing). The plates are gone:
   * the founder found they did not explain themselves and asked for the fix
   * "without cluttering the website". One chart is left: each round's
   * conditions against the target, the process as it runs today as a line.
   * Sizes are illustrative (components/audiences/bp/Rounds).
   */
  round: {
    id: 'round',
    label: 'Round by round',
    head: { lead: 'Round by round,', em: 'closer to the target' },
    line: 'The model designs each round from the results of the last. Your team runs it, on your instruments.',
    labels: {
      rounds: ['Round 1', 'Round 2', 'Round 3'],
      unit: 'Particle size in nm · one dot per condition tested',
      target: 'Target',
      reference: 'Your process today',
      inTarget: 'in target',
    },
    alt: 'A chart of particle size for the eighteen conditions tested in each of three rounds, against a target band of 80 to 100 nanometres and a dashed line for the process as it runs today, at 131. In round 1 no condition is in target, in round 2 four are, in round 3 fourteen.',
  },

  /**
   * Deck slide 4, "The parameter problem", drawn as one idea (9 Oct 2026,
   * founder: "much simpler, convey the core message"): each parameter
   * multiplies the combinations. Arithmetic, no data (components/audiences/bp/Params).
   */
  params: {
    id: 'parameters',
    label: 'Many parameters, not two',
    head: { lead: 'Real workflows span', em: 'many parameters, not two' },
    line: 'No plate covers every combination. Each round, the model picks the few runs worth making, across all parameters at once.',
    params: [
      { name: 'Ionizable lipid' },
      { name: 'Helper lipid' },
      { name: 'PEG-lipid share' },
      { name: 'N/P ratio' },
      { name: 'Lipid molar ratios' },
      { name: 'Lipid concentration' },
      { name: 'Flow rate ratio' },
      { name: 'Total flow rate' },
      { name: 'Mixing method' },
      { name: 'Buffer pH' },
      { name: 'TFF or dialysis' },
      { name: 'Cryoprotectant' },
    ] satisfies readonly Param[],
    labels: {
      params: 'Parameters of an LNP formulation',
      combos: 'Combinations, at six levels each',
      plate: 'One plate holds 96.',
    },
    alt: 'The twelve parameters of an LNP formulation join one by one, each with six levels. Beside them the number of combinations multiplies: two parameters make 36, twelve make 2,176,782,336. One plate holds 96.',
  },

  /** Deck slide 6, walk-forward prediction, as one chart (9 Oct 2026; the variance split of slide 5 is cut). [TBC: Lucas, offered today?] */
  history: {
    id: 'past-runs',
    label: 'Your past runs',
    head: { lead: 'Start with the runs', em: 'you already have' },
    walkLine:
      'Before a new plate, the model is tested on your history: run 9 predicted from runs 1 to 8, run 10 from 1 to 9. You see how well it knows your process before you rely on it.',
    chart: {
      unit: 'nm',
      run: 'Run',
      predicted: 'predicted',
      measured: 'measured',
      legendMeasured: 'Measured',
      legendPredicted: 'Predicted, with its range',
    },
    alt: 'A chart of particle size over sixteen past runs. From run 9 on, the model predicts each run with a range before it is read; every measured value lands inside its range, and the ranges narrow as the record grows.',
  },

  /** Deck slide 7. ProviGen figures: claims-ledger "biopharma-case-study", unsigned. */
  proof: {
    id: 'case-study',
    label: 'A case study',
    kicker: 'Case study',
    head: { lead: 'An enzymatic assay,', em: 'optimised with an industry partner' },
    samples: {
      rows: [
        { label: 'Design of experiments', figure: '~200 samples', n: 200 },
        { label: 'Active learning', figure: '~40 samples', n: 40, ours: true },
      ],
      alt: 'One field of about two hundred dots, one per sample: the whole field is what a classical design of experiments needed, the lit first forty what active learning needed.',
    },
    facts: [
      { name: 'Precision', line: '~30% better.' },
      { name: 'Where', line: 'On the partner’s two robotic workcells for high-throughput screening.' },
      { name: 'Status', line: 'A ProviGen project. Not yet published.' },
    ],
  },

  /** "With partners today" (three anonymised partner rows) removed on the founder's word, 8 Oct 2026, evening; archived in output/provigen-website-removed-2026-10-08/. */
  evidence: {
    id: 'evidence',
    label: 'Evidence',
    head: { lead: 'Others have shown it', em: 'in the lab' },
    /** "Other groups' results, not ProviGen's." cut on the founder's word (11 Oct 2026); each row still names its authors and journal. */
    studies: [
      {
        figure: '1,800+',
        unit: 'antibody variants, four rounds',
        line: 'Genentech’s lab in the loop: models propose, active learning picks what to assay, and all four targets gained better binders.',
        cite: 'Frey NC et al., bioRxiv 2025.02.19.639050 (2025)',
        href: 'https://doi.org/10.1101/2025.02.19.639050',
        kind: 'Preprint · wet lab',
      },
      {
        figure: '24',
        unit: 'experiments, four rounds',
        line: 'Iterative Bayesian design found a blend of four media that kept more immune cells alive than any one alone.',
        cite: 'Narayanan H et al., Nature Communications 16, 6055 (2025)',
        href: 'https://doi.org/10.1038/s41467-025-61113-5',
        kind: 'Peer-reviewed · wet lab',
        dots: { rounds: 4, per: 6 },
      },
      {
        figure: '81',
        unit: 'experiments where DoE used 132',
        line: 'Bayesian optimisation against a classical design, for a 14-component cell medium, both run in the lab.',
        cite: 'Cosenza Z et al., Biotechnology and Bioengineering 119, 2447–2458 (2022)',
        href: 'https://doi.org/10.1002/bit.28132',
        kind: 'Peer-reviewed · wet lab',
        bars: { a: 81, b: 132, aLabel: 'Adaptive', bLabel: 'DoE' },
      },
    ],
  },

  /**
   * The set-up section ("Automation helps. It isn't required.", deck slide 8,
   * with the workcell sketch and the three ways of working) was deleted on the
   * founder's word, 11 Oct 2026 ("doesn't make much sense at all"); archived in
   * output/provigen-website-removed-2026-10-08/biopharma-setup-section/.
   */
  first: {
    id: 'first-project',
    label: 'A first project',
    head: { lead: 'How a first project', em: 'runs' },
    steps: [
      { when: 'First', line: 'Target, baseline and what counts as success, agreed.' },
      { when: 'Then', line: 'The model tested on your past runs.' },
      { when: 'Each round', line: 'A round designed, run and learned from.' },
      { when: 'After a few rounds', line: 'Stop, extend, or start a second process.' },
    ],
    /** The confidentiality line under the timeline was cut on the founder's word (11 Oct 2026). */
  },

  close: {
    id: 'talk',
    eyebrow: 'Pharma & Biotech',
    title: 'Bring us one process. We’ll design its next round.',
    primary: { href: '/contact', label: 'Contact us' },
  },
} as const;
