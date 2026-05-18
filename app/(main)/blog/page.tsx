import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts } from "./posts";

export const metadata: Metadata = {
  title: "Blog | ProviGen",
  description:
    "Insights on AI-driven experimental optimization, laboratory automation, and closed-loop learning.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      <div
        className="fixed inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: "url('/images/hero/paper_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <section className="pb-24 pt-[160px] relative">
        <div className="max-w-5xl ml-[8%] md:ml-[12%] pr-4 md:pr-12">
          <h1 className="text-3xl md:text-4xl font-medium text-white mb-12">
            Blog
          </h1>

          <div>
            {blogPosts.map((post, index) => {
              const card = (
                <article
                  key={post.id}
                  className={`py-8 ${index !== 0 ? "border-t border-white/10" : ""}`}
                >
                  <div className="font-mono text-xs text-white/30 mb-2 tracking-wide">
                    {post.date}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-medium text-white mb-2 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-white/50 leading-relaxed max-w-2xl">
                    {post.excerpt}
                  </p>
                </article>
              );

              if (post.slug) {
                return (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="block hover:bg-white/[0.03] -mx-4 px-4 rounded-md transition-colors">
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
