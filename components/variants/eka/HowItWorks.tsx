const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-32 lg:py-40 bg-off-white">
      <div className="mx-auto max-w-7xl px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-24">
          <span className="font-mono text-label uppercase text-warm-tan tracking-[0.3em] mb-6 block">
            Impact
          </span>
          <h2 className="text-heading-sm lg:text-heading text-charcoal font-medium max-w-3xl mx-auto">
            From months of manual debugging to weeks of autonomous optimization
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid md:grid-cols-3 gap-px bg-light-gray max-w-4xl mx-auto">
          {[
            { value: "10x", label: "Faster protocol optimization" },
            { value: "80%", label: "Less manual intervention" },
            { value: "3x", label: "Higher experimental throughput" },
          ].map((stat, i) => (
            <div key={i} className="bg-off-white px-8 py-16 text-center">
              <div className="text-5xl lg:text-6xl font-light text-charcoal mb-4 tracking-tight">
                {stat.value}
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.15em] text-mid-gray">
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
