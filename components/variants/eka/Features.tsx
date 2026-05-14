import featuresData from "@/components/Features/featuresData";

const Features = () => {
  return (
    <section id="features" className="py-32 lg:py-40 bg-off-white">
      <div className="mx-auto max-w-4xl px-8 lg:px-12">
        {/* Section header */}
        <div className="text-center mb-20">
          <span className="font-mono text-label uppercase text-warm-tan tracking-[0.3em] mb-6 block">
            Why ProviGen
          </span>
          <h2 className="text-heading-sm lg:text-heading text-charcoal font-medium">
            Built for scientists, powered by AI
          </h2>
        </div>

        {/* Clean feature list — just title + description, no icons */}
        <div className="space-y-12">
          {featuresData.map((feature) => (
            <div key={feature.id} className="text-center max-w-2xl mx-auto">
              <h3 className="text-xl font-medium text-charcoal mb-3">
                {feature.title}
              </h3>
              <p className="text-mid-gray leading-relaxed">
                {feature.paragraph}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
