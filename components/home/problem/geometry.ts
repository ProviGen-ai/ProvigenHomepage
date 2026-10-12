/*
 * The process landscape (a Waddington-style height field): valleys are stable
 * states. A sits in a front valley, B in a basin across a ridge, and the only
 * easy crossing is a saddle. World units: x across, z into the picture, y up.
 * Pure functions only; the canvas component owns all drawing.
 */

export type Pt = { x: number; z: number };

export const A: Pt = { x: -2.1, z: 3.1 };
export const B: Pt = { x: 2.2, z: 4.6 };
export const SADDLE: Pt = { x: 0.02, z: 3.88 };

/** Direction the ridge runs: almost straight into the picture, between A and B. */
const ridgeLen = Math.hypot(0.16, 1);
const RIDGE = { x: 0.16 / ridgeLen, z: 1 / ridgeLen };

const bump = (dx: number, dz: number, sx: number, sz: number) =>
  Math.exp(-(dx * dx) / (2 * sx * sx) - (dz * dz) / (2 * sz * sz));
const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Static terrain height at (x, z). */
export function terrain(x: number, z: number) {
  // Rolling ground.
  let h =
    0.09 * Math.sin(0.8 * x + 0.32 * z + 0.4) +
    0.07 * Math.sin(1.2 * z - 0.5 * x + 1.1) +
    0.03 * Math.sin(1.9 * x + 1.4 * z);
  // The two stable states.
  h -= 0.52 * bump(x - A.x, z - A.z, 0.62, 0.52);
  h -= 0.58 * bump(x - B.x, z - B.z, 0.78, 0.62);
  // Dead ends: shallow side valleys that catch failed attempts.
  h -= 0.26 * bump(x + 3.7, z - 5.0, 0.7, 0.75);
  h -= 0.24 * bump(x + 0.9, z - 6.3, 0.85, 0.6);
  h -= 0.22 * bump(x + 3.4, z - 1.9, 0.75, 0.7);
  h -= 0.2 * bump(x - 0.9, z - 1.7, 0.6, 0.55);
  // The ridge between A and B, lowest at the saddle.
  const dx = x - SADDLE.x;
  const dz = z - SADDLE.z;
  const across = dx * RIDGE.z - dz * RIDGE.x;
  const along = dx * RIDGE.x + dz * RIDGE.z;
  const crest = 0.9 - 0.62 * Math.exp(-(along * along) / 1.1);
  const front = (0.3 + 0.7 * smooth(1.2, 3.6, z)) * (1 - 0.45 * smooth(5.5, 9, z));
  h += crest * front * Math.exp(-(across * across) / (2 * 0.48 * 0.48)) * (0.8 + 0.2 * Math.sin(along * 1.5));
  // A far range closes the horizon.
  h += 1.05 * smooth(7, 13, z) * (0.55 + 0.45 * Math.sin(0.45 * x + 0.9));
  return h;
}

/** Slow breathing of the surface. */
export function ripple(x: number, z: number, t: number) {
  return (
    0.035 * Math.sin(t * 0.55 + x * 0.9 + z * 0.55) +
    0.025 * Math.sin(t * 0.37 - x * 0.5 + z * 1.05)
  );
}

export type Camera = {
  f: number;
  cx: number;
  cy: number;
  camX: number;
  camY: number;
  camZ: number;
  cosY: number;
  sinY: number;
  cosP: number;
  sinP: number;
};

/**
 * Perspective camera fitted to the canvas. `horizon` is where the horizon
 * should sit as a fraction of the height; `zoom` scales the focal length.
 */
export function makeCamera(
  width: number,
  height: number,
  { horizon = 0.4, zoom = 0.8, pitch = 0.3, yaw = -0.1, camX = 0.35, camY = 1.6, camZ = -1.2 } = {},
): Camera {
  const f = Math.min(width * 0.7, height * 1.15) * zoom;
  return {
    f,
    cx: width * 0.5,
    cy: height * horizon + f * Math.tan(pitch),
    camX,
    camY,
    camZ,
    cosY: Math.cos(yaw),
    sinY: Math.sin(yaw),
    cosP: Math.cos(pitch),
    sinP: Math.sin(pitch),
  };
}

/** Projects a world point; returns depth (≤ 0.05 means behind the camera). */
export function project(cam: Camera, x: number, y: number, z: number, out: { x: number; y: number }) {
  const px = x - cam.camX;
  const py = y - cam.camY;
  const pz = z - cam.camZ;
  const x1 = cam.cosY * px - cam.sinY * pz;
  const z1 = cam.sinY * px + cam.cosY * pz;
  const y2 = py * cam.cosP + z1 * cam.sinP;
  const z2 = -py * cam.sinP + z1 * cam.cosP;
  if (z2 <= 0.05) return z2;
  out.x = cam.cx + (cam.f * x1) / z2;
  out.y = cam.cy - (cam.f * y2) / z2;
  return z2;
}

/** Deterministic PRNG (mulberry32). */
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

/**
 * Trial-and-error attempts: each leaves A with a heading, wanders, and
 * stalls somewhere that is not B. Parameters are hand-set so the attempts
 * fan out over the slopes and none crosses the saddle; the drawing also
 * keeps every stall point off the A and B labels (draw.ts).
 */
const ATTEMPT_SPECS: { heading: number; length: number; curl: number; wobble: number }[] = [
  { heading: 0.75, length: 2.0, curl: -0.22, wobble: 0.22 },
  { heading: -0.35, length: 1.8, curl: 0.38, wobble: 0.18 },
  { heading: 2.1, length: 2.1, curl: -0.1, wobble: 0.25 },
  { heading: 0.15, length: 1.5, curl: -0.65, wobble: 0.15 },
  { heading: 1.45, length: 2.3, curl: 0.14, wobble: 0.3 },
  { heading: 0.42, length: 1.7, curl: 0.85, wobble: 0.12 },
  { heading: 3.5, length: 1.1, curl: -0.25, wobble: 0.2 },
];

export function buildAttempts(): Pt[][] {
  const random = rng(20261001);
  return ATTEMPT_SPECS.map((spec) => {
    const points: Pt[] = [];
    let x = A.x + (random() - 0.5) * 0.1;
    let z = A.z + (random() - 0.5) * 0.1;
    const phase = random() * Math.PI * 2;
    const step = 0.03;
    const count = Math.round(spec.length / step);
    for (let index = 0; index <= count; index++) {
      const s = index * step;
      const heading = spec.heading + spec.curl * s * s * 0.6 + spec.wobble * Math.sin(s * 4.5 + phase);
      points.push({ x, z });
      x += Math.cos(heading) * step;
      z += Math.sin(heading) * step;
    }
    return points;
  });
}

/** The confident path: A, over the saddle, into B (Catmull-Rom through control points). */
export function buildPath(samples = 160): Pt[] {
  const control: Pt[] = [
    A,
    { x: A.x + 0.7, z: A.z + 0.12 },
    { x: SADDLE.x - 0.65, z: SADDLE.z - 0.4 },
    SADDLE,
    { x: SADDLE.x + 0.65, z: SADDLE.z + 0.38 },
    { x: B.x - 0.55, z: B.z - 0.08 },
    B,
  ];
  const pts = [control[0], ...control, control[control.length - 1]];
  const out: Pt[] = [];
  const segments = control.length - 1;
  for (let index = 0; index <= samples; index++) {
    const u = (index / samples) * segments;
    const seg = Math.min(segments - 1, Math.floor(u));
    const t = u - seg;
    const p0 = pts[seg];
    const p1 = pts[seg + 1];
    const p2 = pts[seg + 2];
    const p3 = pts[seg + 3];
    const t2 = t * t;
    const t3 = t2 * t;
    const cr = (a: number, b: number, c: number, d: number) =>
      0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    out.push({ x: cr(p0.x, p1.x, p2.x, p3.x), z: cr(p0.z, p1.z, p2.z, p3.z) });
  }
  return out;
}
