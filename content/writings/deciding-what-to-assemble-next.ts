/*
 * Field note: Deciding what to assemble next. Plain data; the page
 * (app/writings/deciding-what-to-assemble-next/page.tsx) renders it.
 * Headlines carry exactly one <em> word. Body strings may use <em>,
 * <strong>, <a href> and the status chips from app/site.css.
 *
 * Written 4 October 2026 from the old provigen.ai use-case page
 * "DNA Assembly & Plasmid Manufacturing" (ProviGen Team) and the audit of
 * that page. Types are local to this file on purpose: the Essay type in
 * content/writings/the-bottleneck-moved.ts is not touched.
 *
 * What was removed from the source, and why (founder, 4 Oct 2026: the
 * workflow detail in the old page came from a partner's setup):
 * - the whole "a typical Golden Gate (MoClo) pipeline at a biofoundry"
 *   instrument chain, the 94-assemblies-plus-two-controls plate layout, the
 *   acoustic dispenser, the on-site nanopore step and the three-layer
 *   firmware / scheduling / orchestration stack. The workflow is now
 *   described only as far as public protocols describe it.
 * - the log volumes (over a million logged variable values, tens of
 *   thousands of device operations, hundreds of thousands of system
 *   messages): no provenance, and they read as our having been through a
 *   partner's logs.
 * - the platform anomalies named in the source (stale acoustic surveys,
 *   equipment reservation conflicts, retry loops): one installation's
 *   observations.
 * - "sits at the orchestration layer and reads every data source": breaks
 *   the positioning rule and the no-data-taking rule in one sentence. The
 *   category line is lab-in-the-loop; the record stays in the lab that makes
 *   it. No cross-partner learning sentence is used anywhere in this note.
 * - "teams accept suboptimal outcomes", "decisions are based on fixed
 *   defaults, SOPs, or operator intuition": never a verdict on the reader's
 *   lab. Rewritten as the cost of another troubleshooting round.
 * - the generic method ladder (DoE, Bayesian optimisation, active learning,
 *   "what counts as a sample"): /writings/closed-loop-optimization already
 *   carries it, and is linked once instead.
 * - research@provigen.ai: not a live address. The close links /contact.
 *
 * Numbers. No ProviGen metric, multiplier or performance claim, and no %, x
 * or -fold figure anywhere in the body. The only counts are Potapov's, named
 * as theirs: 256 four-base overhangs, ten-fragment assemblies, up to 24
 * fragments. The source's unsourced success rates ("2 to 3 parts succeed at
 * high rates", "above 6 parts success drops", cycle-count defaults of 30 to
 * 60, the 1:2 backbone-to-insert ratio, 1500-2500 V electroporation) are out;
 * the fragment-count point is qualitative and marked as reasoning.
 *
 * Third-party facts, verified 2-4 Oct 2026 against the data-room claims file:
 * - Potapov V, Ong JL, Kucera RB, Langhorst BW, Bilotti K, Pryor JM, Cantor
 *   EJ, Canton B, Knight TF, Evans TC, Lohman GJS (New England Biolabs), ACS
 *   Synth Biol 7(11):2665-2674, 2018, doi 10.1021/acssynbio.8b00333.
 *   Peer-reviewed wet-lab data. PacBio SMRT profiling of all Watson-Crick
 *   four-base pairs and the mismatched combinations at 25 and 37 degrees C;
 *   the heat map covers every one of the 256 overhangs on both axes. The
 *   profile predicted the fidelity of ten-fragment Golden Gate assemblies and
 *   enabled a cassette assembled from up to 24 fragments.
 * - BayBE: Fitzner M, Sosic A, Hopp AV et al., Digital Discovery 4(8),
 *   1991-2000, 2025, doi 10.1039/D5DD00050E (the source page's
 *   10.1039/D4DD00316K does not resolve). Peer-reviewed, but a software
 *   paper, not a wet-lab result. Open-sourced by Merck KGaA (not Merck & Co.)
 *   and announced with the University of Toronto's Acceleration Consortium,
 *   6 Dec 2023. "Dozens of use cases" is Merck's own press-release wording
 *   and is attributed as such; "internal R&D use cases" is not what the
 *   release says.
 * - Zymergen Technology Team, "Programming Microbes", company blog,
 *   25 Jun 2019. Self-description, no performance data; the live page returns
 *   403 to automated fetches, so the reference links the Wayback capture.
 *   Ginkgo Bioworks completed its acquisition of Zymergen on 19 Oct 2022; the
 *   press release says the deal would integrate "strong automation and
 *   software capabilities" and does not say machine learning, so the sentence
 *   claims no motive beyond that.
 * - Dropped from the source: the dam-methylation failure mode, the
 *   plasmid-quality attribute list (supercoiled fraction, endotoxin,
 *   host-cell protein, RNA) as standard QC, and the mechanism claims about
 *   Golden Braid, Gibson and BASIC. None is verified, so the standards are
 *   named only as differing in chemistry and in how levels are built.
 *
 * Status (ProviGen engineering, Sep 2026) is on every ProviGen capability
 * named here: Compile running for supported workflows, Integrate running per
 * instrument, Record running, Decide running, Review running, Schedule in
 * development. The six decision points are written as how a decision loop
 * applies to this workflow; they have no confirmed status as ProviGen
 * features, and the closing section says so in as many words.
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

export const decidingWhatToAssembleNext: FieldNote = {
  slug: 'deciding-what-to-assemble-next',
  title: 'Deciding what to <em>assemble</em> next.',
  dek: 'Much of plasmid construction can run on automation. The decisions between the stages (ratios, cycles, which colonies to carry forward) are still made by hand, and that is where a decision loop earns its place.',
  date: '2026-06-08', // the old site's use-case page, 8 Jun 2026
  category: 'Field note',
  readingMinutes: 7,
  disclaimer:
    'The workflow here is described generically, as public protocols describe it; no laboratory’s setup is being described, and nothing in this note is a ProviGen result. ProviGen capabilities carry their status as set by our engineering team in September 2026: protocol compilation runs for supported workflows, instrument integration runs per instrument, recording and decision-making run, and automated scheduling and execution are in development. The six decision points are written as how a decision loop applies to this workflow, not as features we run for DNA assembly today. Third-party findings are labelled by type and attributed.',
  sections: [
    {
      id: 'pipeline',
      title: 'The shape of the <em>pipeline</em>.',
      paragraphs: [
        'Plasmid construction is a pipeline of stages, each handing an intermediate to the next. Parts go into an assembly reaction; the product is transformed into competent cells; the cells go onto selective plates; colonies are picked and checked; verified clones are grown up. Sequencing comes last.',
        'A Golden Gate workflow runs in that order whatever the hardware. Modular Cloning (MoClo) and the standards around it use Type IIS enzymes, which cut outside their recognition sequence and leave short defined overhangs, so several parts join in one reaction and the overhangs, not the pipetting order, decide what ends up next to what.',
        'Most of the physical work can run on automation many laboratories already own. The decisions at the stage boundaries cannot: what to assemble, at which ratios, under which conditions, which clones to carry forward. Those calls rest on defaults, SOPs and experience. They work, but are rarely written down in a form the next project can use, so when an assembly fails someone decides again from first principles.',
      ],
    },
    {
      id: 'loop',
      title: 'Where the lab enters the <em>loop</em>.',
      paragraphs: [
        'That boundary is where we work, and the shape of it is lab-in-the-loop: the laboratory stays in the loop, and so do its scientists. Each stage already leaves a record (dispensed volumes, device logs, colony counts, screening results, sequencing outcomes) and it stays in the laboratory that made it. What we add turns it into the next set of conditions.',
        '<strong>Compile.</strong> <em>Running for supported workflows.</em> Proposed conditions become versioned, executable protocols for a named instrument set: layouts, controls, replicates, timing. <strong>Integrate.</strong> <em>Running per instrument.</em> Liquid handlers, cyclers, readers and arms are driven through vendor APIs and open frameworks, on hardware a laboratory already has. <strong>Record.</strong> <em>Running.</em> Every result is stored with its conditions, protocol version, device logs and deviations, so a finding can be told apart from an artefact.',
        '<strong>Schedule.</strong> <em>In development.</em> Ordering runs across shared instruments, with incubation windows respected and a failed step caught before its result reaches the model, is being built; today a scientist approves a batch before it runs. <strong>Review.</strong> <em>Running.</em> Scientists set the targets, approve the batch, override a recommendation and say which deviations matter.',
        'The method underneath (design of experiments, Bayesian optimisation, active learning, what counts as one sample) is set out in <a href="/writings/closed-loop-optimization">Closed-loop experimental campaigns in practice</a>.',
      ],
    },
    {
      id: 'decisions',
      title: 'Six decisions between the <em>stages</em>.',
      paragraphs: [
        'Each decision below is a variable with a range, with a consequence measurable a stage or two later, and none is settled once for every construct.',
        '<strong>1. Part ratios.</strong> The molar ratio of backbone to insert is usually taken from a protocol and held fixed, while the ratio that works depends on the parts, junctions and fragment lengths. In a loop it is proposed per construct, and the colony count, screening rate and sequencing result say whether the proposal was any good.',
        '<strong>2. Cycle count.</strong> Digest-and-ligation cycle counts are commonly scaled to the number of parts by a rule in a protocol. A loop treats the rule as a starting point and lets observed outcomes move it.',
        '<strong>3. Process parameters.</strong> Reaction volume, enzyme amount, ligation temperature, inactivation time: unremarkable alone, decisive together, because small differences compound across stages. A loop proposes combinations rather than moving one factor at a time.',
        '<strong>4. Colony screening.</strong> After picking, the useful question is comparative: is the positive rate for this construct lower than for the assemblies most like it? A loop asks that as a matter of course, because earlier assemblies were recorded the same way, and catches the problem on the screening plate rather than at verification.',
        '<strong>5. Failure response.</strong> Retry or redesign, and the evidence is in the shape of the failure: no colonies points at transformation; empty vector points at the assembly reaction; mixed products point at partial assembly. Recorded as a classification rather than a hunch, that tells the loop which variable to move next.',
        '<strong>6. Which clones to advance.</strong> Cherry-picking happens before the sequencing result is back. Band quality from colony PCR, growth and how similar constructs behaved are what there is, and ranking on them explicitly beats doing it implicitly.',
        'Around the reaction sit further variables, and batch-level ones that drift quietly: cell lot, enzyme lot, media batch, plate freshness. Recorded next to the result, a drift can be seen instead of inferred afterwards.',
      ],
    },
    {
      id: 'evidence',
      title: 'Evidence arrives out of <em>order</em>.',
      paragraphs: [
        'The signals do not arrive together. Dispense confirmations are immediate, colony counts follow overnight growth, screening follows picking, and sequencing is last, often landing after the next batch has to be designed.',
        'A loop that can act only on complete evidence waits for the slowest signal, usually the one that would have told it most. The alternative is to update on each signal as it arrives: a colony count can change the ratios for the next plate before sequencing confirms which clones were correct, provided the later signal is still attached to the run it came from. <strong>Decide.</strong> <em>Running.</em> Active learning chooses the next batch under several objectives, from heterogeneous data, including signals that arrive weeks later.',
        'A result whose conditions and deviations have been lost is a number, not evidence.',
      ],
    },
    {
      id: 'priors',
      title: 'A prior from the <em>published</em> record.',
      paragraphs: [
        'Not all of this has to be learned from your own plates. Potapov and colleagues at New England Biolabs profiled four-base overhang ligation fidelity with T4 DNA ligase, covering all 256 possible overhangs and the mismatched combinations between them, read out by long-read sequencing (ACS Synthetic Biology, 2018; peer-reviewed wet-lab data). Some pairs ligate efficiently, some mismatched pairs ligate well enough to cause trouble, and some barely at all. The profile predicted the fidelity of ten-fragment Golden Gate assemblies, and the authors used it to build a cassette from up to 24 fragments.',
        'A published matrix is a prior, not an answer: it was measured with one ligase at defined temperatures, and your reaction has its own parts and lots. What it buys is a first design that avoids junctions already known to behave badly; later runs refine it.',
        'Fragment count is the main driver of difficulty, and the reason is arithmetic: every extra junction is another opportunity for a poor pair, and hierarchical builds compound it.',
        'The space is also too large to walk, and a new construct can behave unlike its neighbours. That is the case for a model: generalising from the assemblies a project has run to constructs never built. Golden Braid, Gibson assembly and BASIC differ in enzymes, junctions and how levels are built, not in the shape of the decision.',
      ],
    },
    {
      id: 'trade-offs',
      title: 'More than one thing <em>matters</em>.',
      paragraphs: [
        'A plasmid preparation is not graded on one axis. Yield matters, and so does how much of it is in the form the next step needs; so do reproducibility, turnaround and cost. Conditions that raise yield can cost quality, and a faster route means less checking.',
        'The useful move is to say up front what matters and how much, then find the conditions where nothing can improve without giving something up elsewhere, and choose inside that set deliberately. <strong>Review.</strong> <em>Running.</em> The targets, their weights and the approval of each batch stay with the scientists.',
      ],
    },
    {
      id: 'precedent',
      title: 'What others have <em>shown</em>.',
      paragraphs: [
        'Model-guided experiment planning is not new here. BayBE, a Bayesian experiment-planning framework built at Merck KGaA, is described in a peer-reviewed Digital Discovery paper (2025) and released as open source, announced with the University of Toronto’s Acceleration Consortium. Merck says it already powers dozens of use cases at the company: the company’s own account, not independent evidence, and the paper is a tool description, not a wet-lab result.',
        'Foundry teams have described the same loop for strain engineering. A Zymergen technology blog post set out pipelines that recommend genetic edits and update as results come back; it is a company blog, self-description with no performance data. Ginkgo Bioworks acquired Zymergen in 2022, saying the deal would integrate its automation and software capabilities. The peer-reviewed wet-lab anchor here is still the overhang fidelity work above.',
      ],
    },
    {
      id: 'fit',
      title: 'Whether this fits your <em>workflow</em>.',
      paragraphs: [
        'If your assemblies already run on automation and the decisions between the stages still live in a notebook and a conversation, that gap is what this note describes. Today: protocols compile for supported workflows, instruments are integrated one at a time, results are recorded with the context needed to read them later, and the next batch is chosen with active learning under your targets, approved by your scientists. Automated scheduling and execution are in development.',
        'Everything beyond that (a classifier for assembly failure modes, a screening flag, a ranking for cherry-picking) describes how a decision loop applies to this workflow. It is not something we run for DNA assembly today, and we would rather say so now.',
        'If you want to work out which of the six decisions in your own pipeline is worth closing the loop on first, <a href="/contact">Contact us</a>.',
      ],
    },
  ],
  references: [
    {
      label:
        'Potapov, Ong, Kucera et al. · Comprehensive profiling of four base overhang ligation fidelity by T4 DNA ligase and application to DNA assembly · ACS Synthetic Biology 7(11):2665–2674 · 2018',
      href: 'https://doi.org/10.1021/acssynbio.8b00333',
      note: 'External. Peer-reviewed wet-lab data from New England Biolabs: ligation fidelity for all 256 four-base overhangs and their mismatched combinations, profiled by long-read sequencing at defined temperatures. Applied to ten-fragment Golden Gate assemblies and to a cassette built from up to 24 fragments.',
    },
    {
      label:
        'Fitzner, Šošić, Hopp et al. · BayBE: a Bayesian back end for experimental planning in the low-to-no-data regime · Digital Discovery 4(8):1991–2000 · 2025',
      href: 'https://doi.org/10.1039/D5DD00050E',
      note: 'External. Peer-reviewed, but a software paper rather than a wet-lab result. Open-sourced by Merck KGaA, announced with the University of Toronto’s Acceleration Consortium in December 2023. “Dozens of use cases” is Merck’s own press-release wording.',
    },
    {
      label: 'Zymergen Technology Team · Programming Microbes · company blog · 2019',
      href:
        'https://web.archive.org/web/20201103195927/https://medium.com/@ZymergenTechBlog/programming-microbes-fa8b2cca1aab',
      note: 'External. Company blog, archived capture: self-description of a model-guided strain-engineering workflow, with no performance data. Ginkgo Bioworks completed its acquisition of Zymergen in October 2022, stating that the deal would integrate its automation and software capabilities.',
    },
    {
      label: 'ProviGen field note · Closed-loop experimental campaigns in <em>practice</em>',
      href: '/writings/closed-loop-optimization',
      note: 'Internal. The method this note assumes rather than restates: closed-loop design, measurements that arrive late, several objectives at once.',
    },
    {
      /* No href: the earlier use-case page is not a live destination. */
      label: 'Original publication · ProviGen use-case page, “DNA Assembly & Plasmid Manufacturing”',
      note: 'First published on the earlier provigen.ai site and rewritten for this note. Setup-specific workflow description has been replaced with what public protocols describe, and the unsourced quantitative claims in the original are either attributed here or gone.',
    },
  ],
};
