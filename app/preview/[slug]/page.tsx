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

/* Static export needs the slugs up front. The route is dev-only, so a production export carried none — it
   returned an empty array, which vinext up to 1.0.0-beta.5 accepted.
   vinext 1.4.6 refuses it (the Vercel build, 20 Nov 2026): "Page /preview/:slug returned an empty array from
   generateStaticParams(). With output: export, at least one route must be generated." The static export only runs
   under STATIC_EXPORT=1, which scripts/vercel-build.mjs sets and a plain `npm run build` does not, so this failed
   on Vercel while passing locally.
   One slug is listed in production so the export has something to generate. The page below still refuses to serve
   any of them in production, so what it generates is the not-found page. */
export function generateStaticParams() {
  if (process.env.NODE_ENV === 'production') return [{ slug: 'none' }];
  return Object.keys(registry).map((slug) => ({ slug }));
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  /* Was `notFound()` here in production (the Vercel build, 20 Nov 2026). Under vinext 1.4.6 the static export
     prerenders whatever generateStaticParams lists, and a route that answers 404 while being prerendered fails the
     export: "RSC handler returned 404". So production renders nothing instead of refusing, and the one page the
     export generates is dropped from the published output by scripts/vercel-build.mjs, which never copies
     preview/ into .vercel/output/static. The route is therefore still absent from the site. */
  if (process.env.NODE_ENV === 'production') return null;
  const { slug } = await params;
  const Section = registry[slug as keyof typeof registry];
  if (!Section) notFound();
  return (
    <main id="main" className="s-page">
      <Section />
    </main>
  );
}
