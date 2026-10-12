/*
 * Card motif for the closed-loop field note: a 384-well plate (16 × 24) shaded
 * by an illustrative readout on the paper → mint → teal ramp, with a drift
 * towards the upper-left corner (the edge effect the field note describes) and
 * nine wells ringed in orange: the next batch the loop proposes. Deterministic
 * (no randomness at render), drawn, not data.
 * Motion: the next-batch wells fill in sequence once the surrounding Reveal
 * adds .is-in; a scan line crosses the plate while the card is hovered.
 */

const ROWS = 16;
const COLS = 24;
const PITCH = 12;
const R = 4.3;
const PAD = 8;
const W = COLS * PITCH + PAD * 2;
const H = ROWS * PITCH + PAD * 2;
const BINS = 6;

const NEXT: [number, number][] = [
  [2, 9],
  [3, 17],
  [4, 18],
  [7, 12],
  [9, 22],
  [10, 6],
  [11, 7],
  [12, 20],
  [14, 14],
];

function hash(r: number, c: number) {
  const s = Math.sin(r * 127.1 + c * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function readout(r: number, c: number) {
  const field =
    0.42 +
    0.22 *
      Math.sin((c / (COLS - 1)) * Math.PI * 1.25 + 0.5) *
      Math.cos((r / (ROWS - 1)) * Math.PI * 0.85);
  const edge = 0.42 * Math.exp(-(r * r + c * c) / 34);
  const noise = (hash(r, c) - 0.5) * 0.16;
  return Math.min(0.999, Math.max(0, field + edge + noise));
}

export default function PlateMotif() {
  const wells: { r: number; c: number; bin: number }[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      wells.push({ r, c, bin: Math.floor(readout(r, c) * BINS) });
    }
  }
  return (
    <div className="w-plate" aria-hidden="true">
      <svg className="w-plate-svg" viewBox={`0 0 ${W} ${H}`} focusable="false">
        <rect
          className="w-plate-body"
          x="0.5"
          y="0.5"
          width={W - 1}
          height={H - 1}
        />
        {wells.map(({ r, c, bin }) => (
          <circle
            key={`${r}:${c}`}
            className={`w-plate-well b${bin}`}
            cx={PAD + c * PITCH + PITCH / 2}
            cy={PAD + r * PITCH + PITCH / 2}
            r={R}
          />
        ))}
        {NEXT.map(([r, c], i) => (
          <circle
            key={`n-${r}:${c}`}
            className="w-plate-next"
            style={{ ['--i' as string]: i }}
            cx={PAD + c * PITCH + PITCH / 2}
            cy={PAD + r * PITCH + PITCH / 2}
            r={R + 1.6}
          />
        ))}
        <line
          className="w-plate-scan"
          x1={PAD}
          x2={PAD}
          y1={PAD - 3}
          y2={H - PAD + 3}
        />
      </svg>
      <div className="w-plate-legend">
        <span className="w-plate-ramp">
          <i />
          Readout
        </span>
        <span className="w-plate-key">
          <i />
          Next batch
        </span>
      </div>
    </div>
  );
}
