"use client";

import { useEffect, useState, useRef } from "react";

// --- TABLE OF CONTENTS ---
const sections = [
  { id: "the-workflow", label: "The workflow" },
  { id: "decision-points", label: "Decision points" },
  { id: "the-decision-loop", label: "The decision loop" },
  { id: "multi-objective", label: "Multi-objective reality" },
  { id: "moclo", label: "MoClo at scale" },
  { id: "proof-points", label: "Proof points" },
  { id: "value-summary", label: "Value summary" },
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
    <div className="min-h-screen bg-[#faf9f7]">
      <article className="pb-24 pt-[160px]">
        {/* Header */}
        <div className="max-w-3xl mx-auto px-4 md:px-12 mb-16">
          <header>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight font-normal text-[#090E34] mb-10">
              DNA Assembly &amp; Plasmid Manufacturing
            </h1>
            <div className="grid md:grid-cols-[120px_1fr] gap-x-6 gap-y-1 font-mono text-sm text-[#090E34]">
              <span className="text-[#6c7793]">Type</span>
              <span>Use Case</span>
              <span className="text-[#6c7793]">Contact</span>
              <a
                href="mailto:contact@provigen.ai"
                className="underline decoration-dotted decoration-[#090E34]/40 underline-offset-4 hover:decoration-solid"
              >
                contact@provigen.ai
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
              IMAGE IDEA: A horizontal process flow diagram showing the end-to-end
              plasmid manufacturing workflow. Minimal line-art style matching the
              blog aesthetic. Stages connected by arrows:
              Construct Design → DNA Assembly/Cloning → Transformation →
              Colony Screening → Sequence Verification → Production Culture →
              Cell Harvest & Lysis → Purification → QC

              Could be an SVG component like the timeline graphic.
            */}
            <h2 id="the-workflow">The workflow</h2>

            <p>
              {/* TODO: Opening paragraph framing plasmid manufacturing as a
                  multi-stage process where each step feeds into the next.
                  Emphasize that it is already sequential and iterative,
                  but the connections between stages are usually manual. */}
            </p>

            <p>
              {/* TODO: Walk through the full workflow:
                  - Construct design (selecting parts, codon optimization, regulatory elements)
                  - DNA assembly or cloning (Golden Gate/MoClo, Gibson, restriction-ligation)
                  - Transformation (competent cell selection, recovery conditions)
                  - Colony screening (picking strategy, number of colonies)
                  - Sequence verification (turnaround time, pass/fail criteria)
                  - Production culture (media, induction, temperature, duration)
                  - Cell harvest and lysis (timing, lysis method, conditions)
                  - Purification (column selection, buffer conditions, elution strategy)
                  - QC (yield, purity, supercoiling, endotoxin, residual host-cell impurities)
              */}
            </p>

            {/* --- SECTION 2: DECISION POINTS --- */}
            {/*
              IMAGE IDEA: The same workflow diagram but with decision-point
              markers (diamonds or highlighted nodes) at each stage where
              teams make choices. Annotations showing what varies.
            */}
            <h2 id="decision-points">Decision points at each stage</h2>

            <p>
              {/* TODO: Frame as "at each stage, teams decide..."
                  - Assembly: which method, which conditions (enzyme ratios,
                    DNA concentrations, incubation times)
                  - Transformation: which competent cells, recovery time/temp
                  - Screening: how many colonies to pick, which screening assay
                  - Production: media composition, induction timing, temperature shift
                  - Harvest: when to harvest (OD, time, metabolite trigger)
                  - Lysis: chemical vs mechanical, buffer composition, duration
                  - Purification: resin choice, flow rate, wash/elute conditions
                  - QC: which tests, acceptance criteria, tradeoffs between speed and thoroughness
              */}
            </p>

            <p>
              {/* TODO: Emphasize that these decisions are currently made based on
                  SOPs, operator experience, or one-variable-at-a-time testing.
                  The information from one stage rarely systematically informs
                  decisions at another stage. */}
            </p>

            {/* --- SECTION 3: THE DECISION LOOP --- */}
            {/*
              IMAGE IDEA: A circular/loop diagram showing how ProviGen connects
              all stages. Data flows inward from each stage to the model;
              recommendations flow outward to the next experiment.
              Could show: construct features + assembly conditions + transformation
              efficiency + screening results + culture conditions + harvest timing +
              lysis conditions + purification settings + execution metadata + QC outcomes
              all feeding into "Model" which outputs "Next experiment recommendation"
            */}
            <h2 id="the-decision-loop">The decision loop</h2>

            <p>
              {/* TODO: Core pitch paragraph.
                  "With ProviGen, this workflow becomes a decision loop."
                  Each run links construct features, assembly conditions,
                  transformation efficiency, colony screening results,
                  sequence verification, culture conditions, harvest timing,
                  lysis conditions, purification settings, execution metadata,
                  and QC outcomes into a model that recommends the next
                  highest-value experiment.

                  Instead of treating cloning, production, purification, and QC
                  as separate optimization steps, teams can ask: which next change
                  is most likely to improve the full process objective for this plasmid?
              */}
            </p>

            <p>
              {/* TODO: Explain what "connected" means in practice:
                  - A failed assembly informs future assembly condition selection
                  - A low-yield culture linked to specific construct features
                    helps predict which new constructs will be difficult
                  - Purification behavior correlated with upstream conditions
                    helps set realistic expectations and adapt early
                  - Every experiment updates the shared model, even failures
              */}
            </p>

            {/* --- SECTION 4: MULTI-OBJECTIVE REALITY --- */}
            {/*
              IMAGE IDEA: A radar/spider chart or parallel coordinates plot
              showing the multiple objectives: yield, purity, supercoiling %,
              endotoxin level, host-cell protein, cost per batch, turnaround time.
              Show how optimizing one can trade off against another.
            */}
            <h2 id="multi-objective">Multi-objective reality</h2>

            <p>
              {/* TODO: Plasmid manufacturing cannot optimize yield alone.
                  Real objectives include:
                  - Yield (mg per liter or per batch)
                  - Purity (% supercoiled, absence of genomic DNA)
                  - Plasmid quality (homogeneity, correct topology)
                  - Impurity profile (endotoxin, host-cell protein, RNA)
                  - Robustness (reproducibility across operators/batches)
                  - Turnaround time
                  - Cost per batch

                  These trade off. Higher yield conditions may compromise
                  supercoiling fraction. Faster turnaround may mean less
                  stringent QC. The decision loop handles these tradeoffs
                  explicitly rather than optimizing one metric and hoping
                  the rest follow.
              */}
            </p>

            {/* --- SECTION 5: MOCLO AT SCALE --- */}
            {/*
              IMAGE IDEA: Photo or diagram of the Paris Biofoundry automation
              platform running MoClo assemblies. Or a schematic showing
              part libraries → combinatorial assembly → screening funnel.

              Reference video: https://www.youtube.com/watch?v=pCD1HVpVR9M
            */}
            <h2 id="moclo">MoClo at scale</h2>

            <p>
              {/* TODO: This section depends on Paris Biofoundry data.
                  Cover:
                  - What MoClo (Modular Cloning) is and why it benefits from AI
                    (combinatorial part libraries, standardized assembly,
                    but exponential design space)
                  - The automation setup at the biofoundry
                  - Current pain points (assembly efficiency varies by part
                    combination, screening bottleneck, failure modes)
                  - How the decision loop helps: predict which combinations
                    are likely to succeed, prioritize screening, learn from
                    failed assemblies to improve future designs
                  - Preliminary data if available (number of constructs per
                    campaign, success rates, iteration count)

                  WAITING FOR: biofoundry repo information on MoClo process
              */}
            </p>

            {/* --- SECTION 6: PROOF POINTS --- */}
            <h2 id="proof-points">Proof points</h2>

            <p>
              {/* TODO: Industry precedent paragraph.
                  - Merck KGaA / BayBE: operationalized Bayesian experimental
                    planning across industrial R&D (excipient selection,
                    autonomous flow chemistry, self-service experiment planning).
                    Dozens of internal use cases before open-sourcing.
                    Reference: Fitzner et al., Digital Discovery, 2025.
                  - Acceleration Consortium: formalized self-driving labs as
                    systems requiring a decision layer (not just robots).
                    Reference: Maffettone et al., arXiv, 2023.
                  - Frame: the pattern is the same across pharma, industrial
                    biotech, and academic institutes. Experiments become more
                    valuable when connected into a decision loop.
              */}
            </p>

            {/* --- SECTION 7: VALUE SUMMARY --- */}
            {/*
              IMAGE IDEA: A simple before/after comparison table or
              side-by-side showing:
              Without ProviGen: isolated decisions, repeated failures,
              linear troubleshooting, siloed data
              With ProviGen: connected decisions, compounding learning,
              adaptive experimentation, shared model
            */}
            <h2 id="value-summary">Value summary</h2>

            <p>
              {/* TODO: Concrete value props:
                  1. Better next-experiment selection: which assembly conditions,
                     colonies, culture conditions, purification settings are most
                     likely to improve the full process objective
                  2. Reduced decision latency: from result to next action without
                     waiting for team meetings or manual data review
                  3. Better use of constrained lab capacity: allocate instrument
                     time, operator time, assay slots to highest-value experiments
                  4. Multi-objective optimization: handle yield/purity/quality/cost
                     tradeoffs explicitly
                  5. Compounding process intelligence: every experiment (including
                     failures) updates a shared model. Reusable across programs
                     and plasmid variants.
              */}
            </p>

            <p>
              {/* TODO: Closing paragraph.
                  "ProviGen helps teams make better decisions with fewer experiments.
                  Every run produces a result, updates the model, and improves
                  the next decision."
              */}
            </p>

          </div>
        </div>
      </article>
    </div>
  );
}
