/*
 * Site-wide v3 copy: navigation, footer, marquee and contact details.
 * Homepage section copy lives in content/home/*.ts.
 */
export const site = {
  name: 'ProviGen',
  /**
   * One category line everywhere (competitor review R05, 3 Oct 2026): the mobile
   * menu, the first marquee item, the title and the structured data. The
   * founder rejected "The orchestration layer for experimental biology" as too
   * vague the same evening; "lab in the loop" is his wording.
   */
  line: 'Lab-in-the-loop AI for experimental biology.',
  /** The public contact (founder, 3 Oct 2026, evening). */
  email: 'contact@provigen.ai',
  linkedin: 'https://www.linkedin.com/company/provigen-ai/',
  /**
   * Depth one click away (competitor review, 3 Oct 2026): three pages instead
   * of more homepage. Team stays a homepage anchor.
   */
  nav: [
    /* The homepage section: the /how-it-works page was removed (founder, 3 Oct 2026, late). */
    { href: '/#build', label: 'How it works' },
    { href: '/#team', label: 'Team' },
    { href: '/writings', label: 'Writings' },
    { href: '/careers', label: 'Careers' },
  ],
  /** The call to action in every header (R11; the founder's "Contact us", 3 Oct 2026). */
  cta: { href: '/contact', label: 'Contact us' },
  /** The founder's footer, 4 Oct 2026: Home, Writings, Contact, Careers, then LinkedIn (no Email link: Contact is the way in). */
  footerNav: [
    { href: '/', label: 'Home' },
    { href: '/writings', label: 'Writings' },
    { href: '/contact', label: 'Contact' },
    { href: '/careers', label: 'Careers' },
  ],
  /**
   * The footer's running line. The category line leads (R05). 4 Oct 2026, the
   * founder: 'Building the AI that steers biology' and 'Scientists in control'
   * out, and no "AI" in the category line here.
   */
  marquee: [
    'Lab-in-the-loop for experimental biology',
    'Learns from every run',
    'On your instruments',
    'Built for reproducibility',
    'One process at a time',
  ],
  legal: [
    { href: '/legal-notice', label: 'Legal notice' },
    { href: '/privacy', label: 'Privacy policy' },
  ],
  /**
   * The company in the footer's copyright line. The city and the colophon
   * line on the opening footage were cut on the founder's word (4 Oct 2026);
   * the legal notice keeps the address.
   */
  company: 'ProviGenAI Inc.',
  backers: 'Backed by FR8 and EWOR',
} as const;
