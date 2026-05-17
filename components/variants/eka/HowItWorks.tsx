const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-[#0a0a0a] relative overflow-visible">
      {/* <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, transparent 50%, black 90%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, transparent 50%, black 90%)",
        }}
      /> */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 overflow-hidden">
        {/* Section header */}
        <div className="text-center mb-16">
          {/* alt: Impact */}
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-warm-tan mb-4">
            The Difference
          </p>
          <h2 className="text-heading-sm lg:text-heading text-white font-medium max-w-3xl mx-auto mb-4">
            Speed up process development
          </h2>
          <p className="text-lg max-w-2xl mx-auto leading-relaxed text-white/50">
            Process development in a fraction of the time.
            Your team focuses on decisions, not debugging.
          </p>
        </div>

        <div className="text-sm uppercase tracking-[0.15em] text-center mb-8 text-white/30">
          up to
        </div>

        {/* Stats grid with shorter vertical separators */}
        <div className="grid md:grid-cols-3 gap-12 mx-auto">
          {[
            { value: "10x", label: "Faster protocol optimization" },
            { value: "80%", label: "Less manual intervention", nudge: true },
            { value: "3x", label: "Higher throughput" },
          ].map((stat, i) => (
            <div key={i} className="text-center relative">
              {i > 0 && (
                <div className="hidden md:block absolute -left-6 top-[20%] bottom-[20%] w-px bg-white/10" />
              )}
              <div className={`text-5xl lg:text-6xl font-light text-white mb-3 tracking-tight ${stat.nudge ? "ml-[0.35em]" : ""}`}>
                {stat.value}
              </div>
              <div className="text-xs uppercase tracking-[0.15em] text-white/40">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Semicircle grid extending into next section */}
      {/* Grid with circle cutout — spans from section top through bottom into next section */}
    </section>
  );
};

export default HowItWorks;
