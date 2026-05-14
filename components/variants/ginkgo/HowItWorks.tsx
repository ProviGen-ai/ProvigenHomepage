const steps = [
  {
    number: "01",
    title: "Design",
    description:
      "Our AI analyzes your experimental objectives and designs an optimal set of experiments using Bayesian optimization and active learning.",
    color: "text-logo-blue",
    imagePlaceholder: {
      label: "Design Step",
      description:
        'An abstract visualization of an AI "thinking" about experimental design. Show a network graph or decision tree overlaid on a subtle molecular structure background. Clean, minimal line art on a light cream background. The nodes could represent experiment parameters, with edges showing relationships. Color accent: ProviGen blue (#05A2E6). Style: technical illustration, not a photo. Reference: think scientific paper figure-style network diagrams, but more polished and modern — like something you\'d see in a McKinsey biotech report.',
    },
  },
  {
    number: "02",
    title: "Experiment",
    description:
      "Protocols are automatically translated into machine-executable instructions and deployed on your robotic platform. No manual coding required.",
    color: "text-logo-green",
    imagePlaceholder: {
      label: "Experiment Step",
      description:
        'Close-up photography of a robotic pipette tip dispensing a bright fluorescent liquid into a microwell plate. The liquid could have a subtle green or blue glow. Dramatic shallow depth of field, with the background showing blurred lab equipment. Clean, modern aesthetic. Reference: search "robotic pipetting microplate fluorescent" — similar to imagery used by Opentrons, Hamilton Robotics, or Beckman Coulter marketing.',
    },
  },
  {
    number: "03",
    title: "Analyze",
    description:
      "Real-time sensor data is automatically collected, cleaned, and analyzed. Anomalies are flagged, and results are mapped to your design space.",
    color: "text-logo-blue",
    imagePlaceholder: {
      label: "Analyze Step",
      description:
        'A data visualization showing experimental results: a heatmap of a 96-well plate overlaid with a Gaussian process prediction surface. Use a blue-to-green gradient for the heatmap. Clean, chart-like aesthetic with axis labels. Could also show a real-time data stream visualization with a subtle glow effect. Reference: think of Plotly/D3.js scientific charts rendered beautifully — like the data visualizations on the Observable or Flourish websites, but with a biotech context.',
    },
  },
  {
    number: "04",
    title: "Adapt",
    description:
      "The model learns from each cycle and automatically refines the next experimental batch, converging on optimal conditions with minimal runs.",
    color: "text-logo-green",
    imagePlaceholder: {
      label: "Adapt Step",
      description:
        'A convergence plot showing iterative improvement: multiple colored lines converging toward an optimum over experiment iterations. The background should show a faint 3D optimization landscape. Clean, infographic style. The curves should show how Bayesian optimization converges faster than random search or grid search. Reference: similar to convergence comparison charts from Ax, BoTorch, or Weights & Biases experiment tracking dashboards, but more visually polished.',
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
            Our closed-loop platform automates the entire experimental workflow — from
            hypothesis to insight — in a fraction of the time.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-32">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`grid lg:grid-cols-2 gap-16 lg:gap-24 items-center ${
                i % 2 === 1 ? "" : ""
              }`}
            >
              {/* Text */}
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-center gap-4 mb-6">
                  <span className={`text-5xl font-bold ${step.color} opacity-30`}>
                    {step.number}
                  </span>
                  <h3 className="text-heading-sm text-navy">{step.title}</h3>
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
