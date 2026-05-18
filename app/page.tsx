"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";

const EkaHeader = dynamic(() => import("@/components/variants/eka/Header"), { ssr: false });
const EkaFooter = dynamic(() => import("@/components/variants/eka/Footer"), { ssr: false });
const EkaPage = dynamic(() => import("@/components/variants/eka/Page"), { ssr: false });

function HomeContent() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const elementId = hash.substring(1);
      setTimeout(() => {
        document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <EkaHeader />
      <EkaPage />
      <EkaFooter />
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
