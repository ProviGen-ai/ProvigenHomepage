/* The company arc, one wording reused site-wide. Line style encodes claim status.
   3 Oct 2026, evening, the founder's rule for every public page: nothing says or
   implies that ProviGen builds a lab of its own or uses partners' data. The
   "next" tier (a closed-loop facility of our own) is gone, the "now" tier no
   longer promises that one project's learning carries to the next, and "lab in
   the loop" replaces the orchestration-layer wording. */
export type LineStyle = 'solid' | 'dashed' | 'dotted';

export const phases = [
  {
    key: 'now',
    label: 'Now',
    line: 'solid' as LineStyle,
    title: 'Lab in the loop, with partners',
    strip: 'Co-developed with partner labs and biofoundries',
    summary:
      'Build lab-in-the-loop AI and closed-loop experimental capability with partner laboratories and biofoundries, on their instruments.',
    status: 'Operating',
  },
  {
    key: 'ambition',
    label: 'Ambition',
    line: 'dotted' as LineStyle,
    title: 'Programmable therapeutic cells',
    strip: 'Programmable therapeutic cells',
    summary:
      'Develop tools biology does not yet have, including the ability to program therapeutic cells that recognise damaged tissue, remove what harms it and restore function. An ambition, not a capability.',
    status: 'Research ambition',
  },
] as const;

export const lineLegend = 'Solid = operating · Dotted = ambition';
