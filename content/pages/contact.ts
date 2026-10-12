/*
 * /contact (v3, 1 Oct 2026). Copy from
 * output/provigen-website-v3-2026-10-01/research/copy-deck-v3.md · Contact page.
 *
 * 3 Oct 2026, competitor review R11 and R17: the form sends for real (POST
 * /api/contact, through Resend) and opens the mailto draft it always opened
 * when sending fails.
 *
 * 3 Oct 2026, evening, the founder's calls: "Contact us", one page with
 * contact and nothing else ("nur Contact und keine Unterkategorie"), at
 * contact@provigen.ai. The five intents (Partner, Join, Invest, Research,
 * Press), the partner brief and the press boilerplate went with it; joining
 * lives on /careers. Old ?intent= links land on this same page. No reply time
 * is promised, and nothing is said about storage: Resend keeps a log of the
 * emails it sends. 4 Oct 2026: the lede "One address reaches the founders."
 * was cut on the founder's word.
 */

export const contact = {
  meta: {
    title: 'Contact',
    description: 'Contact ProviGen at contact@provigen.ai.',
  },
  hero: {
    /** One neutral heading (the founder, 3 Oct 2026). */
    title: 'Contact us',
  },
  form: {
    frameLabel: 'Write to us',
    message: 'Message',
    messagePlaceholder: 'What would you like to talk about?',
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'you@lab.org',
    to: 'To',
    subjectLabel: 'Subject',
    /** The email's subject line (the sent one adds the sender's name). */
    subject: 'ProviGen · Contact',
    submit: 'Send',
    sending: 'Sending…',
    /**
     * Attachments (founder, 4 Oct 2026): they go with the email. The limits
     * match lib/contact/handler.ts (MAX_FILES, MAX_FILE_BYTES, FILE_TYPES).
     * The "Goes by email, straight to the founders" note was cut the same day.
     */
    files: 'Files',
    addFiles: 'Add files',
    filesHint: 'Up to 3 files, 3 MB in all',
    removeFile: 'Remove',
    maxFiles: 3,
    maxFileBytes: 3 * 1024 * 1024,
    fileTypes: ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'csv', 'md', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip'],
    /** maxLength of each field; lib/contact/handler.ts enforces the same limits. */
    limits: { name: 150, email: 250, message: 5000 },
    /** Shown under a field when the message cannot go yet. */
    errors: {
      message: 'Please write a message.',
      name: 'Please add your name.',
      email: 'Please add your email address.',
      emailInvalid: 'Please enter a valid email address, like you@lab.org.',
      files: 'Up to 3 files and 3 MB in all: PDF, images, text, Office files or ZIP.',
    },
    /** After a 200 from /api/contact. No reply time is promised. */
    sent: 'Thank you. Your message is with the founders.',
    /** When sending fails: the mailto draft opened instead; the address link reopens it. */
    drafted: 'The form could not send, so a draft opened in your email app instead. Attach your files there.',
    draftedHelp: 'If none opened, write to',
  },
  /** The founder's call of 3 Oct 2026 ("das ist die Mail: contact@provigen.ai"). */
  email: 'contact@provigen.ai',
  linkedin: 'https://www.linkedin.com/company/provigen-ai/',
  direct: {
    title: 'Or write directly',
    email: 'Email',
    elsewhere: 'Elsewhere',
    linkedin: 'LinkedIn',
  },
} as const;
