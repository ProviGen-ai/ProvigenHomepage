import type { Metadata, Viewport } from 'next';
import './globals.css';
import './design.css';
import './blueprints.css';
import './tokens.css';
import './type.css';
import './textures.css';
import './motion.css';
import './figures.css';
import './prose.css';
import './site.css';
import SiteChrome from '@/components/SiteChrome';
import { ANALYTICS, INDEXABLE, SHARE_IMAGE, SITE_URL } from '@/lib/site-env';
import { site } from '@/content/site';

/*
 * Site-wide metadata (competitor review R01, R03, R05; 3 Oct 2026): the title
 * carries the category line (content/site.ts); indexing and the canonical
 * origin follow the build environment (lib/site-env.ts), so only the
 * provigen.ai production build can be indexed; one share card (public/og.png)
 * and a full icon set. openGraph has no title or description here: each page's
 * own fill it.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    /* The old site's tab text, kept on the founder's call (14 Oct 2026). */
    default: 'ProviGen | Autonomous Life Science Infrastructure',
    template: '%s | ProviGen',
  },
  /* The hero's subline (content/home/hero.ts; the founder's call of 4 Oct 2026). */
  description: 'Predicting biological and chemical processes. Built for the infrastructure you already have.',
  applicationName: 'ProviGen',
  robots: INDEXABLE ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: 'website',
    siteName: 'ProviGen',
    locale: 'en_US',
    images: [SHARE_IMAGE],
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    /* 32x32 on the .ico (it holds 16, 32, 48): a larger or "any" size can make
       Chrome prefer it over the SVG. */
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#F8F4EF',
};

/*
 * Who the company is, for search engines and link previews (R01): the facts
 * here are the public ones (legal notice, team section, footer).
 */
const organization = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'ProviGen',
      legalName: 'ProviGenAI Inc.',
      alternateName: ['ProviGenAI', 'ProviGen AI'],
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/icon-512.png`,
      description: 'Lab-in-the-loop AI for experimental biology.',
      email: site.email,
      sameAs: [site.linkedin],
      address: {
        '@type': 'PostalAddress',
        streetAddress: '995 Market St, Floor 8',
        addressLocality: 'San Francisco',
        addressRegion: 'CA',
        postalCode: '94103',
        addressCountry: 'US',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: 'ProviGen',
      url: `${SITE_URL}/`,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

/* Applies the OS motion preference before first paint. The site no longer has a
   motion switch: the old 'pg-motion' choice is cleared so it cannot strand anyone. */
const motionBoot = `(function(){var d=document.documentElement;d.dataset.reveal='js';try{localStorage.removeItem('pg-motion')}catch(e){}try{d.dataset.motion=matchMedia('(prefers-reduced-motion: reduce)').matches?'paused':'playing'}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body id="top" className="s-body-root">
        {/* Fonts are otherwise found only after the CSS is parsed; the late swap reflows text. React hoists these into <head>. */}
        <link rel="preload" href="/assets/fonts/eb-garamond-var.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/assets/fonts/kessler-display-regular.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/assets/fonts/pp-supply-mono-regular.woff2" as="font" type="font/woff2" crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: motionBoot }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, '\\u003c') }}
        />
        <link rel="alternate" type="application/rss+xml" title="ProviGen · Writings" href="/feed.xml" />
        {ANALYTICS === 'vercel' ? <script defer src="/_vercel/insights/script.js" /> : null}
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
