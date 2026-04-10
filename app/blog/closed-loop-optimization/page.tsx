import BlogPost from "./BlogPost";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Closed-Loop Experimental Campaigns in Practice | ProviGen",
  description:
    "A practical walkthrough of active learning campaigns across assay optimization, therapeutic protein engineering, and cell culture media optimization.",
};

export default function Page() {
  return <BlogPost />;
}
