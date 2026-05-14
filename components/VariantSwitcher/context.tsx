"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Variant = "ginkgo" | "eka" | "scale";

const VariantContext = createContext<{
  variant: Variant;
  setVariant: (v: Variant) => void;
}>({
  variant: "ginkgo",
  setVariant: () => {},
});

export const useVariant = () => useContext(VariantContext);

export const VariantProvider = ({ children }: { children: ReactNode }) => {
  const [variant, setVariantState] = useState<Variant>("ginkgo");

  useEffect(() => {
    const saved = localStorage.getItem("design-variant") as Variant | null;
    if (saved && ["ginkgo", "eka", "scale"].includes(saved)) {
      setVariantState(saved);
    }
  }, []);

  // Apply body class for variant-specific styles
  useEffect(() => {
    document.body.classList.remove("variant-ginkgo", "variant-eka", "variant-scale");
    document.body.classList.add(`variant-${variant}`);
  }, [variant]);

  const setVariant = (v: Variant) => {
    setVariantState(v);
    localStorage.setItem("design-variant", v);
    window.scrollTo({ top: 0 });
  };

  return (
    <VariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </VariantContext.Provider>
  );
};
