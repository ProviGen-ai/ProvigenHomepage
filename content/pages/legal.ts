import { ANALYTICS } from '@/lib/site-env';

/* /legal-notice and /privacy — the founders' legal texts for ProviGenAI Inc.,
   carried over verbatim from provigen.ai (1 Oct 2026). Change wording only on
   the founders' instruction. */

export type LegalSection = {
  title: string;
  /** An anchor for the section, so another page can point at it (17 Nov 2026: the API access form). */
  id?: string;
  /** Plain strings, or an array of strings for a bulleted list.
   *  Inline HTML limited to <em>, <strong>, <br>; no links. */
  paragraphs: (string | string[])[];
};

export type LegalDocument = {
  title: string;
  /** Date of the last substantive change: ISO day (2026-05-12) or month (2026-05). */
  updated?: string;
  sections: LegalSection[];
};

const ADDRESS = '995 Market St, Floor 8<br>San Francisco, CA 94103<br>United States';
/* Plain text on purpose: the legal pages carry no links (founder, 1 Oct 2026). */
const CONTACT = 'contact@provigen.ai';
const PRIVACY = 'privacy@provigen.ai';

/* ------------------------------------------------------------------ */
/* Legal notice                                                        */
/* ------------------------------------------------------------------ */

export const legalNotice: LegalDocument = {
  title: 'Legal Notice',
  sections: [
    {
      title: 'Service Provider',
      paragraphs: ['ProviGenAI Inc.<br>Lucas Mair, authorized representative'],
    },
    {
      title: 'Address',
      paragraphs: [ADDRESS],
    },
    {
      title: 'Contact',
      paragraphs: [`Email: ${CONTACT}`],
    },
    {
      title: 'Disclaimer',
      paragraphs: [
        '<strong>Liability for Content.</strong> The contents of this website have been created with the utmost care. However, ProviGenAI Inc. cannot guarantee the accuracy, completeness, or timeliness of the content.',
        '<strong>Liability for Links.</strong> This website may contain links to external third-party websites. ProviGenAI Inc. has no influence on the content of these websites and therefore cannot accept any liability for this external content. The respective provider or operator is always responsible for the content of linked pages.',
      ],
    },
    {
      title: 'Copyright',
      paragraphs: [
        'The content and works on this website are subject to copyright law. Any reproduction, processing, distribution, or commercial use beyond the scope of copyright law requires the prior written consent of its respective author or creator.',
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Privacy policy                                                      */
/* ------------------------------------------------------------------ */

export const privacy: LegalDocument = {
  title: 'Privacy Policy',
  /* updated: '2026-05', (founder, 17 Nov 2026: the API access section added) */
  updated: '2026-11',
  sections: [
    {
      title: 'Responsible Party',
      paragraphs: ['ProviGenAI Inc.<br>Lucas Mair', `<strong>Address</strong><br>${ADDRESS}`, `Email: ${CONTACT}`],
    },
    {
      title: 'Representative in the European Union',
      id: 'eu-representative',
      paragraphs: [
        `Pursuant to Art. 27 GDPR, our representative in the European Union is Lucas Mair, reachable at ${PRIVACY}. Data subjects and supervisory authorities may contact the representative on all matters relating to the processing of personal data.`,
      ],
    },
    {
      title: 'General Data Processing',
      paragraphs: [
        'We process personal data in compliance with the EU General Data Protection Regulation (GDPR) and the German Federal Data Protection Act (BDSG). Personal data is only collected to the extent technically necessary. Data is never sold to third parties.',
      ],
    },
    {
      title: 'Hosting and Technical Infrastructure',
      paragraphs: [
        'This website is hosted on Vercel Inc. (San Francisco, USA). When you visit our website, Vercel may process technical data such as your IP address, browser type, and access times as part of their hosting services. A data processing agreement is in place with Vercel in accordance with Art. 28 GDPR.',
      ],
    },
    {
      title: 'Server Logs',
      paragraphs: [
        'When you visit our website, the following data is automatically collected by the web server:',
        [
          'IP address',
          'Date and time of access',
          'Browser type and version',
          'Operating system',
          'Referrer URL',
        ],
        'This data is processed based on Art. 6(1)(f) GDPR (legitimate interest in ensuring the security and stability of our website). Log data is automatically deleted after 30 days.',
      ],
    },
    {
      title: 'Contact Forms and Email',
      paragraphs: [
        'When you contact us via our contact form or by email, the data you provide (email address, message content) is processed for the purpose of handling your inquiry. This processing is based on Art. 6(1)(b) GDPR (pre-contractual measures) or Art. 6(1)(f) GDPR (legitimate interest in responding to inquiries). Your data is stored only as long as necessary to process your request.',
        'We use Resend (Resend Inc.) to deliver transactional emails. A data processing agreement is in place.',
      ],
    },
    /* API access (founder, 17 Nov 2026): what the SDM-1 access form collects, so the form can refer here and carry
       less itself. The same facts as the form's "Data protection information" (components/release/GetAccess.tsx),
       a DRAFT with it: retention undecided; AWS region and IP handling as agent-002 checked them on 16 Nov 2026.
       Change both together. */
    {
      title: 'API Access',
      id: 'api-access',
      paragraphs: [
        /* Was 'When you request a personal access token for our API on our website, ...' (founder, 17 Nov 2026: more formal) */
        /* Was 'When you request a personal access token for our API via our website, we process the following data:' (founder, 17 Nov 2026: impersonal, without "you") */
        'When a personal access token for the API is requested via this website, the following data is processed:',
        [
          /* Was 'your email address', 'your consent choices and the version of the consent text you agreed to', 'the data
             you submit with your token (...)', 'the number of calls made with your token' (founder, 17 Nov 2026: impersonal, without "you") */
          'the email address',
          'the consent choices and the version of the consent text agreed to',
          /* The confirmation link (the user, 17 Nov 2026). */
          'whether the address has been confirmed through the link sent to it',
          'the data submitted with the token (parameter ranges, settings and measured outcomes), stored with the names of parameters and outcomes replaced by position numbers',
          'the number of calls made with the token',
        ],
        /* Was 'Your IP address is used only to limit ... It is not stored as such, only as a keyed hash in rate-limit
           records that are deleted automatically.' (founder, 17 Nov 2026: more formal; stated positively) */
        'The IP address is processed solely to limit the number of token requests per network. For this purpose, it is stored exclusively as a keyed hash value in rate-limit records, which are deleted automatically.',
        /* Was 'Issuing the token and enforcing its limits is based on Art. 6(1)(b) GDPR (contract). ...' (founder,
           17 Nov 2026: more formal) */
        'The issuance of the token, the sending of a confirmation link to the address given, and the enforcement of the token\u2019s limits are based on Art. 6(1)(b) GDPR (performance of a contract). The limitation of token requests per network to prevent misuse is based on Art. 6(1)(f) GDPR (legitimate interest). The storage of submitted data for the operation and benchmarking of the model, and contact regarding a potential collaboration subject to opt-in, are based on consent pursuant to Art. 6(1)(a) GDPR, which may be withdrawn at any time with effect for the future.',
        'The API is operated on our behalf by Amazon Web Services, which stores this data in its EU (Ireland) region. Requests are forwarded to the API by Vercel Inc. (USA), which hosts this website. Data processing agreements pursuant to Art. 28 GDPR are in place with both.',
        /* Was `Your email address, consent record and submitted data are kept until you ask us to delete them, and remain
           in backups for up to 35 days after deletion. To exercise your rights, contact ${PRIVACY}.` (founder,
           17 Nov 2026: more formal) */
        /* Was `Your email address, consent record and submitted data are stored until you request their erasure. ...
           To exercise your rights, please contact ${PRIVACY}.` (founder, 17 Nov 2026: impersonal, without "you") */
        `The email address, consent record and submitted data are stored until their erasure is requested. Following erasure, they are retained in backup copies for a maximum of 35 days. Requests to exercise data subject rights may be sent to ${PRIVACY}.`,
      ],
    },
    {
      title: 'Cookies',
      paragraphs: [
        /* The founders' sentence stands while analytics are off. SITE_ANALYTICS=vercel
           (competitor review R20, 3 Oct 2026) swaps in the second version, so the
           text always matches what the site loads. */
        ANALYTICS === 'vercel'
          ? 'This website does not use cookies or advertising pixels. We use Vercel Web Analytics (Vercel Inc.) to count page views in aggregate, without cookies; it does not identify individual visitors.'
          : 'This website does not use cookies or tracking technologies. No analytics tools or advertising pixels are embedded.',
      ],
    },
    {
      title: 'SSL/TLS Encryption',
      paragraphs: [
        'This website uses SSL/TLS encryption for security reasons and to protect the transmission of confidential content. You can recognize an encrypted connection by the lock icon in your browser address bar and the “https://” prefix.',
      ],
    },
    {
      title: 'Data Retention',
      paragraphs: [
        'Personal data is stored only as long as necessary for the purposes for which it was collected, or as required by legal retention obligations. Once the purpose has been fulfilled and no statutory retention periods apply, the data is deleted.',
      ],
    },
    {
      title: 'Your Rights',
      paragraphs: [
        'Under the GDPR, you have the following rights regarding your personal data:',
        [
          'Right of access (Art. 15 GDPR)',
          'Right to rectification (Art. 16 GDPR)',
          'Right to erasure (Art. 17 GDPR)',
          'Right to restriction of processing (Art. 18 GDPR)',
          'Right to data portability (Art. 20 GDPR)',
          'Right to object (Art. 21 GDPR)',
          'Right to withdraw consent at any time',
        ],
        `To exercise these rights, contact ${PRIVACY}.`,
      ],
    },
    {
      title: 'Supervisory Authority',
      paragraphs: [
        'You have the right to lodge a complaint with a data protection supervisory authority. The competent authority for Bavaria is the Bayerisches Landesamt für Datenschutzaufsicht (BayLDA).',
      ],
    },
  ],
};
