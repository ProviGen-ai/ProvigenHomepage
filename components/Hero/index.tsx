"use client";
import Link from "next/link"
import backgroundVideo from "public/videos/network.mp4"


const scrollToFeatures = () => {
  const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
};

const Hero = () => {
  return (
    <>
    <section
        id="home"
        className="relative overflow-hidden h-s"
      >
      <div className="w-full h-[80vh] grid">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="object-cover absolute w-full h-[80vh] z-0 opacity-20"
      >
      <source src={backgroundVideo} type="video/mp4"/>
      </video>
          <div className="container align-middle mt-auto mb-auto z-1 pt-4 relative">
          
            <div className="-mx-4 flex flex-wrap">
            
              <div className="w-full px-4">
              
                <div
                  className="wow fadeInUp mx-auto max-w-[800px] text-center"
                  data-wow-delay=".2s"
                >
                  
                  <h1 className="mb-5 text-5xl  leading-tight text-black  xs:text-4xl xxs:text-2xl sm:text-4xl sm:leading-tight md:text-5xl lg:text-6xl md:leading-tight">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-black to-blue">Accelerating</span> <span className="italic">research in</span> <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-black to-blue">biotechnology</span>
                  </h1>
                  <p className="mb-12 text-base font-medium !leading-relaxed text-body-color-dark  sm:text-lg md:text-xl">
                  We build an AI-based, interactive lab assistant to unlock the full potential of bioinformatics tools in biotech research.
                  </p>
                  <div className="flex flex-col items-center justify-center space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
                    <button
                      className="rounded-md bg-blue/80 py-4 px-8 text-base font-semibold text-black duration-300 ease-in-out hover:bg-blue/50"
                      onClick={scrollToFeatures}
                    >
                      Learn more
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
