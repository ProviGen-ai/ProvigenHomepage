'use client';

import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { useInViewMotion } from '@/lib/use-in-view-motion';
import './AiLabs.css';

/*
 * /ai-labs · the BindCraft example (8 Oct 2026). A thousand designed binders
 * as a map (made-up, clustered points, as an embedding of designs would be).
 * Plate 1 picks 24 across the whole map; measured, a few bind (orange). Plate
 * 2 gathers its 24 around those binders and finds more. Then again.
 * Schematic: no outcome figures; which designs bind is invented.
 *
 * One clock from useInViewMotion (in view, visible tab, motion allowed, not
 * paused). Under reduced motion the map shows plate 2 measured.
 */

const N = 1000;
const W = 560;
const H = 320;
const PLATE = 24;
const BEAT = 2.6;
const STEPS = 5;

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

type Pt = { x: number; y: number; binds: boolean };

/** Seven clusters of designs; two of them hold most of the binders. */
function makeMap(): Pt[] {
  const r = rng(20261008);
  const centres = [
    [0.16, 0.3], [0.34, 0.72], [0.5, 0.28], [0.66, 0.66], [0.84, 0.34], [0.22, 0.78], [0.8, 0.82],
  ];
  const hot = new Set([3, 4]);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: N }, () => {
    const k = Math.floor(r() * centres.length);
    const [cx, cy] = centres[k];
    const x = Math.min(0.98, Math.max(0.02, cx + gauss() * 0.075));
    const y = Math.min(0.96, Math.max(0.04, cy + gauss() * 0.09));
    const core = Math.hypot((x - cx) / 0.075, (y - cy) / 0.09);
    const binds = hot.has(k) ? core < 1.15 && r() < 0.55 : r() < 0.015;
    // rounded: server and browser maths differ in the last digits, which would break hydration
    return { x: Math.round(x * W * 100) / 100, y: Math.round(y * H * 100) / 100, binds };
  });
}

/** Plate 1: the design nearest each cell of a 6 × 4 grid over the map, so it spreads out. */
function firstPlate(pts: Pt[]): number[] {
  const out: number[] = [];
  for (let gy = 0; gy < 4; gy++)
    for (let gx = 0; gx < 6; gx++) {
      const tx = ((gx + 0.5) / 6) * W;
      const ty = ((gy + 0.5) / 4) * H;
      let best = -1;
      let bd = Infinity;
      pts.forEach((p, k) => {
        if (out.includes(k)) return;
        const dd = (p.x - tx) ** 2 + (p.y - ty) ** 2;
        if (dd < bd) {
          bd = dd;
          best = k;
        }
      });
      out.push(best);
    }
  return out;
}

/** Plate 2: the unmeasured designs nearest plate 1's binders, with four kept for exploring. */
function secondPlate(pts: Pt[], first: number[]): number[] {
  const hits = first.filter((k) => pts[k].binds);
  const seen = new Set(first);
  const near = pts
    .map((p, k) => ({ k, d: seen.has(k) ? Infinity : Math.min(...hits.map((h) => (p.x - pts[h].x) ** 2 + (p.y - pts[h].y) ** 2)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, PLATE - 4)
    .map((e) => e.k);
  const r = rng(7);
  const explore: number[] = [];
  while (explore.length < 4) {
    const k = Math.floor(r() * N);
    if (!seen.has(k) && !near.includes(k) && !explore.includes(k)) explore.push(k);
  }
  return [...near, ...explore];
}

export default function BinderMap({ alt, labels }: { alt: string; labels: readonly string[] }) {
  const { ref, running, allowed, paused, setPaused } = useInViewMotion<HTMLDivElement>(0.25);
  const [tick, setTick] = useState(0);
  const { pts, p1, p2 } = useMemo(() => {
    const map = makeMap();
    const first = firstPlate(map);
    return { pts: map, p1: new Set(first), p2: new Set(secondPlate(map, first)) };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % STEPS), BEAT * 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const step = allowed ? tick : 4;

  return (
    <div ref={ref} className="al-bm" data-step={step}>
      <svg className="al-bm-svg" viewBox={`0 0 ${W} ${H + 30}`} role="img" aria-label={alt}>
        {pts.map((p, k) => {
          const in1 = p1.has(k);
          const in2 = p2.has(k);
          const picked = (in1 && step >= 1) || (in2 && step >= 3);
          const measured = (in1 && step >= 2) || (in2 && step >= 4);
          return (
            <circle
              key={k}
              className={clsx('al-bm-dot', picked && 'is-picked', measured && (p.binds ? 'is-hit' : 'is-miss'))}
              cx={p.x}
              cy={p.y}
              r={picked ? 4.2 : 1.6}
            />
          );
        })}
        <text className="al-tag" x={0} y={H + 24}>
          {labels[step]}
        </text>
      </svg>
      {allowed ? (
        <button
          type="button"
          className="al-play al-play--bm"
          aria-label={paused ? 'Play the animation' : 'Pause the animation'}
          onClick={() => setPaused(!paused)}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            {paused ? <path d="M4 2v8l6-4z" fill="currentColor" /> : <path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" />}
          </svg>
        </button>
      ) : null}
    </div>
  );
}
