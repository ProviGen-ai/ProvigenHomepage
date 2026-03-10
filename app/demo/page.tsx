import Breadcrumb from "@/components/Common/Breadcrumb";

export default function DemoPage() {
  return (
    <>

      <section className="pb-[120px] pt-[120px]">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="wow fadeInUp mb-12 text-center" data-wow-delay=".1s">
              <h2 className="mb-4 text-3xl font-bold !leading-tight text-black sm:text-4xl md:text-[45px]">
                Interactive Demo
              </h2>
              <p className="text-base !leading-relaxed text-body-color-dark md:text-lg">
                Our interactive demo platform will be available here soon.
              </p>
            </div>

            <div className="wow fadeInUp rounded-lg bg-white p-8 shadow-lg sm:p-12" data-wow-delay=".15s">
              <div className="text-center text-body-color-dark">
                <p className="mb-6">
                  We're building an interactive demonstration of our platform. Check back soon to explore:
                </p>
                <ul className="mx-auto max-w-2xl space-y-3 text-left">
                  <li>• Automated workflow design</li>
                  <li>• Real-time protocol optimization</li>
                  <li>• AI-driven experimental planning</li>
                  <li>• Robotic lab simulation</li>
                </ul>
              </div>

              <div className="mt-12 text-center">
                <p className="mb-6 text-base text-body-color-dark">
                  Interested in seeing a live demonstration?
                </p>
                <a
                  href="/#contact"
                  className="inline-block rounded-md bg-primary py-4 px-8 text-base font-semibold text-white duration-300 ease-in-out hover:bg-primary/80"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
