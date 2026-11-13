import { mulberry32 } from '@/components/writings/bo-sim/model';

/*
 * The try-it panel's hidden landscape (founder, 13 Nov 2026: big and jagged
 * enough, with failure regions, that even placing experiments by hand in two
 * dimensions is hard). Two settings on [0, 1], a yield in percent; null is a
 * failed run. A new landscape is drawn from a fresh seed every time the
 * reader starts over. Demo functions computed in the browser, not lab data.
 *
 * Built from: a few broad hills that look promising and are not the best; a
 * few dozen small bumps and a fine ripple, so the surface is jagged at every
 * scale; one narrow peak, the global optimum, placed away from the hills and
 * outside the failure regions; and several failure regions (ellipses) where
 * the run fails, as a formulation would precipitate.
 */

export type Landscape = {
  seed: number;
  /** Yield in percent at (a, b), or null when the run fails there. */
  f: (a: number, b: number) => number | null;
  /** Best yield on the landscape and where it is (for the reveal). */
  best: number;
  at: [number, number];
};

type Bump = { a: number; b: number; w: number; h: number };
type Blob = { a: number; b: number; ra: number; rb: number; turn: number };

export function makeLandscape(seed: number): Landscape {
  const r = mulberry32(seed);
  const between = (lo: number, hi: number) => lo + (hi - lo) * r();

  const hills: Bump[] = Array.from({ length: 3 }, () => ({ a: between(0.1, 0.9), b: between(0.1, 0.9), w: between(0.12, 0.2), h: between(38, 55) }));
  const bumps: Bump[] = Array.from({ length: 70 }, () => ({ a: r(), b: r(), w: between(0.01, 0.035), h: between(8, 26) }));
  const ripple = { fa: between(22, 36), fb: between(22, 36), pa: between(0, 6.3), pb: between(0, 6.3), h: between(7, 10) };
  const blobs: Blob[] = Array.from({ length: 6 }, () => ({
    a: r(),
    b: r(),
    ra: between(0.08, 0.2),
    rb: between(0.05, 0.14),
    turn: between(0, Math.PI),
  }));

  const failed = (a: number, b: number) =>
    blobs.some((e) => {
      const c = Math.cos(e.turn);
      const s = Math.sin(e.turn);
      const x = (a - e.a) * c + (b - e.b) * s;
      const y = -(a - e.a) * s + (b - e.b) * c;
      return (x / e.ra) ** 2 + (y / e.rb) ** 2 < 1;
    });

  /* The global optimum: narrow, away from the broad hills and from every failure region. */
  let peak: Bump = { a: 0.5, b: 0.5, w: 0.022, h: 60 };
  for (let k = 0; k < 200; k++) {
    const p = { a: between(0.08, 0.92), b: between(0.08, 0.92), w: between(0.018, 0.028), h: 60 };
    const farFromHills = hills.every((h) => Math.hypot(p.a - h.a, p.b - h.b) > h.w * 1.6);
    const clear = !failed(p.a, p.b) && !failed(p.a + 0.05, p.b) && !failed(p.a - 0.05, p.b) && !failed(p.a, p.b + 0.05) && !failed(p.a, p.b - 0.05);
    if (farFromHills && clear) {
      peak = p;
      break;
    }
  }

  const g = (x: Bump, a: number, b: number) => x.h * Math.exp(-((a - x.a) ** 2 + (b - x.b) ** 2) / (2 * x.w * x.w));
  const raw = (a: number, b: number) => {
    let v = 10 + ripple.h * Math.sin(ripple.fa * a + ripple.pa) * Math.sin(ripple.fb * b + ripple.pb);
    for (const h of hills) v += g(h, a, b);
    for (const k of bumps) v += g(k, a, b);
    return v + g(peak, a, b);
  };

  /* Scale so the optimum reads close to 100 %. */
  let top = 0;
  let at: [number, number] = [peak.a, peak.b];
  const N = 300;
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= N; j++) {
      const a = i / N;
      const b = j / N;
      if (failed(a, b)) continue;
      const v = raw(a, b);
      if (v > top) {
        top = v;
        at = [a, b];
      }
    }
  const scale = 98 / top;
  const f = (a: number, b: number) => (failed(a, b) ? null : Math.max(0, Math.min(100, raw(a, b) * scale)));
  return { seed, f, best: 98, at };
}
