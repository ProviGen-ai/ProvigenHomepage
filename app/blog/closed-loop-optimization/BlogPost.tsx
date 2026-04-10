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
            {/* ---- Intro: why manual iteration breaks down ---- */}
            <div className="prose-blog">
              <p>
                Most experimental work in the life sciences already follows a
                campaign pattern. A team runs an initial set of experiments,
                looks at the results, discusses what to try next, and runs
                again. Whether the goal is making an assay more robust, finding
                a better therapeutic candidate, or improving a cell culture
                process, the structure is the same: repeated rounds of
                experiments, each one informed by the last. But the learning
                between rounds usually lives in notebooks, spreadsheets, and
                the scientists&apos; heads. The campaign exists, but the
                feedback loop is still largely manual.
              </p>

              <p>
                That becomes a real limitation when the relevant evidence does
                not arrive all at once. Some signals are available immediately
                from the assay itself. Others come from process metadata, device
                logs, environmental conditions, or additional analytical methods
                like mass spectrometry. Still others, like in vivo readouts, may
                only appear much later and only for a subset of candidates.
                Integrating all of that into the next decision is exactly
                where a systematic approach becomes essential.
              </p>

              <p>
                Closed-loop learning makes that feedback loop explicit. After and even during
                each round, the system updates its understanding of what looks
                promising, what remains uncertain, and which next experiments
                are most worth running. It does not require every candidate to
                be fully characterized before it can learn. It works with the
                evidence available now and refines its understanding as the
                missing pieces arrive later.
              </p>

              {/* ---- The core loop ---- */}
              <h2>The core loop</h2>

              <p>
                At the simplest level, a closed-loop campaign does four things
                over and over:
              </p>

              <ol>
                <li>Run a batch of candidates.</li>
                <li>
                  Collect whatever evidence becomes available, from primary
                  assay outcomes to process context and auxiliary signals.
                </li>
                <li>
                  Update the model using both current observations and
                  remaining uncertainty.
                </li>
                <li>
                  Choose the next batch, while continuing to fold in slower
                  signals as they arrive.
                </li>
              </ol>

              <p>
                That last part matters. The system does not only ask{" "}
                <em>where do I expect the best result?</em> It also asks{" "}
                <em>where am I still most uncertain?</em> and{" "}
                <em>
                  where would another experiment be most informative?
                </em>{" "}
                Balancing these questions is what makes the campaign adaptive
                rather than static. Early rounds are often broader, mapping the
                space and revealing where outcomes are sensitive to certain
                variables. Later rounds become more selective, focusing on the
                regions that matter most for the decision at hand.
              </p>
            </div>

            {/* BO figure */}
            <figure className="my-12">
              <div className="rounded-lg overflow-hidden bg-white border border-[#e8e6e1] shadow-sm max-h-[360px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/02/GpParBayesAnimationSmall.gif"
                  alt="Bayesian optimization animation: the model alternates between exploring uncertain regions and exploiting promising ones"
                  className="w-full object-cover object-top"
                />
              </div>
              <figcaption className="mt-3 font-mono text-xs text-[#6c7793] leading-relaxed">
                A simplified view of uncertainty-aware experiment selection. The
                blue curve is the model&apos;s belief about the objective; the
                shaded region represents uncertainty. After each observation the
                model updates and selects the next query by balancing expected
                improvement against remaining uncertainty. Real campaigns are
                higher-dimensional and noisier, but the same logic
                applies.&thinsp;
                <sup>
                  <a href="#fn1" className="text-[#6c7793] hover:text-[#090E34] no-underline">
                    [1]
                  </a>
                </sup>
              </figcaption>
            </figure>

            <div className="prose-blog">
              <p>
                In practice, this approach is remarkably sample-efficient. For
                many real-world problems, strong results can be achieved within
                80 to 100 evaluated candidates. To put that in perspective: a
                design space with just ten adjustable parameters at three levels
                each contains nearly 60,000 possible combinations. A full
                factorial design would need to test all of them. Classical
                Design of Experiments methods reduce that, but still scale
                poorly as dimensions grow. An active learning campaign can
                navigate the same space in a fraction of the experiments by
                concentrating effort where it matters most.
              </p>

              <p>
                This principle looks different across workflows. The three
                stories below show how the same engine drives campaigns in assay
                development, protein engineering, and media optimization, and
                how each one handles the particular data realities of that
                domain.
              </p>

              {/* ---- Story 1: Assay Optimization ---- */}
              <h2 id="assay-optimization">
                Turning assay troubleshooting into a learning campaign
              </h2>

              <p>
                An assay can be functional without being ready for routine use.
                Maybe the signal window is acceptable on good days, but CV is
                too high, edge effects appear unpredictably, or the protocol
                becomes fragile when scaled across plates. In many labs, the
                response is familiar: tweak one variable, rerun, inspect the
                result, and repeat. It works, but the path through parameter
                space is driven by intuition rather than by systematic evidence.
              </p>

              <p>
                In a closed-loop campaign, the team begins by defining which
                parameters may be adjusted: reagent concentrations, dispense
                volumes, mixing intensity, incubation times, temperatures, wash
                settings, readout timing, or plate handling steps. They also
                define what &ldquo;better&rdquo; means: lower CV, higher
                Z&prime;, stable signal separation, acceptable runtime, or
                lower reagent cost. That last one matters more than it may
                seem: finding a condition that delivers good signal with low
                variance at reduced reagent concentrations can translate into
                significant cost savings when the assay runs at scale.
              </p>

              <p>
                The system selects an initial batch of assay conditions to test.
                Each candidate is not a single well but a full assay condition
                executed with a structured layout of controls and replicates on
                a plate. That matters because the objective is not a raw signal
                value from one well. It is reproducibility and spatial
                stability across the plate.
              </p>

              <p>
                Once the first plates are run, the system does not only ingest
                the assay readout. It can also incorporate execution context that
                may explain why one run behaved differently from another:
                dispense timing, shaker behavior, liquid handling traces, module
                temperatures, environmental conditions, or additional QC
                signals. That matters because robustness problems often show up
                first as patterns in the broader execution data before they are
                obvious in the final assay summary.
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

              {/* ---- Story 2: Protein Engineering ---- */}
              <h2 id="protein-engineering">
                Selecting protein candidates while downstream data is still
                pending
              </h2>

              <p>
                Protein engineering rarely suffers from too little data overall.
                The harder problem is that the most meaningful data often arrives
                last. Expression, binding, and stability can be measured
                quickly. In vivo readouts may take weeks, months, or even
                years. The practical question
                is how to keep learning while the most important evidence is
                still on the way.
              </p>

              <p>
                In a closed-loop campaign, the team defines the candidate space:
                sequence variants, domain combinations, linker choices,
                formulation options, or other design variables. The objectives
                span multiple properties, from potency and stability to ease
                of manufacturing and eventually in vivo performance.
              </p>

              <p>
                The first batch of candidates is deliberately broad, covering
                diverse regions of the design space. These candidates are
                expressed, purified, and characterized through an initial
                panel of assays covering expression, binding, potency, and
                stability.
              </p>

              <p>
                Once these early results come back, the model updates. At this
                point, the system has already learned something useful even
                before any in vivo work has started. It may recognize that a
                particular region of sequence space is consistently hard to
                manufacture, or that certain variants produce a favorable
                potency-stability tradeoff. The next batch is therefore chosen
                more intelligently than the first.
              </p>

              <p>
                A subset of candidates is then advanced into more expensive
                downstream studies, including in vivo mouse work. The campaign
                does not stop and wait passively. It continues learning from the
                faster assay layers while delayed data is pending.
              </p>

              <p>
                Weeks later, in vivo results begin to arrive. Those results are
                linked back to the same candidate variants that have already
                accumulated earlier characterization data. Now the model can
                do something much more valuable than simply marking winners and
                losers. It can start learning which early proxy signals actually
                predict downstream in vivo performance and which ones were
                misleading.
              </p>

              <p>
                That changes later rounds materially. Before in vivo feedback,
                the model is guided mainly by fast proxy signals. After enough
                downstream data has been observed, it becomes much better
                calibrated toward the outcomes that matter most clinically.
                Candidate selection becomes more informed because the model is
                no longer just optimizing for strong proxy performance. It is
                learning which proxy profiles tend to translate into actual
                downstream success.
              </p>

              <p>
                Over the life of the campaign, a progression typically emerges:
                early rounds explore broadly using fast, high-throughput assays;
                the middle phase selectively advances promising candidates into
                expensive downstream studies; later rounds generate candidates
                increasingly shaped by the learned relationship between early
                proxy data and delayed in vivo truth.
              </p>

              {/* ---- Story 3: Media Optimization ---- */}
              <h2 id="media-optimization">
                Navigating media interactions without exhaustive screening
              </h2>

              <p>
                Media optimization is rarely about one magic ingredient. More
                often, performance emerges from interactions between nutrients,
                supplements, growth factors, seeding densities, and timing
                decisions. That is why brute-force screening becomes impractical
                so quickly: the space grows combinatorially long before the
                biology becomes easy to interpret.
              </p>

              <p>
                In a closed-loop campaign, the team defines which levers are
                adjustable: basal media composition, supplement concentrations,
                cytokines or growth factors, feeding schedules, seeding density,
                timing of media exchanges, or culture duration. The objective
                might be higher viable cell density, better phenotype retention,
                improved differentiation efficiency, stronger productivity, or
                some weighted combination of these.
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
                As the first batch runs and results come in, the system
                collects whatever evidence is available, from cell counts and
                viability to process traces and environmental conditions. Not every
                candidate needs to be fully characterized for the campaign to
                improve. The system updates on what it has and refines its
                search as more data comes in.
              </p>

              <p>
                The model then proposes the next set of conditions, balancing
                candidates likely to improve growth or phenotype against ones
                that would resolve open questions about interactions, for
                example whether a growth
                factor is only beneficial above a certain basal nutrient level,
                or whether a feeding schedule changes the effect of another
                supplement.
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

              {/* ---- What counts as a sample? ---- */}
              <h2>What counts as a sample?</h2>

              <p>
                A &ldquo;sample&rdquo; in a closed-loop campaign is the decision
                unit being evaluated, not necessarily the smallest physical unit
                in the lab.
              </p>

              <p>
                In assay optimization, that may be a full assay condition
                summarized across a plate layout. In protein engineering, it is
                often a candidate variant or variant-condition pair. In media
                optimization, it is typically one media or process condition
                evaluated with replicates.
              </p>

              <p>
                The important point is that the sample follows the decision
                boundary, not the instrument boundary. Replicates strengthen
                confidence in that evaluation, but they do not redefine what the
                candidate is.
              </p>
            </div>

            {/* Summary table */}
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
                      Well readouts, replicates, device logs, environmental data
                    </td>
                  </tr>
                  <tr className="border-b border-[#e8e6e1]">
                    <td className="py-3 pr-4">Protein engineering</td>
                    <td className="py-3 pr-4">Variant or variant-condition</td>
                    <td className="py-3 pr-4">
                      Candidate with multi-stage data
                    </td>
                    <td className="py-3">
                      In vitro screens, stability, delayed in vivo data
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
              {/* ---- Closing ---- */}
              <hr />

              <p>
                Our active learning system goes beyond classical Bayesian
                optimization. Where a standard approach would treat each assay
                result as an independent number, our system learns how
                different data sources relate to each other and to the outcomes
                that matter. That is what allows it to make useful decisions
                even when some signals are missing, delayed by months, or
                structurally different from each other.
              </p>

              <p>
                From the user&apos;s perspective, the experience is
                straightforward: define what you want to achieve, and the
                system handles the rest, from designing the next round of
                experiments to programming the screening hardware and
                collecting the results. The complexity lives underneath. It
                surfaces as better decisions, faster convergence, and fewer
                wasted experiments.
              </p>

              <p>
                If you are interested in exploring what a closed-loop campaign
                could look like for your workflow, reach out to{" "}
                <a href="mailto:research@provigen.ai">research@provigen.ai</a>.
              </p>
            </div>

            {/* Footnotes */}
            <footer className="mt-20 pt-8 border-t border-[#e8e6e1]">
              <div className="font-mono text-xs text-[#6c7793] leading-relaxed space-y-2">
                <p id="fn1">
                  [1] Animation by{" "}
                  <a
                    href="https://commons.wikimedia.org/w/index.php?title=User:AnotherSamWilson"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    AnotherSamWilson
                  </a>
                  , licensed under{" "}
                  <a
                    href="https://creativecommons.org/licenses/by-sa/4.0"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    CC BY-SA 4.0
                  </a>
                  , via{" "}
                  <a
                    href="https://commons.wikimedia.org/wiki/File:GpParBayesAnimationSmall.gif"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Wikimedia Commons
                  </a>
                  . The figure illustrates Gaussian process-based Bayesian
                  optimization with a parallel expected improvement acquisition
                  function.
                </p>
              </div>
            </footer>
          </div>
        </div>
      </article>
    </div>
  );
}
