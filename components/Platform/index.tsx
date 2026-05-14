const Platform = () => {
  return (
    <section id="platform" className="py-32 lg:py-40 bg-navy text-white relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light/20 to-navy opacity-80" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-blue mb-4">
            Our Platform
          </p>
          <h2 className="text-heading-sm lg:text-heading text-white mb-6 max-w-3xl mx-auto">
            Close the loop between design and discovery
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Our AI connects directly to your lab equipment, reads sensor data in real-time,
            and runs continuous cycles of intelligent experimentation.
          </p>
        </div>

        {/* Platform screenshot placeholder */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="image-placeholder aspect-[16/9]" style={{ background: 'linear-gradient(135deg, #1a2a3a 0%, #0f1f2f 50%, #1a2a3a 100%)', borderColor: 'rgba(255,255,255,0.15)' }}>
              <svg className="placeholder-icon" viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                <rect x="2" y="6" width="44" height="32" rx="3" />
                <path d="M2 12h44" />
                <circle cx="7" cy="9" r="1.5" />
                <circle cx="12" cy="9" r="1.5" />
                <circle cx="17" cy="9" r="1.5" />
                <rect x="6" y="16" width="14" height="18" rx="2" />
                <rect x="24" y="16" width="18" height="8" rx="2" />
                <rect x="24" y="28" width="18" height="6" rx="2" />
              </svg>
              <span className="placeholder-label" style={{ color: 'rgba(255,255,255,0.5)' }}>Platform Dashboard</span>
              <span className="placeholder-description" style={{ color: 'rgba(255,255,255,0.4)' }}>
                A polished mockup/screenshot of the ProviGen platform dashboard on a dark background.
                Show a split-screen UI: on the left, a Bayesian optimization surface plot (3D response
                surface in blue-green gradient) showing experimental results; on the right, a panel
                with the next recommended experiment parameters and a live equipment status feed.
                Clean, modern SaaS dashboard aesthetic with dark theme. Think: Vercel dashboard meets
                scientific data visualization. Reference: look at Benchling, Dotmatics, or Ginkgo&apos;s
                Catalyst platform UI screenshots for the general feel, combined with optimization
                plots like those from Ax (Facebook&apos;s Bayesian optimization platform).
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          {[
            { value: "10x", label: "faster protocol optimization" },
            { value: "80%", label: "less manual intervention" },
            { value: "3x", label: "higher experimental throughput" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-white/50 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Platform;
