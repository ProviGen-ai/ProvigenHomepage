# ProviGen website

Source of provigen.ai. Built with vinext (the Next.js App Router API on Vite), React 19 and TypeScript.

## Development

Node 22.13+. `npm ci`, `npm run dev` (http://localhost:3000). Checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`. Changes to `next.config.ts` (redirects) need a dev-server restart.

Environment: `SITE_URL` (default https://provigen.ai) and `SITE_ENV` (only `production` may be indexed) drive metadata, canonicals, robots and the sitemap (`lib/site-env.ts`); `SITE_ANALYTICS=vercel` turns on cookieless page views and switches the privacy text with them. The contact form's variables (`RESEND_API_KEY`, `CONTACT_*`) are documented in `lib/contact/README.md`. Keep secrets in `.env*` or `.dev.vars`; both are ignored by git.

Deploy folders: `npm run deploy:preview` and `npm run deploy:production` build the site and write a Vercel-ready folder next to this repository (`../output/provigen-preview-vercel`, `../output/provigen-site-vercel`).

Screenshots: `node scripts/shot.mjs URL OUT.png [--width] [--height] [--mobile] [--settle]`. Full-page captures stretch `100svh` sections, so review long pages at successive scroll positions instead.

## Pages

- `/` — homepage, one section per component in `components/home/`.
- `/biopharma`, `/ai-labs` — audience pages (`components/audiences/`, `components/pages/`).
- `/writings` — index and the essays; copy in `content/writings/`.
- `/careers`, `/contact`, `/legal-notice`, `/privacy`, 404.
- `/api/contact` — the contact form's endpoint (`lib/contact/handler.ts`); the form falls back to an email draft.
- `/preview/<slug>` (dev only) renders one homepage section: hero, problem, stakes, build, inside, team, join.
- Retired routes redirect with 308 (`retired` in `next.config.ts`, which `scripts/prepare-vercel.mjs` also writes into vercel.json).
- `feed.xml`, `robots.txt` and `sitemap.xml` are written to `public/` before each build by `scripts/make-public-files.mjs` (robots and sitemap follow `SITE_ENV`).

## Design system

- `app/site.css` — v3 tokens (`--c-*`, `--f-*`, `--g-*`), type (`.s-display … .s-label`), buttons, status chips, grain, frames, motion, header, footer. Every v3 class is prefixed `s-`.
- `app/tokens.css` — the v2 token names, remapped to the v3 palette and fonts so the article and legal templates inherit it. `app/{type,textures,motion,figures,prose,blueprints,globals,design}.css` remain for the long-form pages (`design.css` also imports `public/assets/fonts/fonts.css`).
- `components/site/` — Header, Footer, Frame, Marquee, VideoBackdrop, ShaderGradient (WebGL living gradient), SquareRing.
- `components/home/` — one server component + CSS per homepage section, client islands in subfolders; copy in `content/home/*.ts`; site-wide copy in `content/site.ts`.
- `components/plate/` — the canvas kit the animated figures share.
- CSS rule: import a section's CSS only from a server component or page (vinext orders CSS from client modules first). Raw `<img>` is a lint error; use `next/image` with `unoptimized`.
- Motion: everything pauses with `prefers-reduced-motion`.

## Claims

Public pages never say or imply that ProviGen builds a lab of its own or takes, keeps or reuses partners' data.

No ProviGen metrics, multipliers, partner names or raise sizes. Capability statuses live in `content/home/build.ts`. `npm run build` ends with `scripts/check-claims.mjs`: every figure in the built pages must be listed in `claims-ledger.json`, and a production build fails on any `[TBC]`, unlisted figure or figure not signed off. Every figure and number carries a source line.
