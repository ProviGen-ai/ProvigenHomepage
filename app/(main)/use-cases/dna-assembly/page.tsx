import type { Metadata } from "next";
import UseCaseContent from "./UseCaseContent";

export const metadata: Metadata = {
  title: "DNA Assembly & Plasmid Manufacturing | ProviGen",
  description:
    "How ProviGen turns plasmid manufacturing into a decision loop: from construct design through assembly, screening, production, purification, and QC.",
};

export default function DNAAssemblyPage() {
  return <UseCaseContent />;
}
