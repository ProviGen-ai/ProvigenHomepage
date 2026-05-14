import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-off-white">
      {/* Thin separator */}
      <div className="mx-auto max-w-7xl px-8 lg:px-12">
        <div className="border-t border-light-gray" />
      </div>

      <div className="mx-auto max-w-7xl px-8 lg:px-12">
        <div className="py-12 lg:py-16 flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Left: Logo + copyright */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo/provigenLogoTransparent.png"
                alt="ProviGen"
                width={120}
                height={26}
                className="h-6 w-auto"
              />
            </Link>
            <p className="font-mono text-xs text-mid-gray">
              &copy; {new Date().getFullYear()} ProviGen
            </p>
          </div>

          {/* Right: Links with arrows */}
          <div className="flex flex-col items-end gap-3">
            <a
              href="/legal_notice"
              className="font-mono text-xs uppercase tracking-wider text-mid-gray hover:text-charcoal transition-colors inline-flex items-center gap-2"
            >
              Legal Disclosure <span>&rarr;</span>
            </a>
            <a
              href="/privacy_policy"
              className="font-mono text-xs uppercase tracking-wider text-mid-gray hover:text-charcoal transition-colors inline-flex items-center gap-2"
            >
              Privacy Policy <span>&rarr;</span>
            </a>
            <a
              href="mailto:contact@provigen.ai"
              className="font-mono text-xs text-mid-gray hover:text-charcoal transition-colors inline-flex items-center gap-2"
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
