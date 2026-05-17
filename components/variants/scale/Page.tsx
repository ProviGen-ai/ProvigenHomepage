"use client";
import ScrollUp from "@/components/Common/ScrollUp";
import SectionDivider from "@/components/Common/SectionDivider";
import Hero from "./Hero";
import KPIs from "@/components/KPIs";
import Applications from "@/components/Applications";
import HowItWorks from "./HowItWorks";
import Brands from "./Brands";
import Contact from "./Contact";

const ScalePage = () => (
  <>
    <ScrollUp />
    <Hero />
    <SectionDivider />
    <KPIs />
    <SectionDivider />
    <Applications />
    <SectionDivider />
    <HowItWorks />
    <SectionDivider />
    <Contact />
    <SectionDivider />
    <Brands />
  </>
);

export default ScalePage;
