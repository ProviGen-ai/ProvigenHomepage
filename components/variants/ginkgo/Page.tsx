"use client";
import ScrollUp from "@/components/Common/ScrollUp";
import SectionDivider from "@/components/Common/SectionDivider";
import Hero from "./Hero";
import KPIs from "@/components/KPIs";
import Applications from "@/components/Applications";
import HowItWorks from "./HowItWorks";
import Brands from "./Brands";
import Contact from "./Contact";

const GinkgoPage = () => (
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
    <Brands />
    <SectionDivider />
    <Contact />
  </>
);

export default GinkgoPage;
