"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import menuData from "@/components/Header/menuData";
import { useRouter, usePathname } from 'next/navigation'

const Header = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wheel fires before scroll — triggers hide immediately on intent
    // Require stronger upward intent to show (prevents trackpad inertia flicker)
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 2) {
        setHidden(true);
      } else if (e.deltaY < -10) {
        setHidden(false);
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Only force-show when fully at the top (not mid-scroll near top)
      if (currentScrollY === 0) {
        setHidden(false);
      }

      setScrolled(currentScrollY > 60);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    setNavbarOpen(false);
  }, [pathname]);

  const scrollToElement = (elementId: string) => {
    if (pathname === '/') {
      const element = document.getElementById(elementId);
      element?.scrollIntoView({ behavior: 'smooth' });
      // Clean up the URL hash without triggering navigation
      window.history.replaceState(null, '', '/');
    } else {
      router.push(`/#${elementId}`);
    }
    setNavbarOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 z-[9999] w-full transition-all duration-300 ${
        hidden ? "opacity-0 pointer-events-none" : "opacity-100"
      } ${
        scrolled && !hidden
          ? "bg-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo/provigenLogoTransparent.png"
              alt="ProviGen"
              width={160}
              height={36}
              loading="eager"
              priority
              className="h-8 lg:h-9 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {menuData.map((item) => (
              <div key={item.id}>
                {item.jumpTo ? (
                  <button
                    onClick={() => scrollToElement(item.jumpTo!)}
                    className="text-sm font-medium text-navy/70 hover:text-navy transition-colors duration-200 tracking-wide"
                  >
                    {item.title}
                  </button>
                ) : item.path ? (
                  <Link
                    href={item.path}
                    className="text-sm font-medium text-navy/70 hover:text-navy transition-colors duration-200 tracking-wide"
                  >
                    {item.title}
                  </Link>
                ) : null}
              </div>
            ))}
            <a
              href="/#contact"
              className="rounded-full bg-navy text-white px-6 py-2.5 text-sm font-medium hover:bg-navy-light transition-colors duration-200"
            >
              Get in Touch
            </a>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setNavbarOpen(!navbarOpen)}
            aria-label="Toggle menu"
            className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
          >
            <span
              className={`block h-[1.5px] w-6 bg-navy transition-all duration-300 origin-center ${
                navbarOpen ? "rotate-45 translate-y-[4.5px]" : ""
              }`}
            />
            <span
              className={`block h-[1.5px] w-6 bg-navy transition-all duration-300 ${
                navbarOpen ? "opacity-0 scale-0" : ""
              }`}
            />
            <span
              className={`block h-[1.5px] w-6 bg-navy transition-all duration-300 origin-center ${
                navbarOpen ? "-rotate-45 -translate-y-[4.5px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          navbarOpen ? "max-h-96 border-t border-black/5" : "max-h-0"
        } bg-white/95 backdrop-blur-md`}
      >
        <nav className="mx-auto max-w-7xl px-6 py-4 space-y-1">
          {menuData.map((item) => (
            <div key={item.id}>
              {item.jumpTo ? (
                <button
                  onClick={() => scrollToElement(item.jumpTo!)}
                  className="block w-full text-left py-3 text-base text-navy/70 hover:text-navy transition-colors"
                >
                  {item.title}
                </button>
              ) : item.path ? (
                <Link
                  href={item.path}
                  className="block py-3 text-base text-navy/70 hover:text-navy transition-colors"
                  onClick={() => setNavbarOpen(false)}
                >
                  {item.title}
                </Link>
              ) : null}
            </div>
          ))}
          <div className="pt-2">
            <a
              href="/#contact"
              className="inline-block rounded-full bg-navy text-white px-6 py-2.5 text-sm font-medium"
              onClick={() => setNavbarOpen(false)}
            >
              Get in Touch
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
