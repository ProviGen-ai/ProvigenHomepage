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

  // Pages with light backgrounds need permanent dark header
  const isLightPage = pathname.startsWith("/blog/") || pathname === "/demo" || pathname === "/legal_notice" || pathname === "/privacy_policy";
  // Subpages: hide header initially, show on scroll up
  const isSubpage = (pathname.startsWith("/blog/") && pathname !== "/blog") || pathname === "/legal_notice" || pathname === "/privacy_policy" || pathname === "/demo";

  const [hidden, setHidden] = useState(isSubpage);

  useEffect(() => {
    setHidden(isSubpage);
  }, [pathname, isSubpage]);

  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 60);
      setNavbarOpen(false);
      if (isSubpage) {
        if (currentY <= 60) {
          setHidden(true);
        } else if (currentY < lastY) {
          setHidden(false);
        } else if (currentY > lastY) {
          setHidden(true);
        }
      }
      lastY = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSubpage]);

  useEffect(() => {
    setNavbarOpen(false);
  }, [pathname]);

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      router.push(`/`);
      // Wait for the page to render, then scroll to element
      const waitForElement = () => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        } else {
          requestAnimationFrame(waitForElement);
        }
      };
      setTimeout(waitForElement, 100);
    }
    setNavbarOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 z-[9999] w-full transition-all duration-500 ${
        scrolled || isLightPage ? "bg-[#0a0a0a] shadow-[0_1px_0_rgba(255,255,255,0.08)]" : ""
      } ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
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
                      scrolled || isLightPage
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
                      scrolled || isLightPage
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
        className={`lg:hidden transition-all duration-300 ${
          navbarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } absolute right-6 top-16 z-50`}
      >
        <nav className="bg-[#0a0a0a] border border-warm-tan/15 rounded-2xl shadow-2xl px-8 py-6 space-y-1 text-right min-w-[200px]">
          {navItems.filter((item) => item.title !== "Demo").map((item) => (
            <div key={item.id}>
              {item.jumpTo ? (
                <button
                  onClick={() => scrollToElement(item.jumpTo!)}
                  className="block w-full text-right py-3 text-sm font-semibold uppercase tracking-[0.15em] text-warm-tan/70 hover:text-warm-tan transition-colors"
                >
                  {item.title}
                </button>
              ) : item.path ? (
                <Link
                  href={item.path}
                  className="block py-3 text-sm font-semibold uppercase tracking-[0.15em] text-warm-tan/70 hover:text-warm-tan transition-colors text-right"
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
