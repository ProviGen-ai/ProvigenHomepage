// Generated public files, written before every build (npm "prebuild"), so dev,
// the Worker and the static builds all serve them (competitor review R01 and
// R25, 3 Oct 2026):
//   public/feed.xml     RSS of the writings
//   public/robots.txt   crawlers allowed only when SITE_ENV=production
//   public/sitemap.xml  every public page; empty outside production
// vinext's static export does not emit app/robots.ts or app/sitemap.ts, so
// these are plain files. Absolute links use SITE_URL (default
// https://provigen.ai). Needs --experimental-strip-types to read the TS ledger.
import { writeFileSync } from 'node:fs';
import { orderedWritings } from '../content/writings.ts';

const site = (process.env.SITE_URL || 'https://provigen.ai').replace(/\/+$/, '');
const indexable = process.env.SITE_ENV === 'production';
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/ /g, ' ');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const write = (name, text) => writeFileSync(new URL(`../public/${name}`, import.meta.url), text);

const items = orderedWritings
  .map(
    (w) => `    <item>
      <title>${esc(plain(w.title))}</title>
      <link>${site}${w.href}</link>
      <guid isPermaLink="true">${site}${w.href}</guid>
      <pubDate>${new Date(`${w.date}T09:00:00Z`).toUTCString()}</pubDate>
      <category>${esc(w.category)}</category>
      <description>${esc(w.dek)}</description>
    </item>`,
  )
  .join('\n');
write(
  'feed.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ProviGen · Writings</title>
    <link>${site}/writings</link>
    <atom:link href="${site}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Field notes on building the AI that steers biology.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`,
);

/* Only the provigen.ai production build invites crawlers; previews and dev turn
   them away, as their pages' robots meta does too (lib/site-env.ts). */
write(
  'robots.txt',
  indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n',
);

const pages = ['/', '/biopharma', '/ai-labs', '/careers', '/writings', '/contact'];
const urls = indexable
  ? [
      ...pages.map((path) => ({ loc: `${site}${path}` })),
      ...orderedWritings.map((w) => ({ loc: `${site}${w.href}`, lastmod: w.date })),
      { loc: `${site}/legal-notice` },
      { loc: `${site}/privacy` },
    ]
  : [];
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`,
);
console.log(
  `make-public-files: feed.xml (${orderedWritings.length} items), robots.txt and sitemap.xml (${urls.length} urls) for ${site}${indexable ? ', indexable' : ', noindex'}`,
);
