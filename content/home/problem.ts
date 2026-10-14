/*
 * Homepage section 2 · The problem, then the turn.
 *
 * 3 Oct 2026, the founder's text, revised the same evening: every protocol is
 * a chain of settings, each one a choice ("Most protocols are inefficient" was
 * cut: it insults the reader's lab); the number of possible protocols grows
 * exponentially, shown as a power (swap 1: 3^10 = 59,049, plain arithmetic, so
 * no source line; `^` marks an exponent and is set as a superscript; its arrow
 * opens a card that plays 1^10 … 10^10; the 3^11 line was cut for it); results from other labs do not carry over to yours
 * (swap 2, no LLM name-drop; its last word cycles through what ProviGen
 * optimises, components/home/problem/RotatingWord.tsx); nobody can test them
 * all, but you can learn which parameters matter most (turn); ProviGen helps you
 * get to your target faster (solution, the founder's words of 4 Oct 2026,
 * "exponentially" cut on his word of 8 Oct 2026; before it, "ProviGen is AI
 * with your lab in the loop"). No multipliers on
 * the page (the 10×/80%/3× row stays off until a methodology packet exists).
 *
 * Earlier versions (plain-language decision story, Errington, the map turn)
 * are in git: tag vision-rebuild-2026-10-03 and commit 9df91a7.
 *
 * Layout (founder, 3 Oct): on wide screens the statement, swaps and turn are
 * small notes written word by word above the landscape as the page scrolls;
 * when the path reaches B they clear and only the solution stands
 * (components/home/Problem.tsx, timings in problem/timeline.ts).
 *
 * Swap lines, the statement and the turn are split at their phrase breaks:
 * one line per beat on wide screens, one line per phrase on phones; each part
 * is still a plain sentence for assistive tech (caps are applied by CSS). In a
 * swap line, `{word}` marks the cycling word.
 */
export const problem = {
  /* 'The turn' removed from the rail (founder, 14 Oct 2026). */
  rail: ['Problem', 'What we do'],
  /** No-break space: "or assay" stays together, so the first sentence breaks after "experiment" or not at all. */
  statement: ['Every experiment or\u00a0assay follows a protocol.', 'Every setting in it is a choice.'],
  swaps: [
    /** `peek`: the blinking arrow and hover card that play 3^n, setting by setting (problem/PowerPeek.tsx). The 3^11 line was cut for it. */
    { lines: ['Ten settings, three values each:', '3^10 = 59,049 possible protocols.'], peek: true },
    {
      lines: ['Reproducibility is notoriously hard to get right.', 'What works in other labs may not work for your {word}.'],
      /** `ownLine`: the first N lines stand on a line of their own (13 Oct 2026), so this fact never
          outgrows the statement and the column keeps its width while the word cycles. */
      ownLine: 1,
      /** The cycling word: what ProviGen optimises. The first is the default (reduced motion, screen readers). */
      rotate: {
        interval: 1300,
        words: [
          'cells',
          'bioprocess',
          'chemical reaction',
          'assay',
          'cell line',
          'culture medium',
          'fermentation',
          'catalyst',
          'enzymes',
          'formulation',
          'stem cells',
          'organoids',
        ],
      },
    },
  ],
  turn: {
    /* "them" points back to the protocols of swaps 1 and 2. Problem.tsx sets
       the punch's last character (here ".") in ink. */
    lead: 'You can’t test them all,',
    punch: 'but you can learn which parameters matter most.',
  },
  /** The founder's lines of 4 Oct 2026 (they replace "ProviGen is AI with your
      lab in the loop."). One heading line per entry; `em` ends the last line, in teal (13 Oct 2026; it was a line of its own). */
  solution: {
    lines: ['ProviGen helps you get', 'to your target'],
    em: 'faster',
    after: '.',
    line: 'It’s an active learning model recommending each next experiment for maximal understanding, so your process reaches its target in fewer runs.',
  },
  figure: {
    /** For the Pause control's name ("Pause the animation"; it holds the whole stage). The visible
        caption "Fig. 01" was cut on 3 Oct 2026 (founder), so the name no longer points to it; its
        status, "Conceptual illustration", stays in the canvas description. */
    label: 'the animation',
    /** Mirrors the hero's "Give it a process and a target." */
    a: 'A · Your process today',
    b: 'B · Your target',
    description:
      'A wireframe landscape, after Waddington’s landscape of 1957. A, where a process is today, sits in one valley. B, the target, lies in another valley across a ridge. Dashed trial-and-error paths leave A and stall on the slopes. One path climbs over the lowest point of the ridge and reaches B. Conceptual illustration.',
  },
} as const;
