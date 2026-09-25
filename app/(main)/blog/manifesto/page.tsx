import Manifesto from "./Manifesto";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifesto | ProviGen",
  description:
    "Laboratory automation infrastructure already exists. It is waiting for its intelligence upgrade.",
  // Hidden post: reachable via direct link only, kept out of search engines.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Manifesto />;
}
