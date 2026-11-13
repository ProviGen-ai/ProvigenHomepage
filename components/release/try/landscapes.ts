/*
 * The try-it panel's hidden landscapes (13 Nov 2026): two settings on [0, 1]
 * and a yield in percent, one per family in "Landscapes it is built for".
 * Each page view shifts the optimum (seeded), so the answer cannot be
 * remembered. null is a failed run (the third landscape fails past a line).
 * These are demo functions computed in the browser, not lab data.
 */

export type Landscape = {
  id: 'smooth' | 'sharp' | 'fails';
  label: string;
  /** Yield in percent at (a, b), or null when the run fails. */
  f: (a: number, b: number) => number | null;
  /** Best yield on the landscape (for the reveal). */
  best: number;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bump = (a: number, b: number, ca: number, cb: number, w: number) => Math.exp(-((a - ca) ** 2 + (b - cb) ** 2) / (2 * w * w));

export function landscapes(seed: number): Landscape[] {
  const r = mulberry32(seed);
  const at = () => 0.2 + 0.6 * r();
  const [sa, sb] = [at(), at()];
  const [pa, pb, ha, hb] = [at(), at(), at(), at()];
  const [fa, fb] = [at(), at()];
  const tilt = 0.6 + 0.6 * r();

  const smooth = (a: number, b: number) => 92 * bump(a, b, sa, sb, 0.28) + 6 * Math.sin(5 * a) * Math.cos(4 * b) + 4;
  /* A broad hill that misleads, and a narrow peak elsewhere that is higher. */
  const sharp = (a: number, b: number) => 62 * bump(a, b, ha, hb, 0.22) + 95 * bump(a, b, pa, pb, 0.045) + 2;
  /* Yield climbs towards a ridge; past a line the formulation precipitates and the run fails. */
  const fails = (a: number, b: number) => {
    if (a + tilt * b > fa + tilt * fb + 0.12) return null;
    return 90 * bump(a, b, fa, fb, 0.2) + 5;
  };

  const max = (f: (a: number, b: number) => number | null) => {
    let m = 0;
    for (let i = 0; i <= 200; i++) for (let j = 0; j <= 200; j++) m = Math.max(m, f(i / 200, j / 200) ?? 0);
    return m;
  };
  return [
    { id: 'smooth', label: 'Smooth trend', f: smooth, best: max(smooth) },
    { id: 'sharp', label: 'Sharp optimum', f: sharp, best: max(sharp) },
    { id: 'fails', label: 'Runs that fail', f: fails, best: max(fails) },
  ];
}
