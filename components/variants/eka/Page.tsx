"use client";
import ScrollUp from "@/components/Common/ScrollUp";
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
    <KPIs dark />
    <Applications dark />
    <HowItWorks />
    <Team />
    <Contact />
  </>
);

export default EkaPage;
