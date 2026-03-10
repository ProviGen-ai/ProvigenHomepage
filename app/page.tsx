"use client";
import { useEffect } from "react";
import Brands from "@/components/Brands";
import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import Features from "@/components/Features";
import Hero from "@/components/Hero";


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
      <Features />
      <Brands />
      <Contact />
    </>
  );
}
