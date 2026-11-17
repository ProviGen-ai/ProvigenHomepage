/*
 * Small pictures for "SDM-1 can" (founder, 17 Nov 2026: "easy graphics, similar to the hover card graphics"): the same
 * 92 x 92 line drawings and classes as the benchmark cards (BenchmarkInfo.tsx, .r-bench-pic-* in release.css).
 */

/* Choose the next experiment: results so far (filled), candidates (open), the next batch ringed. */
export function NextPicture() {
  const measured: [number, number, number][] = [
    [18, 70, 0.35],
    [30, 56, 0.5],
    [46, 74, 0.3],
    [24, 32, 0.4],
    [72, 70, 0.45],
    [56, 22, 0.6],
    [44, 44, 0.85],
  ];
  const candidates: [number, number][] = [
    [14, 48],
    [36, 20],
    [80, 44],
    [60, 58],
    [30, 82],
    [74, 18],
  ];
  const next: [number, number][] = [
    [56, 40],
    [66, 32],
    [50, 56],
  ];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-can-pic"
      aria-hidden="true"
      focusable="false"
    >
      <rect x={4} y={4} width={84} height={84} className="r-bench-pic-frame" />
      {measured.map(([x, y, o]) => (
        <circle
          key={`m${x}-${y}`}
          cx={x}
          cy={y}
          r={3.4}
          className="r-bench-pic-fill"
          style={{ opacity: o }}
        />
      ))}
      {candidates.map(([x, y]) => (
        <circle
          key={`c${x}-${y}`}
          cx={x}
          cy={y}
          r={2.6}
          className="r-bench-pic-knob"
        />
      ))}
      {next.map(([x, y]) => (
        <g key={`n${x}-${y}`}>
          <circle cx={x} cy={y} r={2.6} className="r-bench-pic-knob" />
          <circle cx={x} cy={y} r={6} className="r-bench-pic-ring" />
        </g>
      ))}
    </svg>
  );
}

/* Search any mix of settings: steps (whole numbers), three shapes (categories). Was with a slider (continuous) on top
   (founder, 17 Nov 2026: removed), the rows now centred. */
export function MixPicture() {
  const steps = [12, 26, 40, 54, 68];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-can-pic"
      aria-hidden="true"
      focusable="false"
    >
      {/* <line x1={10} y1={18} x2={82} y2={18} className="r-bench-pic-track" />
      <circle cx={58} cy={18} r={4.5} className="r-bench-pic-knob" /> */}
      {steps.map((x, i) => (
        <rect
          key={x}
          x={x}
          /* y={40} */
          y={26}
          width={10}
          height={10}
          className={i === 2 ? "r-bench-pic-fill" : "r-bench-pic-frame"}
        />
      ))}
      {/* At y 74 under the slider: circle cy 74, square y 67, triangle 66-81, ring cy 74. */}
      <circle cx={18} cy={62} r={7} className="r-bench-pic-frame" />
      <rect x={39} y={55} width={14} height={14} className="r-bench-pic-fill" />
      <polygon points="74,54 82,69 66,69" className="r-bench-pic-frame" />
      <circle cx={46} cy={62} r={12} className="r-bench-pic-ring" />
    </svg>
  );
}

/* Start without prior knowledge (founder, 17 Nov 2026: a new picture): an empty search space with only its bounds,
   nothing measured yet, and the first proposal ringed; beside it the objective, an empty bar with the direction to go. */
export function BlankPicture() {
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-can-pic"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x={6}
        y={12}
        width={56}
        height={68}
        className="r-bench-pic-frame r-can-pic-open"
      />
      <path
        d="M6,20 L6,12 L14,12 M54,12 L62,12 L62,20 M62,72 L62,80 L54,80 M14,80 L6,80 L6,72"
        className="r-bench-pic-arrow r-can-pic-corner"
      />
      <circle cx={34} cy={46} r={2.6} className="r-bench-pic-knob" />
      <circle cx={34} cy={46} r={6} className="r-bench-pic-ring" />
      <path
        d="M78,30 L78,14 M73,19 L78,14 L83,19"
        className="r-bench-pic-arrow"
      />
      <rect
        x={73}
        y={36}
        width={10}
        height={44}
        className="r-bench-pic-frame"
      />
    </svg>
  );
}

/* Was the first picture for it (founder, 17 Nov 2026: replaced): unnamed settings into a closed box, one result out.
( Start without prior knowledge: unnamed settings into a closed box, one result out; nothing inside the box. )
export function BlankPicture() {
  const knobs = [0.7, 0.3, 0.55];
  return (
    <svg
      viewBox="0 0 92 92"
      className="r-bench-pic r-can-pic"
      aria-hidden="true"
      focusable="false"
    >
      {knobs.map((k, i) => {
        const y = 28 + i * 18;
        return (
          <g key={i}>
            <line x1={4} y1={y} x2={28} y2={y} className="r-bench-pic-track" />
            <circle
              cx={4 + k * 24}
              cy={y}
              r={3.5}
              className="r-bench-pic-knob"
            />
          </g>
        );
      })}
      <rect
        x={34}
        y={20}
        width={28}
        height={52}
        rx={2}
        className="r-bench-pic-frame r-can-pic-box"
      />
      <path
        d="M64,46 L72,46 M69,43 L72,46 L69,49"
        className="r-bench-pic-arrow"
      />
      <rect
        x={76}
        y={22}
        width={10}
        height={50}
        className="r-bench-pic-frame"
      />
      <rect x={76} y={40} width={10} height={32} className="r-bench-pic-fill" />
    </svg>
  );
}
*/
