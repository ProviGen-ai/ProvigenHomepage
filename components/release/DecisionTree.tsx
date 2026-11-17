'use client';

import './DecisionTree.css';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

/*
 * The hero's background (comparison page, founder 14 Nov 2026): a sequential decision tree of binary choices,
 * top to bottom (turned 90 degrees from the first draft), with one path drawn bold, the decisions a campaign actually took. Decorative only
 * (aria-hidden). The bold path shares its colour with the subtitle under the title.
 *
 * Traced (founder, 15 Nov 2026): the whole tree is drawn faint, and the bold path draws itself one decision at a time
 * behind a moving node, bright near it and darkening further back; each node fills in once the moving node has left
 * it. Once the path reaches its leaf it holds, fades slowly, and a new path is traced (founder, 15 Nov 2026), the
 * first always PATH and the later ones random-looking but the same sequence on every load. The animation is CSS; the script only picks the next path when a fade ends. With reduced motion the
 * first path shows finished, and stays.
 */

/* Four levels of choices, 16 leaves (founder, 14 Nov 2026: one level fewer than the first draft). */
const DEPTH = 4;
/* The first path (the server's render, so the page hydrates as rendered): at each level, 0 = the left branch, 1 = the right one. */
const PATH = [1, 0, 1, 1];
const W = 640;
/* Tall enough to run from the title down past the two paragraphs below it (founder, 14 Nov 2026). */
const H = 545;
const PAD = 24;

type Node = { x: number; y: number; depth: number; index: number };

/* Level d has 2^d nodes, spread evenly over the width; y steps down with each decision. */
const node = (depth: number, index: number): Node => {
  const count = 2 ** depth;
  return {
    x: PAD + ((index + 0.5) / count) * (W - 2 * PAD),
    y: PAD + (depth / DEPTH) * (H - 2 * PAD),
    depth,
    index,
  };
};

/* The whole tree, faint. */
const edges: { from: Node; to: Node }[] = [];
const nodes: Node[] = [];
for (let d = 0; d <= DEPTH; d++)
  for (let i = 0; i < 2 ** d; i++) {
    nodes.push(node(d, i));
    if (d < DEPTH) for (const side of [0, 1]) edges.push({ from: node(d, i), to: node(d + 1, 2 * i + side) });
  }

/* A path's branches, root to leaf, and its nodes. */
const traced = (path: number[]) => {
  const at = [node(0, 0)];
  path.forEach((side, d) => at.push(node(d + 1, 2 * at[d].index + side)));
  return { branches: path.map((_, d) => ({ from: at[d], to: at[d + 1] })), stops: at };
};

/* The next round's path: random-looking but the same on every load (founder, 15 Nov 2026: deterministic on page
   load), drawn from a small seeded generator (mulberry32) by round number, and never the same path twice in a row. */
const seeded = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const nextPath = (last: number[], round: number) => {
  const random = seeded(round * 7919 + 17);
  for (;;) {
    const path = last.map(() => (random() < 0.5 ? 0 : 1));
    if (path.join('') !== last.join('')) return path;
  }
};

/* A branch leaves its node downward and bends into the child, like a tidy tree diagram. */
const curve = (a: Node, b: Node) => {
  const mid = (a.y + b.y) / 2;
  return `M${a.x},${a.y} C${a.x},${mid} ${b.x},${mid} ${b.x},${b.y}`;
};

/* The trace's timing (seconds): node d is reached at START + d * STEP; the moving node rests there for REST, then
   travels the branch to node d + 1. */
const START = 0.5;
const STEP = 0.7;
const REST = 0.2;
/* The gradient behind the moving node: each branch in PIECES pieces, each turning from bright to dark over AGE seconds. */
const PIECES = 24;
const AGE = 0.9;
const travel = DEPTH * STEP;
/* After the leaf: the finished path holds, then fades over FADE seconds (founder, 15 Nov 2026: slowly). */
const FADE_AT = START + travel + AGE + 1.6;
const FADE = 1.8;
/* Then the bare tree for PAUSE seconds before the next round's root fades in (founder, 15 Nov 2026: 700 ms). */
const PAUSE = 0.7;

/* Each branch's length (sampled), so the moving node keeps pace with the bright stroke drawn behind it. A branch at a
   given level is as long whichever way it turns (the tree is symmetric), so the timing is the same for every path. */
const cubicLength = (a: Node, b: Node) => {
  const mid = (a.y + b.y) / 2;
  const at = (t: number) => {
    const u = 1 - t;
    const x = u ** 3 * a.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t ** 3 * b.x;
    const y = u ** 3 * a.y + 3 * u * u * t * mid + 3 * u * t * t * mid + t ** 3 * b.y;
    return [x, y];
  };
  let length = 0;
  let [px, py] = at(0);
  for (let i = 1; i <= 64; i++) {
    const [x, y] = at(i / 64);
    length += Math.hypot(x - px, y - py);
    [px, py] = [x, y];
  }
  return length;
};
const lengths = traced(PATH).branches.map((e) => cubicLength(e.from, e.to));
const total = lengths.reduce((a, b) => a + b, 0);
/* The moving node's keys: rest at each node, then move along its branch. */
const keyTimes: number[] = [];
const keyPoints: number[] = [];
let done = 0;
lengths.forEach((length, d) => {
  keyTimes.push((d * STEP) / travel, (d * STEP + REST) / travel);
  keyPoints.push(done / total, done / total);
  done += length;
});
keyTimes.push(1);
keyPoints.push(1);
/* The moving node's keyframes (offset-distance runs along the whole path). */
const pct = (x: number) => `${(x * 100).toFixed(3)}%`;
const moveKeyframes = `@keyframes r-tree-move {${keyTimes.map((t, k) => ` ${pct(t)} { offset-distance: ${pct(keyPoints[k])}; }`).join('')} }`;

const s = (style: Record<string, string>) => style as React.CSSProperties;

export default function DecisionTree() {
  /* The path being traced, and a count of rounds (the key that restarts the CSS animations). */
  const [round, setRound] = useState({ path: PATH, n: 0 });
  /* The pause between a round's fade and the next round. */
  const gap = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(gap.current), []);
  const { branches, stops } = traced(round.path);
  const fullPath = branches.map((e, d) => (d === 0 ? curve(e.from, e.to) : curve(e.from, e.to).replace(/^M[^C]*/, ''))).join(' ');
  return (
    <svg className="r-tree" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <style>{moveKeyframes}</style>
      {/* The faint tree, whole (the traced path's branches and nodes too, so nothing is missing before the trace). */}
      {edges.map((e, k) => (
        <path key={`e${k}`} d={curve(e.from, e.to)} className="r-tree-edge" />
      ))}
      {nodes.map((n) => (
        <circle
          key={`n${n.depth}-${n.index}`}
          cx={n.x}
          cy={n.y}
          r={n.depth === DEPTH ? 2 : 3}
          /* The root, where every path starts, is filled (founder, 15 Nov 2026); the other nodes are hollow. */
          className={n.depth === 0 ? 'r-tree-node r-tree-node--root' : 'r-tree-node'}
        />
      ))}
      {/* One round: traced, held, faded; a second after the fade ends the next round starts with a new path. */}
      <g
        key={round.n}
        className="r-tree-round"
        style={s({ '--fade-at': `${FADE_AT}s`, '--fade': `${FADE}s` })}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && event.animationName === 'r-tree-fade')
            gap.current = window.setTimeout(() => setRound((r) => ({ path: nextPath(r.path, r.n + 1), n: r.n + 1 })), PAUSE * 1000);
        }}
      >
        {/* A bright stroke draws right behind the moving node; over it, the branch in short pieces, each turning from
            the bright colour to the dark one as the node moves on, so the colour runs in a gradient from the node back
            along the path (founder, 15 Nov 2026: no second, dark stroke chasing it). */}
        {branches.map((e) => (
          <path
            key={`lead${e.from.depth}`}
            d={curve(e.from, e.to)}
            pathLength={1}
            className="r-tree-edge r-tree-lead r-tree-trace"
            style={s({
              '--start': `${START + e.from.depth * STEP + REST}s`,
              '--dur': `${STEP - REST}s`,
              '--gone': `${START + (e.from.depth + 1) * STEP + AGE}s`,
            })}
          />
        ))}
        {branches.flatMap((e) =>
          Array.from({ length: PIECES }, (_, k) => (
            <path
              key={`g${e.from.depth}-${k}`}
              d={curve(e.from, e.to)}
              pathLength={1}
              className="r-tree-edge r-tree-edge--bold r-tree-age"
              /* Piece k of the branch (a hair longer, so no seam shows between pieces), shown once the bright stroke
                 has drawn it. */
              strokeDasharray={`${1 / PIECES + 0.006} 2`}
              strokeDashoffset={-k / PIECES}
              style={s({ '--start': `${START + e.from.depth * STEP + REST + ((k + 1) / PIECES) * (STEP - REST)}s` })}
            />
          )),
        )}
        {/* The first draft's dark stroke, a fixed lag behind (replaced by the gradient above, founder 15 Nov 2026).
        {pathEdges.map((e) => (
          <path
            key={`b${e.from.depth}`}
            d={curve(e.from, e.to)}
            pathLength={1}
            className="r-tree-edge r-tree-edge--bold r-tree-trace"
            style={{ '--start': `${START + e.from.depth * STEP + REST + 0.35}s`, '--dur': `${STEP - REST}s` } as React.CSSProperties}
          />
        ))} */}
        {/* The moving node: hollow and brighter, resting at each node, then running down the chosen branch. On the
            same CSS clock as the strokes (founder, 15 Nov 2026: an SVG animateMotion ran on its own clock and fell
            behind the bright stroke). Drawn under the filled nodes, so a filled node covers it (founder, 15 Nov 2026). */}
        <circle
          r={4}
          className="r-tree-head r-tree-trace"
          style={s({
            '--start': `${START}s`,
            '--travel': `${travel}s`,
            '--end': `${START + travel + 0.4}s`,
            offsetPath: `path('${fullPath}')`,
          })}
        />
        {stops.map((n) => (
          <circle
            key={`p${n.depth}`}
            cx={n.x}
            cy={n.y}
            r={5}
            /* Filled once the moving node has reached the next level (the leaf, a moment after it arrives); on the
               every round the root fades in dark from the start (founder, 15 Nov 2026). */
            className={`r-tree-node r-tree-node--bold r-tree-trace${n.depth === 0 ? ' r-tree-node--set' : ''}`}
            style={s({ '--start': `${START + (n.depth + 1) * STEP + (n.depth === DEPTH ? -0.3 : 0)}s` })}
          />
        ))}
      </g>
    </svg>
  );
}
