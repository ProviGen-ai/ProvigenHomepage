/*
 * Homepage section 3 · Why it matters.
 *
 * 3 Oct 2026, rebuilt in plain language. The founder's verdict on the first
 * version: "the graphic doesn't make much sense, and the whole section doesn't
 * communicate well". Read, write, steer and the height map (Fig. 02) are gone;
 * the old files are in output/provigen-website-v3-2026-10-01/removed-2026-10-03/horizon/.
 *
 * The argument, as a 90-second pitch would make it:
 *   headline   Medicine is moving to biology, and biology moves at the pace of
 *              its experiments (thesis).
 *   point 1    Biotech drugs now outnumber chemical drugs in development (fact).
 *   point 2    Cells are becoming medicines (fact).
 *   point 3    The lab, not thinking, sets the pace (fact, modelled).
 *   ladder     The hero's promise, better decisions, applied to bigger
 *              problems: Now, Next · Planned, Research ambition. The ladder's
 *              line is the section's only graphic (Stakes.tsx).
 * No dollar figure, no market size, no ProviGen result, no company or product
 * name in the text (sources name their publisher only).
 *
 * Fact checks (fact bank of 3 Oct 2026, read at source; read again on launch day):
 * - Citeline, Pharma R&D Annual Review 2026 (data vendor), quoted at source:
 *   "For the first time, biotech drugs outnumber small molecules in the
 *   pipeline." "Chemical drugs" in the text is the plain word for "small
 *   molecules"; the quote keeps the original. No percentage or total (the
 *   50.1% seen in press was not verified at source). Partner check open [TBC];
 *   if it fails, point 1 and its source go.
 * - Science Japan, JST, 18 May 2026 (public-agency news): on 6 March 2026 the
 *   health ministry gave "conditional, time-limited approval to two
 *   regenerative medicine products", "the world's first approval of treatment
 *   products using iPS cells". iPS cells are adult cells turned back into stem
 *   cells. Always "conditionally", always plural, no product names, no "cure".
 *   2006 (mouse cells) is not mentioned, so no causal "twenty years" either.
 * - Hebenstreit, Convalexius et al., Scientific Reports 2026 (peer-reviewed;
 *   scoping review, expert survey and a modelled example): physical lab tasks
 *   accelerate less than cognitive ones, and in the modelled example the lab's
 *   own time constants become the dominant limit. The line is the fact bank's
 *   wording; the label discloses that our founding engineer is a co-author. No factors.
 *
 * Ladder: Now and Next · Planned follow content/phases.ts. The Now line drops
 * "co-developed" and "biofoundries" (jargon) and claims no more than the
 * phases.ts fallback; the full NOW line stays gated (ledger #3). Next names
 * medicine programs (disclosure document of 9 Sep 2026, pillar "proprietary
 * therapeutic programs"), planned. The ambition never appears without its chip
 * and names no cell type ("immune" stays out).
 */
export type SourcePart = { readonly text: string; readonly href?: string };

/** One of the three points: a short title, one sentence, the source line beneath it. */
export type Point = {
  readonly title: string;
  readonly text: string;
  readonly source: readonly SourcePart[];
};

/** One rung of the ladder; `kind` picks the chip (app/site.css .s-status--*) and the line style. */
export type Rung = {
  readonly key: 'now' | 'next' | 'ambition';
  readonly chip: string;
  readonly kind: 'running' | 'planned' | 'ambition';
  readonly line: string;
};

/*
 * Typesetting only: U+00A0 (no-break space) and U+2060 (word joiner) keep each
 * source's type label, and the "·" before it, on one line with the year.
 */
const PEER = 'peer-⁠reviewed';
/** " · " bound to the word before it and the label after it. */
const DOT = '\u00a0·\u00a0';

export const stakes = {
  eyebrow: 'Why it matters',
  /**
   * Two lines; the second is set in teal-ink italic (Stakes.tsx), its full stop
   * in ink. The no-break space in "as fast" keeps phones from ending a line on "as".
   */
  title: ['Medicine is moving from chemistry to biology.', 'Biology moves only as\u00a0fast as its experiments.'],
  points: [
    {
      title: 'Biotech now leads.',
      text: 'For the first time, biotech drugs outnumber chemical drugs in development worldwide.',
      source: [
        { text: `Citeline, Pharma R&D Annual Review 2026${DOT}data\u00a0vendor`, href: 'https://www.citeline.com/en/rd26' },
        { text: ': “For the first time, biotech drugs outnumber small molecules in the pipeline.”' },
      ],
    },
    {
      title: 'Cells become medicines.',
      text: 'In 2026, Japan conditionally approved the first treatments made from adult cells turned back into stem cells.',
      source: [
        {
          text: `Science Japan, JST,\u00a0May\u00a02026${DOT}public-⁠agency\u00a0news`,
          href: 'https://sj.jst.go.jp/stories/2026/s0518-01p.html',
        },
        { text: ': two products, conditional and time-limited approval, 6 March 2026; a world first.' },
      ],
    },
    {
      title: 'The lab sets the pace.',
      text: 'AI can speed up thinking far more than it can speed up the lab.',
      source: [
        {
          text: `Hebenstreit, Convalexius et al., Scientific Reports\u00a02026${DOT}${PEER}, co-authored by our founding engineer`,
          href: 'https://doi.org/10.1038/s41598-025-32583-w',
        },
        { text: ': in a modelled example, the lab’s own time becomes the main limit.' },
      ],
    },
  ] satisfies readonly Point[],
  ladder: {
    /** The hero's promise, scaled. The no-break space keeps "on bigger problems" together on phones. */
    title: 'Better decisions, on\u00a0bigger problems.',
    rungs: [
      { key: 'now', chip: 'Now', kind: 'running', line: 'With partner labs, on their instruments.' },
      {
        key: 'next',
        chip: 'Next · Planned',
        kind: 'planned',
        line: 'In our own automated lab, with medicine programs of our own.',
      },
      {
        key: 'ambition',
        chip: 'Research ambition',
        kind: 'ambition',
        line: 'Programmable human renewal: cells engineered to find damaged cells, clear them and help rebuild what was lost.',
      },
    ] satisfies readonly Rung[],
  },
} as const;
