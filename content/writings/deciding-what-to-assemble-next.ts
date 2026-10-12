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
 * - "sits at the orchestration layer and reads every data source" — breaks
 *   the positioning rule and the no-data-taking rule in one sentence. The
 *   category line is lab-in-the-loop; the record stays in the lab that makes
 *   it. The only cross-partner sentence on the site is used once, in
 *   "loop" ("With each experiment run on ProviGen …").
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
 *   paper, not a wet-lab result. Open-sourced by Merck KGaA — not Merck & Co.
 *   — announced with the University of Toronto's Acceleration Consortium,
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
 * applies to this workflow — they have no confirmed status as ProviGen
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
  dek: 'Much of plasmid construction can run on automation. The decisions between the stages — ratios, cycles, which colonies to carry forward — are still made by hand, and that is where a decision loop earns its place.',
  date: '2026-10-04',
  category: 'Field note',
  readingMinutes: 10,
  disclaimer:
    'The workflow here is described generically, as public protocols describe it; no laboratory’s setup is being described, and nothing in this note is a ProviGen result. ProviGen capabilities carry their status as set by our engineering team in September 2026: protocol compilation runs for supported workflows, instrument integration runs per instrument, recording and decision-making run, and automated scheduling and execution are in development. The six decision points are written as how a decision loop applies to this workflow, not as features we run for DNA assembly today. Third-party findings are labelled by type and attributed.',
  sections: [
    {
      id: 'pipeline',
      title: 'The shape of the <em>pipeline</em>.',
      paragraphs: [
        'Plasmid construction is a pipeline of stages, and each stage hands an intermediate to the next. DNA is purified; parts go into an assembly reaction; the product is transformed into competent cells; the cells go onto selective plates; colonies are picked and checked; verified clones are grown up and quantified. Sequencing comes last.',
        'A Golden Gate workflow runs in that order whatever the hardware. Modular Cloning (MoClo) and the standards around it use Type IIS restriction enzymes, which cut outside their own recognition sequence and leave short defined overhangs, so several parts can be cut and joined in one reaction and the overhangs — not the order of pipetting — decide what ends up next to what. Digest and ligation cycles run on a thermal cycler. The design work happens before any of it, in the choice of parts, junctions and conditions.',
        'Most of the physical work can run on automation that many laboratories already own: liquid handling, thermal cycling, colony picking, moving plates between instruments. Where that hardware is in place, the hands-on time per plate is small, and the stage boundaries are where a person is needed again.',
        'What is not automated is the decision at those boundaries: what to assemble, at which ratios, under which conditions, and which clones to carry forward. Those calls rest on defaults, standard operating procedures and hard-won experience. They work. They are also rarely written down in a form the next project can use, so when an assembly fails someone reads the plate data and the run logs and decides again from first principles — adjust the ratios, redesign the junctions, change the cycling programme, repeat with fresh enzyme. When the result is ambiguous, another troubleshooting round competes with everything else the team owes that week, and the ambiguity often has to stand.',
      ],
    },
    {
      id: 'loop',
      title: 'Where the lab enters the <em>loop</em>.',
      paragraphs: [
        'That boundary is where we work, and the shape of it is lab-in-the-loop AI: the laboratory stays in the loop, and so do the scientists in it. Each stage of an assembly run already leaves a record — dispensed volumes, device logs, colony counts, screening results, sequencing outcomes — and that record stays in the laboratory where it is made. What we add is the machinery that turns it into the next set of conditions and hands those conditions back as something the instruments can actually run.',
        '<strong>Compile.</strong> <em>Running for supported workflows.</em> Proposed conditions become versioned, executable protocols for a named instrument set: layouts, controls, replicates, timing. <strong>Integrate.</strong> <em>Running per instrument.</em> Liquid handlers, cyclers, readers and arms are driven through vendor APIs and open frameworks, on the hardware a laboratory already has. <strong>Record.</strong> <em>Running.</em> Every result is stored with its conditions, protocol version, device logs and deviations, so a finding can be told apart from an artefact.',
        '<strong>Schedule.</strong> <em>In development.</em> Ordering runs across shared instruments, with incubation windows respected and a failed step caught before its result reaches the model, is being built; today a scientist approves a batch before it runs. <strong>Review.</strong> <em>Running.</em> Scientists set the targets, approve the batch, override a recommendation and say which deviations matter.',
        'The method underneath — design of experiments, Bayesian optimisation, active learning, and what counts as one sample — is set out in <a href="/writings/closed-loop-optimization">Closed-loop experimental campaigns in practice</a> and is not repeated here. This note is about one workflow and the decisions inside it. With each experiment run on ProviGen, anywhere in the world, we improve our pipeline.',
      ],
    },
    {
      id: 'decisions',
      title: 'Six decisions between the <em>stages</em>.',
      paragraphs: [
        'The decisions below are the ones a team makes on the way from parts to verified clones. They are also the ones a decision loop is for: each is a variable with a range, each has a consequence that becomes measurable a stage or two later, and none of them is settled once for every construct.',
        '<strong>1. Part ratios.</strong> The molar ratio of backbone to insert is usually taken from a protocol and held fixed, while the ratio that actually works depends on the number of parts, the junction set and the fragment lengths. In a loop the ratio is a variable rather than a default: it is proposed per construct, and the colony count, the share of screened colonies that look right and the sequencing result say whether the proposal was any good.',
        '<strong>2. Cycle count.</strong> Digest-and-ligation cycle counts are commonly scaled to the number of parts by a rule in a protocol. A loop treats the rule as a starting point and lets the outcomes observed for a given part count and junction set move it, for those parts on those instruments.',
        '<strong>3. Process parameters.</strong> Reaction volume, enzyme amount, ligation temperature, inactivation time. Each is unremarkable on its own and they are decisive together, because small differences compound across stages that each have their own yield. A loop proposes combinations instead of moving one factor at a time, and keeps every combination attached to the result it produced.',
        '<strong>4. Colony screening.</strong> After picking, the useful question is comparative: is the positive rate for this construct lower than for the assemblies most like it? A loop can ask that as a matter of course, because the project’s own earlier assemblies were recorded the same way, with their conditions beside their outcomes. The payoff is catching a transformation or assembly problem on the screening plate rather than at sequence verification.',
        '<strong>5. Failure response.</strong> When an assembly fails, the decision is retry or redesign, and the evidence is in the shape of the failure: no colonies at all points at the transformation step; colonies that all carry empty vector point at the assembly reaction; mixed products point at partial assembly. Recorded as a classification rather than kept as a hunch, that distinction is also what tells the loop which variable to move next.',
        '<strong>6. Which clones to advance.</strong> Cherry-picking happens on partial information, because the sequencing result for this plate is not back yet. Band quality from colony PCR, growth, and how similar constructs behaved are what there is. Ranking on them explicitly is better than ranking on them implicitly.',
        'Around the reaction sit further variables with their own ranges — electroporation voltage and pulse length, recovery volume, time and temperature — and batch-level ones that drift quietly: competent cell lot and time since thaw, enzyme lot, media batch, how fresh the antibiotic plates are. Teams note these because they are the usual suspects when a week of runs goes wrong. Recorded next to the result rather than in a troubleshooting note, a drift can be seen instead of inferred afterwards.',
      ],
    },
    {
      id: 'evidence',
      title: 'Evidence arrives out of <em>order</em>.',
      paragraphs: [
        'The signals from one assembly run do not arrive together. Dispense confirmations are immediate. Colony counts follow transformation and overnight growth. Screening results follow picking. Sequencing is last, and often lands after the point where the next batch has to be designed.',
        'A loop that can act only on complete evidence therefore waits for the slowest signal — which is usually the one that would have told it most. The alternative is to update on each signal as it arrives and let the next design use what is known: a colony count can change the ratios for the next plate before sequencing has confirmed which clones were correct, provided the later signal is still attached to the run it came from when it does arrive. <strong>Decide.</strong> <em>Running.</em> Active learning chooses the next batch under several objectives, from heterogeneous data, including signals that arrive weeks later.',
        'This is the part of the problem that looks like bookkeeping and is not. A result whose conditions, protocol version and deviations have been lost is a number rather than evidence, and a model that learns from it learns the missing context along with the finding.',
      ],
    },
    {
      id: 'priors',
      title: 'A prior from the <em>published</em> record.',
      paragraphs: [
        'Not all of this has to be learned from your own plates. Potapov and colleagues at New England Biolabs profiled four-base overhang ligation fidelity with T4 DNA ligase, covering every one of the 256 possible four-base overhangs and the mismatched combinations between them, read out by long-read sequencing (ACS Synthetic Biology, 2018; peer-reviewed wet-lab data). Some pairs ligate efficiently, some mismatched pairs ligate well enough to cause trouble, and some barely ligate at all. The same profile predicted the fidelity of ten-fragment Golden Gate assemblies, and the authors used it to build a cassette from up to 24 fragments.',
        'A published matrix is a prior, not an answer: it was measured with one ligase at defined temperatures and incubation times, and your reaction has its own parts, lots and instruments. What it buys is a first design that avoids the junctions already known to behave badly, before a single plate is poured. Results from the runs that follow refine it for the parts and reagents actually in use.',
        'Fragment count is the main driver of difficulty, and the reason is arithmetic rather than mystery: every additional junction is another opportunity for a poor pair, so success falls as the number of fragments rises. Hierarchical builds compound it, because a construct assembled from sub-assemblies inherits the failure probability of each. And not every failure is a junction failure; the quiet ones are the expensive ones, because they are found late.',
        'The space is also too large to walk. A modest parts library already implies more combinations than anyone would test in advance, and a new construct can behave unlike its neighbours because of its own junctions, fragment lengths and part interactions. That is the case for a model: generalising from the assemblies a project has already run to constructs that have never been built, so the first attempt at a new one starts from something better than the default. Golden Braid, Gibson assembly and BASIC differ in the enzymes, the junctions and how hierarchical levels are built — and not in the shape of the decision, which stays a set of variables with ranges, a result that arrives in pieces, and a choice about what to build next.',
      ],
    },
    {
      id: 'trade-offs',
      title: 'More than one thing <em>matters</em>.',
      paragraphs: [
        'A plasmid preparation is not graded on one axis. Yield matters, and so does how much of the yield is in the form the next step needs; so do reproducibility between operators and batches, turnaround time, and cost per batch. They pull against each other. Conditions that raise yield can cost quality; a faster route usually means less checking.',
        'Optimising one of them and hoping about the rest produces a process that passes one test and disappoints at the next step. The more useful move is to say up front what matters and how much, and then to look for the set of conditions in which nothing can be improved without giving something up elsewhere — and to choose inside that set deliberately, rather than leaving the choice implicit in the defaults. <strong>Review.</strong> <em>Running.</em> The targets, their weights and the approval of each batch stay with the scientists.',
      ],
    },
    {
      id: 'precedent',
      title: 'What others have <em>shown</em>.',
      paragraphs: [
        'Model-guided experiment planning is not a novel proposition in this field. BayBE, a Bayesian experiment-planning framework built at Merck KGaA, is described in a peer-reviewed paper in Digital Discovery (2025) and released as open source, announced together with the University of Toronto’s Acceleration Consortium. Merck says it already powers dozens of use cases at the company; that is the company’s own account rather than independent evidence, and the paper is a tool description rather than a wet-lab result.',
        'Foundry teams in industry have described the same loop for strain engineering: a Zymergen technology blog post set out pipelines that recommend genetic edits and update as results come back — a company blog, so self-description with no performance data — and Ginkgo Bioworks acquired Zymergen in 2022, saying the deal would integrate its automation and software capabilities.',
        'The peer-reviewed wet-lab anchor in this note is the overhang fidelity work above. Everything else here is either the shape of a decision or an account of what other people have published, and we mark which is which.',
      ],
    },
    {
      id: 'fit',
      title: 'Whether this fits your <em>workflow</em>.',
      paragraphs: [
        'If your assemblies already run on automation and the decisions between the stages still live in a notebook and a conversation, that gap is what this note describes. What we can do about it today, plainly: protocols compile for supported workflows, instruments are integrated one at a time, every result is recorded with the context needed to read it later, and the next batch is chosen with active learning under the targets you set and approved by your scientists before it runs. Automated scheduling and execution are in development.',
        'Everything beyond that in this note — a classifier for assembly failure modes, a screening flag, a ranking for cherry-picking — describes how a decision loop applies to this workflow. It is not something we run for DNA assembly today, and we would rather say so than let you find out later.',
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
