"use client";
import { Brand } from "@/types/brand";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

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
  const [layout, setLayout] = useState<"grid" | "strip">("strip");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className={`${layout === "strip" ? "pt-8 pb-12 lg:pt-10 lg:pb-16" : "py-24 lg:py-32"}`} id="supporters">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-semibold tracking-[0.2em] uppercase text-muted mb-12">
          Supported By
        </p>

        {layout === "grid" ? (
          <>
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
          </>
        ) : (
          /* Strip layout: single horizontal row */
          <div className="flex items-center justify-center gap-10 lg:gap-16 flex-wrap">
            {brandsData.map((brand) => (
              <SingleBrandStrip key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </div>

      {/* Dev toggle — remove when done */}
      <div className={`fixed bottom-32 right-4 z-[9999] bg-black/80 text-white p-2 rounded-lg text-xs font-mono flex gap-1 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {(["grid", "strip"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setLayout(opt)}
            className={`px-3 py-1 rounded ${layout === opt ? "bg-white text-black" : "text-white/60"}`}
          >
            {opt}
          </button>
        ))}
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

const SingleBrandStrip = ({ brand }: { brand: Brand }) => {
  const { href, image, name, secondImage, backgroundHex } = brand;
  const isCalculusHouse = name === "Calculus House";

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow noreferrer"
      className={`flex items-center gap-1 transition-all duration-300 hover:scale-105 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 ${name === "AI Nation" ? "h-8" : "h-10"}`}
      style={
        backgroundHex
          ? { backgroundColor: backgroundHex, borderRadius: "4px", padding: "4px" }
          : {}
      }
    >
      <Image
        src={image}
        alt={name}
        width={160}
        height={160}
        className="h-full w-auto object-contain"
      />
      {secondImage && (
        <Image
          src={secondImage}
          alt={`${name} second logo`}
          width={160}
          height={160}
          className="h-1/2 w-auto object-contain"
        />
      )}
    </a>
  );
};
