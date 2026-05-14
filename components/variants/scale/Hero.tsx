"use client";

const Hero = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToKPIs = () => {
    document.getElementById("kpis")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-warm-white to-soft-gray" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,48,1) 1px, transparent 1px), linear-gradient(90deg, rgba(11,31,48,1) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="animate-fade-in-up pt-24 lg:pt-0">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-blue mb-6">
              Intelligent Lab Automation
            </p>
            <h1 className="text-display-sm lg:text-display text-navy mb-8">
              The control layer for{" "}
              <span className="italic font-light">life science</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted leading-relaxed max-w-lg mb-8">
              We turn robotic biolabs into closed-loop systems that design,
              run, and learn from experiments autonomously.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {["Assay Development", "DNA Assembly", "Cell Culture"].map((app) => (
                <button
                  key={app}
                  onClick={() => document.getElementById("applications")?.scrollIntoView({ behavior: "smooth" })}
                  className="px-4 py-1.5 rounded-full border border-navy/15 text-sm text-navy/70 bg-white/50 hover:border-navy/30 hover:bg-white/80 transition-all cursor-pointer"
                >
                  {app}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={scrollToContact}
                className="rounded-full bg-navy text-white px-8 py-4 text-base font-medium hover:bg-navy-light transition-all duration-300 hover:shadow-lg"
              >
                Get in Touch
              </button>
              <button
                onClick={scrollToKPIs}
                className="rounded-full border border-navy/20 text-navy px-8 py-4 text-base font-medium hover:border-navy/40 hover:bg-navy/[0.03] transition-all duration-300"
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="animate-fade-in hidden lg:block">
            <div className="image-placeholder aspect-[4/3] rounded-2xl">
              <svg className="placeholder-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="40" height="40" rx="4" />
                <circle cx="16" cy="16" r="4" />
                <path d="M4 32 L16 22 L24 28 L36 18 L44 24 L44 40 L4 40Z" />
              </svg>
              <span className="placeholder-label">Hero Image</span>
              <span className="placeholder-description">
                A wide-angle photo of an automated liquid-handling robot in a modern biolab.
                Robot arm mid-motion, pipetting into a 96-well plate. Soft clinical lighting,
                shallow depth of field. Reference: Opentrons/Hamilton STAR lab photography.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
