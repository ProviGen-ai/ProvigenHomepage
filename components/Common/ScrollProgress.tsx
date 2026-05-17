"use client";
import { useEffect, useState } from "react";

const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-[1px] left-0 w-full h-[1px] z-[99999]">
      <div
        className="h-full transition-[width] duration-75 opacity-80"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, rgba(184,149,106,0.2), #b8956a)",
        }}
      />
    </div>
  );
};

export default ScrollProgress;
