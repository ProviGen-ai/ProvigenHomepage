"use client";

const Hero = () => {
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeatures = () => {
    document.getElementById("problem")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-warm-white to-soft-gray" />

      {/* Faint grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(11,31,48,1) 1px, transparent 1px), linear-gradient(90deg, rgba(11,31,48,1) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left: Text content */}
          <div className="animate-fade-in-up pt-24 lg:pt-0">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-blue mb-6">
              Intelligent Lab Automation
            </p>
            <h1 className="text-display-sm lg:text-display text-navy mb-8">
              The control layer for{" "}
              <span className="italic font-light">life science</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted leading-relaxed max-w-lg mb-10">
              We turn robotic biolabs into closed-loop systems. Our AI designs,
              runs, and learns from experiments autonomously — cutting optimization
              timelines from months to weeks.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={scrollToContact}
                className="rounded-full bg-navy text-white px-8 py-4 text-base font-medium hover:bg-navy-light transition-all duration-300 hover:shadow-lg"
              >
                Get in Touch
              </button>
              <button
                onClick={scrollToFeatures}
                className="rounded-full border border-navy/20 text-navy px-8 py-4 text-base font-medium hover:border-navy/40 hover:bg-navy/[0.03] transition-all duration-300"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right: Hero image placeholder */}
          <div className="animate-fade-in hidden lg:block">
            <div className="image-placeholder aspect-[4/3] rounded-2xl">
              <svg className="placeholder-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="4" y="4" width="40" height="40" rx="4" />
                <circle cx="16" cy="16" r="4" />
                <path d="M4 32 L16 22 L24 28 L36 18 L44 24 L44 40 L4 40Z" />
              </svg>
              <span className="placeholder-label">Hero Image</span>
              <span className="placeholder-description">
                A wide-angle photo of an automated liquid-handling robot (like an Opentrons or Hamilton STAR)
                in a modern, clean biolab. The robot arm is mid-motion, pipetting into a 96-well plate.
                Soft, clinical lighting with a slight blue-teal tint. Shallow depth of field with blurred
                lab equipment in the background. The aesthetic should feel futuristic but real — similar to
                Ginkgo Bioworks&apos; lab photography or images from Strateos/Emerald Cloud Lab.
                Reference: search &quot;automated liquid handling robot biolab photography&quot; on Google Images.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
        <button onClick={scrollToFeatures} className="text-navy/30 hover:text-navy/50 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default Hero;
