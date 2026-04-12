import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | ProviGen",
  description:
    "Insights on AI-driven experimental optimization, laboratory automation, and closed-loop learning.",
};

const blogPosts = [
  {
    id: 1,
    slug: "closed-loop-optimization",
    title: "Closed-Loop Experimental Campaigns in Practice",
    date: "April 10, 2025",
    author: "ProviGen Team",
    excerpt:
      "A practical walkthrough of active learning campaigns across assay optimization, therapeutic design, and media formulation.",
  },
  // Hidden until ready:
  // {
  //   id: 2,
  //   slug: null,
  //   title: "Self-Optimizing Systems in Biotech",
  //   date: "Coming soon",
  //   author: "ProviGen Team",
  //   excerpt:
  //     "How machine learning enables laboratories to continuously improve their experimental protocols.",
  // },
  // {
  //   id: 3,
  //   slug: null,
  //   title: "Accelerating Drug Discovery with Automation",
  //   date: "Coming soon",
  //   author: "ProviGen Team",
  //   excerpt:
  //     "The impact of robotic automation on reducing time-to-market for new therapeutics.",
  // },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <section className="pb-24 pt-[160px]">
        <div className="max-w-5xl ml-[8%] md:ml-[12%] pr-4 md:pr-12">
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#090E34] mb-12">
            Blog
          </h1>

          <div>
            {blogPosts.map((post, index) => {
              const card = (
                <article
                  key={post.id}
                  className={`py-8 ${index !== 0 ? "border-t border-[#d4d2cd]" : ""}`}
                >
                  <div className="font-mono text-xs text-[#6c7793] mb-2 tracking-wide">
                    {post.date}
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#090E34] mb-2 leading-snug">
                    {post.title}
                  </h2>
                  <p className="font-serif text-sm text-[#6c7793] leading-relaxed max-w-2xl">
                    {post.excerpt}
                  </p>
                </article>
              );

              if (post.slug) {
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block hover:bg-[#f3f1ee] -mx-4 px-4 rounded-md transition-colors">
                    {card}
                  </Link>
                );
              }
              return card;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
