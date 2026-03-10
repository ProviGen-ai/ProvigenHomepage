"use client";

import { DoESimulation } from "@/components/Demo/DoESimulation";
import { ConvergenceComparison } from "@/components/Demo/ConvergenceComparison";

export default function DemoPage() {
  return (
    <section className="pb-[120px] pt-[150px]">
      <div className="container">
        {/* Page header */}
        <div className="mx-auto max-w-4xl mb-16 text-center">
          <h1 className="mb-4 text-3xl font-bold !leading-tight text-black sm:text-4xl md:text-[45px]">
            Interactive Demo
          </h1>
          <p className="text-base !leading-relaxed text-body-color-dark md:text-lg">
            Explore how Bayesian Optimization outperforms traditional Design of
            Experiments by finding optimal conditions with fewer experiments.
            Results vary between runs due to random initialization.
          </p>
        </div>

        {/* 2D DoE Simulation */}
        <div className="mb-16">
          <div className="mb-6 max-w-3xl">
            <h2 className="text-2xl font-bold text-black mb-2">
              2D Optimization Landscape
            </h2>
            <p className="text-body-color-dark">
              Watch how Bayesian Optimization selects sample points compared to
              space-filling Design of Experiments. The pre-rendered plot on the
              left shows the true optimization landscape which would be unknown
              in a real-world setting.
            </p>
          </div>
          <DoESimulation height={600} />
        </div>

        {/* N-D Convergence Comparison */}
        <div className="mb-16">
          <div className="mb-6 max-w-3xl">
            <h2 className="text-2xl font-bold text-black mb-2">
              High-Dimensional Convergence
            </h2>
            <p className="text-body-color-dark">
              Compare convergence rates in N-dimensional parameter spaces. As
              dimensionality increases, the advantage of Bayesian Optimization
              over traditional sampling becomes more pronounced.
            </p>
          </div>
          <ConvergenceComparison height={500} />
        </div>

        {/* CTA section */}
        <div className="text-center mt-12">
          <p className="mb-6 text-base text-body-color-dark">
            Ready to optimize your laboratory workflows?
          </p>
          <a
            href="/#contact"
            className="inline-block rounded-md bg-primary py-4 px-8 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
