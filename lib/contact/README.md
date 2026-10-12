# Contact endpoint

`POST /api/contact` (3 Oct 2026, competitor review R17). The form on `/contact` posts here, and the message goes by email through [Resend](https://resend.com) to contact@provigen.ai, the founder's call of 3 Oct 2026. Resend is the processor the privacy text already names.

- `handler.ts`: all the logic. Framework-free: a Web `Request` in, a `Response` out, no imports. Copy it verbatim wherever it has to run.
- `app/api/contact/route.ts`: serves it under vinext (dev and the Worker build). `output: 'export'` skips API routes with a warning, so the static deploy needs the Vercel Function below.
- `components/contact/ContactForm.tsx`: the client. On anything but a 200 it opens the mailto draft the form always opened, and its status line says so. Without scripting the form posts to `mailto:` natively.

## Environment

| Variable | Needed | Default | What it does |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | to send | none | Resend API key, kept as a secret. Unset means `503 not-configured`, and the form opens the email draft instead. |
| `CONTACT_TO` | no | `contact@provigen.ai` | Recipient. A comma-separated list is allowed. |
| `CONTACT_FROM` | no | `ProviGen website <website@provigen.ai>` | Sender. Its domain must be verified in Resend (below). |
| `CONTACT_ORIGINS` | no | none | Extra allowed origins, comma-separated, exact match (for example a preview URL). Always allowed: `https://provigen.ai`, `https://www.provigen.ai`, `https://provigen.convalexius.space`, `http://localhost:<any port>`. |
| `CONTACT_DRY_RUN` | no | none | `1` logs the email to the server console instead of sending it. Ignored when `NODE_ENV` is `production`, where it would show "sent" for mail that never left. |

`VERCEL` (set by Vercel itself) tells the rate limit to read the visitor's address from `x-real-ip`; elsewhere it reads Cloudflare's `cf-connecting-ip`.

## Resend: verify the sender's domain first

Resend only sends from a domain verified in the account: add `provigen.ai` (or a subdomain such as `send.provigen.ai`, then set `CONTACT_FROM` to match) under Domains and publish the DNS records it lists (SPF and DKIM). Until the domain is verified Resend refuses the request, the endpoint answers `502 send-failed`, and visitors get the email draft. For a smoke test before DNS is done, `CONTACT_FROM="ProviGen website <onboarding@resend.dev>"` works, but Resend delivers mail from that test address only to the Resend account owner's own address.

The visitor's address goes in `reply_to`, so replying from that inbox answers the visitor directly. No auto-reply goes back to the visitor: an auto-reply to any address typed into a form is a spam vector. Resend keeps a log of the emails it sends, so the site says nothing about storage.

## Where to set it

- **Local dev** (`npm run dev`): the route runs in workerd through `@cloudflare/vite-plugin`, which reads `.dev.vars`, or failing that `.env` and `.env.local`. Use `.env.local` (git-ignored). Editing it restarts the dev server. A dry run needs no key: `CONTACT_DRY_RUN=1`, and the would-be email prints in the dev-server terminal.
- **Worker build**: `npx wrangler secret put RESEND_API_KEY` (or the Cloudflare dashboard). `process.env` is filled from vars and secrets (nodejs_compat); the route reads `NODE_ENV` as its own expression so the build-time value reaches the handler.
- **Static export on Vercel**: `scripts/prepare-vercel.mjs` writes the Function on every run, as `api/contact.ts` around `api/_contact-handler.ts`, a verbatim copy of this handler (the underscore keeps Vercel from making it a route of its own). Edit `handler.ts` here, never the copy. Set `RESEND_API_KEY` (Production, sensitive) in the Vercel project and redeploy. The form posts to the relative `/api/contact`, so it stays same-origin on `provigen.convalexius.space` and `provigen.ai`. The preview's `middleware.js` matches `/api` as well; with `PREVIEW_PASSWORD` set, the browser sends its Basic Auth credentials with the same-origin request.

## Behaviour

| Request | Answer | Sent |
| --- | --- | --- |
| Not `POST` | `405`, `Allow: POST` | no |
| `Origin` missing or not allowed | `403 origin` | no |
| Not `application/json` / over 32 KB | `415` / `413` | no |
| Honeypot `website` filled, or `t` (ms the form was open) missing or under 3000 | `200 {ok:true}`, the same as a person gets | no |
| Invalid field: intent not one of partner, join, invest, research, press; name 1–150 characters; email up to 250, the browser's email pattern with a dot in the domain; message 1–5000; instruments up to 300; control characters | `400 invalid` with `fields` | no |
| More than 5 messages from one address in 10 minutes | `429`, `Retry-After: 600` | no |
| `CONTACT_DRY_RUN=1` outside production | `200`, email logged | no |
| No `RESEND_API_KEY` | `503 not-configured` | no |
| Resend refuses or is unreachable (10 s timeout) | `502 send-failed` | no |
| Resend accepts | `200 {ok:true}` | yes |

The rate limit is in memory and per instance: every Worker isolate and every function instance keeps its own window, so the real ceiling is five times the instances alive. That is enough to stop one script from filling the inbox. Anything stronger needs a shared store (KV, Redis), deliberately left out. The form waits until past the 3 s mark before posting, so a fast visitor is never taken for a bot. In dev, vinext's own origin check answers cross-site requests with a plain-text 403 before they reach the handler.

The email: subject `ProviGen · <Intent> · <name>`, plain text with intent, name, email, instruments (if given), the message and the page origin.

## Tests

Nothing below sends an email.

- Handler, with `fetch` stubbed (26 checks):
  `node --experimental-strip-types --no-warnings ../output/provigen-website-fixes-2026-10-03/contact/test-handler.mts`
- Browser, against a running dev server without a key (36 checks: console on load, fallback, sent with `fetch` stubbed, validation, keyboard, press, phone, no script):
  `node ../output/provigen-website-fixes-2026-10-03/contact/test-browser.mjs http://localhost:3000`
- By hand:

  ```sh
  curl -i http://localhost:3000/api/contact                          # 405
  curl -i -X POST http://localhost:3000/api/contact \
    -H 'Origin: https://localhost' -H 'Content-Type: application/json' -d '{}'   # 403
  curl -i -X POST http://localhost:3000/api/contact \
    -H 'Origin: http://localhost:3000' -H 'Content-Type: application/json' \
    -d '{"intent":"partner","name":"Test","email":"test@example.org","message":"Test","website":"","t":9000}'
    # 503 without a key; 200 with CONTACT_DRY_RUN=1; a real email with a key
  ```
