const SectionDivider = ({ thickness = 1 }: { thickness?: number }) => (
  <div className="w-full" style={{ height: `${thickness}px`, backgroundColor: "#b8956a", opacity: 0.2 }} />
);

export default SectionDivider;
