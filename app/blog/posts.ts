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
  //   title: "Closed-Loop Control in Industrial Bioprocessing",
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
];

export const postsBySlug: Record<string, BlogPostMeta> = Object.fromEntries(
  blogPosts.map((p) => [p.slug, p]),
);
