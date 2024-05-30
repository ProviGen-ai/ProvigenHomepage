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
    name: "tumVenture",
    href: "https://www.tum-venture-labs.de/",
    image: "/images/logo/tumVenture_logo.png",
  },
];

const Brands = () => {
  return (
    <section className="pt-16" id="supporters">
      <div className="container">
        <div className="text-center mb-12 text-2xl font-bold !leading-relaxed text-black dark:text-white dark:opacity-90 ">We are supported by</div>
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div
              className="wow fadeInUp flex flex-wrap items-center justify-center rounded-md bg-white py-8 px-8 sm:px-10 md:py-[70px] md:px-[80px] xl:p-[80px] 2xl:py-[80px] 2xl:px-[80px]"
              data-wow-delay=".1s
              "
            >
              {brandsData.map((brand) => (
                <SingleBrand key={brand.id} brand={brand} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Brands;

const SingleBrand = ({ brand }: { brand: Brand }) => {
  const { href, image, name } = brand;

  return (
    <div className="mmx-3 flex w-full max-w-[250px] sm:mx-4 lg:max-w-[250px] xl:mx-6 xl:max-w-[250px] 2xl:mx-8 2xl:max-w-[300px] max-h-[300px] py-[15px]">
      <a
        href={href}
        target="_blank"
        rel="nofollow noreferrer"
        className="relative h-[70px] w-full transition hover:scale-105"
      >
        <Image src={image} alt={name} width={500}
      height={500}/>
      </a>
    </div>
  );
};
