import type { ReactNode } from "react";
import { release } from "@/content/release";

/*
 * The model card as its own section (comparison page, founder 16 Nov 2026: out of the FAQ, "a proper model card inspired
 * by other AI announcement posts"). The layout follows what the labs' cards share: a header with the model's name, type
 * and status (Google DeepMind's and Anthropic's model reports open this way), the specifications as a row of key facts,
 * then labelled rows for inputs, outputs, intended use, evaluation, license and citation (the sections of Mitchell et
 * al., "Model Cards for Model Reporting", 2019). The content is announcement.json's model_card, as the FAQ's card had
 * it; no training rows (founder, 30 Oct 2026). The FAQ's ModelCard (ReleaseParts.tsx) stays for the original page.
 */

/* The operating envelope's keys as the spec row names them; values as the data has them, first letter capitalised. */
const SPEC_LABEL: Record<string, string> = {
  parameters: "Experiment parameters",
  parameter_types: "Parameter types",
  batch_proposals: "Batch size",
  time_per_proposal: "Time per proposal",
};
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* Parchment (founder, 16 Nov 2026: "a bit like pergament paper", after a reference page's paper in overall register
   only): the texture is CSS (release.css, .r-mc), and these are its fibres, short curved strokes, some lighter and some
   darker than the sheet, seeded so server and client draw the same. Decorative. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const FIBRES = (() => {
  const r = rng(29);
  return Array.from({ length: 220 }, () => {
    const x = r() * 1200;
    const y = r() * 900;
    const a = r() * Math.PI * 2;
    const len = 8 + r() * 30;
    const bend = (r() - 0.5) * 10;
    const light = r() < 0.45;
    const d = `M${x.toFixed(1)},${y.toFixed(1)} Q${(x + (Math.cos(a) * len) / 2 + bend).toFixed(1)},${(
      y +
      (Math.sin(a) * len) / 2 -
      bend
    ).toFixed(
      1,
    )} ${(x + Math.cos(a) * len).toFixed(1)},${(y + Math.sin(a) * len).toFixed(1)}`;
    return {
      d,
      light,
      /* Opacities as the reference's fibres (founder, 16 Nov 2026: too strong; was 0.35-0.65 light, 0.06-0.14 dark). */
      o: light ? 0.25 + r() * 0.3 : 0.04 + r() * 0.07,
      w: 0.5 + r() * 0.7,
    };
  });
})();
function Fibres() {
  return (
    <svg
      className="r-mc-fibres"
      viewBox="0 0 1200 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {FIBRES.map((f, i) => (
        <path
          key={i}
          d={f.d}
          fill="none"
          stroke={f.light ? "rgb(255 253 246)" : "rgb(92 74 48)"}
          strokeOpacity={f.o}
          strokeWidth={f.w}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

export default function ModelCardSheet({
  evaluationHref,
  date,
  citation,
  access,
  className,
}: {
  evaluationHref?: string;
  /** The Access row's content, over the data's text (founder, 17 Nov 2026: "Via API." and the Get access button). */
  access?: ReactNode;
  /** An extra class on the card, for one page's own adjustments (17 Nov 2026). */
  className?: string;
  /** The page's announcement date, shown where the status was (founder, 16 Nov 2026). */
  date?: { iso: string; label: string };
  /** The citation, built by the page from its title, date and address (founder, 16 Nov 2026). */
  citation?: ReactNode;
}) {
  /* The card's own text where announcement.json gives it (founder, 16 Nov 2026: not overemphasised on biotech). */
  const text = release.model_card_text ?? {};
  const card = release.model_card;
  const model = release.model;
  const d = card.model_details;
  const name = [model.name, model.version].filter(Boolean).join(" ");
  const specs = Object.entries({
    ...card.operating_envelope,
    ...text.operating_envelope,
  })
    .filter(([k]) => k !== "standin")
    .map(
      ([k, v]) =>
        [
          SPEC_LABEL[k] ?? capital(k.replace(/_/g, " ")),
          capital(String(v)),
        ] as const,
    );
  /* A single item as plain text, no bullet (founder, 16 Nov 2026). */
  const list = (items: string[]) =>
    items.length === 1 ? (
      items[0]
    ) : (
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  const rows: [string, ReactNode][] = [
    ["Inputs", text.inputs ?? d.inputs],
    ["Outputs", list(text.outputs ?? d.outputs)],
    ["Intended use", list(text.intended_use ?? card.intended_use)],
    [
      "Evaluation",
      <>
        {text.evaluation_summary ?? card.evaluation_summary}
        {evaluationHref ? (
          <>
            {" "}
            <a href={evaluationHref}>See the benchmarks.</a>
          </>
        ) : null}
      </>,
    ],
    /* ["License", card.license], (16 Nov 2026: the weights are not released, so no license; access instead, as the
       labs' cards for closed models have it) */
    ...(access
      ? ([["Access", access]] as [string, ReactNode][])
      : text.access
        ? ([["Access", text.access]] as [string, ReactNode][])
        : ([["License", card.license]] as [string, ReactNode][])),
    ["Citation", citation ?? card.citation],
  ];
  return (
    <article
      className={className ? `r-mc ${className}` : "r-mc"}
      aria-label={`${name} model card`}
    >
      <Fibres />
      <header className="r-mc-head">
        <div>
          <p className="r-mc-kicker">Model card</p>
          <p className="r-mc-name">{name}</p>
          {/* Just the type (founder, 16 Nov 2026: "Sequential decision model · Foundation model for experiment design" too
              verbose). */}
          {/* <p className="r-mc-type">{d.type}</p> (founder, 16 Nov 2026: "Sequential Decision Model" is better) */}
          <p className="r-mc-type">
            {(model.full_name ?? d.type).replace(/\b\w/g, (c) =>
              c.toUpperCase(),
            )}
          </p>
        </div>
        {/* Was the status, "Announced. Access by request." (founder, 16 Nov 2026: the page's date instead). */}
        {date ? (
          <p className="r-mc-status">
            <time dateTime={date.iso}>{date.label}</time>
          </p>
        ) : (
          <p className="r-mc-status">{model.status}</p>
        )}
      </header>
      <p className="r-mc-lead">{text.one_line ?? model.one_line}</p>
      <dl className="r-mc-specs">
        {specs.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <dl className="r-mc-rows">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
