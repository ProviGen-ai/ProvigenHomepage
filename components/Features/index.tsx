import SectionTitle from "../Common/SectionTitle";
import SingleFeature from "./SingleFeature";
import featuresData from "./featuresData";

const Features = () => {
  return (
    <>
      <section
        id="features"
        className="bg-primary/[.03]"
        style={{ paddingTop: '20vh', paddingBottom: '10vh' }}
      >
        <div className="w-full max-w-[80%] md:max-w-7xl mx-auto px-2 md:px-4">
          <SectionTitle
            title="We turn robotic biolabs into closed-loop systems."
            paragraph={
              <>
                Deploying and optimizing protocols on laboratory robots still demands months of manual debugging. 
                <br />
                To address this, we use active learning techniques to shorten optimization timelines from months to weeks.
                <br />
                Our platform connects to equipment, reads sensor data to auto-debug workflows, and runs continuous loops of:
                <br /><br />
                <span className="font-bold text-logo-blue">design</span> &nbsp;-&nbsp; <span className="font-bold text-logo-green">experiment</span> &nbsp;-&nbsp; <span className="font-bold text-logo-blue">analyze</span> &nbsp;-&nbsp; <span className="font-bold text-logo-green">adapt</span>
              </>
            }
            paragraphWidth="1000px"
            mb="24vh"
            center
          />
          <div className="grid grid-cols-1 gap-x-12 gap-y-14 md:grid-cols-3 lg:grid-cols-3 px-6">
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
