import DotMatrixText from "@/components/Common/DotMatrixText";

const steps = [
  {
    number: "01",
    title: "Design",
    description:
      "We adapt to your existing processes and make every experiment count, finding the fastest path to your target.",
    color: "text-[#d97706]",
    dottedClass: "text-dotted-orange",
    imagePlaceholder: {
      label: "Design Step",
      description:
        'An abstract visualization of an AI "thinking" about experimental design. A network graph or decision tree overlaid on a subtle molecular structure. Clean, minimal line art on light cream. Nodes represent experiment parameters, edges show relationships. Color accent: ProviGen blue (#05A2E6). Style: technical illustration. Reference: scientific paper network diagrams, polished and modern.',
    },
  },
  {
    number: "02",
    title: "Experiment",
    description:
      "Your protocols run automatically on the hardware you already have. No manual programming, no re-tooling.",
    color: "text-logo-green",
    dottedClass: "text-dotted-green",
    imagePlaceholder: {
      label: "Experiment Step",
      description:
        'Close-up of a robotic pipette tip dispensing fluorescent liquid into a microwell plate. Subtle green/blue glow. Dramatic shallow depth of field with blurred lab equipment behind. Reference: Opentrons, Hamilton Robotics marketing imagery.',
    },
  },
  {
    number: "03",
    title: "Analyze",
    description:
      "Results come back structured and ready to act on. Outliers are flagged automatically so nothing slips through.",
    color: "text-logo-blue",
    dottedClass: "text-dotted-blue",
    imagePlaceholder: {
      label: "Analyze Step",
      description:
        'A data visualization: 96-well plate heatmap overlaid with a Gaussian process prediction surface. Blue-to-green gradient. Clean chart aesthetic with axis labels. Reference: Plotly/D3.js scientific charts, Observable-style data viz.',
    },
  },
  {
    number: "04",
    title: "Adapt",
    description:
      "The model learns from each cycle and automatically refines the next batch, converging on optimal conditions with minimal experimental runs.",
    color: "text-[#d97706]",
    dottedClass: "text-dotted-orange",
    imagePlaceholder: {
      label: "Adapt Step",
      description:
        'Convergence plot: multiple colored lines converging toward an optimum. Faint 3D optimization landscape behind. Shows Bayesian optimization converging faster than random/grid search. Reference: Ax, BoTorch, or W&B dashboards, polished infographic style.',
    },
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-24">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-blue mb-4">
            How It Works
          </p>
          <h2 className="text-heading-sm lg:text-heading text-navy mb-6 max-w-3xl mx-auto">
            Continuous cycles of intelligent experimentation
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Each loop through the cycle builds on everything learned before,
            compounding insights and accelerating convergence.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-32">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center"
            >
              {/* Text */}
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-center gap-6 mb-6">
                  <span className={`text-5xl font-bold ${step.color} opacity-60`}>
                    {step.number}
                  </span>
                  <DotMatrixText text={step.title} color="#0b1f30" dotSize={3} gap={2} className="h-9" />
                </div>
                <p className="text-lg text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Image placeholder */}
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="image-placeholder aspect-[4/3] rounded-2xl">
                  <svg
                    className="placeholder-icon"
                    viewBox="0 0 48 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="4" y="4" width="40" height="40" rx="4" />
                    <circle cx="16" cy="16" r="4" />
                    <path d="M4 32 L16 22 L24 28 L36 18 L44 24 L44 40 L4 40Z" />
                  </svg>
                  <span className="placeholder-label">{step.imagePlaceholder.label}</span>
                  <span className="placeholder-description">
                    {step.imagePlaceholder.description}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
