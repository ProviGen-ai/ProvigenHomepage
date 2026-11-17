"use client";

import { useState } from "react";

/*
 * A slider to tune the model card's brightness by eye (founder, 17 Nov 2026). Only on the local dev server: in a
 * production build it renders nothing. It sets --r-mc-white on the page, the share of white in the card's paper
 * (release.css); the value it shows is the one to write into the stylesheet.
 */
export default function TuneModelCard({ initial = 45 }: { initial?: number }) {
  const [v, setV] = useState(initial);
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div
      className="r-tune"
      role="group"
      aria-label="Model card brightness (dev only)"
    >
      <label>
        <span>Model card white</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={v}
          onChange={(e) => {
            const next = Number(e.target.value);
            setV(next);
            document.documentElement.style.setProperty(
              "--r-mc-white",
              `${next}%`,
            );
          }}
        />
        <output>{v}%</output>
      </label>
    </div>
  );
}
