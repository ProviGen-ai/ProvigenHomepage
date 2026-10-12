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
 * - No cross-program or cross-partner learning: the one permitted sentence
 *   about improving our pipeline appears once, in the closing section.
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
  date: '2026-10-04',
  category: 'Field note',
  readingMinutes: 7,
  disclaimer:
    'A note on how a decision loop applies to antibody selection. The campaign described under “A published campaign” is third-party work by a Genentech and Roche team, reported in a bioRxiv preprint: it is not a ProviGen result, and we had no part in it. Our own capabilities are named with their status. Antibody-specific models are described as how the loop would apply, not as something we run.',
  sections: [
    {
      id: 'gates',
      title: 'The pool narrows at every <em>gate</em>.',
      paragraphs: [
        'An antibody program begins with many candidates and ends with few. They arrive from animal immunisation, phage or yeast display, single B-cell workflows, immune repertoire mining, or computational generation. From there the work moves through binding assays, functional screens, recombinant expression, specificity panels, stability profiling, developability assessment and, in the end, a judgement about whether the molecule can be made at scale.',
        'At every gate the pool shrinks, and the candidates still standing are the expensive ones. A molecule that reaches developability has already cost several assay types, an expression system and more than one round of characterisation. A failure there is the failure that cost the most to reach.',
        'Those decisions are made gate by gate, from program experience, threshold rules and the judgement of people who know the target. Data from the earlier stages informs them. What it less often does is arrive as one model that carries every stage forward, so what round one showed about expression is not always in front of the choice made in round three.',
      ],
    },
    {
      id: 'properties',
      title: 'Several properties at <em>once</em>.',
      paragraphs: [
        'A therapeutic candidate has to hold up on several axes at the same time: binding affinity and kinetics, expression yield, specificity, thermal and colloidal stability, functional potency, and the developability properties that decide whether the molecule can be formulated and manufactured. Which of these pull against each other is a question each team answers for its own molecules.',
        'One way to run that is to select on one axis and check the rest afterwards. The other is to make the trade-off part of the decision: estimate the set of candidates where no property can improve without giving one up — the Pareto frontier — and choose the next batch to move toward it, with the team setting which properties matter most for this program. The machinery for this is not exotic or proprietary; Bayesian experimental planning is published, and in the case of Merck KGaA’s <a href="https://doi.org/10.1039/D5DD00050E">BayBE</a>, released as open source.',
        'In our own loop the multi-objective choice is the Decide step. <em>Running.</em> Active learning chooses the next batch under multiple objectives, from heterogeneous data, including signals that arrive weeks after the batch that produced them. The generic version of that argument, with a live simulation, is in our field note on <a href="/writings/closed-loop-optimization">closed-loop experimental campaigns</a>; what follows here is the antibody-shaped version of it.',
      ],
    },
    {
      id: 'loop',
      title: 'How the decision loop <em>applies</em>.',
      paragraphs: [
        'Written out for a characterisation pipeline, the loop is five plain steps. The statuses are ProviGen’s, set by our engineering in September 2026, and they describe general capability, not an antibody offering.',
        '<strong>1. The objectives are written down first.</strong> <em>Running.</em> Scientists set the targets, the thresholds and the properties that may not be traded away, approve each batch and override any decision. An objective that lives only in a reviewer’s head cannot be optimised against, and should not be.',
        '<strong>2. The next batch is chosen, not just ranked.</strong> <em>Running.</em> Some candidates are selected because they are predicted to do well; others because the model is uncertain about them and measuring them sharpens every later choice. A batch of the top-scoring candidates alone teaches the model very little.',
        '<strong>3. The chosen batch becomes an executable protocol.</strong> <em>Running for supported workflows.</em> Conditions become a versioned protocol for a specific instrument set: layouts, controls, replicates, timing. Instruments are driven through vendor APIs and open frameworks, on the hardware a lab already owns. <em>Running per instrument.</em> Sequencing those runs across shared instruments, with incubation windows respected, is <em>In development</em>, so today the lab’s own team runs each stage.',
        '<strong>4. What came back is recorded with the conditions that produced it.</strong> <em>Running.</em> Each result is stored with its conditions, protocol version, device logs and deviations. For antibodies this is what lets an expression failure be read as a property of the sequence rather than of the plate it was made on, which is the difference between a usable training point and a misleading one.',
        '<strong>5. Partial results count before the panel is complete.</strong> <em>Running.</em> Binding data that arrives early can inform which candidates are worth the slower stability or specificity work, and a candidate that failed is a measurement like any other. Heterogeneous and delayed data are part of what the Decide step handles.',
        'What we do not claim a status for is the antibody-specific modelling: generative proposal of sequence variants, property predictors for an antibody panel, and the frontier those predictors would trace. Those sit at the proposal end of this loop, and whether a program works from models it already uses, from published ones, or from display and repertoire data is the program’s call. The loop is the part we build.',
      ],
    },
    {
      id: 'published',
      title: 'A published campaign, in <em>preprint</em>.',
      paragraphs: [
        'A detailed public account of this working in a wet lab comes from a Genentech and Roche team, in a bioRxiv preprint titled “Lab-in-the-loop therapeutic antibody design with deep learning” (Frey et al., v3, November 2025). It is not peer-reviewed, it is self-reported by one organisation, and it has not been independently replicated. We had no part in it, and nothing below is a ProviGen result.',
        'Their setup is the loop described above: generative models propose variants, multi-task predictors score them, a ranking step selects a non-dominated batch, the batch is made and measured, and the measurements retrain the models for the next round. They applied it to eleven seed antibodies against four clinically relevant targets — EGFR, IL-6, HER2 and OSM — ten of the seeds from animal immunisation and repertoire mining, the eleventh trastuzumab, included as a benchmark. Over four rounds they made and measured more than 1,800 unique variants.',
        'The figure worth carrying away is not the best molecule but the shape of the curve. The authors counted a design a success only if it bound at least three times better than its seed, a threshold they chose to sit well above their instrument noise. By their report, the share of designs clearing it rose from about <strong>2%</strong> in round one to over <strong>21%</strong> by round four. Both numbers are theirs. What improved across the rounds was the selection, not any single model in it.',
        'Two further details matter for anyone deciding whether this is relevant to their own bench. The equipment was ordinary: DNA from a commercial synthesis vendor, millilitre-scale transient expression in deep-well plates, affinity by surface plasmon resonance. And the loop was, in the authors’ own word, semi-autonomous — humans stayed in it, and the wet-lab arm ran on cycles of several weeks. Automated execution is not what the paper demonstrates, which is also why our own scheduling status reads as it does.',
        'The honest caveats belong next to the headline. Designs were optimised for expression yield, non-specific binding and developability filters alongside affinity, which is the multi-property point made above. But success was measured as binding and expression, not biological function, and the authors name optimising for function as future work. Against a randomised repertoire-mining control, the model-designed variants gave the better improvement for three of five seeds tested; the control won for the other two, with the caveat that it carried no developability or expression constraints. The scope is affinity maturation of eleven viable seeds, not discovery from nothing.',
      ],
    },
    {
      id: 'evolution',
      title: 'A second line of <em>work</em>.',
      paragraphs: [
        'A different route to the same idea is MULTI-evolve, from the Arc Institute, published in <a href="https://doi.org/10.1126/science.aea1820">Science</a> in 2026 and peer-reviewed. It combines protein language models with measured epistatic interactions — how mutations interact rather than how they score alone — to propose proteins carrying many mutations at once.',
        'Two kinds of result sit in that paper, and they are worth keeping apart. The wet-lab part trained on roughly one to two hundred measured variants per protein, mostly double mutants chosen to expose those interactions, and produced improved variants of an engineered enzyme, a splicing protein and an antibody. The computational part is a retrospective evaluation on published datasets, predicting multi-mutants from existing measurements. The proteins studied are mostly not antibodies, so it is evidence for the method, not for an antibody pipeline.',
        'The practical point for a program with a fixed synthesis and screening budget: a small set of deliberately chosen measurements can steer design further than a large set of convenient ones. Which measurements those are is the decision the loop makes.',
      ],
    },
    {
      id: 'program',
      title: 'Where this leaves a <em>program</em>.',
      paragraphs: [
        'Today we work with partner laboratories, on their instruments. For an antibody team that means its own targets, its own assays and its own hardware: the model proposes what to test next, the team’s scientists decide what runs, and every result — including the ones that fail — is recorded with the conditions that produced it before the next selection is made. Automated scheduling and execution are in development, and we say so wherever it matters.',
        'With each experiment run on ProviGen, anywhere in the world, we improve our pipeline.',
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
