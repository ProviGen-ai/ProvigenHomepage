/*
 * The landscape game as a sticker (founder, 17 Nov 2026: "the same sticker style, something that fits our landscape
 * game"), a companion to the cube's (CubeDoor.tsx): a small topographic map in vibrant height bands, a peak with a
 * flag, a lower decoy hill, a hatched failure region, and a few tries marked with crosses, all in the cube's
 * permanent-marker lines, paper grain and drop shadow. Decorative; the button around it carries the name.
 */

/* Height bands, low to high, in the cube's vibrant colours. */
const BANDS = ["#1f5fcf", "#11a14a", "#ffd21f", "#ff8a1c", "#e2262e"];

/* A closed, smooth, slightly irregular blob round (cx, cy): a radius that wobbles with the angle, drawn through 24
   points as a Catmull-Rom curve. */
function blob(cx: number, cy: number, r: number, phase: number) {
  const n = 24;
  const p = Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n;
    const rr =
      r *
      (1 + 0.14 * Math.sin(3 * a + phase) + 0.07 * Math.sin(5 * a + 2 * phase));
    return [cx + rr * Math.cos(a), cy + rr * 0.86 * Math.sin(a)];
  });
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let k = 0; k < n; k++) {
    const p0 = p[(k - 1 + n) % n],
      p1 = p[k],
      p2 = p[(k + 1) % n],
      p3 = p[(k + 2) % n];
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return `${d} Z`;
}

/* The peak's rings (largest first) and the decoy hill's, each a band higher than the one around it. */
const PEAK = [62, 46, 31, 17].map((r, k) => ({
  d: blob(124, 82, r, 0.6 + k * 0.5),
  color: BANDS[k + 1],
}));
const HILL = [30, 17].map((r, k) => ({
  d: blob(60, 140, r, 2.1 + k * 0.7),
  color: BANDS[k + 1],
}));
/* Where runs fail: a region in the lower right, hatched. */
const FAIL = blob(150, 152, 24, 4.2);
/* Tries already made. */
const TRIES = [
  [44, 56],
  [86, 120],
  [70, 150],
  [160, 104],
  [108, 160],
];
/* The sticker: a square with softly rounded corners, a little turned. */
const SQUARE =
  "M30,22 L170,22 Q178,22 178,30 L178,170 Q178,178 170,178 L30,178 Q22,178 22,170 L22,30 Q22,22 30,22 Z";

export default function LandscapeSticker({ seed = 52 }: { seed?: number }) {
  const id = `land-sticker-${seed}`;
  return (
    <svg
      className="r-cube-paper r-land-sticker"
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
        {/* Marker ink, as the cube's: the strokes wobble, and fine streaks along them thin the ink in places. */}
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
        <clipPath id={`${id}-clip`}>
          <path d={SQUARE} />
        </clipPath>
        <pattern
          id={`${id}-hatch`}
          width="7"
          height="7"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="7"
            stroke="#161514"
            strokeWidth="2.2"
          />
        </pattern>
      </defs>
      <g filter={`url(#${id}-shadow)`} transform="rotate(-3 100 100)">
        <g filter={`url(#${id}-wobble)`} clipPath={`url(#${id}-clip)`}>
          <rect x="0" y="0" width="200" height="200" fill={BANDS[0]} />
          {[...HILL, ...PEAK].map((b, k) => (
            <path key={k} d={b.d} fill={b.color} />
          ))}
          <path d={FAIL} fill="#b9b6ae" />
          <path d={FAIL} fill={`url(#${id}-hatch)`} opacity="0.55" />
          <rect
            x="0"
            y="0"
            width="200"
            height="200"
            filter={`url(#${id}-grain)`}
          />
        </g>
        <g
          filter={`url(#${id}-marker)`}
          fill="none"
          stroke="#161514"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <g clipPath={`url(#${id}-clip)`} strokeWidth="3.5">
            {[...HILL, ...PEAK].map((b, k) => (
              <path key={k} d={b.d} />
            ))}
            <path d={FAIL} strokeWidth="4.5" />
          </g>
          <g strokeWidth="4.5">
            {TRIES.map(([x, y]) => (
              <path
                key={`${x}-${y}`}
                d={`M${x - 5},${y - 5} L${x + 5},${y + 5} M${x + 5},${y - 5} L${x - 5},${y + 5}`}
              />
            ))}
          </g>
          {/* The flag on the peak. */}
          <path d="M124,82 L124,52" strokeWidth="4" />
          <path
            d="M124,53 L145,59 L124,66 Z"
            fill="#f7f5ef"
            strokeWidth="3.5"
          />
          <path d={SQUARE} strokeWidth="9.5" />
        </g>
      </g>
    </svg>
  );
}
