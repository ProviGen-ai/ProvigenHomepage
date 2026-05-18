"use client";
import { useEffect } from "react";
import EkaHeader from "@/components/variants/eka/Header";
import EkaFooter from "@/components/variants/eka/Footer";
import EkaPage from "@/components/variants/eka/Page";

export default function Home() {
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
