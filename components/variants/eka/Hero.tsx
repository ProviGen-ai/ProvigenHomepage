"use client";

const Hero = () => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden bg-near-black">
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      >
        <source src="/videos/network.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-near-black/90 via-near-black/30 to-transparent" />

      {/* Text overlay — bottom-left, flush with edge, Eka-style */}
      <div className="absolute bottom-0 left-0 z-10 pb-20 lg:pb-28 pl-8 lg:pl-12">
        <div className="animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl lg:text-[4rem] xl:text-[4.5rem] text-white font-medium leading-[1.1] tracking-tight">
            The Control Layer
            <br />
            for Life Science
          </h1>
        </div>
      </div>

    </section>
  );
};

export default Hero;
