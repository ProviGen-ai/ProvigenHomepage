export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "The Future of Automated Biolabs",
      date: "January 15, 2024",
      author: "Provigen Team",
      excerpt: "Exploring how AI and robotics are transforming biological research and drug discovery processes. We discuss the latest advances in laboratory automation and how they're accelerating scientific breakthroughs.",
      content: "Coming soon...",
    },
    {
      id: 2,
      title: "Self-Optimizing Systems in Biotech",
      date: "January 10, 2024",
      author: "Provigen Team",
      excerpt: "How machine learning enables laboratories to continuously improve their experimental protocols. Self-optimization is the key to unlocking unprecedented efficiency in modern biotech research.",
      content: "Coming soon...",
    },
    {
      id: 3,
      title: "Accelerating Drug Discovery with Automation",
      date: "January 5, 2024",
      author: "Provigen Team",
      excerpt: "The impact of robotic automation on reducing time-to-market for new therapeutics. From target identification to clinical trials, automation is revolutionizing every step of the drug development pipeline.",
      content: "Coming soon...",
    },
  ];

  return (
    <>
      <section className="pb-[120px] pt-[180px]">
        <div className="container max-w-4xl mx-auto px-8">
          {blogPosts.map((post, index) => (
            <article
              key={post.id}
              className={`${index !== 0 ? 'mt-24 pt-24 border-t border-gray-200' : ''}`}
            >
              <div className="mb-8">
                <div className="flex items-center gap-3 text-sm text-body-color-dark mb-4">
                  <time>{post.date}</time>
                  <span>•</span>
                  <span>{post.author}</span>
                </div>
                <h2 className="text-4xl font-bold text-black sm:text-5xl leading-tight">
                  {post.title}
                </h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed text-body-color-dark">
                  {post.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
