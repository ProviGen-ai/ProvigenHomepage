import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | ProviGen",
  description:
    "What we do and who we are. ProviGen builds the control layer for life science.",
};

const team = [
  {
    name: "Placeholder",
    role: "Co-Founder",
    bio: "Bio coming soon.",
  },
  {
    name: "Placeholder",
    role: "Co-Founder",
    bio: "Bio coming soon.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <section className="pb-24 pt-[160px]">
        <div className="max-w-3xl mx-auto px-4 md:px-12">
          <h1 className="font-serif text-3xl md:text-4xl font-normal text-[#090E34] mb-10">
            About Us
          </h1>

          <div className="prose-blog">
            <h2>What we do</h2>
            <p>
              ProviGen builds the control layer for life science. We combine
              active learning with laboratory automation to run closed-loop
              experimental campaigns: the system designs the next round of
              experiments, drives them on available hardware, collects the
              results, and feeds them back into the next decision.
            </p>
            <p>
              The result is faster iteration, fewer wasted experiments, and
              protocols that are robust and transferable from the start.
            </p>

            <h2>Our team</h2>
          </div>

          <div className="mt-8 space-y-8">
            {team.map((member) => (
              <div key={member.name + member.role} className="border-t border-[#e8e6e1] pt-6">
                <div className="font-mono text-sm text-[#090E34] font-medium">
                  {member.name}
                </div>
                <div className="font-mono text-xs text-[#6c7793] mt-1">
                  {member.role}
                </div>
                <p className="font-serif text-base text-[#2a2a2a] mt-3 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
