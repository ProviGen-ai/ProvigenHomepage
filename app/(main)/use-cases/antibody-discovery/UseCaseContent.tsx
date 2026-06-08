"use client";

import { useEffect, useState } from "react";

// --- TABLE OF CONTENTS ---
const sections = [
  { id: "the-pipeline", label: "The pipeline" },
  { id: "generate-and-predict", label: "Generate and predict" },
  { id: "select-and-test", label: "Select and test" },
  { id: "multi-property", label: "Multi-property optimization" },
  { id: "lab-in-the-loop", label: "Lab-in-the-loop" },
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
              Antibody Discovery
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

            {/* --- SECTION 1: THE PIPELINE --- */}
            {/*
              IMAGE IDEA: Horizontal funnel showing the antibody discovery
              pipeline narrowing from many candidates to few advanced leads.
              Stages: Generation → Binding → Function → Expression →
              Specificity → Stability → Developability → Manufacturability
            */}
            <h2 id="the-pipeline">The pipeline</h2>

            <p>
              Antibody discovery starts with a large pool of candidates
              and progressively narrows it. Initial candidates come from
              hybridoma campaigns, phage or yeast display, single B-cell
              workflows, immune repertoire mining, or computational
              generation. From there, the pipeline moves through binding
              assays, functional screens, recombinant expression,
              specificity testing, stability profiling, developability
              assessment, and eventually manufacturability review.
            </p>

            <p>
              At each stage, the pool shrinks. A display campaign may
              yield hundreds of hits. Only a fraction get expressed
              recombinantly. Fewer still make it through specificity and
              stability panels. By the time a candidate reaches
              developability assessment, it has consumed significant
              resources across multiple assay types, expression systems,
              and characterization rounds.
            </p>

            <p>
              The decisions about which candidates advance, which assays
              to run next, and which tradeoffs to accept are made
              manually at each gate. They draw on program experience,
              threshold rules, and team judgment. The data from earlier
              stages is available but rarely integrated into a model
              that systematically informs the next decision.
            </p>

            <p>
              ProviGen connects all of this into a decision loop. The
              platform ingests sequence features, binding data,
              expression levels, stability measurements, specificity
              profiles, and execution metadata. After each
              characterization round, it updates its model and
              recommends which candidates to advance, which to
              re-engineer, and which assays are most informative to
              run next.
            </p>

            {/* --- SECTION 2: GENERATE AND PREDICT --- */}
            {/*
              IMAGE IDEA: Diagram showing generative model producing
              candidate sequences, filtered by property predictors
              before any wet lab work.
            */}
            <h2 id="generate-and-predict">Generate and predict</h2>

            <p>
              Modern antibody campaigns increasingly start with
              computational candidate generation. Generative models can
              propose variants of a lead sequence by exploring mutations
              in complementarity-determining regions (CDRs) while
              respecting structural constraints. Multi-task property
              predictors then score each variant across binding,
              expression likelihood, stability, and developability
              before anything is synthesized.
            </p>

            <p>
              This filtering step matters because synthesis and
              screening capacity is limited. A generative model may
              propose thousands of plausible variants. Property
              predictors narrow the field to those worth testing.
              Recent lab-in-the-loop work
              <sup>
                <a href="#fn1" className="text-[#6c7793] hover:text-[#090E34] no-underline">[1]</a>
              </sup>
              {" "}has shown that this approach can produce variants
              where 97 to 100% express and up to 70% show functional
              binding, dramatically reducing wasted synthesis and
              screening effort.
            </p>

            <p>
              ProviGen supports this workflow by connecting generative
              proposals with experimental results. As real assay data
              comes back, the property predictors improve. Unexpected
              failures and surprising results on stability or
              specificity all refine the scoring. Each round
              of synthesis and testing makes the next round of
              generation more targeted.
            </p>

            {/* --- SECTION 3: SELECT AND TEST --- */}
            {/*
              IMAGE IDEA: Active learning selection diagram.
              Ranked list of candidates, with top candidates selected
              for the next experimental round.
            */}
            <h2 id="select-and-test">Select and test</h2>

            <p>
              Given a scored pool of candidates, the question is which
              ones to test next. Active learning formalizes this: instead
              of testing the top-ranked candidates by a single metric,
              the system selects variants that are most informative
              given what the model already knows. Some are selected
              because they are predicted to perform well. Others because
              they sit in regions of the design space where the model
              is uncertain and testing them would improve future
              predictions.
            </p>

            <p>
              In practice, this means each round of synthesis and
              screening produces data that the model uses to update its
              predictions and propose the next set of candidates. A
              typical strategy enforces sequence constraints that relax
              across rounds: early rounds stay close to the lead (within
              a few mutations), later rounds explore further. This
              graduated exploration balances confidence in the starting
              point against the need to discover better regions of
              sequence space.
            </p>

            <p>
              ProviGen manages this iterative selection across the full
              characterization pipeline. Binding data from an early
              round informs which candidates are worth the more
              expensive stability profiling. Expression failures from
              one batch inform sequence design choices in the next.
              Specificity patterns learned from one target can transfer
              to related campaigns.
            </p>

            {/* --- SECTION 4: MULTI-PROPERTY OPTIMIZATION --- */}
            {/*
              IMAGE IDEA: Parallel coordinates or radar chart showing
              multiple antibody properties. No single candidate is best
              on all axes.
            */}
            <h2 id="multi-property">Multi-property optimization</h2>

            <p>
              Therapeutic antibody candidates must perform across
              multiple properties simultaneously: binding affinity and
              kinetics, expression yield, specificity (low
              cross-reactivity, low polyreactivity), thermal and
              colloidal stability, functional potency, and
              developability (viscosity, self-interaction, charge
              variants). Tighter binding often comes with reduced
              stability or increased polyreactivity. High expression
              variants may have developability liabilities.
            </p>

            <p>
              The model maps the <em>Pareto frontier</em> (the set of
              candidates where no single property can be improved
              without compromising another). Teams define which
              properties matter most for their specific program, and
              the model proposes candidates and experiments that move
              toward that frontier. This replaces the typical approach
              of optimizing affinity first and hoping the other
              properties follow.
            </p>

            {/* --- SECTION 5: LAB-IN-THE-LOOP --- */}
            {/*
              IMAGE IDEA: The Genentech lab-in-the-loop cycle:
              Generative Model → Property Predictor → Active Learning
              Selection → Synthesis → In Vitro Testing → Data Ingestion
              → back to Generative Model.
            */}
            <h2 id="lab-in-the-loop">Lab-in-the-loop</h2>

            <p>
              The strongest public demonstration of this approach comes
              from Genentech, Roche, and Prescient Design.
              <sup>
                <a href="#fn1" className="text-[#6c7793] hover:text-[#090E34] no-underline">[1]</a>
              </sup>
              {" "}Their lab-in-the-loop system combined generative
              models, multi-task property predictors, active-learning
              selection, synthesis, and in vitro testing into a
              semi-autonomous optimization loop. Applied to four
              clinically relevant targets (EGFR, IL-6, HER2, OSM), the
              system designed and tested over 1,800 unique antibody
              variants across iterative rounds, achieving 3 to 100x
              binding improvements with best binders in the
              therapeutically relevant sub-100 pM range.
            </p>

            <p>
              Arc Institute&apos;s MULTI-evolve framework
              <sup>
                <a href="#fn2" className="text-[#6c7793] hover:text-[#090E34] no-underline">[2]</a>
              </sup>
              {" "}points in the same direction: protein language models
              guiding rapid directed evolution of complex multi-mutant
              proteins, with computational prediction and experimental
              design coupled from the start. The Coefficient Bio team
              that built much of the Genentech system was acquired by
              Anthropic for $400M in April 2026,
              <sup>
                <a href="#fn3" className="text-[#6c7793] hover:text-[#090E34] no-underline">[3]</a>
              </sup>
              {" "}signaling that foundational AI companies see
              lab-in-the-loop biological design as a core application.
            </p>

            <hr />

            <p>
              ProviGen brings this decision loop to antibody discovery
              teams working with their own targets, assays, and
              automation. Every candidate tested produces a result,
              updates the model, and improves the next selection.
              Learnings compound across rounds and transfer across
              programs. Failed candidates are informative. Partial
              characterization data is usable immediately, without
              waiting for full panels to complete.
            </p>

            <p>
              If you are interested in exploring what a lab-in-the-loop
              campaign could look like for your antibody program, reach
              out to{" "}
              <a href="mailto:research@provigen.ai">research@provigen.ai</a>.
            </p>

          </div>

            {/* Footnotes */}
            <footer className="mt-20 pt-8 border-t border-[#e8e6e1]">
              <div className="font-mono text-xs text-[#6c7793] leading-relaxed space-y-2">
                <p id="fn1">
                  [1] Frey et&nbsp;al.,{" "}
                  <a
                    href="https://doi.org/10.1101/2025.02.19.639050"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    &ldquo;Lab-in-the-loop therapeutic antibody design
                    with deep learning,&rdquo; bioRxiv, 2025
                  </a>
                  . Genentech, Roche, and Prescient Design. Over 1,800
                  unique antibody variants designed and tested across
                  EGFR, IL-6, HER2, and OSM targets.
                </p>
                <p id="fn2">
                  [2] Tran et&nbsp;al.,{" "}
                  <a
                    href="https://doi.org/10.1126/science.adr6006"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    &ldquo;Rapid directed evolution guided by protein
                    language models,&rdquo; Science, 2026
                  </a>
                  . Arc Institute. MULTI-evolve framework for
                  lab-in-the-loop biological design.
                </p>
                <p id="fn3">
                  [3]{" "}
                  <a
                    href="https://www.biospace.com/business/ai-giant-anthropic-leans-into-life-sciences-with-400m-coefficient-bio-catch"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Anthropic acquires Coefficient Bio for $400M
                  </a>
                  , BioSpace, April 2026. Coefficient Bio&apos;s team
                  came from Genentech&apos;s Prescient Design lab.
                </p>
              </div>
            </footer>
        </div>
      </article>
    </div>
  );
}
