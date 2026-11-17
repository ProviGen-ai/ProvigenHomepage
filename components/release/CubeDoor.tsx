"use client";

import { useId, useRef, useState } from "react";
import type React from "react";
import { applyMoves, scramble, solved } from "./cube/cube";
import type { Face } from "./cube/cube";
import { mulberry32 } from "@/components/writings/bo-sim/model";
/* import PaperPiece from "./PaperPiece"; (17 Nov 2026: was a single-texture paper cube; now coloured as the page's
   animated cube) */

/*
 * A small paper Rubik's cube in Application Areas that opens the cube demo as a card over the page (founder,
 * 17 Nov 2026). Cut from the same textured paper as the field pieces around it; on hover or focus it lifts and a short
 * label says it opens the demo, so it reads as clickable. The card is a native modal <dialog>, as Get access:
 * Escape, the close button or a click on the backdrop closes it, and focus returns to the cube.
 */

/* Was a dark-bodied cube in the animated cube's colours, solved (17 Nov 2026; replaced the same day):
( The animated cube's face colours (release.css, "the cube in paper, take two"): the top white, the left face green,
   the right face red, as the cube is first seen. )
const FACE = { top: "#ece6d8", left: "#4f8f5c", right: "#c24c3c" };
const T = [100, 22],
  L = [32, 61],
  R = [168, 61],
  C = [100, 100],
  B = [100, 178],
  LB = [32, 139],
  RB = [168, 139];
const FACES: { pts: number[][]; color: string; shade: number }[] = [
  { pts: [T, R, C, L], color: FACE.top, shade: 0 },
  { pts: [L, C, B, LB], color: FACE.left, shade: 0.06 },
  { pts: [C, R, RB, B], color: FACE.right, shade: 0.16 },
];
const pts = (ps: number[][]) =>
  ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
( A point on a face, u along its first edge and v along its last. )
const on = ([p0, p1, , p3]: number[][], u: number, v: number) => [
  p0[0] + (p1[0] - p0[0]) * u + (p3[0] - p0[0]) * v,
  p0[1] + (p1[1] - p0[1]) * u + (p3[1] - p0[1]) * v,
];

( A small paper Rubik's cube (founder, 17 Nov 2026: "properly coloured like our animated cube"): a dark body, 3 x 3
   stickers per face in the cube's colours, the side faces a little shaded; the paper's grain, a slight wobble of the
   cut edge and the drop shadow of the field pieces. )
function CubePaper({ seed = 41 }: { seed?: number }) {
  const id = `cube-door-${seed}`;
  const gap = 0.09;
  return (
    <svg
      className="r-cube-paper"
      viewBox="-14 -14 228 228"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={`${id}-cut`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.06"
            numOctaves="2"
            seed={seed}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feDropShadow
            dx="1.5"
            dy="4"
            stdDeviation="5"
            floodColor="#131312"
            floodOpacity="0.2"
          />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.4"
            numOctaves="1"
            seed={seed + 11}
          />
          <feColorMatrix values="0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.06  0 0 0 0.22 0" />
        </filter>
        <clipPath id={`${id}-clip`}>
          {FACES.map((f, k) => (
            <polygon key={k} points={pts(f.pts)} />
          ))}
        </clipPath>
      </defs>
      <g filter={`url(#${id}-cut)`}>
        {FACES.map((f, k) => (
          <polygon
            key={`b${k}`}
            points={pts(f.pts)}
            fill="#1d1c1a"
            stroke="#1d1c1a"
            strokeWidth="8"
            strokeLinejoin="round"
          />
        ))}
        {FACES.flatMap((f, k) =>
          [0, 1, 2].flatMap((i) =>
            [0, 1, 2].map((j) => (
              <polygon
                key={`s${k}-${i}-${j}`}
                points={pts([
                  on(f.pts, (i + gap) / 3, (j + gap) / 3),
                  on(f.pts, (i + 1 - gap) / 3, (j + gap) / 3),
                  on(f.pts, (i + 1 - gap) / 3, (j + 1 - gap) / 3),
                  on(f.pts, (i + gap) / 3, (j + 1 - gap) / 3),
                ])}
                fill={f.color}
                stroke={f.color}
                strokeWidth="3"
                strokeLinejoin="round"
              />
            )),
          ),
        )}
        {FACES.filter((f) => f.shade).map((f, k) => (
          <polygon
            key={`h${k}`}
            points={pts(f.pts)}
            fill="#131312"
            opacity={f.shade}
          />
        ))}
        <rect
          x="0"
          y="0"
          width="200"
          height="200"
          filter={`url(#${id}-grain)`}
          clipPath={`url(#${id}-clip)`}
        />
      </g>
    </svg>
  );
}

*/
/* Was the scrappy cut-paper cube in softer colours (17 Nov 2026; replaced the same day by the marker version):
( Softer face colours that sit with the page's paper, teal and amber (founder, 17 Nov 2026: "a nicer colour set"). )
const PALETTE: Record<Face, string> = {
  U: "#efe8da",
  D: "#e6bf55",
  F: "#6e9b72",
  B: "#4f7f9c",
  R: "#c65a43",
  L: "#e3913f",
};
( One fixed 10-move scramble (founder, 17 Nov 2026: "a 10 move scramble, once"), with the page's own cube model, so
   the visible faces are mixed as after those moves and stay the same on every visit: L B' F R2 D U' B2 U2 R' B'. )
const SCRAMBLED = applyMoves(solved(), scramble(10, mulberry32(10)));

( The drawing: the top face, the front face on the left, the right face on the right, isometric in a 200 box. )
const T = [100, 22],
  L = [32, 61],
  R = [168, 61],
  C = [100, 100],
  B = [100, 178],
  LB = [32, 139],
  RB = [168, 139];
const FACE_PTS = { U: [T, R, C, L], F: [L, C, B, LB], R: [C, R, RB, B] };
( A point on a face, u along its first edge and v along its last. )
const on = ([p0, p1, , p3]: number[][], u: number, v: number) => [
  p0[0] + (p1[0] - p0[0]) * u + (p3[0] - p0[0]) * v,
  p0[1] + (p1[1] - p0[1]) * u + (p3[1] - p0[1]) * v,
];
const pts = (ps: number[][]) =>
  ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
( A colour mixed toward black by t (the shaded sides and the paper's edge). )
const darken = (hex: string, t: number) =>
  `#${[1, 3, 5]
    .map((i) =>
      Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
const GAP = 0.1;
( The 27 visible stickers: each one's cell on its face and its colour after the scramble. )
const STICKERS = SCRAMBLED.flatMap((s) => {
  const [x, y, z] = s.pos;
  const n = s.normal;
  const at =
    n[1] === 1
      ? { face: "U" as const, i: x + 1, j: z + 1, shade: 0 }
      : n[2] === 1
        ? { face: "F" as const, i: x + 1, j: 1 - y, shade: 0.06 }
        : n[0] === 1
          ? { face: "R" as const, i: 1 - z, j: 1 - y, shade: 0.16 }
          : null;
  if (!at) return [];
  const f = FACE_PTS[at.face];
  const cell = [
    on(f, (at.i + GAP) / 3, (at.j + GAP) / 3),
    on(f, (at.i + 1 - GAP) / 3, (at.j + GAP) / 3),
    on(f, (at.i + 1 - GAP) / 3, (at.j + 1 - GAP) / 3),
    on(f, (at.i + GAP) / 3, (at.j + 1 - GAP) / 3),
  ];
  return [
    {
      key: `${at.face}${at.i}${at.j}`,
      cell,
      color: darken(PALETTE[s.color], at.shade),
    },
  ];
});

( A small paper Rubik's cube, scrappy as the field pieces (founder, 17 Nov 2026: "I liked the previous scrappiness"):
   every sticker a separate piece of cut paper with the page showing between, a darker edge just below and to the
   right for the paper's thickness, a wobble of the cut edges, grain, and the field pieces' drop shadow. )
function CubePaper({ seed = 41 }: { seed?: number }) {
  const id = `cube-door-${seed}`;
  const poly = (key: string, cell: number[][], fill: string) => (
    <polygon
      key={key}
      points={pts(cell)}
      fill={fill}
      stroke={fill}
      strokeWidth="3"
      strokeLinejoin="round"
    />
  );
  return (
    <svg
      className="r-cube-paper"
      viewBox="-14 -14 228 228"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={`${id}-cut`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.07"
            numOctaves="2"
            seed={seed}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter
          id={`${id}-shadow`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="1.5"
            dy="4"
            stdDeviation="5"
            floodColor="#131312"
            floodOpacity="0.2"
          />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.4"
            numOctaves="1"
            seed={seed + 11}
          />
          <feColorMatrix values="0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.06  0 0 0 0.22 0" />
        </filter>
        <mask
          id={`${id}-paper`}
          maskUnits="userSpaceOnUse"
          x="-14"
          y="-14"
          width="228"
          height="228"
        >
          {STICKERS.map((s) => poly(s.key, s.cell, "#fff"))}
        </mask>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <g filter={`url(#${id}-cut)`}>
          {( The paper's thickness: each piece's edge, a shade darker, just below and to the right. )}
          <g transform="translate(1.6 2.4)">
            {STICKERS.map((s) => poly(s.key, s.cell, darken(s.color, 0.28)))}
          </g>
          {STICKERS.map((s) => poly(s.key, s.cell, s.color))}
          <rect
            x="-14"
            y="-14"
            width="228"
            height="228"
            filter={`url(#${id}-grain)`}
            mask={`url(#${id}-paper)`}
          />
        </g>
      </g>
    </svg>
  );
}

*/
/* Vibrant classic cube colours (founder, 17 Nov 2026, after a photo of a real cube: "make sure the colours are vibrant
   enough"). Was a softer set: U #efe8da, D #e6bf55, F #6e9b72, B #4f7f9c, R #c65a43, L #e3913f. */
const PALETTE: Record<Face, string> = {
  U: "#f7f5ef",
  D: "#ffd21f",
  F: "#11a14a",
  B: "#1f5fcf",
  R: "#e2262e",
  L: "#ff8a1c",
};
/* One fixed 10-move scramble (founder, 17 Nov 2026: "a 10 move scramble, once"), with the page's own cube model, so
   the visible faces are mixed as after those moves and stay the same on every visit: L B' F R2 D U' B2 U2 R' B'. */
const SCRAMBLED = applyMoves(solved(), scramble(10, mulberry32(10)));

/* The drawing: the top face, the front face on the left, the right face on the right, isometric in a 200 box. */
const T = [100, 22],
  L = [32, 61],
  R = [168, 61],
  C = [100, 100],
  B = [100, 178],
  LB = [32, 139],
  RB = [168, 139];
const FACE_PTS = { U: [T, R, C, L], F: [L, C, B, LB], R: [C, R, RB, B] };
const SHADE = { U: 0, F: 0.06, R: 0.14 };
/* A point on a face, u along its first edge and v along its last. */
const on = ([p0, p1, , p3]: number[][], u: number, v: number) => [
  p0[0] + (p1[0] - p0[0]) * u + (p3[0] - p0[0]) * v,
  p0[1] + (p1[1] - p0[1]) * u + (p3[1] - p0[1]) * v,
];
const pts = (ps: number[][]) =>
  ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
/* A colour mixed toward black by t (the shaded sides). */
const darken = (hex: string, t: number) =>
  `#${[1, 3, 5]
    .map((i) =>
      Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
const GAP = 0.04;
/* The 27 visible stickers: each one's cell on its face and its colour after the scramble. */
const STICKERS = SCRAMBLED.flatMap((s) => {
  const [x, y, z] = s.pos;
  const n = s.normal;
  const at =
    n[1] === 1
      ? { face: "U" as const, i: x + 1, j: z + 1 }
      : n[2] === 1
        ? { face: "F" as const, i: x + 1, j: 1 - y }
        : n[0] === 1
          ? { face: "R" as const, i: 1 - z, j: 1 - y }
          : null;
  if (!at) return [];
  const f = FACE_PTS[at.face];
  const cell = [
    on(f, (at.i + GAP) / 3, (at.j + GAP) / 3),
    on(f, (at.i + 1 - GAP) / 3, (at.j + GAP) / 3),
    on(f, (at.i + 1 - GAP) / 3, (at.j + 1 - GAP) / 3),
    on(f, (at.i + GAP) / 3, (at.j + 1 - GAP) / 3),
  ];
  return [
    {
      key: `${at.face}${at.i}${at.j}`,
      cell,
      color: darken(PALETTE[s.color], SHADE[at.face]),
    },
  ];
});
/* The black between the stickers, drawn as marker strokes: every face's edges and its two inner lines each way. */
const STROKES = (Object.values(FACE_PTS) as number[][][]).flatMap((f) =>
  [0, 1 / 3, 2 / 3, 1].flatMap((t) => [
    [on(f, t, 0), on(f, t, 1)],
    [on(f, 0, t), on(f, 1, t)],
  ]),
);

/* A small Rubik's cube as stickers outlined in permanent marker (founder, 17 Nov 2026): vibrant stickers with a little
   paper grain, the black between them as bold marker strokes (slightly wobbly, the ink a touch streaky), and the
   field pieces' drop shadow. */
function CubePaper({ seed = 41 }: { seed?: number }) {
  const id = `cube-door-${seed}`;
  return (
    <svg
      className="r-cube-paper"
      viewBox="-14 -14 228 228"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter
          id={`${id}-shadow`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="1.5"
            dy="4"
            stdDeviation="5"
            floodColor="#131312"
            floodOpacity="0.2"
          />
        </filter>
        <filter
          id={`${id}-wobble`}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.07"
            numOctaves="2"
            seed={seed}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* Marker ink: the strokes wobble, and fine streaks along them thin the ink in places. */}
        <filter
          id={`${id}-marker`}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves="2"
            seed={seed + 3}
            result="w"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="w"
            scale="3.5"
            xChannelSelector="R"
            yChannelSelector="G"
            result="d"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9 0.3"
            numOctaves="1"
            seed={seed + 7}
            result="s"
          />
          <feColorMatrix
            in="s"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.8 0 0 0 1.3"
            result="streaks"
          />
          <feComposite in="d" in2="streaks" operator="in" />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.4"
            numOctaves="1"
            seed={seed + 11}
          />
          <feColorMatrix values="0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.06  0 0 0 0.18 0" />
        </filter>
        <mask
          id={`${id}-stickers`}
          maskUnits="userSpaceOnUse"
          x="-14"
          y="-14"
          width="228"
          height="228"
        >
          {STICKERS.map((s) => (
            <polygon key={s.key} points={pts(s.cell)} fill="#fff" />
          ))}
        </mask>
      </defs>
      <g filter={`url(#${id}-shadow)`}>
        <g filter={`url(#${id}-wobble)`}>
          {STICKERS.map((s) => (
            <polygon key={s.key} points={pts(s.cell)} fill={s.color} />
          ))}
          <rect
            x="-14"
            y="-14"
            width="228"
            height="228"
            filter={`url(#${id}-grain)`}
            mask={`url(#${id}-stickers)`}
          />
        </g>
        <g
          filter={`url(#${id}-marker)`}
          stroke="#161514"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {STROKES.map(([a, b], k) => (
            <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
          ))}
          {/* The cube's outline in the same marker, bolder (founder, 17 Nov 2026: a permanent-marker outline too, not only
              the lines between the stickers): one closed stroke round the silhouette. */}
          <polygon
            points={pts([T, R, RB, B, LB, L])}
            fill="none"
            strokeWidth="9.5"
          />
        </g>
      </g>
    </svg>
  );
}

export default function CubeDoor({
  title,
  label = "Rubik's cube demo",
  seed = 41,
  picture,
  className,
  children,
}: {
  /** The card's title. */
  title: string;
  /** The hover label and the button's accessible name. */
  label?: string;
  seed?: number;
  /** The sticker on the button; the cube when not given (17 Nov 2026: the landscape game's sticker too). */
  picture?: React.ReactNode;
  className?: string;
  /** The demo shown in the card. */
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  /* The demo mounts only while the card is open, so it does not run unseen alongside the one in the showcases. */
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className ? `r-cube-door ${className}` : "r-cube-door"}
        aria-haspopup="dialog"
        aria-label={`Open the ${label}`}
        onClick={() => {
          setOpen(true);
          dialog.current?.showModal();
        }}
      >
        {/* <PaperPiece kind={kind} shape="cube" seed={seed} /> */}
        {picture ?? <CubePaper seed={seed} />}
        <span className="r-cube-door-label" aria-hidden="true">
          {label}
        </span>
      </button>
      <dialog
        ref={dialog}
        className="r-access-card r-cube-card"
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          /* A click on the backdrop lands on the dialog itself, outside the card's box. */
          if (e.target !== dialog.current) return;
          const box = dialog.current.getBoundingClientRect();
          const inside =
            e.clientX >= box.left &&
            e.clientX <= box.right &&
            e.clientY >= box.top &&
            e.clientY <= box.bottom;
          if (!inside) dialog.current.close();
        }}
      >
        <div className="r-access-card-head">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="r-access-card-close"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        {/* The showcase panel's own wrapper, so the demo is laid out exactly as inline (founder, 17 Nov 2026: Try it's
            formatting was off in the card); was <div className="r-cube-card-body">. */}
        <div className="r-cube-card-body r-show-panel w-prose">
          {open ? children : null}
        </div>
      </dialog>
    </>
  );
}
