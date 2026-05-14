import NetworkMesh from "@/components/Common/NetworkMesh";

const CompoundingSection = () => {
  return (
    <section className="relative bg-[#0a0a0a] text-white overflow-hidden">
      {/* Mesh background — denser, more connections = compounding knowledge */}
      <div className="absolute inset-0 opacity-40">
        <NetworkMesh density={35} color="#057119" secondaryColor="#05A2E6" />
      </div>

      {/* Top fade */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#0a0a0a] to-transparent z-[1]" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent z-[1]" />

      <div className="relative z-10 py-32 lg:py-40">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left: statement */}
            <div>
              <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-blue/70 mb-6">
                Our Platform
              </p>
              <h2 className="text-heading-sm lg:text-heading text-white font-medium mb-6 leading-tight">
                Close the loop between design and discovery
              </h2>
              <p className="text-lg text-white/45 leading-relaxed">
                The platform reads sensor data, auto-debugs workflows, and continuously
                refines experimental parameters. Each cycle adds to a growing knowledge
                graph that accelerates every future experiment.
              </p>
            </div>

            {/* Right: Dashboard placeholder on dark */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl">
              <div
                className="image-placeholder aspect-[4/3] rounded-none"
                style={{
                  background: "linear-gradient(135deg, #141414 0%, #0a0a0a 50%, #141414 100%)",
                  borderColor: "rgba(255,255,255,0.06)",
                  borderStyle: "none",
                }}
              >
                <svg
                  className="placeholder-icon"
                  viewBox="0 0 48 48"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="6" width="44" height="32" rx="3" />
                  <path d="M2 12h44" />
                  <circle cx="7" cy="9" r="1.5" />
                  <circle cx="12" cy="9" r="1.5" />
                  <circle cx="17" cy="9" r="1.5" />
                  <rect x="6" y="16" width="14" height="18" rx="2" />
                  <rect x="24" y="16" width="18" height="8" rx="2" />
                  <rect x="24" y="28" width="18" height="6" rx="2" />
                </svg>
                <span className="placeholder-label" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Platform Dashboard
                </span>
                <span className="placeholder-description" style={{ color: "rgba(255,255,255,0.25)" }}>
                  A polished mockup of the ProviGen dashboard on dark background. Split-screen:
                  left shows a Bayesian optimization response surface (3D, blue-green gradient)
                  with glowing sampled points; right shows recommended next experiment parameters
                  and a live equipment status feed. The UI should feel like a dark-mode scientific
                  command center. Network/mesh connection lines subtly visible behind the charts.
                  Reference: Vercel dashboard aesthetics meets Weights &amp; Biases experiment
                  tracking, rendered in the style of Scale AI&apos;s dark product screenshots.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompoundingSection;
