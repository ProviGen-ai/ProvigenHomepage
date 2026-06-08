"use client";

import { useEffect, useState, useRef } from "react";

// --- TABLE OF CONTENTS ---
const sections = [
  { id: "the-workflow", label: "The workflow" },
  { id: "decision-points", label: "Decision points" },
  { id: "learning-from-data", label: "Learning from data" },
  { id: "multi-objective", label: "Multi-objective reality" },
  { id: "moclo", label: "MoClo at scale" },
];

export default function UseCaseContent() {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    elements.forEach((el) => observerRef.current?.observe(el!));

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] relative">
      {/* Back arrow */}
      <a href="/" className="absolute top-5 left-6 lg:left-8 inline-flex items-center gap-2 text-sm text-[#6c7793] hover:text-[#090E34] transition-colors">
        <span>&larr;</span> Back to Overview
      </a>
      <article className="pb-24 pt-[200px]">
        {/* Header */}
        <div className="max-w-3xl mx-auto px-4 md:px-12 mb-16">
          <header>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight font-normal text-[#090E34] mb-10">
              DNA Assembly &amp; Plasmid Manufacturing
            </h1>
            <div className="grid md:grid-cols-[120px_1fr] gap-x-6 gap-y-1 font-mono text-sm text-[#090E34]">
              {/* <span className="text-[#6c7793]">Published</span>
              <span>June 8, 2026</span> */}
              <span className="text-[#6c7793]">Authors</span>
              <span>ProviGen Team</span>
              <span className="text-[#6c7793]">Contact</span>
              <a
                href="mailto:research@provigen.ai"
                className="underline decoration-dotted decoration-[#090E34]/40 underline-offset-4 hover:decoration-solid"
              >
                research@provigen.ai
              </a>
            </div>
          </header>
        </div>

        {/* Sidebar + Content */}
        <div className="max-w-3xl mx-auto px-4 md:px-12 relative">
          {/* Sidebar */}
          <nav className="hidden 2xl:block absolute right-full mr-20 top-0 bottom-0 w-48">
            <div className="sticky top-28">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b90a0] mb-4">
                Contents
              </div>
              <ul className="space-y-1.5 font-mono text-[13px] leading-snug">
                {sections.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => scrollTo(s.id)}
                      className={`text-left w-full py-0.5 transition-colors duration-150 ${
                        activeId === s.id
                          ? "text-[#090E34] font-medium"
                          : "text-[#959CB1] hover:text-[#090E34]"
                      }`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Main content */}
          <div className="prose-blog">

            {/* --- SECTION 1: THE WORKFLOW --- */}
            {/*
              IMAGE IDEA: Horizontal timeline showing the 4-week cycle.
              Week 1: Miniprep (DNA extraction)
              Week 2: Transformation + Plating
              Week 3: Assembly (MoClo core)
              Week 4: Colony Picking, Verification, Culture

              Below the timeline, show the three-layer automation stack:
              Layer 3: BFASU (Python/PostgreSQL) ← "AI operates here"
              Layer 2: Momentum (Thermo Fisher) ← scheduling + plate routing
              Layer 1: Venus/Hamilton (HSL firmware) ← hardware control

              SVG component, same minimal style as blog graphics.
            */}
            <h2 id="the-workflow">The workflow</h2>

            <p>
              {/* TODO: Opening paragraph.
                  Plasmid manufacturing is a 4-week experimental cycle.
                  Each week produces an intermediate that feeds the next stage.
                  The full loop runs on automation hardware, but the decisions
                  about what to assemble, under which conditions, and which
                  clones to advance are still made manually between cycles.

                  Frame: "The lab is automated. The decisions are not."
              */}
            </p>

            <p>
              {/* TODO: The four weeks in detail:

                  Week 1 — Miniprep (DNA extraction)
                  Alkaline lysis on StarV liquid handler (P1 resuspension →
                  P2 lysis → N3 neutralization). Centrifugation at 2918 RPM / 5 min.
                  Magnetic bead binding + wash cycles + elution in AE buffer (100 µL).
                  Output: purified plasmid DNA in 96-well plate.

                  Week 2 — Transformation + Plating
                  DH5-alpha competent cells from -20°C storage.
                  Electroporation: 1800 V, 5 ms pulse.
                  Recovery: 700 µL SOC media, 37°C, 60 min, 250 RPM.
                  Plating on selective agar (antibiotic matched to resistance marker).
                  Output: colonies on selective plates.

                  Week 3 — Assembly (the MoClo core step)
                  Echo survey (acoustic volume measurement, 2.5 nL resolution).
                  Echo dispense (nanoliter-precision acoustic transfer: backbone at
                  5 fmol, inserts at 10 fmol each).
                  Heat seal → thermal cycling (Golden Gate reaction):
                    37°C digest / 16°C ligation, alternating 30-60 cycles
                    (scaled by part count: 30 for ≤3 parts, 45 for 4-6, 60 for 7+).
                    60°C final digest (5 min), 80°C heat inactivation (10 min).
                  94 assemblies + 2 controls per plate. This is the natural batch size.

                  Week 4 — Colony Picking, Verification, Culture
                  Colony picking (QPix): 4-8 colonies per construct.
                  Colony PCR with verification primers flanking insert.
                  Band verification (correct size vs. empty vector ~240 bp).
                  Cherry-pick positive clones.
                  Culture scaleup: 10 µL → 700 µL overnight in selective media.
                  DNA quantification (PicoGreen).
                  Optional: on-site nanopore sequencing (same-day turnaround).
              */}
            </p>

            <p>
              {/* TODO: The automation stack paragraph.
                  Three-layer architecture:
                  - Layer 1 (hardware): Venus/Hamilton HSL firmware controls
                    liquid handlers, Echo, thermal cyclers, plate readers
                  - Layer 2 (scheduling): Momentum (Thermo Fisher) handles
                    plate routing, device reservation, timing coordination
                  - Layer 3 (orchestration): BFASU (Python/PostgreSQL) manages
                    experiments, protocols, samples, containers, worklists

                  ProviGen integrates at Layer 3: it reads from the same database,
                  observes execution metadata, and writes back experimental
                  recommendations as structured worklists.

                  Data scale: 1M+ Momentum variable values per campaign,
                  68K+ device operations logged with timestamps, 215K+ system messages.
              */}
            </p>

            {/* --- SECTION 2: DECISION POINTS --- */}
            {/*
              IMAGE IDEA: Table or annotated diagram showing each decision point
              with: what the model recommends, what it learns from.
              Could be a styled HTML table similar to the blog post summary table.
            */}
            <h2 id="decision-points">Decision points at each stage</h2>

            <p>
              {/* TODO: Opening framing.
                  "At every stage of this 4-week cycle, teams make decisions
                  that affect downstream success. Currently those decisions are
                  based on fixed defaults, SOPs, or operator intuition. None of
                  them systematically learn from previous campaigns."
              */}
            </p>

            {/* TODO: Structured list or table of decision points:

                1. Part molar ratios
                   What the model recommends: backbone:insert ratio per construct
                   Currently fixed at 1:2, but optimal ratio depends on part
                   count, overhang set, fragment lengths
                   Learns from: colony counts, PCR positive rate, sequencing results

                2. Cycle count selection
                   What the model recommends: optimal cycles for a given
                   part-count + overhang set
                   Currently: 30 for ≤3 parts, 45 for 4-6, 60 for 7+
                   Learns from: overhang fidelity data (Potapov 2018), observed
                   assembly efficiency at this platform

                3. Construct prioritization
                   What the model recommends: which 94 of N candidate constructs
                   to run this week
                   Learns from: predicted success probability, information value,
                   coverage of design space

                4. Colony screening strategy
                   What the model recommends: how many colonies to pick per construct
                   Range: 4-96 (currently fixed at 4-8)
                   Learns from: historical positive rate for similar assemblies,
                   cost of sequencing

                5. Troubleshooting failed assemblies
                   What the model recommends: retry with modified conditions vs.
                   redesign parts
                   Learns from: failure mode classification:
                     - No colonies = transformation failure
                     - All empty vector = assembly failure
                     - Mixed bands = partial assembly

                6. Cherry-pick decisions
                   What the model recommends: which clones to advance based on
                   partial QC data
                   Learns from: colony PCR band quality, growth rate, prior
                   nanopore results for similar constructs
            */}

            <p>
              {/* TODO: Transformation parameters paragraph.
                  Even "standard" steps have tunable parameters:
                  - Voltage: 1500-2500 V (strain-dependent optimum)
                  - Pulse duration: 1-10 ms
                  - Recovery volume: 500-1000 µL
                  - Recovery time: 30-120 min (longer for large plasmids)
                  - Recovery temperature: 30-37°C

                  Plus batch-level variables that drift:
                  - Competent cell lot and time-since-thaw
                  - Enzyme lot (BsaI activity varies between lots)
                  - SOC media batch
                  - Antibiotic plate freshness

                  Currently none of these are tracked quantitatively against
                  outcomes. The model learns to filter nuisance variability
                  (instrument noise, handling variance) from control-relevant
                  state changes (enzyme degradation, cell competence drift).
              */}
            </p>

            {/* --- SECTION 3: THE DECISION LOOP --- */}
            {/*
              IMAGE IDEA: The integration diagram from the biofoundry notes:

              Design (CSV) → Part features + overhang fidelity
                           → Assembly conditions (ratios, cycles)
                           → Transformation efficiency (voltage, recovery, cell batch)
                           → Screening outcomes (colony count, PCR positive rate, sequence match)
                           → Model recommends highest-value 94 experiments for next plate

              Could be an SVG showing data flowing in from each week,
              converging on "Next campaign" recommendation.
            */}
            <h2 id="learning-from-data">Learning from data</h2>

            <p>
              {/* TODO: Core pitch paragraph.
                  "With ProviGen, the 4-week cycle becomes a decision loop.
                  Each plate of 94 assemblies is one batch evaluation. The AI
                  selects which 94 constructs (from a larger candidate pool)
                  maximize information gain per cycle."

                  Integration points:
                  - AssemblyGraph as the intermediate representation: every
                    assembly plan is a typed DAG with float parameters, directly
                    compatible with Bayesian optimization
                  - 94-sample batch = natural BO iteration
                  - Overhang fidelity (Potapov 2018: 256×256 pair matrix,
                    calibrated on 436 real plasmids) provides a strong prior
                    on assembly success before any experiments run
              */}
            </p>

            <p>
              {/* TODO: Observation streams paragraph.
                  "Each experiment produces a stream of observations over 4 weeks,
                  not a single success/fail score."

                  Week by week:
                  - Echo volumes (pre-dispense survey)
                  - Colony counts (post-transformation)
                  - PCR band presence/absence (post-screening)
                  - Sequence verification (post-nanopore)

                  The model learns from partial observations before the full
                  cycle completes. A colony count alone (Week 2 result) already
                  informs the next plate design, even before sequence verification
                  (Week 4) confirms which clones are correct.

                  This is the "delayed evidence" pattern from the blog post,
                  applied concretely to DNA assembly.
              */}
            </p>

            <p>
              {/* TODO: Drift tracking paragraph.
                  "The model tracks drift in batch-level variables over time."

                  Competent cell batch quality, enzyme lot activity, and plate
                  reader calibration change gradually. The model filters nuisance
                  variability (handling variance, instrument noise) while tracking
                  control-relevant state changes (degraded enzyme lot, poorly
                  stored cells).

                  This is data that currently disappears into troubleshooting
                  notes or operator memory. Connected to the model, it becomes
                  reusable process intelligence.
              */}
            </p>

            {/* --- SECTION 4: MULTI-OBJECTIVE REALITY --- */}
            {/*
              IMAGE IDEA: Radar/spider chart or parallel coordinates showing
              multiple objectives per construct. Axes could include:
              - Assembly success probability
              - Sequencing pass rate
              - Information value (what we learn from this experiment)
              - Cost (number of colonies to screen, sequencing cost)
              - Time (weeks until verified clone)
              - Design space coverage

              Show the Pareto concept: some constructs are high-probability
              but teach nothing; others are likely to fail but their failure
              mode is informative.
            */}
            <h2 id="multi-objective">Multi-objective reality</h2>

            <p>
              {/* TODO: Multi-objective Pareto ranking paragraph.
                  "The model ranks candidate experiments across multiple objectives
                  simultaneously."

                  Objectives for construct prioritization:
                  - Success probability (will this assembly work?)
                  - Information value (what do we learn if it fails?)
                  - Design space coverage (are we exploring broadly enough?)
                  - Cost (how many colonies must we screen to verify?)
                  - Time to verified clone

                  Key insight: "Constructs that are likely to succeed but teach
                  nothing get deprioritized. Constructs likely to fail but whose
                  failure mode is informative get promoted."

                  This is the difference between an optimization engine (maximize
                  success rate) and a decision engine (maximize value of the
                  next experiment given what we already know).
              */}
            </p>

            <p>
              {/* TODO: Process-level objectives paragraph.
                  Beyond individual constructs, the full manufacturing process
                  has its own multi-objective landscape:
                  - Yield (mg per liter or per batch)
                  - Purity (% supercoiled, absence of genomic DNA)
                  - Plasmid quality (homogeneity, correct topology)
                  - Impurity profile (endotoxin, host-cell protein, RNA)
                  - Robustness (reproducibility across operators/batches)
                  - Turnaround time (weeks per verified construct)
                  - Cost per batch

                  These trade off. Higher yield conditions may compromise
                  supercoiling fraction. More colonies screened per construct
                  increases verification confidence but multiplies cost.
              */}
            </p>

            {/* --- SECTION 5: MOCLO AT SCALE --- */}
            {/*
              IMAGE IDEA: Diagram showing the MoClo hierarchy:
              Level 0 (basic parts) → Level 1 (transcription units) → Level M (multigene)
              With exponential design space annotation.

              Or: photo/screenshot from Paris Biofoundry automation platform.
              Reference video: https://www.youtube.com/watch?v=pCD1HVpVR9M

              Could also show the "fragment count vs. success rate" relationship:
              2-3 parts = high success
              4-6 parts = moderate
              7+ parts = significant drop
              24 parts = the hard frontier
            */}
            <h2 id="moclo">MoClo at scale</h2>

            <p>
              {/* TODO: What MoClo is and why it creates a combinatorial explosion.
                  Modular Cloning (MoClo) uses standardized Type IIS restriction
                  enzymes (BsaI, BsmBI) to assemble multiple DNA parts in a single
                  reaction. Parts are designed with compatible 4-nucleotide overhangs
                  that dictate assembly order.

                  The Paris Biofoundry registry contains 866 real plasmids spanning
                  three MoClo tiers:
                  - Level 0: basic parts (promoters, CDS, terminators)
                  - Level 1: transcription units (assembled from Level 0)
                  - Level M: multigene constructs (assembled from Level 1)

                  The design space grows combinatorially. With a modest library
                  of 50 Level 0 parts across 5 positions, there are already
                  50^5 = 312 million possible Level 1 combinations. Only 94
                  can be tested per weekly plate.
              */}
            </p>

            <p>
              {/* TODO: The complexity frontier.
                  Fragment count ranges from 1 to 24 per assembly (average 3).
                  Success drops significantly above 6 parts.

                  Key challenge: overhang fidelity.
                  The Potapov 2018 dataset (256×256 pair fidelities) shows that
                  some 4-nt overhang pairs have near-zero ligation fidelity.
                  With more fragments, the probability of hitting a bad overhang
                  pair increases multiplicatively.

                  Additional failure modes:
                  - BsaI is dam-methylation sensitive. E. coli-propagated parts
                    with dam sites at the recognition sequence silently fail.
                  - Multi-level MoClo (L0 → L1 → LM) compounds failure probability
                    across tiers.

                  The AI uses overhang fidelity as a strong prior: the Potapov
                  matrix calibrated against 436 real plasmids predicts assembly
                  success before any wet lab work begins.
              */}
            </p>

            <p>
              {/* TODO: The biofoundry platform specifics.
                  The Paris Biofoundry (Sorbonne node) runs this as a fully
                  automated pipeline:
                  - Echo acoustic liquid handler for nanoliter-precision dispensing
                  - Hamilton StarV for standard liquid handling
                  - Automated thermal cycling (ATC) for Golden Gate reactions
                  - QPix colony picker (human-mediated plate loading is the only
                    manual step in the entire pipeline)
                  - On-site Oxford Nanopore for same-day sequence verification

                  Data generated per campaign:
                  - 1M+ Momentum variable values
                  - 68K+ device operations with timestamps
                  - Echo survey volumes (per-well, pre-dispense)
                  - Echo dispense confirmations (actual vs. requested)
                  - Thermal cycler execution traces
                  - Colony counts, PCR results, sequencing data

                  Reference video: https://www.youtube.com/watch?v=pCD1HVpVR9M
              */}
            </p>

            <p>
              {/* TODO: Current pain points that AI addresses.

                  1. Assembly efficiency prediction is poor:
                     No systematic record of which parameter combinations work
                     for which part families. The model builds this map.

                  2. Screening bottleneck:
                     Default 4-8 colonies may be insufficient for low-efficiency
                     assemblies. The model predicts how many colonies to screen
                     based on expected positive rate.

                  3. Colony PCR is binary:
                     Correct band / no band. Doesn't distinguish partial assemblies
                     from contamination. The model learns to interpret ambiguous
                     results in context of assembly conditions.

                  4. Batch drift is untracked:
                     Competent cell quality, enzyme lots, media batches vary but
                     nobody correlates this with outcomes. The model does.

                  5. Platform failure modes:
                     Echo volume drift (stale survey + evaporation = under-aspiration),
                     equipment reservation leaks, HoldOnError retry loops (120s × 10).
                     The model detects anomalies in execution metadata.
              */}
            </p>

            {/* --- SECTION 6: PROOF POINTS --- */}
            <h2 id="proof-points">Proof points</h2>

            <p>
              {/* TODO: Industry precedent paragraph.

                  Merck KGaA / BayBE:
                  Operationalized Bayesian experimental planning across industrial
                  R&D. Dozens of internal use cases before open-sourcing. Named
                  examples include VRP ExcipientFinder, BayChem, and self-driving
                  autonomous flow chemistry.
                  Reference: Fitzner et al., Digital Discovery, 2025.

                  Acceleration Consortium:
                  Formalized self-driving labs as systems requiring a decision
                  layer that selects what to test next, updates from results,
                  and improves future experimental choices.
                  Reference: Maffettone et al., arXiv, 2023.

                  Paris Biofoundry validation:
                  - 866 plasmids in registry across all three MoClo tiers
                  - Overhang fidelity prediction calibrated on 436-plasmid dataset
                  - Multi-backend consensus (4 independent verification tools)
                  - 12 Type IIS enzymes with real NEB parameters

                  Frame: "The infrastructure exists. The hardware runs. The data
                  is generated. What is missing is the decision layer that
                  connects past results to future experiments."
              */}
            </p>

            {/* --- SECTION 7: VALUE SUMMARY --- */}
            {/*
              IMAGE IDEA: Before/after comparison showing:
              Without ProviGen:
              - Fixed parameters (1:2 ratio, 30 cycles, 4 colonies)
              - No learning between campaigns
              - Manual troubleshooting when assemblies fail
              - Operator-dependent decisions

              With ProviGen:
              - Adaptive parameters per construct
              - Every campaign improves the next
              - Automated failure classification and response
              - Data-driven prioritization of the next 94 experiments
            */}
            <h2 id="value-summary">Value summary</h2>

            <p>
              {/* TODO: Concrete value props:

                  1. Better next-experiment selection
                     Which 94 constructs to assemble this week, under which
                     conditions, maximizing combined probability of success and
                     information gain.

                  2. Adaptive parameters per construct
                     Backbone:insert ratio, cycle count, colony screening depth
                     tuned to predicted difficulty rather than fixed defaults.

                  3. Reduced decision latency
                     Colony counts available after Week 2 already inform the
                     next plate design. No waiting for full 4-week verification
                     to update the model.

                  4. Better use of constrained capacity
                     94 slots per plate, 4 weeks per cycle. Every slot allocated
                     to the experiment with highest expected value.

                  5. Compounding process intelligence
                     Every campaign (including failed assemblies) updates a
                     shared model of what works for which part families, overhang
                     combinations, and conditions. Reusable across projects.

                  6. Drift detection
                     Competent cell degradation, enzyme lot changes, and
                     instrument drift caught early through execution metadata
                     rather than discovered through unexplained failures.
              */}
            </p>

            <p>
              {/* TODO: Closing paragraph.
                  "ProviGen helps teams make better decisions with fewer
                  experimental cycles. Every plate of 94 assemblies produces
                  results, updates the model, and improves the next plate.
                  The lab is already automated. Now the decisions are too."
              */}
            </p>

          </div>
        </div>
      </article>
    </div>
  );
}
