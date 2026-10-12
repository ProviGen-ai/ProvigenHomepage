/*
 * Homepage section 6 · the close. Founder, 3 Oct 2026 (evening): the line
 * "Biology’s next era runs through the lab. Come build the AI that steers it."
 * and its Join us button are deleted (careers has its own page in the nav);
 * what stays is one sentence of where we stand and "The long game" as a
 * button. Never say on the site that we build a lab of our own or use
 * partners' data, and leave the renewal ambition out (founder's rule; it
 * replaces the Phase 2 / north-star arc of competitor review R09).
 * Earlier versions are in git (title from copy deck v3, arc from R09).
 */
export const join = {
  /** Where we stand, in one sentence: status written in, no figure, dates or market numbers. */
  line: 'Today we work with partner labs, on their own instruments.',
  /* "The long game" was archived on 4 Oct 2026 (founder); the button now opens the manifesto. */
  link: { href: '/writings/manifesto', label: 'The Manifesto' },
  /**
   * The founder's lab clip of 8 Oct 2026 (~/Desktop/1004(1).mp4: a gripper
   * carries a 96-well plate onto its holder, then a pipette head over a
   * plate), as a blurred backdrop only, treated like the earlier join-lab
   * film: grey and blurred at encode time so no detail or mark reads. The
   * 1 s blue-lit shot is left out, the cuts and the loop seam are dissolves,
   * and every frame is levelled to join-lab's brightness and contrast, so the
   * dawn under it does not pulse (19.5 s loop; IMAGE_PROVENANCE.md). The
   * encodes are smaller than their names say (960 × 540 and 640 × 360).
   * join-lab, the 4 Oct film, now plays behind the opening (content/home/hero.ts).
   */
  film: { name: 'join-plates', poster: '/assets/v3/join-plates-poster.webp' },
} as const;
