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

/*
 * A gentler landscape (comparison page, founder 14 Nov 2026): fewer peaks, broader and less sharp, spread
 * out; most of them below 70 to 80, exactly two above 80 and exactly one above 90. Peaks combine by their
 * maximum, not their sum, so each peak's height is exactly what is drawn here, and the two highest peaks sit
 * clear of the failure regions (fewer and smaller than in makeLandscape).
 */
export function makeGentleLandscape(seed: number): Landscape {
  const r = mulberry32(seed);
  const between = (lo: number, hi: number) => lo + (hi - lo) * r();

  const blobs: Blob[] = Array.from({ length: 3 }, () => ({
    a: r(),
    b: r(),
    ra: between(0.06, 0.13),
    rb: between(0.04, 0.09),
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
  const clearAround = (a: number, b: number, d: number) =>
    [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d]].every(([da, db]) => !failed(a + da, b + db));

  /* Heights: one above 90, one between 80 and 90, five between 45 and 78. */
  const heights = [between(91, 96), between(81, 88), ...Array.from({ length: 5 }, () => between(45, 78))];
  const peaks: Bump[] = [];
  for (const [k, h] of heights.entries()) {
    const top = k < 2;
    let placed: Bump | null = null;
    for (let tries = 0; tries < 400 && !placed; tries++) {
      const p = { a: between(0.08, 0.92), b: between(0.08, 0.92), w: top ? between(0.05, 0.065) : between(0.06, 0.1), h };
      const spread = peaks.every((q) => Math.hypot(p.a - q.a, p.b - q.b) > 0.24);
      if (spread && (!top || clearAround(p.a, p.b, 0.07))) placed = p;
    }
    peaks.push(placed ?? { a: between(0.1, 0.9), b: between(0.1, 0.9), w: 0.07, h });
  }

  const g = (x: Bump, a: number, b: number) => x.h * Math.exp(-((a - x.a) ** 2 + (b - x.b) ** 2) / (2 * x.w * x.w));
  /* A low, gentle floor (5 to 15) under the peaks; peaks combine by their maximum. */
  const floor = (a: number, b: number) => 10 + 5 * Math.sin(3 * a + seed) * Math.cos(2.5 * b + seed / 7);
  const raw = (a: number, b: number) => Math.max(floor(a, b), ...peaks.map((p) => g(p, a, b)));
  const f = (a: number, b: number) => (failed(a, b) ? null : Math.max(0, Math.min(100, raw(a, b))));
  return { seed, f, best: Math.round(peaks[0].h * 10) / 10, at: [peaks[0].a, peaks[0].b] };
}

/*
 * Wider optima and ridges (founder, 14 Nov 2026, comparison page): the gentle landscape's layout and heights (one
 * peak above 90, one from 80 to 90, five from 45 to 78), with broader peaks, and some of them not round: a ridge is a
 * peak stretched along a turned axis and bent a little, so the good region is a curved band rather than a disc. One
 * long, low ridge (35 to 50) runs across much of the field, a trail that leads somewhere but not to the top.
 */
type Ridge = { a: number; b: number; h: number; along: number; across: number; turn: number; bend: number };

export function makeRidgedLandscape(seed: number): Landscape {
  const r = mulberry32(seed);
  const between = (lo: number, hi: number) => lo + (hi - lo) * r();

  const blobs: Blob[] = Array.from({ length: 3 }, () => ({
    a: r(),
    b: r(),
    ra: between(0.06, 0.12),
    rb: between(0.04, 0.08),
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
  const clearAround = (a: number, b: number, d: number) =>
    [[0, 0], [d, 0], [-d, 0], [0, d], [0, -d]].every(([da, db]) => !failed(a + da, b + db));

  /* Most local optima well below 80 (founder, 14 Nov 2026): the five lower ones from 40 to 74. */
  const heights = [between(91, 96), between(81, 88), ...Array.from({ length: 5 }, () => between(40, 74))];
  /* Which are ridges: the second-best and two of the lower ones; the best stays a broad, round top. */
  const ridged = new Set([1, 3, 5]);
  const shapes: Ridge[] = [];
  for (const [k, h] of heights.entries()) {
    const top = k === 0;
    const ridge = ridged.has(k);
    let placed: Ridge | null = null;
    for (let tries = 0; tries < 400 && !placed; tries++) {
      const w = top ? between(0.075, 0.09) : between(0.08, 0.12);
      const p: Ridge = {
        a: between(0.1, 0.9),
        b: between(0.1, 0.9),
        h,
        along: ridge ? between(0.16, 0.24) : w,
        across: ridge ? between(0.045, 0.06) : w,
        turn: between(0, Math.PI),
        bend: ridge ? between(-2.2, 2.2) : 0,
      };
      const spread = shapes.every((q) => Math.hypot(p.a - q.a, p.b - q.b) > 0.26);
      if (spread && (!top || clearAround(p.a, p.b, 0.08))) placed = p;
    }
    shapes.push(placed ?? { a: between(0.1, 0.9), b: between(0.1, 0.9), h, along: 0.09, across: 0.09, turn: 0, bend: 0 });
  }
  /* The long, low trail: centred somewhere in the middle, long and thin, bent. */
  shapes.push({ a: between(0.35, 0.65), b: between(0.35, 0.65), h: between(35, 50), along: between(0.3, 0.38), across: 0.04, turn: between(0, Math.PI), bend: between(-1.6, 1.6) });

  /* A turned, bent Gaussian: x along the axis, y across it, the axis curving by bend * x^2. Its top is its centre. */
  const g = (s: Ridge, a: number, b: number) => {
    const c = Math.cos(s.turn);
    const n = Math.sin(s.turn);
    const x = (a - s.a) * c + (b - s.b) * n;
    const y = -(a - s.a) * n + (b - s.b) * c - s.bend * x * x;
    return s.h * Math.exp(-(x * x) / (2 * s.along * s.along) - (y * y) / (2 * s.across * s.across));
  };
  const floor = (a: number, b: number) => 10 + 5 * Math.sin(3 * a + seed) * Math.cos(2.5 * b + seed / 7);
  const raw = (a: number, b: number) => Math.max(floor(a, b), ...shapes.map((s) => g(s, a, b)));
  const f = (a: number, b: number) => (failed(a, b) ? null : Math.max(0, Math.min(100, raw(a, b))));
  return { seed, f, best: Math.round(shapes[0].h * 10) / 10, at: [shapes[0].a, shapes[0].b] };
}
