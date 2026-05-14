const applications = [
  {
    title: "Assay Development",
    description:
      "Optimize assay conditions, reagent concentrations, and detection parameters. Reduce development timelines while improving sensitivity and reproducibility.",
    imagePlaceholder:
      "A 96-well plate under a plate reader with fluorescent signal visible. Clean lab setting, overhead angle. Reference: plate reader assay photography from Molecular Devices or BioTek marketing.",
  },
  {
    title: "DNA Assembly",
    description:
      "Automate combinatorial library construction and assembly optimization. Find optimal reaction conditions for Golden Gate, Gibson, or other assembly methods.",
    imagePlaceholder:
      "Close-up of PCR tubes or a thermocycler with glowing DNA gel electrophoresis in the background. Blue/teal lighting. Reference: synthetic biology lab photography from Twist Bioscience or IDT.",
  },
  {
    title: "Cell Culture",
    description:
      "Optimize media compositions, feeding schedules, and culture conditions. Systematically explore parameter spaces that manual experiments cannot cover.",
    imagePlaceholder:
      "A cell culture flask or bioreactor vessel with visible cell growth media, warm amber lighting. Clean, modern lab. Reference: cell culture photography from Corning or Thermo Fisher marketing.",
  },
];

const Applications = ({ dark = false }: { dark?: boolean }) => {
  return (
    <section
      id="applications"
      className={`py-32 lg:py-40 ${dark ? "bg-charcoal text-white" : ""}`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
            Is it relevant to your process?
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto leading-relaxed ${
              dark ? "text-white/50" : "text-muted"
            }`}
          >
            Our platform works with any liquid-handling robot and adapts to
            your specific experimental workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {applications.map((app) => (
            <div
              key={app.title}
              className={`rounded-2xl p-8 lg:p-10 transition-all duration-300 ${
                dark
                  ? "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]"
                  : "bg-white shadow-card hover:shadow-card-hover hover:-translate-y-1"
              }`}
            >
              {/* Image placeholder */}
              <div
                className="image-placeholder aspect-[3/2] rounded-xl mb-6"
                style={
                  dark
                    ? {
                        background: "linear-gradient(135deg, #222 0%, #1a1a1a 100%)",
                        borderColor: "rgba(255,255,255,0.06)",
                      }
                    : {}
                }
              >
                <svg
                  className="placeholder-icon w-8 h-8"
                  viewBox="0 0 48 48"
                  fill="none"
                  stroke={dark ? "rgba(255,255,255,0.2)" : "currentColor"}
                  strokeWidth="1.5"
                >
                  <rect x="4" y="4" width="40" height="40" rx="4" />
                  <circle cx="16" cy="16" r="4" />
                  <path d="M4 32 L16 22 L24 28 L36 18 L44 24 L44 40 L4 40Z" />
                </svg>
                <span
                  className="placeholder-label"
                  style={dark ? { color: "rgba(255,255,255,0.3)" } : {}}
                >
                  {app.title}
                </span>
                <span
                  className="placeholder-description text-xs"
                  style={dark ? { color: "rgba(255,255,255,0.2)" } : {}}
                >
                  {app.imagePlaceholder}
                </span>
              </div>

              <h3
                className={`text-xl font-semibold mb-3 ${
                  dark ? "text-white" : "text-navy"
                }`}
              >
                {app.title}
              </h3>
              <p
                className={`leading-relaxed text-sm ${
                  dark ? "text-white/50" : "text-muted"
                }`}
              >
                {app.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Applications;
