import NetworkMesh from "@/components/Common/NetworkMesh";

const Platform = () => {
  return (
    <section id="platform" className="relative bg-[#0a0a0a] text-white overflow-hidden">
      {/* Network mesh background */}
      <div className="absolute inset-0 opacity-60">
        <NetworkMesh density={45} />
      </div>

      {/* Radial glow from center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(5,162,230,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 py-40 lg:py-56">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          {/* Scale-style bold statement */}
          <h2 className="text-heading-sm lg:text-heading text-white font-medium mb-8 leading-tight">
            Every experiment makes the next one smarter.
          </h2>
          <p className="text-lg lg:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-16">
            Our AI connects directly to your lab equipment, reads sensor data in real-time,
            and runs continuous cycles of intelligent experimentation. Each iteration
            compounds what was learned before.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-3xl mx-auto">
            {[
              { value: "10x", label: "faster protocol optimization" },
              { value: "80%", label: "less manual intervention" },
              { value: "3x", label: "higher experimental throughput" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl lg:text-5xl font-light text-white mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-[0.15em]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Platform;
