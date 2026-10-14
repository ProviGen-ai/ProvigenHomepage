/*
 * Homepage section 1 · Opening. Headline in the founder's wording (3 Oct
 * 2026), replacing "Most AI for biology predicts it. / We build the AI that
 * steers it." No eyebrow since 3 Oct 2026 (founder); the public line now
 * lands with the problem stage's solution. The second title line is
 * set in teal-ink, upright (Hero.css). The subline is the one from 2 Oct (website
 * story §4.1): what the system does, with "designs" and "supported" as the build
 * statuses allow and scientists deciding what runs.
 */
export const hero = {
  /** 4 Oct 2026, the founder: the v1 site's header text ("with" dropped). */
  title: ['Better Decisions', 'every Experiment'],
  /**
   * Two sentences, one line each on wide screens: the v1 site's subline, taken
   * over on the founder's call of 4 Oct 2026 without v1's three topic pills
   * (Assay Development, Biomanufacturing, Cell Culture). It replaces "Lab-in-the-loop
   * AI that designs your next experiment and learns from every result."
   */
  subline: ['Predicting biological and chemical processes.', 'Built for the infrastructure you already have.'],
  /** One button only (founder, 3 Oct 2026 evening): "Contact us", to the contact page. */
  primary: { href: '/contact', label: 'Contact us' },
  /**
   * The opening film. Since 8 Oct 2026 (founder) it is the close's lab footage
   * (content/home/join.ts), with the same treatment: grey and blurred at encode
   * time, laid over the field in overlay so it plays only in the opening's own
   * colours (Hero.css). It replaces the generated liquid-handling loop
   * (hero-loop, still in /assets/v3). VideoBackdrop expects
   * /assets/v3/<name>-1920.webm|mp4 and <name>-1280.webm|mp4 (phones), plus a
   * poster still.
   */
  video: { name: 'join-lab', poster: '/assets/v3/join-lab-poster.webp' },
} as const;
