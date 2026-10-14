/*
 * Field note: Which antibody to test next. Plain data; the page
 * (app/writings/antibody-discovery/page.tsx) renders it.
 *
 * Rewritten 4 October 2026 from the earlier use-case page
 * provigen.ai/use-cases/antibody-discovery, against the audit of that page and
 * the verified paper notes. Local types, so the Essay type in
 * the-bottleneck-moved.ts (category 'Perspective' only) stays untouched.
 *
 * Evidence discipline:
 * - Frey et al. is a bioRxiv PREPRINT (v3, 8 Nov 2025), Genentech and Roche
 *   authors, self-reported, not independently replicated. Every figure taken
 *   from it is attributed in the sentence that carries it.
 * - The earlier draft's two expression and functional-binding percentages are
 *   NOT results of that campaign; they are a Methods description of an earlier
 *   generative-model study. They are not used here, in any form.
 * - The honest headline from the campaign is the round-over-round share of
 *   designs clearing the authors' three-times-better binding threshold: about
 *   2% of designs in round 1, over 21% in round 4. Those are the only two
 *   percentages on the page, and both are third-party.
 * - MULTI-evolve: Tran et al., Science 2026, doi 10.1126/science.aea1820
 *   (the old draft's DOI belonged to a different paper). Peer-reviewed.
 * - The old draft's acquisition paragraph (an AI company, a startup and a deal
 *   size, from trade press) and its reference are deleted outright, with no
 *   replacement company name or figure.
 * - No cross-program or cross-partner learning, and no claim that experiments
 *   run anywhere improve our pipeline.
 *
 * Condensed 14 October 2026: body cut by roughly 40%, em dashes removed from
 * all visible strings, readingMinutes recalculated. Every citation, status
 * marker and third-party figure above was preserved.
 * - ProviGen capabilities carry the statuses set by ProviGen engineering,
 *   Sep 2026. Antibody-specific models (generative sequence proposal, antibody
 *   property predictors) have no confirmed status and are therefore described
 *   as how a decision loop applies, never as something we run.
 *
 * Headlines carry exactly one <em> word. Body strings may use <em>, <strong>,
 * <a href> and the status chips.
 */

export type FieldNoteSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type FieldNoteReference = {
  label: string;
  href?: string;
  note: string;
};

export type FieldNote = {
  slug: string;
  title: string;
  dek: string;
  date: string;
  category: 'Field note';
  readingMinutes: number;
  disclaimer: string;
  sections: FieldNoteSection[];
  references: FieldNoteReference[];
};

export const antibodyDiscovery: FieldNote = {
  slug: 'antibody-discovery',
  title: 'Which antibody to test <em>next</em>.',
  dek: 'An antibody program narrows a large pool gate by gate, under several properties at once. A note on how a decision loop chooses the next batch, and what a published lab-in-the-loop campaign by others actually shows.',
  date: '2026-06-08', // the old site's use-case page, 8 Jun 2026
  category: 'Field note',
  readingMinutes: 5,
  disclaimer:
    'A note on how a decision loop applies to antibody selection. The campaign described under “A published campaign” is third-party work by a Genentech and Roche team, reported in a bioRxiv preprint: it is not a ProviGen result, and we had no part in it. Our own capabilities are named with their status. Antibody-specific models are described as how the loop would apply, not as something we run.',
  sections: [
    {
      id: 'gates',
      title: 'The pool narrows at every <em>gate</em>.',
      paragraphs: [
        'An antibody program begins with many candidates and ends with few. They arrive from immunisation, display, B-cell workflows, repertoire mining or computational generation, then move through binding assays, functional screens, expression, specificity panels and developability.',
        'At every gate the pool shrinks, and the candidates still standing are the expensive ones. A molecule that reaches developability has already cost several assay types, an expression system and more than one round of characterisation, so a failure there is the one that cost most to reach.',
        'The calls are made gate by gate, from experience, threshold rules and judgement. Earlier data informs them, but rarely as one model carried forward: what round one showed about expression is not always in front of the round-three choice.',
      ],
    },
    {
      id: 'properties',
      title: 'Several properties at <em>once</em>.',
      paragraphs: [
        'A candidate has to hold up on several axes at once: affinity and kinetics, expression yield, specificity, stability, potency and developability. Which of them pull against each other, each team answers for itself. One way to run that is to select on one axis and check the rest afterwards. The other is to make the trade-off part of the decision: estimate the set where no property can improve without giving one up (the Pareto frontier) and move toward it. The machinery is published, and in the case of Merck KGaA’s <a href="https://doi.org/10.1039/D5DD00050E">BayBE</a>, open source.',
        'In our own loop that choice is the Decide step. <em>Running.</em> Active learning chooses the next batch under multiple objectives, from heterogeneous data, including signals that arrive weeks later. The generic argument, with a live simulation, is in our field note on <a href="/writings/closed-loop-optimization">closed-loop experimental campaigns</a>.',
      ],
    },
    {
      id: 'loop',
      title: 'How the decision loop <em>applies</em>.',
      paragraphs: [
        'For a characterisation pipeline the loop is five steps. The statuses are ProviGen’s, set by our engineering in September 2026, and describe general capability, not an antibody offering.',
        '<strong>1. The objectives are written down first.</strong> <em>Running.</em> Scientists set the targets and thresholds, name the properties that may not be traded away, approve each batch and override any decision.',
        '<strong>2. The next batch is chosen, not just ranked.</strong> <em>Running.</em> Some candidates are selected because they should do well, others because the model is uncertain about them. Top scorers alone teach it very little.',
        '<strong>3. The batch becomes an executable protocol.</strong> <em>Running for supported workflows.</em> Conditions become a versioned protocol for a named instrument set: layouts, controls, replicates, timing. <em>Running per instrument.</em> Instruments are driven through vendor APIs and open frameworks, on hardware a lab owns. Sequencing runs across shared instruments is <em>In development</em>, so today the lab’s team runs each stage.',
        '<strong>4. Results are recorded with the conditions that produced them.</strong> <em>Running.</em> Each is stored with its protocol version, device logs and deviations, which is what lets an expression failure be read as a property of the sequence rather than of the plate.',
        '<strong>5. Partial results count before the panel is complete.</strong> <em>Running.</em> Early binding data can tell you which candidates are worth the slower stability or specificity work, and a failure is a measurement like any other.',
        'We claim no status for the antibody-specific modelling: generative proposal of variants, property predictors and the frontier they would trace. Those sit at the proposal end and are the program’s call. The loop is the part we build.',
      ],
    },
    {
      id: 'published',
      title: 'A published campaign, in <em>preprint</em>.',
      paragraphs: [
        'A detailed public account of this in a wet lab comes from a Genentech and Roche team: “Lab-in-the-loop therapeutic antibody design with deep learning” (Frey et al., bioRxiv v3, November 2025). It is not peer-reviewed, it is self-reported by one organisation, and it has not been independently replicated. We had no part in it, and nothing below is a ProviGen result.',
        'Their setup is the loop above: models propose variants, predictors score them, a ranking step selects a non-dominated batch, the batch is measured, and the measurements retrain the models. They applied it to eleven seed antibodies against EGFR, IL-6, HER2 and OSM, with trastuzumab as a benchmark, measuring more than 1,800 variants over four rounds.',
        'What matters is the shape of the curve. A design counted as a success only if it bound at least three times better than its seed, a threshold chosen to sit well above instrument noise. By their report, the share clearing it rose from about <strong>2%</strong> in round one to over <strong>21%</strong> by round four. Both numbers are theirs. What improved was the selection, not any single model in it.',
        'The loop was, in the authors’ own word, semi-autonomous: humans stayed in it, cycles ran over several weeks, and automated execution is not what the paper demonstrates.',
        'Success was measured as binding and expression, not biological function, which the authors name as future work. Against a randomised repertoire-mining control, the designed variants improved three of five seeds tested; the control won the other two, though it carried no developability or expression constraints. The scope is affinity maturation, not discovery from nothing.',
      ],
    },
    {
      id: 'evolution',
      title: 'A second line of <em>work</em>.',
      paragraphs: [
        'A different route to the same idea is MULTI-evolve, from the Arc Institute, peer-reviewed in <a href="https://doi.org/10.1126/science.aea1820">Science</a> in 2026. It combines protein language models with measured epistatic interactions (how mutations interact, not how they score alone) to propose proteins carrying many mutations at once.',
        'The wet-lab part trained on roughly one to two hundred measured variants per protein, mostly double mutants chosen to expose those interactions, and improved an engineered enzyme, a splicing protein and an antibody. The rest is retrospective evaluation on published datasets, and the proteins are mostly not antibodies, so it is evidence for the method, not for an antibody pipeline. The lesson for a fixed budget: a small set of deliberately chosen measurements steers design further than a large set of convenient ones.',
      ],
    },
    {
      id: 'program',
      title: 'Where this leaves a <em>program</em>.',
      paragraphs: [
        'We work with partner laboratories, on their instruments: the model proposes what to test next, their scientists decide what runs, and every result, failures included, is recorded with its conditions before the next selection. Automated scheduling and execution are in development.',
        'If you are weighing what a lab-in-the-loop project could look like for your own antibody work, <a href="/contact">Contact us</a>.',
      ],
    },
  ],
  references: [
    {
      label:
        'Frey et al. · Lab-in-the-loop therapeutic antibody design with deep learning · bioRxiv · 2025',
      href: 'https://doi.org/10.1101/2025.02.19.639050',
      note: 'External. bioRxiv preprint, v3 posted 8 November 2025; not peer-reviewed. Primary research by a Genentech and Roche team: machine-learning design with wet-lab expression, SPR binding measurement and crystal structures. Self-reported, single organisation, not independently replicated. Every figure quoted from it on this page is theirs, not a ProviGen result.',
    },
    {
      label:
        'Tran et al. · Rapid directed evolution guided by protein language models and epistatic interactions · Science · 2026',
      href: 'https://doi.org/10.1126/science.aea1820',
      note: 'External. Peer-reviewed. Arc Institute; the framework is called MULTI-evolve. Wet-lab directed evolution of several proteins, plus a retrospective computational evaluation on published datasets. Mostly proteins other than antibodies.',
    },
    {
      label:
        'Fitzner et al. · BayBE: a Bayesian back end for experimental planning in the low-to-no-data regime · Digital Discovery · 2025',
      href: 'https://doi.org/10.1039/D5DD00050E',
      note: 'External. Peer-reviewed. A Bayesian back end for experimental planning in the low-to-no-data regime, built at Merck KGaA and released as open source. Cited as a published, openly available tool, not as a result.',
    },
    {
      /* No href: the earlier page is not a live destination, and this note is
         where the material now lives. Provenance stays as plain text. */
      label: 'Original publication · ProviGen use-case page · Antibody discovery',
      note: 'Rewritten for /writings on 4 October 2026. Every figure on this page comes from the sources cited above, with the attribution stated in the sentence that carries it.',
    },
  ],
};
