const applications = [
  {
    title: "Assay Development",
    description:
      "Find the right conditions faster. Optimize reagents, protocols, and parameters in fewer iterations.",
    detail:
      "Define your target readout and constraints.\n\nActive Learning designs the next set of experiments, learns from results, and iterates until your assay performs.\n\nWorks with plate readers, liquid handlers, and imaging systems. Typical campaigns converge in 5x fewer iterations than Design of Experiments (DoE).",
    image: "/images/applications/assay_development.webp",
    imageStyle: { transform: "scale(1.8) translateX(12%) rotate(5deg)" },
    link: "/blog/closed-loop-optimization#assay-optimization",
  },
  // {
  //   title: "DNA Assembly",
  //   description:
  //     "Predict the entire assembly process and execute it on liquid handling hardware.\nFrom protocol to plate, fully automated.",
  //   detail:
  //     "Upload your target constructs.\n\nThe platform plans the assembly strategy, generates worklists for your liquid handler, and tracks every step from part selection to sequence verification.\n\nSupports Golden Gate, Gibson, and restriction-ligation workflows. Reduces hands-on time from days to hours.",
  //   imagePlaceholder:
  //     "Close-up of PCR tubes or a thermocycler with glowing DNA gel electrophoresis in the background. Blue/teal lighting. Reference: synthetic biology lab photography from Twist Bioscience or IDT.",
  // },
  {
    title: "Biomanufacturing",
    description:
      "Fewer failed batches, less experimental runs to find optimal conditions.",
    detail:
      "Track critical process parameters across batches and scale from bench to production.\n\nPredict deviations before they impact yield. Connects to continuous sensor readouts, downstream measurements like mass spec, and adapts the process automatically.\n\nCompatible with standard bioreactors and industrial control infrastructure.",
    // future: "Integrates with process analytical technology (PAT), LIMS, and MES systems.",
    image: "/images/applications/bioreactor.webp",
    imageStyle: { objectPosition: "20% 69%", transform: "scale(1.3) translateX(10%)" },
  },
  {
    title: "Cell Culture",
    description:
      "Protocol development for stem cell differentiation and adaptive culture processes.",
    detail:
      "Set your growth and reproducibility targets.\n\nHandle multi-objective trade-offs between growth, viability, and yield. Identify root causes of unexpected outcomes through causal attribution analysis.\n\nIntegrates with plate-based or suspension culture systems.",
    image: "/images/applications/cell_painting.webp",
    link: "/blog/closed-loop-optimization#media-optimization",
  },
];

const Applications = ({ dark = false }: { dark?: boolean }) => {
  const fadeStart = 50;

  return (
    <section
      id="applications"
      className={`py-32 lg:py-40 relative overflow-hidden ${dark ? "bg-charcoal text-white" : ""}`}
    >
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: "url('/images/applications/biofoundry_sketch.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: `linear-gradient(90deg, black 0%, transparent ${fadeStart}%, transparent ${100 - fadeStart}%, black 100%)`,
          WebkitMaskImage: `linear-gradient(90deg, black 0%, transparent ${fadeStart}%, transparent ${100 - fadeStart}%, black 100%)`,
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-20">
          <p
            className={`text-sm font-semibold tracking-[0.2em] uppercase mb-4 ${
              dark ? "text-warm-tan" : "text-logo-green"
            }`}
          >
            Applications
          </p>
          <h2
            className={`text-heading-sm lg:text-heading font-medium mb-4 max-w-3xl mx-auto ${
              dark ? "text-white" : "text-navy"
            }`}
          >
            One platform, many workflows
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto leading-relaxed ${
              dark ? "text-white/50" : "text-muted"
            }`}
          >
            Our platform works with standard laboratory automation hardware
            and adapts to your specific experimental workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {applications.map((app) => {
            const Wrapper = app.link ? "a" : "div";
            const wrapperProps = app.link ? { href: app.link } : {};
            return (
            <Wrapper
              key={app.title}
              {...wrapperProps}
              className={`rounded-2xl p-8 lg:p-10 transition-all duration-300 block relative overflow-hidden group ${
                dark
                  ? "bg-charcoal/95 border border-warm-tan/10"
                  : "bg-white shadow-card hover:shadow-card-hover hover:-translate-y-1"
              } ${app.link ? "cursor-pointer" : ""}`}
            >
              {/* Card background image (dark mode) — uncomment to enable */}
              {/* {dark && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-[0.80]"
                  style={{
                    backgroundImage: "url('/images/hero/paper_bg.webp')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )} */}
              <div className="aspect-[3/2] rounded-xl mb-6 overflow-hidden">
                <img
                  src={app.image}
                  alt={app.title}
                  className="w-full h-full object-cover"
                  style={app.imageStyle || {}}
                />
              </div>

              <h3
                className={`text-xl font-semibold mb-3 ${
                  dark ? "text-white" : "text-navy"
                }`}
              >
                {app.title}
              </h3>
              <p
                className={`leading-relaxed text-sm whitespace-pre-line ${
                  dark ? "text-white/50" : "text-muted"
                }`}
              >
                {app.description}
              </p>

              {/* Hover overlay */}
              <div className={`absolute inset-0 rounded-2xl flex flex-col justify-start pt-6 px-6 md:pt-12 md:px-8 lg:pt-14 lg:px-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-y-auto md:overflow-hidden ${
                dark
                  ? "bg-[#1a1a1a]"
                  : "bg-white"
              }`}>
                <h3
                  className={`text-base md:text-xl font-semibold mb-2 md:mb-3 ${
                    dark ? "text-white" : "text-navy"
                  }`}
                >
                  {app.title}
                </h3>
                <p
                  className={`leading-relaxed text-xs md:text-sm mb-3 md:mb-4 whitespace-pre-line ${
                    dark ? "text-white/60" : "text-muted"
                  }`}
                >
                  {app.detail}
                </p>
                {app.link && (
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    dark ? "text-warm-tan" : "text-logo-green"
                  }`}>
                    Read more &rarr;
                  </span>
                )}
              </div>
            </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Applications;
