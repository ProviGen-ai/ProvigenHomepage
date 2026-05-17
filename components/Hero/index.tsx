"use client";


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
        className="relative overflow-hidden h-screen"
      >
      <div className="w-full h-screen flex items-center">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="object-cover absolute w-full h-screen z-0 opacity-20"
      >
      <source src="/videos/network.mp4" type="video/mp4"/>
      </video>
          <div className="container z-1 pt-32 sm:pt-28 md:pt-20 pb-8 relative w-full">
          
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
                  We build the <span className="text-logo-blue">control layer</span> for <span className="text-logo-green">life science</span>.
                  </p>
                  <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                    <a
                      href="/#contact"
                      className="inline-block rounded-md bg-primary py-4 px-8 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
                    >
                      Contact Us
                    </a>
                    <button
                      className="rounded-md bg-transparent border-2 border-black/20 py-4 px-8 text-base font-semibold text-black duration-300 ease-in-out hover:border-black/40 hover:bg-black/5"
                      onClick={scrollToFeatures}
                    >
                      Learn More
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
