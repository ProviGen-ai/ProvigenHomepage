import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { iconPath, title, paragraph } = feature;
  return (
    <div className="w-full px-0 md:px-8">
      <div className="wow fadeInUp" data-wow-delay=".15s">
        <div>
          <img
                src={iconPath}
                alt={title}
                className="mb-2 flex h-[60px] w-auto object-scale-down items-center justify-center rounded-md"
            />
        </div>
        <h3 className="mb-5 text-xl font-bold text-black sm:text-2xl lg:text-xl xl:text-2xl">
          {title}
        </h3>
        <p className="pr-[10px] text-base font-medium leading-relaxed text-body-color-dark min-h-[120px]">
          {paragraph}
        </p>
      </div>
    </div>
  );
};

export default SingleFeature;
