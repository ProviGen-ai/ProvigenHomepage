"use client";
import { useVariant, Variant } from "./context";

const variants: { id: Variant; label: string; color: string }[] = [
  { id: "ginkgo", label: "Ginkgo", color: "bg-[#F2EEEB] text-[#0b1f30] border-[#0b1f30]/20" },
  { id: "eka", label: "Eka", color: "bg-[#1a1a1a] text-white border-white/20" },
  { id: "scale", label: "Scale", color: "bg-[#0a0a0a] text-[#05A2E6] border-[#05A2E6]/30" },
];

const Switcher = () => {
  const { variant, setVariant } = useVariant();

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex items-center gap-1 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-black/10 p-1.5">
      {variants.map((v) => (
        <button
          key={v.id}
          onClick={() => setVariant(v.id)}
          className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 border ${
            variant === v.id
              ? `${v.color} shadow-sm`
              : "bg-transparent text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
};

export default Switcher;
