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
    id: 6,
    name: "AI Nation",
    href: "https://www.ai-nation.de/",
    image: "/images/logo/AI_Nation.svg",
  },
  {
    id: 4,
    name: "iGEM Startups",
    href: "https://startups.igem.org/",
    image: "/images/logo/iGEM_Startups.png",
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
    <section className="py-20 lg:py-24 bg-off-white" id="supporters">
      <div className="mx-auto max-w-7xl px-8 lg:px-12">
        <p className="font-mono text-label uppercase text-mid-gray tracking-[0.3em] text-center mb-14">
          Supported By
        </p>

        {/* Mobile: scrolling carousel */}
        <div className="md:hidden overflow-hidden">
          <div className="flex animate-scroll-infinite">
            {[...brandsData, ...brandsData].map((brand, index) => (
              <div
                key={`${brand.id}-${index}`}
                className={`flex-shrink-0 mx-6 ${brand.secondImage ? "w-72" : "w-28"}`}
              >
                <SingleBrand brand={brand} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:block">
          {(() => {
            const remainder = brandsData.length % 3;
            const mainRowCount = brandsData.length - remainder;
            return (
              <>
                {mainRowCount > 0 && (
                  <div className="grid grid-cols-3 gap-0 place-items-center mb-4">
                    {brandsData.slice(0, mainRowCount).map((brand) => (
                      <SingleBrand key={brand.id} brand={brand} />
                    ))}
                  </div>
                )}
                {remainder > 0 && (
                  <div
                    className={`grid gap-0 place-items-center ${
                      remainder === 1
                        ? "grid-cols-1 max-w-xs mx-auto"
                        : remainder === 2
                        ? "grid-cols-2 max-w-[56rem] mx-auto [&>*:first-child]:justify-self-end [&>*:last-child]:justify-self-start"
                        : "grid-cols-3"
                    }`}
                  >
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
    </section>
  );
};

export default Brands;

const SingleBrand = ({ brand }: { brand: Brand }) => {
  const { href, image, name, secondImage, backgroundHex } = brand;
  const isCalculusHouse = name === "Calculus House";
  const logoHeight = isCalculusHouse ? "h-16" : "h-20";

  return (
    <div className="flex items-center justify-center w-full h-24">
      <a
        href={href}
        target="_blank"
        rel="nofollow noreferrer"
        className={`relative ${logoHeight} w-auto max-w-[200px] transition-all duration-300 hover:scale-105 flex items-center justify-center gap-1 opacity-50 grayscale hover:grayscale-0 hover:opacity-100`}
        style={
          backgroundHex
            ? { backgroundColor: backgroundHex, borderRadius: "6px", padding: "6px" }
            : {}
        }
      >
        <Image
          src={image}
          alt={name}
          width={200}
          height={200}
          className="h-full w-auto object-contain"
        />
        {secondImage && (
          <Image
            src={secondImage}
            alt={`${name} second logo`}
            width={200}
            height={200}
            className="h-1/2 w-auto object-contain"
          />
        )}
      </a>
    </div>
  );
};
