import type { NextConfig } from 'next';

/*
 * v3 (1 Oct 2026) folded the v2 inner pages into the homepage and /contact.
 * Old links land on the matching section or form intent (308, permanent).
 * Exported: scripts/prepare-vercel.mjs writes the same list into vercel.json
 * for the static builds, so there is one list.
 */
export const retired: [source: string, destination: string][] = [
  /* v2 pages. /how-it-works was removed on the founder's call (3 Oct 2026,
     late): it and the pages that pointed at it land on the homepage's How it
     works section. */
  ['/how-it-works', '/#how-it-works'],
  ['/platform', '/#how-it-works'],
  ['/direction', '/#how-it-works'],
  ['/programs', '/#how-it-works'],
  ['/company', '/#team'],
  ['/about', '/#team'],
  /* The partner page was removed on the founder's call (3 Oct 2026, evening). */
  ['/work-with-us', '/contact'],
  /*
   * provigen.ai v1 URLs that are live and linked today (competitor review R01,
   * 3 Oct 2026). The blog post's old anchors (#assay-optimization,
   * #media-optimization) survive the redirect and land on alias ids in the
   * field note. /demo (v1's Bayesian-optimisation demo) lands on the field
   * note's live simulation. More specific sources first.
   */
  ['/blog/closed-loop-optimization', '/writings/closed-loop-optimization'],
  /* The old site's use-case pages and manifesto, now essays (4 Oct 2026). */
  ['/use-cases/dna-assembly', '/writings'], // off the live site for now (14 Oct 2026)
  ['/use-cases/antibody-discovery', '/writings'], // off the live site for now (14 Oct 2026)
  ['/use-cases', '/writings'],
  ['/manifesto', '/writings/manifesto'],
  /* Taken off the site on 4 Oct 2026 (founder): the long game archived, the bottleneck essay deleted. */
  ['/writings/making-human-renewal-programmable', '/writings'],
  ['/writings/the-bottleneck-moved', '/writings'],
  /* Taken off the site on 8 Oct 2026 (founder); archived in ../output/provigen-website-removed-2026-10-08/. */
  ['/writings/three-papers-lab-in-the-loop', '/writings'],
  ['/writings/as-fast-as-its-experiments', '/writings'],
  ['/blog/:slug', '/writings'],
  ['/blog', '/writings'],
  ['/demo', '/writings/closed-loop-optimization#simulation'],
  /* The Start-here doors (founder, 7 Oct 2026): the Investors door was removed,
     and the Frontier labs door became AI Labs. */
  ['/investors', '/contact'],
  ['/frontier-labs', '/ai-labs'],
  /* provigen.ai v1 legal URLs. */
  ['/legal_notice', '/legal-notice'],
  ['/privacy_policy', '/privacy'],
];

/*
 * STATIC_EXPORT=1 builds a plain static site (dist/client) for hosts without a
 * Worker runtime, e.g. the Vercel preview on convalexius.space (3 Oct 2026).
 * Static export cannot serve redirects; that build carries them in vercel.json.
 */
const staticExport = process.env.STATIC_EXPORT === '1';

const nextConfig: NextConfig = {
  ...(staticExport ? { output: 'export' as const } : {}),
  async redirects() {
    if (staticExport) return [];
    return retired.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
