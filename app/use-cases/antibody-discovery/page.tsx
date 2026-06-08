import type { Metadata } from "next";
import UseCaseContent from "./UseCaseContent";

export const metadata: Metadata = {
  title: "Antibody Discovery | ProviGen",
  description:
    "How ProviGen turns antibody discovery into a decision loop across design, build, test, and learn.",
};

export default function AntibodyDiscoveryPage() {
  return <UseCaseContent />;
}
