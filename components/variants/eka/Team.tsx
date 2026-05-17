const Team = () => {
  return (
    <section id="team" className="py-32 lg:py-48 bg-off-white">
      <div className="mx-auto max-w-3xl px-8 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] uppercase text-warm-tan mb-4">
          Team
        </p>
        <h2 className="text-heading-sm lg:text-heading text-charcoal font-medium mb-10">
          Built by the team that bridges
          <br />
          AI, Robotics and Life Science
        </h2>
        <p className="font-mono text-sm lg:text-base text-mid-gray leading-relaxed max-w-2xl mx-auto mb-12">
          Experts in Bayesian optimization, lab automation, and
          bioengineering. From TU Munich, with deep roots in computational
          biology and robotic systems. Now building the control layer
          for the next generation of life science infrastructure.
        </p>
        <button
          onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
          className="inline-flex items-center gap-2 rounded-full bg-charcoal text-white px-10 py-4 text-sm font-medium hover:bg-near-black transition-all duration-300 cursor-pointer"
        >
          JOIN US <span>&rarr;</span>
        </button>
      </div>
    </section>
  );
};

export default Team;
