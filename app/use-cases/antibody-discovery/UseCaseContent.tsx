"use client";

import { useEffect, useState, useRef } from "react";

// --- TABLE OF CONTENTS ---
const sections = [
  { id: "the-workflow", label: "The workflow" },
  { id: "decision-points", label: "Decision points" },
  { id: "the-decision-loop", label: "The decision loop" },
  { id: "multi-objective", label: "Multi-objective reality" },
  { id: "lab-in-the-loop", label: "Lab-in-the-loop precedent" },
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
              Antibody Discovery
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
              IMAGE IDEA: Horizontal funnel/flow diagram showing the antibody
              discovery pipeline. Wide at the top (many candidates) narrowing
              toward the bottom (few advanced candidates). Stages:
              Candidate Generation → Binding Assays → Functional Screens →
              Recombinant Expression → Specificity Testing →
              Stability Profiling → Developability Assessment →
              Manufacturability Review

              SVG component, same minimal line-art style as blog graphics.
            */}
            <h2 id="the-workflow">The workflow</h2>

            <p>
              {/* TODO: Opening paragraph framing antibody discovery as a
                  multi-stage funnel where candidates are progressively
                  characterized and filtered.

                  Cover the candidate generation methods:
                  - Hybridoma
                  - Phage display
                  - Yeast display
                  - Single B-cell workflows
                  - Computational/generative libraries

                  Then the characterization pipeline:
                  - Binding assays (affinity, kinetics via SPR/BLI)
                  - Functional screens (cell-based, reporter, neutralization)
                  - Recombinant expression (transient/stable, yield, aggregation)
                  - Specificity testing (cross-reactivity panels, polyreactivity)
                  - Stability profiling (thermal, accelerated, pH, freeze-thaw)
                  - Developability assessment (viscosity, self-interaction, charge variants)
                  - Manufacturability review (expression system compatibility, scale-up feasibility)
              */}
            </p>

            {/* --- SECTION 2: DECISION POINTS --- */}
            {/*
              IMAGE IDEA: Same funnel but with decision gates highlighted.
              At each gate, show the question being asked.
              Could annotate with example decisions:
              "Which 50 of 500 candidates to express?"
              "Which CDRs to mutate?"
              "Run specificity panel now or wait for stability data?"
            */}
            <h2 id="decision-points">Decision points at each stage</h2>

            <p>
              {/* TODO: Frame as "at each stage, teams decide..."
                  - Generation: which library design, which diversity strategy,
                    how many candidates to generate
                  - Binding: which candidates to advance from primary screen,
                    cutoff thresholds, which to re-test
                  - Expression: which candidates to express recombinantly,
                    which expression system, scale
                  - CDR engineering: which positions to mutate, which mutations
                    to combine, how many variants per round
                  - Assay prioritization: which assays to run next (specificity
                    vs stability vs function), given limited material
                  - Advancement: which candidates move to more expensive/slower
                    downstream characterization
                  - Tradeoff decisions: accept lower affinity for better
                    stability? Accept lower expression for better specificity?
              */}
            </p>

            <p>
              {/* TODO: Emphasize the combinatorial explosion.
                  Even with 100 candidates from a display campaign,
                  full characterization across all assays is prohibitive.
                  Teams must decide which candidates get which assays,
                  and in what order. These decisions are usually based on
                  rules of thumb, previous program experience, or gut feel.
              */}
            </p>

            {/* --- SECTION 3: THE DECISION LOOP --- */}
            {/*
              IMAGE IDEA: Circular DBTL (Design-Build-Test-Learn) loop diagram
              with ProviGen at the center. Each quadrant shows:
              Design: sequence, structure, generative models
              Build: synthesis, expression, purification
              Test: binding, function, stability, specificity, developability
              Learn: model update, recommendation, next candidates

              Arrows showing data flowing into the model from all test stages,
              and recommendations flowing out to design and test stages.
            */}
            <h2 id="the-decision-loop">The decision loop</h2>

            <p>
              {/* TODO: Core pitch paragraph.
                  "With ProviGen, antibody discovery becomes a decision loop
                  across design, build, test, and learn."

                  The platform connects:
                  - Sequence and structure features
                  - Binding assay results
                  - Expression data
                  - Stability measurements
                  - Specificity profiles
                  - Developability scores
                  - Manufacturability assessments
                  - Execution metadata (which assay, which batch, which operator)

                  Then recommends:
                  - Which candidates to test next
                  - Which mutations to make
                  - Which assay conditions to prioritize
                  - Which tradeoffs to explore
              */}
            </p>

            <p>
              {/* TODO: Explain what "connected" means in practice:
                  - Early binding data helps predict which candidates are worth
                    the expensive stability profiling
                  - Expression failures inform future sequence design choices
                  - Cross-reactivity patterns learned from one target inform
                    library design for the next
                  - The model learns which early signals actually predict
                    downstream developability (and which are misleading)
                  - Failed candidates are not wasted; they teach the model
                    what to avoid next
              */}
            </p>

            {/* --- SECTION 4: MULTI-OBJECTIVE REALITY --- */}
            {/*
              IMAGE IDEA: Parallel coordinates plot or radar chart showing
              multiple antibody properties for a set of candidates.
              Axes: affinity, expression, specificity, thermal stability,
              viscosity, polyreactivity, manufacturability score.
              Show that no single candidate is best on all axes.
              Highlight the Pareto front concept visually.
            */}
            <h2 id="multi-objective">Multi-objective reality</h2>

            <p>
              {/* TODO: Antibody discovery cannot optimize affinity alone.
                  Real objectives include:
                  - Binding affinity and kinetics (on-rate, off-rate, KD)
                  - Expression level and yield
                  - Specificity (low cross-reactivity, low polyreactivity)
                  - Thermal and colloidal stability
                  - Functional potency (neutralization, ADCC, CDC)
                  - Developability (viscosity, self-interaction, charge variants)
                  - Manufacturability (expression system, purification ease, scale-up)
                  - Cost per candidate

                  These trade off. Tighter binding often comes with reduced
                  stability or increased polyreactivity. High expression
                  variants may have developability liabilities. The decision
                  loop handles these tradeoffs explicitly, helping teams find
                  candidates that are good enough across all axes rather than
                  chasing perfection on one.
              */}
            </p>

            {/* --- SECTION 5: LAB-IN-THE-LOOP PRECEDENT --- */}
            {/*
              IMAGE IDEA: Diagram showing the Genentech/Prescient Design
              lab-in-the-loop cycle: Generative Model → Property Predictor →
              Active Learning Selection → Synthesis → In Vitro Testing →
              Data Ingestion → back to Generative Model.

              Or: a timeline showing optimization rounds for one target
              (e.g. EGFR) with binding improvement across iterations.
            */}
            <h2 id="lab-in-the-loop">Lab-in-the-loop precedent</h2>

            <p>
              {/* TODO: Genentech / Roche / Prescient Design section.
                  Reference: Frey et al., "Lab-in-the-loop therapeutic antibody
                  design with deep learning," bioRxiv, 2025.
                  DOI: 10.1101/2025.02.19.639050

                  Key points:
                  - Therapeutic antibody design framed as complex multi-property
                    optimization problem
                  - Lab-in-the-loop system combining:
                    * Generative ML models
                    * Multi-task property predictors
                    * Active-learning ranking and selection
                    * Synthesis
                    * In vitro testing
                    * Repeated ingestion of lab data
                  - Results:
                    * >1,800 unique antibody variants designed and tested
                    * Four clinically relevant targets: EGFR, IL-6, HER2, OSM
                    * Iterative optimization across multiple rounds
                    * 3-100x binding improvements across targets
                    * Best binders in therapeutically relevant 100 pM range

                  Frame: "This is the strongest antibody-discovery proof point.
                  It shows that a major pharma/biotech setting is already using
                  a decision-loop approach for therapeutic antibody optimization."

                  Note: This paper was one of the main drivers behind Anthropic's
                  $400M acquisition of Coefficient Bio (April 2026). The Coefficient
                  team came from Genentech's Prescient Design lab.
              */}
            </p>

            <p>
              {/* TODO: Arc Institute / MULTI-evolve connection.
                  Reference: Tran et al., "Rapid directed evolution guided by
                  protein language models," Science, 2026.

                  Key points:
                  - Arc's first lab-in-the-loop framework for biological design
                  - Protein language models guide rapid evolution of complex
                    multi-mutant proteins
                  - Computational prediction and experimental design coupled
                    from the beginning
                  - Validates the same direction: frontier bio R&D is moving
                    toward coupled model-experiment decision loops
              */}
            </p>

            {/* --- SECTION 6: PROOF POINTS --- */}
            <h2 id="proof-points">Proof points</h2>

            <p>
              {/* TODO: Broader industry context paragraph.
                  - Genentech/Prescient Design: lab-in-the-loop antibody
                    optimization (covered in detail above)
                  - Arc Institute: MULTI-evolve, protein language model-guided
                    directed evolution
                  - Bo Wang group / Vector Institute: foundation models +
                    active learning for therapeutic delivery (LNP/mRNA)
                    Caution: verify specific numbers before publishing
                  - Acceleration Consortium: formalized self-driving labs as
                    systems requiring a decision layer
                  - Anthropic / Coefficient Bio: $400M acquisition (April 2026)
                    signals foundational AI companies see lab-in-the-loop as
                    core application

                  Website-ready paragraph:
                  "The commercial and institutional precedent is clear.
                  Genentech, Roche, and Prescient Design have shown that
                  therapeutic antibody optimization can be run as a
                  lab-in-the-loop process, combining generative design,
                  property prediction, active-learning selection, synthesis,
                  in vitro testing, and repeated data ingestion across
                  optimization rounds."
              */}
            </p>

            {/* --- SECTION 7: VALUE SUMMARY --- */}
            {/*
              IMAGE IDEA: Before/after comparison or simple value metrics.
              Could show:
              - "X fewer candidates needed to find a clinical lead"
              - "Y% reduction in characterization cost"
              - "Z weeks faster from hit to lead"
              These would be illustrative/projected, not hard claims,
              unless we have data to back them up.
            */}
            <h2 id="value-summary">Value summary</h2>

            <p>
              {/* TODO: Concrete value props:
                  1. Better candidate selection: which variants to design,
                     express, and test, based on all available data (not just
                     the last assay result)
                  2. Reduced decision latency: from assay result to next
                     design/test decision without manual data review cycles
                  3. Better use of constrained capacity: allocate expression
                     slots, assay capacity, and characterization resources to
                     candidates with highest expected value
                  4. Multi-objective optimization: handle affinity/expression/
                     specificity/stability/developability tradeoffs explicitly
                  5. Compounding program intelligence: every variant tested
                     (including failures) updates a shared model. Learnings
                     transfer across targets and programs.
                  6. Earlier de-risking: identify developability liabilities
                     earlier by learning which early signals predict downstream
                     problems
              */}
            </p>

            <p>
              {/* TODO: Closing paragraph.
                  "ProviGen helps teams make better decisions with fewer
                  experiments. Every candidate tested produces a result,
                  updates the model, and improves the next decision."
              */}
            </p>

          </div>
        </div>
      </article>
    </div>
  );
}
