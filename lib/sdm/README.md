# SDM-1 route (`/api/sdm1`)

The release page calls the model only through its own site. The page calls
`/api/sdm1/v1/status` and `/api/sdm1/v1/propose`. `lib/sdm/proxy.ts` then
forwards the call to the SDM-1 API on AWS, with this environment's secret and
the visitor's IP. The browser never calls AWS and never sees the secret.

The AWS side (per-IP limits, global in-flight slots, the waiting line, GPU)
is agent-002's. Its contract is in BiofoundryDemo_AI
`docs/sdm1_api_design.md`, and the page side is in `lib/sdm/contract.ts`.
The route only adds what has to sit before AWS. The user decided on
2026-11-13 that nothing else would.

- **Kill switch:** `SDM_KILL_SWITCH=1` answers 503 paused without calling AWS.
- **Draft gate:** until `SDM_PUBLIC=1`, only a browser holding the preview
  cookie gets an answer. Everyone else gets 404. The gate is open in local
  development.
- **Public limits:** the same in every environment (24 parameters, 200
  observations, batch 8, design 32), plus a 256 KB body limit. Bad requests
  never reach AWS.
- **Status mapping:**
  - 200 and 400 pass through as they are.
  - 429 `rate_limited` passes through as 429.
  - 503 `high_demand` and `paused` pass through as 503.
  - The gateway's own 429, 403 (a refused secret, logged as an ALERT), 5xx,
    timeouts and network errors all become 503 `high_demand`.
  - Every 429 and 503 carries `Retry-After`.
- **Time:** AWS answers within 54 s. The route waits 57 s, its Functions get
  `maxDuration` 60 s (the Vercel free plan's limit), and the page's client
  waits 65 s. A live call that takes more than 8 s shows a "still working"
  hint in Try it.

## Environment variables

These are server only. Never give them a `NEXT_PUBLIC_` prefix, never log
them, never commit them.

| Variable | Value | Notes |
| --- | --- | --- |
| `SDM_API_BASE` | AWS base URL, e.g. `https://<api-id>.execute-api.eu-west-1.amazonaws.com/live` | Later `https://api.provigen.ai`. |
| `SDM_API_SECRET` | This environment's secret | Different for local dev, Vercel Preview and Vercel Production. Mark it **Sensitive** in Vercel. |
| `SDM_PREVIEW_TOKEN` | A long random string | Opens the draft gate (see below). Mark it Sensitive. |
| `SDM_MODEL_ROUTES` | `1` | Serves `/v1/propose` and `/v1/status` in production too. Off by default (the user, 17 Nov 2026): the page plays recorded runs and asks the model for nothing, while `propose` takes no caller token, so an open route would let anyone draw on this environment's quota. Token holders call the API directly with their own token. Development is unaffected. |
| `SDM_PUBLIC` | `1` once the page is public | Unset: the gate stays closed. |
| `SDM_KILL_SWITCH` | `1` to stop forwarding | On Vercel this takes effect with the next deployment. Use AWS's pause for an instant stop. |

The page itself has one public build-time flag, `NEXT_PUBLIC_SDM_LIVE=1`.
It only tells the page the route is configured on this deploy. Without it,
the try-it panel uses the mock. It is not a secret.

- **Local development:** put the dev values in `.env.local`, which is
  git-ignored by `.env*`.
- **Vercel:** set the Preview and Production values in Project Settings →
  Environment Variables, each scoped to its one environment.

Nothing is set or deployed without the user's go, which comes through agent-001
at step 5.

## Draft gate

While the page is a hidden draft, open
`/api/sdm1/preview?token=<SDM_PREVIEW_TOKEN>&next=/writings/introducing-model-name`
once in the browser that should see the live model. It sets an HttpOnly
cookie, scoped to `/api/sdm1`, for 14 days, and returns to the page. A wrong
token gets 404 and sets nothing.

## Rotating a secret

Change Vercel and AWS together, one environment at a time. This is the same
runbook as section 8, step 6 of `docs/sdm1_api_design.md`:

1. AWS (agent-002) adds the new value in Secrets Manager as a new version
   labelled `AWSPENDING`. The authorizer accepts `AWSCURRENT` and
   `AWSPENDING` alike.
2. Set the new `SDM_API_SECRET` in Vercel for that environment only, then
   redeploy. For dev, the dev session does this; for Preview and Production,
   the user does it in Vercel, never through chat or files.
3. Wait until the redeploy is live and the page gets answers. Then AWS
   promotes the new version to `AWSCURRENT`. The old one becomes
   `AWSPREVIOUS` and is no longer accepted. The authorizer caches a decision
   for 300 s, so the old secret may still work for up to 5 minutes after this
   step. That is harmless.
4. Rotate `SDM_PREVIEW_TOKEN` separately by setting a new value and
   redeploying. Old preview cookies then stop working.

Rotate immediately if a secret may have leaked, for example in a log, a
screenshot or a commit. The route logs `sdm1: ALERT … refused this
environment's secret` whenever AWS rejects it.

## Tests

`npm run check:sdm` tests the proxy against a fake AWS: the gate, kill
switch, limits, forwarding, every status mapping, and that the secret never
appears in an answer. It also runs the generated Vercel Functions
(`scripts/sdm-function.mjs`) over real HTTP. No network calls are made.

`npm run check:cube` checks that the cube's recorded runs still replay.

## Personal tokens (`/api/sdm1/v1/tokens`)

Added 16 Nov 2026 for the user's "Get access" flow (BiofoundryDemo_AI
`docs/sdm1_api_design.md` section 10). The page's form
(`components/release/GetAccess.tsx`) posts `{email, consent: true,
contact_opt_in}` to the site. The route checks it and forwards it to AWS
`POST /v1/tokens` with this environment's secret and the visitor's IP. The
body it sends is `{email, consent_version, contact_opt_in}`.

- **Consent version:** `CONSENT_VERSION` in `lib/sdm/proxy.ts` is set by the
  server, never by the browser. Change it whenever the consent wording in
  `GetAccess.tsx` changes. The wording is a draft until the user approves it.
- **Answers:**
  - 201 passes on only `token`, `tier`, `trial_calls` and, where AWS sends
    them, `daily_limit` and `total_limit`.
  - 400 and 429 `rate_limited` pass as they are, and 503 `paused` too.
  - Everything else becomes 503.
  - No 409: since 17 Nov 2026 every accepted request gets the same answer, so
    the form never says whether an address already had a token.
- **Privacy:** the route never logs or stores the email or the token. The
  token is shown once in the browser and is not saved there.
- **Same guards as propose:** the kill switch and the draft gate apply.

## Email confirmation (`/api/sdm1/v1/activate`)

Added 17 Nov 2026 on the user's instruction: the form's token works 20 times
at once, and the full token (50 a day, 500 in total) comes from a link emailed
to the address. AWS sends the mail (agent-002: SES, links good for 48 h,
single use, a newer link voiding the older one).

- **The link** opens `https://provigen.ai/sdm1/activate#<code>`, so the code
  sits in the URL *fragment* and reaches no server in a GET. The page
  (`app/sdm1/activate/`) does nothing on load, because mail scanners fetch
  links before anyone clicks; one **Activate** button posts the code to
  `/api/sdm1/v1/activate`, which alone calls AWS
  `POST /v1/tokens/activate` with this environment's secret and the visitor's
  IP. The browser never calls AWS.
- **Answers:** 200 passes on `token`, `tier`, `daily_limit`, `total_limit`;
  410 (or 404 `link_expired`) becomes 410 `link_expired`; 400, 429 and 503
  pass as above; everything else becomes 503.
- **The page** is `noindex` and sends no referrer, so the fragment cannot
  leak through one, and it clears the fragment once a token is shown.
- **Same guards as tokens:** the kill switch and the draft gate apply, and the
  route is unaffected by `SDM_MODEL_ROUTES`.
- **Per environment:** the activation page's address has to be given to AWS
  (`https://provigen.ai/sdm1/activate` in production, the deployment's own URL
  in a preview, `http://localhost:3917/sdm1/activate` in development). Email
  links cannot reach a development site from outside this machine.
