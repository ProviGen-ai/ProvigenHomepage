/* The ProviGen manifesto, as the founder wrote it for the data room, published
   verbatim on his call (4 Oct 2026: "genau so publishen aber mit paper
   zitiert"). The only additions are the citation marks and the references;
   the reference notes say what each source is and, where the text rounds a
   figure, what the source states (no provenance box: founder, 4 Oct 2026).
   Body strings may use <em>, <strong>,
   <a href>, <br>; a block is either a paragraph or a list. */

export type ManifestoBlock = string | { list: string[] };

export type ManifestoSection = {
  id: string;
  /** Untitled for the opening, which runs on from the title and dek. */
  title?: string;
  blocks: ManifestoBlock[];
};


export type ManifestoReference = {
  n: number;
  label: string;
  href: string;
  note: string;
};

const c = (...ns: number[]) =>
  ns.map((n) => `<a class="w-cite" href="#ref-${n}">[${n}]</a>`).join('');

export const manifesto = {
  slug: 'manifesto',
  title: 'The <em>Manifesto</em>.',
  dek: 'Biotech is entering a new era.\nLab-in-the-loop is becoming the new operating model for biotechnology.',
  date: '2026-09-25', // first published on the old site, 25 Sep 2026
  category: 'Perspective' as const,
  readingMinutes: 3, // 6 before sections 4–9 left (14 Oct 2026)
  sections: [
    {
      id: 'new-era',
      blocks: [
        'AI is moving beyond reading papers, analyzing datasets, and designing molecules. It is beginning to interact directly with experiments:',
        '<strong>decide what to test → run the experiment → observe the result → learn → choose what to do next</strong>',
        'This transition is happening now.',
        `Eli Lilly and NVIDIA are investing up to $1B into an AI co-innovation lab built around continuous learning between agentic wet labs and computation.&nbsp;${c(1)} Genentech describes lab-in-the-loop as the foundation of its R&amp;D strategy.&nbsp;${c(2, 3)} GSK already operates an end-to-end automated lab-in-the-loop platform for large-molecule discovery.&nbsp;${c(4)} Lila Sciences is building entire AI Science Factories around models that reason, experiment, and learn.&nbsp;${c(5)}`,
        `A new generation of infrastructure companies is emerging around the same shift. C5R is building research facilities where frontier models can execute experiments and learn from reality.&nbsp;${c(6)} Substrate Bio is building a network of autonomous wet labs for biological training data.&nbsp;${c(7)} Worldset plans modular autonomous biology labs designed to generate complete experimental trajectories for frontier models.`,
        'And the first results are already here.',
        `OpenAI connected GPT-5 to Ginkgo Bioworks’ automated laboratory. Across more than 36,000 reactions, the system established a new low-cost benchmark for cell-free protein synthesis and reduced protein-production cost by 40%.&nbsp;${c(8)}`,
        `Anthropic has now built its own biology laboratory. Claude searched more than 200,000 reverse transcriptases and identified a previously uncharacterized enzyme system associated with CRISPR-like DNA repeats, which Anthropic then investigated experimentally.&nbsp;${c(9)}`,
        'The feedback loop between AI and biology is closing.',
      ],
    },
    {
      id: 'upgrade',
      title: 'Laboratory automation is waiting for its intelligence <em>upgrade</em>',
      blocks: [
        'Laboratory automation today is similar to humanoid robotics: the physical infrastructure exists, but without sufficiently capable intelligence it remains limited to narrow, pre-programmed tasks.',
        'Liquid handlers, robotic workcells, plate readers, bioreactors, and automated analytical systems already exist across thousands of laboratories.',
        'Most still execute workflows humans designed and programmed in advance.',
        'The opportunity is to turn that automation from infrastructure that executes experiments into infrastructure that learns which experiments to run.',
        'ProviGen provides that intelligence upgrade.',
      ],
    },
    {
      id: 'adaptive',
      title: 'We make existing laboratories <em>adaptive</em>',
      blocks: [
        'Rather than building inhouse laboratory infrastructure from scratch, we upgrade the infrastructure that already exists.',
        'Biofoundries, CROs, CDMOs, biopharma companies, and automation providers have already invested billions into physical experimental capacity.',
        'That infrastructure is fragmented, frequently underutilized, and rarely learns across experimental cycles.',
        'ProviGen turns this infrastructure into a distributed network for closed-loop experimentation.',
        'This means smaller laboratories can gain access to predictive capabilities that would otherwise require building massive AI-native infrastructure themselves.',
        'The hardware is already there. We make it adaptive.',
      ],
    },
    {
      id: 'integration',
      title: 'Integration is becoming <em>cheaper</em>',
      blocks: [
        'Laboratory heterogeneity historically made this type of software difficult to deploy.',
        'That constraint is weakening.',
        'Modern laboratory automation increasingly exposes APIs or machine-readable interfaces.',
        'Schedulers and orchestration platforms abstract much of the underlying hardware complexity, allowing ProviGen to integrate at the workflow layer rather than writing direct drivers for every instrument.',
        'At the same time, AI coding agents materially reduce the engineering cost of connecting heterogeneous software systems.',
      ],
    },
    /* 14 Oct 2026, the founder: sections 4 to 9 (The network is the upside,
       Transfer only needs to work partially, Why this can compound, Why now,
       We will prove three things, The bet) are for investors and shared
       privately, so they are not in the public site's source. */
    {
      /* 14 Oct 2026, the founder: a short close in place of sections 4 to 9,
         ending on the mission: freedom over one's own biology (the film's
         "make biology reproducible" is now the first step). */
      id: 'mission',
      title: '<em>Mission</em>',
      blocks: [
        'The instruments are in place. The models keep getting better. What is missing is the connection between scientific intent and the infrastructure that carries it out.',
        'Scientists should be able to state what they want to learn, and the lab should immediately run it, collect the evidence and improve.',
        'That is how biotechnology will enter an era of widely accessible cures, regenerative medicine and choice over lifespan.',
        'Together with the brightest minds of our time, we want to push that frontier.<br><strong>We will give people freedom over their own biology.</strong>',
      ],
    },
  ] as ManifestoSection[], // as, not satisfies: no section left uses a list block (14 Oct 2026)
  references: [
    {
      n: 1,
      label: 'NVIDIA and Lilly · Co-innovation AI lab to reinvent drug discovery · Press release · 12 January 2026',
      href: 'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-and-Lilly-Announce-Co-Innovation-AI-Lab-to-Reinvent-Drug-Discovery-in-the-Age-of-AI',
      note: 'Company announcement: a joint investment of up to $1 billion over five years in talent, infrastructure and compute.',
    },
    {
      n: 2,
      label: 'Roche · NVIDIA AI factory and the Lab-in-the-Loop strategy · Media release · 16 March 2026',
      href: 'https://www.roche.com/media/releases/med-cor-2026-03-16',
      note: 'Company announcement: Roche and Genentech describe a Lab-in-the-Loop strategy they have pioneered for more than five years.',
    },
    {
      n: 3,
      label: 'Frey et al. · Lab-in-the-loop therapeutic antibody design with deep learning · bioRxiv · 2025',
      href: 'https://doi.org/10.1101/2025.02.19.639050',
      note: 'Preprint (v3, November 2025), Genentech and Roche. Semi-autonomous antibody optimisation over four rounds, more than 1,800 variants made and measured; wet-lab, one organisation.',
    },
    {
      n: 4,
      label: 'GSK · Annual Report 2025 (Form 20-F) · Platform technologies · 2026',
      href: 'https://www.sec.gov/Archives/edgar/data/0001131399/000113139926000004/gsk-20251231.htm',
      note: 'Company filing: GSK’s own description of an end-to-end automated lab-in-the-loop platform for large molecules.',
    },
    {
      n: 5,
      label: 'Lila Sciences · Series A announcement · 2025',
      href: 'https://lila.ai/news/series-a-235-million',
      note: 'Company announcement; “AI Science Factories” is Lila’s own term.',
    },
    {
      n: 6,
      label: 'C5R · Company website · 2026',
      href: 'https://c5r.net/',
      note: 'Company website. C5R presented its first model-driven research facility, Facility-0, in September 2026.',
    },
    {
      n: 7,
      label: 'Substrate Bio · Company website · 2026',
      href: 'https://www.substratebio.ai',
      note: 'Company website (in stealth). The plans are described in the company’s job listings; the first site is planned, not yet operating.',
    },
    {
      n: 8,
      label: 'OpenAI and Ginkgo Bioworks · Using a GPT-5-driven autonomous lab to optimize the cost and titer of cell-free protein synthesis · bioRxiv · 2026',
      href: 'https://www.biorxiv.org/content/10.64898/2026.02.05.703998v1',
      note: 'Preprint, February 2026. The 40% is the cost per gram of one test protein (sfGFP) in E. coli cell-free synthesis, against the best previously published value; the reaction count follows the announcement.',
    },
    {
      n: 9,
      label: 'Anthropic · Claude discovers a novel enzyme system · Announcement and preprint · 23 September 2026',
      href: 'https://www.anthropic.com/news/claude-discovers-novel-enzyme-system',
      note: 'Company announcement with a preprint: a computational search over about 200,000 reverse-transcriptase clusters, followed by early characterisation in Anthropic’s own lab.',
    },
    /* References 10 and 11 went with Why now, the only section that cited them. */
  ] satisfies ManifestoReference[],
};
