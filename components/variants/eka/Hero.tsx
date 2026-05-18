"use client";
import { useState, useEffect } from "react";

const Hero = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const images = ["/images/hero/paper_bg.png", "/images/hero/wireframe_pencil.png"];
    let count = 0;
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        count++;
        if (count === images.length) setLoaded(true);
      };
    });
  }, []);

  return (
    <>
    {!loaded && <div className="fixed inset-0 z-[99999] bg-near-black" />}
    <section id="home" className="relative h-screen w-full overflow-hidden bg-near-black">
      <div className={`absolute inset-0 transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}>
        {/* Paper background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/images/hero/paper_bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Pencil wireframe — inverted */}
        <div
          className="absolute left-0 right-[-40%] top-[35%] -translate-y-1/2 w-[160%] sm:left-auto sm:right-[5%] sm:top-1/2 sm:w-[65%] lg:w-[55%] opacity-70 sm:opacity-90 pointer-events-none"
        >
          <img
            src="/images/hero/wireframe_pencil.png"
            alt=""
            className="w-full h-auto invert"
          />
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 z-10 pb-20 lg:pb-28 px-6 sm:px-8 lg:pl-12 transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}>
        <div className="animate-fade-in-up max-w-[90%] sm:max-w-[80%] lg:max-w-none">
          <h1 className="text-4xl sm:text-5xl lg:text-[4rem] xl:text-[4.5rem] text-white font-medium leading-[1.1] tracking-tight">
            The Control Layer
            <br />
            for <em className="italic font-normal">Life Science</em>
          </h1>
          <p className="text-lg text-white/50 leading-relaxed mt-6">
            The intelligence layer for biological and chemical processes.<br />
            Built for the infrastructure you already have.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { label: "Assay Development", mobileLabel: "Assays", hover: "hover:bg-white/10 hover:text-[#3bbef0] hover:border-[#3bbef0]/40" },
              { label: "Biomanufacturing", mobileLabel: "Biomanufacturing", hover: "hover:bg-white/10 hover:text-[#34d399] hover:border-[#34d399]/40" },
              { label: "Cell Culture", mobileLabel: "Cells", hover: "hover:bg-white/10 hover:text-[#fbbf24] hover:border-[#fbbf24]/40" },
            ].map((app) => (
              <button
                key={app.label}
                onClick={() => document.getElementById("applications")?.scrollIntoView({ behavior: "smooth" })}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer bg-white/5 text-white/60 border border-white/20 ${app.hover}`}
              >
                <span className="sm:hidden">{app.mobileLabel}</span>
                <span className="hidden sm:inline">{app.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default Hero;
