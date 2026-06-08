export type BlogPostMeta = {
  id: number;
  slug: string | null;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  hidden?: boolean;
};

export const blogPosts: BlogPostMeta[] = [
  {
    id: 1,
    slug: "closed-loop-optimization",
    title: "Closed-Loop Experimental Campaigns in Practice",
    date: "April 13, 2026",
    author: "ProviGen Team",
    excerpt:
      "A practical walkthrough of active learning campaigns across assay optimization, therapeutic design, and media formulation.",
  },
  // {
  //   id: 2,
  //   slug: null,
  //   title: "Predicting Industrial Bioprocesses",
  //   date: "Coming soon",
  //   author: "ProviGen Team",
  //   excerpt:
  //     "How active learning closes the loop in biomanufacturing, from process optimization to real-time quality control at production scale.",
  //   hidden: true,
  // },
  // {
  //   id: 3,
  //   slug: null,
  //   title: "When To Move On: Data-Driven Decision Points in the Life Sciences",
  //   date: "Coming soon",
  //   author: "ProviGen Team",
  //   excerpt:
  //     "Replacing fixed timelines with cell-state-driven decisions across differentiation, clean-in-place, waste water treatment, and scale-up readiness.",
  //   hidden: true,
  // },
  // {
  //   id: 4,
  //   slug: null,
  //   title: "Self-Driving Laboratories: From Concept to Commercial Reality",
  //   date: "Coming soon",
  //   author: "ProviGen Team",
  //   excerpt:
  //     "Lilly spent $90M on a monolithic robotic lab, then sold it. Anthropic paid $400M for a team of ten. What the SDL landscape in 2026 tells us about where lab automation is actually heading.",
  //   hidden: true,
  //
  //   --- ARTICLE CONCEPT NOTES ---
  //
  //   Key narrative threads:
  //
  //   1. Lilly SDL arc:
  //      - $90M investment (2017) → Strateos cloud lab in San Diego (2020, 100+ instruments, 5M compounds)
  //        https://investor.lilly.com/news-releases/news-release-details/eli-lilly-and-company-collaboration-strateos-inc-launch-remote
  //      - Sold to Arctoris (Sept 2024), platform moved to Oxford. Lesson: monolithic robotic labs are expensive to sustain.
  //        https://www.fiercebiotech.com/cro/eli-lilly-sells-science-studio-lab-arctoris-moving-automation-platform-san-diego-oxford
  //      - Pivoted to $1B NVIDIA partnership (JPM 2026): agentic wet labs + computational, continuous learning system
  //        https://www.fiercebiotech.com/biotech/lilly-nvidia-tag-partnership-new-ai-co-innovation-lab-1b-investment
  //
  //   2. Anthropic / Coefficient Bio:
  //      - Claude Life Sciences launched Oct 2025
  //      - $400M acquisition of Coefficient Bio (April 2026), stock deal, <10 employees
  //      - Coefficient team from Genentech Prescient Design (lab-in-the-loop paper authors)
  //        https://www.biorxiv.org/content/10.1101/2025.02.19.639050v1
  //      - First major acquisition by a foundational AI company into wet-lab automation
  //        https://www.biospace.com/business/ai-giant-anthropic-leans-into-life-sciences-with-400m-coefficient-bio-catch
  //        https://www.fiercebiotech.com/biotech/anthropic-acquires-stealth-ai-startup-coefficient-bio-400m-deal
  //
  //   3. Industry overview / SDL landscape:
  //      - Intrepid Labs (formulation, 10^9 combinations), LabGenius (antibody, EVA platform),
  //        IBM/Arctoris (DMTA), Insitro (small-molecule), Merck KGaA/U Toronto (BayBE)
  //      - McKinsey: 500+ day R&D cycle reduction estimates
  //        https://www.linkedin.com/pulse/self-driving-laboratories-drug-discovery-ai-automation-nagesh-nama-lvube/
  //
  //   4. Commercial value proposition (VC angle):
  //      - Compressing preclinical timelines extends effective patent life:
  //        the patent clock starts ticking at filing, not at approval. Every month
  //        saved in preclinical/clinical development is a month of additional
  //        commercial exclusivity. For a blockbuster drug, that can be worth
  //        hundreds of millions per year of extended market protection.
  //      - Capital efficiency: fewer wasted experiments, smaller teams, faster iteration
  //      - Platform scalability: same control layer across modalities (small molecule,
  //        biologics, cell therapy, formulation)
  //
  //   5. ProviGen positioning:
  //      - The industry learned that building monolithic robotic labs is not the answer;
  //        the value is in the intelligence/control layer that connects to existing hardware
  //      - Works with any programmable instrumentation (vendor APIs, scheduling software,
  //        open-source like PyLabRobot)
  //
  //   Target audience: scientists evaluating SDL adoption + investors mapping the category
  //   Tone: customer education, not sales pitch
  //
  //   Partner lab reference video (Paris Biofoundry):
  //   https://www.youtube.com/watch?v=pCD1HVpVR9M
  // },
];

export const postsBySlug: Record<string, BlogPostMeta> = Object.fromEntries(
  blogPosts.map((p) => [p.slug, p]),
);
