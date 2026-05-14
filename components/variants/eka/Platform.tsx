const Platform = () => {
  return (
    <section id="platform" className="bg-charcoal text-white">
      {/* Section title bar */}
      <div className="mx-auto max-w-7xl px-8 lg:px-12 pt-24 lg:pt-32 pb-16">
        <h2 className="text-heading-sm lg:text-heading text-white font-medium">
          Built to close the loop
        </h2>
      </div>

      {/* Capabilities — alternating layout like Eka */}
      <div className="space-y-0">
        {/* Capability 1: Design */}
        <div className="grid lg:grid-cols-2 min-h-[70vh]">
          <div className="flex flex-col justify-center px-8 lg:px-12 xl:px-20 py-16">
            <span className="font-mono text-2xl uppercase text-white/40 tracking-[0.4em] mb-6 text-dotted font-bold">
              DESIGN
            </span>
            <p className="text-xl lg:text-2xl text-white/80 font-light leading-relaxed max-w-lg">
              Intelligent experiment design: our AI analyzes your objectives and generates
              optimal experimental plans using Bayesian optimization and active learning.
            </p>
          </div>
          <div className="relative bg-near-black flex items-center justify-center min-h-[400px]">
            <div className="image-placeholder w-full h-full min-h-[400px] rounded-none" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%)', borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'none' }}>
              <svg className="placeholder-icon" viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                <rect x="4" y="4" width="40" height="40" rx="4" />
                <circle cx="16" cy="16" r="4" />
                <path d="M4 32 L16 22 L24 28 L36 18 L44 24 L44 40 L4 40Z" />
              </svg>
              <span className="placeholder-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Design Visualization</span>
              <span className="placeholder-description" style={{ color: 'rgba(255,255,255,0.3)' }}>
                A cinematic dark-background shot of a 3D Bayesian optimization response surface
                rendered in blue-teal gradient. The surface floats in dark space with subtle grid
                lines. Small glowing dots mark sampled experiment points. Camera angle is slightly
                from above at 30 degrees. Think: sci-fi data visualization meets scientific computing.
                Reference: BoTorch/Ax optimization surface visualizations rendered in a dark, cinematic
                style like the holographic UI in movies like Ex Machina or Minority Report.
              </span>
            </div>
          </div>
        </div>

        {/* Capability 2: Execute */}
        <div className="grid lg:grid-cols-2 min-h-[70vh]">
          <div className="relative bg-near-black flex items-center justify-center min-h-[400px] order-2 lg:order-1">
            <div className="image-placeholder w-full h-full min-h-[400px] rounded-none" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%)', borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'none' }}>
              <svg className="placeholder-icon" viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                <rect x="4" y="4" width="40" height="40" rx="4" />
                <circle cx="16" cy="16" r="4" />
                <path d="M4 32 L16 22 L24 28 L36 18 L44 24 L44 40 L4 40Z" />
              </svg>
              <span className="placeholder-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Robot Execution</span>
              <span className="placeholder-description" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Close-up cinematic footage still of a liquid-handling robot arm (Hamilton STAR or
                Opentrons Flex) in mid-motion, pipetting into a 96-well plate. Shot on dark/black
                background with dramatic side lighting that catches the metal surfaces. The robot
                should look precise and powerful. Motion blur on the arm tip to convey speed.
                Style: product photography like Eka Robotics or Boston Dynamics — dark, moody,
                high-contrast. Could include a subtle &quot;1X SPEED&quot; label overlay.
                Reference: Eka Robotics hero shots, or search &quot;liquid handling robot dark
                background product photography&quot;.
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center px-8 lg:px-12 xl:px-20 py-16 order-1 lg:order-2">
            <span className="font-mono text-2xl uppercase text-white/40 tracking-[0.4em] mb-6 text-dotted font-bold">
              EXECUTE
            </span>
            <p className="text-xl lg:text-2xl text-white/80 font-light leading-relaxed max-w-lg">
              Autonomous protocol execution: experiments are automatically translated into
              machine-executable instructions and deployed on your robotic platform.
              No manual coding required.
            </p>
          </div>
        </div>

        {/* Capability 3: Learn */}
        <div className="grid lg:grid-cols-2 min-h-[70vh]">
          <div className="flex flex-col justify-center px-8 lg:px-12 xl:px-20 py-16">
            <span className="font-mono text-2xl uppercase text-white/40 tracking-[0.4em] mb-6 text-dotted font-bold">
              LEARN
            </span>
            <p className="text-xl lg:text-2xl text-white/80 font-light leading-relaxed max-w-lg">
              Continuous adaptation: the model learns from every experimental cycle, automatically
              refining parameters and converging on optimal conditions with minimal runs.
            </p>
          </div>
          <div className="relative bg-near-black flex items-center justify-center min-h-[400px]">
            <div className="image-placeholder w-full h-full min-h-[400px] rounded-none" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #111 50%, #1a1a1a 100%)', borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'none' }}>
              <svg className="placeholder-icon" viewBox="0 0 48 48" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
                <rect x="4" y="4" width="40" height="40" rx="4" />
                <circle cx="16" cy="16" r="4" />
                <path d="M4 32 L16 22 L24 28 L36 18 L44 24 L44 40 L4 40Z" />
              </svg>
              <span className="placeholder-label" style={{ color: 'rgba(255,255,255,0.4)' }}>Learning Loop</span>
              <span className="placeholder-description" style={{ color: 'rgba(255,255,255,0.3)' }}>
                A convergence animation still: multiple colored lines (Bayesian optimization in
                bright blue, random search in gray, grid search in dim white) converging over
                iterations. Dark background with a subtle glow on the BO line showing it reaching
                optimum fastest. Below, a faint 96-well plate heatmap evolving from random to
                optimized pattern. Style: data visualization on dark background, like a Bloomberg
                terminal meets scientific computing. Reference: convergence plots from Weights &amp;
                Biases or Neptune.ai rendered with dark theme.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Platform;
