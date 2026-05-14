import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-navy">
      <div className="px-12 lg:px-[7%]">
        <div className="border-t border-white/20 py-10 lg:py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="relative">
            <Image
              src="/images/logo/provigenLogoTransparent.png"
              alt="ProviGen"
              width={400}
              height={80}
              className="h-7 w-auto"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.7 }}
            />
            <Image
              src="/images/logo/provigenLogoTransparent.png"
              alt=""
              width={400}
              height={80}
              aria-hidden="true"
              className="h-7 w-auto absolute inset-0"
              style={{ clipPath: "inset(0% 46% 0% 36%)" }}
            />
          </Link>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-white/35">
            <a href="/legal_notice" className="hover:text-white/60 transition-colors">
              Legal Disclosure
            </a>
            <a href="/privacy_policy" className="hover:text-white/60 transition-colors">
              Privacy Policy
            </a>
            <a href="mailto:contact@provigen.ai" className="hover:text-white/60 transition-colors">
              contact@provigen.ai
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} ProviGen
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
