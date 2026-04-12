export type BlogPostMeta = {
  id: number;
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
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
];

export const postsBySlug: Record<string, BlogPostMeta> = Object.fromEntries(
  blogPosts.map((p) => [p.slug, p]),
);
