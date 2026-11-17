/*
 * A paper-cut accent band (comparison page, founder 14 Nov 2026: colour accents between sections, as paper-like SVGs,
 * not photographs; the register of hand-cut paper sets, not any specific artwork). Layered paper hills in the site's
 * palette, an orange paper sun from the homepage dawn, and a trail of square markers (the fields' bullets) climbing
 * to the highest peak: an outcome landscape and the experiments that find its top. Deterministic (seeded), static SVG,
 * decorative (aria-hidden). Its foot fades into the page.
 */

type Variant = 'dawn' | 'dusk' | 'collage';

const W = 1440;
const H = 380;

/* A small seeded generator, so server and client draw the same band. */
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

/* A ridge: a base height plus a few soft bumps; returns y at x. */
function ridge(seed: number, base: number, amp: number, bumps: number) {
  const r = rng(seed);
  const hills = Array.from({ length: bumps }, () => ({ x: r() * W, w: 120 + r() * 260, h: (0.4 + r() * 0.6) * amp }));
  /* Never above a third of the band, so sky and sun stay visible. */
  return (x: number) => Math.max(H * 0.34, base - hills.reduce((sum, b) => sum + b.h * Math.exp(-((x - b.x) ** 2) / (2 * b.w * b.w)), 0));
}

const STEP = 12;
const path = (f: (x: number) => number) => {
  let d = `M0,${H} L0,${f(0).toFixed(1)}`;
  for (let x = STEP; x <= W; x += STEP) d += ` L${x},${f(x).toFixed(1)}`;
  return `${d} L${W},${H} Z`;
};

/* dawn and dusk: the site's own palette. collage (founder, 14 Nov 2026): colours taken from reference stills the
   founder shared (sand paper, a terracotta weave, a collage's deep blue, a leaf's olive, a pale yellow sun, a red). */
const PALETTES: Record<Variant, { layers: string[]; sun: string; top?: string }> = {
  dawn: { layers: ['#e6d9ab', '#a2d0be', '#429195', '#2a6669'], sun: '#e29f37' },
  dusk: { layers: ['#efc98a', '#e6d9ab', '#a2d0be', '#429195'], sun: '#e29f37' },
  collage: { layers: ['#d9c8a2', '#cf5f33', '#2b5ea7', '#5d7a2e'], sun: '#f2dd8a', top: '#d23a2a' },
};

export default function PaperBand({ variant = 'dawn', seed = 7 }: { variant?: Variant; seed?: number }) {
  const pal = PALETTES[variant];
  const id = `pb-${variant}-${seed}`;
  const layers = [
    ridge(seed * 11 + 1, 250, 70, 4),
    ridge(seed * 11 + 2, 285, 75, 4),
    ridge(seed * 11 + 3, 318, 80, 4),
    ridge(seed * 11 + 4, 352, 45, 5),
  ];

  /* The trail climbs the third layer to its highest point. */
  const climb = layers[2];
  let peakX = 0;
  for (let x = 0; x <= W; x += 4) if (climb(x) < climb(peakX)) peakX = x;
  const from = peakX > W / 2 ? peakX - 520 : peakX + 520;
  const marks = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const x = from + (peakX - from) * (1 - (1 - t) ** 1.6);
    return { x, y: climb(x) - 14 };
  });
  const sun = { x: peakX + (peakX > W / 2 ? -150 : 150), y: climb(peakX) - 70, r: 58 };

  return (
    <div className="r-paper-band" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          {/* Cut edges: a slight, irregular wobble on every paper layer. */}
          <filter id={`${id}-cut`} x="-2%" y="-10%" width="104%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="2" seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feDropShadow in="d" dx="0" dy="-3" stdDeviation="5" floodColor="#131312" floodOpacity="0.18" />
          </filter>
          {/* Paper grain over everything. */}
          <filter id={`${id}-grain`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed + 3} />
            <feColorMatrix values="0 0 0 0 0.07  0 0 0 0 0.07  0 0 0 0 0.07  0 0 0 0.22 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        <g filter={`url(#${id}-cut)`}>
          <circle cx={sun.x} cy={sun.y} r={sun.r} fill={pal.sun} />
        </g>
        {layers.slice(0, 3).map((f, i) => (
          <g key={i} filter={`url(#${id}-cut)`}>
            <path d={path(f)} fill={pal.layers[i]} />
          </g>
        ))}
        {/* The trail on the third layer: outlined paper squares, the last one, on the peak, filled. The front layer
            is cut after it, so it can overlap the trail like a pop-up's front flat. */}
        {marks.map((m, i) => (
          <rect
            key={i}
            x={m.x - 6}
            y={m.y - 6}
            width={12}
            height={12}
            className={i === marks.length - 1 ? 'r-paper-mark r-paper-mark--top' : 'r-paper-mark'}
            style={i === marks.length - 1 && pal.top ? { fill: pal.top } : undefined}
          />
        ))}
        <g filter={`url(#${id}-cut)`}>
          <path d={path(layers[3])} fill={pal.layers[3]} />
        </g>
        <g filter={`url(#${id}-grain)`}>
          {layers.map((f, i) => (
            <path key={i} d={path(f)} fill="#000" />
          ))}
          <circle cx={sun.x} cy={sun.y} r={sun.r} fill="#000" />
        </g>
      </svg>
    </div>
  );
}
