"use client";
import { useEffect } from "react";
import { VariantProvider } from "@/components/VariantSwitcher/context";
import VariantLayout from "@/components/VariantSwitcher/VariantLayout";
import Switcher from "@/components/VariantSwitcher/Switcher";
import { useVariant } from "@/components/VariantSwitcher/context";
import dynamic from "next/dynamic";

const EkaPage = dynamic(() => import("@/components/variants/eka/Page"), { ssr: false });
const ScalePage = dynamic(() => import("@/components/variants/scale/Page"), { ssr: false });

const pages = { eka: EkaPage, scale: ScalePage };

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

  const { variant } = useVariant();
  const Page = pages[variant];

  return (
    <>
      <VariantLayout>
        <Page />
      </VariantLayout>
      <Switcher />
    </>
  );
}

export default function Home() {
  return (
    <VariantProvider>
      <HomeContent />
    </VariantProvider>
  );
}
