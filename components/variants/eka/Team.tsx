const Team = () => {
  return (
    <section id="team" className="py-32 lg:py-48 bg-off-white">
      <div className="mx-auto max-w-3xl px-8 text-center">
        <span className="font-mono text-label uppercase text-warm-tan tracking-[0.3em] mb-8 block">
          Team
        </span>
        <h2 className="text-heading-sm lg:text-heading text-charcoal font-medium mb-10">
          Built by the team that bridges
          <br />
          AI and life science
        </h2>
        <p className="font-mono text-sm lg:text-base text-mid-gray leading-relaxed max-w-2xl mx-auto mb-12">
          Experts in Bayesian optimization, lab automation, and bioprocess
          engineering. From TU Munich, with deep roots in computational
          biology and robotic systems. Now building the control layer
          for the next generation of biolabs.
        </p>
        <a
          href="/#contact"
          className="inline-flex items-center gap-2 rounded-full bg-charcoal text-white px-10 py-4 text-sm font-medium hover:bg-near-black transition-all duration-300"
        >
          JOIN US <span>&rarr;</span>
        </a>
      </div>
    </section>
  );
};

export default Team;
