"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import menuData from "@/components/Header/menuData";

const navItems = menuData.filter((item) => item.title !== "Home");
import { useRouter, usePathname } from "next/navigation";

const Header = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setNavbarOpen(false);
  }, [pathname]);

  const scrollToElement = (elementId: string) => {
    if (pathname === "/") {
      const element = document.getElementById(elementId);
      element?.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", "/");
    } else {
      router.push(`/#${elementId}`);
    }
    setNavbarOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 z-[9999] w-full transition-all duration-500 ${
        scrolled ? "bg-[#0a0a0a] shadow-[0_1px_0_rgba(255,255,255,0.08)]" : ""
      }`}
    >
      <div className="px-6 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Logo — always show white version with colored diamond */}
          <Link href="/" className="flex-shrink-0 relative">
            <Image
              src="/images/logo/provigenLogoTransparent.png"
              alt="ProviGen"
              width={160}
              height={36}
              loading="eager"
              priority
              className="h-8 lg:h-9 w-auto opacity-90"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            {/* Color diamond overlay */}
            <Image
              src="/images/logo/provigenLogoTransparent.png"
              alt=""
              width={160}
              height={36}
              aria-hidden="true"
              className="h-8 lg:h-9 w-auto absolute inset-0"
              style={{ clipPath: "inset(0% 46% 0% 36%)" }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <div key={item.id}>
                {item.jumpTo ? (
                  <button
                    onClick={() => scrollToElement(item.jumpTo!)}
                    className={`text-sm font-semibold tracking-[0.2em] uppercase transition-colors duration-500 ${
                      scrolled
                        ? "text-warm-tan hover:text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {item.title}
                  </button>
                ) : item.path ? (
                  <Link
                    href={item.path}
                    className={`text-sm font-semibold tracking-[0.2em] uppercase transition-colors duration-500 ${
                      scrolled
                        ? "text-warm-tan hover:text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {item.title}
                  </Link>
                ) : null}
              </div>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setNavbarOpen(!navbarOpen)}
            aria-label="Toggle menu"
            className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`block h-[1.5px] w-6 bg-white transition-all duration-300 origin-center ${
                  i === 0 && navbarOpen ? "rotate-45 translate-y-[4.5px]" : ""
                } ${
                  i === 1 && navbarOpen ? "opacity-0 scale-0" : ""
                } ${
                  i === 2 && navbarOpen ? "-rotate-45 -translate-y-[4.5px]" : ""
                }`}
              />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          navbarOpen ? "max-h-96 border-t border-black/5" : "max-h-0"
        } bg-off-white/95 backdrop-blur-md`}
      >
        <nav className="mx-auto max-w-7xl px-8 py-4 space-y-1">
          {navItems.map((item) => (
            <div key={item.id}>
              {item.jumpTo ? (
                <button
                  onClick={() => scrollToElement(item.jumpTo!)}
                  className="block w-full text-left py-3 text-base text-charcoal/60 hover:text-charcoal transition-colors"
                >
                  {item.title}
                </button>
              ) : item.path ? (
                <Link
                  href={item.path}
                  className="block py-3 text-base text-charcoal/60 hover:text-charcoal transition-colors"
                  onClick={() => setNavbarOpen(false)}
                >
                  {item.title}
                </Link>
              ) : null}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
