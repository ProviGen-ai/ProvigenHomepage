import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import { hero } from '@/content/home/hero';
import Hero from '@/components/home/Hero';
import Audiences from '@/components/home/Audiences';
import Problem from '@/components/home/Problem';
import Build from '@/components/home/Build';
import Inside from '@/components/home/Inside';
import Team from '@/components/home/Team';
import Join from '@/components/home/Join';
import Dawn from '@/components/home/Dawn';

/*
 * v3 homepage (1 Oct 2026; vision reframe 3 Oct 2026): opening · start here
 * (three doors by audience, 6 Oct 2026) · problem and the turn · how it
 * works · a look inside · team · join. "Why it matters"
 * (components/home/Stakes.tsx) is kept but off the page since 3 Oct 2026; its
 * argument became the essay /writings/as-fast-as-its-experiments (off the site
 * since 8 Oct 2026, archived in ../output/provigen-website-removed-2026-10-08/).
 * Inside, Team and Join share one continuous background (Dawn).
 * The footer (marquee, logo, nav) comes from SiteChrome.
 */
/** The canonical and og:url for '/', described by the hero's subline. */
export const metadata: Metadata = pageMetadata({ description: hero.subline.join(' '), path: '/' });

export default function Home() {
  return (
    <main id="main" className="s-page">
      <Hero />
      <Audiences />
      <Problem />
      <Build />
      <Dawn>
        <Inside />
        <Team />
        <Join />
      </Dawn>
    </main>
  );
}
