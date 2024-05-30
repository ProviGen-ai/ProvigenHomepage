import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <>
      <footer
        className="wow fadeInUp relative z-10 bg-primary bg-opacity-5 pt-8 md:pt-8 lg:pt-8"
        data-wow-delay=".1s"
      >
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4 md:w-1/2 lg:w-4/12 xl:w-5/12">
              <div className="mb-12 max-w-[360px] lg:mb-16">
                <Link href="/" className="mb-8 inline-block">
                  <Image
                    src="/images/logo/provigenLogoTransparent.png"
                    alt="logo"
                    className="w-full "
                    width={140}
                    height={30}
                  />
                  <Image
                    src="images/logo/logo.svg"
                    alt="logo"
                    className="hidden w-full "
                    width={140}
                    height={30}
                  />
                </Link>

              </div>
            </div>

            <div className="w-full px-4 sm:w-1/2 md:w-1/2 lg:w-4/12 xl:w-2/12">
              <div className="mb-12 lg:mb-16">
                <h2 className="mb-10 text-xl font-bold text-black">
                  Terms
                </h2>
                <ul className="inline">
                  <li>
                    <a
                      href="/legal_notice"
                      className="mb-4 inline text-base font-medium text-body-color hover:text-primary"
                    >
                      {" "}
                      Legal Disclosure{" "}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy_policy"
                      className="mb-4 inline text-base font-medium text-body-color hover:text-primary"
                    >
                      {" "}
                      Privacy Policy{" "}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>



      </footer>
    </>
  );
};

export default Footer;
