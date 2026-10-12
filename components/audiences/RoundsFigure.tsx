import type { CSSProperties, ReactNode } from 'react';
import './RoundsFigure.css';

/*
 * The worked example on /biopharma (6 Oct 2026), drawn: one search, four
 * rounds. Two of the assay's six settings as the plane (cell density across,
 * antibody dilution up); faint contours stand for the response the team
 * cannot see. Round 1 spreads out, round 2 narrows in (one proposal swapped
 * by the scientist), round 3 drops a region on a late readout, round 4
 * confirms two candidates in replicate. Schematic: no measured data, so no
 * numbers and no axes scales.
 *
 * Plain SVG, one idea, hairlines that never scale (vector-effect), the
 * site's palette: ink structure, teal for the round being run, orange for
 * the chosen candidates (website figure bar, 1 and 4 Oct 2026).
 */

type P = readonly [number, number];

/** Where the response peaks, and the tilt of its ridge (the two settings act together). */
const PEAK: P = [0.68, 0.4];
const TILT = -32;

const round1: P[] = [
  [0.12, 0.18], [0.3, 0.76], [0.5, 0.1], [0.86, 0.86], [0.2, 0.47], [0.64, 0.62],
  [0.44, 0.36], [0.9, 0.3], [0.73, 0.14], [0.14, 0.86], [0.58, 0.9], [0.36, 0.56],
];
const reference: P = [0.27, 0.3];
/** Eight near the best of round 1, and three of four where the model is least certain (the fourth is swapped below). */
const round2: P[] = [
  [0.6, 0.48], [0.7, 0.55], [0.76, 0.42], [0.66, 0.34], [0.55, 0.58], [0.8, 0.26], [0.62, 0.24], [0.71, 0.66],
  [0.08, 0.62], [0.94, 0.66], [0.3, 0.06],
];
/** Proposed, then swapped by the scientist (a reagent lot in short supply). */
const swapped: P = [0.48, 0.72];
const swappedFor: P = [0.38, 0.92];
const round3: P[] = [[0.63, 0.43], [0.71, 0.38], [0.68, 0.48], [0.74, 0.33], [0.6, 0.36], [0.77, 0.47]];
/** The region a late stability readout rules out (upper right). */
const DROPPED = { x: 0.78, y: 0.58 };
const candidates: P[] = [[0.72, 0.39], [0.6, 0.5]];

const S = 240;
const PAD = 14;
const x = (v: number) => PAD + v * (S - 2 * PAD);
const y = (v: number) => S - PAD - v * (S - 2 * PAD);

function Contours() {
  const [cx, cy] = [x(PEAK[0]), y(PEAK[1])];
  return (
    <g className="rf-contours" clipPath="url(#rf-clip)">
      {[0.13, 0.25, 0.38, 0.52, 0.68].map((r) => (
        <ellipse
          key={r}
          cx={cx}
          cy={cy}
          rx={r * (S - 2 * PAD) * 1.25}
          ry={r * (S - 2 * PAD) * 0.62}
          transform={`rotate(${TILT} ${cx} ${cy})`}
        />
      ))}
    </g>
  );
}

function Dots({ points, className, r = 3.2 }: { points: readonly P[]; className: string; r?: number }) {
  return (
    <g className={className}>
      {points.map(([px, py]) => (
        <circle key={`${px}-${py}`} cx={x(px)} cy={y(py)} r={r} />
      ))}
    </g>
  );
}

function Reference() {
  const [rx, ry] = [x(reference[0]), y(reference[1])];
  return <rect className="rf-ref" x={rx - 3.4} y={ry - 3.4} width={6.8} height={6.8} />;
}

function Panel({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <figure className="rf-panel" style={{ '--i': n } as CSSProperties}>
      <svg viewBox={`0 0 ${S} ${S}`} role="presentation" aria-hidden="true">
        <rect className="rf-frame" x={PAD - 6} y={PAD - 6} width={S - 2 * PAD + 12} height={S - 2 * PAD + 12} />
        <Contours />
        {children}
      </svg>
      <figcaption className="rf-cap">
        <span className="s-label">Round {n}</span>
        <span className="rf-cap-line">{title}</span>
      </figcaption>
    </figure>
  );
}

export default function RoundsFigure({ alt }: { alt: string }) {
  const hatch = `M${x(DROPPED.x)} ${y(1) - 6} V${y(DROPPED.y)} H${x(1) + 6}`;
  return (
    <div className="rf" role="img" aria-label={alt}>
      <svg className="rf-defs" width="0" height="0" aria-hidden="true">
        <defs>
          <clipPath id="rf-clip" clipPathUnits="userSpaceOnUse">
            <rect x={PAD - 6} y={PAD - 6} width={S - 2 * PAD + 12} height={S - 2 * PAD + 12} />
          </clipPath>
          <pattern id="rf-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" />
          </pattern>
        </defs>
      </svg>

      <Panel n={1} title="spread out">
        <Reference />
        <Dots points={round1} className="rf-now" />
      </Panel>

      <Panel n={2} title="narrow in">
        <Reference />
        <Dots points={round1} className="rf-past" />
        <Dots points={round2} className="rf-now" />
        <g className="rf-swap">
          <line x1={x(swapped[0]) - 3.4} y1={y(swapped[1]) - 3.4} x2={x(swapped[0]) + 3.4} y2={y(swapped[1]) + 3.4} />
          <line x1={x(swapped[0]) - 3.4} y1={y(swapped[1]) + 3.4} x2={x(swapped[0]) + 3.4} y2={y(swapped[1]) - 3.4} />
          <path d={`M${x(swapped[0])} ${y(swapped[1]) - 6} L${x(swappedFor[0]) + 3} ${y(swappedFor[1]) + 5}`} />
        </g>
        <Dots points={[swappedFor]} className="rf-now" />
      </Panel>

      <Panel n={3} title="a late readout">
        <rect
          className="rf-dropped"
          x={x(DROPPED.x)}
          y={y(1) - 6}
          width={x(1) + 6 - x(DROPPED.x)}
          height={y(DROPPED.y) - (y(1) - 6)}
        />
        <path className="rf-dropped-edge" d={hatch} />
        <Reference />
        <Dots points={[...round1, ...round2, swappedFor]} className="rf-past" />
        <Dots points={round3} className="rf-now" />
      </Panel>

      <Panel n={4} title="confirm">
        <Reference />
        <Dots points={[...round1, ...round2, swappedFor, ...round3]} className="rf-past" />
        {candidates.map(([cx, cy]) => (
          <g key={`${cx}-${cy}`} className="rf-pick">
            <circle className="rf-pick-ring" cx={x(cx)} cy={y(cy)} r={9} />
            {[-1, 0, 1].map((k) => (
              <circle key={k} className="rf-pick-rep" cx={x(cx) + k * 3.6} cy={y(cy)} r={1.35} />
            ))}
          </g>
        ))}
      </Panel>

      <p className="rf-axes s-label" aria-hidden="true">
        <span>Cell density →</span>
        <span>Antibody dilution ↑</span>
        <span className="rf-key rf-key--ref">Reference protocol</span>
        <span className="rf-key rf-key--now">This round</span>
        <span className="rf-key rf-key--past">Earlier rounds</span>
        <span className="rf-key rf-key--pick">Candidates</span>
      </p>
    </div>
  );
}
