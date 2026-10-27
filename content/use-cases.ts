/*
 * The old site's two use-case pages, back at their own URLs (founder, 27 Oct
 * 2026: "make sure the old link ... is still reachable"), set in the writings
 * shell. The text is the old pages' (last edit 8 Jun 2026) with only these
 * changes: research@provigen.ai, not a live address, is contact@provigen.ai;
 * the BayBE and MULTI-evolve DOIs, which did not resolve to those papers, are
 * corrected; the footnotes are the shell's references, so [n] jumps to #ref-n.
 * The reworked field notes (content/writings/deciding-what-to-assemble-next.ts,
 * antibody-discovery.ts) are separate pieces and stay as they are.
 */
import type { ArticleReference, ArticleToc } from '@/components/ArticleShell';

export type UseCase = {
  slug: string;
  path: string;
  title: string;
  /** The old page's meta description, which now opens the page. */
  dek: string;
  readingMinutes: number;
  toc: ArticleToc[];
  html: string;
  references: ArticleReference[];
};

const cite = (n: number) => `<sup><a href="#ref-${n}">[${n}]</a></sup>`;
const contact = '<a href="mailto:contact@provigen.ai">contact@provigen.ai</a>';

export const dnaAssembly: UseCase = {
  slug: 'use-case-dna-assembly',
  path: '/use-cases/dna-assembly',
  title: 'DNA Assembly & Plasmid <em>Manufacturing</em>',
  dek: 'How ProviGen turns plasmid manufacturing into a decision loop: from construct design through assembly, screening, production, purification, and QC.',
  readingMinutes: 7,
  toc: [
    { id: 'the-workflow', title: 'The workflow' },
    { id: 'decision-points', title: 'Decision points' },
    { id: 'learning-over-time', title: 'Learning over time' },
    { id: 'multi-objective', title: 'Multi-objective reality' },
    { id: 'moclo', title: 'MoClo at scale' },
  ],
  html: `
<h2 id="the-workflow">The workflow</h2>
<p>Plasmid manufacturing is a multi-stage experimental pipeline. Each stage produces an intermediate that feeds the next: purified DNA goes into assembly reactions, assembly products are transformed into cells, colonies are screened, and verified clones are scaled up. On a modern biofoundry platform, most of this runs on automation hardware. The liquid handling, thermal cycling, colony picking, and plate routing happen with minimal hands-on time. But the decisions about what to assemble, under which conditions, and which clones to advance are still made manually between stages.</p>
<p>In a typical Golden Gate (MoClo) pipeline at a biofoundry, source plasmids are extracted via automated alkaline lysis and bead-based purification into 96-well plates. An acoustic liquid handler dispenses DNA parts at nanoliter precision, followed by thermal cycling with digest/ligation cycles scaled to part count. A single plate holds 94 assemblies plus two controls. Assembly products are transformed into competent cells and plated on selective media. Colonies are picked, verified by colony PCR, and positive clones are cherry-picked for culture scaleup and DNA quantification. Sequence verification runs either on-site via nanopore or through external sequencing services.</p>
<p>The automation typically runs on a three-layer stack. At the bottom, firmware controls individual instruments: liquid handlers, acoustic dispensers, thermal cyclers, plate readers. A scheduling layer coordinates plate routing, device reservations, and timing across instruments. At the top, an orchestration layer manages experiments, protocols, samples, and worklists in a database. A single campaign generates over a million logged variable values, tens of thousands of device operations, and hundreds of thousands of system messages.</p>
<p>In practice, the heavy manual workload sits between stages. When an assembly fails, someone has to dig through logs and plate data to understand why, then decide whether to adjust part ratios, redesign overhangs, change the thermal cycling protocol, or retry with a fresh enzyme lot. When yields are low, someone scripts a new worklist with adjusted parameters. When results are ambiguous, teams often accept suboptimal outcomes rather than spend another cycle troubleshooting. None of this analysis carries over to the next campaign in a structured way.</p>
<p>ProviGen closes this gap. The platform sits at the orchestration layer and reads every data source the automation stack produces: dispense volumes, device logs, colony counts, PCR results, sequencing outcomes, and execution metadata. After each stage, it updates a model of what works, what fails, and why. Before the next batch, it recommends which reagent conditions, part ratios, and cycling parameters to use for a given set of constructs. Those recommendations are written back as structured worklists that the automation executes directly.</p>

<h2 id="decision-points">Decision points at each stage</h2>
<p>At every stage of this cycle, teams make decisions that affect downstream success. Currently those decisions are based on fixed defaults, SOPs, or operator intuition. None of them systematically learn from previous campaigns.</p>
<ol>
<li><strong>Part molar ratios.</strong> The backbone-to-insert ratio is typically fixed at 1:2, but the optimal ratio depends on part count, overhang set, and fragment lengths. The model recommends ratios per construct and learns from colony counts, PCR positive rates, and sequencing results.</li>
<li><strong>Cycle count.</strong> Common defaults scale cycle count by part number (e.g. 30 cycles for simple assemblies, up to 60 for complex ones). The model refines this based on overhang fidelity data and observed assembly efficiency at the specific platform.</li>
<li><strong>Process parameters.</strong> Reaction volume, enzyme concentration, ligation temperature, and inactivation time all affect assembly yield, quality, and run-to-run variance. Small changes compound across stages. The model learns which parameter combinations produce reliable outcomes for a given assembly type and construct.</li>
<li><strong>Colony screening.</strong> After picking, the model flags constructs where the positive rate is unexpectedly low compared to similar assemblies. This helps teams catch assembly or transformation problems early rather than discovering them at sequence verification.</li>
<li><strong>Failure response.</strong> When an assembly fails, the question is whether to retry with modified conditions or redesign the parts. The model classifies failure modes: no colonies points to a transformation problem, all empty vector to an assembly problem, mixed bands to partial assembly.</li>
<li><strong>Cherry-pick decisions.</strong> Which clones to advance based on partial QC data. The model draws on colony PCR band quality, growth rate, and prior nanopore results for similar constructs.</li>
</ol>
<p>Beyond the assembly reaction itself, even standard steps have tunable parameters that the model can learn to understand and predict: electroporation voltage (1500 to 2500 V, strain-dependent), pulse duration, recovery volume and time, recovery temperature. And there are batch-level variables that drift silently: competent cell lot and time-since-thaw, enzyme lot activity, SOC media batch, antibiotic plate freshness.</p>

<h2 id="learning-over-time">Learning over time</h2>
<p>Each assembly run generates data at every stage: dispense volumes, device logs, colony counts, PCR results, and eventually full sequence verification. These observations arrive at different times. Dispense confirmations are immediate. Colony counts follow after transformation. PCR results come after screening. Sequencing arrives last. The model updates as each signal comes in, so a colony count already informs the next batch design before sequencing confirms which clones are correct.</p>
<p>Published overhang fidelity data${cite(1)} covering all 256 possible 4-nucleotide pairs provides a strong prior on assembly success before any wet lab work begins. As real results accumulate, the model refines these priors for the specific platform, part libraries, and conditions in use.</p>
<p>Batch-level drift is another signal the model tracks. Competent cell quality, enzyme lot activity, and plate reader calibration change gradually. This information typically disappears into troubleshooting notes or operator memory. Connected to the model, it becomes reusable process intelligence that carries over across campaigns.</p>

<h2 id="multi-objective">Multi-objective reality</h2>
<p>Plasmid manufacturing involves multiple objectives that trade off against each other. Yield, purity (supercoiled fraction, absence of genomic DNA), plasmid quality, impurity profile (endotoxin, host-cell protein, RNA), robustness across operators and batches, turnaround time, and cost per batch all matter. Higher yield conditions may compromise supercoiling fraction. Faster turnaround may mean less stringent QC. Optimizing one metric while ignoring the rest leads to processes that pass one test but fail in production.</p>
<p>The model handles these tradeoffs explicitly by mapping the <em>Pareto frontier</em> (a set of conditions where no single objective can be improved without compromising another). Teams define what matters and how much, and the model proposes experiments that move toward that frontier rather than chasing a single metric.</p>

<h2 id="moclo">MoClo at scale</h2>
<p>Modular Cloning (MoClo) uses standardized Type IIS restriction enzymes (BsaI, BsmBI) to assemble multiple DNA parts in a single reaction. Parts are designed with compatible 4-nucleotide overhangs that dictate assembly order. Related standards follow the same modular logic: Golden Braid extends MoClo with alternating enzyme pairs for unlimited hierarchical levels; Gibson Assembly joins overlapping fragments without restriction enzymes; BASIC Assembly uses linkers for combinatorial pathway construction. The decision loop applies to all of these. The parameters differ but the optimization structure is the same.</p>
<p>The design space grows combinatorially. Even a moderate parts library creates thousands of relevant combinations, and each new construct may behave differently during assembly depending on its specific overhangs, fragment lengths, and part interactions. It is impossible to manually test each beforehand, which is where a predictive model becomes highly valuable: it generalizes from past assemblies to predict conditions for new constructs that have never been built before. Multi-level assembly (Level 0 parts into Level 1 transcription units into Level M multigene constructs) compounds this further across tiers.</p>
<p>Fragment count is the primary driver of difficulty. Assemblies with 2 to 3 parts typically succeed at high rates. Above 6 parts, success drops significantly. Assemblies with up to 24 fragments are at the hard frontier. The main challenge is overhang fidelity: some 4-nucleotide overhang pairs have near-zero ligation efficiency, and with more fragments the probability of hitting a problematic pair increases multiplicatively. Additional failure modes include dam-methylation sensitivity (E. coli-propagated parts with dam sites at the BsaI recognition sequence silently fail) and compounding failure probability across multi-level assemblies.</p>
<p>Standard pain points in this space are clear targets for the decision loop. There is typically no systematic record of which parameter combinations work for which part families. Colony PCR gives a binary result (correct band or not) that does not distinguish partial assemblies from contamination. Batch-level drift in competent cell quality, enzyme lots, and media goes untracked. Platform-level anomalies (volume drift from stale acoustic surveys, equipment reservation conflicts, retry loops) are caught manually rather than flagged from execution metadata.</p>

<hr>
<p>The precedent for model-guided experimental planning is growing. Merck KGaA developed BayBE,${cite(2)} a Bayesian experimental planning framework that powered dozens of internal R&amp;D use cases before being open-sourced. Ginkgo Bioworks integrated Zymergen&#x27;s machine learning and automation stack specifically to explore genetic design space more efficiently across their foundry operations.${cite(3)}</p>
<p>ProviGen helps teams make better decisions with fewer experimental runs. Every batch produces results, updates the model, and improves the next batch. Adaptive parameters per construct replace fixed defaults. Partial results from early stages inform the next round before full verification is complete. Failed assemblies teach the model what to avoid. Batch drift is caught from execution metadata rather than discovered through unexplained failures.</p>
<p>If you are interested in exploring what a decision loop could look like for your assembly workflow, reach out to ${contact}.</p>
`,
  references: [
    {
      label:
        'Potapov et al. · Comprehensive Profiling of Four Base Overhang Ligation Fidelity by T4 DNA Ligase and Application to DNA Assembly · ACS Synth. Biol. · 2018',
      href: 'https://doi.org/10.1021/acssynbio.8b00333',
      note: 'Provides a 256×256 overhang fidelity matrix for Type IIS enzyme-based assembly, widely used as a reference for Golden Gate and MoClo protocol design.',
    },
    {
      label:
        'Fitzner et al. · BayBE: a Bayesian Back End for experimental planning in the low-to-no-data regime · Digital Discovery · 2025',
      href: 'https://doi.org/10.1039/D5DD00050E',
      note: 'Open-sourced by Merck KGaA in collaboration with the Acceleration Consortium.',
    },
    {
      label: 'Zymergen Technology Team · Programming Microbes · Zymergen Tech Blog',
      href: 'https://medium.com/@ZymergenTechBlog/programming-microbes-fa8b2cca1aab',
      note: 'Describes ML-guided strain engineering where models predict which genetic edits will improve production, generate strain recommendations, and update as new experimental data arrives. Now part of Ginkgo Bioworks’ foundry platform.',
    },
  ],
};

export const antibodyDiscovery: UseCase = {
  slug: 'use-case-antibody-discovery',
  path: '/use-cases/antibody-discovery',
  title: 'Antibody <em>Discovery</em>',
  dek: 'How ProviGen turns antibody discovery into a decision loop across design, build, test, and learn.',
  readingMinutes: 6,
  toc: [
    { id: 'the-pipeline', title: 'The pipeline' },
    { id: 'generate-and-predict', title: 'Generate and predict' },
    { id: 'select-and-test', title: 'Select and test' },
    { id: 'multi-property', title: 'Multi-property optimization' },
    { id: 'lab-in-the-loop', title: 'Lab-in-the-loop' },
  ],
  html: `
<h2 id="the-pipeline">The pipeline</h2>
<p>Antibody discovery starts with a large pool of candidates and progressively narrows it. Initial candidates come from hybridoma campaigns, phage or yeast display, single B-cell workflows, immune repertoire mining, or computational generation. From there, the pipeline moves through binding assays, functional screens, recombinant expression, specificity testing, stability profiling, developability assessment, and eventually manufacturability review.</p>
<p>At each stage, the pool shrinks. A display campaign may yield hundreds of hits. Only a fraction get expressed recombinantly. Fewer still make it through specificity and stability panels. By the time a candidate reaches developability assessment, it has consumed significant resources across multiple assay types, expression systems, and characterization rounds.</p>
<p>The decisions about which candidates advance, which assays to run next, and which tradeoffs to accept are made manually at each gate. They draw on program experience, threshold rules, and team judgment. The data from earlier stages is available but rarely integrated into a model that systematically informs the next decision.</p>
<p>ProviGen connects all of this into a decision loop. The platform ingests sequence features, binding data, expression levels, stability measurements, specificity profiles, and execution metadata. After each characterization round, it updates its model and recommends which candidates to advance, which to re-engineer, and which assays are most informative to run next.</p>

<h2 id="generate-and-predict">Generate and predict</h2>
<p>Modern antibody campaigns increasingly start with computational candidate generation. Generative models can propose variants of a lead sequence by exploring mutations in complementarity-determining regions (CDRs) while respecting structural constraints. Multi-task property predictors then score each variant across binding, expression likelihood, stability, and developability before anything is synthesized.</p>
<p>This filtering step matters because synthesis and screening capacity is limited. A generative model may propose thousands of plausible variants. Property predictors narrow the field to those worth testing. Recent lab-in-the-loop work${cite(1)} has shown that this approach can produce variants where 97 to 100% express and up to 70% show functional binding, dramatically reducing wasted synthesis and screening effort.</p>
<p>ProviGen supports this workflow by connecting generative proposals with experimental results. As real assay data comes back, the property predictors improve. Unexpected failures and surprising results on stability or specificity all refine the scoring. Each round of synthesis and testing makes the next round of generation more targeted.</p>

<h2 id="select-and-test">Select and test</h2>
<p>Given a scored pool of candidates, the question is which ones to test next. Active learning formalizes this: instead of testing the top-ranked candidates by a single metric, the system selects variants that are most informative given what the model already knows. Some are selected because they are predicted to perform well. Others because they sit in regions of the design space where the model is uncertain and testing them would improve future predictions.</p>
<p>In practice, this means each round of synthesis and screening produces data that the model uses to update its predictions and propose the next set of candidates. A typical strategy enforces sequence constraints that relax across rounds: early rounds stay close to the lead (within a few mutations), later rounds explore further. This graduated exploration balances confidence in the starting point against the need to discover better regions of sequence space.</p>
<p>ProviGen manages this iterative selection across the full characterization pipeline. Binding data from an early round informs which candidates are worth the more expensive stability profiling. Expression failures from one batch inform sequence design choices in the next. Specificity patterns learned from one target can transfer to related campaigns.</p>

<h2 id="multi-property">Multi-property optimization</h2>
<p>Therapeutic antibody candidates must perform across multiple properties simultaneously: binding affinity and kinetics, expression yield, specificity (low cross-reactivity, low polyreactivity), thermal and colloidal stability, functional potency, and developability (viscosity, self-interaction, charge variants). Tighter binding often comes with reduced stability or increased polyreactivity. High expression variants may have developability liabilities.</p>
<p>The model maps the <em>Pareto frontier</em> (the set of candidates where no single property can be improved without compromising another). Teams define which properties matter most for their specific program, and the model proposes candidates and experiments that move toward that frontier. This replaces the typical approach of optimizing affinity first and hoping the other properties follow.</p>

<h2 id="lab-in-the-loop">Lab-in-the-loop</h2>
<p>The strongest public demonstration of this approach comes from Genentech, Roche, and Prescient Design.${cite(1)} Their lab-in-the-loop system combined generative models, multi-task property predictors, active-learning selection, synthesis, and in vitro testing into a semi-autonomous optimization loop. Applied to four clinically relevant targets (EGFR, IL-6, HER2, OSM), the system designed and tested over 1,800 unique antibody variants across iterative rounds, achieving 3 to 100x binding improvements with best binders in the therapeutically relevant sub-100 pM range.</p>
<p>Arc Institute&#x27;s MULTI-evolve framework${cite(2)} points in the same direction: protein language models guiding rapid directed evolution of complex multi-mutant proteins, with computational prediction and experimental design coupled from the start. The Coefficient Bio team that built much of the Genentech system was acquired by Anthropic for $400M in April 2026,${cite(3)} signaling that foundational AI companies see lab-in-the-loop biological design as a core application.</p>

<hr>
<p>ProviGen brings this decision loop to antibody discovery teams working with their own targets, assays, and automation. Every candidate tested produces a result, updates the model, and improves the next selection. Learnings compound across rounds and transfer across programs. Failed candidates are informative. Partial characterization data is usable immediately, without waiting for full panels to complete.</p>
<p>If you are interested in exploring what a lab-in-the-loop campaign could look like for your antibody program, reach out to ${contact}.</p>
`,
  references: [
    {
      label: 'Frey et al. · Lab-in-the-loop therapeutic antibody design with deep learning · bioRxiv · 2025',
      href: 'https://doi.org/10.1101/2025.02.19.639050',
      note: 'Genentech, Roche, and Prescient Design. Over 1,800 unique antibody variants designed and tested across EGFR, IL-6, HER2, and OSM targets.',
    },
    {
      label: 'Tran et al. · Rapid directed evolution guided by protein language models · Science · 2026',
      href: 'https://doi.org/10.1126/science.aea1820',
      note: 'Arc Institute. MULTI-evolve framework for lab-in-the-loop biological design.',
    },
    {
      label: 'Anthropic acquires Coefficient Bio for $400M · BioSpace · April 2026',
      href: 'https://www.biospace.com/business/ai-giant-anthropic-leans-into-life-sciences-with-400m-coefficient-bio-catch',
      note: 'Coefficient Bio’s team came from Genentech’s Prescient Design lab.',
    },
  ],
};
