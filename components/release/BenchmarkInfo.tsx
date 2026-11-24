"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/*
 * What each benchmark is about (comparison page, founder 15 Nov 2026): hovering or focusing a benchmark's name (or
 * tapping it) shows a small card, a picture of the benchmark and a short description next to it. The card is placed
 * against the window (position: fixed), since the table scrolls sideways and would clip it.
 *
 * Facts from content/release/announcement.json (benchmarks: heldout_search, hpo_search, cellfree_rerank /
 * discovery_cellfree).
 */

/* A small landscape with many dips and one deepest point (an Ackley-like function), drawn as a grid of shaded cells. */
function FunctionsPicture() {
  const n = 14;
  const cells: React.ReactNode[] = [];
  const at = (i: number) =>
    ((i + 0.5) / n) * 4 - 2.6; /* the deepest point off centre */
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = at(i);
      const y = at(j) + 0.4;
      const v =
        -20 * Math.exp(-0.2 * Math.sqrt((x * x + y * y) / 2)) -
        Math.exp((Math.cos(2 * Math.PI * x) + Math.cos(2 * Math.PI * y)) / 2) +
        20 +
        Math.E;
      /* low values dark: the optimum is the darkest cell */
      const shade = Math.max(0.06, 1 - v / 7);
      cells.push(
        <rect
          key={`${i}-${j}`}
          x={4 + i * 6}
          y={4 + j * 6}
          width={6}
          height={6}
          style={{ opacity: shade }}
        />,
      );
    }
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-bench-pic--map"
      aria-hidden="true"
      focusable="false"
    >
      <g className="r-bench-pic-cells">{cells}</g>
      <rect x={4} y={4} width={84} height={84} className="r-bench-pic-frame" />
      <circle
        cx={4 + (2.6 / 4) * n * 6}
        cy={4 + (2.2 / 4) * n * 6}
        r={5}
        className="r-bench-pic-ring"
      />
    </svg>
  );
}

/* The sliders and score bar (until 17 Nov 2026):
( Tuning a machine-learning model: a few settings (sliders) feed one score (a bar). )
function HpoPicture() {
  const knobs = [0.3, 0.75, 0.5, 0.15];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      {knobs.map((k, i) => {
        const y = 18 + i * 18;
        return (
          <g key={i}>
            <line x1={6} y1={y} x2={52} y2={y} className="r-bench-pic-track" />
            <circle cx={6 + k * 46} cy={y} r={4} className="r-bench-pic-knob" />
          </g>
        );
      })}
      <path
        d="M58,46 L68,46 M64,42 L68,46 L64,50"
        className="r-bench-pic-arrow"
      />
      <rect
        x={74}
        y={14}
        width={12}
        height={68}
        className="r-bench-pic-frame"
      />
      <rect x={74} y={34} width={12} height={48} className="r-bench-pic-fill" />
    </svg>
  );
}
*/
/* Tuning a machine-learning model as learning curves (founder, 17 Nov 2026: the two pictures' vertical score bars were
   boring): accuracy against training time for runs with different settings, the best one in teal, ringed at its end,
   the others grey, one poorly set run diverging (dashed). Curves computed once and kept as data. */
const HPO_CURVES = {"best": "M14.0,76.0 L19.0,57.3 L24.0,44.8 L29.0,36.3 L34.0,30.6 L39.0,26.8 L44.0,24.2 L49.0,22.5 L54.0,21.3 L59.0,20.6 L64.0,20.0 L69.0,19.7 L74.0,19.4 L79.0,19.3 L84.0,19.2", "others": ["M14.0,76.0 L19.0,64.6 L24.0,56.0 L29.0,49.6 L34.0,44.8 L39.0,41.1 L44.0,38.4 L49.0,36.3 L54.0,34.8 L59.0,33.6 L64.0,32.8 L69.0,32.1 L74.0,31.6 L79.0,31.2 L84.0,31.0", "M14.0,76.0 L19.0,69.1 L24.0,63.5 L29.0,59.0 L34.0,55.2 L39.0,52.2 L44.0,49.7 L49.0,47.7 L54.0,46.1 L59.0,44.7 L64.0,43.6 L69.0,42.7 L74.0,42.0 L79.0,41.4 L84.0,40.9", "M14.0,76.0 L19.0,65.2 L24.0,56.7 L29.0,50.0 L34.0,44.8 L39.0,40.6 L44.0,37.3 L49.0,34.8 L54.0,32.7 L59.0,31.1 L64.0,29.9 L69.0,28.9 L74.0,28.1 L79.0,27.5 L84.0,27.0"], "diverge": "M14.0,76.0 L19.0,63.1 L24.0,55.1 L29.0,50.1 L34.0,47.0 L39.0,45.1 L44.0,43.9 L49.0,43.1 L54.0,43.2 L59.0,44.5 L64.0,47.0 L69.0,50.6 L74.0,55.3 L79.0,61.1 L84.0,68.0"};
function HpoPicture() {
  return (
    <svg viewBox="0 0 92 92" className="r-bench-pic" aria-hidden="true" focusable="false">
      <path d="M14,10 L14,76 L88,76" className="r-bench-pic-frame" />
      {HPO_CURVES.others.map((d, k) => (
        <path key={k} d={d} className="r-bench-pic-run" />
      ))}
      <path d={HPO_CURVES.diverge} className="r-bench-pic-run r-bench-pic-run--failed" />
      <path d={HPO_CURVES.best} className="r-bench-pic-run r-bench-pic-run--best" />
      <circle cx={84.0} cy={19.2} r={4.5} className="r-bench-pic-ring" />
    </svg>
  );
}

/* A plate of reagent mixes, each well shaded by how much protein it made; one well the best. */
function CellFreePicture() {
  /* const rows = 5; */
  /* A 24-well plate, 4 rows of 6 (founder, 16 Nov 2026). */
  const rows = 4;
  const cols = 6;
  const wells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const v = (Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
      const shade = 0.12 + 0.6 * Math.abs(v);
      const best = r === 1 && c === 4;
      wells.push(
        <circle
          key={`${r}-${c}`}
          /* cx={13 + c * 13.2} cy={20 + r * 13.2} r={5} (the 5 x 6 plate) */
          cx={13 + c * 13.2}
          cy={24 + r * 14.6}
          r={5.6}
          className={
            best
              ? "r-bench-pic-well r-bench-pic-well--best"
              : "r-bench-pic-well"
          }
          style={best ? undefined : { fillOpacity: shade }}
        />,
      );
    }
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-bench-pic--plate"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x={4}
        y={10}
        width={84}
        height={72}
        rx={4}
        className="r-bench-pic-frame"
      />
      {wells}
    </svg>
  );
}

/* A reaction: two starting materials, an arrow, the product; below, the conditions to choose (catalyst, ligand, base,
   solvent), one choice ringed. */
function ReactionPicture() {
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      <polygon points={hex(14, 26, 8)} className="r-bench-pic-frame" />
      <path d="M26,26 L32,26 M29,23 L29,29" className="r-bench-pic-arrow" />
      <polygon points={hex(42, 26, 8)} className="r-bench-pic-frame" />
      <path
        d="M54,26 L64,26 M60,22 L64,26 L60,30"
        className="r-bench-pic-arrow"
      />
      <polygon points={hex(72, 22, 6)} className="r-bench-pic-fill" />
      <polygon points={hex(82, 30, 6)} className="r-bench-pic-fill" />
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3, 4].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={10 + col * 15}
            y={46 + row * 10}
            width={11}
            height={6}
            rx={1.5}
            className="r-bench-pic-well"
            style={{ fillOpacity: 0.15 + 0.12 * ((row * 3 + col * 7) % 5) }}
          />
        )),
      )}
      <circle
        cx={10 + 3 * 15 + 5.5}
        cy={46 + 10 + 3}
        r={7}
        className="r-bench-pic-ring"
      />
    </svg>
  );
}

/* Materials: measured samples over two settings, the best one ringed. */
function MaterialsPicture() {
  const dots: React.ReactNode[] = [];
  for (let k = 0; k < 26; k++) {
    const x = 12 + ((k * 37) % 70);
    const y = 12 + ((k * 53 + 11) % 66);
    dots.push(
      <circle
        key={k}
        cx={x}
        cy={y}
        r={2.6}
        className="r-bench-pic-well"
        style={{
          fillOpacity: 0.2 + 0.5 * (1 - Math.hypot(x - 64, y - 30) / 80),
        }}
      />,
    );
  }
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-bench-pic--materials"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6,6 L6,86 L86,86" className="r-bench-pic-track" />
      {dots}
      <circle
        cx={64}
        cy={30}
        r={3}
        className="r-bench-pic-well r-bench-pic-well--best"
      />
      <circle cx={64} cy={30} r={6.5} className="r-bench-pic-ring" />
    </svg>
  );
}

/* A cantilever frame: built into a wall on the left, bars between its joints, a load hanging from the far corner. */
function TrussPicture() {
  const top = 30;
  const bottom = 58;
  const xs = [14, 36, 58, 80];
  const bars: [number, number, number, number][] = [];
  for (let i = 0; i < 3; i++) {
    bars.push([xs[i], top, xs[i + 1], top], [xs[i], bottom, xs[i + 1], bottom]);
    bars.push(
      i % 2 === 0
        ? [xs[i], top, xs[i + 1], bottom]
        : [xs[i], bottom, xs[i + 1], top],
    );
  }
  for (let i = 1; i < 4; i++) bars.push([xs[i], top, xs[i], bottom]);
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10,20 L10,68 M10,26 L4,32 M10,38 L4,44 M10,50 L4,56 M10,62 L4,68"
        className="r-bench-pic-track"
      />
      {bars.map(([x1, y1, x2, y2], k) => (
        <line
          key={k}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          className="r-bench-pic-arrow"
        />
      ))}
      {xs.flatMap((x) =>
        [top, bottom].map((y) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={2.2}
            className="r-bench-pic-knob"
          />
        )),
      )}
      <path
        d="M80,60 L80,78 M76,74 L80,78 L84,74"
        className="r-bench-pic-ring"
      />
    </svg>
  );
}

/* Self-assembly: loose tiles on the left, an assembled chain of them on the right. */
function AssemblyPicture() {
  const loose = [
    [10, 16],
    [26, 30],
    [12, 46],
    [30, 60],
    [14, 74],
    [34, 14],
  ];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      {loose.map(([x, y], k) => (
        <rect
          key={k}
          x={x}
          y={y}
          width={8}
          height={8}
          rx={1.5}
          className="r-bench-pic-well"
          style={{ fillOpacity: 0.35 }}
          transform={`rotate(${((k * 23) % 40) - 20} ${x + 4} ${y + 4})`}
        />
      ))}
      <path
        d="M44,46 L52,46 M49,43 L52,46 L49,49"
        className="r-bench-pic-arrow"
      />
      {Array.from({ length: 8 }, (_, k) => (
        <rect
          key={k}
          x={58 + (k % 2) * 11}
          y={18 + Math.floor(k / 2) * 15}
          width={10}
          height={14}
          rx={1.5}
          className="r-bench-pic-well r-bench-pic-well--best"
        />
      ))}
    </svg>
  );
}

/* Tuning a machine-learning model on a dataset: a small decision tree, and its accuracy as a bar. */
/* The tree with a score bar (until 17 Nov 2026):
function BayesmarkPicture() {
  const nodes: [number, number][] = [
    [32, 16],
    [18, 38],
    [46, 38],
    [10, 62],
    [26, 62],
    [38, 62],
    [54, 62],
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
  ];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      {edges.map(([a, b], k) => (
        <line
          key={k}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          className="r-bench-pic-track"
        />
      ))}
      {nodes.map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r={4} className="r-bench-pic-knob" />
      ))}
      <rect
        x={74}
        y={14}
        width={12}
        height={68}
        className="r-bench-pic-frame"
      />
      <rect x={74} y={26} width={12} height={56} className="r-bench-pic-fill" />
    </svg>
  );
}
*/
/* The data the tree splits (17 Nov 2026), points as [x, y, class], fixed. */
const TREE_POINTS: [number, number, string][] = [[62.8, 27.1, "b"], [65.1, 25.7, "a"], [64.3, 30.7, "a"], [60.9, 33.1, "a"], [60.8, 52.1, "a"], [61.0, 47.7, "b"], [63.5, 57.2, "b"], [61.4, 49.4, "b"], [79.4, 31.1, "a"], [78.8, 27.3, "b"], [83.2, 24.8, "b"], [81.9, 26.5, "b"], [74.1, 39.2, "b"], [75.9, 55.3, "a"], [74.5, 49.9, "a"], [79.5, 45.1, "a"]];
function BayesmarkPicture() {
  const nodes: [number, number][] = [
    [26, 16],
    [14, 38],
    [38, 38],
    [8, 62],
    [20, 62],
    [32, 62],
    [44, 62],
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [2, 6],
  ];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      {edges.map(([a, b], k) => (
        <line
          key={k}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          className="r-bench-pic-track"
        />
      ))}
      {nodes.map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r={4} className="r-bench-pic-knob" />
      ))}
      {/* Was a score gauge (founder, 17 Nov 2026: "I don't like the round target"): now what the tree does, its three
          splits cutting a small square of data into regions, each tinted by the class it predicts, with points of
          both classes, one per region on the wrong side (a good model, not a perfect one). */}
      <path d="M47,40 L54,40 M51,37 L54,40 L51,43" className="r-bench-pic-arrow" />
      <rect x={58} y={22} width={12} height={22} className="r-bench-pic-region r-bench-pic-region--a" />
      <rect x={58} y={44} width={12} height={18} className="r-bench-pic-region r-bench-pic-region--b" />
      <rect x={70} y={22} width={16} height={12} className="r-bench-pic-region r-bench-pic-region--b" />
      <rect x={70} y={34} width={16} height={28} className="r-bench-pic-region r-bench-pic-region--a" />
      <rect x={58} y={22} width={28} height={40} className="r-bench-pic-frame" />
      <path d="M70,22 L70,62" className="r-bench-pic-split" />
      <path d="M58,44 L70,44" className="r-bench-pic-split" />
      <path d="M70,34 L86,34" className="r-bench-pic-split" />
      {TREE_POINTS.map(([x, y, c], k) => (
        <circle key={k} cx={x} cy={y} r={1.7} className={`r-bench-pic-point r-bench-pic-point--${c}`} />
      ))}
    </svg>
  );
}

/* The two flat L outlines (until 17 Nov 2026):
( Parametric CAD: the hidden target part (filled), a candidate built from other settings (outline) close to it, and a
   setting that fails to build (a cross). )
function CadPicture() {
  const part = "M14,70 L14,30 L34,30 L34,52 L74,52 L74,70 Z";
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      <path d={part} className="r-bench-pic-fill" />
      <path
        d="M18,66 L18,26 L40,26 L40,48 L78,48 L78,66 Z"
        className="r-bench-pic-frame"
      />
      {( <circle cx={58} cy={61} r={4} className="r-bench-pic-well" style={{ fillOpacity: 0.9 }} /> (founder, 16 Nov 2026: no dot) )}
      {( <path d="M66,14 L76,24 M76,14 L66,24" className="r-bench-pic-arrow" /> (founder, 16 Nov 2026: no cross) )}
    </svg>
  );
}
*/
/* Parametric CAD as an engineering drawing (founder, 17 Nov 2026: a new graphic; was two flat L outlines, the target
   filled and a candidate over it): an L-bracket with two bolt holes, its driving dimensions with arrowheads, the one
   being searched in orange, and the hidden target behind it as a dashed outline of the same part at other settings. */
const CAD_PART = "M14,16 L32,16 L32,44 L62,44 L62,62 L14,62 Z";
const CAD_TARGET = "M14,16 L26,16 L26,38 L74,38 L74,62 L14,62 Z";
const CAD_HOLES: [number, number][] = [
  [23, 26],
  [52, 53],
];
/* The extension lines the dimensions are measured between. */
const CAD_EXT = ["M14,64 L14,77", "M62,64 L62,77", "M34,16 L83,16", "M64,62 L83,62"];
function CadPicture() {
  const r = 4.2;
  return (
    <svg viewBox="0 0 92 92" className="r-bench-pic" aria-hidden="true" focusable="false">
      <path d={CAD_TARGET} className="r-bench-pic-ghost" />
      <path d={CAD_PART} className="r-bench-pic-part" />
      {CAD_HOLES.map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r} className="r-bench-pic-hole" />
          <path
            d={`M${cx - r - 2},${cy} L${cx + r + 2},${cy} M${cx},${cy - r - 2} L${cx},${cy + r + 2}`}
            className="r-bench-pic-centre"
          />
        </g>
      ))}
      {CAD_EXT.map((d, k) => (
        <path key={k} d={d} className="r-bench-pic-ext" />
      ))}
      {/* The height, fixed; the width, the setting being searched. */}
      <path d="M80,16 L80,62" className="r-bench-pic-dim" />
      <path d="M78,19 L80,16 L82,19 M78,59 L80,62 L82,59" className="r-bench-pic-dim r-bench-pic-dim--tip" />
      <path d="M14,74 L62,74" className="r-bench-pic-dim r-bench-pic-dim--driving" />
      <path
        d="M17,72 L14,74 L17,76 M59,72 L62,74 L59,76"
        className="r-bench-pic-dim r-bench-pic-dim--driving r-bench-pic-dim--tip"
      />
    </svg>
  );
}

/* Cell-culture media (biofoundrydemo-ai-09, 16 Nov 2026): a culture dish, its cells grown thicker in one part. */
/* Was the dish of dots (founder, 17 Nov 2026: read as colony picking):
function MediaPicture() {
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39996;
    const r = 30 * Math.sqrt((i + 0.5) / 26);
    cells.push(
      <circle
        key={i}
        cx={46 + r * Math.cos(a)}
        cy={46 + r * Math.sin(a)}
        r={3.2}
        className="r-bench-pic-well"
        style={{
          fillOpacity: 0.2 + 0.5 * Math.max(0, Math.cos(a - 0.8)) * (r / 30),
        }}
      />,
    );
  }
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={46} cy={46} r={38} className="r-bench-pic-frame" />
      {cells}
    </svg>
  );
}
*/
/* A media formulation (founder, 17 Nov 2026: the dish of dots read as colony picking): the components' concentrations
   as bars, mixed into a bottle of medium with cells growing in it. */
/* Was with a media bottle (founder, 17 Nov 2026: a T flask instead):
function MediaPicture() {
  const bars = [30, 14, 42, 22, 34];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-bench-pic--media"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((h, i) => (
        <rect
          key={i}
          x={6 + i * 7}
          y={80 - h}
          width={5}
          height={h}
          className="r-bench-pic-fill"
          style={{ opacity: 0.45 + 0.1 * i }}
        />
      ))}
      <line x1={4} y1={80.5} x2={42} y2={80.5} className="r-bench-pic-frame" />
      <path
        d="M44,52 L52,52 M49,49 L52,52 L49,55"
        className="r-bench-pic-arrow"
      />
      <rect
        x={66}
        y={10}
        width={12}
        height={7}
        rx={1}
        className="r-bench-pic-frame"
      />
      <path
        d="M57,52 L87,52 L87,80 Q87,83 84,83 L60,83 Q57,83 57,80 Z"
        className="r-bench-pic-fill"
        style={{ opacity: 0.3 }}
      />
      <path
        d="M68,17 L68,26 Q56,30 56,40 L56,80 Q56,84 60,84 L84,84 Q88,84 88,80 L88,40 Q88,30 76,26 L76,17 Z"
        className="r-bench-pic-frame"
      />
      {[
        [64, 64],
        [72, 73],
        [80, 61],
        [67, 77],
        [81, 75],
      ].map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={2.2}
          className="r-bench-pic-knob"
        />
      ))}
    </svg>
  );
}
*/
function MediaPicture() {
  const bars = [30, 14, 42, 22, 34];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-bench-pic--media"
      aria-hidden="true"
      focusable="false"
    >
      {bars.map((h, i) => (
        <rect
          key={i}
          x={6 + i * 7}
          y={80 - h}
          width={5}
          height={h}
          className="r-bench-pic-fill"
          style={{ opacity: 0.45 + 0.1 * i }}
        />
      ))}
      <line x1={4} y1={80.5} x2={42} y2={80.5} className="r-bench-pic-frame" />
      <path
        d="M44,62 L51,62 M48,59 L51,62 L48,65"
        className="r-bench-pic-arrow"
      />
      {/* The flask lying flat, before the photo (17 Nov 2026):
      ( A T flask lying flat (founder, 17 Nov 2026: was a media bottle): the medium over its floor, cells on it,
          the neck angled up at one corner with its cap. )
      <path
        d="M53,66 L81,66 L81,76 Q81,79 78,79 L56,79 Q53,79 53,76 Z"
        className="r-bench-pic-fill"
        style={{ opacity: 0.3 }}
      />
      <path
        d="M56,46 L74,46 L79.7,40.3 L87.7,48.3 L82,54 L82,76 Q82,80 78,80 L56,80 Q52,80 52,76 L52,50 Q52,46 56,46 Z"
        className="r-bench-pic-frame"
      />
      <path
        d="M79.7,40.3 L83.9,36.1 L91.9,44.1 L87.7,48.3 Z"
        className="r-bench-pic-frame"
      />
      {[
        [58, 75],
        [64, 73],
        [70, 76],
        [76, 73.5],
      ].map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={2.1}
          className="r-bench-pic-knob"
        />
      ))}
      */}
      {/* A T flask, upright as in the founder's photo (17 Nov 2026): a rectangular body, shoulders tapering to a short
          neck, an orange cap; the medium in its lower part with cells in it. Was the flask lying flat. */}
      {/* Slightly 3D (founder, 17 Nov 2026): the flask's right side and the cap's top seen at an angle, 5 units deep;
          the medium's surface and its side within. */}
      <path
        d="M84,44 L78,31 L83,28 L89,41 L89,81 L84,84 Z"
        className="r-bench-pic-side"
      />
      <path
        d="M84,62 L89,59 L89,81 L84,84 Z"
        className="r-bench-pic-fill"
        style={{ opacity: 0.2 }}
      />
      <path
        d="M59,62 L83,62 L88,59 L64,59 Z"
        className="r-bench-pic-fill"
        style={{ opacity: 0.15 }}
      />
      <path
        d="M59,62 L83,62 L83,82 Q83,83 82,83 L60,83 Q59,83 59,82 Z"
        className="r-bench-pic-fill"
        style={{ opacity: 0.3 }}
      />
      {/* Was d="M58,40 ... L84,40 L76,26 L76,20 L66,20 L66,26 Z", shoulders to a narrow neck (founder, 17 Nov 2026: the
          upper part is a trapezoid, the cap no wider than its top) */}
      <path
        d="M58,44 L58,82 Q58,84 60,84 L82,84 Q84,84 84,82 L84,44 L78,31 L64,31 Z"
        className="r-bench-pic-frame"
      />
      {/* The neck in 3D too (founder, 17 Nov 2026): the flat top of the trapezoid around it, and its right side. */}
      <path d="M64,31 L78,31 L83,28 L69,28 Z" className="r-bench-pic-side" />
      {/* Level again (founder, 17 Nov 2026): the curves' chords parallel to the trapezoid's upper edge, which is
          horizontal; the neck 2 high (was 3, founder: even shorter), the cap 14 wide, both centred on the flat top. The tilted version below is kept. */}
      {/* The neck 3 high (was 4) and the neck and cap as circles lying in the flat top's plane, in the body's view (one
          unit of depth to (0.5, -0.3)): their curves tilt with the plane, the chord between a curve's ends parallel to
          the neck's base; the cap's radius so that it is as wide as the flat top (founder, 17 Nov 2026, checked as an
          image). */}
      {/* The neck and the cap, centred on the flat top in the same view as the body (founder, 17 Nov 2026: the body is
          right, the neck and the lid were off; checked as an image). Was a neck in the front outline with a side face,
          and a cap at the front edge. */}
      <path
        d="M69.5,29.5 L69.5,27.5 L77.5,27.5 L77.5,29.5 A4,1.2 0 0 1 69.5,29.5 Z"
        className="r-bench-pic-neck"
      />
      {/* The box cap (17 Nov 2026):
      ( Square corners, a box (founder, 17 Nov 2026: was rx 1.5, round). )
      <rect x={64} y={17} width={14} height={10} className="r-bench-pic-cap" />
      <path
        d="M64,17 L66.7,14.6 L80.7,14.6 L78,17 Z"
        className="r-bench-pic-cap r-bench-pic-cap--top"
      />
      <path
        d="M78,17 L80.7,14.6 L80.7,24.6 L78,27 Z"
        className="r-bench-pic-cap r-bench-pic-cap--side"
      />
      */}
      {/* A round screw cap, a cylinder (founder, 17 Nov 2026: round, seen from slightly above): its body with a curved
          lower edge, and its top as an ellipse. Was a box (front rect, top and side faces). */}
      <path
        d="M66.5,18.5 L66.5,27.5 A7,1.8 0 0 0 80.5,27.5 L80.5,18.5 Z"
        className="r-bench-pic-cap"
      />
      {/* The lid's side in 3D, as the flask's (founder, 17 Nov 2026): a darker band on its right, between its top and
          bottom curves, from x 79 to its edge (half as wide, founder; was from 77.5). */}
      <path
        d="M79,19.61 A7,1.8 0 0 0 80.5,18.5 L80.5,27.5 A7,1.8 0 0 1 79,28.61 Z"
        className="r-bench-pic-cap r-bench-pic-cap--side"
      />
      {/* The lid's outline drawn again over the band, so the band itself needs no line: its left edge shows no stroke,
          only its colour (founder, 17 Nov 2026). */}
      <path
        d="M66.5,18.5 L66.5,27.5 A7,1.8 0 0 0 80.5,27.5 L80.5,18.5 Z"
        className="r-bench-pic-cap-line"
      />
      <ellipse
        cx={73.5}
        cy={18.5}
        rx={7}
        ry={1.8}
        className="r-bench-pic-cap r-bench-pic-cap--top"
      />
      {[
        [64, 76],
        [70, 71],
        [77, 77],
        [71, 80],
      ].map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={2.1}
          className="r-bench-pic-knob"
        />
      ))}
    </svg>
  );
}

/* Was a chain of residues, four of them the sites varied (founder, 16 Nov 2026: a protein structure instead):
 * function ProteinPicture() {
 *   const sites = [3, 4, 5, 9];
 *   return (
 *     <svg
 *       viewBox="0 0 92 92"
 *       className="r-bench-pic"
 *       aria-hidden="true"
 *       focusable="false"
 *     >
 *       {Array.from({ length: 12 }, (_, i) => {
 *         const x = 10 + (i % 6) * 14.4;
 *         const y = i < 6 ? 34 : 62;
 *         return (
 *           <circle
 *             key={i}
 *             cx={i < 6 ? x : 92 - x}
 *             cy={y}
 *             r={sites.includes(i) ? 6 : 4}
 *             className={
 *               sites.includes(i)
 *                 ? "r-bench-pic-well r-bench-pic-well--best"
 *                 : "r-bench-pic-well"
 *             }
 *             style={sites.includes(i) ? undefined : { fillOpacity: 0.25 }}
 *           />
 *         );
 *       })}
 *     </svg>
 *   );
 * }
 */
/* Protein engineering as a protein structure (founder, 16 Nov 2026), drawn as a ribbon cartoon after GB1's fold: an
   alpha helix (the coil) over a sheet of four antiparallel beta strands (the arrows), joined by loops. The four rings
   mark the varied sites; three neighbours in one loop and one apart, as GB1's 39, 40, 41 and 54. Decorative. */
const HELIX = (() => {
  const turns = 4.5;
  const max = turns * 2 * Math.PI;
  return Array.from({ length: 121 }, (_, i) => {
    const t = (i / 120) * max;
    const x = 16 + (60 * t) / max + 4 * Math.sin(t);
    const y = 18 - 6 * Math.cos(t);
    return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
})();
/* A strand as an arrow from (x, from) to its tip at (x, to). */
const strand = (x: number, from: number, to: number) => {
  const d = Math.sign(to - from);
  const neck = to - d * 7;
  return [
    [x - 3, from],
    [x + 3, from],
    [x + 3, neck],
    [x + 5.5, neck],
    [x, to],
    [x - 5.5, neck],
    [x - 3, neck],
  ]
    .map(([a, b]) => `${a},${b}`)
    .join(" ");
};
function ProteinPicture() {
  const sites: [number, number][] = [
    [50.8, 83.1],
    [55, 86],
    [59.2, 83.1],
    [62, 56],
  ];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-bench-pic--protein"
      aria-hidden="true"
      focusable="false"
    >
      {/* Loops: the helix down to the first strand, between the strands, and the two ends. */}
      <path
        d="M84,16 Q82,22 76,24 M16,12 Q6,22 20,38 M20,78 Q27,90 34,78 M34,38 Q41,28 48,38 M48,78 Q55,94 62,78 M62,38 Q68,28 76,33"
        className="r-bench-pic-arrow"
      />
      <polygon points={strand(20, 38, 78)} className="r-bench-pic-fill" />
      <polygon points={strand(34, 78, 38)} className="r-bench-pic-fill" />
      <polygon points={strand(48, 38, 78)} className="r-bench-pic-fill" />
      <polygon points={strand(62, 78, 38)} className="r-bench-pic-fill" />
      <path d={HELIX} className="r-bench-pic-helix" />
      {sites.map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={2.1}
          className="r-bench-pic-well r-bench-pic-well--best"
        />
      ))}
    </svg>
  );
}

/* Chemistry and materials as one benchmark (founder, 16 Nov 2026): both pictures, the reaction above the materials. */
function ChemMatPicture() {
  return (
    <span className="r-bench-pics">
      <ReactionPicture />
      <MaterialsPicture />
      {/* RECOB, merged in (founder, 17 Nov 2026): its response surface. */}
      <RecobPicture />
      {/* The perovskites, merged in as one task (founder, 17 Nov 2026): their unit cell. */}
      <PerovskitePicture />
    </span>
  );
}

/* A perovskite unit cell, for the HOIP perovskites (founder, 17 Nov 2026: a graphic for perovskite): ABX3 seen front
   on, its depth receding up and right; the cube's corners the A-site cations (orange; the organic cation in a hybrid
   perovskite), the BX6 octahedron in the middle (its visible faces shaded teal, its back edges dashed, the six X atoms
   at its tips and B at its centre). Geometry computed once and kept as data. */
/* The first perovskite cell (17 Nov 2026):
const PEROVSKITE = {"cubeFront": ["M8.0,82.0 L8.0,34.0", "M8.0,82.0 L56.0,82.0", "M8.0,34.0 L28.0,18.0", "M8.0,34.0 L56.0,34.0", "M28.0,18.0 L76.0,18.0", "M56.0,82.0 L76.0,66.0", "M56.0,82.0 L56.0,34.0", "M76.0,66.0 L76.0,18.0", "M56.0,34.0 L76.0,18.0"], "cubeBack": ["M8.0,82.0 L28.0,66.0", "M28.0,66.0 L28.0,18.0", "M28.0,66.0 L76.0,66.0"], "faces": [{"d": "M26.2,50.0 L42.0,34.2 L35.4,55.3 Z", "shade": 0.3}, {"d": "M57.8,50.0 L42.0,65.8 L35.4,55.3 Z", "shade": 0.24}, {"d": "M57.8,50.0 L42.0,34.2 L48.6,44.7 Z", "shade": 0.36}, {"d": "M57.8,50.0 L42.0,34.2 L35.4,55.3 Z", "shade": 0.36}], "octFront": ["M42.0,65.8 L35.4,55.3", "M26.2,50.0 L42.0,34.2", "M26.2,50.0 L35.4,55.3", "M48.6,44.7 L42.0,34.2", "M42.0,65.8 L57.8,50.0", "M35.4,55.3 L42.0,34.2", "M35.4,55.3 L57.8,50.0", "M42.0,34.2 L57.8,50.0", "M48.6,44.7 L57.8,50.0"], "octBack": ["M42.0,65.8 L48.6,44.7", "M26.2,50.0 L48.6,44.7", "M26.2,50.0 L42.0,65.8"], "corners": [[8, 82], [8, 34], [28, 18], [56, 82], [76, 66], [56, 34], [76, 18]], "x": [[57.8, 50], [42, 34.2], [35.4, 55.3], [26.2, 50]], "b": [42, 50]};
function PerovskitePicture() {
  const P = PEROVSKITE;
  return (
    <svg viewBox="0 0 92 92" className="r-bench-pic" aria-hidden="true" focusable="false">
      {P.cubeBack.map((d, k) => (
        <path key={`cb${k}`} d={d} className="r-bench-pic-frame r-bench-pic-frame--back" />
      ))}
      {P.octBack.map((d, k) => (
        <path key={`ob${k}`} d={d} className="r-bench-pic-oct r-bench-pic-oct--back" />
      ))}
      {P.faces.map((f, k) => (
        <path key={`f${k}`} d={f.d} className="r-bench-pic-fill" style={{ opacity: f.shade * 1.5 }} />
      ))}
      {P.octFront.map((d, k) => (
        <path key={`of${k}`} d={d} className="r-bench-pic-oct" />
      ))}
      {P.cubeFront.map((d, k) => (
        <path key={`cf${k}`} d={d} className="r-bench-pic-frame" />
      ))}
      <circle cx={P.b[0]} cy={P.b[1]} r={1.6} className="r-bench-pic-fill" style={{ opacity: 0.5 }} />
      {P.x.map(([x, y], k) => (
        <circle key={`x${k}`} cx={x} cy={y} r={2} className="r-bench-pic-atom-dot" />
      ))}
      {P.corners.map(([x, y], k) => (
        <circle key={`a${k}`} cx={x} cy={y} r={3.4} className="r-bench-pic-cation" />
      ))}
    </svg>
  );
}
*/
/* Was the octahedron smaller, floating inside the cell, its back faces empty (founder, 17 Nov 2026: "maybe some lines
   or faces are missing"): now the textbook picture, the six X atoms on the centres of the cube's faces, the back faces
   faintly filled so it reads as a solid, the hidden corner's cation faint. Checked as an image. */
/* The second perovskite cell (17 Nov 2026):
const PEROVSKITE = {"cubeFront": ["M8.0,82.0 L8.0,34.0", "M8.0,82.0 L56.0,82.0", "M8.0,34.0 L28.0,18.0", "M8.0,34.0 L56.0,34.0", "M28.0,18.0 L76.0,18.0", "M56.0,82.0 L76.0,66.0", "M56.0,82.0 L56.0,34.0", "M76.0,66.0 L76.0,18.0", "M56.0,34.0 L76.0,18.0"], "cubeBack": ["M8.0,82.0 L28.0,66.0", "M28.0,66.0 L28.0,18.0", "M28.0,66.0 L76.0,66.0"], "facesBack": ["M18.0,50.0 L42.0,74.0 L52.0,42.0 Z", "M18.0,50.0 L42.0,74.0 L32.0,58.0 Z", "M18.0,50.0 L42.0,26.0 L52.0,42.0 Z", "M66.0,50.0 L42.0,74.0 L52.0,42.0 Z"], "facesFront": [{"d": "M18.0,50.0 L42.0,26.0 L32.0,58.0 Z", "shade": 0.46}, {"d": "M66.0,50.0 L42.0,74.0 L32.0,58.0 Z", "shade": 0.38}, {"d": "M66.0,50.0 L42.0,26.0 L52.0,42.0 Z", "shade": 0.54}, {"d": "M66.0,50.0 L42.0,26.0 L32.0,58.0 Z", "shade": 0.54}], "octFront": ["M42.0,26.0 L66.0,50.0", "M52.0,42.0 L42.0,26.0", "M52.0,42.0 L66.0,50.0", "M32.0,58.0 L42.0,26.0", "M32.0,58.0 L66.0,50.0", "M42.0,74.0 L66.0,50.0", "M42.0,74.0 L32.0,58.0", "M18.0,50.0 L42.0,26.0", "M18.0,50.0 L32.0,58.0"], "octBack": ["M42.0,74.0 L52.0,42.0", "M18.0,50.0 L52.0,42.0", "M18.0,50.0 L42.0,74.0"], "corners": [[8, 82], [8, 34], [28, 18], [56, 82], [76, 66], [56, 34], [76, 18]], "cornerHidden": [28, 66], "x": [[66.0, 50], [18.0, 50], [42, 26.0], [42, 74.0], [52.0, 42.0], [32.0, 58.0]], "b": [42, 50]};
function PerovskitePicture() {
  const P = PEROVSKITE;
  return (
    <svg viewBox="0 0 92 92" className="r-bench-pic" aria-hidden="true" focusable="false">
      {P.cubeBack.map((d, k) => (
        <path key={`cb${k}`} d={d} className="r-bench-pic-frame r-bench-pic-frame--back" />
      ))}
      {P.facesBack.map((d, k) => (
        <path key={`fb${k}`} d={d} className="r-bench-pic-fill" style={{ opacity: 0.16 }} />
      ))}
      {P.octBack.map((d, k) => (
        <path key={`ob${k}`} d={d} className="r-bench-pic-oct r-bench-pic-oct--back" />
      ))}
      <circle cx={P.b[0]} cy={P.b[1]} r={2.2} className="r-bench-pic-b" />
      {P.facesFront.map((f, k) => (
        <path key={`f${k}`} d={f.d} className="r-bench-pic-fill" style={{ opacity: f.shade * 1.33 }} />
      ))}
      {P.octFront.map((d, k) => (
        <path key={`of${k}`} d={d} className="r-bench-pic-oct" />
      ))}
      {P.cubeFront.map((d, k) => (
        <path key={`cf${k}`} d={d} className="r-bench-pic-frame" />
      ))}
      {P.x.map(([x, y], k) => (
        <circle key={`x${k}`} cx={x} cy={y} r={2.1} className="r-bench-pic-atom-dot" />
      ))}
      <circle cx={P.cornerHidden[0]} cy={P.cornerHidden[1]} r={3} className="r-bench-pic-cation" style={{ opacity: 0.5 }} />
      {P.corners.map(([x, y], k) => (
        <circle key={`a${k}`} cx={x} cy={y} r={3.4} className="r-bench-pic-cation" />
      ))}
    </svg>
  );
}
*/
/* Fixed (founder, 17 Nov 2026, marked on a screenshot): which faces face the viewer is now computed from this oblique
   projection's true viewing direction (10/24, 8/24, -1), not (1, 1, -1), so the octahedron's four front faces are the
   solid ones (the front-bottom-left face was drawn as a back face, too light); no dot at the centre; the cation at the
   hidden back corner drawn as the others. Checked as an image. */
/* With the octahedron spanning the cell, its X atoms on the face centres (17 Nov 2026; founder: smaller again, as at
   first):
const PEROVSKITE = {"cubeFront": ["M8.0,82.0 L8.0,34.0", "M8.0,82.0 L56.0,82.0", "M8.0,34.0 L28.0,18.0", "M8.0,34.0 L56.0,34.0", "M28.0,18.0 L76.0,18.0", "M56.0,82.0 L76.0,66.0", "M56.0,82.0 L56.0,34.0", "M76.0,66.0 L76.0,18.0", "M56.0,34.0 L76.0,18.0"], "cubeBack": ["M8.0,82.0 L28.0,66.0", "M28.0,66.0 L28.0,18.0", "M28.0,66.0 L76.0,66.0"], "facesBack": ["M18.0,50.0 L42.0,74.0 L52.0,42.0 Z", "M18.0,50.0 L42.0,26.0 L52.0,42.0 Z", "M66.0,50.0 L42.0,74.0 L52.0,42.0 Z", "M66.0,50.0 L42.0,26.0 L52.0,42.0 Z"], "facesFront": [{"d": "M18.0,50.0 L42.0,74.0 L32.0,58.0 Z", "shade": 0.36}, {"d": "M18.0,50.0 L42.0,26.0 L32.0,58.0 Z", "shade": 0.5}, {"d": "M66.0,50.0 L42.0,74.0 L32.0,58.0 Z", "shade": 0.44}, {"d": "M66.0,50.0 L42.0,26.0 L32.0,58.0 Z", "shade": 0.58}], "octFront": ["M42.0,26.0 L66.0,50.0", "M32.0,58.0 L42.0,26.0", "M32.0,58.0 L66.0,50.0", "M42.0,74.0 L66.0,50.0", "M42.0,74.0 L32.0,58.0", "M18.0,50.0 L42.0,26.0", "M18.0,50.0 L32.0,58.0", "M18.0,50.0 L42.0,74.0"], "octBack": ["M52.0,42.0 L42.0,26.0", "M52.0,42.0 L66.0,50.0", "M42.0,74.0 L52.0,42.0", "M18.0,50.0 L52.0,42.0"], "corners": [[8, 82], [8, 34], [28, 18], [56, 82], [76, 66], [56, 34], [76, 18], [28, 66]], "x": [[66.0, 50], [18.0, 50], [42, 26.0], [42, 74.0], [32.0, 58.0]], "xBack": [[52.0, 42.0]]}; */
/* The octahedron at its first size (its tips at 0.66 of the half cell). */
const PEROVSKITE = {"cubeFront": ["M8.0,82.0 L8.0,34.0", "M8.0,82.0 L56.0,82.0", "M8.0,34.0 L28.0,18.0", "M8.0,34.0 L56.0,34.0", "M28.0,18.0 L76.0,18.0", "M56.0,82.0 L76.0,66.0", "M56.0,82.0 L56.0,34.0", "M76.0,66.0 L76.0,18.0", "M56.0,34.0 L76.0,18.0"], "cubeBack": ["M8.0,82.0 L28.0,66.0", "M28.0,66.0 L28.0,18.0", "M28.0,66.0 L76.0,66.0"], "facesBack": ["M26.2,50.0 L42.0,65.8 L48.6,44.7 Z", "M26.2,50.0 L42.0,34.2 L48.6,44.7 Z", "M57.8,50.0 L42.0,65.8 L48.6,44.7 Z", "M57.8,50.0 L42.0,34.2 L48.6,44.7 Z"], "facesFront": [{"d": "M26.2,50.0 L42.0,65.8 L35.4,55.3 Z", "shade": 0.36}, {"d": "M26.2,50.0 L42.0,34.2 L35.4,55.3 Z", "shade": 0.5}, {"d": "M57.8,50.0 L42.0,65.8 L35.4,55.3 Z", "shade": 0.44}, {"d": "M57.8,50.0 L42.0,34.2 L35.4,55.3 Z", "shade": 0.58}], "octFront": ["M42.0,34.2 L57.8,50.0", "M35.4,55.3 L42.0,34.2", "M35.4,55.3 L57.8,50.0", "M42.0,65.8 L57.8,50.0", "M42.0,65.8 L35.4,55.3", "M26.2,50.0 L42.0,34.2", "M26.2,50.0 L35.4,55.3", "M26.2,50.0 L42.0,65.8"], "octBack": ["M48.6,44.7 L42.0,34.2", "M48.6,44.7 L57.8,50.0", "M42.0,65.8 L48.6,44.7", "M26.2,50.0 L48.6,44.7"], "corners": [[8, 82], [8, 34], [28, 18], [56, 82], [76, 66], [56, 34], [76, 18], [28, 66]], "x": [[57.8, 50], [26.2, 50], [42, 34.2], [42, 65.8], [35.4, 55.3]], "xBack": [[48.6, 44.7]]};
function PerovskitePicture() {
  const P = PEROVSKITE;
  /* The last corner is the hidden one (back, bottom, left). */
  const hidden = P.corners[P.corners.length - 1];
  const front = P.corners.slice(0, -1);
  return (
    /* The empty top band cropped (founder, 17 Nov 2026: higher, less space to the response surface above it): the
       cell's top corners start at y 14.6; was viewBox "0 0 92 92". */
    <svg viewBox="0 12 92 80" className="r-bench-pic" aria-hidden="true" focusable="false">
      {/* The cation at the hidden back corner first, so the cell's dashed back edges run over it (founder, 17 Nov 2026). */}
      {/* A bit faded, as behind the cell (founder, 17 Nov 2026; 0.6, then a bit less: 0.75). */}
      <circle cx={hidden[0]} cy={hidden[1]} r={3.4} className="r-bench-pic-cation" style={{ opacity: 0.75 }} />
      {P.cubeBack.map((d, k) => (
        <path key={`cb${k}`} d={d} className="r-bench-pic-frame r-bench-pic-frame--back" />
      ))}
      {P.facesBack.map((d, k) => (
        <path key={`fb${k}`} d={d} className="r-bench-pic-fill" style={{ opacity: 0.16 }} />
      ))}
      {P.octBack.map((d, k) => (
        <path key={`ob${k}`} d={d} className="r-bench-pic-oct r-bench-pic-oct--back" />
      ))}
      {P.xBack.map(([x, y], k) => (
        <circle key={`xb${k}`} cx={x} cy={y} r={1.7} className="r-bench-pic-atom-dot" style={{ opacity: 0.45 }} />
      ))}
      {P.facesFront.map((f, k) => (
        <path key={`f${k}`} d={f.d} className="r-bench-pic-fill" style={{ opacity: f.shade * 1.33 }} />
      ))}
      {P.octFront.map((d, k) => (
        <path key={`of${k}`} d={d} className="r-bench-pic-oct" />
      ))}
      {P.cubeFront.map((d, k) => (
        <path key={`cf${k}`} d={d} className="r-bench-pic-frame" />
      ))}
      {P.x.map(([x, y], k) => (
        <circle key={`x${k}`} cx={x} cy={y} r={2.1} className="r-bench-pic-atom-dot" />
      ))}
      {front.map(([x, y], k) => (
        <circle key={`a${k}`} cx={x} cy={y} r={3.4} className="r-bench-pic-cation" />
      ))}
    </svg>
  );
}

/* RECOB as a response surface (founder, 17 Nov 2026): a smooth outcome over two settings as a wireframe, seen from
   above at an angle, a main peak and a lower one, the optimum ringed; a simulated outcome surface, as RECOB's tasks are.
   Computed once from a fixed function. */
const SURFACE = (() => {
  const f = (x: number, y: number) =>
    0.85 * Math.exp(-((x - 0.62) ** 2 + (y - 0.38) ** 2) / 0.07) + 0.3 * Math.exp(-((x - 0.22) ** 2 + (y - 0.72) ** 2) / 0.04);
  const P = (x: number, y: number, z: number) => [46 + (x - y) * 34, 44 + (x + y) * 15 - z * 36];
  const pt = (x: number, y: number) => P(x, y, f(x, y)).map((v) => v.toFixed(1)).join(",");
  const N = 10;
  const M = 40;
  const lines: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    lines.push(Array.from({ length: M + 1 }, (_, u) => pt(u / M, t)).join(" "));
    lines.push(Array.from({ length: M + 1 }, (_, u) => pt(t, u / M)).join(" "));
  }
  const base = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => P(x, y, 0).map((v) => v.toFixed(1)).join(",")).join(" ");
  const peak = P(0.62, 0.38, f(0.62, 0.38));
  return { lines, base, peak };
})();
function RecobPicture() {
  return (
    /* Its empty bands cropped (founder, 17 Nov 2026: less margin): the surface spans y 23 (the ringed peak) to 75 (the
       base's front corner); was viewBox "0 0 92 92". */
    <svg viewBox="0 18 92 61" className="r-bench-pic" aria-hidden="true" focusable="false">
      <polygon points={SURFACE.base} className="r-bench-pic-frame" />
      {SURFACE.lines.map((l, k) => (
        <polyline key={k} points={l} className="r-bench-pic-mesh" />
      ))}
      <circle cx={SURFACE.peak[0]} cy={SURFACE.peak[1]} r={5} className="r-bench-pic-ring" />
    </svg>
  );
}

/* The first synthesis picture (rings as plain shapes; 17 Nov 2026, replaced the same day):
( A small-molecule synthesis, for the kinase inhibitors (founder, 17 Nov 2026: a synthesis instead of the reaction
   picture): two building blocks (a six- and a five-membered ring) combine, an arrow down to the made molecule (filled,
   the rings bonded, a side chain with an atom); the other attempt, to the right, fails (an orange cross), as a fifth
   of the candidates do. )
function SynthesisPicture() {
  const ring = (cx: number, cy: number, r: number, n: number, rot: number) =>
    Array.from({ length: n }, (_, k) => {
      const a = rot + (2 * Math.PI * k) / n;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  const hex = (cx: number, cy: number, r: number) => ring(cx, cy, r, 6, Math.PI / 6);
  const pent = (cx: number, cy: number, r: number) => ring(cx, cy, r, 5, -Math.PI / 2);
  return (
    <svg viewBox="0 0 92 92" className="r-bench-pic" aria-hidden="true" focusable="false">
      <polygon points={hex(16, 20, 8)} className="r-bench-pic-frame" />
      <path d="M27,20 L33,20 M30,17 L30,23" className="r-bench-pic-arrow" />
      <polygon points={pent(43, 21, 7)} className="r-bench-pic-frame" />
      <path d="M30,33 L30,45 M26.5,41.5 L30,45 L33.5,41.5" className="r-bench-pic-arrow" />
      <polygon points={hex(20, 62, 8.5)} className="r-bench-pic-fill" />
      <line x1={28.5} y1={62} x2={34.5} y2={62} className="r-bench-pic-bond" />
      <polygon points={pent(42, 62, 7.5)} className="r-bench-pic-fill" />
      <line x1={47} y1={56.5} x2={55} y2={50} className="r-bench-pic-bond" />
      <circle cx={57.5} cy={48} r={3.4} className="r-bench-pic-fill" />
      <path d="M54,22 L64,22 M60,18 L64,22 L60,26" className="r-bench-pic-arrow" />
      <path d="M70,16 L80,28 M80,16 L70,28" className="r-bench-pic-fail" />
    </svg>
  );
}
*/
/* A small-molecule synthesis for the kinase inhibitors, in skeletal formulas (founder, 17 Nov 2026: proper small
   molecules): 2-chloropyrimidine and aniline couple to N-phenylpyrimidin-2-amine, the anilinopyrimidine core of
   imatinib, the classic BCR-Abl inhibitor; a second attempt fails (an orange cross), as a fifth of the candidates do.
   Aromatic rings with alternating double bonds; nitrogen a filled dot, chlorine an open ring (no letters). */
const MOL_R = 7;
/* A six-membered ring with its points left and right: vertex k at 60k degrees (0 the right point, y down). */
const molRing = (cx: number, cy: number) =>
  Array.from({ length: 6 }, (_, k) => [cx + MOL_R * Math.cos((Math.PI / 3) * k), cy + MOL_R * Math.sin((Math.PI / 3) * k)]);
function Aromatic({ cx, cy, n = [] }: { cx: number; cy: number; n?: number[] }) {
  const v = molRing(cx, cy);
  const toward = (p: number[], t: number) => [p[0] + (cx - p[0]) * t, p[1] + (cy - p[1]) * t];
  return (
    <>
      {v.map((p, k) => {
        const q = v[(k + 1) % 6];
        /* Every other edge a double bond: a shorter second line inside the ring. */
        const ia = toward(p, 0.22);
        const ib = toward(q, 0.22);
        const inner = [
          [ia[0] + (ib[0] - ia[0]) * 0.15, ia[1] + (ib[1] - ia[1]) * 0.15],
          [ia[0] + (ib[0] - ia[0]) * 0.85, ia[1] + (ib[1] - ia[1]) * 0.85],
        ];
        return (
          <g key={k}>
            <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} className="r-bench-pic-bondline" />
            {k % 2 === 0 ? (
              <line x1={inner[0][0]} y1={inner[0][1]} x2={inner[1][0]} y2={inner[1][1]} className="r-bench-pic-bondline" />
            ) : null}
          </g>
        );
      })}
      {n.map((k) => (
        <MolAtom key={k} x={v[k][0]} y={v[k][1]} label="N" />
      ))}
    </>
  );
}
/* Was a letter on a patch of paper (N, Cl, NH₂, NH; founder, 17 Nov 2026: dots and lines, no letters): an atom
   other than carbon is now a dot on its bond, filled for nitrogen, an open ring for chlorine. */
function MolAtom({ x, y, label }: { x: number; y: number; label: string }) {
  return label === "Cl" ? (
    <circle cx={x} cy={y} r={2.3} className="r-bench-pic-atom-ring" />
  ) : (
    <circle cx={x} cy={y} r={2.1} className="r-bench-pic-atom-dot" />
  );
}
/* The synthesis with two arrows from the same reactants (17 Nov 2026: replaced; two outcomes of one reaction made no
   sense, founder):
function SynthesisPicture() {
  const pyr = molRing(13, 22);
  const ani = molRing(70, 22);
  const prod = molRing(10, 66);
  ( The amine between the rings, a short bond either side of it. )
  const nh = [prod[0][0] + 6, prod[0][1]];
  const ph = molRing(nh[0] + 6 + MOL_R, 66);
  return (
    <svg viewBox="0 0 92 92" className="r-bench-pic" aria-hidden="true" focusable="false">
      {( 2-chloropyrimidine: the carbon between the two nitrogens carries the chlorine. )}
      <Aromatic cx={13} cy={22} n={[1, 5]} />
      <line x1={pyr[0][0]} y1={pyr[0][1]} x2={pyr[0][0] + 6} y2={pyr[0][1]} className="r-bench-pic-bondline" />
      <MolAtom x={pyr[0][0] + 6} y={pyr[0][1]} label="Cl" />
      <path d="M39,19 L39,25 M36,22 L42,22" className="r-bench-pic-arrow" />
      {( Aniline. )}
      <Aromatic cx={70} cy={22} />
      <line x1={ani[3][0]} y1={ani[3][1]} x2={ani[3][0] - 6} y2={ani[3][1]} className="r-bench-pic-bondline" />
      <MolAtom x={ani[3][0] - 6} y={ani[3][1]} label="NH₂" />
      {( To the product, and an attempt that fails. )}
      <path d="M28,34 L28,50 M24.5,46.5 L28,50 L31.5,46.5" className="r-bench-pic-arrow" />
      <path d="M52,34 L66,50 M61,48.8 L66,50 L65.6,45" className="r-bench-pic-arrow" />
      <path d="M70,58 L80,70 M80,58 L70,70" className="r-bench-pic-fail" />
      {( N-phenylpyrimidin-2-amine. )}
      <Aromatic cx={10} cy={66} n={[1, 5]} />
      <line x1={prod[0][0]} y1={prod[0][1]} x2={ph[3][0]} y2={ph[3][1]} className="r-bench-pic-bondline" />
      <MolAtom x={nh[0]} y={nh[1]} label="NH" />
      <Aromatic cx={nh[0] + 6 + MOL_R} cy={66} />
    </svg>
  );
}
*/
/* Candidate kinase inhibitors as small molecules in skeletal formulas (founder, 17 Nov 2026, after a reference image of
   molecule icons, its overall look only; no reaction arrows): a scatter of drug-like candidates (benzene rings with
   branched chains, fused six- and five-membered bicyclics), one in the middle in orange, the one worth making. Paths
   computed once (regular rings, fused five-rings built on a shared edge away from the six-ring) and kept as data. */
const CANDIDATES = [
  "M19.0,17.8 L24.4,20.9 L24.4,27.1 L19.0,30.2 L13.6,27.1 L13.6,20.9 Z",
  "M24.4,20.9 L29.7,17.8 L35.1,20.9",
  "M29.7,17.8 L29.7,11.6",
  "M13.6,27.1 L8.3,24.0 L2.9,27.1",
  "M74.0,15.8 L79.4,18.9 L79.4,25.1 L74.0,28.2 L68.6,25.1 L68.6,18.9 Z",
  "M68.6,18.9 L62.7,17.0 L59.1,22.0 L62.7,27.0 L68.6,25.1",
  "M59.1,22.0 L53.7,18.9 L48.4,22.0",
  "M16.0,65.8 L21.4,68.9 L21.4,75.1 L16.0,78.2 L10.6,75.1 L10.6,68.9 Z",
  "M21.4,75.1 L27.3,77.0 L30.9,72.0 L27.3,67.0 L21.4,68.9",
  "M30.9,72.0 L36.3,75.1 L41.6,72.0 L47.0,75.1",
  "M75.0,65.8 L80.4,68.9 L80.4,75.1 L75.0,78.2 L69.6,75.1 L69.6,68.9 Z",
  "M75.0,65.8 L75.0,59.6 L80.4,56.5",
  "M75.0,59.6 L69.6,56.5",
  "M69.6,75.1 L64.3,72.0 L58.9,75.1",
  "M64.3,72.0 L64.3,65.8"
];
const CHOSEN = [
  "M54.0,41.8 L59.4,44.9 L59.4,51.1 L54.0,54.2 L48.6,51.1 L48.6,44.9 Z",
  "M48.6,44.9 L42.7,43.0 L39.1,48.0 L42.7,53.0 L48.6,51.1",
  "M59.4,44.9 L64.7,48.0",
  "M39.1,48.0 L33.3,45.9",
  "M33.3,45.9 L31.1,40.1 L24.9,40.3 L23.2,46.2 L28.4,49.7 Z",
  "M24.9,40.3 L19.1,38.1"
];
function SynthesisPicture() {
  return (
    <svg viewBox="0 0 92 92" className="r-bench-pic r-bench-pic--molecules" aria-hidden="true" focusable="false">
      {CANDIDATES.map((d, k) => (
        <path key={`c${k}`} d={d} className="r-bench-pic-molecule" />
      ))}
      {CHOSEN.map((d, k) => (
        <path key={`h${k}`} d={d} className="r-bench-pic-molecule r-bench-pic-molecule--chosen" />
      ))}
    </svg>
  );
}

/* Life science as one benchmark (founder, 17 Nov 2026): the three pooled benchmarks' pictures, as the chemistry row
   shows both of its own. */
function LifeSciencePicture() {
  return (
    <span className="r-bench-pics">
      <CellFreePicture />
      <MediaPicture />
      <ProteinPicture />
      {/* The kinase inhibitors: a small-molecule synthesis (founder, 17 Nov 2026); was <ReactionPicture />. */}
      <SynthesisPicture />
    </span>
  );
}

/* HPO-B and Bayesmark as one benchmark (founder, 16 Nov 2026): both pictures. */
function TuningPicture() {
  return (
    <span className="r-bench-pics">
      <HpoPicture />
      <BayesmarkPicture />
    </span>
  );
}

/* Each card: one line on what the benchmark asks, then a few labelled facts (founder, 15 Nov 2026: more structured;
   that none was seen in training is said once, under the table, not in each card). */
/* The cube race's estimate (founder, 16 Nov 2026): three tables, corners and two sets of edges, the largest counts. */
function EstimatePicture() {
  const bars: [string, number][] = [
    ["8 corners", 30],
    ["6 edges", 22],
    ["6 edges", 38],
  ];
  const most = Math.max(...bars.map(([, h]) => h));
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic"
      aria-hidden="true"
      focusable="false"
    >
      <line x1={8} y1={70} x2={84} y2={70} className="r-bench-pic-track" />
      <line
        x1={8}
        y1={70 - most * 1.3}
        x2={84}
        y2={70 - most * 1.3}
        className="r-bench-pic-arrow"
        strokeDasharray="3 3"
      />
      {bars.map(([label, h], k) => (
        <rect
          key={k}
          x={14 + k * 24}
          y={70 - h * 1.3}
          width={16}
          height={h * 1.3}
          className={h === most ? "r-bench-pic-fill" : "r-bench-pic-frame"}
          aria-label={label}
        />
      ))}
    </svg>
  );
}

export type Info = {
  picture: () => React.ReactNode;
  lead: string;
  facts: [string, React.ReactNode][];
};
const INFO: Record<string, Info> = {
  /* Not a benchmark: the cube race's measure, in the same card (founder, 16 Nov 2026: explain the metric, who came up
     with it and why). Its own labels, so no CARD entry. */
  /* Was (16 Nov 2026), before "more concise, in particular the title": lead "A lower bound on the moves a cube still
     needs, after Richard Korf's pattern databases."; Measure "The fewest moves the cube could still need to be solved.
     The true number is never smaller, and it is 0 only when the cube is solved."; How "Three tables, computed once, give
     the exact moves needed to solve all 8 corners, and each of two sets of 6 edges, with the other pieces ignored. The
     estimate is the largest of the three."; Why "Korf built these tables to find the shortest solutions of scrambled
     cubes: the estimate is fast to look up and never overstates the distance, so a search guided by it stays exact.
     Here it is the readout every method gets. Ties are broken by how close the pieces are to their solved positions." */
  "cube-estimate": {
    picture: EstimatePicture,
    lead: "A lower bound on the moves left to solve the cube.",
    facts: [
      [
        "Measure",
        "The fewest moves the cube could still need, 0 only when solved. Ties go to the state whose pieces are closer to solved.",
      ],
      [
        "How",
        "Precomputed tables give the exact moves to solve the 8 corners and two sets of 6 edges, each on its own.",
      ],
      [
        "Why",
        "A cube has 43 quintillion possible states. Korf designed the moves-remaining estimate to be quick to compute and a reliable guide to whether a move brings the cube closer to solved. It is a heuristic and a lower bound: the true number of moves can be higher, never lower.",
      ],
      [
        "Source",
        "R. E. Korf, Finding Optimal Solutions to Rubik's Cube Using Pattern Databases, AAAI 1997.",
      ],
    ],
  },
  functions: {
    picture: FunctionsPicture,
    /* lead: "Landscapes from optimization research, each with a known best point.", (founder, 15 Nov 2026: more formal, an established benchmark like HPO-B's) */
    lead: "Standard test functions for global optimization, each with a known optimum.",
    facts: [
      ["Goal", "Get as close as possible to the best value."],
      /* ['Problems', 'Branin, Hartmann 3 and 6, Ackley, Holder table, Michalewicz, Shekel, Voronoi (11 in all).'], (the
         model team, 15 Nov 2026: name a few, the full list is theirs to confirm) */
      /* The model team (15 Nov 2026): 8 functions, and Branin, Hartmann 3 and Hartmann 6 again with high noise. */
      [
        "Problems",
        "11 classic landscapes, such as Ackley, Branin and Hartmann: smooth, sharp and many-peaked, some with heavy measurement noise.",
      ],
      [
        "Hard because",
        "Many dips that are not the best, and sharp, narrow peaks.",
      ],
      /* ['Source', 'Surjanovic and Bingham, Virtual Library of Simulation Experiments.'], (read as an internal library, founder 15 Nov 2026) */
      /* ['Source', 'Most from a public collection of test functions at Simon Fraser University (Surjanovic and Bingham).'],
         (founder, 15 Nov 2026: name each source, not "most") */
      [
        "Sources",
        /* <>
          The standard functions from a public collection at Simon Fraser University (Surjanovic and Bingham), as
          implemented in BoTorch. Voronoi is ProviGen's own: random landscapes of regions, with a jump at each border.
        </>, (founder, 15 Nov 2026: not "ProviGen's own"; cite where the name comes from) */
        <>
          The standard functions from a public collection at Simon Fraser
          University (Surjanovic and Bingham), as implemented in BoTorch.
          Voronoi: random regions of a Voronoi diagram (1908), with a jump at
          each border.
        </>,
      ],
    ],
  },
  hpob: {
    picture: HpoPicture,
    /* lead: 'A public benchmark of tuning machine-learning models.', */
    /* lead: "A public benchmark of tuning machine-learning models, from real tuning tasks recorded on OpenML.", (founder, 16 Nov 2026: no "A benchmark of", the task stated directly) */
    lead: "Tuning machine-learning models on real tuning tasks recorded on OpenML.",
    facts: [
      ["Goal", "The settings at which a model scores best on a real dataset."],
      /* The model team's wording (15 Nov 2026). */
      [
        "Data",
        "Each task a table of settings already tried and the accuracy they gave.",
      ],
      [
        "Settings",
        "Such as a learning rate or a tree depth, up to 6 at a time.",
      ],
      ["Source", "Pineda Arango et al., NeurIPS 2021 (its test split)."],
    ],
  },
  cellfree: {
    picture: CellFreePicture,
    /* lead: 'A published lab campaign in cell-free protein expression.', */
    /* lead: "A published lab campaign: making protein without living cells.", (founder, 15 Nov 2026: more formal, an established benchmark like HPO-B's) */
    /* lead: "A published laboratory campaign in cell-free protein expression, where protein is made without living cells.", (founder, 15 Nov 2026: not the "without living cells" part) */
    lead: "A published laboratory campaign in cell-free protein expression.",
    facts: [
      /* ['Goal', 'The reagent mix that makes the most protein.'], */
      ["Goal", "The reagent concentrations that make the most protein."],
      /* ['Scale', 'Three stages with 13, 28 and 21 reagents; 1,231 formulations measured in the lab.'], */
      /* 1,231 measured, 1,028 distinct: some were retested in several rounds (the model team, 15 Nov 2026). */
      [
        "Scale",
        "44 rounds in three stages, with 13, 28 and 21 reagents; 1,231 formulations measured in the lab (1,028 distinct).",
      ],
      ["How", "Each method picks the next formulation from those measured."],
      ["Source", "Olsen et al., Nature Communications 2026."],
    ],
  },
  /* Cell-culture media and protein engineering (biofoundrydemo-ai-09, 16 Nov 2026). */
  media: {
    picture: MediaPicture,
    lead: "Optimizing cell-culture media for cell growth, on published laboratory measurements.",
    facts: [],
  },
  protein: {
    picture: ProteinPicture,
    /* lead: "Engineering proteins, on fitness landscapes measured in full.", (founder, 16 Nov 2026: say what was
       measured) */
    /* lead: "Engineering an antibody-binding protein (GB1) for binding and an enzyme (TrpB) for activity, on fitness
       landscapes measured in full.", (founder, 16 Nov 2026: without the landscapes) */
    lead: "Engineering an antibody-binding protein (GB1) for binding and an enzyme (TrpB) for activity.",
    facts: [],
  },
  /* Chemistry and materials (the model team, 15 Nov 2026, S1-004-016). */
  edbo: {
    picture: ReactionPicture,
    /* lead: "Published chemistry data: the reaction conditions that give the best yield.", (founder, 15 Nov 2026: more formal, an established benchmark like HPO-B's) */
    /* lead: "The EDBO benchmark of reaction optimization, from published reaction-yield data.", (founder, 16 Nov 2026: no "A benchmark of", the task stated directly) */
    lead: "Optimizing chemical reactions for yield, on published reaction data (EDBO).",
    facts: [
      [
        "Goal",
        "The catalyst, ligand, base, solvent and other conditions with the highest yield.",
      ],
      [
        "Problems",
        "7 reactions: a Suzuki-Miyaura coupling, five Buchwald-Hartwig couplings and a direct arylation, with 790 to 3,696 recorded conditions each.",
      ],
      [
        "How",
        "Each method picks the next conditions from those recorded, knowing them by name only, with no chemistry descriptors.",
      ],
      ["Source", "Shields et al., Nature 2021 (EDBO)."],
    ],
  },
  liang: {
    picture: MaterialsPicture,
    /* lead: "Published materials experiments: the recipe or process settings that give the best property.", (founder, 15 Nov 2026: more formal, an established benchmark like HPO-B's) */
    /* lead: "A benchmark of published materials-science experiments, compiled by Liang et al.", (founder, 15 Nov 2026: no authors in the title; the source line names them) */
    /* lead: "A benchmark of published materials-science experiments.", (founder, 16 Nov 2026: no "A benchmark of", the task stated directly) */
    lead: "Optimizing materials and their processing, on published lab experiments.",
    facts: [
      [
        "Goal",
        "The settings with the best measured property, such as toughness or stability.",
      ],
      [
        "Problems",
        "5 datasets: carbon-nanotube polymer films, silver nanoparticles, perovskite stability, crossed-barrel toughness and 3D printing.",
      ],
      /* ['How', 'Each method picks the next experiment from those recorded. Four datasets are small, so by 50 experiments
         most methods come close to the best.'], (founder, 15 Nov 2026: not the sentence on the datasets' size) */
      ["How", "Each method picks the next experiment from those recorded."],
      ["Source", "Liang et al., npj Computational Materials 2021."],
    ],
  },
  /* Machine-learning tuning, one row (founder, 16 Nov 2026): HPO-B and Bayesmark pooled. */
  mltuning: {
    picture: TuningPicture,
    lead: "Tuning machine-learning models, on real tasks from OpenML and the NeurIPS 2020 Black-Box Optimization Challenge.",
    facts: [],
  },
  /* Chemistry and materials, one row (founder, 16 Nov 2026): EDBO and Liang pooled. */
  chemmat: {
    picture: ChemMatPicture,
    /* lead: "Optimizing chemical reactions and materials, on published lab data.", (founder, 17 Nov 2026: RECOB merged in) */
    /* lead: "..., on published lab data and on models trained on it.", (17 Nov 2026, biofoundrydemo-ai-b9: RECOB's tasks are simulators trained on real experimental data, never "lab data") */
    /* lead: "Optimizing chemical reactions and materials, on recorded lab measurements and on simulators trained on real
       experimental data.", (founder, 17 Nov 2026: simpler, RECOB simply added to the row; and the claim that SDM-1 has the highest score on RECOB's own ranking) */
    /* The claim (biofoundrydemo-ai-b9, 16 Nov 2026): on RECOB's own ranking criterion, the anytime score (area under the
       progress curve), H1 78.0 against BoTorch LogEI 71.1 and HEBO 70.2, the baselines scored from RECOB's own published
       runs with RECOB's scorer; the highest of all methods. No final-score claim (ahead of HEBO on 5 of 14 at the end). */
    /* lead: "Optimizing chemical reactions and materials. On RECOB's own ranking, SDM-1 has the highest score of any
       method in its published results.", (founder, 17 Nov 2026: the claim in the card's body, the title as before RECOB) */
    lead: "Optimizing chemical reactions and materials, on published lab data.",
    facts: [],
  },
  /* Life science (founder, 17 Nov 2026): cell-free protein expression, cell-culture media and protein engineering as one
     row, pooled by dataset count; the three separate entries stay for their hidden rows. */
  lifesci: {
    /* picture: CellFreePicture, (founder, 17 Nov 2026: all three pictures) */
    picture: LifeSciencePicture,
    /* lead: "...: cell-free protein expression, cell-culture media and protein engineering.", (founder, 17 Nov 2026: the kinase inhibitors merged in) */
    /* lead: "Optimizing biological experiments on published lab data: cell-free protein expression, cell-culture media,
       protein engineering and kinase inhibitors.", (founder, 17 Nov 2026: clean, in the chemistry row's form) */
    lead: "Optimizing protein production, cell culture and drug candidates, on published lab data.",
    facts: [],
  },
  /* RECOB (biofoundrydemo-ai-b9, 16 Nov 2026): 14 chemistry and materials tasks, each a frozen model of measured lab data. */
  recob: {
    /* picture: ChemMatPicture, (17 Nov 2026: its own response surface) */
    picture: RecobPicture,
    /* lead: "..., on models trained on measured lab data (RECOB).", (17 Nov 2026, biofoundrydemo-ai-b9: RECOB's tasks are simulators trained on real experimental data, never "lab data") */
    lead: "Optimizing chemistry and materials experiments, on 14 tasks simulated from real experimental data (RECOB).",
    facts: [],
  },
  /* Anubis HOIP perovskites (biofoundrydemo-ai-b9, 17 Nov 2026; its own row, the founder's choice): the paper only. */
  hoip: {
    /* picture: MaterialsPicture, (founder, 17 Nov 2026: its own graphic, the perovskite unit cell) */
    picture: PerovskitePicture,
    lead: "Searching hybrid perovskite compositions for a semiconductor, where nine in ten fail to form (Anubis).",
    facts: [],
  },
  /* Anubis BCR-Abl (biofoundrydemo-ai-b9, 17 Nov 2026; the user approved the row): the paper only, as RECOB. */
  anubis: {
    /* picture: ReactionPicture, (17 Nov 2026: the synthesis picture, as in Life science) */
    picture: SynthesisPicture,
    lead: "Choosing kinase inhibitors to make and test, where a fifth of the candidate molecules fail to synthesize (Anubis).",
    facts: [],
  },
  /* Truss design, self-assembly and Bayesmark (the model team, agent-003, 15 Nov 2026, checked against the suite configs). */
  truss: {
    picture: TrussPicture,
    /* lead: "A structural design benchmark: a steel frame that carries its load with the least material.", (founder, 16 Nov 2026: redo, in the others' style) */
    /* lead: "A benchmark of structural design: steel frames that carry their load with the least material.", (founder, 16 Nov 2026: closer to "load balancing with the least material"; not real steel frames) */
    /* lead: "A structural design benchmark: balancing a load with the least material.", */
    /* lead: "A structural design benchmark: load balancing with the least material.", */
    /* lead: "A structural design benchmark: load balancing with the least required material.", (founder, 16 Nov 2026: no "A benchmark of", the task stated directly) */
    lead: "Structural design: load balancing with the least required material.",
    facts: [
      ["Goal", "The lightest frame within its stress and buckling limits."],
      [
        "Problems",
        "40 variants of a cantilever frame with 16 possible bars, each left out or sized from 16 to 50 mm. More than half of all designs fail.",
      ],
      [
        "Source",
        "A size-and-topology problem in the tradition of the classic 10-bar truss benchmark of structural engineering.",
      ],
    ],
  },
  selfassembly: {
    picture: AssemblyPicture,
    /* lead: "A benchmark of simulated systems that organize themselves.", (founder, 16 Nov 2026: too generic) */
    /* lead: "Simulations of artificial life and self-assembly, from Lenia creatures to DNA tiles and chemical oscillators.", (founder, 16 Nov 2026: not "simulations") */
    lead: "Artificial life and self-assembly, from Lenia creatures to DNA tiles and chemical oscillators.",
    facts: [
      ["Goal", "The conditions under which the most structure forms."],
      [
        "Problems",
        "80, from four models: DNA-like tile self-assembly, the Brusselator chemical oscillator, and Lenia patterns and creatures.",
      ],
      [
        "Hard because",
        "Under many conditions nothing forms, and the experiment fails.",
      ],
      [
        "Sources",
        "Winfree 1998 (tile assembly); Prigogine and Lefever, Journal of Chemical Physics 1968 (Brusselator); Chan, Complex Systems 2019 (Lenia).",
      ],
    ],
  },
  bayesmark: {
    picture: BayesmarkPicture,
    /* lead: "The benchmark of the NeurIPS 2020 Black-Box Optimization Challenge: tuning machine-learning models.", (founder, 16 Nov 2026: no "A benchmark of", the task stated directly) */
    lead: "Tuning machine-learning models, from the NeurIPS 2020 Black-Box Optimization Challenge.",
    facts: [
      [
        "Goal",
        "The settings at which a scikit-learn model reaches the highest cross-validated accuracy.",
      ],
      [
        "Problems",
        "36: nine models, such as decision trees, random forests and neural networks, on four datasets.",
      ],
      ["Settings", "2 to 9, depending on the model."],
      ["Source", "Turner et al., PMLR 2021."],
    ],
  },
  /* Parametric CAD (the model team, agent-003, 15 Nov 2026). */
  cad: {
    picture: CadPicture,
    /* lead: "A benchmark of rebuilding mechanical parts with a parametric CAD program.", (founder, 16 Nov 2026: no "A benchmark of", the task stated directly) */
    lead: "Rebuilding mechanical parts with a parametric CAD program.",
    facts: [
      [
        "Goal",
        "The program settings whose built part matches a hidden target most closely, by surface distance.",
      ],
      [
        "Problems",
        "29 two-body parts with 13 settings each, chosen by size. Each has 3,000 candidate designs, the exact target among them.",
      ],
      /* ["Hard because", "Many settings fail to build a valid solid."], (founder, 16 Nov 2026: vague, not normal language) */
      [
        "Hard because",
        "Many combinations of settings describe a shape the CAD program cannot build, so those designs fail.",
      ],
      [
        "Sources",
        "Parts from the Fusion 360 Gallery (Willis et al., SIGGRAPH 2021), CAD-Recode and GenCAD-Code.",
      ],
    ],
  },
};

/* One set of fields on every card (founder, 16 Nov 2026: the same fields everywhere, not "How" on one, "Settings" on
   another and "Hard because" on a third): Goal, Problems, Challenge, Source. The cards above keep their first fields
   (INFO[id].facts) as a record; these are what the cards show. */
const FIELDS = ["Goal", "Problems", "Challenge", "Source"] as const;
const CARD: Record<string, Record<(typeof FIELDS)[number], React.ReactNode>> = {
  functions: {
    Goal: "Get as close as possible to the best value.",
    Problems:
      "11 classic landscapes, such as Ackley, Branin and Hartmann: smooth, sharp and many-peaked, some with heavy measurement noise.",
    Challenge: "Many dips that are not the best, and sharp, narrow peaks.",
    Source:
      "The standard functions from a public collection at Simon Fraser University (Surjanovic and Bingham), as implemented in BoTorch. Voronoi: random regions of a Voronoi diagram (1908), with a jump at each border.",
  },
  hpob: {
    Goal: "The settings at which a model scores best on a real dataset.",
    Problems:
      "Real tuning tasks, each a table of settings already tried, such as a learning rate or a tree depth, and the accuracy they gave.",
    Challenge:
      "Up to 6 settings at a time, and only the settings in each task's table can be tried.",
    Source: "Pineda Arango et al., NeurIPS 2021 (its test split).",
  },
  cellfree: {
    Goal: "The reagent concentrations that make the most protein.",
    Problems:
      /* "44 rounds in three stages, with 13, 28 and 21 reagents; 1,231 formulations measured in the lab (1,028 distinct).", (founder, 16 Nov 2026: without the distinct count) */
      "44 rounds in three stages, with 13, 28 and 21 reagents; 1,231 formulations measured in the lab.",
    Challenge:
      "Up to 28 reagents at once, and only formulations measured in the lab can be picked.",
    /* The paper linked here, not in a footnote under the table (founder, 16 Nov 2026). */
    Source: (
      <a
        href="https://doi.org/10.1038/s41467-026-69605-8"
        target="_blank"
        rel="noopener noreferrer"
      >
        Olsen et al., Nature Communications 17:3478 (2026).
      </a>
    ),
  },
  /* Cell-culture media (biofoundrydemo-ai-09, 16 Nov 2026): mammalian cell-culture media, not a protein-expression
     result. Two of the paper's six datasets, chosen by size (the budget at most 10% of the pool), before any score. */
  media: {
    Goal: "The media formulation under which the cells expand the most.",
    Problems:
      "2 datasets: human primary T cells (535 formulations, 14 components) and TF-1 myeloid progenitor cells (1,562 formulations, 15 components).",
    Challenge:
      "Up to 15 components at once, and only formulations measured in the lab can be picked.",
    Source: (
      <>
        Kim and Audet, Communications Biology 2019 (data);{" "}
        <a
          href="https://doi.org/10.5281/zenodo.21501659"
          target="_blank"
          rel="noopener noreferrer"
        >
          Parsaee et al., Bioinformatics 2026
        </a>{" "}
        (benchmark).
      </>
    ),
  },
  /* Protein engineering (biofoundrydemo-ai-09, 16 Nov 2026): shown since its final numbers (index encoding). */
  protein: {
    Goal: "The protein variant with the highest measured fitness.",
    /* Problems: "2 landscapes, GB1 (149,361 variants) and TrpB (159,129): 4 amino-acid sites, every combination of the 20
       amino acids measured.", (16 Nov 2026: the number of campaigns added, biofoundrydemo-ai-09) */
    /* Was "... 10 runs on each, 20 in all." (17 Nov 2026: 20 seeds per task, biofoundrydemo-ai-09) */
    Problems:
      "2 landscapes, GB1 (149,361 variants) and TrpB (159,129): 4 amino-acid sites, every combination of the 20 amino acids measured. 20 runs on each, 40 in all.",
    /* Challenge: "Amino acids are categories, not numbers, and the fittest variants are rare.", (16 Nov 2026: the
       encoding caveat added, mandatory wherever the row shows; biofoundrydemo-ai-09) */
    /* Before the ordering clause (16 Nov 2026, biofoundrydemo-ai-09): "...with each site as one setting, as SDM-1
       receives it (the row shown), SDM-1 leads; ..." */
    /* Before the significance correction (16 Nov 2026, biofoundrydemo-ai-09: only top 1% at 50 clears two standard
       errors): "...How they are encoded decides the ranking: with each site as one setting (...; the row shown), SDM-1
       leads; with one-hot features (80 dimensions), Bayesian optimization leads at both 25 and 50 experiments; with
       physicochemical descriptors (76 dimensions), SDM-1 leads at 25 and trails at 50." */
    /* After the significance correction, reverted by the founder (16 Nov 2026): "...With each site as one setting
       (...; the row shown), SDM-1 reaches the top 1% in all 20 runs at 50 experiments, Bayesian optimization in 15; on
       score and distance the two are within noise. The encoding matters: with one-hot features (80 dimensions), Bayesian
       optimization comes out ahead. Both are far ahead of random search." (An interim "...is ahead at 25 experiments and
       level at 50." was reverted too.) */
    /* Was "...How they are encoded decides the ranking: with each site as one setting (an arbitrary ordering of the 20
       amino acids, which is what the SDM-1 API receives for a categorical parameter; the row shown), SDM-1 leads; with
       one-hot features (80 dimensions), Bayesian optimization leads at both 25 and 50 experiments; with physicochemical
       descriptors (76 dimensions), SDM-1 leads at 25 and trails at 50." (founder, 16 Nov 2026: shorter, no encoding) */
    Challenge:
      /* "Amino acids are categories, not numbers: 20 at each of 4 sites make 160,000 possible variants, and the fittest
         are rare." (founder, 16 Nov 2026: no "not b", only what is the case) */
      /* "20 amino acids at each of 4 sites make 160,000 possible variants, and the fittest are rare.", (founder, 16 Nov
         2026: more formal; the rugged landscape instead of "rare") */
      "20 amino acids at each of 4 sites give a combinatorial space of 160,000 variants, in which the effect of a mutation at one site depends on the amino acids at the others (epistasis).",
    Source: (
      <>
        Wu et al., eLife 2016 (GB1); Johnston et al. 2024 (TrpB);{" "}
        <a
          href="https://doi.org/10.5281/zenodo.12196802"
          target="_blank"
          rel="noopener noreferrer"
        >
          Yang et al., Nature Communications 2025
        </a>{" "}
        (ALDE benchmark).
      </>
    ),
  },
  edbo: {
    Goal: "The catalyst, ligand, base, solvent and other conditions with the highest yield.",
    Problems:
      "7 reactions: a Suzuki-Miyaura coupling, five Buchwald-Hartwig couplings and a direct arylation, with 790 to 3,696 recorded conditions each.",
    Challenge:
      "Conditions are known by name only, with no chemistry descriptors to tell how alike they are.",
    Source: "Shields et al., Nature 2021 (EDBO).",
  },
  /* HPO-B and Bayesmark fused into one card (founder, 16 Nov 2026). */
  mltuning: {
    Goal: "The settings at which a model scores best on a dataset.",
    Problems:
      "HPO-B: 33 real tuning tasks recorded on OpenML, each a table of settings already tried. Bayesmark: 36 tasks, nine scikit-learn models, such as decision trees, random forests and neural networks, on four datasets.",
    Challenge:
      "Up to 9 settings at a time; on HPO-B, only the settings in each task's table can be tried.",
    Source:
      "Pineda Arango et al., NeurIPS 2021 (HPO-B, its test split); Turner et al., PMLR 2021 (Bayesmark).",
  },
  /* The two fused into one card (founder, 16 Nov 2026: complete but not overloaded). */
  chemmat: {
    /* Was, before RECOB was merged in (founder, 17 Nov 2026: RECOB merged in): Goal "The conditions with the best outcome: the highest reaction yield, or
       the best material property, such as toughness or stability."; Problems "12 datasets: 7 reactions (...) and 5
       materials (...)."; Challenge "Only recorded experiments can be picked. Reaction conditions are known by name
       only, and the materials runs start from just 2 experiments."; Source "Shields et al., Nature 2021 (EDBO); Liang
       et al., npj Computational Materials 2021." */
    /* Was, with RECOB spelled out (founder, 17 Nov 2026: simpler, RECOB simply added to the row; and the claim that SDM-1 has the highest score on RECOB's own ranking): Goal "... the highest reaction yield or rate, the best material property, such as
       toughness, stability or conductivity, or the least waste."; Problems "26 tasks: 7 reactions (...) and 5 materials
       (...) from recorded lab data, and 14 chemistry and materials tasks simulated from real experimental data
       (RECOB)."; Challenge "Reaction conditions known by name only, materials runs that start from just 2 experiments,
       and mixed, constrained inputs: mixture fractions that sum to one and settings in fixed steps." */
    Goal: "The conditions with the best outcome: the highest reaction yield, or the best material property, such as toughness or stability.",
    Problems:
      /* Was "26 tasks: 12 from recorded lab data (7 reactions, 5 materials) and 14 ..." (founder, 17 Nov 2026: the
         perovskites merged in as one task) */
      "27 tasks: 13 from recorded lab data (7 reactions, 5 materials and a perovskite search where nine in ten compositions fail to form) and 14 simulated from real experimental data (RECOB). On RECOB's own ranking, SDM-1 has the highest score of any method in its published results.",
    Challenge:
      "Reaction conditions known by name only, few starting experiments, and mixtures whose fractions must sum to one.",
    Source:
      "Shields et al., Nature 2021 (EDBO); Liang et al., npj Computational Materials 2021; Xie et al., arXiv 2609.20891 (2026) (RECOB); Hickman et al., Digital Discovery 2025 (perovskites).",
  },
  /* Life science (founder, 17 Nov 2026): the three pooled benchmarks' cards in one. */
  lifesci: {
    /* Was, before the kinase inhibitors were merged in (founder, 17 Nov 2026: the kinase inhibitors merged in): Goal "... or the fittest protein variant."; Problems "7
       datasets: 3 stages ..., 2 cell-culture media studies ... and 2 protein fitness landscapes ..."; Challenge "Up to
       28 components at once and protein variants whose mutations interact; only formulations and variants measured in
       the lab can be picked."; Source without Hickman et al. */
    Goal: "The best biological outcome: the most protein made, the most cell growth, the fittest protein variant, or the strongest kinase inhibitor.",
    Problems:
      "8 datasets: 3 stages of a cell-free protein expression campaign (13 to 28 reagents), 2 cell-culture media studies (T cells and TF-1 cells, 14 and 15 components), 2 protein fitness landscapes (GB1 and TrpB, 4 amino-acid sites each) and 270 candidate BCR-Abl kinase inhibitors, 57 of which fail to synthesize.",
    Challenge:
      "Up to 28 components at once, protein variants whose mutations interact, and failed syntheses that give no reading; only formulations, variants and molecules measured in the lab can be picked.",
    Source:
      "Olsen et al., Nature Communications 2026 (cell-free); Kim and Audet, Communications Biology 2019, and Parsaee et al., Bioinformatics 2026 (media); Yang et al., Nature Communications 2025 (ALDE, protein); Hickman et al., Digital Discovery 2025 (kinase inhibitors).",
  },
  /* RECOB (biofoundrydemo-ai-b9, 16 Nov 2026): the paper only, never its data or models. */
  recob: {
    Goal: "The conditions with the best outcome: reaction rate or yield, electrolyte or polymer conductivity, the least impurity or waste, the slowest degradation, or the strongest printed parts.",
    /* Problems: "... Every method starts from the same 10 recorded experiments.", (17 Nov 2026: what its top 1% means
       added, biofoundrydemo-ai-b9: the best 1% of the search space, there being no list of candidates) */
    Problems:
      "14 tasks with 3 to 11 inputs each, simulated from real experimental data: each outcome is predicted by a model the benchmark's authors trained on a real experimental dataset and froze. Every method starts from the same 10 recorded experiments. Its top 1% is the best 1% of the search space.",
    Challenge:
      "Mixed, constrained inputs: mixture fractions that sum to one, limits on sums, and instrument settings in fixed steps. The optimum is unknown.",
    Source: (
      <a
        href="https://arxiv.org/abs/2609.20891"
        target="_blank"
        rel="noopener noreferrer"
      >
        Xie et al., arXiv 2609.20891 (2026).
      </a>
    ),
  },
  /* Anubis HOIP perovskites (17 Nov 2026): the paper only, no data or model links. */
  hoip: {
    Goal: "A composition that meets both targets, its band gap and its effective mass.",
    Problems:
      "1 task: 1,276 compositions, 1,165 of which fail to form, and 7 that meet both targets. 30 runs, each from the same 5 starting compositions.",
    Challenge:
      "Nine in ten experiments fail, and the score ranks results in tiers by target, so distance is in ranking units.",
    Source: (
      <a
        href="https://doi.org/10.1039/D5DD00018A"
        target="_blank"
        rel="noopener noreferrer"
      >
        Hickman et al., Digital Discovery 2025.
      </a>
    ),
  },
  /* Anubis BCR-Abl (17 Nov 2026): the paper only, no data or model links. */
  anubis: {
    Goal: "The molecule with the strongest inhibition of the BCR-Abl kinase.",
    Problems:
      "1 task: 270 candidate molecules, 57 of which fail to synthesize. 30 runs, each from the same 12 starting molecules.",
    Challenge:
      "A failed synthesis gives no reading, and the best molecules are rare: the top 1% is the 3 best of 270.",
    Source: (
      <a
        href="https://doi.org/10.1039/D5DD00018A"
        target="_blank"
        rel="noopener noreferrer"
      >
        Hickman et al., Digital Discovery 2025.
      </a>
    ),
  },
  liang: {
    Goal: "The settings with the best measured property, such as toughness or stability.",
    Problems:
      "5 datasets: carbon-nanotube polymer films, silver nanoparticles, perovskite stability, crossed-barrel toughness and 3D printing.",
    Challenge:
      "Properties measured on real samples, starting from only 2 experiments.",
    Source: "Liang et al., npj Computational Materials 2021.",
  },
  truss: {
    Goal: "The lightest frame within its stress and buckling limits.",
    Problems:
      "40 variants of a cantilever frame with 16 possible bars, each left out or sized from 16 to 50 mm.",
    Challenge:
      "More than half of all designs fail: overstressed, buckled, or unable to hold their shape.",
    /* The classic problem linked (founder, 16 Nov 2026): Connor et al. describe the ten-bar cantilever truss, its bars
       and loads (open access on arXiv). */
    Source: (
      <>
        A size-and-topology problem in the tradition of the{" "}
        <a
          href="https://arxiv.org/abs/1410.7851"
          target="_blank"
          rel="noopener noreferrer"
        >
          classic 10-bar truss benchmark
        </a>{" "}
        of structural engineering.
      </>
    ),
  },
  selfassembly: {
    Goal: "The conditions under which the most structure forms.",
    Problems:
      "80, from four models: DNA-like tile self-assembly, the Brusselator chemical oscillator, and Lenia patterns and creatures.",
    Challenge: "Under many conditions nothing forms, and the experiment fails.",
    Source:
      "Winfree 1998 (tile assembly); Prigogine and Lefever, Journal of Chemical Physics 1968 (Brusselator); Chan, Complex Systems 2019 (Lenia).",
  },
  bayesmark: {
    Goal: "The settings at which a scikit-learn model reaches the highest cross-validated accuracy.",
    Problems:
      "36: nine models, such as decision trees, random forests and neural networks, on four datasets.",
    Challenge: "2 to 9 settings at a time, depending on the model.",
    Source: "Turner et al., PMLR 2021.",
  },
  cad: {
    Goal: "The program settings whose built part matches a hidden target most closely, by surface distance.",
    Problems:
      "29 two-body parts with 13 settings each, chosen by size. Each has 3,000 candidate designs, the exact target among them.",
    /* Challenge: "Many settings fail to build a valid solid.", (founder, 16 Nov 2026: vague, not normal language) */
    Challenge:
      "Many combinations of settings describe a shape the CAD program cannot build, so those designs fail.",
    Source:
      "Parts from the Fusion 360 Gallery (Willis et al., SIGGRAPH 2021), CAD-Recode and GenCAD-Code.",
  },
};

export const hasBenchmarkInfo = (id: string) => id in INFO;

/** The benchmark's name, with its card on hover, focus or tap. */
export default function BenchmarkInfo({
  id,
  children,
  opens = "right",
  up = false,
  card: given,
}: {
  id: string;
  children: React.ReactNode;
  /** "left": the card's right edge at the name's, so it opens toward the page's middle from the right-hand side
      (founder, 16 Nov 2026, the cube race's note). */
  opens?: "left" | "right";
  /** Above the name instead of below it (founder, 16 Nov 2026, the cube race's note). */
  up?: boolean;
  /** A card given by the caller instead of one of INFO's (founder, 16 Nov 2026: Try it's results over its landscapes,
      computed from the recording). */
  card?: Info;
}) {
  const info = given ?? INFO[id];
  const anchor = useRef<HTMLSpanElement>(null);
  const card = useRef<HTMLSpanElement>(null);
  const [at, setAt] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight?: number;
  } | null>(null);
  /* Clicked open (founder, 16 Nov 2026): the card stays, and takes clicks (its links), until a click outside it. */
  const [pinned, setPinned] = useState(false);
  const place = () => {
    const box = anchor.current?.getBoundingClientRect();
    if (!box) return;
    const width = Math.min(528, window.innerWidth - 32);
    /* The side of the name the card opens on, and how tall it may be there (the user, 20 Nov 2026: on a phone the
       card ran off the bottom of the screen, where nothing can scroll a fixed card into view). It opens below the
       name as before and turns upward only once it is on the page and does not fit below, so on a wide screen,
       where it does fit, nothing moves. release.css scrolls whatever is left over inside the card.
       The room above the name ends at the site header, not at the window (the user, 24 Nov 2026: a card was cut off
       behind the header). .s-header is position: fixed and paints over the card, so a card measured against the
       window put its first lines underneath it, out of reach: the card cannot be scrolled up to reveal them,
       because what is hidden is outside the card rather than inside it. The header tucks away on scroll, and then
       its box sits above the window and the whole window is free again. */
    const head = document.querySelector(".s-header");
    /* The header's band is kept clear whether or not it is on screen at this moment. The header tucks away when the
       page is scrolled down and comes back on the way up, and it comes back without a scroll of its own: a card
       placed while it was away, measured from where it then stood, ended up underneath it a moment later with no
       second placement to correct it. Its height is read from the element rather than its box, since mid-slide the
       box is somewhere above the window. */
    const ceiling = head ? (head as HTMLElement).offsetHeight + 8 : 8;
    /* A name can itself be under the header; the card still starts below it. */
    const downTop = Math.max(ceiling, box.bottom + 8);
    const below = window.innerHeight - downTop - 24;
    const above = box.top - 8 - ceiling;
    const wants = card.current?.scrollHeight ?? 0;
    const openUp = up || (wants > below && above > below);
    const room = Math.max(160, openUp ? above : below);
    setAt({
      left: Math.max(
        16,
        Math.min(
          opens === "left" ? box.right - width : box.left,
          window.innerWidth - 16 - width,
        ),
      ),
      maxHeight: room,
      ...(openUp
        ? /* Anchored by its foot, under the name, unless the room above is smaller than the smallest card the
             floor above allows: then the foot would push its head under the header, so it hangs from the header
             instead. */
          above >= room
          ? { bottom: window.innerHeight - box.top + 8 }
          : { top: ceiling }
        : { top: downTop }),
    });
  };
  const show = place;
  const hide = () => {
    setPinned(false);
    setAt(null);
  };
  /* const hide = () => setAt(null); */
  /* A fixed card would drift from its name as the page scrolls: it moves with its name (was: it closed, before a
     clicked card had to stay open). */
  useEffect(() => {
    if (!at) return;
    /* Once more now the card is on the page, where its height can be read and the side it opens on settled. */
    place();
    window.addEventListener("scroll", place, { passive: true, capture: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [at !== null]);
  /* A click anywhere outside the name and its card closes a clicked-open card. */
  useEffect(() => {
    if (!pinned) return;
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!anchor.current?.contains(t) && !card.current?.contains(t)) hide();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [pinned]);
  if (!info) return <>{children}</>;
  const Picture = info.picture;
  return (
    <span
      ref={anchor}
      className="r-bench-info"
      tabIndex={0}
      aria-describedby={at ? `r-bench-card-${id}` : undefined}
      onMouseEnter={show}
      onMouseLeave={() => (pinned ? undefined : setAt(null))}
      onFocus={show}
      onBlur={(e) =>
        pinned || card.current?.contains(e.relatedTarget as Node)
          ? undefined
          : setAt(null)
      }
      /* onClick={() => (at ? hide() : show())} */
      onClick={(e) => {
        /* A click inside the card reaches here too (React passes events up through the portal): the card stays. */
        if (card.current?.contains(e.target as Node)) return;
        if (pinned) return hide();
        setPinned(true);
        place();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") hide();
      }}
    >
      {children}
      {/* Rendered into the body (founder, 15 Nov 2026: a section's rule drew over the card, which sat inside the
          page's stacking order). */}
      {at
        ? createPortal(
            <span
              ref={card}
              id={`r-bench-card-${id}`}
              role="tooltip"
              className={
                pinned ? "r-bench-card r-bench-card--pinned" : "r-bench-card"
              }
              style={{
                left: at.left,
                top: at.top,
                bottom: at.bottom,
                maxHeight: at.maxHeight,
              }}
            >
              <Picture />
              <span className="r-bench-card-text">
                <span className="r-bench-card-lead">{info.lead}</span>
                {/* {info.facts.map(([label, fact]) => ( */}
                {(CARD[id]
                  ? FIELDS.map((f) => [f, CARD[id][f]] as const)
                  : info.facts
                ).map(([label, fact]) => (
                  <span key={label} className="r-bench-card-fact">
                    <span className="r-bench-card-label">{label}</span>
                    <span>{fact}</span>
                  </span>
                ))}
              </span>
            </span>,
            /* document.body, (17 Nov 2026: inside a modal card, such as the cube card in Application Areas, the body
               lies under the card and is inert, so the hover card never showed; there it goes into the card) */
            anchor.current?.closest("dialog[open]") ?? document.body,
          )
        : null}
    </span>
  );
}
