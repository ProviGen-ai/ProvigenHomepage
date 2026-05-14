import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a]">
      <div className="px-12 lg:px-[7%]">
        <div className="border-t border-white/15" />
      </div>

      <div className="px-12 lg:px-[7%]">
        <div className="py-12 lg:py-16 flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Left: Logo + copyright */}
          <div>
            <Link href="/" className="inline-block mb-4 relative">
              <Image
                src="/images/logo/provigenLogoTransparent.png"
                alt="ProviGen"
                width={400}
                height={80}
                className="h-6 w-auto"
                style={{ filter: "brightness(0) invert(1)", opacity: 0.7 }}
              />
              <Image
                src="/images/logo/provigenLogoTransparent.png"
                alt=""
                width={400}
                height={80}
                aria-hidden="true"
                className="h-6 w-auto absolute inset-0"
                style={{ clipPath: "inset(0% 46% 0% 36%)" }}
              />
            </Link>
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} ProviGen
            </p>
          </div>

          {/* Right: Links with arrows */}
          <div className="flex flex-col items-end gap-3">
            <a
              href="/legal_notice"
              className="text-xs uppercase tracking-wider text-white/50 hover:text-white/60 transition-colors inline-flex items-center gap-2"
            >
              Legal Disclosure <span>&rarr;</span>
            </a>
            <a
              href="/privacy_policy"
              className="text-xs uppercase tracking-wider text-white/50 hover:text-white/60 transition-colors inline-flex items-center gap-2"
            >
              Privacy Policy <span>&rarr;</span>
            </a>
            <a
              href="mailto:contact@provigen.ai"
              className="text-xs text-white/50 hover:text-white/60 transition-colors inline-flex items-center gap-2"
            >
              contact@provigen.ai <span>&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
