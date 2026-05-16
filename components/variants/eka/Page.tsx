"use client";
import ScrollUp from "@/components/Common/ScrollUp";
import SectionDivider from "@/components/Common/SectionDivider";
import Hero from "./Hero";
import KPIs from "@/components/KPIs";
import Applications from "@/components/Applications";
import HowItWorks from "./HowItWorks";
import Team from "./Team";
import Contact from "./Contact";

const EkaPage = () => (
  <>
    <ScrollUp />
    <Hero />
    <SectionDivider />
    <KPIs dark />
    <SectionDivider />
    <Applications dark />
    <SectionDivider />
    <HowItWorks />
    <SectionDivider />
    <Team />
    <SectionDivider />
    <Contact />
  </>
);

export default EkaPage;
