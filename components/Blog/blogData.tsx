import { Blog } from "@/types/blog";

const blogData: Blog[] = [
  {
    id: 1,
    title: "The Future of Automated Biolabs",
    paragraph:
      "Exploring how AI and robotics are transforming biological research and drug discovery processes.",
    image: "/images/blog/blog-01.jpg",
    author: {
      name: "ProviGen Team",
      image: "/images/blog/author-01.png",
      designation: "Research & Development",
    },
    tags: ["technology"],
    publishDate: "2024",
  },
  {
    id: 2,
    title: "Self-Optimizing Systems in Biotech",
    paragraph:
      "How machine learning enables laboratories to continuously improve their experimental protocols.",
    image: "/images/blog/blog-02.jpg",
    author: {
      name: "ProviGen Team",
      image: "/images/blog/author-02.png",
      designation: "AI Research",
    },
    tags: ["research"],
    publishDate: "2024",
  },
  {
    id: 3,
    title: "Accelerating Drug Discovery with Automation",
    paragraph:
      "The impact of robotic automation on reducing time-to-market for new therapeutics.",
    image: "/images/blog/blog-03.jpg",
    author: {
      name: "ProviGen Team",
      image: "/images/blog/author-03.png",
      designation: "Industry Insights",
    },
    tags: ["industry"],
    publishDate: "2024",
  },
];
export default blogData;
