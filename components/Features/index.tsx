import SectionTitle from "../Common/SectionTitle";
import SingleFeature from "./SingleFeature";
import featuresData from "./featuresData";

const Features = () => {
  return (
    <>
      <section
        id="features"
        className="bg-primary/[.03] py-16 md:py-20 lg:py-28"
      >
        <div className="container">
          <SectionTitle
            title="We build the digital bioinformatician."
            paragraph="Currently, biotech laboratories often share a single bioinformatician, slowing down researchers in their work. Recognizing this challenge, we at ProviGen have set ourselves the goal of eliminating this bottleneck. To achieve this, we are building a cloud platform for open-source biotech tools, making these tools easily accessible via an AI-driven natural language interface."
            center
          />
          <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-3 lg:grid-cols-3">
            {featuresData.map((feature) => (
              <SingleFeature key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
