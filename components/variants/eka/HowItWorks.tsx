const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-[#0a0a0a]">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
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

        {/* Platform screenshot placeholder */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="image-placeholder aspect-[16/9] rounded-xl" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <svg className="placeholder-icon" viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
              <rect x="2" y="6" width="44" height="32" rx="3" />
              <path d="M2 12h44" />
              <circle cx="7" cy="9" r="1.5" />
              <circle cx="12" cy="9" r="1.5" />
              <circle cx="17" cy="9" r="1.5" />
              <rect x="6" y="16" width="14" height="18" rx="2" />
              <rect x="24" y="16" width="18" height="8" rx="2" />
              <rect x="24" y="28" width="18" height="6" rx="2" />
            </svg>
            <span className="placeholder-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Platform Dashboard</span>
            <span className="placeholder-description" style={{ color: 'rgba(255,255,255,0.3)' }}>
              A polished screenshot/mockup of the ProviGen platform dashboard. Dark-themed UI
              showing: (left panel) a Bayesian optimization response surface in 3D with blue-green
              gradient, (right panel) next recommended experiment parameters with confidence
              intervals, (bottom) live equipment status timeline. Clean SaaS aesthetic.
              Reference: Benchling, Dotmatics, or Weights &amp; Biases dark-mode dashboards
              combined with scientific optimization plots from Ax/BoTorch.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
