import featuresData from "@/components/Features/featuresData";

const Features = () => {
  return (
    <section id="features" className="py-32 lg:py-40 bg-soft-gray/50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-logo-green mb-4">
            Why ProviGen
          </p>
          <h2 className="text-heading-sm lg:text-heading text-navy mb-6 max-w-3xl mx-auto">
            Built for scientists, powered by AI
          </h2>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {featuresData.map((feature) => (
            <div
              key={feature.id}
              className="group bg-white rounded-2xl p-8 lg:p-10 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon placeholder */}
              <div className="w-14 h-14 rounded-xl bg-cream flex items-center justify-center mb-6 group-hover:bg-navy/5 transition-colors duration-300">
                <img
                  src={feature.iconPath}
                  alt={feature.title}
                  className="w-8 h-8 object-contain"
                />
              </div>

              <h3 className="text-xl font-semibold text-navy mb-4">
                {feature.title}
              </h3>

              <p className="text-muted leading-relaxed">
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
