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
              Terms of Service
            </a>
            <a href="/privacy_policy" className="hover:text-white/60 transition-colors">
              Privacy Policy
            </a>
            <a href="mailto:contact@provigen.ai" className="hover:text-white/60 transition-colors">
              contact@provigen.ai
            </a>
          </div>

          {/* Copyright + LinkedIn */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/in/lucas-mair/"
                target="_blank"
                rel="nofollow noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-navy/10 shadow-sm text-xs text-navy hover:shadow-md hover:bg-gray-50 transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Lucas Mair
              </a>
              <a
                href="https://www.linkedin.com/in/magdalena-lang/"
                target="_blank"
                rel="nofollow noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-navy/10 shadow-sm text-xs text-navy hover:shadow-md hover:bg-gray-50 transition-all"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Magdalena Lang
              </a>
            </div>
            <p className="text-xs text-white/25">
              &copy; {new Date().getFullYear()} ProviGen
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
