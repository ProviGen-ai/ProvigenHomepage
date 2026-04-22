"use client";

import { useEffect } from "react";
import WorkshopResults from "@/components/Workshop/WorkshopResults";

export default function WorkshopResultsPage() {
  useEffect(() => {
    document.body.classList.add("workshop-page");
    return () => document.body.classList.remove("workshop-page");
  }, []);

  return <WorkshopResults />;
}
