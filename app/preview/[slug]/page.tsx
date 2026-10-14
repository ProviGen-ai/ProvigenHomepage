import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Hero from '@/components/home/Hero';
import Problem from '@/components/home/Problem';
import Stakes from '@/components/home/Stakes';
import Build from '@/components/home/Build';
import Inside from '@/components/home/Inside';
import Team from '@/components/home/Team';
import Join from '@/components/home/Join';

export const metadata: Metadata = {
  title: 'Section preview',
  robots: { index: false, follow: false },
};

/* Dev-only route: renders one homepage section by slug for isolated review. */
const registry = {
  hero: Hero,
  problem: Problem,
  stakes: Stakes,
  build: Build,
  inside: Inside,
  team: Team,
  join: Join,
} as const;

/* Static export needs the slugs up front. The route is dev-only, so a production export lists none. */
export function generateStaticParams() {
  if (process.env.NODE_ENV === 'production') return [];
  return Object.keys(registry).map((slug) => ({ slug }));
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { slug } = await params;
  const Section = registry[slug as keyof typeof registry];
  if (!Section) notFound();
  return (
    <main id="main" className="s-page">
      <Section />
    </main>
  );
}
