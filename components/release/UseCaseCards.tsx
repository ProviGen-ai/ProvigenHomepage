"use client";

import { useState } from "react";
import type React from "react";

/*
 * The use case cards (founder, 17 Nov 2026): one card at a time, a thin arrow on each side to the previous and the
 * next; past the last it comes round to the first. All cards share one grid cell, so the section keeps the height of
 * the tallest and nothing below moves when switching. The cards not shown are hidden and inert.
 */
export default function UseCaseCards({
  cards,
}: {
  cards: { key: string; label: string; node: React.ReactNode }[];
}) {
  const [at, setAt] = useState(0);
  const count = cards.length;
  const go = (step: number) => setAt((i) => (i + step + count) % count);
  if (!count) return null;
  /* One card (the user, 17 Nov 2026: the first version has Use Case #1 alone): just the card, with no arrows, no
     carousel for a screen reader and no track to slide. */
  if (count === 1)
    return <div className="r-uc r-uc--single">{cards[0].node}</div>;
  const arrow = (step: number) => (
    <button
      type="button"
      className={`r-uc-arrow r-uc-arrow--${step < 0 ? "prev" : "next"}`}
      aria-label={
        step < 0
          ? `Previous use case: ${cards[(at - 1 + count) % count].label}`
          : `Next use case: ${cards[(at + 1) % count].label}`
      }
      onClick={() => go(step)}
    >
      <svg viewBox="0 0 16 28" aria-hidden="true" focusable="false">
        <path d={step < 0 ? "M13 2 L3 14 L13 26" : "M3 2 L13 14 L3 26"} />
      </svg>
    </button>
  );
  return (
    <div
      className="r-uc"
      role="region"
      aria-roledescription="carousel"
      aria-label="Use cases"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      {count > 1 ? arrow(-1) : null}
      <div className="r-uc-track">
        {cards.map((c, i) => (
          <div
            key={c.key}
            className={i === at ? "r-uc-slide is-active" : "r-uc-slide"}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${c.label}`}
            aria-hidden={i !== at}
            inert={i !== at}
          >
            {c.node}
          </div>
        ))}
      </div>
      {count > 1 ? arrow(1) : null}
    </div>
  );
}
