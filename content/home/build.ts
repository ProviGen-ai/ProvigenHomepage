/*
 * Homepage section 4a · How it works (What we build until 3 Oct 2026). Source:
 * copy deck v3 §4 (1 Oct 2026) as cut for the v3 build brief. Every capability
 * carries its status; statuses
 * were set by ProviGen engineering in September 2026 and must be re-confirmed
 * at launch (copy deck open item 8).
 *
 * 1 Oct 2026: the loop became Design, Implement, Run, Measure, Revise (the
 * stations of Fig. 03). The capability statuses were remapped onto the new
 * stations with their wording and kinds unchanged: protocol compilation and
 * instrument integration moved from Run to Implement, and Revise carries both
 * experiment design (updating the design from results is part of that
 * capability, one-pager status list, Sep 2026) and human review.
 *
 * 2 Oct 2026, cut for sharpness on the founder's request: no lede (the title
 * and the steps say it), no step numbers, no capability names. Each station
 * carries one status chip for the capabilities it covers, with their
 * qualifiers kept:
 *   Design     experiment design                          Running
 *   Implement  protocol compilation (supported workflows),
 *              instrument integration (per instrument)   Running for supported workflows and instruments
 *   Run        scheduling and execution                   In development
 *   Measure    data and provenance                        Running
 *   Revise     experiment design, human review            Running
 *
 * 3 Oct 2026, vision reframe (website story and wording, final draft of 2 Oct
 * 2026, §4.4): "How it works" (the nav and the hero's second button say the
 * same), and a title that names the mechanism instead of an outcome: "Every
 * result steers the next experiment" replaces "ProviGen finds the way from A
 * to B", a performance claim while Run is In development. Revise names who
 * decides. Statuses and kinds are unchanged. The outcome line ("You keep the
 * protocol …") stays out until engineering signs off the stage-03 statuses.
 *
 * 3 Oct 2026, later: the founder removed the status chips from the page. The
 * statuses stay below as the engineering record, and the removed /how-it-works page rendered
 * them in words from here (one status source for every page). The Run line
 * carries its own status in words (competitor review R04).
 */
export type BuildStatusKind = 'running' | 'dev';

export type BuildStation = {
  readonly id: string;
  readonly name: string;
  readonly line: string;
  /**
   * Status of the capabilities behind this station. Not shown on the page since
   * 3 Oct 2026 (founder removed the chips); kept as the engineering record.
   */
  readonly status: string;
  readonly kind: BuildStatusKind;
};

/**
 * One row of the figure's experiment log. Schematic: an illustrative cell-free
 * expression tuning run, not a ProviGen result. `value` is relative (0 to 1)
 * and is only ever drawn as a length, never printed.
 */
export type BuildLogRow = {
  readonly change: string;
  readonly value: number;
  readonly kept: boolean;
};

export const build = {
  eyebrow: 'How it works',
  title: {
    lead: 'Every result steers',
    /** Set in teal-ink, upright (the display face has no italic); Build.tsx adds the full stop in ink. */
    em: 'the next experiment',
  },
  loop: {
    /**
     * One label over the frame: the figure number and its status (the log is
     * illustrative). Fig. 02 since 3 Oct 2026: the homepage went from Fig. 01 to
     * Fig. 03 once the Horizon plate (old Fig. 02) left with "Why it matters".
     */
    /** The canvas's text alternative (it is one image to assistive tech). */
    alt: 'The loop. A signal travels a ring of five stations, Design, Implement, Run, Measure and Revise; each lap is one experiment, numbered at the centre. An experiment log fills row by row: each change, its signal drawn as a bar, and whether it was kept or reverted. A best-so-far line steps up with every kept change.',
    label: 'The loop, step by step',
    /** Described by every step button; the headings themselves stay the step names. */
    hint: 'Select a step to hold the figure there.',
    /** Clockwise from 12 o'clock. */
    stations: [
      {
        id: 'design',
        name: 'Design',
        line: 'Pick the protocol parameters worth running.',
        status: 'Running',
        kind: 'running',
      },
      {
        id: 'implement',
        name: 'Implement',
        line: 'Each design automatically becomes an executable protocol variant.',
        status: 'Running for supported workflows and instruments',
        kind: 'running',
      },
      {
        id: 'run',
        name: 'Run',
        /**
         * Status in words (competitor review R04, 3 Oct 2026): with the chips gone,
         * "Scheduled and run on your instruments, in your lab." read as a live
         * capability. Who runs it (your team) is kept apart from what is automated.
         */
        line: 'Run the protocol on your instruments with selected parameters.',
        status: 'In development',
        kind: 'dev',
      },
      {
        id: 'measure',
        name: 'Measure',
        line: 'Results are automatically acquired and compared to your target metrics.',
        status: 'Running',
        kind: 'running',
      },
      {
        id: 'revise',
        name: 'Revise',
        line: 'The model updates and predicts which parameters are most likely to reach your targets in the next run.',
        status: 'Running',
        kind: 'running',
      },
    ] satisfies readonly BuildStation[],
    /** The experiment log, one row per lap (in PP Supply Mono Regular; keep to the font subset: ASCII, →, °). */
    log: [
      { change: 'reference protocol', value: 0.42, kept: true },
      { change: 'Mg-glutamate 8 → 12 mM', value: 0.51, kept: true },
      { change: '30 → 37 °C', value: 0.46, kept: false },
      { change: 'DNA template 5 → 10 nM', value: 0.58, kept: true },
      { change: 'incubation 4 → 6 h', value: 0.55, kept: false },
      { change: 'K-glutamate 80 → 130 mM', value: 0.66, kept: true },
      { change: 'fresh energy mix', value: 0.71, kept: true },
      { change: 'shaking 300 → 600 rpm', value: 0.63, kept: false },
      { change: 'pH 7.2 → 7.6', value: 0.77, kept: true },
      { change: 'crowding agent 2 %', value: 0.83, kept: true },
    ] satisfies readonly BuildLogRow[],
    /** The icon button's accessible names. */
    pause: 'Pause the loop',
    play: 'Play the loop',
  },
} as const;
