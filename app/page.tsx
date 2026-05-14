"use client";
import { useEffect } from "react";
import ScrollUp from "@/components/Common/ScrollUp";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Platform from "@/components/Platform";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Brands from "@/components/Brands";
import Contact from "@/components/Contact";


export default function Home() {
  useEffect(() => {
    // Handle hash scrolling on page load
    const hash = window.location.hash;
    if (hash) {
      const elementId = hash.substring(1); // Remove the '#'
      setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return (
    <>
      <ScrollUp />
      <Hero />
      <Problem />
      <Platform />
      <HowItWorks />
      <Features />
      <Brands />
      <Contact />
    </>
  );
}
