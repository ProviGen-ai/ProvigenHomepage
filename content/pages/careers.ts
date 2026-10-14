/*
 * /careers (3 Oct 2026). Competitor review of 3 Oct 2026, R18
 * (output/provigen-competitor-review-2026-10-03): the header nav and the
 * footer link land here instead of on the contact form. The
 * statement-by-statement source map is in the build report of the same day.
 *
 * - The title is the mission line, kept for Join and this page (R05).
 * - "How we work" is R18's three lines, word for word.
 * - No role is confirmed, so there is no role list and no placeholder role
 *   (R18; review §5, empty pages): an open application instead, asking what
 *   the contact form's Join intent asks (content/pages/contact.ts).
 * - "Read first" links two essays; their titles and deks come from
 *   content/writings.ts, not copied here. Since 3 Oct 2026, evening, not the
 *   long-game essay: its ladder named a lab of our own until that day.
 * Not here until confirmed: location, remote policy, hiring steps, stack
 * keywords, and JobPosting data (only once real roles exist).
 */
import { writings, type WritingCard } from '@/content/writings';

/** An essay from the writings ledger by slug. A missing slug fails the build rather than drop a link. */
function essay(slug: string): WritingCard {
  const found = writings.find((w) => w.slug === slug);
  if (!found) throw new Error(`content/writings.ts has no essay "${slug}"`);
  return found;
}

export const careers = {
  meta: {
    title: 'Careers',
    description:
      'Build the AI that steers biology. How we work at ProviGen, what to read first, and how to send an open application.',
  },
  hero: {
    title: { lead: 'Build the AI that', em: 'steers biology' },
    /**
     * The category line (content/site.ts), as the founder worded it on 3 Oct 2026.
     * A word joiner (U+2060) after each hyphen keeps "lab-in-the-loop" on one
     * line; balanced wrapping broke it after "lab-in-the-" at 1440 and 390 px.
     */
    dek: 'We are building lab-⁠in-⁠the-⁠loop AI for experimental biology.',
  },
  principles: {
    id: 'how-we-work',
    label: 'How we work',
    lines: [
      'Scientists decide what runs.',
      'We work on real instruments, in real labs.',
      'Every run is recorded, including the ones that fail.',
    ],
  },
  reading: {
    id: 'read-first',
    label: 'Read first',
    /* "Biology moves only as fast as its experiments" left the site on 8 Oct 2026 (founder). */
    essays: [essay('manifesto')].map(
      ({ href, title, dek }) => ({ href, title, line: dek }),
    ),
  },
  close: {
    id: 'open-application',
    eyebrow: 'Open application',
    /**
     * Joining lives here, not on the contact page (the founder, 3 Oct 2026,
     * evening: Careers its own page, Contact only contact). The question was
     * the contact form's Join intent until then. So the button mails the
     * address the note names instead of leading back to the contact form,
     * and does not repeat the header's "Contact us".
     */
    title: 'What would you build here?',
    note: 'Send something you built, ran or fixed to contact@provigen.ai. Links are welcome.',
    primary: { href: 'mailto:contact@provigen.ai?subject=Open%20application', label: 'Email us' },
  },
} as const;
