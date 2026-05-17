"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Variant = "eka" | "scale";

const VariantContext = createContext<{
  variant: Variant;
  setVariant: (v: Variant) => void;
}>({
  variant: "scale",
  setVariant: () => {},
});

export const useVariant = () => useContext(VariantContext);

export const VariantProvider = ({ children }: { children: ReactNode }) => {
  const [variant, setVariantState] = useState<Variant>("scale");

  useEffect(() => {
    const saved = localStorage.getItem("design-variant") as Variant | null;
    if (saved && ["eka", "scale"].includes(saved)) {
      setVariantState(saved);
    }
  }, []);

  useEffect(() => {
    document.body.classList.remove("variant-eka", "variant-scale");
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
