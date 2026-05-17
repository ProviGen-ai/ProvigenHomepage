import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a]">
      <div className="px-12 lg:px-[7%]">
        <div className="border-t border-white/15" />
      </div>

      <div className="px-12 lg:px-[7%]">
        <div className="py-6 lg:py-8 flex flex-col md:flex-row items-start justify-between gap-8">
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
              &copy; {new Date().getFullYear()} ProviGenAI
            </p>
            <a
              href="mailto:contact@provigen.ai"
              className="font-mono text-xs text-white/50 hover:text-white/70 transition-colors mt-3 block"
            >
              contact@provigen.ai
            </a>
          </div>

          {/* Right: Links with arrows */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <a
              href="/legal_notice"
              className="font-mono text-xs uppercase tracking-wider text-white/50 hover:text-white/70 transition-colors inline-flex items-center gap-2"
            >
              Terms of Service <span>&rarr;</span>
            </a>
            <a
              href="/privacy_policy"
              className="font-mono text-xs uppercase tracking-wider text-white/50 hover:text-white/70 transition-colors inline-flex items-center gap-2"
            >
              Privacy Policy <span>&rarr;</span>
            </a>
            <div className="flex items-center gap-3 mt-2">
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
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
