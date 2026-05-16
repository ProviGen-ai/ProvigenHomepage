"use client";

const Hero = () => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden bg-near-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      >
        <source src="/videos/network.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-near-black/90 via-near-black/30 to-transparent" />

      <div className="absolute bottom-0 left-0 z-10 pb-20 lg:pb-28 pl-8 lg:pl-12">
        <div className="animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl lg:text-[4rem] xl:text-[4.5rem] text-white font-medium leading-[1.1] tracking-tight">
            The Control Layer
            <br />
            for Life Science
          </h1>
          <p className="text-lg text-white/50 leading-relaxed mt-6">
            The intelligence layer for biological and chemical processes.<br />
            Built for the infrastructure you already have.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { label: "Assay Development", hover: "hover:bg-white/10 hover:text-[#3bbef0] hover:border-[#3bbef0]/40" },
              { label: "DNA Assembly", hover: "hover:bg-white/10 hover:text-[#34d399] hover:border-[#34d399]/40" },
              { label: "Cell Culture", hover: "hover:bg-white/10 hover:text-[#fbbf24] hover:border-[#fbbf24]/40" },
            ].map((app) => (
              <button
                key={app.label}
                onClick={() => document.getElementById("applications")?.scrollIntoView({ behavior: "smooth" })}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer bg-white/5 text-white/60 border border-white/20 ${app.hover}`}
              >
                {app.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
