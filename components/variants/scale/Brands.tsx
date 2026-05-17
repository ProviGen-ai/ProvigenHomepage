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
    <section className="pt-8 pb-12 lg:pt-10 lg:pb-16" id="supporters">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-semibold tracking-[0.2em] uppercase text-muted mb-12">
          Supported By
        </p>

        <div className="flex items-center justify-center gap-10 lg:gap-16 flex-wrap">
          {brandsData.map((brand) => (
            <SingleBrandStrip key={brand.id} brand={brand} />
          ))}
        </div>
      </div>

    </section>
  );
};

export default Brands;


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
