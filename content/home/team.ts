import people from '@/content/team-data.json';
import institutionData from '@/content/institutions.json';

/*
 * Homepage section 5 · Team. Copy: copy deck v3 (1 Oct 2026) §5; Cheng-Wei
 * Liao and the backers block below the institutions added on 2 Oct 2026
 * (founder). Portraits and each person's institutions come from
 * content/team-data.json; logo files and names from content/institutions.json.
 * Not used on purpose: the hackathon count (unverified) and any raise size.
 */

export type InstitutionId = keyof typeof institutionData;

export type Institution = {
  id: InstitutionId;
  name: string;
  src: string;
  width: number;
  height: number;
  /** Optical height relative to the base logo height (wide wordmarks sit lower). */
  scale: number;
  /**
   * Share of the artwork's width to show, from the left. LMU's mark is two
   * boxes; the second holds the full name in type too small to read at row
   * size, so the row and the popups show the "LMU" box only.
   */
  show: number;
};

/**
 * Optical sizing so seven very different marks read at one visual weight:
 * heights relative to Harvard, balancing equal area against each mark's ink
 * density (measured on the mono files), then checked by eye in the row and the
 * popup.
 */
const opticalScale: Record<InstitutionId, number> = {
  harvard: 1,
  /* Wide-tracked bold caps read large: keep the cap height near Harvard's. */
  imperial: 0.42,
  tum: 0.74,
  /* A solid box carries more ink than a line mark of the same height. */
  lmu: 0.9,
  /* Two lines of light serif caps beside a ring: needs the extra height. */
  'meduni-vienna': 1.18,
  /* The crest takes the height; the wordmark sits in its middle third. */
  'uw-madison': 1.24,
  /* Roundel plus one long line of thin caps, Imperial's width but with the
     roundel setting the height: the caps need the height to stay legible. */
  'max-planck': 0.85,
  /* A company wordmark (Thejas Nagaraju, founder's instruction 6 Oct 2026):
     heavy rounded lowercase beside a solid ribbon mark, so it sits lower than
     Harvard to carry the same weight. */
  valneva: 0.52,
};

const visibleShare: Partial<Record<InstitutionId, number>> = {
  lmu: 171 / 362,
};

const institution = (id: InstitutionId): Institution => {
  const entry = institutionData[id];
  return {
    id,
    name: entry.name,
    src: entry.image,
    width: entry.width,
    height: entry.height,
    scale: opticalScale[id],
    show: visibleShare[id] ?? 1,
  };
};

export type Member = {
  id: string;
  first: string;
  last: string;
  /** Degree suffix shown after the last name, e.g. ", MD". */
  suffix: string;
  role: string;
  bio: string;
  image: string;
  /**
   * Circle crop in source pixels of the 800×1000 portrait: the square of side
   * `size` whose top-left corner is (x, y). Areas outside the photo read as
   * the white studio ground, so negative offsets are safe above the head.
   */
  crop: { size: number; x: number; y: number };
  institutions: Institution[];
};

const fromData = (first: string) => {
  const person = people.team.find((member) => member.firstName === first);
  if (!person)
    throw new Error(`content/team-data.json has no entry for ${first}`);
  return {
    image: person.image,
    institutions: person.institutions.map((id) =>
      institution(id as InstitutionId),
    ),
  };
};

/*
 * Roles as stored in content/team-data.json (competitor review R12, 3 Oct
 * 2026): the cards said "CEO" where the data says "Co-Founder & CEO", so an
 * investor could not tell founders from hires. Thejas Nagaraju's entry reads
 * "Founding Team & CCO"; CLAUDE.md lists him among the co-founders, so his
 * title waits for the founders' word. Constantin Convalexius is founding
 * engineer, not co-founder, and carries no CSO title (founder's corrections,
 * 4 Oct 2026).
 */
export const members: Member[] = [
  {
    id: 'magdalena-lang',
    first: 'Magdalena',
    last: 'Lang',
    suffix: '',
    role: 'Co-founder · CEO',
    /* 14 Oct 2026: the founder's brief merged with the text of 8 Oct 2026
       ('Strategy, operations, fundraising. Background spans medicine and
       biomedical neuroscience (TU Munich), genome editing research at Harvard
       Medical School, and doctoral research at Boston Children’s Hospital.
       Turns deep bioprocess pain into a fundable product wedge.'). */
    bio: 'Strategy, operations, fundraising. Background in medicine × biomedical neuroscience (TU Munich), with genome editing research at Harvard Medical School and Boston Children’s Hospital. Brings a blend of business and product perspective.',
    crop: { size: 660, x: 100, y: -8 },
    ...fromData('Magdalena'),
  },
  {
    id: 'lucas-mair',
    first: 'Lucas',
    last: 'Mair',
    suffix: '',
    role: 'Co-founder · CTO',
    /* 14 Oct 2026: the founder's brief merged with the text of 8 Oct 2026
       ('AI, automation, product. MD-PhD candidate at TU Munich / Helmholtz
       Munich. Builds the closed-loop intelligence layer connecting biological
       readouts, decision-making, and existing lab automation infrastructure.'). */
    bio: 'AI, automation, product. Background in medicine × computer science × neuroengineering (LMU Munich, TU Munich, Helmholtz Munich). A polymath who built drone swarm software, pursued stem-cell research and treats biology as a reverse-engineering discipline. His driving belief: people should be able to choose and modify their own biology, rather than have it determined at birth.',
    crop: { size: 820, x: -38, y: 40 },
    ...fromData('Lucas'),
  },
  {
    id: 'constantin-convalexius',
    first: 'Constantin',
    last: 'Convalexius',
    suffix: ', MD',
    role: 'Founding engineer',
    bio: 'Physician-scientist building AI for the lab.',
    crop: { size: 650, x: 55, y: 40 },
    ...fromData('Constantin'),
  },
  {
    id: 'thejas-nagaraju',
    first: 'Thejas',
    last: 'Nagaraju',
    suffix: ', PhD',
    role: 'Founding team · CCO',
    /* The founder's text of 8 Oct 2026; it replaces "Former founder and
       venture investor across biotech, pharma and CDMOs. Previously at
       Valneva." (Valneva stays among his marks, 6 Oct 2026). */
    bio: 'Biotech go-to-market, partnerships, scale-up. Trained molecular biologist with 8+ years in life sciences and a track record building early-stage health ventures, translating bench research into commercial propositions. De-risks commercial adoption through CDMO/pharma access and pilot-to-partnership strategy.',
    crop: { size: 800, x: -8, y: 40 },
    ...fromData('Thejas'),
  },
  {
    id: 'cheng-wei-liao',
    first: 'Cheng-Wei',
    last: 'Liao',
    suffix: '',
    role: 'Forward Deployed Engineer',
    /* Founder's brief: "the best mass spectrometry prediction model on the
       planet". Kept to a claim we can stand behind until there is a public
       benchmark to cite; then name it here. */
    bio: 'Built a state-of-the-art AI model that predicts mass spectra.',
    crop: { size: 900, x: -50, y: -22 },
    ...fromData('Cheng-Wei'),
  },
];

export type Backer = {
  name: string;
  href: string;
  src: string;
  width: number;
  height: number;
  /** Rendered logo height in px at desktop; phones scale it down. */
  size: number;
};

/** A named person, Capable's "Name, Role" format. */
export type Person = { name: string; role: string };

const backers: Backer[] = [
  {
    name: 'FR8',
    href: 'https://www.fr8.so/',
    src: '/assets/provigen/fr8.svg',
    width: 491,
    height: 114,
    size: 28,
  },
  {
    name: 'EWOR',
    href: 'https://www.ewor.com/',
    src: '/assets/provigen/ewor.svg',
    width: 81,
    height: 20,
    size: 22,
  },
];

/*
 * Angel investors, as "Name, Role" under the backer logos, and advisors as
 * their own row. Planned: advisors and investors such as Charlie Songhurst
 * and Daniel Dippold (founder, 2 Oct 2026). Add a name ONLY once that person
 * has agreed to be named on the site; each list renders only when it has
 * someone in it.
 */
const investors: Person[] = [];
const advisors: Person[] = [];

/*
 * Off the site for now (founder, 8 Oct 2026: "remove for now at least
 * Constantin and Cheng Wei from the people, at least temporarily"). Their
 * entries above stay as they are: delete an id here to bring that person
 * back. The row of institutions follows the people shown, so MedUni Vienna
 * and the Max Planck Society, which only they brought, leave with them.
 */
const hidden: readonly Member['id'][] = ['constantin-convalexius', 'cheng-wei-liao'];
const shown = members.filter((member) => !hidden.includes(member.id));
const shownInstitutions = new Set(shown.flatMap((member) => member.institutions.map((place) => place.id)));

export const team = {
  eyebrow: 'Team',
  members: shown,
  comesFrom: 'Our team comes from',
  institutions: (
    [
      'harvard',
      'imperial',
      'tum',
      'max-planck',
      'lmu',
      'meduni-vienna',
      'uw-madison',
      'valneva',
    ] as const
  )
    .filter((id) => shownInstitutions.has(id))
    .map(institution),
  /*
   * No caption under the logo row (founder's call, 1 Oct 2026). Three
   * portraits are AI-assisted edits of the team's own photos; Lucas Mair's and
   * Cheng-Wei Liao's are their own photos, cut out and toned, not generated.
   * Both treatments are recorded in IMAGE_PROVENANCE.md.
   */
  /** Lead-in for each person's institutions in the screen-reader description. */
  cardLogos: 'Studied or worked at',
  /* The backers sit here, under the institutions, and no longer in the hero
     (founder, 2 Oct 2026). */
  backedBy: 'Backed by',
  backers,
  investors,
  advisorsTitle: 'Advisors',
  advisors,
};
