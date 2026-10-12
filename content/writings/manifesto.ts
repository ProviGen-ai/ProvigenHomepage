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
  dek: 'Biotech is entering a new era. Lab-in-the-loop is becoming the new operating model for biotechnology.',
  date: '2026-10-04',
  category: 'Perspective' as const,
  readingMinutes: 6,
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
        'At the same time, AI coding agents materially reduce the engineering cost of connecting heterogeneous software systems',
      ],
    },
    {
      id: 'network',
      title: 'The network is the <em>upside</em>',
      blocks: [
        'The larger opportunity begins once ProviGen operates across multiple experimental environments.',
        'If experience from previous campaigns helps the system solve the next related problem with fewer experiments, every deployment can improve future deployments.',
        'The critical comparison is:',
        '<strong>ProviGen starting cold</strong><br>vs.<br><strong>ProviGen starting warm with relevant prior experimental experience</strong>',
        'If the second requires materially fewer experiments, ProviGen begins to accumulate critical process data that cannot be easily recreated',
        'That data includes not only successful outcomes, but failed interventions, parameter sensitivities, uncertainty, and process behavior that is often unpublished or never systematically captured.',
      ],
    },
    {
      id: 'transfer',
      title: 'Transfer only needs to work <em>partially</em>',
      blocks: [
        'We do not assume that knowledge transfers arbitrarily across biology.',
        'We expect the strongest transfer within recurring experimental families such as:',
        {
          list: [
            'plate-based liquid-handling workflows',
            'bacterial bioreactor processes',
            'mammalian bioreactor processes',
          ],
        },
        'The relevant question is therefore whether experience from related campaigns allows the next similar campaign to reach its target with fewer experimental cycles.',
        'That is the network effect we intend to prove.',
      ],
    },
    {
      id: 'compound',
      title: 'Why this can <em>compound</em>',
      blocks: [
        'Scientific AI models will continue to improve.',
        'That makes access to experiments more valuable.',
        'A frontier model can absorb the world’s published scientific knowledge.',
        'But much of the information required to make better experimental decisions is generated only through interaction with the physical world.',
        'Over time, ProviGen can accumulate:',
        { list: ['process dynamics', 'failure patterns', 'uncertainty models', 'intervention strategies'] },
        'If this experience transfers within valuable workflow families, node 20 should start from a better position than node 1.',
        'Reproducing that advantage requires comparable experimental access, accumulated interventions, time, and physical-world feedback. Essentially doing exactly what we are already doing.',
        'In addition, biology as an application domain makes our moat inherently more defensible given that biological processes can’t be sped up arbitrarily.',
        'There is a structural advantage to the distributed model:',
        'An infrastructure network spanning different instruments, biological systems, protocols, and operating environments produces much more diverse experimental data than a single institution could.',
        'By doing that, we are giving smaller labs access to the same closed-loop AI capabilities that would otherwise require massive proprietary infrastructure.',
        'This levels the playing field between organizations that can afford large-scale in-house laboratories and those that cannot build their own AI-native experimental infrastructure.',
        'We are convinced that a distributed laboratory network can produce more generalizable and robust scientific intelligence than models trained purely on in-house experimental data.',
      ],
    },
    {
      id: 'why-now',
      title: 'Why <em>now</em>',
      blocks: [
        'Several technological shifts make this possible now.',
        `<strong>Scientific decision-making algorithms are already useful in closed-loop systems.</strong> Bayesian optimization, active learning, multimodal models, and increasingly capable scientific agents can now select experiments and update decisions as results arrive.&nbsp;${c(3, 10, 11)}`,
        '<strong>Laboratories are becoming software-addressable.</strong> Modern automation systems increasingly expose APIs, schedulers, structured data streams, and machine-readable interfaces that make programmatic experimentation possible.',
        '<strong>AI coding agents reduce the cost of integration.</strong> Connecting heterogeneous laboratory software has historically required substantial engineering work. Coding agents increasingly compress the time required to build and maintain those interfaces.',
        `<strong>Scientific AI is approaching an experimental data bottleneck.</strong> As models improve on publicly available scientific knowledge, differentiated performance increasingly depends on access to proprietary experimental feedback and interaction with real biological systems.&nbsp;${c(11)}`,
      ],
    },
    {
      id: 'prove',
      title: 'We will prove three <em>things</em>',
      blocks: [
        '<strong>1. Product value</strong>',
        'We will show that closed-loop optimization reaches the same or better target with materially fewer experimental cycles, less time, or better outcomes than the existing approach.',
        'We have already shown approximately 5× sample efficiency in a preliminary pilot.',
        'The next step is to reproduce that advantage in commercial workflows.',
        '<strong>2. Repeatability</strong>',
        'We will show that ProviGen can integrate and create similar value across additional sites and workflows without deployment costs overwhelming site economics.',
        'The current target is approximately 1 to 2 weeks of integration per site, with increasing reuse of scheduler integrations, data interfaces, workflow representations, and optimization components.',
        '<strong>3. Transfer</strong>',
        'We will show how relevant process data from previous campaigns allows a new campaign to reach its target faster than the same system starting cold.',
        'The progression is:',
        '<strong>better experiments → repeatable deployments → transferable experience → compounding intelligence</strong>',
      ],
    },
    {
      id: 'bet',
      title: 'The <em>bet</em>',
      blocks: [
        'Biotech already has increasingly capable AI models and automated laboratories.',
        'What is missing is the system that connects the two into a learning loop.',
        'ProviGen makes individual laboratories adaptive today and turns them into nodes of a distributed learning network over time.',
        'That network gives existing laboratories access to the autonomous-science revolution without requiring each of them to build an AI Science Factory of their own.',
        'And every experiment can make the network better at choosing the next one.',
        'The laboratory automation infrastructure already exists. It is waiting for its intelligence upgrade.',
      ],
    },
  ] satisfies ManifestoSection[],
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
    {
      n: 10,
      label: 'DeMeo et al. · Active learning framework leveraging transcriptomics identifies modulators of disease phenotypes · Science · 2025',
      href: 'https://doi.org/10.1126/science.adi8577',
      note: 'Peer-reviewed. A lab-in-the-loop framework, in the authors’ own words, tested in vitro in human blood stem and progenitor cells; one refinement round.',
    },
    {
      n: 11,
      label: 'Noori et al. · World models for biomedicine · Cell · 2026',
      href: 'https://doi.org/10.1016/j.cell.2026.08.032',
      note: 'Perspective in Cell, no new experiments: deciding which experiments merit physical execution, and the data such models need.',
    },
  ] satisfies ManifestoReference[],
};
