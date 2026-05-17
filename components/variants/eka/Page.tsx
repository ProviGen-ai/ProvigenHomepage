"use client";
import ScrollUp from "@/components/Common/ScrollUp";
import SectionDivider from "@/components/Common/SectionDivider";
import Hero from "./Hero";
import Applications from "@/components/Applications";
import HowItWorks from "./HowItWorks";
import Team from "./Team";
import Contact from "./Contact";

const EkaPage = () => (
  <>
    <ScrollUp />
    <Hero />
    <div className="relative overflow-hidden">
      {/* Paper texture spanning both sections */}
      {/* Paper texture — fades on desktop, extends full on mobile */}
      <div
        className="absolute inset-0 opacity-[0.25] pointer-events-none z-[2] hidden md:block"
        style={{
          backgroundImage: "url('/images/hero/paper_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.25] pointer-events-none z-[2] md:hidden"
        style={{
          backgroundImage: "url('/images/hero/paper_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          maskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 70%, transparent 95%)",
        }}
      />
      {/* Grid with circle cutout spanning both sections */}
      <div className="absolute inset-0 left-[-10%] right-[-10%] pointer-events-none z-[1] hidden md:block">
        <svg viewBox="0 0 1200 960" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <clipPath id="inverted-circle-clip">
              <path d="M0,0 H1200 V960 H0 Z M600,0 A480,480 0 1,0 600,960 A480,480 0 1,0 600,0 Z" clipRule="evenodd" />
            </clipPath>
          </defs>
          <g clipPath="url(#inverted-circle-clip)" opacity="0.04">
            {/* Horizontal — line at y=480 aligns with section boundary */}
            {Array.from({ length: 13 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 80} x2="1200" y2={i * 80} stroke="white" strokeWidth="1" />
            ))}
            {Array.from({ length: 16 }, (_, i) => (
              <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="960" stroke="white" strokeWidth="1" />
            ))}
            <circle cx="600" cy="480" r="480" fill="none" stroke="white" strokeWidth="1" />
          </g>
        </svg>
      </div>
      <HowItWorks />
      <Applications dark />
    </div>
    <SectionDivider />
    <Team />
    <SectionDivider />
    <Contact />
  </>
);

export default EkaPage;
