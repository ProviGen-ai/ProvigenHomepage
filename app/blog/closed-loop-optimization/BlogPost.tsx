"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import TimelineGraphic from "./TimelineGraphic";
import { postsBySlug } from "../posts";

const post = postsBySlug["closed-loop-optimization"];

const sections = [
  { id: "assay-optimization", label: "Assay optimization" },
  { id: "protein-engineering", label: "Therapeutic design" },
  { id: "media-optimization", label: "Media formulation" },
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
              <span>{post.date}</span>
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
                campaign pattern. Whether the goal is making an assay more
                robust, finding a better therapeutic candidate, or improving a
                cell culture process, teams run rounds of experiments, look at
                the results, and decide what to try next. But the learning
                between rounds usually lives in notebooks, spreadsheets, and
                the scientists&apos; heads. The campaign exists, but the
                feedback loop is still largely manual.
              </p>

              <p>
                That becomes a real limitation when the relevant evidence does
                not arrive all at once. Some signals are available within hours.
                Others take days, weeks, or months. At any given point in a
                campaign, the next decision has to be made on incomplete
                information.
              </p>
            </div>

            {/* Visual: evidence arriving over time */}
            <figure className="my-12">
              <div className="rounded-lg overflow-hidden bg-white border border-[#e8e6e1] shadow-sm">
                <TimelineGraphic />
              </div>
              <figcaption className="mt-3 font-mono text-xs text-[#6c7793] leading-relaxed">
                QC signals may be immediate, assay results follow shortly
                after, and downstream data like analytics or in vivo readouts
                can lag by weeks or months. Decisions have to be made at every
                stage regardless.
              </figcaption>
            </figure>

            <div className="prose-blog">
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
                  Collect whatever evidence becomes available, from assay
                  readouts to QC data, device logs, or characterization results.
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
                This is where it gets interesting. The system does not only
                ask{" "}
                <em>where do I expect the best result?</em> It also asks{" "}
                <em>where am I still most uncertain?</em> and{" "}
                <em>
                  where would another experiment be most informative?
                </em>{" "}
                Balancing these questions is what makes the campaign adaptive
                rather than static. Early rounds are often broader, mapping the
                space and revealing where outcomes are sensitive to certain
                variables. Later rounds become more selective, focusing on the
                regions that matter most for the decision at hand. And
                crucially, the campaign does not pause while waiting for slower
                data. It keeps moving with what it has and refines its
                understanding as delayed signals come in.
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
                A simplified view of uncertainty-aware experiment
                selection<sup><a href="#fn1" className="text-[#6c7793] hover:text-[#090E34] no-underline">[1]</a></sup>. The blue curve is the model&apos;s belief about the
                objective; the shaded region represents uncertainty. After each
                observation the model updates and selects the next query by
                balancing expected improvement against remaining uncertainty.
                Real campaigns are higher-dimensional and noisier, but the same
                logic applies. For higher-dimensional cases, see our{" "}
                <a href="/demo" className="text-[#4A6CF7] hover:text-[#3451c7]">
                  interactive demo
                </a>
                .
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

              {/* ---- Story 1: Assay Optimization ---- */}
              <h2 id="assay-optimization">
                Assay optimization
              </h2>

              <p>
                An assay can be functional without being ready for routine use.
                Coefficient of variation (CV) is too high, edge effects
                appear unpredictably, or the
                protocol becomes fragile at scale. The usual fix is manual
                tweaking: adjust one variable, rerun, inspect, repeat.
              </p>

              <p>
                In a closed-loop campaign, the team defines which parameters
                may vary and what &ldquo;better&rdquo; means: lower CV, higher
                Z&prime;, stable signal separation, or lower reagent cost.
                That last one matters more than it may seem: a protocol that
                delivers reliable results at lower cost per plate can save
                significant budget when the assay runs at scale.
              </p>
            </div>

            {/* Plate heatmap */}
            <figure className="my-12 flex flex-col items-center">
              <div className="rounded-lg overflow-hidden bg-white border border-[#e8e6e1] shadow-sm max-w-md">
                <Image
                  src="/images/blog/plate-heatmap.png"
                  alt="384-well plate heatmap showing spatial variation across wells, with edge effects visible in the upper-left corner"
                  width={770}
                  height={600}
                  className="w-full"
                />
              </div>
              <figcaption className="mt-3 font-mono text-xs text-[#6c7793] leading-relaxed">
                A 384-well plate readout showing spatial variation across
                positions. Patterns like edge effects or regional drift are
                exactly what condition-level metrics capture and what the
                campaign learns to account for.
              </figcaption>
            </figure>

            <div className="prose-blog">
              <p>
                Each candidate is not a single well but a full assay condition
                with controls and replicates across a plate. A single well
                cannot tell you whether CV is acceptable, whether edge effects
                are under control, or whether the signal remains consistent across
                well positions. Those are plate-level properties, and they require
                plate-level evaluation.
              </p>

              <p>
                Beyond the assay results, the system can incorporate
                execution context: dispense timing, shaker behavior,
                temperature drift, plate position effects, or environmental
                conditions. Over successive rounds, this reveals whether
                robustness problems are driven by the protocol itself or by
                specific execution patterns. The result is a clearer picture
                of why certain conditions fail and what operating ranges are
                safe to rely on.
              </p>

              {/* ---- Story 2: Therapeutic Design ---- */}
              <h2 id="protein-engineering">
                Therapeutic design
              </h2>

              <p>
                In therapeutics design, the bottleneck is rarely lack of data.
                It is that the most meaningful data often arrives last.
                Binding, potency, and stability can be measured in vitro,
                while in vivo readouts may take weeks, months, or even years.
              </p>

              <p>
                A closed-loop campaign starts with a broad first batch of
                candidates covering diverse regions of the design space.
                These are characterized through an initial panel of assays:
                binding, potency, stability. Even before any
                in vivo work has started, the model learns something useful.
                It may find that a region of the design space consistently
                lacks stability, or that certain candidates show a favorable
                potency-stability tradeoff.
              </p>
            </div>

            {/* Candidate prediction across iterations */}
            <figure className="my-12">
              <div className="relative rounded-lg overflow-hidden bg-white border border-[#e8e6e1] shadow-sm p-6">
                <Image
                  src="/images/blog/candidate_prediction.png"
                  alt="Candidate prediction effect across four iterations"
                  width={2520}
                  height={871}
                  className="w-full block"
                />
                {/* Legend overlay (absolute-positioned SVG foreground) */}
                <svg
                  viewBox="0 0 130 60"
                  className="absolute bottom-4 left-10 md:left-14 w-24 md:w-28 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="dotShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
                      <feOffset dx="0.3" dy="0.5" result="offset" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.4" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Legend box */}
                  <rect
                    x="2"
                    y="2"
                    width="100"
                    height="52"
                    rx="4"
                    fill="white"
                    fillOpacity="0.85"
                    stroke="#d4d2cd"
                    strokeWidth="0.6"
                  />
                  {/* Dots with subtle shadow */}
                  <g filter="url(#dotShadow)">
                    <circle cx="32" cy="18" r="5" fill="#c4372e" />
                    <circle cx="52" cy="18" r="5" fill="#e89f4f" />
                    <circle cx="72" cy="18" r="5" fill="#316e28" />
                  </g>
                  <text
                    x="52"
                    y="40"
                    textAnchor="middle"
                    fill="#4a5068"
                    fontSize="10"
                    fontFamily="Source Serif 4, Georgia, serif"
                  >
                    Prediction quality
                  </text>
                </svg>
              </div>
              <figcaption className="mt-3 font-mono text-xs text-[#6c7793] leading-relaxed">
                Each column shows the candidates proposed in a given
                iteration, ranked by predicted effect. Strong candidates
                tend to emerge within a few rounds.
              </figcaption>
            </figure>

            <div className="prose-blog">
              <p>
                A subset of candidates then advances into more expensive
                downstream studies, including in vivo work. The campaign does
                not pause. It keeps learning from the faster assay layers
                while delayed data is pending.
              </p>
              <p>
                When in vivo results eventually arrive, they are linked back
                to the same candidates that already have characterization data.
                Now the model can do something much more valuable than marking
                winners and losers: it starts learning which early signals
                actually predict downstream performance and which ones were
                misleading. Future candidate selection shifts accordingly,
                guided less by proxy performance alone and more by the
                patterns that genuinely translate.
              </p>

              {/* ---- Story 3: Media Formulation ---- */}
              <h2 id="media-optimization">
                Media formulation
              </h2>

              <p>
                Media formulation is rarely about one magic ingredient.
                Performance typically emerges from interactions between
                basal media, supplements, growth factors, cytokines, and
                timing decisions. Even with just a handful of variables, the
                number of possible combinations is far too large to screen
                exhaustively, and formulations are often constrained (for
                example, the fractions of a blend must sum to one).
              </p>

              <p>
                A closed-loop campaign starts broad: the first round covers a
                wide range of compositions, each run with replicates. As
                results come in, the system collects whatever evidence is
                available, from cell counts and viability to process traces
                and environmental conditions, and updates its model without
                waiting for every candidate to be fully characterized.
              </p>

              <p>
                The next set of conditions balances candidates likely to
                improve the target outcome against ones that would resolve
                open questions about interactions. For example, whether two
                basal media compensate for each other when blended, or
                whether a cytokine only helps when paired with another.
              </p>
            </div>

            {/* Media formulation response surface */}
            <figure className="my-12">
              <div className="rounded-lg overflow-hidden bg-white border border-[#e8e6e1] shadow-sm p-6">
                <Image
                  src="/images/blog/media-response-surface-pbmc-v4.png"
                  alt="Response surface for human PBMC viability after 72 hours ex vivo as a function of DMEM and RPMI-1640 medium fractions, fit to data from a published closed-loop media optimization campaign"
                  width={1400}
                  height={920}
                  className="w-full"
                />
              </div>
              <figcaption className="mt-3 font-mono text-xs text-[#6c7793] leading-relaxed">
                Viability of human peripheral blood mononuclear cells (PBMCs)
                after 72 hours <em>ex vivo</em>, as a function of DMEM and
                RPMI-1640 fractions in a four-component media blend. At each
                point, the remaining fraction (100% &minus; DMEM &minus;
                RPMI-1640) is split evenly between the other two media,
                X-VIVO 15 and AR5. Surface reconstructed from the published
                closed-loop campaign in Narayanan et&nbsp;al. (2025).
                <sup>
                  <a href="#fn2" className="text-[#6c7793] hover:text-[#090E34] no-underline">[2]</a>
                </sup>
                {" "}The optimal blend reached 75&ndash;80% viability versus
                around 60% for any single commercial medium, and was found
                in 24 experiments across four rounds.
              </figcaption>
            </figure>

            <div className="prose-blog">
              <p>
                Over successive rounds, the campaign builds up a picture of
                the formulation space. You learn that a specific blend of
                commercial media outperforms any single one, that a cytokine
                cocktail preserves the balance of cell subpopulations better
                than standard mixes, or that a growth factor can be halved
                without losing viability. That understanding is what makes a
                protocol transferable and reliable at scale.
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
                summarized across a plate layout. In therapeutic design, it is
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
                      What varies
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
                    <td className="py-3 pr-4">Timing, concentrations, volumes, plate handling</td>
                    <td className="py-3 pr-4">Condition at plate level</td>
                    <td className="py-3">
                      Well readouts, replicates, device logs, environmental data
                    </td>
                  </tr>
                  <tr className="border-b border-[#e8e6e1]">
                    <td className="py-3 pr-4">Therapeutic design</td>
                    <td className="py-3 pr-4">Sequence, structure, modifications</td>
                    <td className="py-3 pr-4">
                      Candidate with multi-stage data
                    </td>
                    <td className="py-3">
                      In vitro screens, stability, delayed in vivo data
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Media formulation</td>
                    <td className="py-3 pr-4">Composition, supplements, feeding schedule</td>
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
                surfaces as better decisions, faster results, and fewer
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
                <p id="fn2">
                  [2] Response surface fit via Gaussian process regression to
                  24 experimental points from the PBMC media-blending study
                  in Narayanan et&nbsp;al.,{" "}
                  <a
                    href="https://www.nature.com/articles/s41467-025-61113-5"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    &ldquo;Accelerating cell culture media development using
                    Bayesian optimization-based iterative experimental
                    design,&rdquo; Nat. Commun. 2025
                  </a>
                  , which reports 3&ndash;30&times; higher sample efficiency
                  than classical Design of Experiments across both PBMC and
                  recombinant-protein campaigns. Source data:{" "}
                  <a
                    href="https://doi.org/10.6084/m9.figshare.27715134"
                    className="underline decoration-dotted underline-offset-2 hover:text-[#090E34]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    figshare 27715134
                  </a>
                  .
                </p>
              </div>
            </footer>
          </div>
        </div>
      </article>
    </div>
  );
}
