import type { CSSProperties } from 'react';
import Reveal from '@/components/Reveal';
import './AiLabs.css';

/*
 * /ai-labs · What we plan (8 Oct 2026, redrawn the same day: the founder found
 * the earlier figures did not match their cards). Each card's figure shows its
 * own words: properties measured across designed protein variants, cells
 * responding by dose and time, DNA and RNA variants and how strongly each is
 * expressed. Hairline SVGs that fill in once seen (Reveal adds .is-in; the
 * motion is in AiLabs.css and is stilled under reduced motion). Schematic:
 * made-up values, no data.
 */

export type ModelCard = {
  readonly id: 'protein' | 'cells' | 'nucleic';
  readonly name: string;
  readonly line: string;
  readonly alt: string;
};

const d = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;

/** Six designed variants (one changed residue each, in teal) by four measured properties. */
function Protein() {
  const props = ['Expr', 'Stab', 'Bind', 'Act'];
  const seqs = ['KLVAEGT', 'KLVPEGT', 'KWVAEGT', 'KLVAEYT', 'RLVAEGT', 'KLVAQGT'];
  const changed = [-1, 3, 1, 5, 0, 4];
  // made-up measurements, 0..1
  const v = [
    [0.55, 0.6, 0.35, 0.4],
    [0.7, 0.45, 0.6, 0.55],
    [0.3, 0.75, 0.2, 0.25],
    [0.85, 0.65, 0.9, 0.8],
    [0.45, 0.3, 0.5, 0.35],
    [0.6, 0.8, 0.4, 0.65],
  ];
  const X = 150;
  const CW = 56;
  const Y = 58;
  const RH = 36;
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      {props.map((p, c) => (
        <text key={p} className="al-tag" x={X + c * CW + CW / 2 - 4} y={Y - 16} textAnchor="middle">
          {p}
        </text>
      ))}
      {seqs.map((seq, r) => (
        <g key={seq}>
          <text className="al-seq" x={18} y={Y + r * RH + 21}>
            {Array.from(seq).map((ch, k) => (
              <tspan key={k} className={k === changed[r] ? 'is-changed' : undefined}>
                {ch}
              </tspan>
            ))}
          </text>
          {props.map((p, c) => (
            <rect
              key={p}
              className="al-cellv"
              x={X + c * CW}
              y={Y + r * RH}
              width={CW - 8}
              height={RH - 8}
              rx={3}
              style={{ ...d(0.25 + c * 0.45 + r * 0.06), '--o': v[r][c] } as CSSProperties}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** Cells by dose (rows) and time (columns): at higher doses and later times they shrink and fade. */
function Cells() {
  const doses = 4;
  const times = 5;
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <text className="al-tag" x={26} y={250} transform="rotate(-90 26 250)">
        Dose →
      </text>
      <text className="al-tag" x={70} y={286}>
        Time →
      </text>
      {Array.from({ length: doses }, (_, r) =>
        Array.from({ length: times }, (_, c) => {
          const dose = (doses - 1 - r) / (doses - 1); // top row = highest dose
          const time = c / (times - 1);
          const effect = dose * time;
          const radius = 22 * (1 - 0.55 * effect);
          const x = 88 + c * 66;
          const y = 44 + r * 62;
          return (
            <g key={`${r}-${c}`} className="al-cell" style={{ ...d(0.25 + c * 0.4 + r * 0.05), '--fade': 1 - 0.6 * effect } as CSSProperties}>
              <circle className="al-cell-wall" cx={x} cy={y} r={radius} />
              <circle className="al-cell-core" cx={x + radius * 0.15} cy={y - radius * 0.1} r={Math.max(3, radius * 0.32)} />
            </g>
          );
        }),
      )}
    </svg>
  );
}

/** A strand with one designed region; its variants below, changed bases in teal, each with how strongly it is expressed. */
function Nucleic() {
  const variants = [
    { seq: 'TATAATGCAC', changed: [], level: 0.45 },
    { seq: 'TATGATGCAC', changed: [3], level: 0.25 },
    { seq: 'TATAATGGAC', changed: [7], level: 0.7 },
    { seq: 'TTTAATGCAC', changed: [1], level: 0.35 },
    { seq: 'TATAATCCAC', changed: [6], level: 0.9 },
    { seq: 'TATAACGCAC', changed: [5], level: 0.15 },
  ];
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      {/* the strand: two backbones and their rungs, the designed region in teal */}
      <line className="al-strand" x1={16} y1={22} x2={384} y2={22} />
      <line className="al-strand" x1={16} y1={36} x2={384} y2={36} />
      {Array.from({ length: 30 }, (_, k) => (
        <line key={k} className="al-rung" x1={22 + k * 12.3} y1={22} x2={22 + k * 12.3} y2={36} />
      ))}
      <rect className="al-region" x={120} y={16} width={130} height={26} rx={3} />
      <path className="al-zoom" d="M120 42 L18 70 M250 42 L232 70" />
      <text className="al-tag" x={300} y={84} textAnchor="middle">
        Expression
      </text>
      {variants.map((v, r) => {
        const y = 104 + r * 32;
        return (
          <g key={v.seq} className="al-variant" style={d(0.3 + r * 0.25)}>
            <text className="al-seq" x={18} y={y + 5}>
              {Array.from(v.seq).map((ch, k) => (
                <tspan key={k} className={v.changed.includes(k) ? 'is-changed' : undefined}>
                  {ch}
                </tspan>
              ))}
            </text>
            <rect className="al-bar-track" x={248} y={y - 6} width={136} height={12} rx={6} />
            <rect className="al-bar" x={248} y={y - 6} width={136 * v.level} height={12} rx={6} />
          </g>
        );
      })}
    </svg>
  );
}

const FIGURES = { protein: Protein, cells: Cells, nucleic: Nucleic } as const;

export default function ModelCards({ cards }: { cards: readonly ModelCard[] }) {
  return (
    <Reveal className="al-cards-wrap" threshold={0.05}>
      <ul className="al-cards">
        {cards.map((card) => {
          const Figure = FIGURES[card.id];
          return (
            <li key={card.id} className="al-card">
              <div className="al-art" role="img" aria-label={card.alt}>
                <Figure />
              </div>
              <h3 className="al-card-name">{card.name}</h3>
              <p className="al-card-line">{card.line}</p>
            </li>
          );
        })}
      </ul>
    </Reveal>
  );
}
