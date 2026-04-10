"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";

const sections = [
  { id: "assay-optimization", label: "Assay optimization" },
  { id: "protein-engineering", label: "Protein engineering" },
  { id: "media-optimization", label: "Media optimization" },
];

export default function BlogPost() {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first section that is intersecting
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
        {/* Header - full width centered */}
        <div className="max-w-3xl mx-auto px-4 md:px-12 mb-16">
          <header>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight font-normal text-[#090E34] mb-10">
              Closed-Loop Experimental Campaigns in Practice
            </h1>
            <div className="grid md:grid-cols-[120px_1fr] gap-x-6 gap-y-1 font-mono text-sm text-[#090E34]">
              <span className="text-[#6c7793]">Published</span>
              <span>April 10, 2025</span>
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

        {/* Sidebar + Content layout */}
        <div className="max-w-3xl mx-auto px-4 md:px-12 relative">
          {/* Left sidebar - positioned outside content flow */}
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
          <div>
            {/* Intro */}
            <div className="prose-blog">
              <p>
                Most experimental optimization still works like this: run a
                batch, look at the results, discuss what to try next, repeat.
                The learning happens in the scientist&apos;s head. The question
                is what changes when you make that loop explicit and let every
                round inform the next one automatically.
              </p>

              <p>
                Experimental optimization is often described as if it were a
                sequence of isolated screens. In reality, most teams are running
                a <em>campaign</em>. They start with an objective, test a first
                batch of conditions, learn from the results, and adjust the next
                round accordingly. The difference is that in most labs today,
                this learning loop is still largely manual. Closed-loop
                optimization makes it explicit: each round updates the
                system&apos;s understanding of what looks promising, what
                remains uncertain, and where the next experiments are likely to
                be most valuable.
              </p>

              <p>
                The exact shape of that loop depends on the application. In
                assay optimization, the objective may be plate-level robustness
                rather than single-well performance. In protein engineering,
                early in vitro data may arrive quickly while in vivo outcomes
                lag behind by weeks. In media optimization, the challenge is
                often not a single dominant factor but a dense network of
                interactions. Across all three, the principle is the same: use
                each experimental round to make the next one more informed.
              </p>

              {/* ---- BO Intuition ---- */}
              <h2 id="core-intuition">The core intuition</h2>

              <p>
                At the most simplified level, every campaign works like this:
                run a batch of experiments, update a probabilistic model of the
                design space, and choose the next batch based on both expected
                performance and remaining uncertainty. The model does not just
                ask <em>where do I expect the best result?</em> It also asks{" "}
                <em>where am I still most uncertain?</em> Balancing these two
                questions is what distinguishes an active learning campaign from
                a static screen.
              </p>
            </div>

            {/* BO figure */}
            <figure className="my-12">
              <div className="rounded-lg overflow-hidden bg-white border border-[#e8e6e1] shadow-sm">
                <Image
                  src="/images/blog/bo-1d-intuition.gif"
                  alt="One-dimensional Bayesian optimization: the model alternates between exploring uncertain regions and exploiting promising ones"
                  width={800}
                  height={400}
                  className="w-full"
                  unoptimized
                />
              </div>
              <figcaption className="mt-3 font-mono text-xs text-[#6c7793] leading-relaxed">
                A one-dimensional illustration of Bayesian optimization. The
                blue curve is the model&apos;s belief about the objective; the
                shaded region represents uncertainty. After each observation the
                model updates and selects the next query by balancing expected
                improvement against remaining uncertainty.
              </figcaption>
            </figure>

            <div className="prose-blog">
              <p>
                This toy example is one-dimensional and smooth. Real campaigns
                operate in much higher-dimensional spaces with noisy
                measurements, batch constraints, and practical lab realities.
                But the basic decision logic is the same, and it is this logic
                that drives the three campaign stories below.
              </p>

              {/* ---- Story 1: Assay ---- */}
              <h2 id="assay-optimization">
                Turning assay troubleshooting into a learning campaign
              </h2>

              <p>
                Imagine a team preparing to scale an assay into routine
                screening. The assay works, but not robustly enough. CV is
                higher than acceptable, edge effects appear on some plates, and
                the signal window narrows unpredictably between runs. The usual
                response is iterative troubleshooting: adjust one variable,
                rerun, check the result, adjust again. It works, but it is
                slow, and the path through parameter space is driven by
                intuition rather than by systematic evidence.
              </p>

              <p>
                In a closed-loop campaign, the team begins by defining which
                parameters may be adjusted: reagent concentrations, dispense
                volumes, mixing intensity, incubation times, temperatures, wash
                settings, readout timing, or plate handling steps. They also
                define what &ldquo;better&rdquo; means: lower CV, higher
                Z&prime;, stable signal separation, and acceptable runtime.
              </p>

              <p>
                The system then selects an initial batch of assay conditions to
                test. Each candidate is not a single well but a full assay
                condition executed with a structured layout of controls and
                replicates on a plate. That matters because the objective is not
                a raw signal value from one well. It is reproducibility,
                variability, and spatial stability across the plate.
              </p>

              <p>
                Once the first plates are run, the system ingests the resulting
                data. That includes not only assay readouts, but potentially
                also execution metadata: dispense timing, shaker behavior,
                temperature traces, liquid handling logs, or other
                instrument-level information that may explain performance
                variation. The raw well data is then aggregated into
                condition-level outcomes such as CV, Z&prime;,
                signal-to-background, drift across plate positions, or failure
                modes.
              </p>

              <p>
                After that first round, the model updates its estimate of which
                regions of parameter space look promising and which parts remain
                uncertain. The next round is chosen accordingly. Some conditions
                are close variations around the best performers so far. Others
                are selected because the model is still uncertain there and
                believes more information would be valuable.
              </p>

              <p>
                As the campaign progresses, the behavior changes. Early rounds
                are broader and meant to map the space. Later rounds become more
                targeted, focusing on a narrower incubation window or a tighter
                reagent concentration range where the model sees the best
                tradeoff between robustness and signal quality. Eventually, the
                campaign converges on a protocol region that is both strong and
                stable. The output is not just &ldquo;this one setting worked
                once,&rdquo; but a better-characterized operating window with
                evidence that it is robust across repeated execution.
              </p>

              <aside>
                In this type of campaign, a single optimization sample is
                typically one assay condition summarized from a plate or
                replicate layout, not one well. The wells are raw observations
                feeding into that condition-level outcome.
              </aside>

              {/* ---- Story 2: Protein Engineering ---- */}
              <h2 id="protein-engineering">
                Selecting protein candidates while downstream data is still
                pending
              </h2>

              <p>
                Protein engineering campaigns rarely fail because teams have too
                little data in total. More often, the problem is that the most
                meaningful data arrives late. Early rounds generate expression,
                binding, potency, stability, and developability signals quickly,
                while in vivo readouts from mouse studies may take weeks. In a
                traditional workflow, teams either wait for the slow data before
                deciding on the next round, or they press forward using only the
                fast signals and hope those signals are predictive. Neither
                approach is ideal.
              </p>

              <p>
                In a closed-loop campaign, the team begins by defining the
                candidate space: sequence variants, domain combinations, linker
                choices, formulation options, or other design variables. The
                objectives span multiple properties: potency, expression yield,
                stability, aggregation, manufacturability, and eventually in
                vivo efficacy or pharmacokinetics.
              </p>

              <p>
                The first batch of candidates is deliberately broad, covering
                diverse regions of the design space rather than only small local
                variants. These candidates are expressed, purified, and
                characterized through the initial assay stack: expression yield,
                purity, binding affinity, functional potency, stress stability,
                aggregation tendency, and other developability metrics.
              </p>

              <p>
                Once these early results come back, the model updates. At this
                point, the system has already learned something useful even
                before any in vivo work has started. It may recognize that a
                particular region of sequence space consistently gives poor
                manufacturability, or that certain variants produce a favorable
                potency-stability tradeoff. The next batch of candidates is
                therefore chosen more intelligently than the first.
              </p>

              <p>
                A subset of candidates is then advanced into more expensive
                downstream studies, including in vivo mouse work. This is where
                the campaign becomes explicitly multi-stage and time-delayed.
                The important point is that the campaign does not stop and wait
                passively. It continues learning from the faster assay layers
                while delayed data is pending.
              </p>

              <p>
                Weeks later, in vivo results begin to arrive. Those results are
                linked back to the same candidate variants that have already
                accumulated in vitro and developability data. Now the model can
                do something much more valuable than simply marking winners and
                losers. It can start learning which early proxy signals actually
                predict downstream in vivo performance and which ones were
                misleading.
              </p>

              <p>
                That changes later rounds materially. Before in vivo feedback,
                the model is guided mainly by in vitro and developability
                signals. After enough in vivo data has been observed, it becomes
                much better calibrated toward the outcomes that matter most
                clinically. Candidate selection becomes more informed because
                the model is no longer just optimizing for strong proxy
                performance. It is learning which proxy profiles tend to
                translate into actual downstream success.
              </p>

              <p>
                Over the life of the campaign, a progression typically emerges:
                early rounds explore broadly using fast, high-throughput assays;
                the middle phase selectively advances promising candidates into
                expensive downstream studies; later rounds generate candidates
                that are increasingly shaped by the learned relationship between
                early proxy data and delayed in vivo truth.
              </p>

              <aside>
                Here, a sample is typically a candidate protein variant or
                variant-condition pair, not an individual mouse or single assay
                replicate. Replicates, assay measurements, process logs, and
                delayed in vivo observations all contribute evidence about that
                same candidate.
              </aside>

              {/* ---- Story 3: Media Optimization ---- */}
              <h2 id="media-optimization">
                Navigating complex media interactions without exhaustive
                screening
              </h2>

              <p>
                Media optimization is often less about finding one magic
                ingredient than about resolving a web of interactions between
                nutrients, supplements, growth factors, seeding densities, and
                timing decisions. The combinatorial space grows fast. A
                formulation with ten adjustable components at just three levels
                each already spans nearly sixty thousand combinations. Exhaustive
                screening is not realistic, and factorial designs quickly become
                unwieldy as dimensionality increases.
              </p>

              <p>
                In a closed-loop campaign, the team starts by defining which
                levers are adjustable: basal media composition, supplement
                concentrations, cytokines or growth factors, feeding schedules,
                seeding density, timing of media exchanges, or culture duration.
                The objective might be higher viable cell density, better
                phenotype retention, improved differentiation efficiency,
                stronger productivity, or some weighted combination of these.
              </p>

              <p>
                The first round samples a broad range of media and process
                conditions. Each candidate condition is run with replicates,
                often across a plate-based or small-scale format. At this stage,
                the goal is not only to find a few good conditions but to map
                how sensitive the cells are to different regions of the
                formulation and process space.
              </p>

              <p>
                After the first batch is executed, the system collects the
                resulting measurements: cell counts, viability,
                morphology-derived features, marker expression, metabolic
                readouts, productivity signals, or other assay outputs. As with
                the other campaign types, the system can also incorporate
                process traces and device logs from the relevant instruments
                where they help explain execution-dependent variation.
              </p>

              <p>
                The model then updates and proposes the next set of conditions.
                Some are chosen because they appear likely to improve the main
                objective. Others are chosen because they help resolve
                uncertainty about important interactions, for example whether a
                certain growth factor is only beneficial above a certain basal
                nutrient level, or whether a feeding schedule changes the effect
                of another supplement.
              </p>

              <p>
                This is where active learning becomes very tangible. Instead of
                exhaustively trying every possible combination, the campaign
                becomes increasingly selective. The system focuses experiments
                where information value is highest and where the probability of
                meaningful improvement is strongest.
              </p>

              <p>
                As the campaign continues, the search narrows toward a smaller
                operational region. Rather than concluding with one single
                &ldquo;best media,&rdquo; the useful endpoint is often a more
                robust understanding of the response surface: which ingredients
                matter most, which interactions are real, what the acceptable
                operating ranges are, and which conditions deliver stable
                performance across repeats. That is especially valuable in real
                process development, because the goal is usually not just peak
                performance under one lucky condition, but a formulation space
                that is both strong and reliable.
              </p>

              <aside>
                Here, a sample is typically one media or process condition
                evaluated with replicates. The replicate wells or vessels are
                observations used to estimate the performance of that condition.
              </aside>

              {/* ---- Summary ---- */}
              <h2 id="decision-boundaries">
                The same loop, different decision boundaries
              </h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto my-10 font-mono text-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#d4d2cd]">
                    <th className="py-3 pr-4 font-medium text-[#6c7793] uppercase tracking-wider text-xs">
                      Application
                    </th>
                    <th className="py-3 pr-4 font-medium text-[#6c7793] uppercase tracking-wider text-xs">
                      Decision variable
                    </th>
                    <th className="py-3 pr-4 font-medium text-[#6c7793] uppercase tracking-wider text-xs">
                      One sample
                    </th>
                    <th className="py-3 font-medium text-[#6c7793] uppercase tracking-wider text-xs">
                      Data sources
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[#090E34]">
                  <tr className="border-b border-[#e8e6e1]">
                    <td className="py-3 pr-4">Assay optimization</td>
                    <td className="py-3 pr-4">Assay recipe</td>
                    <td className="py-3 pr-4">Condition at plate level</td>
                    <td className="py-3">
                      Well readouts, replicates, spatial effects, instrument
                      logs
                    </td>
                  </tr>
                  <tr className="border-b border-[#e8e6e1]">
                    <td className="py-3 pr-4">Protein engineering</td>
                    <td className="py-3 pr-4">Variant or variant-condition</td>
                    <td className="py-3 pr-4">
                      Candidate with multi-stage data
                    </td>
                    <td className="py-3">
                      In vitro screens, developability, in vivo mouse data
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Media optimization</td>
                    <td className="py-3 pr-4">Media / process condition</td>
                    <td className="py-3 pr-4">Condition with replicates</td>
                    <td className="py-3">
                      Replicate wells/flasks, time-course, metabolic readouts
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="prose-blog">
              <p>
                Across all three applications, the campaign structure is the
                same. What changes is the level at which a candidate is defined,
                what data feeds into each evaluation, and how delayed or
                hierarchical outcomes affect the learning loop. The right sample
                definition follows the decision boundary, not the instrument
                boundary. Replicates improve confidence in a sample. They do not
                redefine what the sample is.
              </p>

              {/* ---- Data richness ---- */}
              <h2 id="beyond-endpoints">Beyond single endpoints</h2>

              <p>
                The optimization loop is not limited to a single scalar assay
                result per run. In practice, it can learn from the full evidence
                stack generated around each candidate: replicate structure, QC
                outputs, execution metadata, device logs from related
                instruments, and, where relevant, delayed downstream results
                such as in vivo readouts. The richer the evidence per candidate,
                the faster the model can distinguish real performance
                differences from noise.
              </p>

              <p>
                From the user&apos;s perspective, however, the campaign is still
                experienced as a sequence of candidate decisions, observed
                results, and increasingly informed next-round recommendations.
                The complexity of the underlying data stack does not surface as
                complexity in the workflow. It surfaces as better decisions,
                faster convergence, and fewer wasted experiments.
              </p>

              {/* ---- Closing ---- */}
              <hr />

              <p>
                The point is not to &ldquo;run Bayesian optimization&rdquo; as
                an abstract algorithm. It is to make each experimental round
                more informed than the last while using all relevant evidence
                generated by the workflow. Whether the campaign is about
                tightening an assay, engineering a therapeutic protein, or
                finding a better formulation, the operating principle is the
                same: structured learning, round over round, converging on
                outcomes that matter.
              </p>

              <p>
                If you are interested in exploring what a closed-loop campaign
                might look like for your specific workflow, reach out at{" "}
                <a href="mailto:research@provigen.ai">research@provigen.ai</a>.
              </p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
