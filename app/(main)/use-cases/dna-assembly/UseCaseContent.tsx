"use client";

import { useEffect, useState } from "react";

// --- TABLE OF CONTENTS ---
const sections = [
  { id: "the-workflow", label: "The workflow" },
  { id: "decision-points", label: "Decision points" },
  { id: "learning-over-time", label: "Learning over time" },
  { id: "multi-objective", label: "Multi-objective reality" },
  { id: "moclo", label: "MoClo at scale" },
];

export default function UseCaseContent() {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      let current = "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          current = s.id;
        }
      }
      if (current) setActiveId(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
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
              IMAGE IDEA: Horizontal pipeline showing the stages:
              Miniprep → Assembly (MoClo) → Transformation → Colony Picking & Verification

              Below the pipeline, show the three-layer automation stack:
              Layer 3: BFASU (Python/PostgreSQL) ← "AI operates here"
              Layer 2: Momentum (Thermo Fisher) ← scheduling + plate routing
              Layer 1: Venus/Hamilton (HSL firmware) ← hardware control

              SVG component, same minimal style as blog graphics.
            */}
            <h2 id="the-workflow">The workflow</h2>

            <p>
              Plasmid manufacturing is a multi-stage experimental
              pipeline. Each stage produces an intermediate that feeds
              the next: purified DNA goes into assembly reactions,
              assembly products are transformed into cells, colonies are
              screened, and verified clones are scaled up. On a modern
              biofoundry platform, most of this runs on automation
              hardware. The liquid handling, thermal cycling, colony
              picking, and plate routing happen with minimal hands-on
              time. But the decisions about what to assemble, under which
              conditions, and which clones to advance are still made
              manually between stages.
            </p>

            <p>
              In a typical Golden Gate (MoClo) pipeline at a biofoundry,
              source plasmids are extracted via automated alkaline lysis
              and bead-based purification into 96-well plates. An
              acoustic liquid handler dispenses DNA parts at nanoliter
              precision, followed by thermal cycling with digest/ligation
              cycles scaled to part count. A single plate holds 94
              assemblies plus two controls. Assembly products are
              transformed into competent cells and plated on selective
              media. Colonies are picked, verified by colony PCR, and
              positive clones are cherry-picked for culture scaleup and
              DNA quantification. Sequence verification runs either
              on-site via nanopore or through external sequencing
              services.
            </p>

            <p>
              The automation typically runs on a three-layer stack. At the
              bottom, firmware controls individual instruments: liquid
              handlers, acoustic dispensers, thermal cyclers, plate
              readers. A scheduling layer coordinates plate routing,
              device reservations, and timing across instruments. At the
              top, an orchestration layer manages experiments, protocols,
              samples, and worklists in a database. A single campaign
              generates over a million logged variable values, tens of
              thousands of device operations, and hundreds of thousands of
              system messages.
            </p>

            <p>
              In practice, the heavy manual workload sits between
              stages. When an assembly fails, someone has to dig through
              logs and plate data to understand why, then decide whether
              to adjust part ratios, redesign overhangs, change the
              thermal cycling protocol, or retry with a fresh enzyme
              lot. When yields are low, someone scripts a new worklist
              with adjusted parameters. When results are ambiguous,
              teams often accept suboptimal outcomes rather than spend
              another cycle troubleshooting. None of this analysis
              carries over to the next campaign in a structured way.
            </p>

            <p>
              ProviGen closes this gap. The platform sits at the
              orchestration layer and reads every data source the
              automation stack produces: dispense volumes, device logs,
              colony counts, PCR results, sequencing outcomes, and
              execution metadata. After each stage, it updates a model
              of what works, what fails, and why. Before the next batch,
              it recommends which reagent conditions, part ratios,
              and cycling parameters to use for a given set of
              constructs. Those
              recommendations are written back as structured worklists
              that the automation executes directly.
            </p>

            {/* --- SECTION 2: DECISION POINTS --- */}
            {/*
              IMAGE IDEA: Table or annotated diagram showing each decision point
              with: what the model recommends, what it learns from.
              Could be a styled HTML table similar to the blog post summary table.
            */}
            <h2 id="decision-points">Decision points at each stage</h2>

            <p>
              At every stage of this cycle, teams make decisions that
              affect downstream success. Currently those decisions are
              based on fixed defaults, SOPs, or operator intuition. None
              of them systematically learn from previous campaigns.
            </p>

            <ol>
              <li>
                <strong>Part molar ratios.</strong> The backbone-to-insert
                ratio is typically fixed at 1:2, but the optimal ratio
                depends on part count, overhang set, and fragment lengths.
                The model recommends ratios per construct and learns from
                colony counts, PCR positive rates, and sequencing results.
              </li>
              <li>
                <strong>Cycle count.</strong> Common defaults scale cycle
                count by part number (e.g. 30 cycles for simple
                assemblies, up to 60 for complex ones). The model
                refines this based on overhang fidelity data and
                observed assembly efficiency at the specific platform.
              </li>
              <li>
                <strong>Process parameters.</strong> Reaction volume,
                enzyme concentration, ligation temperature, and
                inactivation time all affect assembly yield, quality,
                and run-to-run variance. Small changes compound across
                stages. The model learns which parameter combinations
                produce reliable outcomes for a given assembly type
                and construct.
              </li>
              <li>
                <strong>Colony screening.</strong> After picking, the
                model flags constructs where the positive rate is
                unexpectedly low compared to similar assemblies. This
                helps teams catch assembly or transformation problems
                early rather than discovering them at sequence
                verification.
              </li>
              <li>
                <strong>Failure response.</strong> When an assembly fails,
                the question is whether to retry with modified conditions
                or redesign the parts. The model classifies failure modes:
                no colonies points to a transformation problem, all empty
                vector to an assembly problem, mixed bands to partial
                assembly.
              </li>
              <li>
                <strong>Cherry-pick decisions.</strong> Which clones to
                advance based on partial QC data. The model draws on
                colony PCR band quality, growth rate, and prior nanopore
                results for similar constructs.
              </li>
            </ol>

            <p>
              Beyond the assembly reaction itself, even standard steps
              have tunable parameters that the model can learn to
              understand and predict: electroporation voltage (1500 to
              2500 V, strain-dependent), pulse duration, recovery volume
              and time, recovery temperature. And there are batch-level
              variables that drift silently: competent cell lot and
              time-since-thaw, enzyme lot activity, SOC media batch,
              antibiotic plate freshness.
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
            <h2 id="learning-over-time">Learning over time</h2>

            <p>
              Each assembly run generates data at every stage: dispense
              volumes, device logs, colony counts, PCR results, and
              eventually full sequence verification. These observations
              arrive at different times. Dispense confirmations are
              immediate. Colony counts follow after transformation. PCR
              results come after screening. Sequencing arrives last. The
              model updates as each signal comes in, so a colony count
              already informs the next batch design before sequencing
              confirms which clones are correct.
            </p>

            <p>
              Published overhang fidelity data
              <sup>
                <a href="#fn1" className="text-[#6c7793] hover:text-[#090E34] no-underline">[1]</a>
              </sup>
              {" "}covering all 256 possible 4-nucleotide pairs provides
              a strong
              prior on assembly success before any wet lab work begins. As real results
              accumulate, the model refines these priors for the specific
              platform, part libraries, and conditions in use.
            </p>

            <p>
              Batch-level drift is another signal the model tracks.
              Competent cell quality, enzyme lot activity, and plate
              reader calibration change gradually. This information
              typically disappears into troubleshooting notes or operator
              memory. Connected to the model, it becomes reusable process
              intelligence that carries over across campaigns.
            </p>

            {/* --- SECTION 4: MULTI-OBJECTIVE REALITY --- */}
            {/*
              IMAGE IDEA: Radar/spider chart or parallel coordinates showing
              multiple objectives. Axes: yield, purity, supercoiling %,
              impurity profile, robustness, turnaround time, cost.
            */}
            <h2 id="multi-objective">Multi-objective reality</h2>

            <p>
              Plasmid manufacturing involves multiple objectives that
              trade off against each other. Yield, purity (supercoiled
              fraction, absence of genomic DNA), plasmid quality,
              impurity profile (endotoxin, host-cell protein, RNA),
              robustness across operators and batches, turnaround time,
              and cost per batch all matter. Higher yield conditions may
              compromise supercoiling fraction. Faster turnaround may
              mean less stringent QC. Optimizing one metric while
              ignoring the rest leads to processes that pass one test
              but fail in production.
            </p>

            <p>
              The model handles these tradeoffs explicitly by mapping
              the <em>Pareto frontier</em> (a set of conditions where
              no single objective can be improved without compromising
              another). Teams define what matters and how much, and the
              model proposes experiments that move toward that frontier
              rather than chasing a single metric.
            </p>

            {/* --- SECTION 5: MOCLO AT SCALE --- */}
            {/*
              IMAGE IDEA: Diagram showing the MoClo hierarchy:
              Level 0 (basic parts) → Level 1 (transcription units) → Level M (multigene)

              Or: fragment count vs. success rate curve.
            */}
            <h2 id="moclo">MoClo at scale</h2>

            <p>
              Modular Cloning (MoClo) uses standardized Type IIS
              restriction enzymes (BsaI, BsmBI) to assemble multiple DNA
              parts in a single reaction. Parts are designed with
              compatible 4-nucleotide overhangs that dictate assembly
              order. Related standards follow the same modular logic:
              Golden Braid extends MoClo with alternating enzyme pairs
              for unlimited hierarchical levels; Gibson Assembly joins
              overlapping fragments without restriction enzymes; BASIC
              Assembly uses linkers for combinatorial pathway
              construction. The decision loop applies to all of these.
              The parameters differ but the optimization structure is the
              same.
            </p>

            <p>
              The design space grows combinatorially. Even a moderate
              parts library creates thousands of relevant combinations,
              and each new construct may behave differently during
              assembly depending on its specific overhangs, fragment
              lengths, and part interactions. It is impossible to
              manually test each beforehand, which
              is where a predictive model becomes highly valuable: it
              generalizes from past assemblies to predict conditions for
              new constructs that have never been built before.
              Multi-level assembly (Level 0 parts into Level 1
              transcription units into Level M multigene constructs)
              compounds this further across tiers.
            </p>

            <p>
              Fragment count is the primary driver of difficulty.
              Assemblies with 2 to 3 parts typically succeed at high
              rates. Above 6 parts, success drops significantly.
              Assemblies with up to 24 fragments are at the hard
              frontier. The main challenge is overhang fidelity: some
              4-nucleotide overhang pairs have near-zero ligation
              efficiency, and with more fragments the probability of
              hitting a problematic pair increases multiplicatively.
              Additional failure modes include dam-methylation sensitivity
              (E. coli-propagated parts with dam sites at the BsaI
              recognition sequence silently fail) and compounding failure
              probability across multi-level assemblies.
            </p>

            <p>
              Standard pain points in this space are clear targets for
              the decision loop. There is typically no systematic record
              of which parameter combinations work for which part
              families. Colony PCR gives a binary result (correct band
              or not) that does not distinguish partial assemblies from
              contamination. Batch-level drift in competent cell quality,
              enzyme lots, and media goes untracked. Platform-level
              anomalies (volume drift from stale acoustic surveys,
              equipment reservation conflicts, retry loops) are caught
              manually rather than flagged from execution metadata.
            </p>

            <hr />

            <p>
              The precedent for model-guided experimental planning is
              growing. Merck KGaA developed BayBE,
              <sup>
                <a href="#fn2" className="text-[#6c7793] hover:text-[#090E34] no-underline">[2]</a>
              </sup>
              {" "}a Bayesian experimental planning framework that
              powered dozens of internal R&D use cases before being
              open-sourced. Ginkgo Bioworks integrated
              Zymergen&apos;s machine learning and automation stack
              specifically to explore genetic design space more
              efficiently across their foundry operations.
              <sup>
                <a href="#fn3" className="text-[#6c7793] hover:text-[#090E34] no-underline">[3]</a>
              </sup>
            </p>

            <p>
              ProviGen helps teams make better decisions with fewer
              experimental runs. Every batch produces results, updates
              the model, and improves the next batch. Adaptive parameters
              per construct replace fixed defaults. Partial results from
              early stages inform the next round before full verification
              is complete. Failed assemblies teach the model what to
              avoid. Batch drift is caught from execution metadata rather
              than discovered through unexplained failures.
            </p>

            <p>
              If you are interested in exploring what a decision loop
              could look like for your assembly workflow, reach out
              to{" "}
              <a href="mailto:research@provigen.ai">research@provigen.ai</a>.
            </p>

          </div>

            {/* Footnotes */}
            <footer className="mt-20 pt-8 border-t border-[#e8e6e1]">
              <div className="font-mono text-xs text-[#6c7793] leading-relaxed space-y-2">
                <p id="fn1">
                  [1] Potapov et&nbsp;al.,{" "}
                  <a
                    href="https://doi.org/10.1021/acssynbio.8b00333"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    &ldquo;Comprehensive Profiling of Four Base Overhang
                    Ligation Fidelity by T4 DNA Ligase and Application to
                    DNA Assembly,&rdquo; ACS Synth. Biol. 2018
                  </a>
                  . Provides a 256&times;256 overhang fidelity matrix for
                  Type IIS enzyme-based assembly, widely used as a reference
                  for Golden Gate and MoClo protocol design.
                </p>
                <p id="fn2">
                  [2] Fitzner et&nbsp;al.,{" "}
                  <a
                    href="https://doi.org/10.1039/D4DD00316K"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    &ldquo;BayBE: a Bayesian Back End for experimental
                    planning in the low-to-no-data regime,&rdquo; Digital
                    Discovery, 2025
                  </a>
                  . Open-sourced by Merck KGaA in collaboration with the
                  Acceleration Consortium.
                </p>
                <p id="fn3">
                  [3] Zymergen Technology Team,{" "}
                  <a
                    href="https://medium.com/@ZymergenTechBlog/programming-microbes-fa8b2cca1aab"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    &ldquo;Programming Microbes,&rdquo; Zymergen Tech Blog
                  </a>
                  . Describes ML-guided strain engineering where models
                  predict which genetic edits will improve production,
                  generate strain recommendations, and update as new
                  experimental data arrives. Now part of Ginkgo
                  Bioworks&apos; foundry platform.
                </p>
              </div>
            </footer>
        </div>
      </article>
    </div>
  );
}
