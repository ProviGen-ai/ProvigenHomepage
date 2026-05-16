"use client";
import Image from "next/image";

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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 relative items-center">
          <div className="animate-fade-in-up pt-24 lg:pt-0">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-blue mb-6">
              Intelligent Lab Automation
            </p>
            <h1 className="text-display-sm lg:text-display text-navy mb-8">
              The control layer for{" "}
              <span className="italic font-light">life science</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted leading-relaxed mb-8">
              The intelligence layer for biological and chemical processes.<br />
              Built for the infrastructure you already have.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { label: "Assay Development", hover: "hover:bg-logo-blue/8 hover:text-logo-blue hover:border-logo-blue/25" },
                { label: "DNA Assembly", hover: "hover:bg-logo-green/8 hover:text-logo-green hover:border-logo-green/25" },
                { label: "Cell Culture", hover: "hover:bg-[#d97706]/8 hover:text-[#d97706] hover:border-[#d97706]/25" },
              ].map((app) => (
                <button
                  key={app.label}
                  onClick={() => document.getElementById("applications")?.scrollIntoView({ behavior: "smooth" })}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer bg-transparent text-navy/60 border border-navy/12 ${app.hover}`}
                >
                  {app.label}
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

          <div className="animate-fade-in hidden lg:block absolute -right-[10%] top-[40%] -translate-y-1/2 w-[60%] pointer-events-none">
            <Image
              src="/images/hero/wireframe_v5.png"
              alt="Biotech intelligence visualization"
              width={800}
              height={600}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
