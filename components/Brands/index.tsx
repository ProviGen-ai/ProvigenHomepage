import { Brand } from "@/types/brand";
import Image from "next/image";

const brandsData: Brand[] = [
  {
    id: 1,
    name: "tumAI",
    href: "https://www.tum-ai.com/",
    image: "/images/logo/tumAI_logo.png",
  },
  {
    id: 2,
    name: "tumVenture + FAB",
    href: "https://www.tum-venture-labs.de/",
    image: "/images/logo/tumVenture_logo.png",
    secondImage: "/images/logo/FAB.png",
  },
  // {
  //   id: 3,
  //   name: "BioM",
  //   href: "https://www.bio-m.org/en.html",
  //   image: "/images/logo/BioM.png",
  // },
  {
    id: 4,
    name: "iGEM Startups",
    href: "https://startups.igem.org/",
    image: "/images/logo/iGEM_Startups.png",
  },
  {
    id: 6,
    name: "AI Nation",
    href: "https://www.ai-nation.de/",
    image: "/images/logo/AI_Nation.svg",
  },
  {
    id: 5,
    name: "Calculus House",
    href: "https://www.calculus.house/",
    image: "/images/logo/Calculus_house.png",
    backgroundHex: "#000000",
  },
];

const Brands = () => {
  return (
    <section className="pt-20" id="supporters">
      <div className="container">
        <div className="text-center mb-7 text-2xl font-bold !leading-relaxed text-black dark:text-white dark:opacity-90 ">We are supported by</div>
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            {/* Mobile: Full-width continuous moving reel */}
            <div className="md:hidden -mt-8">
              <div className="absolute left-0 w-screen overflow-hidden bg-white py-2">
                <div className="flex animate-scroll-infinite">
                  {/* Multiple duplicates for truly seamless loop */}
                  {[...brandsData, ...brandsData].map((brand, index) => (
                    <div key={`${brand.id}-${index}`} className={`flex-shrink-0 mx-4 ${brand.secondImage ? 'w-80' : 'w-32'}`}>
                      <SingleBrand brand={brand} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden md:block wow fadeInUp rounded-md bg-white py-12 px-8 md:py-8 md:px-16" data-wow-delay=".1s">
              {(() => {
                const remainder = brandsData.length % 3;
                const mainRowCount = brandsData.length - remainder;
                
                return (
                  <>
                    {/* Main rows: complete sets of 3 */}
                    {mainRowCount > 0 && (
                      <div className="grid grid-cols-3 gap-0 place-items-center mb-4">
                        {brandsData.slice(0, mainRowCount).map((brand) => (
                          <SingleBrand key={brand.id} brand={brand} />
                        ))}
                      </div>
                    )}
                    {/* Bottom row: remainder logos centered */}
                    {remainder > 0 && (
                      <div className={`grid gap-0 place-items-center ${
                        remainder === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
                        remainder === 2 ? 'grid-cols-2 max-w-[56rem] mx-auto [&>*:first-child]:justify-self-end [&>*:last-child]:justify-self-start' :
                        'grid-cols-3'
                      }`}>
                        {brandsData.slice(mainRowCount).map((brand) => (
                          <SingleBrand key={brand.id} brand={brand} />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Brands;

const SingleBrand = ({ brand }: { brand: Brand }) => {
  const { href, image, name, secondImage, backgroundHex } = brand;
  
  // Special sizing for Calculus House logo
  const isCalculusHouse = name === "Calculus House";
  const logoHeight = isCalculusHouse ? "h-18" : "h-24";
  const logoMaxWidth = isCalculusHouse ? "max-w-[220px]" : "max-w-[220px]";

  return (
    <div className="flex items-center justify-center w-full h-24">
      <a
        href={href}
        target="_blank"
        rel="nofollow noreferrer"
        className={`relative ${logoHeight} w-auto ${logoMaxWidth} transition hover:scale-105 flex items-center justify-center gap-1`}
        style={backgroundHex ? { backgroundColor: backgroundHex, borderRadius: '6px', padding: '6px' } : {}}
      >
        <Image src={image} alt={name} width={200} height={200} className="h-full w-auto object-contain"/>
        {secondImage && (
          <Image src={secondImage} alt={`${name} second logo`} width={200} height={200} className="h-1/2 w-auto object-contain"/>
        )}
      </a>
    </div>
  );
};
