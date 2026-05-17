"use client";
import ScrollUp from "@/components/Common/ScrollUp";
import SectionDivider from "@/components/Common/SectionDivider";
import Hero from "./Hero";
import Applications from "@/components/Applications";
import HowItWorks from "./HowItWorks";
import Team from "./Team";
import Contact from "./Contact";

const EkaPage = () => (
  <>
    <ScrollUp />
    <Hero />
    <HowItWorks />
    <Applications dark />
    <SectionDivider />
    <Team />
    <SectionDivider />
    <Contact />
  </>
);

export default EkaPage;
