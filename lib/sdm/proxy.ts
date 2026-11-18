/*
 * The site's route to the SDM-1 API on AWS (13 Nov 2026; the user's design,
 * agreed with agent-002, who builds the AWS side: BiofoundryDemo_AI
 * docs/sdm1_api_design.md). The page never calls AWS: it calls
 * /api/sdm1/v1/status and /api/sdm1/v1/propose on its own site, and only this
 * code, on the server, calls AWS.
 *
 * A thin proxy by the user's decision ("don't add some other pathways that
 * are not covered by AWS"): per-IP limits, the global threshold and the queue
 * all live on AWS. Here, in order:
 *   1. kill switch (SDM_KILL_SWITCH=1): 503 paused, nothing forwarded;
 *   2. draft gate: until SDM_PUBLIC=1, only a browser holding the preview
 *      cookie gets an answer; everyone else gets 404 (open in development);
 *   3. the request checked against the public limits (lib/sdm/contract.ts,
 *      the same in every environment) and a 256 KB body, so a bad request
 *      never reaches AWS (AWS checks again and stays authoritative);
 *   4. forwarded with the secret (Authorization: Bearer) and the visitor's IP
 *      (X-SDM-Client-IP), within 57 s;
 *   5. AWS's answer mapped to the page's contract: 200 and 400 as they are;
 *      429 rate_limited (this visitor) as it is; 503 high_demand or paused as
 *      it is; the gateway's own 429, a refused secret (403), a timeout or an
 *      unreachable AWS as 503 high_demand. Every 429 and 503 carries
 *      Retry-After and retry_after_s.
 *
 * Framework-free, no imports, like lib/contact/handler.ts: vinext serves it
 * through app/api/sdm1/** (dev and the Worker build), and the Vercel builds
 * wrap the same file as Node Functions with maxDuration 60 s (the free plan's limit).
 *
 * Env (server only; never NEXT_PUBLIC_, never logged, never sent to the
 * browser; setup and rotation in lib/sdm/README.md):
 *   SDM_API_BASE       the AWS base URL (default execute-api URL until api.provigen.ai)
 *   SDM_API_SECRET     this environment's secret (dev, preview and production differ)
 *   SDM_PREVIEW_TOKEN  the draft gate's token, set as a cookie by /api/sdm1/preview?token=…
 *   SDM_PUBLIC         "1" once the page is public: the gate opens
 *   SDM_KILL_SWITCH    "1" answers 503 paused without calling AWS
 *   SDM_MODEL_ROUTES   "1" serves /v1/propose and /v1/status in production too (off by default: the page needs
 *                      neither, and propose takes no caller token)
 */

export type SdmEnv = Record<string, string | undefined>;
// export type SdmPath = 'status' | 'propose' | 'preview';
/* 'tokens' (16 Nov 2026, the user's "Get access" flow, agent-002's design section 10): the page's form asks AWS for a
   personal token. The visitor's email goes to AWS, and (the user, 18 Nov 2026) in a notice to NOTIFY_TO through
   Resend; it is never logged here, and the token is never repeated anywhere. */
/* 'activate' (the user, 17 Nov 2026): the magic link's page sends the code from the link here, and this route asks AWS
   to swap the trial token for the full one. The code travels in the link's fragment, so it never reaches a server log
   on the way; only this POST carries it. */
export type SdmPath = 'status' | 'propose' | 'preview' | 'tokens' | 'activate';

/** The consent text's version, sent with every token request and stored by AWS. The server sets it, never the
    browser, so a request cannot claim consent to other wording. A draft until the user approves the wording
    (components/release/GetAccess.tsx); change it whenever the wording changes. */
// export const CONSENT_VERSION = '2026-11-16-draft';
/* The purpose "run and benchmark" (the user, 16 Nov 2026); still a draft until the user approves the whole text here. */
// export const CONSENT_VERSION = '2026-11-16-draft2';
/* "SDM-1 needs no names ...; any names sent are removed" (names optional in the API, 16 Nov 2026). Still a draft. */
// export const CONSENT_VERSION = '2026-11-16-draft3';
/* The formal wording (founder, 16 Nov 2026). Still a draft until approved. */
// export const CONSENT_VERSION = '2026-11-16-draft4';
/* Without "any names submitted are removed before storage" (founder, 16 Nov 2026). Still a draft. */
// export const CONSENT_VERSION = '2026-11-16-draft5';
/* The optional box formal too (founder, 16 Nov 2026). Still a draft. */
// export const CONSENT_VERSION = '2026-11-16-draft6';
/* Without the privacy policy link (founder, 16 Nov 2026). Still a draft. */
// export const CONSENT_VERSION = '2026-11-16-draft7';
/* No cleartext labels instead of "anonymized", and the data protection information in the form (founder, 16 Nov
   2026). Still a draft. */
// export const CONSENT_VERSION = '2026-11-16-draft8';
/* The optional box: contact to explore a collaboration (founder, 16 Nov 2026). Still a draft. */
// export const CONSENT_VERSION = '2026-11-16-draft9';
/* Email confirmation (the user, 17 Nov 2026): the token works 20 times at once, and the consent text now says that a
   confirmation link is emailed and that the full token comes from it. */
export const CONSENT_VERSION = '2026-11-17-draft10';

/** The public limits, as lib/sdm/contract.ts PUBLIC_LIMITS (scripts/check-sdm-proxy.mjs keeps them equal). */
export const LIMITS = { maxParams: 24, maxHistory: 200, maxBatch: 8, maxDesign: 32, maxBodyBytes: 256 * 1024 } as const;

const METHODS = ['sdm-1', 'bayesian-optimisation', 'doe-lhs'];
const GOALS = ['maximize', 'minimize'];
// const UPSTREAM_MS = 26000;
/* The API's deadline went from 25 s to 54 s (16 Nov 2026, the model team): wait 57 s, within the Function's 60 s. */
const UPSTREAM_MS = 57000;
const COOKIE = 'sdm_preview';

const json = (status: number, body: unknown, retryAfter?: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(retryAfter !== undefined ? { 'Retry-After': String(Math.max(1, Math.round(retryAfter))) } : {}),
      ...extra,
    },
  });

const highDemand = (seconds: number, message = 'High demand right now. Please try again in a few minutes.') =>
  json(503, { error: 'high_demand', message, retry_after_s: seconds }, seconds);

const notFound = () => new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });

const on = (v: string | undefined) => v === '1' || v === 'true';

/** Compares without stopping at the first difference. */
function sameSecret(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

function cookie(request: Request, name: string) {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

/** The visitor's address as the host reports it; clients cannot set these on Vercel or Cloudflare. */
function visitorIp(request: Request, env: SdmEnv) {
  const h = request.headers;
  const first = (v: string | null) => v?.split(',')[0]?.trim() || undefined;
  if (env.VERCEL) return first(h.get('x-real-ip')) ?? first(h.get('x-forwarded-for'));
  return first(h.get('cf-connecting-ip')) ?? first(h.get('x-real-ip')) ?? first(h.get('x-forwarded-for'));
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Why a propose body breaks the public limits, or null when it is fine. */
export function invalid(body: unknown): string | null {
  if (!isObject(body)) return 'The request must be a JSON object.';
  const { space, history, batch, goal, method, objectives, noise } = body;
  if (!Array.isArray(space) || space.length === 0) return 'space must be a non-empty list of parameters.';
  if (space.length > LIMITS.maxParams) return `space has more than ${LIMITS.maxParams} parameters.`;
  for (const p of space) {
    if (!isObject(p) || typeof p.name !== 'string' || !p.name) return 'Every parameter needs a name.';
    if (p.type === 'categorical') {
      if (!Array.isArray(p.choices) || p.choices.length === 0 || !p.choices.every((c) => typeof c === 'string'))
        return `Parameter ${p.name}: choices must be a non-empty list of strings.`;
    } else if (p.type === 'continuous' || p.type === 'integer') {
      if (!isNumber(p.low) || !isNumber(p.high) || p.low > p.high) return `Parameter ${p.name}: low and high must be numbers, low <= high.`;
    } else return `Parameter ${String(p.name)}: unknown type.`;
  }
  if (!Array.isArray(history)) return 'history must be a list.';
  if (history.length > LIMITS.maxHistory) return `history has more than ${LIMITS.maxHistory} observations.`;
  for (const o of history) {
    if (!isObject(o) || !isObject(o.params) || !(o.value === null || isNumber(o.value))) return 'Every observation needs params and a numeric or null value.';
  }
  if (method !== undefined && !METHODS.includes(method as string)) return 'Unknown method.';
  const max = method === 'doe-lhs' ? LIMITS.maxDesign : LIMITS.maxBatch;
  if (!Number.isInteger(batch) || (batch as number) < 1 || (batch as number) > max) return `batch must be a whole number from 1 to ${max}.`;
  if (!GOALS.includes(goal as string)) return 'goal must be maximize or minimize.';
  if (objectives !== undefined) {
    if (!Array.isArray(objectives) || objectives.length > LIMITS.maxParams) return 'objectives must be a short list.';
    if (!objectives.every((o) => isObject(o) && typeof o.name === 'string' && GOALS.includes(o.goal as string)))
      return 'Every objective needs a name and a goal.';
  }
  if (noise !== undefined) {
    if (!isNumber(noise) || noise < 0) return 'noise must be a finite number, 0 or more.';
    if (Array.isArray(objectives) && objectives.length > 1) return 'noise applies to one objective only.';
  }
  return null;
}

/** Seconds to wait, from the upstream's Retry-After or body, else the fallback. */
function retrySeconds(response: Response, body: Record<string, unknown> | null, fallback: number) {
  if (body && isNumber(body.retry_after_s) && body.retry_after_s > 0) return body.retry_after_s;
  const header = Number(response.headers.get('Retry-After'));
  return Number.isFinite(header) && header > 0 ? header : fallback;
}

/** The preview cookie, set from ?token=…, then back to the page (a path on this site only). */
function preview(request: Request, env: SdmEnv) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const next = url.searchParams.get('next') ?? '/';
  const target = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  if (!env.SDM_PREVIEW_TOKEN || !sameSecret(token, env.SDM_PREVIEW_TOKEN)) return notFound();
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return new Response(null, {
    status: 303,
    headers: {
      Location: target,
      'Cache-Control': 'no-store',
      'Set-Cookie': `${COOKIE}=${encodeURIComponent(token)}; Path=/api/sdm1; Max-Age=${60 * 60 * 24 * 14}; HttpOnly; SameSite=Lax${secure}`,
    },
  });
}

export async function handleSdm(request: Request, env: SdmEnv, path: SdmPath, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (path === 'preview') return request.method === 'GET' ? preview(request, env) : notFound();

  /* 1. Kill switch. */
  if (on(env.SDM_KILL_SWITCH)) return json(503, { error: 'paused', message: 'The model is paused right now. Please try again later.', retry_after_s: 300 }, 300);

  const development = env.NODE_ENV !== 'production';

  /* 1b. The model routes are not part of a public deployment (the user, 17 Nov 2026, after agent-004's finding): the
     page plays recorded runs, so nothing on it asks the model, while /v1/propose takes no caller token and would let
     anyone draw on this environment's quota with a plain script once the gate is open. Token holders call the API
     directly with their own token. SDM_MODEL_ROUTES=1 brings them back (for a preview that needs the live panel);
     development is unaffected, and 'tokens' and 'preview' are untouched. */
  if (!development && !on(env.SDM_MODEL_ROUTES) && (path === 'propose' || path === 'status')) return notFound();

  /* 2. Draft gate: anonymous callers learn nothing while the page is a draft. */
  if (!development && !on(env.SDM_PUBLIC)) {
    const held = cookie(request, COOKIE);
    if (!held || !env.SDM_PREVIEW_TOKEN || !sameSecret(held, env.SDM_PREVIEW_TOKEN)) return notFound();
  }

  if (path === 'tokens') return tokens(request, env, development, fetchImpl);
  if (path === 'activate') return activate(request, env, development, fetchImpl);

  const method = path === 'status' ? 'GET' : 'POST';
  if (request.method !== method) return json(405, { error: 'method_not_allowed' }, undefined, { Allow: method });

  const base = (env.SDM_API_BASE ?? '').replace(/\/+$/, '');
  const secret = env.SDM_API_SECRET ?? '';
  if (!base || !secret) {
    console.error('sdm1: SDM_API_BASE or SDM_API_SECRET is not set; answering 503.');
    return highDemand(60, 'The model is not available right now. Please try again later.');
  }

  /* 3. The public limits, before anything reaches AWS. */
  let body: string | undefined;
  if (method === 'POST') {
    const declared = Number(request.headers.get('content-length'));
    if (declared > LIMITS.maxBodyBytes) return json(400, { error: 'invalid_request', message: 'The request is too large.' });
    body = await request.text();
    if (new TextEncoder().encode(body).length > LIMITS.maxBodyBytes) return json(400, { error: 'invalid_request', message: 'The request is too large.' });
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return json(400, { error: 'invalid_request', message: 'The request is not valid JSON.' });
    }
    const problem = invalid(parsed);
    if (problem) return json(400, { error: 'invalid_request', message: problem });
  }

  /* 4. Forward, with the secret and the visitor's address. */
  const ip = visitorIp(request, env);
  if (!ip && !development) console.error('sdm1: no visitor IP on the request; AWS will count it under the secret.');
  let upstream: Response;
  try {
    upstream = await fetchImpl(`${base}/v1/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${secret}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(ip ? { 'X-SDM-Client-IP': ip } : {}),
      },
      body,
      signal: AbortSignal.timeout(UPSTREAM_MS),
    });
  } catch {
    return highDemand(10);
  }

  /* 5. AWS's answer in the page's terms. */
  const text = await upstream.text().catch(() => '');
  let parsed: Record<string, unknown> | null = null;
  try {
    const v = JSON.parse(text);
    parsed = isObject(v) ? v : null;
  } catch {
    parsed = null;
  }
  const s = upstream.status;
  if (s >= 200 && s < 300) {
    if (!parsed) return highDemand(10, 'The model could not answer this request.');
    return json(200, parsed);
  }
  if (s === 400) return json(400, { error: 'invalid_request', message: typeof parsed?.message === 'string' ? parsed.message : 'The request was refused.' });
  if (s === 429 && parsed?.error === 'rate_limited') {
    const wait = retrySeconds(upstream, parsed, 30);
    return json(429, { ...parsed, retry_after_s: wait }, wait);
  }
  if (s === 429) return highDemand(retrySeconds(upstream, parsed, 30));
  if (s === 503 && (parsed?.error === 'high_demand' || parsed?.error === 'paused')) {
    const wait = retrySeconds(upstream, parsed, 60);
    return json(503, { ...parsed, retry_after_s: wait }, wait);
  }
  if (s === 401 || s === 403) {
    console.error(`sdm1: ALERT AWS refused this environment's secret (${s}); check SDM_API_SECRET against AWS.`);
    return highDemand(60);
  }
  if (s === 502 || s === 503 || s === 504) return highDemand(10);
  console.error(`sdm1: unexpected status ${s} from AWS.`);
  return highDemand(30);
}

/* ---- Personal tokens (16 Nov 2026) ---- */

const TOKEN_BODY_BYTES = 2048;
const TOKEN_UPSTREAM_MS = 15000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Who hears about a new registration (the user, 18 Nov 2026), through Resend, as the contact form sends its mail
   (lib/contact/handler.ts). RESEND_API_KEY is already set on the Vercel project for that form, so this route needs
   no new secret; SDM_NOTIFY_TO overrides the address without a deploy. */
const NOTIFY_TO = 'dev@provigen.ai';
const NOTIFY_FROM = 'ProviGen website <website@provigen.ai>';
const NOTIFY_MS = 5000;

/** One notice to NOTIFY_TO through Resend. Never a token: an answer carries it once, to the browser that asked, and
    it is not ours to repeat. Awaited, because a Vercel Node Function may be frozen as soon as it answers, so a
    fire-and-forget send is simply lost; a tight timeout and a swallowed failure keep the visitor's own answer
    independent of whether the mail got out. `what` names the notice in the log, never its contents. */
async function sendNotice(
  what: string,
  subject: string,
  lines: string[],
  env: SdmEnv,
  development: boolean,
  fetchImpl: typeof fetch,
): Promise<void> {
  const to = (env.SDM_NOTIFY_TO ?? NOTIFY_TO).trim();
  if (!to) return;
  /* Development sends nothing: a local test of the form would otherwise mail on every attempt. */
  if (development) {
    console.log(`sdm1: a ${what} notice would go to ${to} in production.`);
    return;
  }
  const key = env.RESEND_API_KEY;
  if (!key) {
    console.error(`sdm1: RESEND_API_KEY is not set; the ${what} notice was not sent.`);
    return;
  }
  try {
    const sent = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.SDM_NOTIFY_FROM || NOTIFY_FROM,
        to: to.split(',').map((a) => a.trim()).filter(Boolean),
        subject,
        text: [...lines, '', '--', 'Sent by the SDM-1 access flow on provigen.ai'].join('\n'),
      }),
      signal: AbortSignal.timeout(NOTIFY_MS),
    });
    /* No address is repeated into the log on failure; the mail is the only place it belongs. */
    if (!sent.ok) console.error(`sdm1: Resend answered ${sent.status} on the ${what} notice.`);
  } catch (error) {
    console.error(`sdm1: the ${what} notice could not be sent:`, error instanceof Error ? error.message : error);
  }
}

/** Someone asked for a token (the user, 18 Nov 2026). */
const notifyRegistration = (email: string, tier: string, contactOptIn: boolean, env: SdmEnv, development: boolean, fetchImpl: typeof fetch) =>
  sendNotice(
    'registration',
    `ProviGen · new API token · ${email}`,
    [
      'Someone asked for an SDM-1 API token.',
      '',
      `Address:   ${email}`,
      `Tier:      ${tier}`,
      `Contact opt-in: ${contactOptIn ? 'yes' : 'no'}`,
      `Time:      ${new Date().toISOString()}`,
      '',
      'The token itself is not included: it is shown once, in the browser that asked.',
    ],
    env,
    development,
    fetchImpl,
  );

/** Someone clicked their confirmation link and now holds a full token (the user, 18 Nov 2026).
    The address is named only when AWS reports it: the browser sends an opaque code, so this route cannot know
    whose link it was. The field is read if it is there and the notice stays correct when it is not. */
const notifyActivation = (email: string | null, daily: number, total: number, env: SdmEnv, development: boolean, fetchImpl: typeof fetch) =>
  sendNotice(
    'activation',
    email ? `ProviGen · token activated · ${email}` : 'ProviGen · token activated',
    [
      'A confirmation link was opened; the trial token is now a full one.',
      '',
      `Address:   ${email ?? 'not reported by the API for an activation'}`,
      `Limits:    ${daily} calls a day, ${total} in total`,
      `Time:      ${new Date().toISOString()}`,
      '',
      'The token itself is not included: it is shown once, in the browser that opened the link.',
    ],
    env,
    development,
    fetchImpl,
  );

/** The token request from the page's form: {email, consent: true, contact_opt_in}, or why it is refused. */
export function tokenRequest(body: unknown): { email: string; contact_opt_in: boolean } | string {
  if (!isObject(body)) return 'The request must be a JSON object.';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || email.length > 254 || !EMAIL.test(email)) return 'Please enter a valid email address.';
  if (body.consent !== true) return 'Please accept the terms of use to get a token.';
  if (body.contact_opt_in !== undefined && typeof body.contact_opt_in !== 'boolean') return 'contact_opt_in must be true or false.';
  return { email, contact_opt_in: body.contact_opt_in === true };
}

/** POST /api/sdm1/v1/tokens: checked here, forwarded to AWS POST /v1/tokens with the secret and the visitor's IP. The
    answer carries the token once; nothing here stores or logs the email or the token. On success the address goes out
    once more, in the notice to NOTIFY_TO (notifyRegistration). */
async function tokens(request: Request, env: SdmEnv, development: boolean, fetchImpl: typeof fetch): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' }, undefined, { Allow: 'POST' });
  const declared = Number(request.headers.get('content-length'));
  if (declared > TOKEN_BODY_BYTES) return json(400, { error: 'invalid_request', message: 'The request is too large.' });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > TOKEN_BODY_BYTES) return json(400, { error: 'invalid_request', message: 'The request is too large.' });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json(400, { error: 'invalid_request', message: 'The request is not valid JSON.' });
  }
  const checked = tokenRequest(parsed);
  if (typeof checked === 'string') return json(400, { error: 'invalid_request', message: checked });

  /* Checked first, so a bad form answers 400 even where the route is not configured. */
  const base = (env.SDM_API_BASE ?? '').replace(/\/+$/, '');
  const secret = env.SDM_API_SECRET ?? '';
  if (!base || !secret) {
    console.error('sdm1: SDM_API_BASE or SDM_API_SECRET is not set; answering 503.');
    return highDemand(60, 'Access is not available right now. Please try again later.');
  }

  const ip = visitorIp(request, env);
  if (!ip && !development) console.error('sdm1: no visitor IP on a token request.');
  let upstream: Response;
  try {
    upstream = await fetchImpl(`${base}/v1/tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', ...(ip ? { 'X-SDM-Client-IP': ip } : {}) },
      body: JSON.stringify({ email: checked.email, consent_version: CONSENT_VERSION, contact_opt_in: checked.contact_opt_in }),
      signal: AbortSignal.timeout(TOKEN_UPSTREAM_MS),
    });
  } catch {
    return highDemand(10, 'Access is not available right now. Please try again in a few minutes.');
  }
  const text = await upstream.text().catch(() => '');
  let body: Record<string, unknown> | null = null;
  try {
    const v = JSON.parse(text);
    body = isObject(v) ? v : null;
  } catch {
    body = null;
  }
  const s = upstream.status;
  /* Only the fields the page shows, so nothing else AWS might add reaches the browser. A trial token (the user,
     17 Nov 2026) works at once for `trial_calls` calls; the confirmation link turns it into the full one. */
  if (s === 201 && typeof body?.token === 'string' && body.token.startsWith('sdm1_')) {
    /* The user hears about every registration (18 Nov 2026). After the token is in hand, so that a Resend outage
       costs the visitor nothing but a few seconds; notifyRegistration never throws. */
    await notifyRegistration(checked.email, body.tier === 'full' ? 'full' : 'trial', checked.contact_opt_in, env, development, fetchImpl);
    return json(201, {
      token: body.token,
      tier: body.tier === 'full' ? 'full' : 'trial',
      trial_calls: isNumber(body.trial_calls) ? body.trial_calls : 20,
      ...(isNumber(body.daily_limit) ? { daily_limit: body.daily_limit } : {}),
      ...(isNumber(body.total_limit) ? { total_limit: body.total_limit } : {}),
    });
  }
  /* The 409 for an address that already had a token is gone (the user, 17 Nov 2026): every accepted request gets the
     same answer, so the form says nothing about which addresses are known. Was:
  if (s === 409 && body?.error === 'already_issued')
    return json(409, { error: 'already_issued', message: 'A token was already issued to this address. If you lost it, please contact us.' }); */
  if (s === 400) return json(400, { error: 'invalid_request', message: typeof body?.message === 'string' ? body.message : 'The request was refused.' });
  if (s === 429 && body?.error === 'rate_limited') {
    const wait = retrySeconds(upstream, body, 3600);
    return json(429, { error: 'rate_limited', message: 'Too many tokens were requested from this network. Please try again later.', retry_after_s: wait }, wait);
  }
  if (s === 503 && body?.error === 'paused') {
    const wait = retrySeconds(upstream, body, 300);
    return json(503, { error: 'paused', message: 'Access is paused right now. Please try again later.', retry_after_s: wait }, wait);
  }
  /* An address refused by hand (agent-002, 17 Nov 2026: 403 forbidden); anything else with 401 or 403 is this
     environment's secret being refused, which is an alert, not a message for the visitor. */
  if (s === 403 && body?.error === 'forbidden')
    return json(403, { error: 'forbidden', message: 'A token cannot be issued to this address. Please write to contact@provigen.ai.' });
  if (s === 401 || s === 403) {
    console.error(`sdm1: ALERT AWS refused this environment's secret on /v1/tokens (${s}); check SDM_API_SECRET against AWS.`);
    return highDemand(60, 'Access is not available right now. Please try again later.');
  }
  console.error(`sdm1: unexpected status ${s} from AWS /v1/tokens.`);
  return highDemand(s === 429 ? retrySeconds(upstream, body, 30) : 30, 'Access is not available right now. Please try again in a few minutes.');
}

/** The activation code from the link's fragment: a short opaque string, or why it is refused. */
export function activateRequest(body: unknown): string | { error: string } {
  if (!isObject(body)) return { error: 'The request must be a JSON object.' };
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code || code.length > 256 || !/^[A-Za-z0-9._~-]+$/.test(code)) return { error: 'This activation link is not valid.' };
  return code;
}

/** POST /api/sdm1/v1/activate: the activation page's click, forwarded to AWS POST /v1/tokens/activate with the secret
    and the visitor's IP. The full token comes back once; nothing here stores or logs the code or the token. */
async function activate(request: Request, env: SdmEnv, development: boolean, fetchImpl: typeof fetch): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' }, undefined, { Allow: 'POST' });
  const declared = Number(request.headers.get('content-length'));
  if (declared > TOKEN_BODY_BYTES) return json(400, { error: 'invalid_request', message: 'The request is too large.' });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > TOKEN_BODY_BYTES) return json(400, { error: 'invalid_request', message: 'The request is too large.' });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json(400, { error: 'invalid_request', message: 'The request is not valid JSON.' });
  }
  const checked = activateRequest(parsed);
  if (typeof checked !== 'string') return json(400, { error: 'invalid_request', message: checked.error });

  const base = (env.SDM_API_BASE ?? '').replace(/\/+$/, '');
  const secret = env.SDM_API_SECRET ?? '';
  if (!base || !secret) {
    console.error('sdm1: SDM_API_BASE or SDM_API_SECRET is not set; answering 503.');
    return highDemand(60, 'Activation is not available right now. Please try again later.');
  }

  const ip = visitorIp(request, env);
  if (!ip && !development) console.error('sdm1: no visitor IP on an activation.');
  let upstream: Response;
  try {
    upstream = await fetchImpl(`${base}/v1/tokens/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', ...(ip ? { 'X-SDM-Client-IP': ip } : {}) },
      body: JSON.stringify({ code: checked }),
      signal: AbortSignal.timeout(TOKEN_UPSTREAM_MS),
    });
  } catch {
    return highDemand(10, 'Activation is not available right now. Please try again in a few minutes.');
  }
  const text = await upstream.text().catch(() => '');
  let body: Record<string, unknown> | null = null;
  try {
    const v = JSON.parse(text);
    body = isObject(v) ? v : null;
  } catch {
    body = null;
  }
  const s = upstream.status;
  /* Only the fields the page shows, so nothing else AWS might add reaches the browser. */
  if (s === 200 && typeof body?.token === 'string' && body.token.startsWith('sdm1_')) {
    const daily = isNumber(body.daily_limit) ? body.daily_limit : 50;
    const total = isNumber(body.total_limit) ? body.total_limit : 500;
    /* The user hears about every activation (18 Nov 2026). `email` is used for the notice only, and deliberately
       not passed on below: the page has no use for it, and the browser already knows the address it typed. */
    const who = typeof body.email === 'string' && EMAIL.test(body.email) ? body.email : null;
    await notifyActivation(who, daily, total, env, development, fetchImpl);
    return json(200, { token: body.token, tier: 'full', daily_limit: daily, total_limit: total });
  }
  if (s === 410 || (s === 404 && body?.error === 'link_expired'))
    return json(410, { error: 'link_expired', message: 'This link has been used already or has expired. Please ask for a new one.' });
  if (s === 400) return json(400, { error: 'invalid_request', message: 'This activation link is not valid.' });
  if (s === 429 && body?.error === 'rate_limited') {
    const wait = retrySeconds(upstream, body, 3600);
    return json(429, { error: 'rate_limited', message: 'Too many activations from this network. Please try again later.', retry_after_s: wait }, wait);
  }
  if (s === 503 && body?.error === 'paused') {
    const wait = retrySeconds(upstream, body, 300);
    return json(503, { error: 'paused', message: 'Activation is paused right now. Please try again later.', retry_after_s: wait }, wait);
  }
  if (s === 401 || s === 403) {
    console.error(`sdm1: ALERT AWS refused this environment's secret on /v1/tokens/activate (${s}); check SDM_API_SECRET against AWS.`);
    return highDemand(60, 'Activation is not available right now. Please try again later.');
  }
  console.error(`sdm1: unexpected status ${s} from AWS /v1/tokens/activate.`);
  return highDemand(60, 'Activation is not available right now. Please try again later.');
}
