const KPIs = ({ dark = false }: { dark?: boolean }) => {
  const stats = [
    { value: "10x", label: "Faster protocol optimization" },
    { value: "80%", label: "Less manual intervention" },
    { value: "3x", label: "Higher experimental throughput" },
  ];

  return (
    <section
      id="kpis"
      className={`py-24 lg:py-32 ${dark ? "bg-[#0a0a0a] text-white" : ""}`}
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className={`text-heading-sm lg:text-heading font-medium mb-4 ${
              dark ? "text-white" : "text-navy"
            }`}
          >
            What it unlocks
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto leading-relaxed ${
              dark ? "text-white/50" : "text-muted"
            }`}
          >
            Optimization cycles that used to take months now take weeks.
            Your team focuses on science, not debugging automation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div
                className={`text-5xl lg:text-6xl font-light tracking-tight mb-3 ${
                  dark ? "text-white" : "text-navy"
                }`}
              >
                {stat.value}
              </div>
              <div
                className={`text-xs uppercase tracking-[0.15em] ${
                  dark ? "text-white/40" : "text-muted"
                }`}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KPIs;
