"use client";
import { useVariant } from "./context";
import dynamic from "next/dynamic";

const EkaHeader = dynamic(() => import("@/components/variants/eka/Header"), { ssr: false });
const ScaleHeader = dynamic(() => import("@/components/variants/scale/Header"), { ssr: false });

const EkaFooter = dynamic(() => import("@/components/variants/eka/Footer"), { ssr: false });
const ScaleFooter = dynamic(() => import("@/components/variants/scale/Footer"), { ssr: false });

const headers = { eka: EkaHeader, scale: ScaleHeader };
const footers = { eka: EkaFooter, scale: ScaleFooter };

const VariantLayout = ({ children }: { children: React.ReactNode }) => {
  const { variant } = useVariant();
  const Header = headers[variant];
  const Footer = footers[variant];

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default VariantLayout;
