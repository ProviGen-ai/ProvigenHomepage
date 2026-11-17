/*
 * Small cut-card pieces placed down the release page (comparison page, founder 14 Nov 2026): colour accents that
 * read as handmade material, not as a banner. Each piece is a card with a slightly wobbling cut edge, visible
 * thickness and a soft shadow, filled with its own texture, all drawn in SVG (no photographs):
 *   cells    stained cells, as under a microscope
 *   leaf     a leaf's veins, with relief
 *   weave    woven cloth with a darker motif
 *   charcoal charcoal smudges on sand paper
 *   marble   a darker marbled ground with fine amber lines
 *   network  fine threads between small nodes on pale paper (machine learning)
 *   strata   wavy stacked layers (infrastructure)
 * Edges darken, a fine grain sits over everything. Decorative (aria-hidden); deterministic per seed. The sample
 * frame of the first draft is gone (founder, 14 Nov 2026: too close to another studio's motif).
 * `shape` cuts the paper as a silhouette of an industry instead of a card (antibody, flask, gear, network, rack).
 * TextureSwatch is the fill alone, without the card.
 */

import type { CSSProperties, ReactNode } from 'react';

export type PieceKind = 'cells' | 'leaf' | 'weave' | 'charcoal' | 'marble' | 'network' | 'strata';

const W = 200;

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

/* A rounded card whose cut edge wobbles a little, as a hand cut does. */
function cardPath(w: number, h: number, r: number, seed: number) {
  const rand = rng(seed);
  const pts: [number, number][] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 4; k++) {
      const a = a0 + (k / 4) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 9));
    for (let k = 1; k < n; k++) {
      const t = k / n;
      const nx = -(y1 - y0);
      const ny = x1 - x0;
      const len = Math.hypot(nx, ny);
      const j = (rand() - 0.5) * 2.4;
      pts.push([x0 + (x1 - x0) * t + (nx / len) * j, y0 + (y1 - y0) * t + (ny / len) * j]);
    }
  };
  corner(w - r, r, -Math.PI / 2);
  edge(w, r, w, h - r);
  corner(w - r, h - r, 0);
  edge(w - r, h, r, h);
  corner(r, h - r, Math.PI / 2);
  edge(0, h - r, 0, r);
  corner(r, r, Math.PI);
  edge(r, 0, w - r, 0);
  return `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')} Z`;
}

/* Each texture: a base colour, the card's edge colour, and the filter primitives that paint over the base. */
type Texture = { base: string; edge: string; filter: (s: number) => ReactNode; overlay?: (w: number, h: number, s: number) => ReactNode };

const TEXTURES: Record<PieceKind, Texture> = {
  cells: {
    base: '#dfe9df',
    edge: '#9bb8ad',
    filter: (s) => (
      <>
        <feTurbulence type="turbulence" baseFrequency="0.028" numOctaves="2" seed={s} result="walls" />
        <feColorMatrix in="walls" values="0 0 0 0 0.2  0 0 0 0 0.44  0 0 0 0 0.45  -8 0 0 0 1.3" result="wallInk" />
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed={s + 5} result="fill" />
        <feColorMatrix in="fill" values="0 0 0 0 0.76  0 0 0 0 0.42  0 0 0 0 0.24  3.4 0 0 0 -1.95" result="stain" />
        <feGaussianBlur in="stain" stdDeviation="0.6" result="stainSoft" />
        <feMerge>
          <feMergeNode in="stainSoft" />
          <feMergeNode in="wallInk" />
        </feMerge>
      </>
    ),
  },
  leaf: {
    base: '#9db48a',
    edge: '#6f8660',
    filter: (s) => (
      <>
        <feTurbulence type="fractalNoise" baseFrequency="0.018 0.03" numOctaves="4" seed={s} result="n" />
        <feComponentTransfer in="n" result="veins">
          <feFuncR type="table" tableValues="0 0 0 0 1 0 0 0 1 0 0 0 0" />
        </feComponentTransfer>
        <feColorMatrix in="veins" values="0 0 0 0 0.93  0 0 0 0 0.94  0 0 0 0 0.72  0.85 0 0 0 0" result="veinInk" />
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed={s + 2} result="relief" />
        <feDiffuseLighting in="relief" surfaceScale="2.4" lightingColor="#fff4dc" result="lit">
          <feDistantLight azimuth="235" elevation="52" />
        </feDiffuseLighting>
        <feColorMatrix in="lit" values="0 0 0 0 0.12  0 0 0 0 0.16  0 0 0 0 0.08  -0.7 0 0 0 0.62" result="shade" />
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed={s + 9} result="spot" />
        <feColorMatrix in="spot" values="0 0 0 0 0.62  0 0 0 0 0.45  0 0 0 0 0.22  5 0 0 0 -3.3" result="blight" />
        <feMerge>
          <feMergeNode in="shade" />
          <feMergeNode in="blight" />
          <feMergeNode in="veinInk" />
        </feMerge>
      </>
    ),
  },
  weave: {
    base: '#d9a07c',
    edge: '#a86e4f',
    filter: (s) => (
      <>
        <feTurbulence type="turbulence" baseFrequency="0.9 0.08" numOctaves="1" seed={s} result="warp" />
        <feTurbulence type="turbulence" baseFrequency="0.08 0.9" numOctaves="1" seed={s + 1} result="weft" />
        <feBlend in="warp" in2="weft" mode="multiply" result="cloth" />
        <feColorMatrix in="cloth" values="0 0 0 0 0.42  0 0 0 0 0.2  0 0 0 0 0.12  -1.1 0 0 0 0.75" result="threads" />
        <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed={s + 4} result="motif" />
        <feColorMatrix in="motif" values="0 0 0 0 0.35  0 0 0 0 0.14  0 0 0 0 0.09  4.5 0 0 0 -2.55" result="motifInk" />
        <feMerge>
          <feMergeNode in="motifInk" />
          <feMergeNode in="threads" />
        </feMerge>
      </>
    ),
  },
  charcoal: {
    base: '#e2d4b2',
    edge: '#b9a679',
    filter: (s) => (
      <>
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed={s} result="tooth" />
        <feColorMatrix in="tooth" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.25  -1.4 0 0 0 0.62" result="sand" />
        <feTurbulence type="fractalNoise" baseFrequency="0.022 0.09" numOctaves="4" seed={s + 3} result="smudge" />
        <feColorMatrix in="smudge" values="0 0 0 0 0.1  0 0 0 0 0.1  0 0 0 0 0.09  7 0 0 0 -4.45" result="char" />
        <feGaussianBlur in="char" stdDeviation="0.8" result="charSoft" />
        <feMerge>
          <feMergeNode in="sand" />
          <feMergeNode in="charSoft" />
        </feMerge>
      </>
    ),
  },
  marble: {
    base: '#21403f',
    edge: '#152a29',
    filter: (s) => (
      <>
        <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="4" seed={s} result="n" />
        <feComponentTransfer in="n" result="iso">
          <feFuncR type="table" tableValues="0 0 1 0 0 0 1 0 0 0 1 0 0 1 0 0" />
        </feComponentTransfer>
        <feColorMatrix in="iso" values="0 0 0 0 0.89  0 0 0 0 0.62  0 0 0 0 0.22  0.95 0 0 0 0" result="lines" />
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed={s + 7} result="pool" />
        <feColorMatrix in="pool" values="0 0 0 0 0.77  0 0 0 0 0.4  0 0 0 0 0.23  5 0 0 0 -3.1" result="clay" />
        <feGaussianBlur in="clay" stdDeviation="3" result="claySoft" />
        <feMerge>
          <feMergeNode in="claySoft" />
          <feMergeNode in="lines" />
        </feMerge>
      </>
    ),
  },
  network: {
    base: '#e8e4d4',
    edge: '#b8b096',
    filter: (s) => (
      <>
        <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="3" seed={s} result="stain" />
        <feColorMatrix in="stain" values="0 0 0 0 0.64  0 0 0 0 0.81  0 0 0 0 0.75  2.6 0 0 0 -1.25" result="mint" />
        <feGaussianBlur in="mint" stdDeviation="2" />
      </>
    ),
    overlay: (w, h, s) => {
      const r = rng(s * 7 + 3);
      const nodes = Array.from({ length: 22 }, () => [8 + r() * (w - 16), 8 + r() * (h - 16)] as const);
      const links: [number, number][] = [];
      nodes.forEach((a, i) => {
        const near = nodes
          .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])] as const)
          .filter(([j]) => j !== i)
          .sort((x, y) => x[1] - y[1])
          .slice(0, 2);
        near.forEach(([j]) => links.push([i, j]));
      });
      return (
        <g>
          {links.map(([i, j], k) => (
            <line key={k} x1={nodes[i][0]} y1={nodes[i][1]} x2={nodes[j][0]} y2={nodes[j][1]} stroke="#2a6669" strokeOpacity="0.55" strokeWidth="1.1" />
          ))}
          {nodes.map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r={k % 5 === 0 ? 4 : 2.6} fill={k % 5 === 0 ? '#c4663a' : '#2a6669'} />
          ))}
        </g>
      );
    },
  },
  strata: {
    base: '#d8ccaa',
    edge: '#a8987a',
    filter: (s) => (
      <>
        <feTurbulence type="fractalNoise" baseFrequency="0.004 0.075" numOctaves="3" seed={s} result="bands" />
        <feComponentTransfer in="bands" result="steps">
          <feFuncR type="discrete" tableValues="0 0.33 0.66 1 0.5" />
        </feComponentTransfer>
        <feColorMatrix in="steps" values="0 0 0 0 0.16  0 0 0 0 0.4  0 0 0 0 0.41  0.9 0 0 0 -0.12" result="teal" />
        <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed={s + 2} result="fiber" />
        <feColorMatrix in="fiber" values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.18  -0.8 0 0 0 0.4" result="fibers" />
        <feMerge>
          <feMergeNode in="teal" />
          <feMergeNode in="fibers" />
        </feMerge>
      </>
    ),
  },
};

/*
 * Silhouettes for the industries black-box optimization serves (founder, 14 Nov 2026: the pieces' shapes, not
 * squares, should resemble each field; holes stay open). Each is mask content in a 200 x 200 box: white is paper,
 * black is a hole. The paper's cut edge gets a slight wobble from a displacement filter.
 */
export type PieceShape = 'card' | 'antibody' | 'flask' | 'gear' | 'network' | 'rack' | 'cube';

const SHAPES: Record<Exclude<PieceShape, 'card'>, () => ReactNode> = {
  /* An antibody, drawn as the textbook IgG (founder, 14 Nov 2026): the stem (Fc) as two chains of two domains, each
     arm (Fab) as a heavy and a light chain side by side, two domains each, notched at the binding tips, and the hinge
     linking arms and stem. Small gaps between the domains stay open. */
  antibody: () => {
    const domain = (x: number, y: number, w = 17, h = 32) => <rect x={x} y={y} width={w} height={h} rx="5" />;
    /* One arm in its own frame, growing upward from (0, 0): the heavy chain at x 0..17, the light chain outside it
       at -22..-5, set a little lower, as in the textbook drawing. Gaps of 5 between domains. */
    const arm = (
      <>
        {domain(0, -34)}
        {domain(0, -71)}
        {domain(-22, -26)}
        {domain(-22, -63)}
      </>
    );
    const notches = (
      <>
        <path d="M2.5 -71 L8.5 -61 L14.5 -71 Z" />
        <path d="M-19.5 -63 L-13.5 -53 L-7.5 -63 Z" />
      </>
    );
    const HINGE_Y = 92;
    const place = (side: 1 | -1, node: ReactNode) => (
      <g transform={`translate(${100 + side * 13} ${HINGE_Y}) rotate(${side * 42})${side === 1 ? ' scale(-1 1)' : ''} translate(-8.5 0)`}>{node}</g>
    );
    return (
      <>
        <g fill="#fff">
          {domain(81, 106, 17, 36)}
          {domain(81, 147, 17, 36)}
          {domain(102, 106, 17, 36)}
          {domain(102, 147, 17, 36)}
          <rect x="86" y="91" width="28" height="4" rx="2" />
          <rect x="86" y="98" width="28" height="4" rx="2" />
          {place(-1, arm)}
          {place(1, arm)}
        </g>
        <g fill="#000">
          {place(-1, notches)}
          {place(1, notches)}
        </g>
      </>
    );
  },
  /* An Erlenmeyer flask, with bubbles rising above its mouth, cut from the same paper (founder, 14 Nov 2026). */
  flask: () => (
    <g fill="#fff">
      <path d="M80 48 H120 Q125 48 125 53 V56 Q125 61 120 61 H116 V100 L160 176 Q165 192 147 192 H53 Q35 192 40 176 L84 100 V61 H80 Q75 61 75 56 V53 Q75 48 80 48 Z" />
      <circle cx="108" cy="30" r="9" />
      <circle cx="88" cy="16" r="6" />
      <circle cx="118" cy="9" r="4.5" />
    </g>
  ),
  /* A gear with its hub hole. */
  gear: () => (
    <>
      <g fill="#fff">
        <circle cx="100" cy="100" r="64" />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x="88" y="14" width="24" height="34" rx="5" transform={`rotate(${i * 36} 100 100)`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="24" fill="#000" />
    </>
  ),
  /* A small neural network: three layers of nodes and the links between them. */
  network: () => {
    /* Three, two, three nodes (founder, 14 Nov 2026). */
    const layers = [
      [36, [40, 100, 160]],
      [100, [70, 130]],
      [164, [40, 100, 160]],
    ] as const;
    const nodes = layers.flatMap(([x, ys]) => ys.map((y) => [x, y] as const));
    const links: [readonly [number, number], readonly [number, number]][] = [];
    for (let l = 0; l < layers.length - 1; l++)
      for (const y0 of layers[l][1]) for (const y1 of layers[l + 1][1]) links.push([[layers[l][0], y0], [layers[l + 1][0], y1]]);
    return (
      <g fill="#fff" stroke="#fff">
        {links.map(([a, b], k) => (
          <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth="9" strokeLinecap="round" />
        ))}
        {nodes.map(([x, y], k) => (
          <circle key={k} cx={x} cy={y} r="18" stroke="none" />
        ))}
      </g>
    );
  },
  /* A Rubik's cube (founder, 17 Nov 2026: the cube demo's door in Application Areas): three faces seen from above,
     each cut into 3 x 3 stickers by narrow gaps. Isometric, in the 200 box: top corner (100, 22), side corners at
     x 32 and 168, the front edge from (100, 100) down to (100, 178). */
  cube: () => {
    const T = [100, 22], L = [32, 61], R = [168, 61], C = [100, 100], B = [100, 178], LB = [32, 139], RB = [168, 139];
    const faces = [
      [T, R, C, L],
      [L, C, B, LB],
      [C, R, RB, B],
    ];
    const at = (a: number[], b: number[], f: number) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    /* Each face's two inner lines in either direction: from one edge to the opposite one at a third and two thirds. */
    const cuts = faces.flatMap(([p0, p1, p2, p3]) =>
      [1 / 3, 2 / 3].flatMap((f) => [
        [at(p0, p1, f), at(p3, p2, f)],
        [at(p0, p3, f), at(p1, p2, f)],
      ]),
    );
    const pts = (f: number[][]) => f.map((p) => p.join(',')).join(' ');
    return (
      <>
        <g fill="#fff">
          {faces.map((f, k) => (
            <polygon key={k} points={pts(f)} strokeLinejoin="round" stroke="#fff" strokeWidth="6" />
          ))}
        </g>
        <g stroke="#000" strokeWidth="5" strokeLinecap="round">
          {cuts.map(([a, b], k) => (
            <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
          ))}
          <polyline points={pts([L, C, R])} fill="none" />
          <line x1={C[0]} y1={C[1]} x2={B[0]} y2={B[1]} />
        </g>
      </>
    );
  },
  /* A server rack: three units, each with drive slots and a status light cut through. */
  rack: () => (
    <>
      <g fill="#fff">
        {[22, 82, 142].map((y) => (
          <rect key={y} x="30" y={y} width="140" height="50" rx="8" />
        ))}
      </g>
      <g fill="#000">
        {[22, 82, 142].map((y) => (
          <g key={y}>
            <rect x="46" y={y + 14} width="16" height="22" rx="3" />
            <rect x="70" y={y + 14} width="16" height="22" rx="3" />
            <rect x="94" y={y + 14} width="16" height="22" rx="3" />
            <circle cx="150" cy={y + 25} r="6" />
          </g>
        ))}
      </g>
    </>
  ),
};

/** The texture alone, filling a w x h box: for shapes other than the card (the textured logo mark). */
export function TextureSwatch({ kind, seed = 1, w = 200, h = 200 }: { kind: PieceKind; seed?: number; w?: number; h?: number }) {
  const t = TEXTURES[kind];
  const id = `ts-${kind}-${seed}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${id}-tex`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          {t.filter(seed)}
        </filter>
      </defs>
      <rect width={w} height={h} fill={t.base} />
      <rect width={w} height={h} filter={`url(#${id}-tex)`} />
      {t.overlay ? t.overlay(w, h, seed) : null}
    </svg>
  );
}

export default function PaperPiece({
  kind,
  seed = 1,
  ratio = 1,
  shape = 'card',
  className,
  style,
}: {
  kind: PieceKind;
  seed?: number;
  /** Height over width (cards only; silhouettes are square). */
  ratio?: number;
  /** The piece's outline: a card, or a silhouette of an industry. */
  shape?: PieceShape;
  className?: string;
  style?: CSSProperties;
}) {
  const H = shape === 'card' ? Math.round(W * ratio) : W;
  const t = TEXTURES[kind];
  const id = `pp-${kind}-${shape}-${seed}`;
  const card = cardPath(W, H, 16, seed);
  /* The paper: a card path, or a silhouette mask (with its holes) whose edges wobble a little. */
  const paper = (fill: string) =>
    shape === 'card' ? <path d={card} fill={fill} /> : <rect x="-14" y="-14" width={W + 28} height={H + 28} fill={fill} mask={`url(#${id}-mask)`} />;
  return (
    <div className={className ? `r-piece ${className}` : 'r-piece'} style={style} aria-hidden="true">
      <svg viewBox={`-14 -14 ${W + 28} ${H + 28}`} focusable="false">
        <defs>
          {shape === 'card' ? (
            <clipPath id={`${id}-clip`}>
              <path d={card} />
            </clipPath>
          ) : (
            <>
              <filter id={`${id}-cut`} x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed={seed} result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-14" y="-14" width={W + 28} height={H + 28}>
                <rect x="-14" y="-14" width={W + 28} height={H + 28} fill="#000" />
                <g filter={`url(#${id}-cut)`}>{SHAPES[shape]()}</g>
              </mask>
            </>
          )}
          <filter id={`${id}-tex`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {t.filter(seed)}
          </filter>
          <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed={seed + 11} />
            <feColorMatrix values="0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.06  0 0 0 0.16 0" />
          </filter>
          <radialGradient id={`${id}-vig`} cx="45%" cy="40%" r="75%">
            <stop offset="55%" stopColor="#131312" stopOpacity="0" />
            <stop offset="100%" stopColor="#131312" stopOpacity="0.38" />
          </radialGradient>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1.5" dy="4" stdDeviation="5" floodColor="#131312" floodOpacity="0.2" />
          </filter>
        </defs>
        <g filter={`url(#${id}-shadow)`}>
          {/* The paper's thickness: its edge, a shade darker, just below and to the right. */}
          <g transform="translate(1.6 2.4)">{paper(t.edge)}</g>
          <g {...(shape === 'card' ? { clipPath: `url(#${id}-clip)` } : { mask: `url(#${id}-mask)` })}>
            <rect width={W} height={H} fill={t.base} />
            <rect width={W} height={H} filter={`url(#${id}-tex)`} />
            {t.overlay ? t.overlay(W, H, seed) : null}
            <rect width={W} height={H} fill={`url(#${id}-vig)`} />
            <rect width={W} height={H} filter={`url(#${id}-grain)`} />
          </g>
        </g>
      </svg>
    </div>
  );
}
