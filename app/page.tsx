"use client";
import { useEffect } from "react";
import { useVariant } from "@/components/VariantSwitcher/context";
import dynamic from "next/dynamic";

const GinkgoPage = dynamic(() => import("@/components/variants/ginkgo/Page"), { ssr: false });
const EkaPage = dynamic(() => import("@/components/variants/eka/Page"), { ssr: false });
const ScalePage = dynamic(() => import("@/components/variants/scale/Page"), { ssr: false });

const pages = { ginkgo: GinkgoPage, eka: EkaPage, scale: ScalePage };

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

  const { variant } = useVariant();
  const Page = pages[variant];

  return <Page />;
}
