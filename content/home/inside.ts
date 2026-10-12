/*
 * Homepage section 4b · A look inside.
 * Sources: copy deck v3 (1 Oct 2026) §4 (compliance fixes 1–2; its evidence lines
 * were removed with the Go deeper box, founder, 4 Oct 2026);
 * film voice-over from output/provigen-video-2026-09-29/film/vo-cues.json
 * (v10, voice Lily, 65.8 s). The workflow screens were cut (1 Oct 2026) and
 * "Where it goes" was removed with the world-models section (1 Oct 2026). A real
 * partner-lab photo (copy deck asset PHOTO-1) has no slot until one exists
 * with consent.
 */

export const inside = {
  film: {
    /*
     * The paper cut of v10 (4 Oct 2026): the same film, frame for frame and with the same
     * soundtrack, re-rendered in the site's palette on pure white so that, multiplied onto the
     * dawn field (Inside.css), it has no frame. The dark v10 stays the email film.
     */
    src: '/assets/v3/film-paper.mp4',
    /* The same opening frame rendered without its title (?poster); the line is set in HTML. */
    poster: '/assets/v3/film-poster-paper.webp',
    label: 'Film · 66 s',
    index: '2026',
    /*
     * "ProviGen in 66 seconds" since 3 Oct 2026 (competitor review R08): "customer
     * film" could read as a testimonial, though its data are illustrative.
     */
    title: 'ProviGen in 66 seconds',
    /** The film plays by itself, muted (founder, 4 Oct 2026); these are its two small controls. */
    controls: { pause: 'Pause', play: 'Play', soundOn: 'Sound on', soundOff: 'Sound off' },
    /** The opening line, set over the poster as the section heading. */
    heading: { lead: 'Same protocol. Same cells.', em: 'Different result', after: '.' },
    /*
     * No caption under the film (founder, 4 Oct 2026). It read "ProviGen in 66 seconds, 2026.
     * Interfaces are schematic and data illustrative."; the film keeps its own "Illustrative
     * data" mark on every data scene, and stage 03's status is still unconfirmed (see
     * IMAGE_PROVENANCE.md, v3).
     */
    /** A closed transcript under the film (R25): the voice-over as text. */
    transcript: 'Transcript',
  },
};

/*
 * Captions for the film, from the voice-over timeline of the v10 cut
 * (vo-cues.json). The voice reads "Provigen" and "titer"; the captions keep the
 * brand spelling and the on-screen "titre".
 */
export const filmCaptions: [start: number, end: number, text: string][] = [
  [0.2, 3.82, 'Same protocol. Same cells. Different result.'],
  [4.16, 7.46, 'Reproducibility is the biggest problem in biology.'],
  [7.76, 11.41, 'ProviGen finds the cause and hardens your protocol.'],
  [11.71, 15.93, 'We connect active learning to the instruments your lab already owns,'],
  [16.13, 20.13, 'and turn process development into one closed loop.'],
  [20.47, 24.76, 'First, we map your workflow and find where the variance comes from:'],
  [24.96, 29.89, 'donors, reagent lots, plate position, timing, noise.'],
  [30.23, 31.87, 'Then we optimise.'],
  [32.21, 35.54, 'Every batch is chosen based on previous results,'],
  [35.74, 39.22, 'for robustness and for the targets you set:'],
  [39.42, 43.49, 'yield, purity, titre, cost, cell identity.'],
  [43.83, 47.87, 'This opens up the ability to adapt the protocols in real time.'],
  [48.21, 51.06, 'Your scientists approve every batch.'],
  [51.4, 53.34, 'You keep the hardened protocol,'],
  [53.54, 57.59, 'a validated operating range, and the full record behind it.'],
  [57.93, 63.03, 'We’re on a mission to make biology reproducible, one process at a time.'],
  [63.37, 65.03, 'Let’s start with yours.'],
];
