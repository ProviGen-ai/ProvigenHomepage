# ProviGen website

Source of [provigen.ai](https://provigen.ai). Built with vinext (the Next.js App Router API on Vite), React 19 and TypeScript.

## Quick start

Requires Node 22.13 or newer.

```bash
npm ci
npm run dev
```

The site runs at http://localhost:3000.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload. Changes to `next.config.ts` need a restart. |
| `npx tsc --noEmit` | Type check. |
| `npm run lint` | Lint with oxlint. |
| `npm run format` | Format with oxfmt. |
| `npm run build` | Writes the feed, robots and sitemap, builds the site into `dist/`, then runs the claims check. |
| `npm run start` | Serves the built site locally. |
| `npm run check:claims` | Runs the claims check on its own (see [Claims](#claims)). |

Run the type check, lint and build before you push.

## Layout

| Path | Contents |
| --- | --- |
| `app/` | Routes, the root layout and the global stylesheets. |
| `components/home/` | The homepage: one server component and one CSS file per section, client islands in subfolders. |
| `components/audiences/`, `components/pages/` | The audience pages and the shared subpage skeleton and tabs. |
| `components/writings/` | Essay furniture and the interactive figures. |
| `components/site/` | Header, Footer, Frame, Marquee, VideoBackdrop, ShaderGradient, MonoMarks. |
| `components/plate/`, `components/hairline/` | The canvas and SVG kits the animated figures share. |
| `content/` | All copy. Homepage sections in `content/home/`, pages in `content/pages/`, essays in `content/writings/`, site-wide text in `content/site.ts`. |
| `lib/` | Site settings (`site-env.ts`), the contact handler and shared hooks. |
| `public/` | Films, images, logos, fonts, share cards and icons. |
| `scripts/` | Build, deploy and asset tooling. |
| `claims-ledger.json` | The figures the claims check accepts. |

To change text, edit `content/`. To change how something looks, edit the component and its CSS file.

## Pages

- `/`: the homepage.
- `/biopharma`, `/ai-labs`: audience pages.
- `/writings`: the index and the essays.
- `/careers`, `/contact`, `/legal-notice`, `/privacy` and the 404 page.
- `/api/contact`: the contact form's endpoint. The form falls back to an email draft when sending is not configured.
- `/preview/<slug>`: dev only, renders one homepage section (`hero`, `problem`, `stakes`, `build`, `inside`, `team`, `join`).

Retired routes redirect with 308. The list is `retired` in `next.config.ts`.

`feed.xml`, `robots.txt` and `sitemap.xml` are generated into `public/` before every build by `scripts/make-public-files.mjs`. Do not edit or commit them.

## Environment

None of these is needed for local development.

| Variable | Default | Effect |
| --- | --- | --- |
| `SITE_URL` | `https://provigen.ai` | Public origin for metadata, canonicals and the sitemap. |
| `SITE_ENV` | none | Only `production` lets search engines index the site. Anything else stays noindex. |
| `SITE_ANALYTICS` | none | `vercel` turns on cookieless page views and switches the privacy text with them. |
| `STATIC_EXPORT` | none | `1` builds a plain static site into `dist/client`. |
| `RESEND_API_KEY`, `CONTACT_*` | | The contact form. See `lib/contact/README.md`. |

Keep secrets in `.env*` or `.dev.vars`. Both are ignored by git.

## Deploying

```bash
npm run deploy:preview
npm run deploy:production
```

Each command builds a static export and writes a Vercel-ready folder next to this repository (`../output/provigen-preview-vercel` and `../output/provigen-site-vercel`). Deploy from inside that folder with `npx vercel deploy --prod`. The preview build is noindex. The production build fails if the claims check does not pass.

## Conventions

- **Tokens and type** live in `app/site.css` (`--c-*`, `--f-*`, `--g-*`, `.s-display … .s-label`). Every class from this system is prefixed `s-`.
- **Long-form pages** (essays, legal) use `app/tokens.css` and `app/{type,textures,motion,figures,prose,blueprints,globals,design}.css`.
- **CSS imports:** import a section's CSS only from a server component or a page. vinext orders CSS from client modules first.
- **Images:** raw `<img>` is a lint error. Use `next/image` with `unoptimized`.
- **Motion:** every animation respects `prefers-reduced-motion`.

## Claims

Two rules apply to everything the site says:

1. Public pages never say or imply that ProviGen builds a lab of its own or takes, keeps or reuses partners' data.
2. No ProviGen metrics, multipliers, partner names or raise sizes. Every figure carries a source line.

`npm run check:claims` (no longer part of `npm run build` since 14 Oct 2026, founder) scans the built pages: every figure should be listed in `claims-ledger.json`, and with `SITE_ENV=production` it exits 1 on any `[TBC]`, unlisted figure or figure not signed off. Run it by hand after a static build. Capability statuses live in `content/home/build.ts`.

## Tooling

- `scripts/shot.mjs`: headless-Chrome screenshots. `node scripts/shot.mjs URL OUT.png [--width] [--height] [--mobile] [--settle]`. Full-page captures stretch `100svh` sections, so review long pages at successive scroll positions.
- `scripts/make-share-assets.mjs`: renders the share cards and the icon set.
- `scripts/make-grain.mjs`: regenerates the film-grain tile.
- `scripts/calibrate-*.mjs`: calibrate the simulations behind the essay figures.
