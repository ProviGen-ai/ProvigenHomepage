"use client";

import Workshop from "@/components/Workshop";
import { useEffect } from "react";

export default function WorkshopPage() {
  useEffect(() => {
    document.body.classList.add("workshop-page");
    return () => document.body.classList.remove("workshop-page");
  }, []);

  return <Workshop />;
}
