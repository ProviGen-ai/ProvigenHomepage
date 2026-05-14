const Problem = () => {
  return (
    <section id="problem" className="py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Image */}
          <div className="order-2 lg:order-1">
            <div className="image-placeholder aspect-[4/3] rounded-2xl">
              <svg className="placeholder-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="40" height="40" rx="4" />
                <circle cx="16" cy="16" r="4" />
                <path d="M4 32 L16 22 L24 28 L36 18 L44 24 L44 40 L4 40Z" />
              </svg>
              <span className="placeholder-label">Problem Image</span>
              <span className="placeholder-description">
                A photo showing a scientist or lab technician hunched over a laptop next to a robotic
                liquid handler, looking frustrated or focused. Stacks of printed protocols and sticky
                notes around the workstation. The scene should convey the tedium of manual protocol
                debugging. Natural overhead fluorescent lighting with a slightly clinical feel.
                Think: the &quot;before&quot; scene of lab automation — manual, slow, error-prone.
                Reference: search &quot;scientist debugging lab automation protocol frustrated&quot;
                or similar images from Nature Biotechnology articles about lab automation challenges.
              </span>
            </div>
          </div>

          {/* Right: Text */}
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-green mb-4">
              The Problem
            </p>
            <h2 className="text-heading-sm lg:text-heading text-navy mb-6">
              Labwork is the bottleneck for biotechnology
            </h2>
            <div className="space-y-4 text-muted text-lg leading-relaxed">
              <p>
                Deploying and optimizing protocols on laboratory robots still demands
                months of manual debugging. Scientists spend more time wrestling with
                automation software than doing actual science.
              </p>
              <p>
                Every failed run wastes expensive reagents, delays timelines, and
                burns out talented researchers. The promise of lab automation remains
                largely unfulfilled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;
