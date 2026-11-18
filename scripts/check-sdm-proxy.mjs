// Tests for the SDM-1 route (lib/sdm/proxy.ts) against a fake AWS: no network.
// usage: npm run check:sdm
// Covers the kill switch, the draft gate, the public limits (and that they
// equal lib/sdm/contract.ts PUBLIC_LIMITS), forwarding (secret, visitor IP,
// timeout), the status mapping agreed with agent-002, and that the secret
// never appears in an answer.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const bundle = await build({
  stdin: {
    contents: `export * from './lib/sdm/proxy.ts'; export { PUBLIC_LIMITS } from './lib/sdm/contract.ts';`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'error',
});
const lib = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);

const SECRET = 'test-secret-do-not-leak';
// SDM_MODEL_ROUTES: the model routes are off in production since 17 Nov 2026 (the user; see proxy.ts step 1b), so the
// checks of the forwarding path ask for them explicitly. The checks that they are off by default are their own below.
const ENV = { NODE_ENV: 'production', VERCEL: '1', SDM_API_BASE: 'https://aws.example/live/', SDM_API_SECRET: SECRET, SDM_PREVIEW_TOKEN: 'preview-token', SDM_MODEL_ROUTES: '1' };
const GOOD = { space: [{ name: 'a', type: 'continuous', low: 0, high: 1 }], history: [{ params: { a: 0.5 }, value: 1 }], batch: 1, goal: 'maximize', method: 'sdm-1' };

let failed = 0;
let passed = 0;
const check = (name, ok, detail = '') => {
  if (ok) passed += 1;
  else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? `: ${detail}` : ''}`);
  }
};

/** A fake AWS: records what it was sent, answers as told. */
function aws(answer) {
  const seen = [];
  const fetchImpl = async (url, init) => {
    seen.push({ url, init });
    if (answer === 'throw') throw new Error('network');
    return typeof answer === 'function' ? answer() : answer;
  };
  return { seen, fetchImpl };
}
const res = (status, body, headers = {}) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const post = (body = GOOD, { cookie = 'sdm_preview=preview-token', ip = '203.0.113.7', raw } = {}) =>
  new Request('https://provigen.ai/api/sdm1/v1/propose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(ip ? { 'x-real-ip': ip, 'x-forwarded-for': `${ip}, 10.0.0.1` } : {}) },
    body: raw ?? JSON.stringify(body),
  });

async function call(request, env, answer, path = 'propose') {
  const fake = aws(answer);
  const response = await lib.handleSdm(request, env, path, fake.fetchImpl);
  const text = await response.text();
  check(`no secret in answer (${path} ${response.status})`, !text.includes(SECRET) && ![...response.headers.values()].some((v) => v.includes(SECRET)));
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {}
  return { response, body, seen: fake.seen };
}

// Limits match the contract.
for (const k of ['maxParams', 'maxHistory', 'maxBatch', 'maxDesign'])
  check(`LIMITS.${k} equals PUBLIC_LIMITS.${k}`, lib.LIMITS[k] === lib.PUBLIC_LIMITS[k], `${lib.LIMITS[k]} vs ${lib.PUBLIC_LIMITS[k]}`);

// 1. Kill switch: 503 paused, AWS never called.
{
  const { response, body, seen } = await call(post(), { ...ENV, SDM_KILL_SWITCH: '1' }, res(200, { proposals: [] }));
  check('kill switch answers 503 paused', response.status === 503 && body?.error === 'paused' && response.headers.get('Retry-After'));
  check('kill switch does not call AWS', seen.length === 0);
}

// 2. Draft gate.
{
  const { response, seen } = await call(post(GOOD, { cookie: null }), ENV, res(200, { proposals: [] }));
  check('no cookie: 404, AWS not called', response.status === 404 && seen.length === 0);
  const wrong = await call(post(GOOD, { cookie: 'sdm_preview=nope' }), ENV, res(200, { proposals: [] }));
  check('wrong cookie: 404', wrong.response.status === 404 && wrong.seen.length === 0);
  const noToken = await call(post(), { ...ENV, SDM_PREVIEW_TOKEN: undefined }, res(200, { proposals: [] }));
  check('no token configured: closed (404)', noToken.response.status === 404);
  const open = await call(post(GOOD, { cookie: null }), { ...ENV, SDM_PUBLIC: '1' }, res(200, { proposals: [], model: 'sdm-1', version: 'x' }));
  check('SDM_PUBLIC=1 opens the gate', open.response.status === 200);
  const dev = await call(post(GOOD, { cookie: null }), { ...ENV, NODE_ENV: 'development' }, res(200, { proposals: [], model: 'sdm-1', version: 'x' }));
  check('development is open', dev.response.status === 200);
}

// The model routes are not part of a production deployment (the user, 17 Nov 2026): propose and status answer 404
// without SDM_MODEL_ROUTES, even with the gate open, and nothing reaches AWS; development is unaffected.
{
  const off = { ...ENV, SDM_MODEL_ROUTES: undefined, SDM_PUBLIC: '1' };
  const p = await call(post(GOOD, { cookie: null }), off, res(200, { proposals: [], model: 'sdm-1', version: 'x' }));
  check('propose: 404 in production, AWS not called', p.response.status === 404 && p.seen.length === 0);
  const st = await call(new Request('https://provigen.ai/api/sdm1/v1/status'), off, res(200, { state: 'ok' }), 'status');
  check('status: 404 in production, AWS not called', st.response.status === 404 && st.seen.length === 0);
  const dev2 = await call(post(GOOD, { cookie: null }), { ...off, NODE_ENV: 'development' }, res(200, { proposals: [], model: 'sdm-1', version: 'x' }));
  check('propose: still open in development', dev2.response.status === 200);
}

// Preview cookie route.
{
  const ok = await lib.handleSdm(new Request('https://provigen.ai/api/sdm1/preview?token=preview-token&next=/writings/introducing-model-name'), ENV, 'preview');
  check(
    'preview sets an HttpOnly, Secure cookie scoped to /api/sdm1 and redirects back',
    ok.status === 303 &&
      ok.headers.get('Location') === '/writings/introducing-model-name' &&
      /sdm_preview=preview-token; Path=\/api\/sdm1;.*HttpOnly; SameSite=Lax; Secure/.test(ok.headers.get('Set-Cookie') ?? ''),
    ok.headers.get('Set-Cookie') ?? '',
  );
  const bad = await lib.handleSdm(new Request('https://provigen.ai/api/sdm1/preview?token=wrong'), ENV, 'preview');
  check('preview with a wrong token: 404, no cookie', bad.status === 404 && !bad.headers.get('Set-Cookie'));
  const away = await lib.handleSdm(new Request('https://provigen.ai/api/sdm1/preview?token=preview-token&next=//evil.example'), ENV, 'preview');
  check('preview never redirects off the site', away.headers.get('Location') === '/');
}

// 3. Limits: rejected before AWS.
const tooMany = { ...GOOD, space: Array.from({ length: 25 }, (_, i) => ({ name: `p${i}`, type: 'continuous', low: 0, high: 1 })) };
const cases = [
  { name: '25 parameters', body: tooMany },
  { name: '201 observations', body: { ...GOOD, history: Array.from({ length: 201 }, () => ({ params: { a: 0.1 }, value: 1 })) } },
  { name: 'batch 9 for sdm-1', body: { ...GOOD, batch: 9 } },
  { name: 'batch 33 for doe-lhs', body: { ...GOOD, method: 'doe-lhs', history: [], batch: 33 } },
  { name: 'unknown method', body: { ...GOOD, method: 'gpt' } },
  { name: 'bad goal', body: { ...GOOD, goal: 'up' } },
  { name: 'missing space', body: { ...GOOD, space: [] } },
  { name: 'negative noise', body: { ...GOOD, noise: -0.1 } },
  { name: 'noise as text', body: { ...GOOD, noise: '0.1' } },
  { name: 'noise with two objectives', body: { ...GOOD, noise: 0.1, objectives: [{ name: 'a', goal: 'maximize' }, { name: 'b', goal: 'minimize' }] } },
];
for (const { name, body } of cases) {
  const { response, body: answer, seen } = await call(post(body), ENV, res(200, { proposals: [] }));
  check(`400 for ${name}, AWS not called`, response.status === 400 && answer?.error === 'invalid_request' && seen.length === 0, `${response.status}`);
}
{
  const { response, seen } = await call(post(null, { raw: '{not json' }), ENV, res(200, {}));
  check('400 for invalid JSON', response.status === 400 && seen.length === 0);
  const big = await call(post(null, { raw: JSON.stringify({ ...GOOD, pad: 'x'.repeat(300 * 1024) }) }), ENV, res(200, {}));
  check('400 for a body over 256 KB', big.response.status === 400 && big.seen.length === 0);
  const design = await call(post({ ...GOOD, method: 'doe-lhs', history: [], batch: 32 }), ENV, res(200, { proposals: [], model: 'lhs', version: '1' }));
  check('doe-lhs batch 32 is allowed', design.response.status === 200);
  const atLimit = await call(post({ ...GOOD, batch: 8 }), ENV, res(200, { proposals: [], model: 'sdm-1', version: '1' }));
  check('sdm-1 batch 8 is allowed', atLimit.response.status === 200);
  const noisy = await call(post({ ...GOOD, noise: 0.05 }), ENV, res(200, { proposals: [], model: 'sdm-1', version: '1' }));
  check('noise 0.05 is allowed and forwarded', noisy.response.status === 200 && JSON.parse(noisy.seen[0].init.body).noise === 0.05);
  const exact = await call(post({ ...GOOD, noise: 0, objectives: [{ name: 'a', goal: 'maximize' }] }), ENV, res(200, { proposals: [], model: 'sdm-1', version: '1' }));
  check('noise 0 with one objective is allowed', exact.response.status === 200);
}

// 4. Forwarding.
{
  const { response, seen } = await call(post(), ENV, res(200, { proposals: [{ params: { a: 0.3 } }], model: 'sdm-1', version: '7' }));
  const sent = seen[0];
  check('forwards to SDM_API_BASE/v1/propose', sent?.url === 'https://aws.example/live/v1/propose', sent?.url);
  check('sends the secret as Bearer', sent?.init.headers.Authorization === `Bearer ${SECRET}`);
  check('sends the visitor IP (x-real-ip on Vercel)', sent?.init.headers['X-SDM-Client-IP'] === '203.0.113.7');
  check('forwards the body unchanged', sent?.init.body === JSON.stringify(GOOD));
  check('sets an upstream timeout', sent?.init.signal instanceof AbortSignal);
  check('200 passes through', response.status === 200 && response.headers.get('Cache-Control') === 'no-store');
  const cf = await call(post(GOOD, { ip: null }), { ...ENV, VERCEL: undefined }, res(200, { proposals: [], model: 'm', version: 'v' }));
  check('no IP header: none forwarded', cf.seen[0] && !('X-SDM-Client-IP' in cf.seen[0].init.headers));
  const status = await call(new Request('https://provigen.ai/api/sdm1/v1/status', { headers: { cookie: 'sdm_preview=preview-token', 'x-real-ip': '198.51.100.2' } }), ENV, res(200, { state: 'ok' }), 'status');
  check('status forwards GET /v1/status', status.response.status === 200 && status.seen[0]?.url === 'https://aws.example/live/v1/status' && status.seen[0]?.init.method === 'GET');
  const wrongMethod = await call(new Request('https://provigen.ai/api/sdm1/v1/propose', { headers: { cookie: 'sdm_preview=preview-token' } }), ENV, res(200, {}));
  check('GET on propose: 405', wrongMethod.response.status === 405 && wrongMethod.seen.length === 0);
  const unset = await call(post(), { ...ENV, SDM_API_SECRET: undefined }, res(200, {}));
  check('no secret configured: 503, AWS not called', unset.response.status === 503 && unset.seen.length === 0);
}

/* 4b. No header but X-SDM-Client-IP may carry the visitor's address (the user, 18 Nov 2026). The privacy policy
   states that the firewall's blocked-request log cannot hold a website visitor's own address: the API's log keeps
   every header it is sent except the redacted ones, so that claim is only true while this route builds its outgoing
   headers from scratch instead of passing the browser's along. Spreading the incoming headers into one of the
   fetches below would make a published policy false, which a test should catch rather than a reader. */
{
  const VISITOR = '198.51.100.23';
  /* Every address-bearing header a proxy might plausibly forward, plus two that should not travel either. */
  const leaky = {
    'x-real-ip': VISITOR,
    'x-forwarded-for': `${VISITOR}, 10.0.0.1`,
    forwarded: `for=${VISITOR};proto=https`,
    'cf-connecting-ip': VISITOR,
    'true-client-ip': VISITOR,
    'x-vercel-forwarded-for': VISITOR,
    'x-forwarded-host': 'provigen.ai',
    referer: 'https://provigen.ai/blog/introducing-sdm-1',
  };
  const allowed = ['authorization', 'content-type', 'x-sdm-client-ip'];
  const routes = [
    ['propose', 'https://provigen.ai/api/sdm1/v1/propose', 'POST', JSON.stringify(GOOD)],
    ['status', 'https://provigen.ai/api/sdm1/v1/status', 'GET', undefined],
    ['tokens', 'https://provigen.ai/api/sdm1/v1/tokens', 'POST', JSON.stringify({ email: 'probe@example.org', consent: true })],
    ['activate', 'https://provigen.ai/api/sdm1/v1/activate', 'POST', JSON.stringify({ code: 'abc123' })],
  ];
  for (const [path, url, method, body] of routes) {
    const request = new Request(url, {
      method,
      headers: { 'Content-Type': 'application/json', cookie: 'sdm_preview=preview-token; other=value', ...leaky },
      body,
    });
    const r = await call(request, ENV, res(200, { proposals: [], model: 'sdm-1', version: '1', token: 'sdm1_x', tier: 'trial' }), path);
    const headers = r.seen[0]?.init.headers ?? {};
    const names = Object.keys(headers).map((h) => h.toLowerCase());
    check(`${path}: sends no header beyond the secret, the type and the visitor address`, names.every((n) => allowed.includes(n)), names.join(', '));
    const carrying = Object.entries(headers).filter(([, v]) => String(v).includes(VISITOR)).map(([k]) => k.toLowerCase());
    check(`${path}: only X-SDM-Client-IP carries the visitor address`, carrying.length === 1 && carrying[0] === 'x-sdm-client-ip', carrying.join(', '));
    check(`${path}: the preview cookie does not travel to AWS`, !JSON.stringify(headers).includes('sdm_preview'));
  }
}

// 5. Mapping AWS's answers.
const mapping = [
  ['400 passes through with its message', res(400, { error: 'invalid_request', message: 'batch above 8' }), 400, 'invalid_request', null],
  ['429 rate_limited passes through', res(429, { error: 'rate_limited', message: 'slow down', retry_after_s: 12 }, { 'Retry-After': '12' }), 429, 'rate_limited', 12],
  ['gateway 429 becomes 503 high_demand', res(429, { message: 'Too Many Requests' }, { 'Retry-After': '7' }), 503, 'high_demand', 7],
  ['503 high_demand passes through', res(503, { error: 'high_demand', retry_after_s: 20 }), 503, 'high_demand', 20],
  ['503 paused passes through', res(503, { error: 'paused', message: 'paused' }, { 'Retry-After': '600' }), 503, 'paused', 600],
  ['403 becomes 503 high_demand', res(403, { message: 'Forbidden' }), 503, 'high_demand', 60],
  ['401 (no Authorization at the gateway) becomes 503 high_demand', res(401, { message: 'Unauthorized' }), 503, 'high_demand', 60],
  ['504 becomes 503, retry 10', res(504, 'timeout'), 503, 'high_demand', 10],
  ['network error becomes 503, retry 10', 'throw', 503, 'high_demand', 10],
  ['unexpected 500 becomes 503', res(500, { error: 'boom' }), 503, 'high_demand', 30],
  ['200 that is not JSON becomes 503', res(200, 'oops'), 503, 'high_demand', 10],
];
const quiet = console.error;
console.error = () => {};
for (const [name, answer, status, error, retry] of mapping) {
  const { response, body } = await call(post(), ENV, answer);
  const header = response.headers.get('Retry-After');
  check(
    name,
    response.status === status && body?.error === error && (retry === null || (Number(header) === retry && body?.retry_after_s === retry)),
    `${response.status} ${body?.error} Retry-After ${header} retry_after_s ${body?.retry_after_s}`,
  );
}
console.error = quiet;

// 5b. Personal tokens (16 Nov 2026): POST /v1/tokens.
{
  const EMAIL = 'someone@example.org';
  const tok = (body, { cookie = 'sdm_preview=preview-token', ip = '203.0.113.9' } = {}) =>
    new Request('https://provigen.ai/api/sdm1/v1/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(ip ? { 'x-real-ip': ip } : {}) },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  /* A factory, not one Response: a body reads only once, and several checks below share this answer. */
  const issued = () => res(201, { token: 'sdm1_abc', tier: 'trial', trial_calls: 20, extra: 'not for the browser' });
  const ok = await call(tok({ email: ` ${EMAIL} `, consent: true, contact_opt_in: true }), ENV, issued, 'tokens');
  const sent = ok.seen[0];
  const sentBody = sent ? JSON.parse(sent.init.body) : {};
  check('tokens: forwards to SDM_API_BASE/v1/tokens', sent?.url === 'https://aws.example/live/v1/tokens' && sent?.init.method === 'POST', sent?.url);
  check('tokens: secret as Bearer, visitor IP', sent?.init.headers.Authorization === `Bearer ${SECRET}` && sent?.init.headers['X-SDM-Client-IP'] === '203.0.113.9');
  check('tokens: body is email (trimmed), the server\'s consent version, opt-in', sentBody.email === EMAIL && sentBody.consent_version === lib.CONSENT_VERSION && sentBody.contact_opt_in === true && Object.keys(sentBody).length === 3, JSON.stringify(sentBody));
  check('tokens: 201 passes only the token and its tier, no-store', ok.response.status === 201 && ok.body?.token === 'sdm1_abc' && ok.body?.tier === 'trial' && ok.body?.trial_calls === 20 && !('extra' in ok.body) && ok.response.headers.get('Cache-Control') === 'no-store');
  const optOut = await call(tok({ email: EMAIL, consent: true }), ENV, issued, 'tokens');
  check('tokens: opt-in defaults to false', JSON.parse(optOut.seen[0].init.body).contact_opt_in === false);
  const forged = await call(tok({ email: EMAIL, consent: true, consent_version: 'other' }), ENV, issued, 'tokens');
  check('tokens: a consent_version from the browser is ignored', JSON.parse(forged.seen[0].init.body).consent_version === lib.CONSENT_VERSION);
  for (const [name, body] of [
    ['no consent', { email: EMAIL }],
    ['consent not true', { email: EMAIL, consent: 'yes' }],
    ['bad email', { email: 'not-an-email', consent: true }],
    ['opt-in not boolean', { email: EMAIL, consent: true, contact_opt_in: 'yes' }],
    ['not JSON', '{'],
    ['too large', { email: EMAIL, consent: true, pad: 'x'.repeat(3000) }],
  ]) {
    const r = await call(tok(body), ENV, issued, 'tokens');
    check(`tokens: ${name}: 400, AWS not called`, r.response.status === 400 && r.body?.error === 'invalid_request' && r.seen.length === 0);
  }
  const anon = await call(tok({ email: EMAIL, consent: true }, { cookie: null }), ENV, issued, 'tokens');
  check('tokens: draft gate closed: 404, AWS not called', anon.response.status === 404 && anon.seen.length === 0);
  const killed = await call(tok({ email: EMAIL, consent: true }), { ...ENV, SDM_KILL_SWITCH: '1' }, issued, 'tokens');
  check('tokens: kill switch: 503 paused, AWS not called', killed.response.status === 503 && killed.seen.length === 0);
  const get = await call(new Request('https://provigen.ai/api/sdm1/v1/tokens', { headers: { cookie: 'sdm_preview=preview-token' } }), ENV, issued, 'tokens');
  check('tokens: GET is 405', get.response.status === 405 && get.seen.length === 0);
  const quiet2 = console.error;
  console.error = () => {};
  const tokenMapping = [
    ['400 passes as invalid_request', res(400, { error: 'invalid_request', message: 'bad email' }), 400, 'invalid_request'],
    ['403 forbidden reaches the visitor', res(403, { error: 'forbidden' }), 403, 'forbidden'],
    ['429 rate_limited passes with Retry-After', res(429, { error: 'rate_limited', retry_after_s: 1200 }), 429, 'rate_limited'],
    ['gateway 429 becomes 503', res(429, { message: 'Too Many Requests' }), 503, 'high_demand'],
    ['503 paused passes', res(503, { error: 'paused' }), 503, 'paused'],
    ['403 becomes 503', res(403, {}), 503, 'high_demand'],
    ['201 without an sdm1_ token becomes 503', res(201, { token: 'xyz' }), 503, 'high_demand'],
    ['network error becomes 503', 'throw', 503, 'high_demand'],
  ];
  for (const [name, answer, status, error] of tokenMapping) {
    const r = await call(tok({ email: EMAIL, consent: true }), ENV, answer, 'tokens');
    check(`tokens: ${name}`, r.response.status === status && r.body?.error === error && !JSON.stringify(r.body).includes('sdm1_should_not_pass'), `${r.response.status} ${r.body?.error}`);
  }
  const limited = await call(tok({ email: EMAIL, consent: true }), ENV, res(429, { error: 'rate_limited', retry_after_s: 1200 }), 'tokens');
  check('tokens: 429 carries Retry-After', limited.response.headers.get('Retry-After') === '1200');
  const logged = [];
  console.error = (...a) => logged.push(a.join(' '));
  await call(tok({ email: EMAIL, consent: true }), ENV, res(500, { token: 'sdm1_leak' }), 'tokens');
  await call(tok({ email: EMAIL, consent: true }), ENV, res(403, {}), 'tokens');
  console.error = quiet2;
  check('tokens: nothing logged contains the email or a token', !logged.some((l) => l.includes(EMAIL) || l.includes('sdm1_')), logged.join(' | '));
}


/* 5b-ii. The registration notice (the user, 18 Nov 2026): a new token is mailed to SDM_NOTIFY_TO through Resend.
   Its own fake, because this path now calls two hosts: AWS, then Resend. */
{
  const EMAIL = 'someone@example.org';
  const NOTIFY_ENV = { ...ENV, RESEND_API_KEY: 'resend-key-do-not-leak', SDM_NOTIFY_TO: 'dev@provigen.ai' };
  const tok = (body) =>
    new Request('https://provigen.ai/api/sdm1/v1/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: 'sdm_preview=preview-token', 'x-real-ip': '203.0.113.9' },
      body: JSON.stringify(body),
    });
  /** AWS answers `aws`, api.resend.com answers `resend` (or throws when 'throw'). Each answer is a function, because
      a Response body reads only once and these fakes serve several calls. */
  const hosts = (awsAnswer, resendAnswer) => {
    const seen = [];
    return {
      seen,
      fetchImpl: async (url, init) => {
        seen.push({ url, init });
        const answer = String(url).includes('api.resend.com') ? resendAnswer : awsAnswer;
        if (answer === 'throw') throw new Error('network');
        return typeof answer === 'function' ? answer() : answer;
      },
    };
  };
  const issued = () => res(201, { token: 'sdm1_abc', tier: 'trial', trial_calls: 20 });
  const mailed = () => res(200, { id: 'mail-1' });
  const quiet3 = console.error;
  console.error = () => {};

  const fake = hosts(issued, mailed);
  const response = await lib.handleSdm(tok({ email: ` ${EMAIL} `, consent: true, contact_opt_in: true }), NOTIFY_ENV, 'tokens', fake.fetchImpl);
  const body = await response.json();
  const mail = fake.seen.find((c) => String(c.url).includes('api.resend.com'));
  const sent = mail ? JSON.parse(mail.init.body) : {};
  check('notice: the token still answers 201', response.status === 201 && body.token === 'sdm1_abc');
  check('notice: Resend is called once, after AWS', fake.seen.length === 2 && String(fake.seen[0].url).includes('aws.example') && !!mail);
  check('notice: goes to SDM_NOTIFY_TO', Array.isArray(sent.to) && sent.to.length === 1 && sent.to[0] === 'dev@provigen.ai', JSON.stringify(sent.to));
  check('notice: names the address in the subject and the body', sent.subject === `ProviGen · new API token · ${EMAIL}` && sent.text.includes(`Address:   ${EMAIL}`), sent.subject);
  check('notice: the trimmed address, not the raw one', sent.text.includes(`Address:   ${EMAIL}\n`) && !sent.text.includes(` ${EMAIL} `));
  check('notice: reports the tier and the opt-in', sent.text.includes('Tier:      trial') && sent.text.includes('Contact opt-in: yes'));
  check('notice: never carries the token', !JSON.stringify(sent).includes('sdm1_abc'));
  check('notice: the Resend key is the Bearer, and is not in the answer', mail?.init.headers.authorization === 'Bearer resend-key-do-not-leak' && !JSON.stringify(body).includes('resend-key'));

  const optOut = hosts(issued, mailed);
  await lib.handleSdm(tok({ email: EMAIL, consent: true }), NOTIFY_ENV, 'tokens', optOut.fetchImpl);
  const optOutMail = JSON.parse(optOut.seen.find((c) => String(c.url).includes('api.resend.com')).init.body);
  check('notice: an opt-out is reported as no', optOutMail.text.includes('Contact opt-in: no'));

  /* The visitor's token must not depend on the mail getting out. */
  for (const { name, answer } of [
    { name: 'Resend refuses', answer: () => res(422, { message: 'no' }) },
    { name: 'Resend is unreachable', answer: 'throw' },
  ]) {
    const broken = hosts(issued, answer);
    const r = await lib.handleSdm(tok({ email: EMAIL, consent: true }), NOTIFY_ENV, 'tokens', broken.fetchImpl);
    const b = await r.json();
    check(`notice: ${name}: the token is still issued`, r.status === 201 && b.token === 'sdm1_abc');
  }

  /* No key, and a refused request, send nothing. */
  const noKey = hosts(issued, mailed);
  await lib.handleSdm(tok({ email: EMAIL, consent: true }), { ...NOTIFY_ENV, RESEND_API_KEY: undefined }, 'tokens', noKey.fetchImpl);
  check('notice: without RESEND_API_KEY nothing is sent', noKey.seen.length === 1);
  const blank = hosts(issued, mailed);
  await lib.handleSdm(tok({ email: EMAIL, consent: true }), { ...NOTIFY_ENV, SDM_NOTIFY_TO: '  ' }, 'tokens', blank.fetchImpl);
  check('notice: an empty SDM_NOTIFY_TO sends nothing', blank.seen.length === 1);
  const refused = hosts(() => res(400, { error: 'invalid_request' }), mailed);
  await lib.handleSdm(tok({ email: EMAIL, consent: true }), NOTIFY_ENV, 'tokens', refused.fetchImpl);
  check('notice: a refused request is not mailed', refused.seen.length === 1);
  const invalid = hosts(issued, mailed);
  await lib.handleSdm(tok({ email: 'not-an-email', consent: true }), NOTIFY_ENV, 'tokens', invalid.fetchImpl);
  check('notice: a bad address reaches neither AWS nor Resend', invalid.seen.length === 0);
  /* Development mails nothing, so a local test of the form is silent. */
  const dev = hosts(issued, mailed);
  await lib.handleSdm(tok({ email: EMAIL, consent: true }), { ...NOTIFY_ENV, NODE_ENV: 'development' }, 'tokens', dev.fetchImpl);
  check('notice: development sends no mail', !dev.seen.some((c) => String(c.url).includes('api.resend.com')));
  console.error = quiet3;
}

/* 5b-iii. The activation notice (the user, 18 Nov 2026): opening a confirmation link is mailed to SDM_NOTIFY_TO too.
   The address is named only when AWS reports it, since the browser sends an opaque code and nothing else. */
{
  const CODE = 'abc123-XYZ_~.';
  const WHO = 'activated@example.org';
  const NOTIFY_ENV = { ...ENV, RESEND_API_KEY: 'resend-key-do-not-leak', SDM_NOTIFY_TO: 'dev@provigen.ai' };
  const act = () =>
    new Request('https://provigen.ai/api/sdm1/v1/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: 'sdm_preview=preview-token', 'x-real-ip': '203.0.113.9' },
      body: JSON.stringify({ code: CODE }),
    });
  const hosts = (awsAnswer, resendAnswer) => {
    const seen = [];
    return {
      seen,
      fetchImpl: async (url, init) => {
        seen.push({ url, init });
        const answer = String(url).includes('api.resend.com') ? resendAnswer : awsAnswer;
        if (answer === 'throw') throw new Error('network');
        return typeof answer === 'function' ? answer() : answer;
      },
    };
  };
  const mailed = () => res(200, { id: 'mail-1' });
  const quiet4 = console.error;
  console.error = () => {};

  /* AWS reports the address: the notice names it, and it still does not reach the browser. */
  const named = hosts(() => res(200, { token: 'sdm1_full', daily_limit: 50, total_limit: 500, email: WHO }), mailed);
  const r1 = await lib.handleSdm(act(), NOTIFY_ENV, 'activate', named.fetchImpl);
  const b1 = await r1.json();
  const mail1 = JSON.parse(named.seen.find((c) => String(c.url).includes('api.resend.com')).init.body);
  check('activation notice: the full token still answers 200', r1.status === 200 && b1.token === 'sdm1_full' && b1.tier === 'full');
  check('activation notice: names the address when AWS reports it', mail1.subject === `ProviGen · token activated · ${WHO}` && mail1.text.includes(`Address:   ${WHO}`), mail1.subject);
  check('activation notice: reports the limits', mail1.text.includes('Limits:    50 calls a day, 500 in total'));
  check('activation notice: never carries the token', !JSON.stringify(mail1).includes('sdm1_full'));
  check('activation notice: the address is not passed to the browser', !('email' in b1), JSON.stringify(b1));
  check('activation notice: goes to SDM_NOTIFY_TO', mail1.to.length === 1 && mail1.to[0] === 'dev@provigen.ai');

  /* AWS reports no address: the notice is still sent and says so rather than inventing one. */
  const unnamed = hosts(() => res(200, { token: 'sdm1_full', daily_limit: 50, total_limit: 500 }), mailed);
  const r2 = await lib.handleSdm(act(), NOTIFY_ENV, 'activate', unnamed.fetchImpl);
  const mail2 = JSON.parse(unnamed.seen.find((c) => String(c.url).includes('api.resend.com')).init.body);
  check('activation notice: without an address it is still sent', r2.status === 200 && mail2.subject === 'ProviGen · token activated');
  check('activation notice: says the address was not reported', mail2.text.includes('not reported by the API'));

  /* A junk value in the email field is not passed on as an address. */
  const junk = hosts(() => res(200, { token: 'sdm1_full', daily_limit: 50, total_limit: 500, email: 'not-an-address' }), mailed);
  await lib.handleSdm(act(), NOTIFY_ENV, 'activate', junk.fetchImpl);
  const mail3 = JSON.parse(junk.seen.find((c) => String(c.url).includes('api.resend.com')).init.body);
  check('activation notice: a malformed address is ignored', mail3.subject === 'ProviGen · token activated' && !mail3.text.includes('not-an-address'));

  /* A link that failed is not an activation. */
  const expired = hosts(() => res(410, { error: 'link_expired' }), mailed);
  const r4 = await lib.handleSdm(act(), NOTIFY_ENV, 'activate', expired.fetchImpl);
  check('activation notice: an expired link is not mailed', r4.status === 410 && expired.seen.length === 1);

  /* The visitor's token must not depend on the mail getting out. */
  const broken = hosts(() => res(200, { token: 'sdm1_full', daily_limit: 50, total_limit: 500, email: WHO }), 'throw');
  const r5 = await lib.handleSdm(act(), NOTIFY_ENV, 'activate', broken.fetchImpl);
  const b5 = await r5.json();
  check('activation notice: a failed send still activates', r5.status === 200 && b5.token === 'sdm1_full');
  console.error = quiet4;
}

// 5c. Activation (the user, 17 Nov 2026): POST /v1/activate, the code from the magic link's fragment.
{
  const CODE = 'abc123-XYZ_~.';
  const act = (body, { cookie = 'sdm_preview=preview-token', ip = '203.0.113.9' } = {}) =>
    new Request('https://provigen.ai/api/sdm1/v1/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...(ip ? { 'x-real-ip': ip } : {}) },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  /* A fresh Response per call: a body can be read only once, and this one is used by several checks. */
  const full = () => res(200, { token: 'sdm1_full', tier: 'full', daily_limit: 50, total_limit: 500, extra: 'not for the browser' });
  const ok = await call(act({ code: CODE }), ENV, full, 'activate');
  const sent = ok.seen[0];
  check('activate: forwards to SDM_API_BASE/v1/tokens/activate', sent?.url === 'https://aws.example/live/v1/tokens/activate' && sent?.init.method === 'POST', sent?.url);
  check('activate: secret as Bearer, visitor IP', sent?.init.headers.Authorization === `Bearer ${SECRET}` && sent?.init.headers['X-SDM-Client-IP'] === '203.0.113.9');
  check('activate: body is the code alone', JSON.parse(sent.init.body).code === CODE && Object.keys(JSON.parse(sent.init.body)).length === 1);
  check('activate: 200 passes the full token and its limits', ok.response.status === 200 && ok.body?.token === 'sdm1_full' && ok.body?.tier === 'full' && ok.body?.daily_limit === 50 && !('extra' in ok.body));
  const anon = await call(act({ code: CODE }, { cookie: null }), ENV, full, 'activate');
  check('activate: draft gate closed: 404, AWS not called', anon.response.status === 404 && anon.seen.length === 0);
  const killed = await call(act({ code: CODE }), { ...ENV, SDM_KILL_SWITCH: '1' }, full, 'activate');
  check('activate: kill switch: 503 paused, AWS not called', killed.response.status === 503 && killed.seen.length === 0);
  const open = await call(act({ code: CODE }, { cookie: null }), { ...ENV, SDM_MODEL_ROUTES: undefined, SDM_PUBLIC: '1' }, full, 'activate');
  check('activate: still served with the model routes closed', open.response.status === 200);
  const get = await call(new Request('https://provigen.ai/api/sdm1/v1/activate', { headers: { cookie: 'sdm_preview=preview-token' } }), ENV, full, 'activate');
  check('activate: GET is 405', get.response.status === 405 && get.seen.length === 0);
  for (const [name, body] of [['no code', {}], ['empty code', { code: '  ' }], ['odd characters', { code: 'a b/c' }], ['too long', { code: 'a'.repeat(257) }], ['not an object', '"x"']]) {
    const r = await call(act(body), ENV, full, 'activate');
    check(`activate: ${name}: 400, AWS not called`, r.response.status === 400 && r.body?.error === 'invalid_request' && r.seen.length === 0);
  }
  const quiet3 = console.error;
  console.error = () => {};
  const mapping = [
    ['410 link_expired', res(410, { error: 'link_expired', token: 'sdm1_should_not_pass' }), 410, 'link_expired'],
    ['404 link_expired', res(404, { error: 'link_expired' }), 410, 'link_expired'],
    ['400 passes as invalid_request', res(400, { error: 'invalid_request' }), 400, 'invalid_request'],
    ['429 rate_limited passes', res(429, { error: 'rate_limited', retry_after_s: 60 }), 429, 'rate_limited'],
    ['503 paused passes', res(503, { error: 'paused' }), 503, 'paused'],
    ['403 becomes 503', res(403, {}), 503, 'high_demand'],
    ['200 without an sdm1_ token becomes 503', res(200, { token: 'xyz' }), 503, 'high_demand'],
    ['network error becomes 503', 'throw', 503, 'high_demand'],
  ];
  for (const [name, answer, status, error] of mapping) {
    const r = await call(act({ code: CODE }), ENV, answer, 'activate');
    check(`activate: ${name}`, r.response.status === status && r.body?.error === error && !JSON.stringify(r.body).includes('sdm1_should_not_pass'), `${r.response.status} ${r.body?.error}`);
  }
  console.error = quiet3;
}

// 6. The generated Vercel Functions, end to end over real HTTP (a fake AWS on localhost).
{
  const { createServer } = await import('node:http');
  const { mkdtempSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { createRequire } = await import('node:module');
  const { writeSdmBuildOutput, writeSdmApiDir } = await import('./sdm-function.mjs');

  const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
  const seenByAws = [];
  const fakeAws = createServer(async (req, res) => {
    let body = '';
    for await (const c of req) body += c;
    seenByAws.push({ url: req.url, method: req.method, auth: req.headers.authorization, ip: req.headers['x-sdm-client-ip'], body });
    res.setHeader('Content-Type', 'application/json');
    if (req.url.endsWith('/v1/status')) return res.end(JSON.stringify({ state: 'ok' }));
    res.statusCode = 429;
    res.setHeader('Retry-After', '9');
    res.end(JSON.stringify({ error: 'rate_limited', message: 'slow down', retry_after_s: 9 }));
  });
  const awsPort = await listen(fakeAws);

  const dir = mkdtempSync(join(tmpdir(), 'sdm-fn-'));
  try {
    // SDM_MODEL_ROUTES: the built Functions serve propose and status only with it (proxy.ts step 1b, 17 Nov 2026).
    Object.assign(process.env, { SDM_API_BASE: `http://127.0.0.1:${awsPort}/live`, SDM_API_SECRET: SECRET, SDM_PREVIEW_TOKEN: 'preview-token', SDM_MODEL_ROUTES: '1' });
    writeSdmBuildOutput(join(dir, 'functions'));
    const require = createRequire(import.meta.url);
    const fn = (route) => require(join(dir, 'functions', 'api', 'sdm1', `${route}.func`, 'index.js'));
    const vc = require(join(dir, 'functions', 'api', 'sdm1', 'v1', 'propose.func', '.vc-config.json'));
    // check('Build Output: Node 22, maxDuration 40', vc.runtime === 'nodejs22.x' && vc.maxDuration === 40 && vc.launcherType === 'Nodejs');
    check('Build Output: Node 22, maxDuration 60', vc.runtime === 'nodejs22.x' && vc.maxDuration === 60 && vc.launcherType === 'Nodejs');

    const routes = { '/api/sdm1/v1/propose': fn('v1/propose'), '/api/sdm1/v1/status': fn('v1/status'), '/api/sdm1/preview': fn('preview') };
    const site = createServer((req, res) => {
      req.headers['x-real-ip'] = '192.0.2.44'; // as Vercel sets it
      const route = routes[new URL(req.url, 'http://x').pathname];
      return route ? route(req, res) : ((res.statusCode = 404), res.end());
    });
    const sitePort = await listen(site);
    const base = `http://127.0.0.1:${sitePort}`;

    const anon = await fetch(`${base}/api/sdm1/v1/propose`, { method: 'POST', body: JSON.stringify(GOOD) });
    check('Function: anonymous POST is 404 (draft gate)', anon.status === 404);
    const set = await fetch(`${base}/api/sdm1/preview?token=preview-token&next=/writings/introducing-model-name`, { redirect: 'manual' });
    const cookieHeader = (set.headers.get('set-cookie') ?? '').split(';')[0];
    check('Function: preview sets the cookie', set.status === 303 && cookieHeader === 'sdm_preview=preview-token');
    const r = await fetch(`${base}/api/sdm1/v1/propose`, { method: 'POST', headers: { cookie: cookieHeader, 'Content-Type': 'application/json' }, body: JSON.stringify(GOOD) });
    const rb = await r.json();
    const sent = seenByAws.at(-1);
    check('Function: forwards body, Bearer secret and visitor IP to AWS', sent?.url === '/live/v1/propose' && sent?.auth === `Bearer ${SECRET}` && sent?.ip === '192.0.2.44' && sent?.body === JSON.stringify(GOOD));
    check('Function: AWS 429 rate_limited reaches the page with Retry-After', r.status === 429 && rb.error === 'rate_limited' && r.headers.get('retry-after') === '9');
    const st = await fetch(`${base}/api/sdm1/v1/status`, { headers: { cookie: cookieHeader } });
    check('Function: status passes through', st.status === 200 && (await st.json()).state === 'ok');
    site.close();

    // The CLI deploy's ES-module Functions.
    writeSdmApiDir(join(dir, 'api'));
    const { writeFileSync } = await import('node:fs');
    writeFileSync(join(dir, 'api', 'package.json'), '{"type":"module"}');
    const cli = await import(join(dir, 'api', 'sdm1', 'v1', 'propose.js'));
    const cr = await cli.POST(new Request('https://provigen.ai/api/sdm1/v1/propose', { method: 'POST', headers: { cookie: cookieHeader, 'x-real-ip': '192.0.2.45' }, body: JSON.stringify(GOOD) }));
    check('CLI Function: forwards and maps like the Build Output one', cr.status === 429 && seenByAws.at(-1)?.ip === '192.0.2.45');
  } finally {
    fakeAws.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
