"use client";

import { useEffect, useState, useRef } from "react";
import { postsBySlug } from "../posts";

const post = postsBySlug["manifesto"];

const sections = [
  { id: "intelligence-upgrade", label: "The intelligence upgrade" },
  { id: "existing-labs", label: "Existing laboratories" },
  { id: "integration", label: "Integration cost" },
  { id: "network", label: "The network" },
  { id: "transfer", label: "Transfer" },
  { id: "compound", label: "Why this compounds" },
  { id: "why-now", label: "Why now" },
  { id: "prove", label: "What we will prove" },
  { id: "the-bet", label: "The bet" },
];

export default function Manifesto() {
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
      <a
        href="/blog"
        className="absolute top-5 left-6 lg:left-8 inline-flex items-center gap-2 text-sm text-[#6c7793] hover:text-[#090E34] transition-colors"
      >
        <span>&larr;</span> Back to Blog
      </a>
      <article className="pb-24 pt-[200px]">
        {/* Header - full width centered */}
        <div className="max-w-3xl mx-auto px-4 md:px-12 mb-16">
          <header>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b90a0] mb-6">
              Manifesto
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight font-normal text-[#090E34] mb-10">
              Biotech is entering a new era
            </h1>
            <div className="grid md:grid-cols-[120px_1fr] gap-x-6 gap-y-1 font-mono text-sm text-[#090E34]">
              <span className="text-[#6c7793]">Published</span>
              <span>{post.date}</span>
              <span className="text-[#6c7793]">Authors</span>
              <span>{post.author}</span>
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
          <div className="prose-blog">
            {/* ---- Biotech is entering a new era (title section, heading is the h1) ---- */}
            <p className="lead">
              Lab-in-the-loop is becoming the new operating model for
              biotechnology.
            </p>

            <p>
              AI is moving beyond reading papers, analyzing datasets, and
              designing molecules. It is beginning to interact directly with
              experiments:
            </p>

            <p className="callout">
              decide what to test &rarr; run the experiment &rarr; observe the
              result &rarr; learn &rarr; choose what to do next
            </p>

            <p>This transition is happening now.</p>

            <p>
              Eli Lilly and NVIDIA are investing up to $1B into an AI
              co-innovation lab built around continuous learning between agentic
              wet labs and computation. Genentech describes{" "}
              <strong>lab-in-the-loop</strong> as the foundation of its R&amp;D
              strategy. GSK already operates an end-to-end automated
              lab-in-the-loop platform for large-molecule discovery. Lila
              Sciences is building entire <strong>AI Science Factories</strong>{" "}
              around models that reason, experiment, and learn.
            </p>

            <p>
              A new generation of infrastructure companies is emerging around
              the same shift. <strong>C5R</strong> is building research
              facilities where frontier models can execute experiments and learn
              from reality. <strong>Substrate Bio</strong> is building a network
              of autonomous wet labs for biological training data.{" "}
              <strong>Worldset</strong> plans modular autonomous biology labs
              designed to generate complete experimental trajectories for
              frontier models.
            </p>

            <p>And the first results are already here.</p>

            <p>
              OpenAI connected GPT-5 to Ginkgo Bioworks&apos; automated
              laboratory. Across six experimental rounds and more than 36,000
              reactions, the system established a new low-cost benchmark for
              cell-free protein synthesis and reduced protein-production cost by{" "}
              <strong>40%</strong>.
            </p>

            <p>
              Anthropic has now built its own biology laboratory. Claude
              searched more than 200,000 reverse transcriptases and identified a
              previously uncharacterized enzyme system associated with
              CRISPR-like DNA repeats, which Anthropic then investigated
              experimentally.
            </p>

            <p className="pullquote">
              The feedback loop between AI and biology is closing.
            </p>

            <hr />

            {/* ---- Laboratory automation is waiting ---- */}
            <h2 id="intelligence-upgrade" className="scroll-mt-16">
              Laboratory automation is waiting for its intelligence upgrade
            </h2>

            <p>
              Laboratory automation today is similar to humanoid robotics:{" "}
              <strong>
                the physical infrastructure exists, but without sufficiently
                capable intelligence it remains limited to narrow,
                pre-programmed tasks.
              </strong>
            </p>

            <p>
              Liquid handlers, robotic workcells, plate readers, bioreactors,
              and automated analytical systems already exist across thousands of
              laboratories.
            </p>

            <p>
              Most still execute workflows humans designed and programmed in
              advance.
            </p>

            <p>
              The opportunity is to turn that automation from infrastructure
              that <strong>executes experiments</strong> into infrastructure
              that <strong>learns which experiments to run.</strong>
            </p>

            <p className="pullquote">
              ProviGenAI provides that intelligence upgrade.
            </p>

            <p>
              We connect scientific AI to existing laboratory automation so that
              every result can change what happens next.
            </p>

            <hr />

            {/* ---- We make existing laboratories adaptive ---- */}
            <h2 id="existing-labs" className="scroll-mt-16">
              We make existing laboratories adaptive
            </h2>

            <p>
              Rather than building inhouse laboratory infrastructure from
              scratch,{" "}
              <strong>
                we upgrade the infrastructure that already exists.
              </strong>
            </p>

            <p>
              Biofoundries, CROs, CDMOs, biopharma companies, and automation
              providers have already invested billions into physical
              experimental capacity.
            </p>

            <p>
              That infrastructure is fragmented, frequently underutilized, and
              rarely learns across experimental cycles.
            </p>

            <p>
              ProviGenAI turns this existing infrastructure into a distributed
              network for closed-loop experimentation.
            </p>

            <p>
              This means smaller laboratories can gain access to predictive
              capabilities that would otherwise require building massive
              AI-native infrastructure themselves.
            </p>

            <p className="pullquote">
              The hardware is already there. We make it adaptive.
            </p>

            <hr />

            {/* ---- Integration is becoming cheaper ---- */}
            <h2 id="integration" className="scroll-mt-16">
              Integration is becoming cheaper
            </h2>

            <p>
              Laboratory heterogeneity historically made this type of software
              difficult to deploy.
            </p>

            <p>That constraint is weakening.</p>

            <p>
              <strong>
                Modern laboratory automation increasingly exposes APIs or
                machine-readable interfaces.
              </strong>
            </p>

            <p>
              Schedulers and orchestration platforms abstract much of the
              underlying hardware complexity, allowing ProviGenAI to integrate
              at the workflow layer rather than writing direct drivers for every
              instrument.
            </p>

            <p>
              At the same time,{" "}
              <strong>
                AI coding agents materially reduce the engineering cost of
                connecting heterogeneous software systems
              </strong>
              , generating adapters, translating schemas, testing integrations,
              and maintaining site-specific interfaces.
            </p>

            <p>
              Because of that, a deployment can remain partially customized and
              still support attractive unit economics.
            </p>

            <hr />

            {/* ---- The network is the upside ---- */}
            <h2 id="network" className="scroll-mt-16">
              The network is the upside
            </h2>

            <p>
              The larger opportunity begins once ProviGenAI operates across
              multiple experimental environments.
            </p>

            <p>
              If experience from previous campaigns helps the system solve the
              next related problem with fewer experiments, every deployment can
              improve future deployments.
            </p>

            <p>The critical comparison is:</p>

            <p className="callout">
              ProviGenAI starting cold
              <br />
              <span className="text-[#6c7793] font-normal">vs.</span>
              <br />
              ProviGenAI starting warm with relevant prior experimental
              experience
            </p>

            <p>
              If the second requires materially fewer experiments, ProviGenAI
              begins to accumulate critical process data that cannot be easily
              recreated.
            </p>

            <p>
              That data includes not only successful outcomes, but failed
              interventions, parameter sensitivities, uncertainty, and process
              behavior that is often unpublished or never systematically
              captured.
            </p>

            <hr />

            {/* ---- Transfer only needs to work partially ---- */}
            <h2 id="transfer" className="scroll-mt-16">
              Transfer only needs to work partially
            </h2>

            <p>
              We do not assume that knowledge transfers arbitrarily across
              biology.
            </p>

            <p>
              We expect the strongest transfer within recurring experimental
              families such as:
            </p>

            <ul>
              <li>plate-based liquid-handling workflows</li>
              <li>bacterial bioreactor processes</li>
              <li>mammalian bioreactor processes</li>
            </ul>

            <p>
              The relevant question is therefore whether experience from related
              campaigns allows the next similar campaign to reach its target
              with fewer experimental cycles.
            </p>

            <p>That is the network effect we intend to prove.</p>

            <hr />

            {/* ---- Why this can compound ---- */}
            <h2 id="compound" className="scroll-mt-16">
              Why this can compound
            </h2>

            <p>
              Scientific AI models will continue to improve. That makes access
              to experiments more valuable.
            </p>

            <p>
              A frontier model can absorb the world&apos;s published scientific
              knowledge.
            </p>

            <p>
              But much of the information required to make better experimental
              decisions is generated only through interaction with the physical
              world.
            </p>

            <p>Over time, ProviGenAI can accumulate:</p>

            <ul>
              <li>process dynamics</li>
              <li>failure patterns</li>
              <li>uncertainty models</li>
              <li>intervention strategies</li>
            </ul>

            <p>
              If this experience transfers within valuable workflow families,
              node 20 should start from a better position than node 1.
            </p>

            <p>
              Reproducing that advantage requires comparable experimental
              access, accumulated interventions, time, and physical-world
              feedback. Essentially doing exactly what we are already doing.
            </p>

            <p>
              In addition, biology as an application domain makes our moat
              inherently more defensible given that biological processes
              can&apos;t be sped up arbitrarily.
            </p>

            <h3>There is a structural advantage to the distributed model</h3>

            <p>
              An infrastructure network spanning different instruments,
              biological systems, protocols, and operating environments produces
              much more diverse experimental data than a single institution
              could.
            </p>

            <p>
              <strong>
                By doing that, we are giving smaller labs access to the same
                closed-loop AI capabilities that would otherwise require massive
                proprietary infrastructure.
              </strong>
            </p>

            <p>
              This levels the playing field between organizations that can
              afford large-scale in-house laboratories and those that cannot
              build their own AI-native experimental infrastructure.
            </p>

            <p className="pullquote">
              We are convinced that a distributed laboratory network can produce
              more generalizable and robust scientific intelligence than models
              trained purely on in-house experimental data.
            </p>

            <hr />

            {/* ---- Why now ---- */}
            <h2 id="why-now" className="scroll-mt-16">
              Why now
            </h2>

            <p>Several technological shifts make this possible now.</p>

            <h3>
              Scientific decision-making algorithms are already useful in
              closed-loop systems
            </h3>

            <p>
              Bayesian optimization, active learning, multimodal models, and
              increasingly capable scientific agents can now select experiments
              and update decisions as results arrive.
            </p>

            <h3>Laboratories are becoming software-addressable</h3>

            <p>
              Modern automation systems increasingly expose APIs, schedulers,
              structured data streams, and machine-readable interfaces that make
              programmatic experimentation possible.
            </p>

            <h3>AI coding agents reduce the cost of integration</h3>

            <p>
              Connecting heterogeneous laboratory software has historically
              required substantial engineering work. Coding agents increasingly
              compress the time required to build and maintain those interfaces.
            </p>

            <h3>Scientific AI is approaching an experimental data bottleneck</h3>

            <p>
              As models improve on publicly available scientific knowledge,
              differentiated performance increasingly depends on access to
              proprietary experimental feedback and interaction with real
              biological systems.
            </p>

            <hr />

            {/* ---- We will prove three things ---- */}
            <h2 id="prove" className="scroll-mt-16">
              We will prove three things
            </h2>

            <h3>1. Product value</h3>

            <p>
              We will show that closed-loop optimization reaches the same or
              better target with materially fewer experimental cycles, less
              time, or better outcomes than the existing approach.
            </p>

            <p>
              We have already shown approximately 5&times; sample efficiency in
              a preliminary pilot.
            </p>

            <p>
              The next step is to reproduce that advantage in commercial
              workflows.
            </p>

            <h3>2. Repeatability</h3>

            <p>
              We will show that ProviGenAI can integrate and create similar
              value across additional sites and workflows without deployment
              costs overwhelming site economics.
            </p>

            <p>
              The current target is approximately{" "}
              <strong>1 to 2 weeks of integration per site</strong>, with
              increasing reuse of scheduler integrations, data interfaces,
              workflow representations, and optimization components.
            </p>

            <h3>3. Transfer</h3>

            <p>
              We will show how relevant process data from previous campaigns
              allows a new campaign to reach its target faster than the same
              system starting cold.
            </p>

            <p>The progression is:</p>

            <p className="callout">
              better experiments &rarr; repeatable deployments &rarr;
              transferable experience &rarr; compounding intelligence
            </p>

            <hr />

            {/* ---- The bet ---- */}
            <h2 id="the-bet" className="scroll-mt-16">
              The bet
            </h2>

            <p>
              Biotech already has increasingly capable AI models and automated
              laboratories.
            </p>

            <p>
              <strong>
                What is missing is the system that connects the two into a
                learning loop.
              </strong>
            </p>

            <p>
              ProviGenAI makes individual laboratories adaptive today and turns
              them into nodes of a distributed learning network over time.
            </p>

            <p>
              That network gives existing laboratories access to the
              autonomous-science revolution without requiring each of them to
              build an AI Science Factory of their own.
            </p>

            <p>
              And every experiment can make the network better at choosing the
              next one.
            </p>

            <p className="pullquote">
              The laboratory automation infrastructure already exists. It is
              waiting for its intelligence upgrade.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
