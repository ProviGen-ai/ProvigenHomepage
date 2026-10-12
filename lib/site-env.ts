import type { Metadata } from 'next';

/*
 * Where the site is served and whether search engines may index it
 * (competitor review R01, 3 Oct 2026). Both come from the build environment:
 *
 *   SITE_URL   the public origin, default https://provigen.ai
 *   SITE_ENV   'production' only for the provigen.ai build; anything else
 *              (preview, dev) stays noindex
 *
 * Read on the server at build or render time; a Worker without process.env
 * falls back to the defaults (noindex).
 */
const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env ? process.env : {};

export const SITE_URL = (env.SITE_URL || 'https://provigen.ai').replace(/\/+$/, '');

/** True only for the production build of provigen.ai. */
export const INDEXABLE = env.SITE_ENV === 'production';

/**
 * Cookieless page-view analytics (competitor review R20), off unless
 * SITE_ANALYTICS=vercel. The privacy text switches with it (content/pages/legal.ts),
 * so the page never says one thing while the site does another. Turn Web
 * Analytics on in the Vercel project before setting the variable.
 */
export const ANALYTICS: 'vercel' | null = env.SITE_ANALYTICS === 'vercel' ? 'vercel' : null;

/** The default share card (public/og.png, 1200×630). */
export const SHARE_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'ProviGen. Better Decisions, every Experiment.',
};

/**
 * Page metadata with its canonical address and share card. The layout's
 * openGraph carries no title or description on purpose: vinext (like Next.js)
 * fills og:title and og:description from each page's own, so only pages with
 * their own card (the essays) need `image`.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
}: {
  title?: string;
  description: string;
  /** Canonical path, e.g. '/careers'. */
  path: string;
  image?: { url: string; width: number; height: number; alt: string };
  type?: 'website' | 'article';
}): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: 'ProviGen',
      locale: 'en_US',
      url: path,
      images: [image ?? SHARE_IMAGE],
    },
  };
}

/** An essay's own share card (public/og/<slug>.png, from scripts/make-share-assets.mjs). */
export const essayImage = (slug: string, title: string) => ({
  url: `/og/${slug}.png`,
  width: 1200,
  height: 630,
  alt: title,
});
