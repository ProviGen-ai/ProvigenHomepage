import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-navy border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="py-12 lg:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo — two layers: inverted (white text) + original clipped to diamond icon */}
          <Link href="/" className="flex-shrink-0 relative">
            {/* Base: fully inverted = white text + white diamond */}
            <Image
              src="/images/logo/provigenLogoTransparent.png"
              alt="ProviGen"
              width={140}
              height={30}
              className="h-7 w-auto"
              style={{ filter: "brightness(0) invert(1)", opacity: 0.85 }}
            />
            {/* Overlay: original logo clipped to only the diamond icon area */}
            <Image
              src="/images/logo/provigenLogoTransparent.png"
              alt=""
              width={140}
              height={30}
              aria-hidden="true"
              className="h-7 w-auto absolute inset-0"
              style={{ clipPath: "inset(0% 46% 0% 36%)" }}
            />
          </Link>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-white/40">
            <a href="/legal_notice" className="hover:text-white/70 transition-colors">
              Legal Disclosure
            </a>
            <a href="/privacy_policy" className="hover:text-white/70 transition-colors">
              Privacy Policy
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} ProviGen
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
